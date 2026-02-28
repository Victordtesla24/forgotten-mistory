import type { ChatRequest, LLMProvider, TokenChunk } from "../types.js";

export abstract class BaseProvider implements LLMProvider {
  abstract generateStream(request: ChatRequest): AsyncIterable<TokenChunk>;

  protected async *streamWords(text: string, chunkDelayMs = 12): AsyncIterable<TokenChunk> {
    const words = text.split(/(\s+)/).filter(Boolean);
    for (const token of words) {
      yield { token };
      if (chunkDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, chunkDelayMs));
      }
    }
    yield { token: "", done: true };
  }
}
