import grpc from "@grpc/grpc-js";
import { z } from "zod";

import { createGrpcServer } from "./grpc/server.js";
import { SessionManager } from "./orchestrator/session-manager.js";
import { createProvider } from "./providers/index.js";
import type { OrchestratorEnv } from "./types.js";

const envSchema = z.object({
  ORCHESTRATOR_GRPC_PORT: z.string().default("50051"),
  LLM_PROVIDER: z.enum(["local", "gemini", "gpt4o", "mock"]).default("local"),
  LLM_BASE_URL: z.string().default("http://llm-engine:11434"),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  DID_API_KEY: z.string().optional()
});

const rawEnv = envSchema.parse(process.env);
const env: OrchestratorEnv = {
  ORCHESTRATOR_GRPC_PORT: Number(rawEnv.ORCHESTRATOR_GRPC_PORT),
  LLM_PROVIDER: rawEnv.LLM_PROVIDER,
  LLM_BASE_URL: rawEnv.LLM_BASE_URL,
  GEMINI_API_KEY: rawEnv.GEMINI_API_KEY,
  OPENAI_API_KEY: rawEnv.OPENAI_API_KEY,
  ELEVENLABS_API_KEY: rawEnv.ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID: rawEnv.ELEVENLABS_VOICE_ID,
  DID_API_KEY: rawEnv.DID_API_KEY
};

const provider = createProvider(env.LLM_PROVIDER, process.env);
const manager = new SessionManager(provider, env);
const server = createGrpcServer(manager);

server.bindAsync(`0.0.0.0:${env.ORCHESTRATOR_GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error("Failed to bind gRPC server:", error);
    process.exit(1);
  }

  server.start();
  console.log(`Realtime orchestrator listening on grpc://0.0.0.0:${port}`);
});
