import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { Redis } from "ioredis";
import { z } from "zod";

import { createProvider, type ProviderType } from "./providers/index.js";
import { avatarLipSyncGauge, didFrameDropGauge, elevenLabsLatencyGauge, redisHitRatioGauge, register, ttftGauge } from "./lib/metrics.js";
import type { ChatRequest, VisemeEvent } from "./types.js";
import { smoothVisemes } from "./viseme/smoother.js";

const envSchema = z.object({
  PORT: z.string().default("8000"),
  LLM_PROVIDER: z.enum(["local", "gemini", "gpt4o", "mock"]).default("local"),
  LLM_BASE_URL: z.string().default("http://llm-engine:11434"),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  DID_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().default("change-me-in-production"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,https://forgotten-mistory.web.app"),
  REDIS_URL: z.string().default("redis://redis:6379")
});

const env = envSchema.parse(process.env);
const provider = createProvider(env.LLM_PROVIDER as ProviderType, process.env);

const app = Fastify({ logger: true });
const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());

const redis = new Redis(env.REDIS_URL, { lazyConnect: true });
let redisEnabled = false;

await redis.connect().then(() => {
  redisEnabled = true;
}).catch(() => {
  redisEnabled = false;
});

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS origin rejected"), false);
  }
});

await app.register(jwt, { secret: env.JWT_SECRET });
await app.register(websocket);
await app.register(rateLimit, {
  max: 20,
  timeWindow: "1 minute",
  keyGenerator: (request) => request.ip
});

const chatRateWindows = new Map<string, { startedAt: number; count: number }>();
const CHAT_LIMIT = 20;
const CHAT_WINDOW_MS = 60_000;

async function enforceChatRateLimit(request: { ip: string }, reply: { code: (status: number) => { send: (body: unknown) => void } }) {
  const now = Date.now();
  const key = request.ip || "unknown";
  const existing = chatRateWindows.get(key);

  if (!existing || now - existing.startedAt >= CHAT_WINDOW_MS) {
    chatRateWindows.set(key, { startedAt: now, count: 1 });
    return;
  }

  existing.count += 1;
  if (existing.count > CHAT_LIMIT) {
    reply.code(429).send({ error: "Rate limit exceeded", max: CHAT_LIMIT, windowMs: CHAT_WINDOW_MS });
  }
}

const wsClients = new Map<string, Set<WebSocket>>();
const avatarLatencyStore = new Map<string, { latencyMs: number; frameDropRate: number; updatedAt: number }>();

function publishVisemes(streamId: string, events: VisemeEvent[]) {
  const clients = wsClients.get(streamId);
  if (!clients || clients.size === 0) return;
  const payload = JSON.stringify({ streamId, events });
  clients.forEach((socket) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(payload);
    }
  });
}

app.get("/health", async () => {
  return {
    status: "ok",
    provider: env.LLM_PROVIDER,
    redis: redisEnabled ? "connected" : "disconnected",
    uptime: process.uptime()
  };
});

app.get("/metrics", async (_request, reply) => {
  reply.header("content-type", register.contentType);
  return register.metrics();
});

app.get("/ws/viseme/:streamId", { websocket: true }, (socket, request) => {
  const streamId = (request.params as { streamId: string }).streamId;
  if (!wsClients.has(streamId)) wsClients.set(streamId, new Set());
  wsClients.get(streamId)!.add(socket);

  socket.onmessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(String(event.data)) as { events?: VisemeEvent[] };
      if (!payload.events) return;

      const smoothed = smoothVisemes(payload.events, {
        minVisemeIntervalMs: 40,
        mergeWindowMs: 60,
        criticalVisemeMinDurationMs: 80
      });
      publishVisemes(streamId, smoothed);
    } catch {
      socket.send(JSON.stringify({ error: "Invalid viseme payload" }));
    }
  };

  socket.onclose = () => {
    wsClients.get(streamId)?.delete(socket);
  };
});

