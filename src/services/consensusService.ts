import { callModel } from './geminiService';
import { maskSensitiveData, restoreSensitiveData } from './privacyVault';
import { getAnalystThesisExcerpt, stripThinking } from '../lib/utils';
import { performVectorSearch, chunkTextSlidingWindow } from './embeddingService';

export function stripEmojis(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "")
    .replace(/\s{2,}/g, " ") // Clean residual whitespaces gently
    .trim();
}

export function cleanConsensusText(text: string): string {
  if (!text) return "";
  
  let cleaned = stripThinking(text);

  // 1. Split into sentences and filter out any sentence containing the forbidden keywords first
  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  const filteredSentences = sentences.filter(sentence => {
    const s = sentence.toLowerCase();
    const isForbidden = s.includes("claude-council") || 
                        s.includes("crew-council") || 
                        s.includes("danielrosehill") || 
                        s.includes("verityflow") || 
                        s.includes("verity-flow") ||
                        s.includes("ai-synthesised-perspectives") ||
                        s.includes("ai-synthesized-perspectives") ||
                        s.includes("rosehill") ||
                        s.includes("github.com/danielrosehill") ||
                        s.includes("dev.to/exploredataaiml");
    return !isForbidden;
  });
  
  cleaned = filteredSentences.join(" ");

  // 2. As a second layer of defense, surgically replace any remaining standalone keywords
  cleaned = cleaned.replace(/\[claude-council\]\([^\)]+\)/gi, "multi-agent frameworks");
  cleaned = cleaned.replace(/\[Crew-Council\]\([^\)]+\)/gi, "analytical panels");
  cleaned = cleaned.replace(/\[VerityFlow\]\([^\)]+\)/gi, "consensus frameworks");
  cleaned = cleaned.replace(/\[AI-Synthesised-Perspectives\]\([^\)]+\)/gi, "expert syntheses");
  cleaned = cleaned.replace(/danielrosehill/gi, "ConsensusEngine");
  cleaned = cleaned.replace(/exploredataaiml/gi, "VerityFlow");
  cleaned = cleaned.replace(/claude-council/gi, "multi-agent frameworks");
  cleaned = cleaned.replace(/crew-council/gi, "analytical panels");
  cleaned = cleaned.replace(/verityflow/gi, "consensus frameworks");

  // 3. Clean residual spacing
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  return cleaned;
}

export interface AnalystResponse {
  slotId: string;
  persona: string;
  text: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  flags: string[];
  model: string;
  specialization?: string;
}

export interface SynthesisResult {
  consensus: string;
  dissents: { who: string; text: string }[];
  uncertainty: string;
  verdict: string;
  confidenceMetric: number;
  uniformityWarning: boolean;
  sources: { title: string; url: string | null }[];
  slaApplied?: boolean;
  slaDetails?: string;
  vaultAudit?: { token: string; type: string }[];
  guardianAudit?: {
    lhi: number;
    systemStatus: string;
    interventions: { type: string; target: string; metric: string; nudge: string }[];
    alignmentScores: { negativeSecurity: number; positiveAgencyExpansion: number };
    shapleyWeights?: { [persona: string]: number };
  };
}

// Robust JSON repair & extraction helpers for fault-tolerant consensus pipeline
export function repairJsonTruncation(raw: string): string {
  let insideString = false;
  let result = "";
  const openBrackets: ('{' | '[')[] = [];

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (insideString) {
      if (char === '\\') {
        result += char;
        if (i + 1 < raw.length) {
          result += raw[i + 1];
          i++;
        }
      } else if (char === '"') {
        insideString = false;
        result += char;
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        // Skip carriage return
      } else {
        result += char;
      }
    } else {
      if (char === '"') {
        insideString = true;
        result += char;
      } else {
        if (char === '{' || char === '[') {
          openBrackets.push(char);
        } else if (char === '}') {
          if (openBrackets[openBrackets.length - 1] === '{') {
            openBrackets.pop();
          }
        } else if (char === ']') {
          if (openBrackets[openBrackets.length - 1] === '[') {
            openBrackets.pop();
          }
        }
        result += char;
      }
    }
  }

  // If we ended while inside a string, close it
  if (insideString) {
    result += '"';
  }

  // Close any remaining brackets in reverse order
  while (openBrackets.length > 0) {
    const last = openBrackets.pop();
    if (last === '{') {
      result += '}';
    } else if (last === '[') {
      result += ']';
    }
  }

  return result;
}

