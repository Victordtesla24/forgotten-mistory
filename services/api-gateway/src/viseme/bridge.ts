/**
 * DidElevenLabsBridge -- Live D-ID <-> ElevenLabs WebSocket lip-sync pipeline.
 *
 * Orchestrates the full FR-CLONE-LIVE pipeline:
 *   Text -> ElevenLabs WebSocket -> PCM audio chunks
 *     -> VisemeBridge (formant extraction) -> VisemeEvent[]
 *     -> D-ID Streaming API (WebRTC audio -> rendered frames)
 *
 * Architecture:
 *   1. Open D-ID stream session (REST API)
 *   2. Connect ElevenLabs WebSocket for real-time TTS
 *   3. Feed audio packets -> VisemeBridge for viseme extraction
 *   4. Publish viseme events via callback
 *   5. Accumulate audio for D-ID WebRTC sink
 *
 * Quality target: frame-accurate lip-sync (<=1 frame / ~40 ms drift).
 *
 * Lifecycle:
 *   open -> stream -> flush -> dispose (no leaked sockets/listeners).
 *   Reconnection with exponential backoff on WebSocket failure.
 */
import { ElevenLabsWebSocket } from "./elevenlabs-ws.js";
import type { ElevenLabsWsConfig, ElevenLabsWsState } from "./elevenlabs-ws.js";
import { smoothVisemes, type SmoothingConfig } from "./smoother.js";
import type { VisemeEvent } from "../types.js";

// -- Types --------------------------------------------------------------

export interface DidStreamSession {
  streamId: string;
  sessionId: string;
  /** WebRTC offer SDP (for client-side peer connection) */
  offerSdp?: string;
  /** ICE servers for WebRTC */
  iceServers?: Array<{ urls: string | string[]; username?: string; credential?: string }>;
}

export interface BridgeConfig {
  /** ElevenLabs API key (required) */
  elevenLabsApiKey: string;
  /** ElevenLabs voice ID (required) */
  elevenLabsVoiceId: string;
  /** D-ID API key (required for live path) */
  didApiKey: string;
  /** D-ID source image URL (the avatar to animate) */
  didSourceUrl?: string;
  /** ElevenLabs model ID */
  elevenLabsModelId?: string;
  /** Audio output format */
  outputFormat?: "pcm_16000" | "pcm_22050" | "pcm_24000" | "pcm_44100";
  /** Viseme smoothing configuration */
  smoothing?: SmoothingConfig;
  /** Reconnection configuration */
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
}

export interface BridgeCallbacks {
  /** Viseme events produced by the pipeline (smoothed). */
  onVisemeEvents: (events: VisemeEvent[], streamId: string) => void;
  /** Raw PCM audio chunk (for client-side playback / WebRTC). */
  onAudioChunk?: (samples: Float32Array, sampleRate: number) => void;
  /** D-ID stream session created (contains streamId and SDP offer). */
  onStreamCreated?: (session: DidStreamSession) => void;
  /** Bridge state change. */
  onStateChange?: (state: BridgeState) => void;
  /** Error callback. */
  onError?: (error: Error, phase: BridgePhase) => void;
}

export type BridgeState = "idle" | "creating_stream" | "connecting_elevenlabs" | "streaming" | "flushing" | "disposed" | "error";

export type BridgePhase = "did_stream_create" | "elevenlabs_connect" | "elevenlabs_stream" | "viseme_extraction" | "flush";

// -- Default smoothing config (frame-accurate target: <=40ms) ------------

const DEFAULT_SMOOTHING: SmoothingConfig = {
  minVisemeIntervalMs: 40,
  mergeWindowMs: 60,
  criticalVisemeMinDurationMs: 80,
};

// -- Per-format PCM byte sizes ------------------------------------------

const PCM_BYTES_PER_SAMPLE = 2;

// -- Bridge Implementation ----------------------------------------------

/**
 * DidElevenLabsBridge -- the live lip-sync pipeline orchestrator.
 *
 * Usage:
 *   const bridge = new DidElevenLabsBridge(config, callbacks);
 *   const session = await bridge.openStream("Hello world");
 *   // Viseme events arrive via callbacks.onVisemeEvents
 *   await bridge.flush();
 *   bridge.dispose();
 */
export class DidElevenLabsBridge {
  private config: BridgeConfig;
  private callbacks: BridgeCallbacks;
  private state: BridgeState = "idle";
  private elevenLabsWs: ElevenLabsWebSocket | null = null;
  private didSession: DidStreamSession | null = null;
  private disposed = false;

