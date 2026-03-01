import { randomUUID } from "node:crypto";

import { createDidStream } from "../integrations/did.js";
import { synthesizeElevenLabsStream } from "../integrations/elevenlabs.js";
import type { ChatRequest, LLMProvider, OrchestratorEnv, SessionMetrics, SessionState } from "../types.js";

type EmitFn = (eventType: string, payload: unknown) => void;

const SEGMENT_TOKEN_LIMIT = 32;

function emptyMetrics(provider: string): SessionMetrics {
  return {
    createdAtMs: Date.now(),
    firstTokenAtMs: 0,
    firstTtsByteAtMs: 0,
    avatarReadyAtMs: 0,
    completedAtMs: 0,
    firstTokenToAvatarMs: 0,
    firstTokenToDoneMs: 0,
    interrupted: false,
    provider
  };
}

function shouldFlushSegment(segment: string, tokenCount: number): boolean {
  if (tokenCount >= SEGMENT_TOKEN_LIMIT) return true;
  return /[.!?]\s*$/.test(segment.trimEnd());
}

export class SessionManager {
  private readonly sessions = new Map<string, SessionState>();

  constructor(
    private readonly provider: LLMProvider,
    private readonly env: OrchestratorEnv
  ) {}

  async createSession(mode: string, userId: string, didSourceUrl?: string): Promise<SessionState> {
    const sessionId = randomUUID();
    const state: SessionState = {
      id: sessionId,
      mode: mode || "default",
      userId,
      didSourceUrl,
      interrupted: false,
      createdAtMs: Date.now(),
      metrics: emptyMetrics(this.env.LLM_PROVIDER)
    };

    state.metrics.createdAtMs = state.createdAtMs;

    if (this.env.DID_API_KEY) {
      state.didStreamId = (await createDidStream(this.env.DID_API_KEY, didSourceUrl)) || undefined;
    }

    this.sessions.set(sessionId, state);
    return state;
  }

  interruptSession(sessionId: string): boolean {
    const state = this.sessions.get(sessionId);
    if (!state) return false;
    state.interrupted = true;
    state.metrics.interrupted = true;
    return true;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): SessionState | null {
    return this.sessions.get(sessionId) || null;
  }

  getSessionMetrics(sessionId: string): SessionMetrics | null {
    const session = this.sessions.get(sessionId);
    return session ? session.metrics : null;
  }

  async runSessionPrompt(sessionId: string, request: ChatRequest, emit: EmitFn): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error("Session not found.");
    }

    const prompt = request.message.trim();
    if (!prompt) {
      throw new Error("Prompt cannot be empty.");
    }

    let tokenCount = 0;
    let segmentBuffer = "";
    let fullText = "";
    const audioParts: Buffer[] = [];

    const flushSegment = async () => {
      const segment = segmentBuffer.trim();
      if (!segment) {
        segmentBuffer = "";
        tokenCount = 0;
        return;
      }

      emit("llm.segment", {
        text: segment,
        length: segment.length
      });

      const tts = await synthesizeElevenLabsStream(segment, {
        apiKey: this.env.ELEVENLABS_API_KEY,
        voiceId: this.env.ELEVENLABS_VOICE_ID,
        optimizeStreamingLatency: 3
      });

      if (tts) {
        if (!state.metrics.firstTtsByteAtMs) {
          state.metrics.firstTtsByteAtMs = Date.now();
          emit("latency.sample", {
            metric: "tts_first_byte_ms",
            value: tts.ttfbMs
          });
        }

        audioParts.push(Buffer.from(tts.audioBase64, "base64"));

        emit("tts.chunk", {
          audioBase64: tts.audioBase64,
          mimeType: tts.mimeType,
          segmentLength: segment.length
        });

        if (state.didStreamId && !state.metrics.avatarReadyAtMs) {
          state.metrics.avatarReadyAtMs = Date.now();
          state.metrics.firstTokenToAvatarMs =
            state.metrics.firstTokenAtMs > 0
              ? state.metrics.avatarReadyAtMs - state.metrics.firstTokenAtMs
              : 0;

          emit("avatar.state", {
            streamId: state.didStreamId,
            status: "ready_for_webrtc_sdp",
            note: "D-ID stream created. Client must complete SDP handshake for live lip-sync."
          });
        }
      }

      segmentBuffer = "";
      tokenCount = 0;
    };

    for await (const chunk of this.provider.generateStream(request)) {
      if (state.interrupted) {
        emit("session.interrupted", { sessionId, reason: "manual_interrupt" });
        break;
      }

      if (chunk.done) {
        break;
      }

      if (!chunk.token) {
        continue;
      }

      fullText += chunk.token;
      segmentBuffer += chunk.token;
      tokenCount += 1;

      if (!state.metrics.firstTokenAtMs) {
        state.metrics.firstTokenAtMs = Date.now();
      }

      emit("llm.token", {
        token: chunk.token
      });

      if (shouldFlushSegment(segmentBuffer, tokenCount)) {
        await flushSegment();
      }
    }

    if (!state.interrupted && segmentBuffer.trim()) {
      await flushSegment();
    }

    state.metrics.completedAtMs = Date.now();
    state.metrics.firstTokenToDoneMs =
      state.metrics.firstTokenAtMs > 0 ? state.metrics.completedAtMs - state.metrics.firstTokenAtMs : 0;

    const mergedAudio = audioParts.length > 0 ? Buffer.concat(audioParts) : null;
    const audioBase64 = mergedAudio ? mergedAudio.toString("base64") : "";
    const audioMimeType = mergedAudio ? "audio/mpeg" : "";

    emit("session.done", {
      text: fullText.trim(),
      interrupted: state.interrupted,
      audioBase64,
      audioMimeType,
      metrics: state.metrics
    });
  }
}