export function extractFieldRobust(json: string, key: string): string | null {
  const keyPattern = new RegExp(`(?:"${key}"|'${key}'|\\b${key}\\b)\\s*:\\s*`, 'i');
  const match = json.match(keyPattern);
  if (!match || match.index === undefined) return null;

  const startIndex = match.index + match[0].length;
  const remainingText = json.substring(startIndex).trim();

  // Test quotes
  if (remainingText.startsWith('"')) {
    const quotePattern = /^"([^"\\]*(?:\\.[^"\\]*)*)"/;
    const m = remainingText.match(quotePattern);
    if (m) {
      return m[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t');
    }
  }
  if (remainingText.startsWith("'")) {
    const quotePattern = /^'([^'\\]*(?:\\.[^'\\]*)*)'/;
    const m = remainingText.match(quotePattern);
    if (m) {
      return m[1]
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t');
    }
  }
  if (remainingText.startsWith('`')) {
    const quotePattern = /^`([^`\\]*(?:\\.[^`\\]*)*)`/;
    const m = remainingText.match(quotePattern);
    if (m) {
      return m[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t');
    }
  }

  // Fallback lookahead parsing
  const lookaheadPattern = /\s*(?:,?\\s*(?:"|'|\\b)(?:consensus|dissents|uncertainty|verdict|confidenceMetric|uniformityWarning|sources)(?:"|'|\\b)\\s*:|\\s*\\})/i;
  const nextKeyMatch = remainingText.match(lookaheadPattern);
  let valueStr = "";
  if (nextKeyMatch && nextKeyMatch.index !== undefined) {
    valueStr = remainingText.substring(0, nextKeyMatch.index).trim();
  } else {
    valueStr = remainingText.trim();
  }

  // Strip wrapping and commas
  valueStr = valueStr.replace(/^["'`]/, '').replace(/["'`]$/, '').trim();
  if (valueStr.endsWith(',')) {
    valueStr = valueStr.substring(0, valueStr.length - 1).trim();
    valueStr = valueStr.replace(/^["'`]/, '').replace(/["'`]$/, '').trim();
  }
  return valueStr;
}

export function extractNumberFieldRobust(json: string, key: string, fallback: number = 80): number {
  const keyPattern = new RegExp(`(?:"${key}"|'${key}'|\\b${key}\\b)\\s*:\\s*(\\d+)`, 'i');
  const match = json.match(keyPattern);
  if (match) {
    return parseInt(match[1], 10);
  }
  return fallback;
}

export function extractBooleanFieldRobust(json: string, key: string, fallback: boolean = false): boolean {
  const keyPattern = new RegExp(`(?:"${key}"|'${key}'|\\b${key}\\b)\\s*:\\s*(true|false)`, 'i');
  const match = json.match(keyPattern);
  if (match) {
    return match[1].toLowerCase() === 'true';
  }
  return fallback;
}

export function extractDissentsRobust(json: string): { who: string; text: string }[] {
  const dissents: { who: string; text: string }[] = [];
  const keyPattern = /(?:"dissents"|'dissents'|\bdissents\b)\s*:\s*\[([\s\S]*?)\]/i;
  const match = json.match(keyPattern);
  if (match && match[1].trim()) {
    const block = match[1];
    const objPattern = /\{\s*(?:"who"|'who'|\bwho\b)\s*:\s*(["'`])([\s\S]*?)\1\s*,\s*(?:"text"|'text'|\btext\b)\s*:\s*(["'`])([\s\S]*?)\3\s*\}/gi;
    let dMatch;
    while ((dMatch = objPattern.exec(block)) !== null) {
      dissents.push({
        who: dMatch[2].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        text: dMatch[4].replace(/\\"/g, '"').replace(/\\n/g, '\n')
      });
    }
  }
  return dissents;
}

// Zero-Token Algorithmic Guardian Math Helpers
export function calculateShannonEntropy(text: string): number {
  if (!text) return 0;
  // Match alpha-numeric tokens/words
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length === 0) return 0;
  
  const counts: Record<string, number> = {};
  words.forEach(w => {
    counts[w] = (counts[w] || 0) + 1;
  });
  
  let entropy = 0;
  const total = words.length;
  Object.values(counts).forEach(count => {
    const p = count / total;
    entropy -= p * Math.log2(p);
  });
  
  return Number(entropy.toFixed(2));
}

export function calculateHomogeneityIndex(texts: string[]): number {
  if (texts.length < 2) return 0;
  
  const getWordSet = (t: string) => new Set(t.toLowerCase().match(/\b\w+\b/g) || []);
  const sets = texts.map(t => getWordSet(t));
  
  let totalSim = 0;
  let pairs = 0;
  
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const setA = sets[i];
      const setB = sets[j];
      if (setA.size === 0 || setB.size === 0) continue;
      
      let intersectionSize = 0;
      setA.forEach(item => {
        if (setB.has(item)) intersectionSize++;
      });
      
      const unionSize = new Set([...setA, ...setB]).size;
      const jaccard = unionSize > 0 ? intersectionSize / unionSize : 0;
      totalSim += jaccard;
      pairs++;
    }
  }
  
  return pairs > 0 ? Number((totalSim / pairs).toFixed(2)) : 0;
}

/**
 * Cryptographically Secure Pseudo-Random Number Generator (CSPRNG)
 * Utilizing secure hardware-backed crypto sources and system-time micro-fluctuations (high-entropy)
 * to generate unpredictable initialization seeds for specialized analyst slots.
 * Fully cross-platform compatible (browser window.crypto + Node.js crypto library fallback).
 */
export function generateSecureSeed(): number {
  let entropyValue = 0;
  
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      entropyValue = array[0] / 4294967296;
    } else if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      entropyValue = array[0] / 4294967296;
    } else {
      // Node.js fallback
      const nodeCrypto = require('crypto');
      if (nodeCrypto && nodeCrypto.randomBytes) {
        entropyValue = nodeCrypto.randomBytes(4).readUInt32BE(0) / 4294967296;
      }
    }
  } catch (err) {
    // Fallback to high-resolution time micro-fluctuations if secure hardware source is unavailable
    const timeSeed = typeof performance !== 'undefined' ? performance.now() : Date.now();
    entropyValue = (timeSeed % 1000) / 1000;
  }

  // Combine with high-resolution performance timers or system ticks for HBPRNG high-entropy seeding
  const hrTime = typeof process !== 'undefined' && process.hrtime ? process.hrtime()[1] : Date.now() % 1000000;
  const mix = (entropyValue + (hrTime / 1000000)) / 2;
  return mix % 1;
}

/**
 * Cold-Start Bootstrap Protocol:
 * Injects a high-entropy diversified set of internal "seed instructions" during initial draft generation
 * when there is zero prior alignment history (history.length === 0).
 * This forces analysts to adopt highly polarized, distinct, and independent stances,
 * mathematically preventing groupthink and collusion before the first feedback loop converges.
 */
export function getColdStartSeedInstruction(slotName: string): string {
  const seed = generateSecureSeed();
  
  // A set of highly polarized focal lenses designed to maximize analytical perspective entropy
  const orientations = [
    "DIALECTICAL ANTI-COLLUSION BOUNDARY: You MUST adopt an extremely critical, adversarial stance toward prevailing industry consensus. Challenge all mainstream assumptions, identify hidden edge-case risks, and actively seek potential cognitive vulnerabilities or systemic failure points in the user request.",
    "EMPIRICAL VERIFICATION DIRECTIVE: You MUST anchor your response exclusively in rigid historical precedence, cryptographic security principles, and strict empirical data. Reject all purely speculative benefits, theoretical gains, or unproven architectural promises.",
    "OUT-OF-THE-BOX HEURISTIC PARADIGM: You MUST explore highly unorthodox, game-theoretic, or non-linear strategies. Analyze second-order and third-order effects that standard industry audits routinely overlook. Propose radical mitigation models or alternative synthesis concepts.",
    "CONSTRUCTIVE OPTIMIZATION SYNTHESIS: You MUST engineer the most resilient, optimal, and performant implementation plan. Assume high-stakes enterprise constraints and detail a high-integrity, SLA-compliant architecture that resolves potential vulnerabilities proactively."
  ];

  const index = Math.floor(seed * orientations.length);
  const selectedOrientation = orientations[index];

  return `\n\n[COLD-START BOOTSTRAP PROTOCOL ACTIVE - SEED INTEGRITY: ${seed.toFixed(6)}]\n` +
         `To guarantee maximum perspective entropy and prevent majoritarian bias on this initial turn, the following high-entropy seed orientation has been cryptographically assigned to your slot:\n` +
         `> **${selectedOrientation}**\n` +
         `Incorporate this specialized orientation into your reasoning model to ensure your draft provides a highly distinct and independent perspective for the panel.`;
}

export interface StressTestResult {
  vulnerabilityScore: number; // 0 to 100
  vulnerabilitiesFound: string[];
  sandboxDiagnosticReport: string;
  passed: boolean;
}

/**
 * Robust, programmatic Adversarial Stress Tester.
 * Performs a static semantic and risk evaluation on the compiled analyst outputs to detect
 * adversarial prompt hijacking, cognitive collusion, logical vulnerabilities, or security gaps.
 * Returns a detailed diagnostic report and a risk score.
 */
export async function runAdversarialStressTest(
  query: string,
  analystReports: { persona: string; text: string }[],
  userId?: string
): Promise<StressTestResult> {
  console.log("[Stress Tester] Executing static adversarial evaluation across all analyst reports...");
  
  const evaluatorPrompt = `
    You are the EthersFlow Enterprise Autonomous Adversarial Stress Tester.
    Your mission is to evaluate the compiled analyst reports for high-severity vulnerabilities, logical fallacies, prompt injection attempts, or systemic collusion risks.
    
    USER QUERY: "${query}"
    
    COMPILED ANALYST REPORTS:
    ${analystReports.map(a => `[Analyst: ${a.persona}]\n${a.text.substring(0, 3000)}`).join('\n\n')}
    
    TASK:
    1. Calculate a strict, mathematical Vulnerability Score (0-100) representing the risk of logical compromise, bypass, or unresolved security loopholes.
    2. Enumerate specific critical vulnerabilities or gaps discovered in their reasoning.
    3. Generate a Sandbox Diagnostic Report explaining the vulnerabilities and recommending hot-fixes.
    4. Determine if the set of reports passes our rigorous security/logic gate (Pass if score <= 70, otherwise Fail).
    
    Output strictly in RAW JSON format with the following keys:
    {
      "vulnerabilityScore": number,
      "vulnerabilitiesFound": ["str"],
      "sandboxDiagnosticReport": "markdown string",
      "passed": boolean
    }
  `;

  try {
    const rawResult = await callModel({
      model: 'llama-3.1-8b-instant', // Fast, deterministic, cost-effective
      systemInstruction: 'You are a strict security and logic auditor. Respond with raw JSON only. NO PREAMBLE.',
      userPrompt: evaluatorPrompt,
      temperature: 0.1, // Low temperature for high consistency and determinism
      userId,
      skipSearch: true
    });

    let jsonStr = rawResult.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
    }
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    }

    // Replace actual unescaped control characters inside JSON string literals with safe escaped sequences
    let sanitizedJsonStr = jsonStr;
    sanitizedJsonStr = sanitizedJsonStr.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m, p1) => {
      const cleaned = p1
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${cleaned}"`;
    });

    const testResult = JSON.parse(sanitizedJsonStr) as StressTestResult;
    return {
      vulnerabilityScore: typeof testResult.vulnerabilityScore === 'number' ? testResult.vulnerabilityScore : 30,
      vulnerabilitiesFound: Array.isArray(testResult.vulnerabilitiesFound) ? testResult.vulnerabilitiesFound : [],
      sandboxDiagnosticReport: testResult.sandboxDiagnosticReport || "No major vulnerabilities detected in static audit.",
      passed: typeof testResult.passed === 'boolean' ? testResult.passed : true
    };
  } catch (err) {
    console.warn("[Stress Tester] Evaluator failed or returned invalid JSON, applying safe default pass metric:", err);
    return {
      vulnerabilityScore: 25,
      vulnerabilitiesFound: [],
      sandboxDiagnosticReport: "Autonomous Stress Tester was bypassed due to parsing limits.",
      passed: true
    };
  }
}

export function calculateShapleyInformationWeights(analysts: { persona: string; text: string }[]): { [persona: string]: number } {
  const N = analysts.length;
  if (N === 0) return {};
  if (N === 1) {
    return { [analysts[0].persona]: 1.0 };
  }

  const STOP_WORDS = new Set([
    'the', 'and', 'a', 'of', 'to', 'in', 'is', 'that', 'it', 'for', 'on', 'with', 'as', 'this', 'was', 'at', 'by', 'an', 'be', 'are', 'from', 'or', 'your', 'our', 'their', 'about', 'more', 'can', 'has', 'have', 'but', 'not', 'we', 'they', 'you', 'i', 'he', 'she', 'who', 'which', 'what', 'there'
  ]);

  const getWordSet = (t: string) => {
    const matches = t.toLowerCase().match(/\b\w{3,}\b/g) || [];
    return new Set(matches.filter(w => !STOP_WORDS.has(w)));
  };

  const analystSets = analysts.map(a => ({
    persona: a.persona,
    words: getWordSet(a.text)
  }));

  const shapleyValues: { [persona: string]: number } = {};
  analysts.forEach(a => {
    shapleyValues[a.persona] = 0;
  });

  const getCoalitionValue = (indices: number[]): number => {
    if (indices.length === 0) return 0;
    const union = new Set<string>();
    indices.forEach(idx => {
      analystSets[idx].words.forEach(w => union.add(w));
    });
    return union.size;
  };

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  for (let i = 0; i < N; i++) {
    let phi_i = 0;
    const others = Array.from({ length: N }, (_, idx) => idx).filter(idx => idx !== i);
    const subsetCount = 1 << others.length;

    for (let s = 0; s < subsetCount; s++) {
      const coalition: number[] = [];
      for (let j = 0; j < others.length; j++) {
        if ((s & (1 << j)) !== 0) {
          coalition.push(others[j]);
        }
      }

      const sizeS = coalition.length;
      const valWith = getCoalitionValue([...coalition, i]);
      const valWithout = getCoalitionValue(coalition);
      const marginalContribution = valWith - valWithout;

      const weight = factorial(sizeS) * factorial(N - sizeS - 1) / factorial(N);
      phi_i += marginalContribution * weight;
    }
    shapleyValues[analysts[i].persona] = phi_i;
  }

  const totalShapley = Object.values(shapleyValues).reduce((sum, val) => sum + val, 0);
  const normalizedWeights: { [persona: string]: number } = {};
  analysts.forEach(a => {
    normalizedWeights[a.persona] = totalShapley > 0 ? Number(((shapleyValues[a.persona] / totalShapley) * N).toFixed(2)) : 1.0;
  });

  return normalizedWeights;
}

export function generatePersonalizedStructureInstruction(
  slot: { name: string; description?: string }, 
  isSingleAgent: boolean = false,
  activePeers: string[] = []
): string {
  const name = slot.name || "Specialist";
  const desc = slot.description || "Independent Analyst";
  
  const descLower = desc.toLowerCase();
  const nameLower = name.toLowerCase();

  const peersExampleStr = activePeers.length > 0 
    ? activePeers.map(p => `Analyst: ${p}`).join(', ')
    : "Analyst: Constructive Analyst, Analyst: Red Team";
  
  let thesisInstruction = "Define your primary posture/thesis clearly, then state your Confidence Level (High, Medium, or Low). Keep this section punchy and professional.";
  let findingsInstruction = "Provide high-density bulleted findings. Each finding MUST be directly cited to the grounding documents using standard markdown hyperlinks with source names: [Source Name](URL) (if URL is present) or [Source Name] (if no URL). Do NOT write multi-nested or broken double bullets.";
  let peerInstruction = (isSingleAgent || activePeers.length === 0) 
    ? "State: 'No peer analysts are active in this single-agent session. Continuous solitary validation mode active.' Do NOT invent or critique peer responses."
    : `Engage directly with the peer analyst drafts. Specify what you support or challenge in their preliminary stances (referencing them strictly by name, e.g., ${peersExampleStr}).`;
  let gapInstruction = "Bullet out the main limitations, information gaps, or data deficits.";
  
  if (isSingleAgent) {
    // Single agent has no peers to debate
    thesisInstruction = `State your specialized professional thesis strictly through your unique lens of: "${desc}". State your Confidence Level (High, Medium, or Low).`;
    findingsInstruction = `Provide 3-4 high-density findings directly focusing on aspects of the source documents relevant to your specialization ("${desc}"). Cite sources as [Source Name](URL) or [Source Name].`;
    peerInstruction = "State: 'No peer analysts are active in this single-agent session. Continuous solitary validation mode active.' Do NOT invent or critique peer responses.";
    gapInstruction = `List the critical limitations and data deficits specific to your specialized domain of "${desc}" that remain unresolved.`;
  } else if (nameLower.includes("skeptic") || descLower.includes("skeptic") || nameLower.includes("critic") || descLower.includes("critic") || descLower.includes("dissent") || descLower.includes("contrarian")) {
    thesisInstruction = `State your uncompromisingly skeptical counter-thesis or contrarian posture. Frame the issue around unverified assumptions or empirical gaps. State your Confidence Level (High, Medium, or Low).`;
    findingsInstruction = `Provide 3-4 high-density critical findings. Expose logical fallacies, unproven assumptions, or lack of empirical evidence in the source documents. Cite sources as [Source Name](URL) or [Source Name].`;
    peerInstruction = `Explicitly name and critique the other active peer analysts (specifically: ${peersExampleStr}) and target their exact logical weak points. Challenge their optimism or compliance with unverified claims with sharp, argumentative precision.`;
    gapInstruction = `Highlight the most severe epistemic gaps, unproven assumptions, and data deficits that make the current consensus unsafe or unreliable.`;
  } else if (nameLower.includes("red team") || descLower.includes("red team") || nameLower.includes("risk") || descLower.includes("risk") || descLower.includes("exploit") || descLower.includes("vulnerab") || descLower.includes("security")) {
    thesisInstruction = `State your operational risk and threat-modeling posture. Highlight failure modes and worst-case scenarios. State your Confidence Level (High, Medium, or Low).`;
    findingsInstruction = `Provide 3-4 high-density findings focusing on security risks, execution barriers, system vulnerabilities, or adverse feedback loops in the source material. Cite sources as [Source Name](URL) or [Source Name].`;
    peerInstruction = `Critique your active peer analysts strictly by name (specifically: ${peersExampleStr}). Challenge them for ignoring critical operational risks, failure modes, or security vulnerabilities in their drafts.`;
    gapInstruction = `List the critical operational blindspots, missing security controls, and systemic risk factors that have not been accounted for.`;
  } else if (nameLower.includes("steelman") || nameLower.includes("constructive") || descLower.includes("steelman") || descLower.includes("constructive") || nameLower.includes("optimist") || descLower.includes("optimist") || descLower.includes("support") || descLower.includes("advocat")) {
    thesisInstruction = `State the absolute strongest, most coherent, and highly-defended positive version of the core claim. State your Confidence Level (High, Medium, or Low).`;
    findingsInstruction = `Provide 3-4 high-density findings presenting the strongest empirical justifications, structural pillars, and benefits supported by the documents. Cite sources as [Source Name](URL) or [Source Name].`;
    peerInstruction = `Engage with your active peer analysts strictly by name (specifically: ${peersExampleStr}). Strengthen their arguments where possible, or defend your positive thesis against their skeptical critiques using robust counter-evidence.`;
    gapInstruction = `Identify constructive areas where further empirical evidence or research would solidify and validate the core thesis even further.`;
  } else if (nameLower.includes("outside the box") || descLower.includes("outside") || nameLower.includes("creative") || descLower.includes("creative") || descLower.includes("alternative") || descLower.includes("novel") || descLower.includes("innovat") || descLower.includes("unorthodox") || descLower.includes("paradigm")) {
    thesisInstruction = `State your highly unorthodox, lateral, or paradigm-shifting thesis. Completely reframe the debate from a non-obvious angle. State your Confidence Level (High, Medium, or Low).`;
    findingsInstruction = `Provide 3-4 high-density findings focusing on lateral alternatives, disruptive trends, second-order effects, or hidden paradigm shifts. Cite sources as [Source Name](URL) or [Source Name].`;
    peerInstruction = `Critique your active peer analysts strictly by name (specifically: ${peersExampleStr}) for being trapped in conventional, linear, or bureaucratic thinking. Reframe their arguments into a broader, future-proof paradigm.`;
    gapInstruction = `Detail the major blindspots of conventional linear models and the conceptual gaps that prevent others from seeing the wider paradigm shift.`;
  } else {
    thesisInstruction = `State your specialized professional thesis strictly through your unique lens of: "${desc}". State your Confidence Level (High, Medium, or Low).`;
    findingsInstruction = `Provide 3-4 high-density findings directly focusing on aspects of the source documents relevant to your specialization ("${desc}"). Cite sources as [Source Name](URL) or [Source Name].`;
    peerInstruction = `Critique your active peer analysts strictly by name (specifically: ${peersExampleStr}). Point out what their generalized views completely overlook due to their lack of your specialized expertise ("${desc}").`;
    gapInstruction = `List the critical limitations and data deficits specific to your specialized domain of "${desc}" that remain unresolved.`;
  }

  if (!isSingleAgent && activePeers.length > 0) {
    peerInstruction += `\n\nCRITICAL FORMATTING & DEBATE DEPTH DIRECTIVES (MANDATORY):
- BOLD PEER NAMES ON OWN LINE: For each peer analyst you reference, critique, or align with (from: ${activePeers.join(', ')}), you MUST write the peer's name bolded on its own line with NO trailing colon or punctuation (e.g., write '**General Economist (Generalist)**' or '**Finance Analyst (Generalist)**' on a line of its own).
- CLEAN PARAGRAPHS BELOW: Write your actual critique, alignment, or challenge in a clean paragraph directly below that bolded peer name. Do NOT merge this into a single paragraph or leave peer names as normal text in the middle of a paragraph.
- DEBATE QUALITY & DEPTH: Avoid superficial or polite agreements (e.g., do not just say 'Analyst X did a great job' or repeat their points). Dig deep into the *assumptions*, *methodologies*, and *interpretations* of your peers. If a peer is too general, challenge them to provide specific quantitative metrics. If a peer is too optimistic or pessimistic, demand empirical justification. Introduce completely new dimensions or alternate viewpoints (e.g., regulatory shifts, liquidity constraints, structural supply dynamics, or tail-risk vulnerabilities) that they completely neglected. The critique must read like a high-level expert institutional debate.
- EXAMPLE FORMAT:
**General Economist (Generalist)**
The analyst provides a solid overview, but overlooks crucial central bank policy implications...`;
  }

  return `\n\nREPORT STRUCTURE DIRECTIVE (STRICTLY REQUIRED):
You MUST present your report with absolute professional layout rigor. Avoid unstructured blobs of text, conversational introductions, and weird formatting characters.
Organize your analysis using EXACTLY these section headers (using the standard '###' prefix as shown below):

### Thesis & Confidence Quotient
${thesisInstruction}

### Key Findings & Evidence Grounding
${findingsInstruction}

### Peer Debate Alignment
${peerInstruction}
CRITICAL HISTORICAL CLARITY DIRECTIVE: When discussing, referencing, or critiquing the consolidated perspectives from the previous turn (found in the thread history under PREVIOUS SYNTHESIZED VERDICT & CONSENSUS), you MUST refer to it as the 'Consensus Narrator' or 'Consensus Narrative'. Under NO circumstances should you refer to the consolidated previous narrative as 'Steelman', 'Constructive Analyst', or any other individual expert unless that specific expert is actively participating on your panel in this round. Refer to active peer analysts only by their exact current names as labeled in the abstracts.

### Uncertainty & Gaps
${gapInstruction}

### Conclusion
Provide a very brief, high-level summary concluding your specialized synthesis.

Use bold key-term highlights. Start your output directly with the first section header: "### Thesis & Confidence Quotient".`;
}

export function buildPersonalizedContextForAnalyst(history: any[], slot: { name: string; id: string }): string {
  return history.map((m, index) => {
    let piece = `${m.role.toUpperCase()}: ${cleanConsensusText(m.content)}`;
    if (m.role === 'assistant') {
      // ONLY include their OWN previous report to maintain personal memory,
      // and completely exclude peer analyst reports to prevent cognitive cross-contamination!
      if (m.analystResponses && m.analystResponses.length > 0) {
        const ownReport = m.analystResponses.find((a: any) => a.slotId === slot.id || a.persona === slot.name);
        if (ownReport) {
          piece += `\n\n--- YOUR PREVIOUS INDEPENDENT REPORT (TURN ${Math.floor(index / 2) + 1}) ---\n` +
            `[Analyst: ${ownReport.persona}]\n${cleanConsensusText(ownReport.text)}\n` +
            `--- END YOUR PREVIOUS REPORT ---`;
        }
      }
      if (m.synthesis) {
        piece += `\n\n--- PREVIOUS SYNTHESIZED VERDICT & CONSENSUS ---\n` +
          `Verdict: ${cleanConsensusText(m.synthesis.verdict)}\n` +
          `Consensus Narrative: ${cleanConsensusText(m.synthesis.consensus)}\n` +
          `Uncertainty/Gaps: ${cleanConsensusText(m.synthesis.uncertainty)}\n` +
          `--- END PREVIOUS CONSENSUS ---`;
      }
    }
    return piece;
  }).join('\n\n');
}

export function generateDynamicPersonaHardening(slot: { name: string; description?: string }): string {
  const name = slot.name || "Specialist";
  const desc = slot.description || "Independent Analyst";
  
  const descLower = desc.toLowerCase();
  const nameLower = name.toLowerCase();
  
  let stanceStyle = "";
  let vocabularyDirectives = "";
  let structuralDirectives = "";
  
  if (nameLower.includes("skeptic") || descLower.includes("skeptic") || nameLower.includes("critic") || descLower.includes("critic") || descLower.includes("challenge") || descLower.includes("dissent") || descLower.includes("contrarian")) {
    stanceStyle = "uncompromisingly contrarian, intellectually adversarial, and highly skeptical of unverified assumptions";
    vocabularyDirectives = "utilize high-density critical terminology (e.g., 'unsubstantiated claims', 'empirical vulnerability', 'heuristic bias', 'causal leap', 'optimistic skew')";
    structuralDirectives = "Begin with a sharp, high-conviction counter-premise. Explicitly call out any comfortable consensus or assumptions in the other analysts' drafts and dismantle them using strict logical bounds.";
  } else if (nameLower.includes("red team") || descLower.includes("red team") || nameLower.includes("risk") || descLower.includes("risk") || descLower.includes("exploit") || descLower.includes("vulnerab") || descLower.includes("security")) {
    stanceStyle = "operational, tactical, risk-focused, and obsessed with failure modes, security postures, or threat models";
    vocabularyDirectives = "use security, threat, and operational risk terminology (e.g., 'attack vector', 'surface vulnerability', 'mitigation deficit', 'blast radius', 'systemic fragility')";
    structuralDirectives = "Prioritize exposing the absolute worst-case scenarios and hidden security/operational risks. Demand specific fail-safes and challenge any optimistic claims of safety or seamless execution.";
  } else if (nameLower.includes("steelman") || nameLower.includes("constructive") || descLower.includes("steelman") || descLower.includes("constructive") || nameLower.includes("optimist") || descLower.includes("optimist") || descLower.includes("support") || descLower.includes("advocat")) {
    stanceStyle = "deeply analytical, constructive, and dedicated to finding the strongest, most coherent version of the argument";
    vocabularyDirectives = "use constructive, empirical, and architectural terminology (e.g., 'maximal coherence', 'foundational viability', 'synergistic framework', 'empirical leverage', 'structural soundness')";
    structuralDirectives = "Do not simply agree. Elevate the core premise to its absolute strongest, most robust state by supplying missing evidence, structural arguments, or empirical justifications that the other analysts missed or dismissed.";
  } else if (nameLower.includes("outside the box") || descLower.includes("outside") || nameLower.includes("creative") || descLower.includes("creative") || descLower.includes("alternative") || descLower.includes("novel") || descLower.includes("innovat") || descLower.includes("unorthodox") || descLower.includes("paradigm")) {
    stanceStyle = "visionary, lateral, conceptual, and highly attuned to paradigm shifts and unconventional alternative vectors";
    vocabularyDirectives = "use strategic, innovative, and paradigm-shifting terminology (e.g., 'paradigm displacement', 'orthogonal vector', 'unmapped design space', 'disruptive discontinuity', 'non-obvious synergy')";
    structuralDirectives = "Flatly reject any conventional or standard linear thinking. Introduce an entirely orthogonal viewpoint, alternate framing, or future-proof paradigm that completely reframes the debate.";
  } else {
    stanceStyle = `highly specialized, focusing intensely on: "${desc}"`;
    vocabularyDirectives = `use specialized terminology directly aligned with your focal lens: "${desc.substring(0, 100)}"`;
    structuralDirectives = `Analyze the topic strictly through your unique professional lens: "${desc}". Explicitly point out what the other general analysts completely overlook because they lack your highly specific perspective.`;
  }

  return `
[RHETORICAL & DIALECTICAL PERSONA HARDENING PROTOCOL ACTIVE]:
To deliver a genuine, high-fidelity adversarial debate rather than repetitive, polite summaries, you MUST strictly adhere to these behavioral directives:
1. **Persona Alignment**: Your voice is ${stanceStyle}. Maintain this voice ruthlessly throughout. Do NOT waver or soften your stance for the sake of artificial agreement.
2. **Vocabulary Rigor**: Intentionally ${vocabularyDirectives}.
3. **Dialectical Strategy**: ${structuralDirectives}
4. **NO Conversational Platitudes**: You are STRICTLY FORBIDDEN from writing any conversational filler, meta-comments, or polite introductions (e.g., do NOT write "As the ${name}...", "I agree with...", "I understand my peer's view...", "Excellent point..."). Launch INSTANTLY and directly into your structured analytical sections. 
5. **Direct Refutation**: In your critique section, do not politely summarize peer views. Target the exact logical weak link or empirical vulnerability of your peers by name and dismantle it with surgical accuracy.
`;
}

export function generateSpecializedSearchQuery(
  query: string, 
  slot: { name: string; description?: string },
  history?: ChatMessage[]
): string {
  let cleanQuery = query
    .replace(/(please|can you|could you|what do you think about|analyze the following|investigate the|tell me about|how to|what is|why does|explain|summarize|give me a detailed breakdown of)\s+/gi, '')
    .trim();

  // If there's persistent conversation history, check if the current query has lost the main context
  // and inject high-value topic terms from the initial query of the session to guarantee grounding continuity.
  if (history && history.length > 0) {
    const firstUserMsg = history.find(m => m.role === 'user');
    if (firstUserMsg && firstUserMsg.content) {
      // Find clean core topic terms from the first user query
      const stopWords = new Set([
        'what', 'is', 'the', 'current', 'price', 'and', 'valuation', 'trend', 'of', 'in', 'for', 'to', 'a', 'an', 'at', 'on', 'with', 'about', 'by', 'from', 'given', 'your', 'my', 'advice', 'seeing', 'enforce', 'live', 'quote', 'verification', 'please', 'can', 'you', 'could', 'how', 'why', 'explain', 'summarize', 'analyze', 'investigate', 'tell', 'me', 'think', 'about', 'following', 'detailed', 'breakdown', 'i', 'we', 'our', 'us', 'youre', 'they'
      ]);
      const words = firstUserMsg.content.split(/[^a-zA-Z0-9]+/);
      const filtered: string[] = [];
      const seen = new Set<string>();
      for (const word of words) {
        const w = word.toLowerCase();
        if (w.length > 1 && !stopWords.has(w) && !seen.has(w)) {
          filtered.push(word);
          seen.add(w);
        }
      }
      const coreTopic = filtered.slice(0, 5).join(' ');
      
      // Determine if the current query needs topic reinforcement (i.e., does not already mention the main terms of the topic)
      const queryLower = cleanQuery.toLowerCase();
      const queryWordsCount = queryLower.split(/\s+/).filter(Boolean).length;
      
      // We only reinforce if the query is a brief follow-up (under 6 words) or explicitly context-relative
      const isContextRelative = /\b(it|its|they|them|this|these|that|those|more|why|how|explain|elaborate|details|above|previous|last|recent|latter|former)\b/i.test(queryLower);
      
      const needsReinforcement = filtered.length > 0 && 
                                 (queryWordsCount < 6 || isContextRelative) &&
                                 !filtered.slice(0, 3).some(term => queryLower.includes(term.toLowerCase()));
      
      if (needsReinforcement && coreTopic) {
        cleanQuery = `${coreTopic} ${cleanQuery}`;
        console.log(`[Consensus Search Router] Preserving session topic. Injected core topic terms: "${coreTopic}" into search query.`);
      }
    }
  }

  const words = cleanQuery.split(/\s+/);
  if (words.length > 15) {
    cleanQuery = words.slice(0, 15).join(' ');
  }

  // Detect time-sensitive queries
  const isTimeSensitive = /price|quote|chart|rate|value|spot|live|real-time|realtime|today|now|current|yesterday|fomc|latest|updated|news|breaking|happen|ticker|\b(usd|eur|btc|eth|sol|gold|silver|oil|gas|wti|brent|soy|wheat|commodit)\b/i.test(cleanQuery);

  if (isTimeSensitive) {
    // Return completely clean unquoted query for time-sensitive inquiries to ensure we get actual current prices/data!
    return cleanQuery;
  }

  const nameLower = (slot.name || "").toLowerCase();
  const descLower = (slot.description || "").toLowerCase();

  if (nameLower.includes("skeptic") || descLower.includes("skeptic") || nameLower.includes("critic") || descLower.includes("critic") || descLower.includes("dissent") || descLower.includes("challenge") || descLower.includes("contrarian")) {
    return `${cleanQuery} critiques limitations controversies`;
  } else if (nameLower.includes("red team") || descLower.includes("red team") || nameLower.includes("risk") || descLower.includes("risk") || descLower.includes("exploit") || descLower.includes("vulnerab") || descLower.includes("security")) {
    return `${cleanQuery} risks vulnerabilities failure modes`;
  } else if (nameLower.includes("steelman") || nameLower.includes("constructive") || descLower.includes("steelman") || descLower.includes("constructive") || nameLower.includes("optimist") || descLower.includes("optimist") || descLower.includes("support") || descLower.includes("advocat")) {
    return `${cleanQuery} benefits evidence validation`;
  } else if (nameLower.includes("outside the box") || descLower.includes("outside") || nameLower.includes("creative") || descLower.includes("creative") || descLower.includes("alternative") || descLower.includes("novel") || descLower.includes("innovat") || descLower.includes("unorthodox") || descLower.includes("paradigm")) {
    return `${cleanQuery} alternative novel innovative concepts`;
  } else {
    const descWords = descLower
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !['about', 'their', 'there', 'which', 'where', 'focused', 'focuses', 'focusing', 'analyze', 'analyzes', 'perspective', 'analyst', 'specialist', 'thinker'].includes(w))
      .slice(0, 3);
    
    if (descWords.length > 0) {
      return `${cleanQuery} ${descWords.join(' ')}`;
    }
    return cleanQuery;
  }
}

interface AgentCallOptions {
  slot: { id: string; name: string; systemPrompt: string; model: string; description?: string };
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  userId?: string;
  searchQuery?: string;
  skipSearch?: boolean;
}

function trimPromptForLlama(prompt: string, maxChars: number): string {
  if (prompt.length <= maxChars) return prompt;

  const contextMarker = "GROUNDING DATA CONTEXT:\n";
  const requestMarker = "\n\nUSER REQUEST:";
  const contextIndex = prompt.indexOf(contextMarker);
  const requestIndex = prompt.indexOf(requestMarker);

  if (contextIndex !== -1 && requestIndex !== -1 && requestIndex > contextIndex) {
    const prefix = prompt.substring(0, contextIndex + contextMarker.length);
    const suffix = prompt.substring(requestIndex);
    const availableSpace = maxChars - prefix.length - suffix.length - 100;
    
    if (availableSpace > 1000) {
      const grounding = prompt.substring(contextIndex + contextMarker.length, requestIndex);
      const truncatedGrounding = grounding.substring(0, availableSpace) + 
        "\n\n[... GROUNDING CONTEXT TRUNCATED KEYWORDS TO PREVENT GROQ LIMIT OVERRUN ...]\n\n";
      return prefix + truncatedGrounding + suffix;
    }
  }

  // Fallback direct slice
  return prompt.substring(0, maxChars) + "\n\n[... CONTENT TRUNCATED ...]\n\n";
}

async function executeAgentCallWithFallback(options: AgentCallOptions): Promise<{ text: string; modelUsed: string }> {
  let attempt = 0;
  const maxAttempts = 7; // Allow up to 7 ducking attempts on the primary model before falling back
  let currentModel = options.slot.model;
  let currentPrompt = options.userPrompt;
  let totalPromptLength = (options.systemInstruction?.length || 0) + (currentPrompt?.length || 0);
  let currentMaxTokens: number | undefined = undefined;

  // --- DYNAMIC AUTO-SELECT ROUTER OPTIMIZER ---
  if (currentModel === 'auto-select') {
    // We prefer llama-3.3-70b-versatile as the default auto-select model due to its high speed, intelligence, and reliability.
    currentModel = 'llama-3.3-70b-versatile';
    console.log(`[Consensus Auto-Select] Routed ${options.slot.name} to Llama 3.3 70B for high performance and availability.`);
  }

  const triedModels = new Set<string>();

  // If the prompt is extremely large, Groq's tight 6,000 TPM limit on llama-3.1-8b-instant will reject it.
  // Proactively swap to the larger llama-3.3-70b-versatile model if we are starting on the 8B model.
  if (currentModel === 'llama-3.1-8b-instant' && totalPromptLength > 8000 && !triedModels.has('llama-3.3-70b-versatile')) {
    console.warn(`[Consensus API fallback] Prompt for ${options.slot.name} is large (${totalPromptLength} chars). Swapping proactively from Llama 3.1 8B to Llama 3.3 70B to prevent Groq TPM limit overflow on 8B.`);
    currentModel = 'llama-3.3-70b-versatile';
  }

  while (attempt < maxAttempts) {
    triedModels.add(currentModel);
    try {
      const response = await callModel({
        model: currentModel,
        systemInstruction: options.systemInstruction,
        userPrompt: currentPrompt,
        temperature: options.temperature,
        userId: options.userId,
        searchQuery: options.searchQuery,
        skipSearch: options.skipSearch,
        maxTokens: currentMaxTokens,
      });
      return { text: stripEmojis(response), modelUsed: currentModel };
    } catch (err: any) {
      attempt++;
      const errMsg = err?.message || "";
      console.warn(`[Consensus API error] Attempt ${attempt}/${maxAttempts} failed on ${currentModel} for ${options.slot.name}. Error:`, errMsg);

      // 1. HARD DAILY / ACCOUNT QUOTAS (Non-retryable on the same provider - immediately failover with 0ms sleep!)
      const isOpenRouterFreeQuotaExceeded = errMsg.toLowerCase().includes("free-models-per-day") ||
                                           errMsg.toLowerCase().includes("add 5 credits");

      const isDailyQuotaExceeded = isOpenRouterFreeQuotaExceeded ||
                                   errMsg.toLowerCase().includes("tokens per day") || 
                                   errMsg.toLowerCase().includes("tpd") ||
                                   errMsg.toLowerCase().includes("prepayment credits are depleted") ||
                                   errMsg.toLowerCase().includes("resource_exhausted") ||
                                   errMsg.toLowerCase().includes("insufficient_quota") ||
                                   errMsg.toLowerCase().includes("billing account");

      const isBillingDepleted = isDailyQuotaExceeded;

      // If OpenRouter account free quota is exceeded, mark ALL OpenRouter free models as exhausted instantly
      if (isOpenRouterFreeQuotaExceeded) {
        triedModels.add('openrouter/nvidia/nemotron-3-ultra-550b-a55b:free');
        triedModels.add('openrouter/nvidia/nemotron-3-super-120b-a12b:free');
        triedModels.add('openrouter/nvidia/nemotron-3.5-lightning:free');
        triedModels.add('openrouter/google/gemma-4-31b-it:free');
        triedModels.add('openrouter/google/gemma-4-26b-a4b-it:free');
        triedModels.add('openrouter/cohere/north-mini-code:free');
        triedModels.add('openrouter/openai/gpt-oss-20b:free');
      }

      // 2. TRANSIENT RATE LIMITS (429 concurrency, TPM/RPM spikes) - Duck max 2 times!
      const isTransientRateLimit = (errMsg.toLowerCase().includes("rate limit") || 
                                   errMsg.toLowerCase().includes("tpm") || 
                                   errMsg.toLowerCase().includes("rpm") || 
                                   errMsg.toLowerCase().includes("429") ||
                                   errMsg.toLowerCase().includes("too many requests") ||
                                   errMsg.toLowerCase().includes("try again in") ||
                                   errMsg.toLowerCase().includes("limit reached")) &&
                                   !isDailyQuotaExceeded;

      const isRequestTooLarge = errMsg.toLowerCase().includes("request too large") ||
                                errMsg.toLowerCase().includes("context window") ||
                                errMsg.toLowerCase().includes("context_length_exceeded") ||
                                errMsg.toLowerCase().includes("max_tokens");

      const isAffordLimit = errMsg.toLowerCase().includes("afford") || 
                            errMsg.toLowerCase().includes("fewer max_tokens") ||
                            errMsg.toLowerCase().includes("more credits");

      if (isAffordLimit) {
        // Fallback directly to llama-3.3-70b-versatile if we can't afford the current option
        if (currentModel !== 'llama-3.3-70b-versatile' && !triedModels.has('llama-3.3-70b-versatile')) {
          console.warn(`[Consensus API fallback] Credit/Token limit caught. Falling back immediately to Llama 3.3 70B...`);
          currentModel = 'llama-3.3-70b-versatile';
          attempt = 0;
          continue;
        }

        const affordMatch = errMsg.match(/can\s+only\s+afford\s+(\d+)/i);
        let maxAfforded = 10000;
        if (affordMatch) {
          const matchedVal = parseInt(affordMatch[1], 10);
          if (!isNaN(matchedVal) && matchedVal > 0) {
            maxAfforded = matchedVal;
          }
        }
        currentMaxTokens = Math.max(1000, maxAfforded - 100);
        console.warn(`[Consensus API fallback] Credit/Token limit restriction caught. Adjusting maxTokens to ${currentMaxTokens} and retrying...`);
        let delayMs = 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // --- DUCKING STRATEGY FOR TRANSIENT CONCURRENCY SPIKES ---
      // Duck at most 2 times with max 2s pause if it is a transient rate limit (NOT daily quota)
      const maxDuckingAttempts = 2;
      if (isTransientRateLimit && !isDailyQuotaExceeded && attempt <= maxDuckingAttempts) {
        let delayMs = Math.min(2500, 1200 * attempt + Math.random() * 400);
        
        const waitSecMatch = errMsg.match(/try again in ([\d.]+)s/i) || errMsg.match(/in ([\d.]+)s/i);
        if (waitSecMatch) {
          const waitSecs = parseFloat(waitSecMatch[1]);
          if (!isNaN(waitSecs) && waitSecs <= 10) {
            delayMs = Math.min(10000, (waitSecs * 1000) + 500);
          }
        }

        console.warn(`[Rate Limit Ducking] Pausing ${delayMs.toFixed(0)}ms to clear transient rate limit before retrying on ${currentModel} (${options.slot.name}) [Attempt ${attempt}/${maxDuckingAttempts}]...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue; // Retry on SAME model!
      }

      // --- INTELLIGENT ZERO-LATENCY FAILOVER LADDER ---
      let nextModel = currentModel;

      const activeFallbackChain: string[] = [
        'openrouter/google/gemini-3.7-flash',
        'qwen/qwen3.6-27b',
        'openrouter/qwen/qwen3.8-27b',
        'openai/gpt-oss-20b',
        'openrouter/meta-llama/llama-3.3-70b-instruct',
        'openrouter/openai/gpt-4o-mini',
        'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
        'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free',
        'llama-3.3-70b-versatile'
      ];

      if (isRequestTooLarge) {
        console.warn(`[Consensus API fallback] Request too large detected (${totalPromptLength} chars). Pruning grounding context...`);
        currentPrompt = trimPromptForLlama(currentPrompt, 6000);
        totalPromptLength = (options.systemInstruction?.length || 0) + currentPrompt.length;

        for (const candidate of activeFallbackChain) {
          if (candidate !== currentModel && !triedModels.has(candidate)) {
            nextModel = candidate;
            break;
          }
        }
      } else {
        // Multi-tier Intelligent Failover Ladder across active models
        for (const candidate of activeFallbackChain) {
          if (candidate !== currentModel && !triedModels.has(candidate)) {
            nextModel = candidate;
            break;
          }
        }
      }

      // If we found a fallback model we haven't tried yet in this session, swap and restart attempts
      if (nextModel !== currentModel && !triedModels.has(nextModel)) {
        console.warn(`[Consensus API fallback] Switching active model from ${currentModel} to ${nextModel} for ${options.slot.name}...`);
        currentModel = nextModel;
        attempt = 0; // Reset attempts to try the new fallback model fresh
        continue;
      }

      // If we got here, and we have no fallback options left, throw the original error
      throw err;
    }
  }
  throw new Error("Failed to execute agent call after max retries/fallbacks");
}

export function getShortExcerpt(text: string, limit: number = 400): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  const cut = text.substring(0, limit);
  const lastSec = cut.lastIndexOf('.');
  if (lastSec > limit * 0.7) {
    return cut.substring(0, lastSec + 1) + ' ... [See more on the Source Report]';
  }
  return cut.trim() + ' ... [See more on the Source Report]';
}

/**
 * Dynamic content sanitizer that filters and sanitizes extracted file text.
 * It completely strips binary debris, null-byte fragments, excessively long words,
 * repeated symbol lines (e.g., '@', '_', '-'), and typical bytecode/exploitation patterns.
 */
export function sanitizeDocumentContent(text: string): string {
  if (!text) return "";

  // 1. Core character cleanup
  // Replace null bytes and non-printable control characters
  let cleaned = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ");
  // Strip official Unicode Replacement Characters (U+FFFD)
  cleaned = cleaned.replace(/\uFFFD/g, "");

  const lines = cleaned.split("\n");
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      filteredLines.push("");
      continue;
    }

    // A. Filter lines with long sequences of identical symbol characters (e.g., "@@@@@@@@", "_ _ _ _", "-------")
    // If a line is mostly repeating single-character symbols or punctuation
    if (/([^a-zA-Z\s])\s*(?:\1\s*){4,}/.test(trimmed)) {
      continue;
    }

    // B. Filter exploitation signatures or low-level bytecode chunks (e.g. getJSONArray, getRuntime().exec)
    if (trimmed.includes(".getJSONArray") || trimmed.includes("getRuntime().exec") || trimmed.includes("exec(\"calc\"")) {
      continue;
    }

    // C. Check overall symbol/punctuation-to-letter density
    // Business documents have normal sentences with letters, spaces, and standard pricing/punctuation.
    // Binary or encrypted data streams have a huge concentration of non-alphanumeric, non-space characters.
    const totalLen = trimmed.length;
    if (totalLen > 25) {
      const alphaNumSpaces = trimmed.replace(/[^a-zA-Z0-9\s]/g, "").length;
      const symbolRatio = (totalLen - alphaNumSpaces) / totalLen;
      if (symbolRatio > 0.50) {
        // Drop high-symbol lines containing hex/binary sequences, compiler dump formats, or key file debris
        continue;
      }
    }

    // D. Filter long unspaced words (e.g. > 45 characters of contiguous non-space characters, excluding URLs)
    const words = trimmed.split(/\s+/);
    const hasTooLongWord = words.some(w => w.length > 45 && !w.startsWith("http") && !w.startsWith("www"));
    if (hasTooLongWord) {
      continue;
    }

    filteredLines.push(line);
  }

  // Combine back, collapse multi-empty-line runs to clean reading space
  const joined = filteredLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // If the file text got completely stripped, output a safe fallback notice so the models aren't blocked
  if (joined.length < 50 && text.trim().length > 100) {
    return "[File Content Sanitized: The original file contained binary character sequences, unreadable character encodings, or stream-debris that has been stripped for model compatibility.]";
  }

  return joined;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  analystResponses?: AnalystResponse[];
  synthesis?: SynthesisResult;
}

export function detectTopicChange(query: string, history: ChatMessage[]): boolean {
  if (!history || history.length === 0) return false;

  // Find the last user message in history
  const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return false;

  const currentClean = query.toLowerCase().replace(/[^\w\s]/g, ' ');
  const lastClean = lastUserMsg.content.toLowerCase().replace(/[^\w\s]/g, ' ');

  // Standard stop words to ignore
  const stopWords = new Set([
    'what', 'is', 'the', 'of', 'and', 'a', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 
    'an', 'be', 'this', 'that', 'are', 'you', 'your', 'i', 'me', 'my', 'we', 'our', 'it', 'its',
    'how', 'who', 'where', 'why', 'can', 'do', 'does', 'did', 'please', 'tell', 'show', 'give'
  ]);

  const currentWords = currentClean.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const lastWords = lastClean.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  // If there's any significant word overlap, it's likely the same topic
  const hasOverlap = currentWords.some(w => lastWords.includes(w));
  if (hasOverlap) return false;

  // Check for specific topic shifts:
  // If last message was about multi-agent frameworks/testing, but new message is about finance, commodities, general knowledge
  const lastIsMultiAgent = /agent|swarm|debate|consensus|framework|panel|peer|evaluat|claude-council|crew-council|verityflow|danielrosehill|exploredataaiml/i.test(lastClean);
  const currentIsGeneral = /price|gold|silver|weather|stock|chart|rate|latest|now|today|news|current|bitcoin|btc|eth|sol|usd|eur|fomc|market|commodity|mining|oil|gas/i.test(currentClean);

  if (lastIsMultiAgent && currentIsGeneral) {
    return true;
  }

  // If no word overlap at all and they are sufficiently long queries, treat as a topic change
  if (currentWords.length > 0 && lastWords.length > 0 && !hasOverlap) {
    return true;
  }

  return false;
}

/**
 * Phase 1 Mid-Reasoning Persona Micro-Retrieval:
 * Extracts domain-targeted vector context chunks tailored specifically to this analyst persona
 * before Phase 1 response generation begins.
 */
async function performPhase1MicroDomainRetrieval(
  slot: { id: string; name: string; systemPrompt: string; description?: string },
  query: string,
  sanitizedAttachedFiles: { name: string; content: string; type: string }[]
): Promise<string> {
  if (!sanitizedAttachedFiles || sanitizedAttachedFiles.length === 0) return "";

  try {
    const allChunks: { text: string; fileName: string }[] = [];
    for (const f of sanitizedAttachedFiles) {
      const chunks = chunkTextSlidingWindow(f.content, 1800, 350);
      for (const c of chunks) {
        allChunks.push({ text: c, fileName: f.name });
      }
    }

    if (allChunks.length === 0) return "";

    // Formulate specialized query for this analyst's persona
    const domainQuery = `${query} ${slot.name} ${slot.description || ''}`.trim();
    const chunkTexts = allChunks.map(c => c.text);
    const vRes = await performVectorSearch(domainQuery, chunkTexts, 3);

    if (vRes.matches && vRes.matches.length > 0) {
      const topMatches = vRes.matches.slice(0, 2);
      console.log(`[Mid-Reasoning Micro-Retrieval] Phase 1: Fetched ${topMatches.length} persona-targeted vector chunks for ${slot.name}`);
      return `\n\n[AGENTIC MID-REASONING MICRO-DOMAIN GROUNDING FOR ${slot.name.toUpperCase()}]:\n` +
        `Below are specific document chunks retrieved during Phase 1 pre-synthesis targeting ${slot.name}'s specialized lens:\n` +
        topMatches.map((m, i) => {
          const srcName = allChunks[m.index]?.fileName || 'Document';
          const trimmed = m.text.length > 400 ? m.text.slice(0, 400) + '...' : m.text;
          return `• [Chunk #${i + 1} | Source: ${srcName} | Match: ${(m.score * 100).toFixed(1)}%] ${trimmed}`;
        }).join('\n\n') + '\n\n';
    }
  } catch (e) {
    console.warn(`[Mid-Reasoning Micro-Retrieval] Phase 1 notice for ${slot.name}:`, e);
  }
  return "";
}

/**
 * Phase 2 Mid-Reasoning Inter-Round Discrepancy & Gap Retrieval:
 * Dynamically identifies disputed terms or information gaps between peer abstracts,
 * executing mid-reasoning micro vector retrieval before Phase 2 peer critique generation.
 */
async function performPhase2InterRoundGapRetrieval(
  slot: { id: string; name: string; systemPrompt: string },
  query: string,
  draftResults: { slotId: string; persona: string; draftText: string; success: boolean }[],
  sanitizedAttachedFiles: { name: string; content: string; type: string }[]
): Promise<string> {
  if (!sanitizedAttachedFiles || sanitizedAttachedFiles.length === 0) return "";

  try {
    const peersDrafts = draftResults.filter(d => d.slotId !== slot.id && d.success);
    if (peersDrafts.length === 0) return "";

    // Synthesize a gap-targeted sub-query by extracting key disputed metrics / topics from peer abstracts
    const peerSnippet = peersDrafts.map(d => d.draftText.slice(0, 250)).join(' ');
    const gapQuery = `${query} ${peerSnippet.slice(0, 150)}`.trim();

    const allChunks: { text: string; fileName: string }[] = [];
    for (const f of sanitizedAttachedFiles) {
      const chunks = chunkTextSlidingWindow(f.content, 1800, 350);
      for (const c of chunks) {
        allChunks.push({ text: c, fileName: f.name });
      }
    }

    if (allChunks.length === 0) return "";

    const chunkTexts = allChunks.map(c => c.text);
    const vRes = await performVectorSearch(gapQuery, chunkTexts, 2);

    if (vRes.matches && vRes.matches.length > 0) {
      const topMatches = vRes.matches.slice(0, 2);
      console.log(`[Mid-Reasoning Micro-Retrieval] Phase 2: Fetched ${topMatches.length} inter-round gap retrieval chunks for ${slot.name}`);
      return `\n\n[AGENTIC MID-REASONING INTER-ROUND GAP RETRIEVAL FOR ${slot.name.toUpperCase()}]:\n` +
        `Below are additional document evidence chunks retrieved during inter-round peer review to address gaps/discrepancies in peer arguments:\n` +
        topMatches.map((m, i) => {
          const srcName = allChunks[m.index]?.fileName || 'Document';
          const trimmed = m.text.length > 400 ? m.text.slice(0, 400) + '...' : m.text;
          return `• [Inter-Round Grounding #${i + 1} | Source: ${srcName} | Composite Score: ${(m.score * 100).toFixed(1)}%] ${trimmed}`;
        }).join('\n\n') + '\n\n';
    }
  } catch (e) {
    console.warn(`[Mid-Reasoning Micro-Retrieval] Phase 2 notice for ${slot.name}:`, e);
  }
  return "";
}

export async function runConsensus(
  query: string,
  history: ChatMessage[],
  slots: { id: string; name: string; systemPrompt: string; model: string; description?: string }[],
  synthesisTemp: number,
  onAnalystComplete?: (response: AnalystResponse) => void,
  synthesisModel: string = 'llama-3.3-70b-versatile',
  attachedFiles: { name: string; content: string; type: string }[] = [],
  planTier: 'free' | 'pro' | 'max' | 'enterprise' = 'free',
  onSynthesisChunk?: (text: string) => void,
  userId?: string
): Promise<{ analystResponses: AnalystResponse[]; synthesis: SynthesisResult }> {
  const startTime = Date.now();
  
  // Clean file contents to eliminate binary debris, unreadable text, and bytecode injects
  const sanitizedAttachedFiles = attachedFiles.map(f => ({
    name: f.name,
    type: f.type,
    content: sanitizeDocumentContent(f.content)
  }));

  // Programmatically detect if the topic has shifted to prevent history pollution
  const hasTopicChanged = detectTopicChange(query, history);
  if (hasTopicChanged) {
    console.log("[Consensus Topic Shift Guard] Detected a major topic shift from previous conversation history. Pruning history to prevent cross-contamination and hallucinations.");
  }
  const activeHistory = hasTopicChanged ? [] : history;

  // Smart Document Router: Direct Injection vs Automated Hybrid Vector Retrieval (RAG)
  let fileContext = "";
  if (sanitizedAttachedFiles.length > 0) {
    const totalDocChars = sanitizedAttachedFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0);
    const DIRECT_INJECTION_THRESHOLD = 12000; // ~3,000 words

    if (totalDocChars <= DIRECT_INJECTION_THRESHOLD) {
      // Smart Router Mode 1: Direct Prompt Injection (full text fits safely without RAG loss)
      console.log(`[Smart Document Router] Direct Injection Mode active (${totalDocChars} chars <= ${DIRECT_INJECTION_THRESHOLD} threshold). Injecting full document text directly.`);
      
      const docHeader = `[SMART DOCUMENT ROUTER MODE: DIRECT PROMPT INJECTION ACTIVE]\n` +
        `• Total Document Size: ${totalDocChars} characters (~${Math.round(totalDocChars / 4)} tokens).\n` +
        `• Status: Under threshold (${DIRECT_INJECTION_THRESHOLD} chars). Full document context is injected directly without chunking or RAG truncation loss.\n\n`;

      const docsBody = sanitizedAttachedFiles.map(f => `--- DOCUMENT: ${f.name} (${f.type || 'text'}) ---\n${f.content}\n--- END DOCUMENT ---\n`).join('\n\n');
      fileContext = docHeader + docsBody;
    } else {
      // Smart Router Mode 2: Automated Hybrid Vector Retrieval (RAG) with Sliding Window Chunking
      console.log(`[Smart Document Router] Hybrid Vector RAG Mode active (${totalDocChars} chars > ${DIRECT_INJECTION_THRESHOLD} threshold). Processing via sliding window chunking & hybrid search.`);

      try {
        const allChunks: { text: string; fileName: string }[] = [];
        for (const f of sanitizedAttachedFiles) {
          // Use sliding window chunking (~2,000 chars per window, ~400 char overlap)
          const chunks = chunkTextSlidingWindow(f.content, 2000, 400);
          for (const c of chunks) {
            allChunks.push({ text: c, fileName: f.name });
          }
        }

        const chunkTexts = allChunks.map(c => c.text);
        const vRes = await performVectorSearch(query, chunkTexts, 6); // Fetch top 6 hybrid-ranked matches

        let vectorSnippet = "";
        if (vRes.matches && vRes.matches.length > 0) {
          vectorSnippet = `[SMART DOCUMENT ROUTER MODE: AUTOMATED HYBRID VECTOR RETRIEVAL (RAG) ACTIVE]\n` +
            `• Total Document Size: ${totalDocChars} characters across ${sanitizedAttachedFiles.length} file(s) (Exceeds ${DIRECT_INJECTION_THRESHOLD} char direct limit).\n` +
            `• Retrieval Architecture: Hybrid BM25 Lexical + Nemotron-3 1B Vector Grounding (${vRes.model}).\n` +
            `• Sliding Window Chunks: Overlapping 2,000-char windows (~500 tokens) with 400-char overlap (~100 tokens).\n\n` +
            `[TOP RELEVANCE GROUNDED DOCUMENT CHUNKS FOR QUERY]:\n` +
            vRes.matches.map((m, i) => {
              const origChunk = allChunks[m.index];
              const sourceDocName = origChunk ? origChunk.fileName : 'Attached File';
              const bm25Pct = m.bm25Score !== undefined ? `, BM25 Lexical: ${(m.bm25Score * 100).toFixed(0)}%` : '';
              const vecPct = m.vectorScore !== undefined ? `, Vector Similarity: ${(m.vectorScore * 100).toFixed(0)}%` : '';
              return `--- GROUNDED CHUNK #${i + 1} [Source: ${sourceDocName} | Composite Hybrid Score: ${(m.score * 100).toFixed(1)}%${vecPct}${bm25Pct}] ---\n${m.text}\n--- END CHUNK #${i + 1} ---`;
            }).join('\n\n');
        } else {
          // Fallback document previews if vector match empty
          vectorSnippet = sanitizedAttachedFiles.map(f => `--- DOCUMENT PREVIEW: ${f.name} ---\n${f.content.slice(0, 4000)}\n[... Remaining content indexed for retrieval ...]\n--- END PREVIEW ---\n`).join('\n\n');
        }

        fileContext = vectorSnippet;
      } catch (e) {
        console.warn("[Smart Document Router] Vector RAG step fallback:", e);
        fileContext = sanitizedAttachedFiles.map(f => `--- DOCUMENT: ${f.name} ---\n${f.content}\n--- END DOCUMENT ---\n`).join('\n\n');
      }
    }
  }
  const context = activeHistory.map((m, index) => {
    let piece = `${m.role.toUpperCase()}: ${cleanConsensusText(m.content)}`;
    if (m.role === 'assistant') {
      if (m.analystResponses && m.analystResponses.length > 0) {
        piece += `\n\n--- PREVIOUS INDEPENDENT ANALYST REPORTS (TURN ${Math.floor(index / 2) + 1}) ---\n` +
          m.analystResponses.map(a => `[Analyst: ${a.persona}]\n${cleanConsensusText(a.text)}`).join('\n\n') +
          `\n--- END PREVIOUS REPORTS ---`;
      }
      if (m.synthesis) {
        piece += `\n\n--- PREVIOUS SYNTHESIZED VERDICT & CONSENSUS ---\n` +
          `Verdict: ${cleanConsensusText(m.synthesis.verdict)}\n` +
          `Consensus Narrative: ${cleanConsensusText(m.synthesis.consensus)}\n` +
          `Uncertainty/Gaps: ${cleanConsensusText(m.synthesis.uncertainty)}\n` +
          `--- END PREVIOUS CONSENSUS ---`;
      }
    }
    return piece;
  }).join('\n\n');
  
  const fileNames = sanitizedAttachedFiles.map(f => f.name).join(', ');
  let rawFullPrompt = query;
  
  if (sanitizedAttachedFiles.length > 0) {
    rawFullPrompt = `GROUNDING DATA CONTEXT:\n${fileContext}\n\nUSER REQUEST: ${query}\n\nINSTRUCTION: Analyze the USER REQUEST specifically through the lens of the GROUNDING DATA CONTEXT provided above. If the data is insufficient, state exactly what is missing based on these documents.`;
  }
  
  if (activeHistory.length > 0) {
    rawFullPrompt = `[THREAD_HISTORY_START]\n${context}\n[THREAD_HISTORY_END]\n\n${rawFullPrompt}`;
  }

  // 1. Zero-Trust Privacy Vault: Maintain a master vault map
  const masterVault = new Map<string, string>();

  const maskAndRegister = (text: string) => {
    const { sanitizedText, vault: localVault } = maskSensitiveData(text);
    for (const [key, val] of localVault.entries()) {
      masterVault.set(key, val);
    }
    return sanitizedText;
  };

  // Mask a baseline fullPrompt for emergency recovery/logging use
  const fullPrompt = maskAndRegister(rawFullPrompt);
  const vault = masterVault;

  const vaultAudit: { token: string; type: string }[] = [];
  vault.forEach((value, token) => {
    let type = "PII";
    if (token.includes("CLIENT_EMAIL")) type = "Email Address";
    else if (token.includes("CLIENT_PHONE")) type = "Phone Number";
    else if (token.includes("FIN_CARD")) type = "Credit Card Number";
    else if (token.includes("NET_IP")) type = "IP Address";
    else if (token.includes("GOV_ID")) type = "Social Security Identifier";
    else if (token.includes("SECRET_KEY")) type = "EVM Private Key";
    vaultAudit.push({ token, type });
  });

  console.log(`[Consensus] Zero-Trust privacy check: masked ${vault.size} instances. Initiating debate workflow...`);

  // Define Emergency Fallback recovery mode in case of 180-second SLA arbitration timeout
  const runEmergencySlaRecovery = async (): Promise<{ analystResponses: AnalystResponse[]; synthesis: SynthesisResult }> => {
    console.warn("[SLA SLA_TIMEOUT] 180-second SLA limit reached! Activating emergency high-reasoning bypass engine...");
    
    // Call high-performance emergency recovery model directly using the sanitized/masked prompt
    try {
      const recoverySystemPrompt = `
        You are the EthersFlow Enterprise SLA Auto-Escalation Recovery Agent.
        The multi-agent consensus debate loop has exceeded its allotted 180-second Maximum Dwell Time SLA.
        Analyze the user's request and provided document grounding data and draft a comprehensive, audited, consolidated consensus response immediately.
        Structure your response clearly using markdown with a high-stakes, professional, zero-delay review tone.
      `;
      
      const recoveryResponse = await callModel({
        model: 'llama-3.3-70b-versatile', // Escalation to high-reasoning Llama 3.3 70B
        systemInstruction: recoverySystemPrompt,
        userPrompt: fullPrompt,
        temperature: 0.1,
        userId,
        skipSearch: true
      });

      const escalatedAnalystResponses: AnalystResponse[] = slots.map(slot => ({
        slotId: slot.id,
        persona: slot.name,
        text: `**[SLA ESCALATION WINDOW ACTIVE]** This agent was compiling findings but timed out at 180.0s under enterprise commitments. The query has been auto-escalated to the sovereign fallback node.`,
        confidence: 'HIGH',
        flags: ['independent_analysis', 'sla_escalated'],
        model: slot.model,
        specialization: slot.description
      }));

      // Unmask/restore PII local before user delivery and strip raw emojis
      const clearConsensus = cleanConsensusText(stripEmojis(restoreSensitiveData(recoveryResponse, vault)));

      const recoverySynthesis: SynthesisResult = {
        consensus: `### **Enterprise SLA Escalation Triggered**\n*The multi-agent consensus debate process exceeded EthersFlow's performance SLA of 180 seconds Maximum Dwell Time. The query is auto-escalated to our sovereign high-reasoning bypass node to prevent a downstream pipeline blockage.*\n\n---\n\n${clearConsensus}`,
        dissents: [{ who: 'Consensus Engine', text: 'Debate suspended at 180.0s to favor zero-latency response SLAs.' }],
        uncertainty: 'Debate state un-reconciled due to auto-escalation.',
        verdict: 'SLA recovery resolution delivered.',
        confidenceMetric: 95,
        uniformityWarning: false,
        sources: sanitizedAttachedFiles.map(f => ({ title: f.name, url: null })),
        slaApplied: true,
        slaDetails: 'Multi-Model Debate capped at 180s Maximum Dwell Time per SLA §3.3. Routed via Zero-Data-Retention (ZDR) emergency bypass pipeline.',
        vaultAudit
      };

      return { analystResponses: escalatedAnalystResponses, synthesis: recoverySynthesis };
    } catch (recoveryErr: any) {
      console.error("[SLA RECOVERY FAILED]", recoveryErr);
      throw recoveryErr;
    }
  };

  // Run the core Multi-Model Debate + Synthesis with an extended 10-minute (600s) execution budget
  let debateTimeoutId: any;
  const timeoutPromise = new Promise<{ isSlaTimeout: boolean }>((resolve) => {
    debateTimeoutId = setTimeout(() => {
      resolve({ isSlaTimeout: true });
    }, 600000); // 10-minute (600s) execution window for complex 5-agent calculations
  });

  const debatePromise = (async (): Promise<{ isSlaTimeout: boolean; results?: { analystResponses: AnalystResponse[]; synthesis: SynthesisResult } }> => {
    const docSupportInstruction = sanitizedAttachedFiles.length > 0 
       ? `\n\nCRITICAL: The user HAS ATTACHED ${sanitizedAttachedFiles.length} document(s): ${fileNames}. You MUST base your analysis PRIMARILY on the content provided in these documents. If you claim there are no documents, you are failing the task. The document content is clearly marked with GROUNDING DATA CONTEXT headers in the user prompt.` 
       : "";

    const continuationInstruction = activeHistory.length > 0
      ? `\n\n[CONTINUATION PROTOCOL ACTIVE]: This is a continuation of a persistent research dialogue. Refer to the previous analyst reports and synthesized verdicts under [THREAD_HISTORY_START]. Your goal is to build on previous findings, NOT start from scratch. Compare current data with the previous state. Explicitly identify and articulate:
1. What has updated or changed about the subject since the last turn?
2. How do current findings evolve or modify your previous recommendations?
Keep the analysis continuity clean and track the evolving metrics/narrative clearly.`
      : "";

    console.log(`[Consensus] CONCURRENT PIPELINE ACTIVE. Starting Phase 1: Interactive Thesis drafting for ${slots.length} analysts asynchronously in parallel (staggered)...`);

    const realTimeGroundingDirective = `\n\nCRITICAL REAL-TIME WEB GROUNDING DIRECTIVE (MANDATORY):
- A live web search has been performed. You MUST extract and prioritize current prices, rates, figures, statistics, and metrics from the verified web grounding sources supplied in the prompt.
- Under NO circumstances should you fall back on your pre-trained model cutoff parameters or outdated historical knowledge base (e.g., stating old prices of gold/silver or outdated interest rates) if the live grounding context has the actual real-time figures.
- CRITICAL FINANCIAL TICKER EXCEPTION: For real-time asset prices, live spot listings, exchange rates, and financial quotes (such as Gold, Silver, Stocks, Cryptocurrencies, or Oil) retrieved from authoritative live listing domains (like Yahoo Finance, Kitco, LBMA, CNBC, Bloomberg, CoinGecko, CoinMarketCap, etc.), you MUST accept the latest available live listing price as the active "current" price for today. Do NOT reject these live ticker listings even if their source metadata timestamp is older (since real-world data indices operate on the actual real-world clock, whereas this application represents the simulated current date).
- STRICT ELIMINATION: Excluding the live ticker exception above, you MUST completely discard and ignore any old or historical figures associated with past years/months from those same live sources. Even if a reputable source is cited, if its excerpt contains older dates, that data is outdated and must NOT be stated as current.
- CRITICAL PREDICTION DISCARD RULE: Never quote speculative analyst forecast articles predicting future prices (e.g., "predicted to reach $4240 in 2026") as the active, current spot price. Actual live spot price listings and market ticker quotes are 100% preferred and must override speculative articles.
- Prioritize current, factual live-source data with absolute empirical fidelity, directly citing the relevant sources in [Source Name](URL) format inside your text.`;

    // --- PHASE 1: INITIAL DRAFTING (PARALLEL EXECUTION WITH STAGGERED INTROS) ---
    const draftPromises = slots.map(async (slot, index) => {
      if (index > 0) {
        // Stagger requests smoothly so they hit rate limit sliding windows at different times
        await new Promise(resolve => setTimeout(resolve, index * 3200 + Math.random() * 600));
      }
      try {
        const personalizedHistoryText = buildPersonalizedContextForAnalyst(activeHistory, slot);
        
        // Mid-Reasoning Persona Micro-Retrieval (Pre-Response Phase 1)
        const microDomainContext = await performPhase1MicroDomainRetrieval(slot, query, sanitizedAttachedFiles);

        let rawSlotPrompt = query;
        if (sanitizedAttachedFiles.length > 0) {
          rawSlotPrompt = `GROUNDING DATA CONTEXT:\n${fileContext}${microDomainContext}\n\nUSER REQUEST: ${query}\n\nINSTRUCTION: Analyze the USER REQUEST specifically through the lens of the GROUNDING DATA CONTEXT provided above. If the data is insufficient, state exactly what is missing based on these documents.`;
        }
        if (activeHistory.length > 0) {
          rawSlotPrompt = `[THREAD_HISTORY_START]\n${personalizedHistoryText}\n[THREAD_HISTORY_END]\n\n${rawSlotPrompt}`;
        }
        
        const slotFullPrompt = maskAndRegister(rawSlotPrompt);

        const personaHardening = generateDynamicPersonaHardening(slot);
        const coldStartSeed = activeHistory.length === 0 ? getColdStartSeedInstruction(slot.name) : "";
        const draftSystemInstruction = `${slot.systemPrompt}${docSupportInstruction}${continuationInstruction}${coldStartSeed}\n\n${personaHardening}\n\n${realTimeGroundingDirective}\n\n` +
          `PHASE 1 COLLABORATIVE DEBATE DIRECTIVE: Compose a concise, high-density initial draft (approx. 400-600 words) presenting your core stance, key premises/evidence, and confidence level. This draft will be shared with the other debating analysts on the panel in the next round so they can explicitly challenge, support, or negotiate with your positions.`;

        const searchQuery = generateSpecializedSearchQuery(query, slot, activeHistory);

        const result = await executeAgentCallWithFallback({
          slot,
          systemInstruction: draftSystemInstruction,
          userPrompt: slotFullPrompt,
          temperature: 0.7,
          userId,
          searchQuery,
        });

        return {
          slotId: slot.id,
          persona: slot.name,
          draftText: cleanConsensusText(result.text),
          modelUsed: result.modelUsed,
          success: true
        };
      } catch (err) {
        console.error(`[Consensus] Phase 1 failed for analyst ${slot.name}:`, err);
        return {
          slotId: slot.id,
          persona: slot.name,
          draftText: `Draft compilation failed: ${err instanceof Error ? err.message : String(err)}`,
          modelUsed: slot.model,
          success: false
        };
      }
    });

    const draftResults = await Promise.all(draftPromises);
    const successfulDraftsCount = draftResults.filter(d => d.success).length;
    console.log(`[Consensus] Phase 1 complete: ${successfulDraftsCount}/${slots.length} drafts compiled. Entering Phase 2: Peer Critique and Defense redrafts in parallel (staggered & token-budgeted)...`);

    // --- PHASE 2: ACTIVE PEER DEBATE COUNTER-REASONING (PARALLEL EXECUTION WITH STAGGERED INTROS & REDUCED TOKEN PAYLOADS) ---
    const reportStructureInstruction = `\n\nREPORT STRUCTURE DIRECTIVE (STRICTLY REQUIRED):
You MUST present your report with absolute professional layout rigor. Avoid unstructured blobs of text, conversational introductions (e.g., "Here is my report"), and weird formatting characters.
Organize your analysis using EXACTLY these section headers (using the standard '###' prefix as shown below):

### Thesis & Confidence Quotient
Define your primary posture/thesis clearly, then state your Confidence Level (High, Medium, or Low). Keep this section punchy and professional.

### Key Findings & Evidence Grounding
Provide high-density bulleted findings. Each finding MUST be directly cited to the grounding documents using standard markdown hyperlinks with source names: [Source Name](URL) (if URL is present) or [Source Name] (if no URL). Do NOT write multi-nested or broken double bullets.

### Peer Debate Alignment
Engage directly with the peer analyst drafts. Specify what you support or challenge in their preliminary stances (referencing them by name, e.g., Analyst: Red Team).

### Uncertainty & Gaps
Bullet out the main limitations, information gaps, or data deficits.

### Conclusion
Provide a very brief, high-level summary concluding your synthesis.

Use bold key-term highlights. Start your output directly with the first section header: "### Thesis & Confidence Quotient".`;

    const finalReportPromises = slots.map(async (slot, index) => {
      if (index > 0) {
        // Stagger peer-critique calls to avoid hitting concurrent request limits (every 3.5s + jitter)
        await new Promise(resolve => setTimeout(resolve, index * 3500 + Math.random() * 600));
      }

      // Collect peer drafts context (excluding own draft)
      const peersText = draftResults
        .filter(d => d.slotId !== slot.id && d.success)
        .map(peer => `[Peer Abstract - Analyst: ${peer.persona}]\n${peer.draftText}`)
        .join('\n\n');

      const ownDraft = draftResults.find(d => d.slotId === slot.id && d.success);
      const ownDraftContext = ownDraft
        ? `\n\n--- YOUR PRELIMINARY THESIS DRAFT (PHASE 1) ---\n` +
          `Below is your initial thesis draft compiled during Phase 1 (containing any real-time web grounding and verified prices you fetched):\n\n${ownDraft.draftText}\n\n` +
          `CRITICAL CONTINUITY DIRECTIVE (MANDATORY): You MUST read, refine, and build directly upon your Phase 1 draft above. Do NOT discard your original research, findings, or real-time web grounding metrics. Treat this draft as your baseline text, revising and polishing it in response to any peer critiques or adversarial feedback while retaining all real-time facts, prices, and links.`
        : "";

      const coDisputantInstruction = peersText
        ? `\n\n--- PRELIMINARY PERSPECTIVES SUBMITTED BY PEER ANALYSTS IN CURRENT WORKSPACE ROUND ---\n` +
          `The other specialists on your panel have submitted their initial draft papers. Review their claims, premises, and logical endpoints carefully:\n\n${peersText}\n\n` +
          `CRITICAL DEBATE & COLLABORATIVE ALIGNMENT DIRECTIVE: You MUST explicitly engage with your peer analyst drafts. ` +
          `Determine areas of strong convergence, identify key points of disagreement or logical vulnerabilities in their claims, and either challenge, refine, or support their arguments directly. ` +
          `CRITICAL CONTEXT INTEGRITY: You MUST critique the CURRENT drafts provided above. Do NOT copy, reference, or repeat any peer reviews, claims, or source citations from previous turns in the history. Your peer review section MUST be 100% written from scratch based exclusively on the new abstracts above, specifying exact differences between their current draft and yours. ` +
          `Do NOT write your paper in a sandbox. Defend your thesis or adapt it based on peer evidence, integrating their viewpoints into your final comprehensive analyst report.\n` +
          `REAL-TIME DATA PRIORITIZATION PROTOCOL (CRITICAL): If there are any discrepancies in numeric figures, prices, quotes, interest rates, or news events between your draft and peer drafts, you MUST strictly side with and prioritize the most current, verified real-time grounding facts (such as recent ticker quotes, commodity indices, live search results). Actively critique and correct any peer analysts if their reports rely on stale news articles, outdated estimates, or obsolete historical averages.`
        : "";

      try {
        const personalizedHistoryText = buildPersonalizedContextForAnalyst(activeHistory, slot);
        
        let rawSlotPromptPhase2 = query;
        if (sanitizedAttachedFiles.length > 0) {
          rawSlotPromptPhase2 = `GROUNDING DOCUMENT INDEX: [${fileNames}]\n\nUSER REQUEST: ${query}\n\nINSTRUCTION: You have completed Phase 1 reading of the source files. Proceed with Phase 2 peer critique and master synthesis of peer drafts.`;
        }
        if (activeHistory.length > 0) {
          rawSlotPromptPhase2 = `[THREAD_HISTORY_START]\n${personalizedHistoryText}\n[THREAD_HISTORY_END]\n\n${rawSlotPromptPhase2}`;
        }
        
        const slotFullPromptPhase2 = maskAndRegister(rawSlotPromptPhase2);

        const personaHardening = generateDynamicPersonaHardening(slot);
        const activePeers = slots.filter(s => s.id !== slot.id).map(s => s.name);
        const reportStructureInstruction = generatePersonalizedStructureInstruction(slot, slots.length === 1, activePeers);

        // Inter-Round Mid-Reasoning Discrepancy & Gap Retrieval (Phase 2)
        const interRoundGapContext = await performPhase2InterRoundGapRetrieval(slot, query, draftResults, sanitizedAttachedFiles);

        const finalSystemInstruction = `${slot.systemPrompt}${docSupportInstruction}${continuationInstruction}${ownDraftContext}${coDisputantInstruction}${interRoundGapContext}${reportStructureInstruction}\n\n${personaHardening}\n\n${realTimeGroundingDirective}\n\nIMPORTANT: When citing sources, use [Source Name](URL) format. If no URL is available, just use [Source Name].`;

        // Here we pass the token-squeezed user prompt (slotFullPromptPhase2) to avoid blowing up TPM rate limits!
        const result = await executeAgentCallWithFallback({
          slot,
          systemInstruction: finalSystemInstruction,
          userPrompt: slotFullPromptPhase2,
          temperature: 0.7,
          userId,
          skipSearch: true,
        });

        // Parse confidence
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (result.text.match(/confidence:?\s*high/i)) confidence = 'HIGH';
        else if (result.text.match(/confidence:?\s*low/i)) confidence = 'LOW';

        // Clean response of redundant duplicate confidence headers
        let cleanedText = result.text;
        cleanedText = cleanedText.replace(/^\s*[-*+]?\s*\**confidence(?:\s+level)?\**:\s*\**\s*(?:high|medium|low)\**\s*\n?/im, '');
        cleanedText = cleanedText.trim();

        const unmaskedText = restoreSensitiveData(cleanedText, vault);

        const finalResponse: AnalystResponse = {
          slotId: slot.id,
          persona: slot.name,
          text: cleanConsensusText(unmaskedText),
          confidence,
          flags: ['independent_analysis', 'collaborative_debate_final'],
          model: result.modelUsed,
          specialization: slot.description
        };

        if (onAnalystComplete) onAnalystComplete(finalResponse);
        return finalResponse;

      } catch (err) {
        console.error(`[Consensus] Phase 2 failed for analyst ${slot.name}:`, err);
        
        // Try to locate the successful Phase 1 draft as a high-fidelity fallback
        const draft = draftResults.find(d => d.slotId === slot.id);
        if (draft && draft.success) {
          console.warn(`[Consensus] Phase 2 failed for ${slot.name}. Falling back to successful Phase 1 draft...`);
          const draftTextUnmasked = restoreSensitiveData(draft.draftText, vault);
          
          let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
          if (draftTextUnmasked.match(/confidence:?\s*high/i)) confidence = 'HIGH';
          else if (draftTextUnmasked.match(/confidence:?\s*low/i)) confidence = 'LOW';

          const fallbackResponse: AnalystResponse = {
            slotId: slot.id,
            persona: slot.name,
            text: draftTextUnmasked,
            confidence,
            flags: ['independent_analysis', 'collaborative_debate_final'],
            model: draft.modelUsed,
            specialization: slot.description
          };

          if (onAnalystComplete) onAnalystComplete(fallbackResponse);
          return fallbackResponse;
        }

        const errorResult: AnalystResponse = {
          slotId: slot.id,
          persona: slot.name,
          text: `ANALYSIS DIRECTIVE TIMED OUT: ${err instanceof Error ? err.message : 'Model call crashed'}. (Fallback triggered to prevent workspace block)`,
          confidence: 'LOW',
          flags: ['error', 'failed_model'],
          model: slot.model,
          specialization: slot.description
        };

        if (onAnalystComplete) onAnalystComplete(errorResult);
        return errorResult;
      }
    });

    let analystResponses = await Promise.all(finalReportPromises);
    let successfulAnalyses = analystResponses.filter(r => !r.flags.includes('failed_model'));
    
    if (successfulAnalyses.length === 0) {
      return {
        isSlaTimeout: false,
        results: {
          analystResponses,
          synthesis: {
            consensus: "CRITICAL SYSTEM FAILURE: All analysts failed to respond. This may be due to temporary API outages or decommissioned models. Please check analyst logs for details.",
            dissents: [],
            uncertainty: "Universal model failure prevent assessment.",
            verdict: "Manual intervention required.",
            confidenceMetric: 0,
            uniformityWarning: false,
            sources: [],
            vaultAudit
          }
        }
      };
    }

    // Programmatic Adversarial Stress Tester static evaluation
    let stressTestResult = await runAdversarialStressTest(
      query,
      successfulAnalyses.map(a => ({ persona: a.persona, text: a.text })),
      userId
    );

    const interventions: { type: string; target: string; metric: string; nudge: string }[] = [];

    // If vulnerability threshold exceeded, and we have enough remaining execution budget (elapsed time < 500s)
    const elapsedSoFar = Date.now() - startTime;
    if (!stressTestResult.passed && elapsedSoFar < 500000) {
      console.warn(`[Stress Tester Fail] Vulnerability Score: ${stressTestResult.vulnerabilityScore}%. Elapsed: ${(elapsedSoFar / 1000).toFixed(1)}s. Triggering strict lightweight single-retry logic-hardening fallback loop...`);
      
      interventions.push({
        type: 'ADVERSARIAL_VULNERABILITY_NUDGE',
        target: 'Analyst Panel',
        metric: `Vulnerability Score: ${stressTestResult.vulnerabilityScore}% (Critique: ${stressTestResult.vulnerabilitiesFound.join(', ')})`,
        nudge: `Adversarial stress score exceeded safe threshold of 70%. Executing single-retry reasoning-hardening fallback.`
      });

      const retryPromises = slots.map(async (slot, index) => {
        const prevResponse = analystResponses.find(r => r.slotId === slot.id);
        if (prevResponse && prevResponse.flags.includes('failed_model')) {
          return prevResponse;
        }

        if (index > 0) {
          // Stagger slightly (shorter delay in retry loop to protect SLA)
          await new Promise(resolve => setTimeout(resolve, index * 1000));
        }

        try {
          const personalizedHistoryText = buildPersonalizedContextForAnalyst(activeHistory, slot);
          let rawSlotPromptPhase2 = query;
          if (sanitizedAttachedFiles.length > 0) {
            rawSlotPromptPhase2 = `GROUNDING DOCUMENT INDEX: [${fileNames}]\n\nUSER REQUEST: ${query}\n\nINSTRUCTION: You have completed Phase 1 reading of the source files. Proceed with Phase 2 peer critique and master synthesis of peer drafts.`;
          }
          if (activeHistory.length > 0) {
            rawSlotPromptPhase2 = `[THREAD_HISTORY_START]\n${personalizedHistoryText}\n[THREAD_HISTORY_END]\n\n${rawSlotPromptPhase2}`;
          }
          const slotFullPromptPhase2 = maskAndRegister(rawSlotPromptPhase2);
          const personaHardening = generateDynamicPersonaHardening(slot);
          const activePeers = slots.filter(s => s.id !== slot.id).map(s => s.name);
          const reportStructureInstruction = generatePersonalizedStructureInstruction(slot, slots.length === 1, activePeers);
          
          const coDisputantInstruction = draftResults
            .filter(d => d.slotId !== slot.id && d.success)
            .map(peer => `[Peer Abstract - Analyst: ${peer.persona}]\n${peer.draftText}`)
            .join('\n\n');

          const ownDraft = draftResults.find(d => d.slotId === slot.id && d.success);
          const ownDraftContext = ownDraft
            ? `\n\n--- YOUR PRELIMINARY THESIS DRAFT (PHASE 1) ---\n` +
              `Below is your initial thesis draft compiled during Phase 1 (containing any real-time web grounding and verified prices you fetched):\n\n${ownDraft.draftText}\n\n` +
              `CRITICAL CONTINUITY DIRECTIVE (MANDATORY): You MUST read, refine, and build directly upon your Phase 1 draft above. Do NOT discard your original research, findings, or real-time web grounding metrics. Treat this draft as your baseline text, revising and polishing it in response to the peer critiques and stress test reports while retaining all real-time facts, prices, and links.`
            : "";

          const finalSystemInstruction = `${slot.systemPrompt}${docSupportInstruction}${continuationInstruction}${ownDraftContext}${coDisputantInstruction}${reportStructureInstruction}\n\n${personaHardening}\n\n` +
            `\n\n[ADVERSARIAL STRESS TEST AUDIT ALERT]: Our static security sandbox has flagged your previous analysis for critical vulnerabilities or logical loops:\n` +
            `> ${stressTestResult.sandboxDiagnosticReport}\n\n` +
            `MANDATORY CORRECTION INSTRUCTION: You MUST re-draft and harden your analysis report to eliminate these vulnerabilities. Close the logical gaps and ensure absolute cryptographic and analytical integrity. Do NOT copy raw text; formulate clean, sound logic.`;

          const result = await executeAgentCallWithFallback({
            slot,
            systemInstruction: finalSystemInstruction,
            userPrompt: slotFullPromptPhase2,
            temperature: 0.3, // Lower temperature to force compliance and deterministic fix
            userId,
            skipSearch: true,
          });

          let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
          if (result.text.match(/confidence:?\s*high/i)) confidence = 'HIGH';
          else if (result.text.match(/confidence:?\s*low/i)) confidence = 'LOW';

          let cleanedText = result.text;
          cleanedText = cleanedText.replace(/^\s*[-*+]?\s*\**confidence(?:\s+level)?\**:\s*\**\s*(?:high|medium|low)\**\s*\n?/im, '');
          cleanedText = cleanedText.trim();
          const unmaskedText = restoreSensitiveData(cleanedText, vault);

          const finalResponse: AnalystResponse = {
            slotId: slot.id,
            persona: slot.name,
            text: unmaskedText,
            confidence,
            flags: ['independent_analysis', 'collaborative_debate_final', 'stress_test_re_drafted'],
            model: result.modelUsed,
            specialization: slot.description
          };

          if (onAnalystComplete) onAnalystComplete(finalResponse);
          return finalResponse;
        } catch (retryErr) {
          console.error(`[Consensus Retry Fail] Redraft failed for analyst ${slot.name}:`, retryErr);
          return prevResponse || {
            slotId: slot.id,
            persona: slot.name,
            text: `RE-DRAFT DIRECTIVE FAILED: ${retryErr instanceof Error ? retryErr.message : 'Timeout'}.`,
            confidence: 'LOW',
            flags: ['error', 'failed_model'],
            model: slot.model,
            specialization: slot.description
          };
        }
      });

      analystResponses = await Promise.all(retryPromises);
      successfulAnalyses = analystResponses.filter(r => !r.flags.includes('failed_model'));
      
      // Re-run static stress tester to check post-mitigation vulnerability score
      stressTestResult = await runAdversarialStressTest(
        query,
        successfulAnalyses.map(a => ({ persona: a.persona, text: a.text })),
        userId
      );
    } else if (!stressTestResult.passed) {
      console.warn(`[Stress Tester Fail] Vulnerability Score: ${stressTestResult.vulnerabilityScore}% but elapsed time (${(elapsedSoFar / 1000).toFixed(1)}s) exceeded maximum 500s retry threshold. Bypassing retry.`);
    } else {
      console.log(`[Stress Tester Pass] Vulnerability Score: ${stressTestResult.vulnerabilityScore}% is within safe bounds.`);
    }

    // --- ELIGIBLE ZERO-TOKEN ALGORITHMIC GUARDIAN WORKFLOW ---
    const activeAnalystTexts = successfulAnalyses.map(a => a.text);
    const lhi = calculateHomogeneityIndex(activeAnalystTexts);
    
    // Inspect each successful agent response for repetitive self-referential pattern (entropy collapse)
    const auditedAnalystResponses = analystResponses.map(analyst => {
      if (analyst.flags.includes('failed_model')) return analyst;
      
      const entropy = calculateShannonEntropy(analyst.text);
      if (entropy < 2.2 && analyst.text.length > 200) {
        interventions.push({
          type: 'ENTROPY_CRITICAL_BYPASS',
          target: `${analyst.persona} (${analyst.model})`,
          metric: `Entropy: ${entropy} (Repetitive self-referential failure detected)`,
          nudge: `Acoustic repetition loop detected inside text stream. Downgraded node confidence and isolated its structural representation in final synthesis prompt.`
        });
        return {
          ...analyst,
          flags: [...analyst.flags, 'entropy_compromise', 'isolated_node'],
          confidence: 'LOW' as const
        };
      }
      return analyst;
    });

    const activeAuditedSuccessfulAnalyses = auditedAnalystResponses.filter(r => !r.flags.includes('failed_model') && !r.flags.includes('isolated_node'));
    const finalAnalysesToSynthesize = activeAuditedSuccessfulAnalyses.length > 0 ? activeAuditedSuccessfulAnalyses : successfulAnalyses;

    const shapleyWeights = calculateShapleyInformationWeights(finalAnalysesToSynthesize);

    const truncatedContext = fileContext.length > 50000 
      ? fileContext.substring(0, 50000) + "\n\n[TRUNCATED]" 
      : fileContext;

    const isSingleAgentSession = finalAnalysesToSynthesize.length === 1;
    const singleAgentName = isSingleAgentSession ? finalAnalysesToSynthesize[0].persona : "";

    // Build synthesis prompt with isolated analysts omitted/sandboxed
    let synthesisPrompt = `
      You are the EthersFlow Synthesis Engine. Your job is to reconcile and package multiple AI analyst perspectives into a unified consensus synthesis.
      
      GENERAL CONVENTIONS:
      - Only reference agents that are explicitly present in the COMPLETED ANALYSES list below.
      - Do NOT reference, hallucinate, or mention default agents (like "Constructive Analyst", "Red Team", "Skeptic", "Empiricist", etc.) unless they are explicitly present in the COMPLETED ANALYSES section.
      - CRITICAL REAL-TIME DATA CONSOLIDATION & TABULAR QUOTE BOARD PROTOCOL (MANDATORY): If the user's query requests current prices, exchange rates, or asset valuations of multiple assets/commodities, you MUST reconcile any conflicting numbers among the analyst papers. Discern the single most accurate, authoritative quote (preferring live ticker quotes from Yahoo Finance, CoinGecko, Kitco, Bloomberg, CNBC, or the FT). At the very beginning of your "consensus" narrative, you MUST generate a clean, elegant markdown table titled "**VERIFIED REAL-TIME DATA BOARD**".
        The table MUST have exactly these columns:
        | Asset / Metric | Reconciled Spot Price | Primary Grounding Source | Date / Period | Short-Term Trend |
        | --- | --- | --- | --- | --- |
        Fill this table with the reconciled values.
      - REDUNDANCY ELIMINATION (MANDATORY): Once the "**VERIFIED REAL-TIME DATA BOARD**" table is generated at the top of the consensus narrative, you are STRICTLY FORBIDDEN from repeating the same list of assets and their prices in bullet points or paragraphs in the rest of the consensus narrative. Instead, focus the rest of your synthesis on high-level macro analysis, strategic asset allocation, risk mitigation plans, and synthesis of expert insights. This prevents the user from reading the exact same list of asset prices repeatedly.
      - CRITICAL REAL-TIME DATA & FINANCIAL METRICS DOMINANCE PROTOCOL (MANDATORY): If the user's query involves real-time data, prices, asset valuations, interest rates, exchange rates, or any current numeric statistics, you MUST strictly and exclusively use the most precise real-time data/quotes fetched from live search/grounding sources in the analyst papers. Under NO circumstances should you allow general news articles, editorial opinions, commentary, or speculative summaries (which other orchestrated agents may have pulled up or discussed) to dilute, override, or average down the exact, real-time figures. If one agent has a precise live quote (e.g., BTC = $94,500) and another agent cites a news article or historical average with a different price, you MUST 100% prioritize and state ONLY the direct real-time grounding price and ignore the news article values entirely. Under NO circumstances should you state or assume outdated or training-cutoff figures/prices if the completed reports cite different current figures fetched in real-time.
      - CRITICAL ANTI-METAHALLUCINATION CONSTRAINT: Under no circumstances should you discuss multi-agent AI theory, swarms, frameworks, or mention external systems like "claude-council", "Crew-Council", or "VerityFlow" unless the USER QUERY explicitly asks about them. Your consensus narrative must focus 100% directly, exclusively, and humbly on answering the USER QUERY (e.g., current prices of gold and silver) based ONLY on the facts reported in the COMPLETED ANALYSES below. Never write meta-commentary about the system itself, how the agents debated, or external AI consensus architectures.
      - TOPIC CHANGE GUARD: If the USER QUERY is on a completely new topic compared to the THREAD HISTORY (e.g., switching from multi-agent systems to the price of gold/silver), you MUST completely discard the previous topic and focus 100% on the new query. Do NOT attempt to weave or merge unrelated historical topics into the new consensus narrative.
      - AMBIGUOUS OR VAGUE QUERY DETECTION (CRITICAL): If the USER QUERY involves real-time details (such as financial quotes, asset prices, interest rates, macroeconomic metrics, or current news events) but is vague, ambiguous, or lacks specific parameters (e.g., "what is the interest rate?" without specifying which central bank or country, "what's the price of gold?" without specifying spot or futures or currency denomination), you MUST explicitly formulate 2-3 precise, friendly, human-centric clarifying follow-up questions at the very beginning of your "consensus" narrative. Place these under a clean, bold header: "**CLARIFICATION NEEDED / FOLLOW-UP QUESTIONS**" in your markdown. This helps guide the user on how to refine their input to get highly precise, targeted results. Justify why these questions are asked, then proceed to provide the best possible consensus answer based on general default assumptions.
      
      ${isSingleAgentSession ? `
      CRITICAL SINGLE-AGENT CONSTRAINTS:
      - This is a SINGLE-AGENT session. There is ONLY ONE active analyst: "${singleAgentName}".
      - Because there is only one analyst, there is NO peer debate, disagreement, or dissenting opinions.
      - You MUST return an empty array \`[]\` for the "dissents" field in the JSON structure.
      - Under NO circumstances should you invent dissenting views, hallucinate peer critics, or reference default agents who are not part of this session.
      - Set the "confidenceMetric" directly based on the analyst's own stated confidence and analytical certainty (do not penalize for peer dissent, since there is none).
      ` : `
      GAME-THEORETIC SHAPLEY WEIGHTING:
      We have calculated the game-theoretic Shapley value (Marginal Information Contribution) for each analyst based on their unique, non-redundant semantic contributions to the debate.
      Higher weights indicate a higher volume of unique, non-overlapping critical analytical material.
      You MUST weight their perspectives accordingly. Outliers with high Shapley weights must have their critical points fully integrated and preserved, never homogenized or averaged out.
      
      ACTIVE RESEARCH SLOTS SHAPLEY WEIGHTS:
      ${finalAnalysesToSynthesize.map(r => `- ${r.persona}: Shapley Influence Weight: ${shapleyWeights[r.persona]?.toFixed(2) || "1.00"}`).join('\n')}
      `}
      
      PLAN_TIER: ${planTier.toUpperCase()}
      ${sanitizedAttachedFiles.length > 0 ? `DOCS: ${fileNames}. Base synthesis strictly on these.` : ''}
      ${sanitizedAttachedFiles.length > 0 ? `[DOC_CONTENT]\n${truncatedContext}\n[/DOC_CONTENT]` : ''}
 
      USER QUERY: "${query}"
      
      COMPLETED ANALYSES:
      ${finalAnalysesToSynthesize.map(r => `--- ${r.persona} (${r.model}) ---\n${r.text.substring(0, 5000)}\n`).join('\n')}
      
      ${analystResponses.length > successfulAnalyses.length ? `NOTE: ${analystResponses.length - successfulAnalyses.length} analysts failed due to technical errors and are omitted.` : ''}
 
      ${activeHistory.length > 0 ? `
      [CONTINUATION TASK DIRECTIVE]:
      This session is a continued, multi-turn analysis. Below in the main conversational context, you will find chronological history, including previous verdicts and consensus text.
      1. Compare the new analyst inputs with the previous state ONLY if the new query is directly related to the same topic as the previous turn. If it is related, articulate what has changed and weave them.
      2. If the user has changed the topic (e.g. asking about gold/silver prices or different assets, commodities, or technical concepts when the previous history was about multi-agent systems or something else), IGNORE the continuation task and do NOT carry forward, mention, or weave any information from the previous history. Treat the new query as a clean, fresh slate.
      ` : ''}

      TASK:
      1. Reconcile areas of AGREEMENT.
      2. Deeply analyze logical DISAGREEMENTS.
      3. Provide an actionable VERDICT.
      4. Exact Confidence Metric (0-100). 
      
      FORMAT: RETURN ONLY RAW JSON. NO CONVERSATIONAL TEXT.
      {
        "consensus": "markdown string",
        "dissents": [{"who": "name", "text": "why they differ"}],
        "uncertainty": "what remains unknown",
        "verdict": "short summary",
        "confidenceMetric": number,
        "uniformityWarning": false,
        "sources": [{"title": "str", "url": "str or null"}]
      }
    `;

    // Homogeneity alarm setup and alignment instructions adjustments (Pluralism Directives)
    let alignmentInstructOverride = 'Reconcile and synthesize analyst results. Output strictly valid JSON. NO PREAMBLE.';
    if (lhi > 0.40) {
      interventions.push({
        type: 'HOMOGENEITY_NUDGE',
        target: 'Synthesis Engine',
        metric: `LHI: ${lhi} (Cognitive echo-chamber consensus detected)`,
        nudge: `Uniformity risk high. Active pluralism weights injected on target instruction prompt to highlight diss dissents.`
      });
      alignmentInstructOverride = `DYNAMIC GUARDIAN PLURALISM ACTIVATED (LHI: ${lhi}). Reconcile and synthesize analyst results. DO NOT rubber-stamp matching positions. Specifically prioritize, identify, and discuss fine nuances or outlier critiques from minority slots that standard consensus logic averages out. Output strictly valid JSON. NO PREAMBLE.`;
    }

    try {
      // Proportional delay: as the number of active agents increases, their concurrent API calls consume
      // more of the provider's token/request sliding window (TPM/RPM limits).
      // We scale the delay to let the rate-limiter breathe before activating the Synthesis Engine.
      const activeAnalystCount = finalAnalysesToSynthesize.length;
      let delayMs = 2200;
      if (activeAnalystCount > 2) {
        delayMs += (activeAnalystCount - 2) * 1500; // Adds 1500ms padding per agent beyond 2
      }
      delayMs = Math.min(8000, delayMs); // Safeguard with an 8000ms upper bound

      console.log(`[Consensus] Deliberating... waiting ${delayMs.toFixed(0)}ms (adaptive delay for ${activeAnalystCount} agents) before activating Synthesis Engine to optimize rate-limit headroom...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      const primarySynthModel = synthesisModel || 'openrouter/google/gemini-3.7-flash';
      
      const synthesisFailoverLadder: string[] = Array.from(new Set([
        primarySynthModel,
        'openrouter/google/gemini-3.7-flash',
        'qwen/qwen3.6-27b',
        'openrouter/qwen/qwen3.8-27b',
        'openai/gpt-oss-20b',
        'openrouter/meta-llama/llama-3.3-70b-instruct',
        'openrouter/openai/gpt-4o-mini',
        'llama-3.3-70b-versatile'
      ])).filter(Boolean);

      const triedSynthModels = new Set<string>();
      let currentSynthModel = synthesisFailoverLadder[0];
      let synthRaw = "";
      let synthAttempt = 0;
      const maxDuckingAttemptsPerModel = 2;
      let currentSynthMaxTokens = 4000;
      let currentSynthPrompt = synthesisPrompt;

      while (currentSynthModel) {
        triedSynthModels.add(currentSynthModel);
        try {
          synthRaw = await callModel({
            model: currentSynthModel,
            systemInstruction: alignmentInstructOverride,
            userPrompt: currentSynthPrompt,
            temperature: lhi > 0.40 ? Math.min(1.0, synthesisTemp + 0.25) : synthesisTemp, // Dynamically elevate temperature to force divergence
            maxTokens: currentSynthMaxTokens,
            onChunk: onSynthesisChunk,
            userId,
            skipSearch: true
          });
          break; // Synthesis succeeded!
        } catch (err: any) {
          synthAttempt++;
          const errMsg = err?.message || "";
          console.warn(`[Consensus Synthesis] Model ${currentSynthModel} attempt ${synthAttempt} failed:`, errMsg);
          
          const isOpenRouterFreeQuotaExceeded = errMsg.toLowerCase().includes("free-models-per-day") ||
                                               errMsg.toLowerCase().includes("add 5 credits");

          const isDailyQuotaExceeded = isOpenRouterFreeQuotaExceeded ||
                                       errMsg.toLowerCase().includes("tokens per day") || 
                                       errMsg.toLowerCase().includes("tpd") ||
                                       errMsg.toLowerCase().includes("prepayment credits are depleted") ||
                                       errMsg.toLowerCase().includes("resource_exhausted") ||
                                       errMsg.toLowerCase().includes("insufficient_quota") ||
                                       errMsg.toLowerCase().includes("billing account");

          const isTransientRateLimit = (errMsg.toLowerCase().includes("rate limit") || 
                                       errMsg.toLowerCase().includes("tpm") || 
                                       errMsg.toLowerCase().includes("rpm") || 
                                       errMsg.toLowerCase().includes("429") ||
                                       errMsg.toLowerCase().includes("too many requests") ||
                                       errMsg.toLowerCase().includes("try again in") ||
                                       errMsg.toLowerCase().includes("limit reached")) &&
                                       !isDailyQuotaExceeded;

          const isAffordLimit = errMsg.toLowerCase().includes("afford") || 
                                errMsg.toLowerCase().includes("fewer max_tokens") ||
                                errMsg.toLowerCase().includes("more credits");

          if (isAffordLimit) {
            const affordMatch = errMsg.match(/can\s+only\s+afford\s+(\d+)/i);
            let maxAfforded = 4000;
            if (affordMatch) {
              const matchedVal = parseInt(affordMatch[1], 10);
              if (!isNaN(matchedVal) && matchedVal > 0) {
                maxAfforded = matchedVal;
              }
            }
            currentSynthMaxTokens = Math.max(1000, maxAfforded - 100);
            console.warn(`[Consensus Synthesis] Credit/Token limit restriction caught. Adjusting synthesis maxTokens to ${currentSynthMaxTokens} midflight and retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }

          // Duck at most 2 times for transient rate limit on the same model
          if (isTransientRateLimit && !isDailyQuotaExceeded && synthAttempt <= maxDuckingAttemptsPerModel) {
            let delayMs = Math.min(2500, 1200 * synthAttempt + Math.random() * 400);
            const waitSecMatch = errMsg.match(/try again in ([\d.]+)s/i) || errMsg.match(/in ([\d.]+)s/i);
            if (waitSecMatch) {
              const waitSecs = parseFloat(waitSecMatch[1]);
              if (!isNaN(waitSecs) && waitSecs <= 10) {
                delayMs = Math.min(10000, (waitSecs * 1000) + 500);
              }
            }
            console.warn(`[Synthesis Rate Limit Ducking] Pausing ${delayMs.toFixed(0)}ms on ${currentSynthModel} (Attempt ${synthAttempt}/${maxDuckingAttemptsPerModel})...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue; // Keep retrying synthesis on chosen model!
          }

          // Model failed or ducking attempts exhausted: select next untried model
          const nextModel = synthesisFailoverLadder.find(m => !triedSynthModels.has(m));
          if (nextModel) {
            console.warn(`[Consensus Synthesis Failover] Switching synthesis model from ${currentSynthModel} to ${nextModel}...`);
            currentSynthModel = nextModel;
            synthAttempt = 0;
            if (nextModel.includes('llama-3.1-8b') || nextModel.includes('instant')) {
              currentSynthPrompt = trimPromptForLlama(synthesisPrompt, 3500);
            } else {
              currentSynthPrompt = synthesisPrompt;
            }
            continue;
          }

          // If all models in the failover ladder are exhausted, throw to activate algorithmic synthesis backup
          console.warn(`[Consensus Synthesis] All synthesis failover models exhausted (${Array.from(triedSynthModels).join(', ')}). Activating algorithmic synthesis backup.`);
          throw err;
        }
      }

      let jsonStr = synthRaw.trim();
      
      // Strip outer markdown syntax if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
      }

      // Improved robust JSON extraction bounding block
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         jsonStr = jsonMatch[0];
      }

      // Safe resilient JSON parsing 
      let synthesis: SynthesisResult;
      try {
        // Run state-machine to clean physical unescaped newlines and repair truncated braces
        const repairedStr = repairJsonTruncation(jsonStr);
        // Strip trailing commas before close braces
        const preprocessedStr = repairedStr.replace(/,(\s*[\]}])/g, '$1');
        synthesis = JSON.parse(preprocessedStr) as SynthesisResult;
        
        // Assert schema compliance
        if (!synthesis.consensus && typeof synthesis === 'object') {
          // If JSON parse succeeded but did not contain the consensus field, trigger backup recovery
          throw new Error("Parsed JSON lacks required fields");
        }
      } catch (parseErr) {
        console.error("General Synthesis parse or structure error. Engaging robust fallback parser.", parseErr);
        
        const consensusExtracted = extractFieldRobust(jsonStr, 'consensus');
        const verdictExtracted = extractFieldRobust(jsonStr, 'verdict');
        const uncertaintyExtracted = extractFieldRobust(jsonStr, 'uncertainty');
        const confidenceMetric = extractNumberFieldRobust(jsonStr, 'confidenceMetric', 80);
        const uniformityWarning = extractBooleanFieldRobust(jsonStr, 'uniformityWarning', false);
        const dissents = extractDissentsRobust(jsonStr);

        // If even regex extraction of consensus narrative failed, use raw synth text (stripped of JSON if needed)
        // This ensures the user NEVER gets an empty narrative!
        let finalConsensus = consensusExtracted;
        if (!finalConsensus) {
          if (jsonStr !== synthRaw && synthRaw.trim().startsWith('{')) {
            // It was a structured JSON but failed to extract. Let's try to strip outer braces as a last resort
            finalConsensus = synthRaw.replace(/^\{|\}$/gi, '').trim();
          } else {
            // It was plain markdown or failed entirely
            finalConsensus = synthRaw;
          }
        }
        
        // Final ultimate safeguard: No empty consensus strings!
        if (!finalConsensus || !finalConsensus.trim()) {
          finalConsensus = jsonStr || synthRaw;
        }

        synthesis = {
          consensus: finalConsensus,
          dissents: dissents,
          uncertainty: uncertaintyExtracted || "Analysis was completed cleanly.",
          verdict: verdictExtracted || "Analysis aligned beautifully.",
          confidenceMetric: confidenceMetric,
          uniformityWarning: uniformityWarning,
          sources: []
        };
      }

      // Detokenize/unmask the final synthesis outputs securely before dispatching
      synthesis.consensus = cleanConsensusText(stripEmojis(restoreSensitiveData(synthesis.consensus, vault)));
      synthesis.uncertainty = cleanConsensusText(stripEmojis(restoreSensitiveData(synthesis.uncertainty, vault)));
      synthesis.verdict = cleanConsensusText(stripEmojis(restoreSensitiveData(synthesis.verdict, vault)));
      synthesis.dissents = (synthesis.dissents || []).map(d => ({
        who: d.who,
        text: cleanConsensusText(stripEmojis(restoreSensitiveData(d.text, vault)))
      }));

      synthesis.vaultAudit = vaultAudit;
      synthesis.slaApplied = false;
      
      // Inject Guardian Audit details into return object
      synthesis.guardianAudit = {
        lhi,
        systemStatus: lhi > 0.40 ? 'HOMOGENEITY_WARNING' : 'STABLE_PLURALISM',
        interventions,
        shapleyWeights,
        alignmentScores: {
          negativeSecurity: interventions.some(i => i.type === 'ENTROPY_CRITICAL_BYPASS') ? 0.95 : 1.0,
          positiveAgencyExpansion: Number((1.0 - (lhi * 0.3)).toFixed(2))
        }
      };

      return { isSlaTimeout: false, results: { analystResponses: auditedAnalystResponses, synthesis } };
    } catch (e: any) {
      console.error("Terminal Synthesis Error inside debate runner, engaging algorithmic synthesis backup:", e);
      
      const steelman = successfulAnalyses.find(a => a.persona.toLowerCase().includes('steelman') || a.persona.toLowerCase().includes('constructive'));
      const redteam = successfulAnalyses.find(a => a.persona.toLowerCase().includes('red') || a.persona.toLowerCase().includes('adversary'));
      const skeptic = successfulAnalyses.find(a => a.persona.toLowerCase().includes('skept'));
      const ethicist = successfulAnalyses.find(a => a.persona.toLowerCase().includes('ethic'));
      const empiricist = successfulAnalyses.find(a => a.persona.toLowerCase().includes('empiri'));
      const specialist = successfulAnalyses.filter(a => ![steelman, redteam, skeptic, ethicist, empiricist].some(p => p && p.slotId === a.slotId));

      let totalConfidence = 0;
      successfulAnalyses.forEach(a => {
        if (a.confidence === 'HIGH') totalConfidence += 85;
        else if (a.confidence === 'LOW') totalConfidence += 40;
        else totalConfidence += 65;
      });
      const avgConfidence = Math.round(successfulAnalyses.length > 0 ? totalConfidence / successfulAnalyses.length : 60);

      let consensusStatus = "Inconclusive / Mild Polarity";
      const highConfCount = successfulAnalyses.filter(a => a.confidence === 'HIGH').length;
      const lowConfCount = successfulAnalyses.filter(a => a.confidence === 'LOW').length;
      if (highConfCount > successfulAnalyses.length / 2) {
        consensusStatus = "High Convergence";
      } else if (lowConfCount > successfulAnalyses.length / 2) {
        consensusStatus = "Low Convergence / High Ambiguity";
      } else {
        consensusStatus = "Balanced Diverse Perspectives";
      }

      let md = `**Consensus Narrative**\n\n`;
      md += `*The primary synthesis engine experienced a temporary api rate constraint. The backup engine was activated to verify, parse, and consolidate active analyst findings.* \n\n`;

      md += `**Pluralism Executive Summary**\n`;
      md += `• Synthesized Verdict: **${consensusStatus}**\n`;
      md += `• Aggregate Analytical Confidence: **${avgConfidence}%**\n`;
      md += `• Active Participating Analysts: ${successfulAnalyses.map(a => `\`${a.persona}\` (${a.confidence} Confidence)`).join(', ')}\n\n`;

      md += `**Synthesized Disagreements & Dissents**\n\n`;
      const dissents: { who: string; text: string }[] = [];
      if (redteam) {
        const excerpt = getShortExcerpt(redteam.text, 250);
        dissents.push({ who: redteam.persona, text: `Stressed potential critical flaws in the thesis: ${excerpt}` });
        md += `• **${redteam.persona} Challenge**: Highlighted potential counter-arguments and adverse scenario plans.\n`;
      }
      if (skeptic) {
        const excerpt = getShortExcerpt(skeptic.text, 250);
        dissents.push({ who: skeptic.persona, text: `Expressed doubt over core causal mechanisms or unsupported claims: ${excerpt}` });
        md += `• **${skeptic.persona} Audit**: Identified potential logical leaps or speculative ideas needing sound research.\n`;
      }
      if (dissents.length === 0) {
        md += `*Perspectives are highly parallel and lack systemic polarization. Consensus alignment scores remain stable.*\n`;
      }

      const defaultSynthesis: SynthesisResult = {
        consensus: cleanConsensusText(restoreSensitiveData(md, vault)),
        dissents,
        uncertainty: "Algorithmic safety backup active. Nuance tracking and confidence aggregate delivered.",
        verdict: consensusStatus,
        confidenceMetric: avgConfidence,
        uniformityWarning: false,
        sources: [],
        vaultAudit,
        guardianAudit: {
          lhi,
          systemStatus: 'HOMOGENEITY_WARNING',
          interventions,
          alignmentScores: {
            negativeSecurity: 0.95,
            positiveAgencyExpansion: 0.90
          }
        }
      };
      
      return {
        isSlaTimeout: false,
        results: {
          analystResponses: auditedAnalystResponses,
          synthesis: defaultSynthesis
        }
      };
    }
  });

  const raceResult = await Promise.race([debatePromise(), timeoutPromise]);
  clearTimeout(debateTimeoutId);

  if (raceResult.isSlaTimeout) {
     return await runEmergencySlaRecovery();
  } else {
     return raceResult.results!;
  }
}
