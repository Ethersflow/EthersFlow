import { GoogleGenAI } from "@google/genai";

export async function callModel(params: {
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (text: string) => void;
  userId?: string;
  searchQuery?: string;
  skipSearch?: boolean;
}) {
  const isGemini = params.model.includes('gemini');
  const hasClientKey = !!(import.meta.env.VITE_GEMINI_API_KEY);

  // Use client-side Gemini ONLY if explicitly configured with VITE_ key
  if (isGemini && hasClientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const normalizedModel = params.model.replace(/^models\//, '');
      
      const config = {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.7,
      };

      if (params.onChunk) {
        const result = await ai.getGenerativeModel({ model: normalizedModel }).generateContentStream({
          contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
          ...config as any
        });

        let fullText = "";
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            params.onChunk(text);
          }
        }
        return fullText;
      } else {
        const result = await ai.getGenerativeModel({ model: normalizedModel }).generateContent({
          contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
          ...config as any
        });
        return result.response.text() || "";
      }
    } catch (error: any) {
      console.warn("Client-side Gemini failed, falling back to server proxy:", error.message);
    }
  }

  // Primary: Route all model calls (including Gemini without client key) via Server Proxy
  try {
    const isStream = !!params.onChunk;
    const endpoint = isStream ? '/api/llm/stream' : '/api/llm/call';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300 second (5 minute) timeout for deep consensus calls

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (params.userId) {
        headers["X-User-Id"] = params.userId;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: params.model,
          systemInstruction: params.systemInstruction,
          userPrompt: params.userPrompt,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
          searchQuery: params.searchQuery,
          skipSearch: params.skipSearch
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown response format' }));
        throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
      }

      if (isStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.slice(6);
              if (dataStr === '[DONE]') continue;

              let data;
              try {
                data = JSON.parse(dataStr);
              } catch (parseError) {
                console.warn("Error parsing stream chunk JSON:", trimmedLine, parseError);
                continue;
              }

              if (data && data.text) {
                fullText += data.text;
                params.onChunk!(data.text);
              } else if (data && data.error) {
                throw new Error(data.error);
              }
            }
          }
        }
        return fullText;
      }

      const data = await response.json();
      if (data.text) {
        return data.text;
      }
      throw new Error("Empty response from server");
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("The request timed out after 300 seconds. Try a simpler query or check your connection.");
      }
      throw error;
    }
  } catch (outerError: any) {
    console.error("Analysis call failed:", outerError);
    throw outerError;
  }
}
