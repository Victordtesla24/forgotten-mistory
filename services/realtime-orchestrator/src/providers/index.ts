import type { LLMProvider } from "../types.js";
import { GeminiProvider } from "./gemini-provider.js";
import { LocalLlamaProvider } from "./local-llama-provider.js";
import { MockProvider } from "./mock-provider.js";
import { OpenAIProvider } from "./openai-provider.js";

export type ProviderType = "local" | "gemini" | "gpt4o" | "mock";

export function createProvider(type: ProviderType, env: NodeJS.ProcessEnv): LLMProvider {
  if (type === "gemini") {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required for Gemini provider.");
    return new GeminiProvider(env.GEMINI_API_KEY);
  }

  if (type === "gpt4o") {
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required for gpt4o provider.");
    return new OpenAIProvider(env.OPENAI_API_KEY);
  }

  if (type === "mock") {
    return new MockProvider();
  }

  const baseUrl = env.LLM_BASE_URL || "http://llm-engine:11434";
  return new LocalLlamaProvider(baseUrl);
}
