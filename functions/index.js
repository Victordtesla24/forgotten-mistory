/**
 * MiniVic cloned-voice TTS proxy (Phase 4 / Stage 2, TC-FR-VOICE-DYN).
 *
 * The static Firebase site cannot hold the ElevenLabs secret, so dynamic answers
 * are voiced through this server-side function: the browser POSTs answer text to
 * the same-origin `/api/tts` (Hosting rewrite → this function), and we return MP3
 * audio rendered in Vikram's cloned voice. The chatbot plays it and drives the
 * holographic mouth-canvas from the audio amplitude (realtime, approximate lip-sync).
 *
 * Security/cost guards: the ElevenLabs key lives only in Secret Manager (never the
 * client), CORS is locked to the production origins (+ localhost for tests), text is
 * length-capped, and maxInstances caps runaway spend. Voice ID is an ElevenLabs
 * identifier (not a secret — useless without the key).
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const ELEVENLABS_API_KEY = defineSecret("ELEVENLABS_API_KEY");

// Vikram's cloned voice (ElevenLabs voice ID). Not a secret — unusable without the key.
const VOICE_ID = "0ZJ4kFDo6bZUNQsuULOW";
// Low-latency model for realtime chat replies.
const MODEL_ID = "eleven_turbo_v2_5";
const MAX_CHARS = 600;

const ALLOWED_ORIGINS = new Set([
  "https://forgotten-mistory.web.app",
  "https://forgotten-mistory.firebaseapp.com",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

exports.elevenLabsTts = onRequest(
  { secrets: [ELEVENLABS_API_KEY], region: "us-central1", maxInstances: 5, timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    const raw = typeof req.body === "object" && req.body ? req.body.text : undefined;
    const text = (raw == null ? "" : String(raw)).trim().slice(0, MAX_CHARS);
    if (!text) {
      res.status(400).json({ error: "text_required" });
      return;
    }

    try {
      const upstream = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY.value(),
            "content-type": "application/json",
            accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: MODEL_ID,
            voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.0, use_speaker_boost: true },
          }),
        },
      );

      if (!upstream.ok) {
        const detail = (await upstream.text()).slice(0, 300);
        logger.error("ElevenLabs TTS failed", { status: upstream.status, detail });
        res.status(502).json({ error: "tts_upstream_failed", status: upstream.status });
        return;
      }

      const audio = Buffer.from(await upstream.arrayBuffer());
      res.set("Content-Type", "audio/mpeg");
      res.set("Cache-Control", "public, max-age=86400");
      res.status(200).send(audio);
    } catch (err) {
      logger.error("ElevenLabs TTS error", err);
      res.status(500).json({ error: "tts_error" });
    }
  },
);
