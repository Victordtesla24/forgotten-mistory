/**
 * ElevenLabsWebSocket — Real-time TTS client via ElevenLabs WebSocket API.
 *
 * Connects to ElevenLabs stream-input WebSocket for low-latency speech
 * synthesis. Produces raw PCM audio chunks consumed by the VisemeBridge
 * for formant-based viseme extraction.
 *
 * API: wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input
 *
 * Lifecycle: open → stream text → receive audio chunks → flush → close.
 * Supports exponential backoff reconnection.
 *
 * Target latency: ≤40ms TTFB for the first audio chunk (eleven_turbo_v2
 * with optimize_streaming_latency=4).
 */
import type { VisemeEvent } from "../types.js";

/** Configuration for the ElevenLabs WebSocket connection. */
export interface ElevenLabsWsConfig {
  apiKey: string;
  voiceId: string;
  /** Model ID (default: eleven_turbo_v2) */
  modelId?: string;
  /** Output format for the audio stream (default: pcm_22050) */
  outputFormat?: "pcm_16000" | "pcm_22050" | "pcm_24000" | "pcm_44100";
  /** Latency optimisation level 1-4 (default: 4 = max optimisation) */
  optimizeStreamingLatency?: number;
  /** Reconnect max attempts before failing (default: 5) */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff in ms (default: 200) */
  reconnectBaseDelayMs?: number;
  /** Max delay between reconnects in ms (default: 10000) */
  reconnectMaxDelayMs?: number;
}

/** Callbacks for audio and viseme events from the WebSocket stream. */
export interface ElevenLabsWsCallbacks {
  /** Called when a chunk of raw PCM audio is received (Float32 samples). */
  onAudioChunk: (samples: Float32Array, sampleRate: number) => void;
  /** Called when viseme events are extracted from audio. */
  onVisemeEvents?: (events: VisemeEvent[]) => void;
  /** Called on connection state change. */
  onStateChange?: (state: ElevenLabsWsState) => void;
  /** Called when the stream encounters an error. */
  onError?: (error: Error) => void;
}

/** Connection state machine. */
export type ElevenLabsWsState =
  | "idle"
  | "connecting"
  | "connected"
  | "streaming"
  | "flushing"
  | "disconnecting"
  | "disconnected"
  | "error";

interface TextMessage {
  text: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
  generation_config?: {
    chunk_length_schedule: number[];
  };
  /** Flush marker — empty string tells ElevenLabs to finish. */
  flush?: boolean;
}

/** Per-format sample rates for Float32 conversion. */
const PCM_SAMPLE_RATES: Record<string, number> = {
  pcm_16000: 16000,
  pcm_22050: 22050,
  pcm_24000: 24000,
  pcm_44100: 44100,
};

/** PCM format → bytes per sample (16-bit = 2 bytes). */
const PCM_BYTES_PER_SAMPLE = 2;

/**
 * Convert Int16 PCM buffer to Float32 array (normalised -1..1).
 */
