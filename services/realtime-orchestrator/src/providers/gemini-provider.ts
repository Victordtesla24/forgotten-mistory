import { BaseProvider } from "./interface.js";
import type { ChatRequest, TokenChunk } from "../types.js";
import { normalizeProviderError, providerErrorFromResponse } from "../lib/provider-error.js";

export class GeminiProvider extends BaseProvider {
  constructor(private readonly apiKey: string) {
    super();
  }

  async *generateStream(request: ChatRequest): AsyncIterable<TokenChunk> {
    try {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: request.message }]
            }
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 512
          }
        })
      });

      if (!response.ok) {
        throw await providerErrorFromResponse("gemini", response, "Gemini generateContent failed");
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join(" ").trim();
      yield* this.streamWords(text || "Gemini returned an empty response.", 8);
    } catch (error) {
      throw normalizeProviderError(error, "gemini");
    }
  }
}
