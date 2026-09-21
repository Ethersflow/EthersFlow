/**
 * EthersFlow Text-to-Speech (TTS) Service
 * High-reliability dual-engine audio service:
 * 1. Primary: Server-side Fish Audio S2.1 Pro Free via OpenRouter (with caching & ducking).
 * 2. Fallback: Client-side High-Fidelity Web Speech Synthesis API (window.speechSynthesis)
 *    which is 100% free, unlimited, zero-latency, and immune to 429 quota exhaustion.
 */

export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return "";
  let clean = text
    .replace(/<details[\s\S]*?<\/details>/gi, "") // remove HTML details/summary blocks (Chain of Thought)
    .replace(/<think[\s\S]*?<\/think>/gi, "") // remove <think> tags from reasoning models
    .replace(/<thought[\s\S]*?<\/thought>/gi, "") // remove <thought> tags
    .replace(/```[\s\S]*?```/g, " [Code block omitted] ") // remove raw code
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/^[ \t]*#{1,6}\s*/gm, "") // headers (#, ##, ###, ####, #####, ######)
    .replace(/#/g, "") // strip all remaining hash characters completely
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italics
    .replace(/__([^_]+)__/g, "$1") // bold underscore
    .replace(/_([^_]+)_/g, "$1") // italic underscore
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/\[\d+(?:\s*,\s*\d+)*\]|\[Source:?[^\]]*\]/gi, "") // citations [1], [Source...]
    .replace(/\|\s*[^|]+\s*/g, " ") // table formatting
    .replace(/^[ \t]*[-*•+]\s+/gm, "") // bullet points
    .replace(/^[ \t]*>\s*/gm, "") // blockquotes
    .replace(/\$/g, " dollars ")
    .replace(/%/g, " percent ")
    .replace(/&/g, " and ")
    .replace(/@/g, " at ")
    .replace(/\s+/g, " ")
    .trim();
  return clean;
}

export function splitTextIntoSpokenChunks(text: string, maxChars = 1000): string[] {
  const clean = cleanMarkdownForSpeech(text);
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const sentences = clean.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [clean];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

export class TtsError extends Error {
  status?: number;
  isRateLimit: boolean;
  dailyQuotaExceeded: boolean;
  remedyHint?: string;

  constructor(message: string, status?: number, dailyQuotaExceeded = false, remedyHint?: string) {
    super(message);
    this.name = "TtsError";
    this.status = status;
    this.isRateLimit = status === 429 || dailyQuotaExceeded;
    this.dailyQuotaExceeded = dailyQuotaExceeded;
    this.remedyHint = remedyHint;
  }
}

export async function fetchAudioBlobForText(text: string): Promise<Blob> {
  const response = await fetch("/api/tts/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson.message || errorJson.error || `TTS request failed with status ${response.status}`;
    const isDaily = response.status === 429 || errorJson.dailyLimitExceeded || message.includes("Rate limit exceeded") || message.includes("free-models-per-day");
    throw new TtsError(message, response.status, isDaily, errorJson.remedyHint);
  }

  const blob = await response.blob();
  return blob;
}

/**
 * Intelligent voice selection for Browser Web Speech API.
 * Picks the highest-fidelity natural English voice available on the user's OS.
 */
export function getBestBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Priority list of premium natural voices across OS platforms
  const preferredNames = [
    "Google US English",
    "Microsoft Jenny Online (Natural)",
    "Microsoft Guy Online (Natural)",
    "Microsoft Aria Online (Natural)",
    "Samantha",
    "Daniel",
    "Karen",
    "Alex",
    "Moira",
    "Victoria"
  ];

  for (const name of preferredNames) {
    const match = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()) && v.lang.startsWith("en"));
    if (match) return match;
  }

  // Fallback 1: Any English voice with "natural" or "online" in the name
  const naturalEn = voices.find(v => v.lang.startsWith("en") && (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("online")));
  if (naturalEn) return naturalEn;

  // Fallback 2: Any English voice
  const defaultEn = voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en"));
  if (defaultEn) return defaultEn;

  return voices[0] || null;
}

export interface BrowserSpeechControllerOptions {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onSentenceChange?: (current: number, total: number, sentence: string) => void;
}

/**
 * Browser Speech Controller
 * Executes sequential sentence speech synthesis to completely avoid Chrome's
 * 15-second speech freeze bug while providing precise progress tracking.
 */
export class BrowserSpeechController {
  private sentences: string[] = [];
  private currentIndex = 0;
  private isStopped = false;
  private isPausedState = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private options: BrowserSpeechControllerOptions = {};
  private keepAliveTimer: any = null;

  constructor(options: BrowserSpeechControllerOptions = {}) {
    this.options = options;
  }

  public speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.options.onError?.(new Error("Web Speech API is not supported in this browser."));
      return;
    }

    this.stop();
    this.isStopped = false;
    this.isPausedState = false;

    const clean = cleanMarkdownForSpeech(text);
    if (!clean) {
      this.options.onEnd?.();
      return;
    }

    // Split text into coherent sentences for chunked utterance delivery
    this.sentences = clean.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [clean];
    this.currentIndex = 0;

    // Start keep-alive loop to prevent browser speech audio engine from going to sleep
    this.startKeepAlive();

    this.options.onStart?.();
    this.playNextSentence();
  }

  private playNextSentence() {
    if (this.isStopped || this.currentIndex >= this.sentences.length) {
      this.cleanup();
      this.options.onEnd?.();
      return;
    }

    const sentence = this.sentences[this.currentIndex].trim();
    if (!sentence) {
      this.currentIndex++;
      this.playNextSentence();
      return;
    }

    this.options.onSentenceChange?.(this.currentIndex + 1, this.sentences.length, sentence);

    const utterance = new SpeechSynthesisUtterance(sentence);
    const voice = getBestBrowserVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 1.05; // Slightly brisk for executive briefing clarity
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (this.isStopped) return;
      this.currentIndex++;
      this.playNextSentence();
    };

    utterance.onerror = (e) => {
      if (this.isStopped) return;
      console.warn("[Browser Speech] Utterance error, advancing:", e);
      this.currentIndex++;
      this.playNextSentence();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      this.isPausedState = true;
      this.options.onPause?.();
    }
  }

  public resume() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      this.isPausedState = false;
      this.options.onResume?.();
    }
  }

  public stop() {
    this.isStopped = true;
    this.isPausedState = false;
    this.cleanup();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    return !this.isStopped && !this.isPausedState && this.currentIndex < this.sentences.length;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  public getProgress(): { current: number; total: number; percent: number } {
    const total = this.sentences.length || 1;
    const current = Math.min(this.currentIndex + 1, total);
    return {
      current,
      total,
      percent: Math.round((current / total) * 100)
    };
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    // Chrome workaround: pause & resume briefly if speech is active to keep audio pipeline open
    this.keepAliveTimer = setInterval(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking && !this.isPausedState) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private cleanup() {
    this.stopKeepAlive();
    this.currentUtterance = null;
  }
}
