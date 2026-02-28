export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatRequest = {
  message: string;
  history?: ChatMessage[];
  stream?: boolean;
  mode?: string;
};

export type TokenChunk = {
  token: string;
  done?: boolean;
};

export interface LLMProvider {
  generateStream(request: ChatRequest): AsyncIterable<TokenChunk>;
}

export type VisemeEvent = {
  viseme: string;
  startMs: number;
  endMs: number;
  confidence?: number;
  source?: string;
};