  // Viseme extraction state
  private visemeBuffer: Float32Array;
  private visemeBufferOffset = 0;
  private streamTimeMs = 0;
  private sampleRate: number;
  private pendingEvents: VisemeEvent[] = [];
  private lastVisemeIndex = 0;
  private lastVisemeStartMs = 0;
  private smoothingConfig: SmoothingConfig;

  constructor(config: BridgeConfig, callbacks: BridgeCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.smoothingConfig = { ...DEFAULT_SMOOTHING, ...config.smoothing };
    this.sampleRate = 22050; // Default, updated on stream open

    // Pre-allocate viseme buffer (2 seconds of audio)
    this.visemeBuffer = new Float32Array(this.sampleRate * 2);
    this.visemeBufferOffset = 0;
  }

  /** Current bridge state. */
  get currentState(): BridgeState {
    return this.state;
  }

  /** Active D-ID stream session (null if not created). */
  get streamSession(): DidStreamSession | null {
    return this.didSession;
  }

  /**
   * Open the full pipeline for a text utterance:
   *   1. Create D-ID stream session
   *   2. Connect ElevenLabs WebSocket
   *   3. Send text for synthesis
   *
   * Returns the D-ID stream session for client-side WebRTC setup.
   */
  async openStream(text: string): Promise<DidStreamSession | null> {
    if (this.disposed) {
      throw new Error("Bridge has been disposed.");
    }
    if (this.state !== "idle" && this.state !== "disposed") {
      throw new Error("Bridge already active (state: " + this.state + ").");
    }

    if (!text.trim()) {
      return null;
    }

    // Phase 1: Create D-ID stream session
    this.setState("creating_stream");

    let didSession: DidStreamSession | null = null;
    try {
      didSession = await this.createDidStream();
    } catch (err) {
      this.handleError(err, "did_stream_create");
      // Non-fatal: we can still produce viseme events without D-ID
    }

    this.didSession = didSession;

    if (didSession) {
      this.callbacks.onStreamCreated?.(didSession);
    }

    // Phase 2: Connect ElevenLabs WebSocket
    this.setState("connecting_elevenlabs");

    const wsConfig: ElevenLabsWsConfig = {
      apiKey: this.config.elevenLabsApiKey,
      voiceId: this.config.elevenLabsVoiceId,
      modelId: this.config.elevenLabsModelId || "eleven_turbo_v2",
      outputFormat: this.config.outputFormat || "pcm_22050",
      optimizeStreamingLatency: 4,
      maxReconnectAttempts: this.config.maxReconnectAttempts ?? 5,
      reconnectBaseDelayMs: this.config.reconnectBaseDelayMs ?? 200,
      reconnectMaxDelayMs: this.config.reconnectMaxDelayMs ?? 10000,
    };

    const ws = new ElevenLabsWebSocket(wsConfig, {
      onAudioChunk: (samples, sampleRate) => {
        this.sampleRate = sampleRate;
        this.handleAudioChunk(samples);
        this.callbacks.onAudioChunk?.(samples, sampleRate);
      },
      onStateChange: (wsState: ElevenLabsWsState) => {
        if (wsState === "disconnected" || wsState === "error") {
          // Attempt to extract remaining visemes before marking done
          this.flushVisemes();
        }
      },
      onError: (err) => {
        this.handleError(err, "elevenlabs_stream");
      },
    });

    this.elevenLabsWs = ws;

    try {
      await ws.connect();
    } catch (err) {
      this.handleError(err, "elevenlabs_connect");
      throw err;
    }

    // Phase 3: Start streaming
    this.setState("streaming");
    ws.sendText(text);

    return didSession;
  }

  /**
   * Send additional text on the active stream.
   */
  sendText(text: string): void {
    if (!this.elevenLabsWs || !this.elevenLabsWs.isActive) {
      throw new Error("ElevenLabs WebSocket not connected.");
    }
    this.elevenLabsWs.sendText(text);
  }