app.post("/api/chat", { preHandler: enforceChatRateLimit }, async (request, reply) => {
  const body = request.body as ChatRequest;
  if (!body?.message || typeof body.message !== "string") {
    reply.code(400);
    return { error: "message is required" };
  }

  const started = Date.now();
  reply.raw.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive"
  });

  let firstTokenSent = false;

  try {
    for await (const chunk of provider.generateStream(body)) {
      if (!firstTokenSent && chunk.token) {
        const ttft = Date.now() - started;
        ttftGauge.set(ttft);
        firstTokenSent = true;
      }

      reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    reply.raw.end();
  } catch (error) {
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`);
    reply.raw.end();
  }

  return reply;
});

app.post("/api/tts/stream", async (request, reply) => {
  const body = request.body as { text?: string; voiceId?: string; optimizeStreamingLatency?: number };
  if (!body?.text) {
    reply.code(400);
    return { error: "text is required" };
  }
  if (!env.ELEVENLABS_API_KEY || !(body.voiceId || env.ELEVENLABS_VOICE_ID)) {
    reply.code(500);
    return { error: "ELEVENLABS_API_KEY and voiceId are required" };
  }

  const started = Date.now();
  const voiceId = body.voiceId || env.ELEVENLABS_VOICE_ID!;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "xi-api-key": env.ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text: body.text,
      optimize_streaming_latency: body.optimizeStreamingLatency ?? 4,
      output_format: "pcm_22050",
      model_id: "eleven_turbo_v2"
    })
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text();
    reply.code(response.status);
    return { error: errorBody };
  }

  elevenLabsLatencyGauge.set(Date.now() - started);

  reply.header("content-type", "audio/pcm");
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) reply.raw.write(Buffer.from(value));
  }
  reply.raw.end();
  return reply;
});

app.post("/api/avatar/streams", async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    reply.code(401);
    return { error: "Authorization header required" };
  }
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    return { error: "Invalid JWT" };
  }

  if (!env.DID_API_KEY) {
    reply.code(500);
    return { error: "DID_API_KEY is required" };
  }

  const response = await fetch("https://api.d-id.com/talks/streams", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${env.DID_API_KEY}`
    },
    body: JSON.stringify(request.body || {})
  });

  const data = await response.json();
  if (!response.ok) {
    reply.code(response.status);
    return data;
  }

  return data;
});

app.post("/api/avatar/streams/:id/sdp", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401);
    return { error: "Invalid JWT" };
  }

  if (!env.DID_API_KEY) {
    reply.code(500);
    return { error: "DID_API_KEY is required" };
  }

  const id = (request.params as { id: string }).id;
  const response = await fetch(`https://api.d-id.com/talks/streams/${id}/sdp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${env.DID_API_KEY}`
    },
    body: JSON.stringify(request.body || {})
  });

  const data = await response.json();
  if (!response.ok) {
    reply.code(response.status);
    return data;
  }

  return data;
});

app.get("/api/avatar/streams/:id/stats", async (request, reply) => {
  const id = (request.params as { id: string }).id;
  const stats = avatarLatencyStore.get(id) || { latencyMs: 0, frameDropRate: 0, updatedAt: Date.now() };

  avatarLipSyncGauge.set(stats.latencyMs);
  didFrameDropGauge.set(stats.frameDropRate);

  return {
    streamId: id,
    latencyMs: stats.latencyMs,
    frameDropRate: stats.frameDropRate,
    updatedAt: stats.updatedAt
  };
});

app.post("/api/avatar/streams/:id/stats", async (request, reply) => {
  const id = (request.params as { id: string }).id;
  const body = request.body as { latencyMs?: number; frameDropRate?: number };

  const current = {
    latencyMs: body.latencyMs ?? 0,
    frameDropRate: body.frameDropRate ?? 0,
    updatedAt: Date.now()
  };

  avatarLatencyStore.set(id, current);
  avatarLipSyncGauge.set(current.latencyMs);
  didFrameDropGauge.set(current.frameDropRate);

  return { ok: true, ...current };
});

app.post("/api/viseme/smooth", async (request, reply) => {
  const body = request.body as { streamId?: string; events?: VisemeEvent[] };
  if (!body.streamId || !Array.isArray(body.events)) {
    reply.code(400);
    return { error: "streamId and events array are required" };
  }

  const smoothed = smoothVisemes(body.events, {
    minVisemeIntervalMs: 40,
    mergeWindowMs: 60,
    criticalVisemeMinDurationMs: 80
  });

  publishVisemes(body.streamId, smoothed);
  return { streamId: body.streamId, events: smoothed };
});

app.get("/internal/cache/health", async () => {
  if (!redisEnabled) {
    redisHitRatioGauge.set(0);
    return { redis: "disabled", hitRatio: 0 };
  }

  const ping = await redis.ping();
  const hitRatio = ping === "PONG" ? 1 : 0;
  redisHitRatioGauge.set(hitRatio);
  return { redis: ping, hitRatio };
});

await app.listen({ port: Number(env.PORT), host: "0.0.0.0" });
