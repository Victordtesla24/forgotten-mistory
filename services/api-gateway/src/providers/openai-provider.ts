import { BaseProvider } from "./interface.js";
import type { ChatRequest, TokenChunk } from "../types.js";
import { normalizeProviderError, providerErrorFromResponse } from "../lib/provider-error.js";

export class OpenAIProvider extends BaseProvider {
  constructor(private readonly apiKey: string) {
    super();
  }

  async *generateStream(request: ChatRequest): AsyncIterable<TokenChunk> {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: request.message,
          temperature: 0.4
        })
      });

      if (!response.ok) {
        throw await providerErrorFromResponse("openai", response, "OpenAI responses request failed");
      }

      const payload = (await response.json()) as { output_text?: string };
      yield* this.streamWords(payload.output_text?.trim() || "OpenAI returned an empty response.", 10);
    } catch (error) {
      throw normalizeProviderError(error, "openai");
    }
  }
}