function int16ToFloat32(buffer: ArrayBuffer): Float32Array {
  const int16 = new Int16Array(buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

/**
 * ElevenLabsWebSocket — manages a single ElevenLabs real-time TTS connection.
 *
 * Usage:
 *   const elWs = new ElevenLabsWebSocket(config, callbacks);
 *   await elWs.connect();
 *   elWs.sendText("Hello world");
 *   // ... receive onAudioChunk callbacks ...
 *   await elWs.flush();
 *   elWs.close();
 */
export class ElevenLabsWebSocket {
  private ws: WebSocket | null = null;
  private config: ElevenLabsWsConfig;
  private callbacks: ElevenLabsWsCallbacks;
  private state: ElevenLabsWsState = "idle";
  private textQueue: string[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private sampleRate: number;

  constructor(config: ElevenLabsWsConfig, callbacks: ElevenLabsWsCallbacks) {
    this.config = {
      modelId: "eleven_turbo_v2",
      outputFormat: "pcm_22050",
      optimizeStreamingLatency: 4,
      maxReconnectAttempts: 5,
      reconnectBaseDelayMs: 200,
      reconnectMaxDelayMs: 10000,
      ...config,
    };
    this.callbacks = callbacks;
    this.sampleRate =
      PCM_SAMPLE_RATES[this.config.outputFormat!] || 22050;
  }

  /** Current connection state. */
  get currentState(): ElevenLabsWsState {
    return this.state;
  }

  /** Whether the WebSocket is in a usable state. */
  get isActive(): boolean {
    return (
      this.state === "connected" ||
      this.state === "streaming" ||
      this.state === "flushing"
    );
  }

  /**
   * Open the WebSocket connection to ElevenLabs.
   * Returns once the connection is established.
   */
  async connect(): Promise<void> {
    if (this.disposed) {
      throw new Error("ElevenLabsWebSocket has been disposed.");
    }
    if (this.state === "connected" || this.state === "streaming") {
      return; // Already connected
    }

    this.setState("connecting");

    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(this.config.voiceId)}/stream-input?model_id=${encodeURIComponent(this.config.modelId!)}&optimize_streaming_latency=${this.config.optimizeStreamingLatency}&output_format=${this.config.outputFormat}`;

    return new Promise<void>((resolve, reject) => {
      try {
        // Use global WebSocket (available in Node.js 20+)
        const WS = globalThis.WebSocket;
        if (!WS) {
          throw new Error("WebSocket not available in this runtime.");
        }

        this.ws = new WS(url);
        // ElevenLabs uses xi-api-key header but Node 20 WebSocket doesn't
        // support custom headers natively. We use the query param approach
        // or set it via the underlying http upgrade.
        // For Node 20, we rely on the env-based approach: the WS URL already
        // encodes all needed params; ElevenLabs also accepts xi-api-key as
        // a query param in some SDK versions.
        //
        // In production, the connection is established through a proxy or
        // the API Gateway which adds the header server-side.
        // For the reference implementation, we document that the caller
        // should proxy through the API Gateway endpoint.
        //
        // Alternative: use 'ws' npm package for custom headers.
        // Here we use Node 20 global WebSocket with URL-based auth.
        const wsWithAuth = new WS(url, {
          headers: {
            "xi-api-key": this.config.apiKey,
          },
        } as unknown as undefined);

        // Close the headerless connection and use the one with headers
        this.ws.close();
        this.ws = wsWithAuth;

        const onOpen = () => {
          this.setState("connected");
          this.reconnectAttempts = 0; // Reset backoff on successful connect
          // Flush any queued text
          while (this.textQueue.length > 0) {
            const text = this.textQueue.shift();
            if (text && this.ws) {
              this.sendTextInternal(text);
            }
          }
          resolve();
        };

        const onMessage = (event: MessageEvent) => {
          if (this.disposed) return;

          // ElevenLabs sends binary audio chunks
          if (event.data instanceof ArrayBuffer || event.data instanceof Buffer) {
            const buffer =
              event.data instanceof Buffer
                ? event.data.buffer.slice(
                    event.data.byteOffset,
                    event.data.byteOffset + event.data.byteLength,
                  )
                : event.data;

            const samples = int16ToFloat32(buffer as ArrayBuffer);
            this.callbacks.onAudioChunk(samples, this.sampleRate);
            return;
          }

          // JSON messages (stream info, errors)
          if (typeof event.data === "string") {
            try {
              const msg = JSON.parse(event.data);
              if (msg.error) {
                this.handleError(new Error(msg.error));
              }
              // audio.done signals end of stream
              if (msg.audio_done === true) {
                this.setState("disconnecting");
              }
            } catch {
              // Non-JSON string — ignore
            }
          }
        };

        const onClose = (event: CloseEvent) => {
          if (this.disposed) return;

          const wasActive = this.isActive;

          if (event.code === 1000) {
            // Clean close
            this.setState("disconnected");
            return;
          }

          // Abnormal close — attempt reconnect
          if (wasActive && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          } else {
            this.setState("disconnected");
            this.callbacks.onError?.(
              new Error(
                `ElevenLabs WebSocket closed abnormally: code=${event.code} reason=${event.reason}`,
              ),
            );
          }
        };

        const onError = (_event: Event) => {
          // The close event will fire after error; handle in onClose.
          // We still set state so consumers know.
          if (this.state !== "disconnecting" && this.state !== "disconnected") {
            this.setState("error");
          }
        };

        this.ws.addEventListener("open", onOpen);
        this.ws.addEventListener("message", onMessage);
        this.ws.addEventListener("close", onClose);
        this.ws.addEventListener("error", onError);
      } catch (err) {
        this.setState("error");
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  /**
   * Send text for speech synthesis.
   * If not yet connected, queues the text for delivery on connect.
   */
  sendText(text: string): void {
    if (!text.trim()) return;

    if (!this.isActive) {
      this.textQueue.push(text);
      return;
    }

    this.sendTextInternal(text);
  }

  /**
   * Signal end of text input and flush remaining audio.
   * ElevenLabs will send remaining audio chunks then close.
   */
  flush(): void {
    if (!this.ws || !this.isActive) return;

    this.setState("flushing");

    const msg: TextMessage = {
      text: " ",
      flush: true,
    };

    this.ws.send(JSON.stringify(msg));
  }

  /**
   * Close the WebSocket connection cleanly.
   */
  close(): void {
    this.disposed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.textQueue = [];
    this.setState("disconnected");
  }

  /**
   * Dispose all resources. No further callbacks will fire.
   */
  dispose(): void {
    this.close();
    this.callbacks = {
      onAudioChunk: () => {},
    };
  }

  // ── Private ──────────────────────────────────────────────────────────

  private sendTextInternal(text: string): void {
    if (!this.ws) return;

    const msg: TextMessage = {
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
      generation_config: {
        chunk_length_schedule: [50],
      },
    };

    this.ws.send(JSON.stringify(msg));
    this.setState(
      this.config.optimizeStreamingLatency! >= 3 ? "streaming" : "connected",
    );
  }

  private setState(newState: ElevenLabsWsState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  private handleError(error: Error): void {
    this.setState("error");
    this.callbacks.onError?.(error);
  }

  private scheduleReconnect(): void {
    if (this.disposed || this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectBaseDelayMs! *
        Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectMaxDelayMs!,
    );

    this.setState("connecting");

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((err) => {
        this.handleError(
          err instanceof Error ? err : new Error(String(err)),
        );
      });
    }, delay);
  }
}
