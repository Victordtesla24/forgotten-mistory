import { BaseProvider } from "./interface.js";
import type { ChatRequest, TokenChunk } from "../types.js";

export class GeminiProvider extends BaseProvider {
  constructor(private readonly apiKey: string) {
    super();
  }

  async *generateStream(request: ChatRequest): AsyncIterable<TokenChunk> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: request.message }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 400
        }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini generateContent failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join(" ").trim();
    yield* this.streamWords(text || "Gemini returned an empty response.", 10);
  }
}