  /**
   * Signal end of text input and flush remaining audio/visemes.
   */
  async flush(): Promise<void> {
    if (this.state !== "streaming") return;

    this.setState("flushing");

    if (this.elevenLabsWs) {
      this.elevenLabsWs.flush();

      // Wait for remaining audio to arrive
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 2000); // Max wait for flush

        const check = () => {
          if (!this.elevenLabsWs || !this.elevenLabsWs.isActive) {
            clearTimeout(timeout);
            resolve();
          }
        };

        // Poll state changes
        const interval = setInterval(check, 100);
        setTimeout(() => clearInterval(interval), 2000);

        // Also check on state change
        if (this.elevenLabsWs) {
          const origCb = (this.elevenLabsWs as unknown as { currentState?: ElevenLabsWsState }).currentState;
          check();
        }
      });
    }

    // Flush remaining viseme events
    this.flushVisemes();
    this.setState("idle");
  }

  /**
   * Dispose all resources. No further callbacks will fire.
   * Safe to call multiple times.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.elevenLabsWs) {
      this.elevenLabsWs.dispose();
      this.elevenLabsWs = null;
    }

    this.didSession = null;
    this.visemeBuffer = new Float32Array(0);
    this.pendingEvents = [];
    this.setState("disposed");
  }

  /** Expose accumulated audio for D-ID WebRTC sink (Int16 PCM). */
  getAccumulatedAudio(): ArrayBuffer | null {
    if (this.visemeBufferOffset === 0) return null;

    // Convert Float32 -> Int16
    const int16 = new Int16Array(this.visemeBufferOffset);
    for (let i = 0; i < this.visemeBufferOffset; i++) {
      const sample = Math.max(-1, Math.min(1, this.visemeBuffer[i]));
      int16[i] = sample < 0 ? sample * 32768 : sample * 32767;
    }

    return int16.buffer;
  }

  // -- Private: D-ID stream creation ------------------------------------

  private async createDidStream(): Promise<DidStreamSession> {
    const sourceUrl =
      this.config.didSourceUrl ||
      "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.png";

    const response = await fetch("https://api.d-id.com/talks/streams", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Basic " + this.config.didApiKey,
      },
      body: JSON.stringify({
        source_url: sourceUrl,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error("D-ID stream creation failed (" + response.status + "): " + text);
    }

    const payload = await response.json();

    return {
      streamId: payload.id || payload.stream_id || "",
      sessionId: payload.session_id || payload.id || payload.stream_id || "",
      offerSdp: payload.offer_sdp || payload.sdp || undefined,
      iceServers: payload.ice_servers || undefined,
    };
  }

  // -- Private: Audio -> Viseme pipeline --------------------------------

  private handleAudioChunk(samples: Float32Array): void {
    const SAMPLE_RATE = this.sampleRate;
    const MIN_DURATION_MS = this.smoothingConfig.minVisemeIntervalMs;
    const ANALYSIS_INTERVAL_MS = 10;
    const FFT_SIZE = 512;

    for (let i = 0; i < samples.length; i++) {
      if (this.visemeBufferOffset >= this.visemeBuffer.length) {
        // Rotate circular buffer
        const halfLength = Math.floor(this.visemeBuffer.length / 2);
        this.visemeBuffer.copyWithin(0, halfLength);
        this.visemeBufferOffset -= halfLength;
        this.lastVisemeStartMs -= (halfLength / SAMPLE_RATE) * 1000;
        for (const evt of this.pendingEvents) {
          evt.startMs -= (halfLength / SAMPLE_RATE) * 1000;
          evt.endMs -= (halfLength / SAMPLE_RATE) * 1000;
        }
      }

      this.visemeBuffer[this.visemeBufferOffset] = samples[i];
      this.visemeBufferOffset++;

      const accumulatedTimeMs =
        (this.visemeBufferOffset / SAMPLE_RATE) * 1000;

      // Analyze at regular intervals
      if (accumulatedTimeMs >= this.streamTimeMs + ANALYSIS_INTERVAL_MS) {
        this.streamTimeMs = accumulatedTimeMs;

        const result = this.classifyFrame();
        if (result.visemeIndex !== this.lastVisemeIndex) {
          // Close previous viseme
          if (this.lastVisemeStartMs < this.streamTimeMs) {
            const duration = this.streamTimeMs - this.lastVisemeStartMs;
            if (duration >= MIN_DURATION_MS) {
              this.pendingEvents.push({
                viseme: VisemeIndexMap[result.visemeIndex] || "sil",
                startMs: this.lastVisemeStartMs,
                endMs: this.streamTimeMs,
                confidence: result.confidence,
              });
            }
          }

          this.lastVisemeIndex = result.visemeIndex;
          this.lastVisemeStartMs = this.streamTimeMs;
        }
      }
    }

    // Clean old pending events
    this.pendingEvents = this.pendingEvents.filter(
      (e) => e.endMs > this.streamTimeMs - 2000,
    );

    // Emit smoothed events
    if (this.pendingEvents.length > 0) {
      const smoothed = smoothVisemes(
        this.pendingEvents.slice(-10),
        this.smoothingConfig,
      );

      if (smoothed.length > 0) {
        const streamId = this.didSession?.streamId || "local";
        this.callbacks.onVisemeEvents(smoothed, streamId);
      }
    }
  }

  /**
   * Simple formant-based frame classification for viseme extraction.
   * Uses energy-band analysis as a lightweight alternative to FFT.
   */
  private classifyFrame(): { visemeIndex: number; confidence: number } {
    const windowSize = Math.min(512, this.visemeBufferOffset);
    const windowStart = Math.max(0, this.visemeBufferOffset - windowSize);

    // Compute RMS energy
    let rms = 0;
    for (let i = windowStart; i < this.visemeBufferOffset; i++) {
      rms += this.visemeBuffer[i] * this.visemeBuffer[i];
    }
    rms = Math.sqrt(rms / windowSize);

    // Silence detection
    if (rms < 0.01) {
      return { visemeIndex: 0, confidence: 1.0 };
    }

    // Low-frequency energy (approximates jaw openness / F1)
    // Count zero-crossings as a proxy for frequency content
    let zeroCrossings = 0;
    for (let i = windowStart + 1; i < this.visemeBufferOffset; i++) {
      if (
        (this.visemeBuffer[i] >= 0 && this.visemeBuffer[i - 1] < 0) ||
        (this.visemeBuffer[i] < 0 && this.visemeBuffer[i - 1] >= 0)
      ) {
        zeroCrossings++;
      }
    }

    const zcr = zeroCrossings / windowSize;

    // High ZCR -> sibilants/fricatives (viseme 15-18)
    // Low ZCR -> vowels (viseme 1-8)
    // Medium -> consonants (viseme 9-14)

    if (zcr > 0.3) {
      // Sibilant region
      return { visemeIndex: 15, confidence: Math.min(1, rms * 5) };
    }

    if (zcr > 0.15) {
      // Consonant region
      return { visemeIndex: 9, confidence: Math.min(1, rms * 4) };
    }

    // Vowel region -- discriminate by RMS (loudness correlates with openness)
    if (rms > 0.5) {
      return { visemeIndex: 1, confidence: 0.9 }; // AE -- open vowel
    }
    if (rms > 0.3) {
      return { visemeIndex: 2, confidence: 0.8 }; // AA
    }
    if (rms > 0.15) {
      return { visemeIndex: 4, confidence: 0.7 }; // EY
    }

    return { visemeIndex: 6, confidence: 0.6 }; // IH -- default vowel
  }

  private flushVisemes(): void {
    if (this.lastVisemeStartMs < this.streamTimeMs) {
      const duration = this.streamTimeMs - this.lastVisemeStartMs;
      if (duration >= this.smoothingConfig.minVisemeIntervalMs) {
        this.pendingEvents.push({
          viseme: VisemeIndexMap[this.lastVisemeIndex] || "sil",
          startMs: this.lastVisemeStartMs,
          endMs: this.streamTimeMs,
          confidence: 0.8,
        });
      }
    }

    // Add trailing silence
    this.pendingEvents.push({
      viseme: "sil",
      startMs: this.streamTimeMs,
      endMs: this.streamTimeMs + 50,
      confidence: 1,
    });

    if (this.pendingEvents.length > 0) {
      const smoothed = smoothVisemes(this.pendingEvents, this.smoothingConfig);
      const streamId = this.didSession?.streamId || "local";
      this.callbacks.onVisemeEvents(smoothed, streamId);
    }

    this.pendingEvents = [];
  }

  // -- Private: State management ----------------------------------------

  private setState(newState: BridgeState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  private handleError(error: unknown, phase: BridgePhase): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.setState("error");
    this.callbacks.onError?.(err, phase);
  }
}

// -- Viseme index -> name mapping (D-ID viseme set) ---------------------

const VisemeIndexMap: Record<number, string> = {
  0: "sil",
  1: "AE",
  2: "AA",
  3: "AO",
  4: "EY",
  5: "ER",
  6: "IH",
  7: "UW",
  8: "OW",
  9: "B",
  10: "CH",
  11: "D",
  12: "DH",
  13: "F",
  14: "G",
  15: "S",
  16: "SH",
  17: "TH",
  18: "Z",
  19: "K",
  20: "P",
  21: "T",
};
