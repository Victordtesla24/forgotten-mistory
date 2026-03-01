export type ChatRequest = {
  message: string;
  mode?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
};

export type TokenChunk = {
  token: string;
  done?: boolean;
};

export interface LLMProvider {
  generateStream(request: ChatRequest): AsyncIterable<TokenChunk>;
}

export type SessionMetrics = {
  createdAtMs: number;
  firstTokenAtMs: number;
  firstTtsByteAtMs: number;
  avatarReadyAtMs: number;
  completedAtMs: number;
  firstTokenToAvatarMs: number;
  firstTokenToDoneMs: number;
  interrupted: boolean;
  provider: string;
};

export type SessionState = {
  id: string;
  mode: string;
  userId: string;
  didSourceUrl?: string;
  didStreamId?: string;
  interrupted: boolean;
  createdAtMs: number;
  metrics: SessionMetrics;
};

export type OrchestratorEnv = {
  ORCHESTRATOR_GRPC_PORT: number;
  LLM_PROVIDER: "local" | "gemini" | "gpt4o" | "mock";
  LLM_BASE_URL: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
  DID_API_KEY?: string;
};

export type TtsSynthesisResult = {
  audioBase64: string;
  mimeType: string;
  ttfbMs: number;
};
