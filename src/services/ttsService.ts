/**
 * EthersFlow Text-to-Speech (TTS) Service
 * Integrates Fish Audio S2.1 Pro Free via OpenRouter with rate-limit ducking backoff.
 */

export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return "";
  let clean = text
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

export function splitTextIntoSpokenChunks(text: string, maxChars = 350): string[] {
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
    throw new Error(errorJson.message || errorJson.error || `TTS request failed with status ${response.status}`);
  }

  const blob = await response.blob();
  return blob;
}
