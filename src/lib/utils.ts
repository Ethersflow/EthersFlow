import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNaturalTitleCase(str: string): string {
  if (!str) return str;
  // If the string contains at least 3 alphabetic characters and has no lowercase letters
  const lettersOnly = str.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length >= 3 && lettersOnly === lettersOnly.toUpperCase()) {
    // Preserve common abbreviations/tickers
    const preserveAcronyms = new Set(['AI', 'API', 'MCP', 'LLM', 'SLA', 'LHI', 'BTC', 'ETH', 'USD', 'EUR', 'GBP', 'GDP', 'SEC', 'FDA', 'EU', 'US', 'UK', 'GPU', 'TPU', 'JSON', 'REST', 'SDK']);
    const words = str.toLowerCase().split(/(\s+)/);
    const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with']);
    
    return words.map((w, idx) => {
      if (/^\s+$/.test(w)) return w;
      const cleanWordUpper = w.replace(/[^a-zA-Z]/g, '').toUpperCase();
      if (preserveAcronyms.has(cleanWordUpper)) {
        return w.toUpperCase();
      }
      if (idx > 0 && minorWords.has(w.toLowerCase())) {
        return w.toLowerCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join('');
  }
  return str;
}

export function cleanHeadingText(children: React.ReactNode): React.ReactNode {
  if (!children) return children;
  if (typeof children === 'string') {
    const raw = children.replace(/^[#\s\*:]+|[#\s\*:]+$/g, '').replace(/#+/g, '').trim();
    return toNaturalTitleCase(raw);
  }
  if (Array.isArray(children)) {
    return children.map(child => {
      if (typeof child === 'string') {
        const raw = child.replace(/^[#\s\*:]+|[#\s\*:]+$/g, '').replace(/#+/g, '').trim();
        return toNaturalTitleCase(raw);
      }
      return child;
    });
  }
  return children;
}

export function extractThinking(text: string): { thinking: string; report: string } {
  if (!text) return { thinking: "", report: "" };

  let thinking = "";

  // 1. Check for <think>...</think>
  const thinkMatch = text.match(/<think[\s\S]*?>([\s\S]*?)<\/think>/i);
  if (thinkMatch && thinkMatch[1].trim()) {
    thinking = thinkMatch[1].trim();
  }

  // 2. Check for [think]...[/think]
  if (!thinking) {
    const bracketMatch = text.match(/\[think[\s\S]*?\]([\s\S]*?)\[\/think[\s\S]*?\]/i);
    if (bracketMatch && bracketMatch[1].trim()) {
      thinking = bracketMatch[1].trim();
    }
  }

  // 3. Check for <thought>...</thought>
  if (!thinking) {
    const thoughtMatch = text.match(/<thought[\s\S]*?>([\s\S]*?)<\/thought>/i);
    if (thoughtMatch && thoughtMatch[1].trim()) {
      thinking = thoughtMatch[1].trim();
    }
  }

  // 4. Check for <reasoning>...</reasoning>
  if (!thinking) {
    const reasoningMatch = text.match(/<reasoning[\s\S]*?>([\s\S]*?)<\/reasoning>/i);
    if (reasoningMatch && reasoningMatch[1].trim()) {
      thinking = reasoningMatch[1].trim();
    }
  }

  // 5. Check for unclosed leading <think>...</think>
  if (!thinking) {
    const unclosedMatch = text.match(/^<think[\s\S]*?>([\s\S]*?)(?=(?:###|\*\*|Key Findings|Thesis|1\.\s+Thesis|$))/i);
    if (unclosedMatch && unclosedMatch[1].trim().length > 15) {
      thinking = unclosedMatch[1].trim();
    }
  }

  // 6. Check for leading "Here's a thinking process:" pattern if present before structured sections
  if (!thinking) {
    const processMatch = text.match(/^(?:Here's\s+a\s+thinking\s+process|Thinking\s+Process)[\s\S]*?(?=(?:###|\*\*|Key Findings|Thesis|1\.\s+Thesis|\n\n[A-Z]))/i);
    if (processMatch && processMatch[0].trim().length > 30) {
      thinking = processMatch[0].trim();
    }
  }

  const report = stripThinking(text);
  return { thinking, report };
}

export function stripThinking(text: string): string {
  if (!text) return "";
  let clean = text;
  clean = clean.replace(/<think[\s\S]*?<\/think>/gi, "");
  clean = clean.replace(/\[think[\s\S]*?\][\s\S]*?\[\/think[\s\S]*?\]/gi, "");
  clean = clean.replace(/<thought[\s\S]*?<\/thought>/gi, "");
  clean = clean.replace(/<reasoning[\s\S]*?<\/reasoning>/gi, "");
  clean = clean.replace(/^[\s\S]*?<\/think>/i, "");
  clean = clean.replace(/^[\s\S]*?<\/thought>/i, "");
  clean = clean.replace(/^[\s\S]*?<\/reasoning>/i, "");
  return clean.trim();
}

export function stripMarkdown(text: string): string {
  if (!text) return "";
  let clean = stripThinking(text);
  // Remove markdown headings
  clean = clean.replace(/#+\s+/g, "");
  // Remove bold/italic markers
  clean = clean.replace(/[\*_~`]+/g, "");
  // Remove list bullets
  clean = clean.replace(/^\s*[\-\*\+]\s+/gm, "");
  clean = clean.replace(/^\s*\d+\.\s+/gm, "");
  return clean.trim();
}

export function normalizeConsensus(text: string): string {
  if (!text) return "";
  let clean = stripThinking(text);

  // Remove common LLM introductory phrases
  clean = clean.replace(/^\s*(?:here\s+is\s+the\s+consensus\s+narrative|consensus\s+narrative|here\s+is\s+the\s+synthesis|synthesis\s+report|here\s+is\s+the\s+report|here\s+is\s+a\s+summary|executive\s+summary)[!:\.,\s\n]*/gmi, "");

  // Remove horizontal rules (---) entirely to keep it extremely clean
  clean = clean.replace(/^\s*---\s*$/gm, "\n\n");
  clean = clean.replace(/^\s*\*\*\*\s*$/gm, "\n\n");
  clean = clean.replace(/\r?\n\s*---\s*\r?\n/g, "\n\n");
  clean = clean.replace(/\r?\n\s*\*\*\*\s*\r?\n/g, "\n\n");

  // Preprocess 1: If there are headers inline (e.g., text followed by "### Header" without newline), prepend a double newline so markdown parses it correctly
  clean = clean.replace(/([^\n])\s*(#+\s+)/g, "$1\n\n$2");

  // Remove any stray hashtags inside list bullets or nested inline (e.g. "some text #### sub-title" -> "some text sub-title")
  clean = clean.replace(/([^\n])\s*#+\s*/g, "$1 ");

  // If a line ends with "|" (table row) and the next line has text but is not a table row or separator, insert double newlines to split them
  clean = clean.split('\n').map((line, idx, arr) => {
    if (line.trim().endsWith('|') && idx + 1 < arr.length) {
      const nextLine = arr[idx + 1].trim();
      if (nextLine && !nextLine.startsWith('|') && !nextLine.startsWith('-')) {
        return line + '\n';
      }
    }
    return line;
  }).join('\n');

  // Convert inline asterisk lists (e.g., "* Bitcoin ... * Gold") into real, nicely bulleted multi-line lists
  clean = clean.replace(/[,;]\s*\*+\s+([a-zA-Z0-9])/g, "\n* $1");
  clean = clean.replace(/\s+and\s*\*+\s+([a-zA-Z0-9])/g, "\n* $1");
  clean = clean.replace(/([a-zA-Z0-9]+:)\s*\*+\s+/g, "$1\n* ");

  // Remove duplicate/nested bullet markers (e.g., "- * Bitcoin" -> "- Bitcoin")
  clean = clean.replace(/^\s*([\-\*\+])\s*([\-\*\+])\s*/gm, "$1 ");

  // Remove raw backslashes before markdown symbols
  clean = clean.replace(/\\([\*\-_#|])/g, "$1");

  // Preprocess 3: Strip any trailing hashtags at the end of a header line (e.g., "### Heading ###" -> "### Heading")
  clean = clean.replace(/^(\s*#+\s+.*?)\s+#+\s*$/gm, "$1");

  // Remove any stray hashtags that are accidentally placed inside list bullets (e.g. "- ### **Mixed Efficacy...**" -> "- **Mixed Efficacy...**")
  clean = clean.replace(/^\s*([\-\*\+])\s*#+\s*/gm, "$1 ");
  clean = clean.replace(/^\s*#+\s*([\-\*\+])\s*/gm, "$1 ");
  clean = clean.replace(/^(\s*[\-\*\+]\s*)\s*#+\s*/gm, "$1");
  clean = clean.replace(/^(\s*\d+\.\s*)\s*#+\s*/gm, "$1");

  // Normalize any standalone uppercase headers or bold title lines (e.g., "## POINTS OF AGREEMENT" -> "## Points of Agreement")
  clean = clean.split('\n').map(line => {
    const headerMatch = line.match(/^(\s*#+\s+)(.+)$/);
    if (headerMatch) {
      return headerMatch[1] + toNaturalTitleCase(headerMatch[2]);
    }
    const boldLineMatch = line.match(/^(\s*\*\*)([^*]+)(\*\*\s*)$/);
    if (boldLineMatch) {
      return boldLineMatch[1] + toNaturalTitleCase(boldLineMatch[2]) + boldLineMatch[3];
    }
    return line;
  }).join('\n');

  // Remove triple or more newlines to keep vertical spacing extremely clean
  clean = clean.replace(/\n{3,}/g, "\n\n");

  return clean.trim();
}

export function getAnalystThesisExcerpt(text: string): string {
  if (!text) return "";
  
  // Normalize header lines and strip reasoning tokens
  let normalized = stripThinking(text);
  
  // Replace anything like "### Thesis & Confidence Quotient" or "**Thesis & Confidence Quotient**"
  const sectionRegex = /(?:###?\s+)?\**Thesis\s*(?:&|and)\s*Confidence\s*(?:Quotient|Profile|Quantient|Quantitent|Quantitient|Value)?\**\s*[:* ]*\s*\n([\s\S]*?)(?=\n\s*(?:###?|\*\*)\s*(?:Key\s*Findings|Peer\s*Debate|Uncertainty|(?:In\s+)?Conclusion|$))/i;
  const match = normalized.match(sectionRegex);
  
  let thesisText = "";
  if (match && match[1]) {
    thesisText = match[1].trim();
  } else {
    // Fallback: strip headings and take the first 450 characters
    thesisText = normalized.replace(/###?.*?\n/g, "").trim();
    if (thesisText.length > 450) {
      thesisText = thesisText.substring(0, 450) + "...";
    }
  }

  // Clean any stray heading-like lines from the extracted thesis text
  thesisText = thesisText.replace(/(?:^|\n)\s*###?.*?(?:\n|$)/g, "\n").trim();
  
  // Clean up inline asterisks inside the thesis text
  thesisText = thesisText.replace(/[,;]\s*\*+\s+([a-zA-Z0-9])/g, "\n* $1");
  thesisText = thesisText.replace(/\s+and\s*\*+\s+([a-zA-Z0-9])/g, "\n* $1");
  thesisText = thesisText.replace(/([a-zA-Z0-9]+:)\s*\*+\s+/g, "$1\n* ");
  thesisText = thesisText.replace(/\\([\*\-_#|])/g, "$1");
  
  return `#### Thesis & Confidence Quotient\n${thesisText}`;
}

export interface ParsedAnalystReport {
  thesis: string;
  findings: string;
  peerDebate: string;
  uncertainty: string;
  conclusion: string;
  other: string;
}

export function parseAnalystReport(text: string): ParsedAnalystReport {
  const sections: ParsedAnalystReport = {
    thesis: "",
    findings: "",
    peerDebate: "",
    uncertainty: "",
    conclusion: "",
    other: ""
  };

  if (!text) return sections;

  // Clean reasoning scratchpads and conversational noise or intro phrases
  let cleanText = stripThinking(text).replace(/^\s*(?:here\s+is\s+my\s+analysis|based\s+on\s+the\s+provided\s+grounding|certainly|here\s+is\s+the\s+report|analytical\s+report\s+on\s+.*?)[!:\.,\s]*/gmi, "").trim();

  const patterns = [
    {
      key: "thesis" as keyof ParsedAnalystReport,
      regex: /(?:^|[\s\.\n])#*\s*(?:\d+\.\s+|[\-\*\+]\s+)?\**Thesis\s*(?:&|and|and\/or)?\s*(?:Confidence)?\s*(?:Quotient|Profile|Quantient|Quantitent|Quantitient|Value|Level)?\**\s*[:* \-—]*/i
    },
    {
      key: "findings" as keyof ParsedAnalystReport,
      regex: /(?:^|[\s\.\n])#*\s*(?:\d+\.\s+|[\-\*\+]\s+)?\**Key\s*Findings\s*(?:&|and|and\/or)?\s*(?:Evidence)?\s*(?:Grounding|Base|Context)?\**\s*[:* \-—]*/i
    },
    {
      key: "peerDebate" as keyof ParsedAnalystReport,
      regex: /(?:^|[\s\.\n])#*\s*(?:\d+\.\s+|[\-\*\+]\s+)?\**Peer\s*Debate\s*(?:Alignment|Critique|Feedback|Defense|Response|Hub)?\**\s*[:* \-—]*/i
    },
    {
      key: "uncertainty" as keyof ParsedAnalystReport,
      regex: /(?:^|[\s\.\n])#*\s*(?:\d+\.\s+|[\-\*\+]\s+)?\**(?:Uncertaint(?:y|ies)\s*(?:&|and|and\/or)\s*Gaps|Uncertaint(?:y|ies)|Epistemic\s*Gaps|Gaps\s*&\s*Uncertaint(?:y|ies))\**\s*[:* \-—]*/i
    },
    {
      key: "conclusion" as keyof ParsedAnalystReport,
      regex: /(?:^|[\s\.\n])#*\s*(?:\d+\.\s+|[\-\*\+]\s+)?\**(?:In\s+)?Conclusion\**\s*[:* \-—]*/i
    }
  ];

  // Find matches with their index and length
  const matches: { key: keyof ParsedAnalystReport; start: number; end: number }[] = [];
  
  patterns.forEach(p => {
    const match = p.regex.exec(cleanText);
    if (match) {
      matches.push({
        key: p.key,
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });

  // Sort matches by starting position
  matches.sort((a, b) => a.start - b.start);

  if (matches.length === 0) {
    sections.other = cleanText;
    return sections;
  }

  // Any text before the first matched section goes to other
  if (matches[0].start > 0) {
    sections.other = cleanText.substring(0, matches[0].start).trim();
  }

  // Slice content between the sections
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextStart = (i + 1 < matches.length) ? matches[i + 1].start : cleanText.length;
    let content = cleanText.substring(current.end, nextStart).trim();
    
    // Clean up inline asterisks and format beautifully
    content = content.replace(/[,;]\s*\*+\s+([a-zA-Z0-9])/g, "\n* $1");
    content = content.replace(/\s+and\s*\*+\s+([a-zA-Z0-9])/g, "\n* $1");
    content = content.replace(/([a-zA-Z0-9]+:)\s*\*+\s+/g, "$1\n* ");
    content = content.replace(/\\([\*\-_#|])/g, "$1");

    // Clean up any stray starting/ending symbols
    content = content
      .replace(/^[:* \-—\s]+/, "")
      .replace(/[:* \-—\s]+$/, "")
      .trim();
    
    sections[current.key] = content;
  }

  return sections;
}

export function normalizeAnalystReport(text: string): string {
  if (!text) return "";
  let clean = stripThinking(text);

  // Preprocess 1: If there are headers inline (e.g., text followed by "### Header" without newline), prepend a double newline so markdown parses it correctly
  clean = clean.replace(/([^\n])\s*(#+\s+)/g, "$1\n\n$2");

  // Remove any stray hashtags inside list bullets or nested inline (e.g. "some text #### sub-title" -> "some text sub-title")
  clean = clean.replace(/([^\n])\s*#+\s*/g, "$1 ");

  // Preprocess 2: If main sections are inline or bolded, prepend double newlines
  clean = clean.replace(/([^\n])\s*(\*\*(?:Thesis\s*(?:&|and)\s*Confidence|Key\s*Findings|Peer\s*Debate|Uncertainty\s*(?:&|and)\s*Gaps|(?:In\s+)?Conclusion)\b)/gi, "$1\n\n$2");

  // Preprocess 3: Strip any trailing hashtags at the end of a header line (e.g., "### Heading ###" -> "### Heading")
  clean = clean.replace(/^(\s*#+\s+.*?)\s+#+\s*$/gm, "$1");

  // Remove common conversational prefixes that LLMs sometimes insert before the first heading
  clean = clean.replace(/^\s*(?:here\s+is\s+my\s+analysis|based\s+on\s+the\s+provided\s+grounding|certainly|here\s+is\s+the\s+report|analytical\s+report\s+on\s+.*?)[!:\.,\s]*/gmi, "");

  // Normalize Thesis & Confidence Quotient
  clean = clean.replace(/(?:^|\n)\s*(?:#+\s*)?(?:\d+\.\s+|[\-\*\+]\s+)?\**Thesis\s*(?:&|and)\s*Confidence\s*(?:Quotient|Profile|Quantient|Quantitent|Quantitient|Value)\**\s*[:* ]*\s*/gmi, "\n\n### Thesis & Confidence Quotient\n\n");
  
  // Normalize Key Findings & Evidence Grounding
  clean = clean.replace(/(?:^|\n)\s*(?:#+\s*)?(?:\d+\.\s+|[\-\*\+]\s+)?\**Key\s*Findings\s*(?:&|and)\s*Evidence\s*(?:Grounding|Base|Context)\**\s*[:* ]*\s*/gmi, "\n\n### Key Findings & Evidence Grounding\n\n");
  
  // Normalize Peer Debate Alignment
  clean = clean.replace(/(?:^|\n)\s*(?:#+\s*)?(?:\d+\.\s+|[\-\*\+]\s+)?\**Peer\s*Debate\s*(?:Alignment|Critique|Feedback|Defense)\**\s*[:* ]*\s*/gmi, "\n\n### Peer Debate Alignment\n\n");
  
  // Normalize Uncertainty & Gaps
  clean = clean.replace(/(?:^|\n)\s*(?:#+\s*)?(?:\d+\.\s+|[\-\*\+]\s+)?\**Uncertainty\s*(?:&|and)\s*Gaps\**\s*[:* ]*\s*/gmi, "\n\n### Uncertainty & Gaps\n\n");

  // Normalize Conclusion
  clean = clean.replace(/(?:^|\n)\s*(?:#+\s*)?(?:\d+\.\s+|[\-\*\+]\s+)?\**(?:In\s+)?Conclusion\**\s*[:\*\s,]*\s*(.)?/gmi, (match, p1) => {
    if (p1) {
      return `\n\n### Conclusion\n\n${p1.toUpperCase()}`;
    }
    return `\n\n### Conclusion\n\n`;
  });

  // Convert any remaining headings (starting with #, ##, ###) that are NOT the main 5 sections into clean, styled subheadings (####)
  const mainHeadings = [
    "Thesis & Confidence Quotient",
    "Key Findings & Evidence Grounding",
    "Peer Debate Alignment",
    "Uncertainty & Gaps",
    "Conclusion"
  ];

  let lines = clean.split('\n');
  lines = lines.map(line => {
    const headingMatch = line.match(/^\s*(#{1,6})\s*(.*)$/);
    if (headingMatch) {
      const headingText = headingMatch[2].replace(/[\*#:]/g, "").trim();
      const isMain = mainHeadings.some(mh => {
        const cleanMH = mh.toLowerCase().replace(/[^a-z]/g, "");
        const cleanHT = headingText.toLowerCase().replace(/[^a-z]/g, "");
        return cleanHT.includes(cleanMH) || cleanMH.includes(cleanHT);
      });
      if (!isMain) {
        // This is a subsection subtitle. Strip trailing hashtags/spaces and normalize to level-4 header (####)
        const content = headingMatch[2].replace(/\s*#+\s*$/, "").trim();
        return `#### ${content}`;
      }
    }
    return line;
  });
  clean = lines.join('\n');

  // Clean up double/broken bullets (e.g. "- **Mixed Efficacy:** - **[Source 1]..." to a nested clean structure)
  clean = clean.replace(/^\s*([\-\*\+])\s+\*\*(.*?)\*\*[:\s]*[\-\*\+]\s+/gm, "$1 **$2**:\n  - ");

  // Remove any stray hashtags that are accidentally placed inside list bullets (e.g. "- ### **Mixed Efficacy...**" -> "- **Mixed Efficacy...**")
  clean = clean.replace(/^\s*([\-\*\+])\s*#+\s*/gm, "$1 ");
  clean = clean.replace(/^\s*#+\s*([\-\*\+])\s*/gm, "$1 ");
  clean = clean.replace(/^(\s*[\-\*\+]\s*)\s*#+\s*/gm, "$1");
  clean = clean.replace(/^(\s*\d+\.\s*)\s*#+\s*/gm, "$1");

  // Format loose bullet lists that might have inline + [Source] lists
  clean = clean.replace(/\s\+\s\[Source/gi, "\n    * [Source");

  // Remove triple or more newlines to keep vertical spacing extremely clean
  clean = clean.replace(/\n{3,}/g, "\n\n");

  // Post-process the Conclusion section to explicitly strip any leading commas or punctuation and capitalize the first letter
  clean = clean.replace(/(### Conclusion\s*[\n\r]*\s*)[:\*\s,\-]*(.)/gmi, (match, prefix, char) => {
    return `${prefix}${char.toUpperCase()}`;
  });

  return clean.trim();
}
