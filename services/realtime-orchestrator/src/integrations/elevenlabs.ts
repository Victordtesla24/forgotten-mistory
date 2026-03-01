import type { TtsSynthesisResult } from "../types.js";
import { normalizeProviderError, providerErrorFromResponse } from "../lib/provider-error.js";

type ElevenLabsOptions = {
  apiKey?: string;
  voiceId?: string;
  optimizeStreamingLatency?: number;
};

export async function synthesizeElevenLabsStream(
  text: string,
  options: ElevenLabsOptions
): Promise<TtsSynthesisResult | null> {
  if (!options.apiKey || !options.voiceId || !text.trim()) {
    return null;
  }

  try {
    const startedAt = Date.now();
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${options.voiceId}/stream`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "xi-api-key": options.apiKey
      },
      body: JSON.stringify({
        text,
        optimize_streaming_latency: options.optimizeStreamingLatency ?? 3,
        output_format: "mp3_44100_128",
        model_id: "eleven_turbo_v2"
      })
    });

    if (!response.ok || !response.body) {
      throw await providerErrorFromResponse("elevenlabs", response, "ElevenLabs stream failed");
    }

    const chunks: Buffer[] = [];
    const reader = response.body.getReader();
    let firstByteAtMs = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      if (!firstByteAtMs) {
        firstByteAtMs = Date.now();
      }
      chunks.push(Buffer.from(value));
    }

    if (chunks.length === 0) {
      return null;
    }

    const merged = Buffer.concat(chunks);
    return {
      audioBase64: merged.toString("base64"),
      mimeType: "audio/mpeg",
      ttfbMs: (firstByteAtMs || Date.now()) - startedAt
    };
  } catch (error) {
    throw normalizeProviderError(error, "elevenlabs");
  }
}
