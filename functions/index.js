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
const OPENROUTER_API_KEY = defineSecret("OPENROUTER_API_KEY");

// Top open-source chat model for the MiniVic brain.
const MINIVIC_MODEL = "meta-llama/llama-3.3-70b-instruct";

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

/**
 * MiniVic brain (Phase 4 / TC-FR-CHAT). Proxies the chatbot to a top open-source
 * model on OpenRouter so the OpenRouter key stays server-side (never in the browser).
 * The client sends OpenAI-style {messages} (system prompt grounded in the curated
 * knowledge base + history + the question); we relay to OpenRouter and return {text}.
 * Same CORS / cost guards as the TTS function.
 */
exports.minivicChat = onRequest(
  { secrets: [OPENROUTER_API_KEY], region: "us-central1", maxInstances: 5, timeoutSeconds: 30, memory: "256MiB" },
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

    const incoming = req.body && Array.isArray(req.body.messages) ? req.body.messages : null;
    if (!incoming || incoming.length === 0 || incoming.length > 24) {
      res.status(400).json({ error: "messages_required" });
      return;
    }
    // Whitelist roles, coerce to strings, and bound total payload to cap cost/abuse.
    let total = 0;
    const messages = [];
    for (const m of incoming) {
      const role = m && typeof m.role === "string" ? m.role : "";
      const content = m && typeof m.content === "string" ? m.content : "";
      if (!["system", "user", "assistant"].includes(role) || !content.trim()) continue;
      const trimmed = content.slice(0, 4000);
      total += trimmed.length;
      messages.push({ role, content: trimmed });
    }
    if (messages.length === 0 || total > 16000) {
      res.status(400).json({ error: "messages_invalid" });
      return;
    }

    try {
      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY.value()}`,
          "content-type": "application/json",
          "HTTP-Referer": "https://forgotten-mistory.web.app",
          "X-Title": "MiniVic - Vikram Deshpande portfolio",
        },
        body: JSON.stringify({
          model: MINIVIC_MODEL,
          messages,
          temperature: 0.6,
          max_tokens: 512,
        }),
      });

      if (!upstream.ok) {
        const detail = (await upstream.text()).slice(0, 300);
        logger.error("OpenRouter chat failed", { status: upstream.status, detail });
        res.status(502).json({ error: "chat_upstream_failed", status: upstream.status });
        return;
      }

      const data = await upstream.json();
      const text =
        data && data.choices && data.choices[0] && data.choices[0].message
          ? String(data.choices[0].message.content || "").trim()
          : "";
      if (!text) {
        res.status(502).json({ error: "chat_empty" });
        return;
      }
      res.set("Cache-Control", "no-store");
      res.status(200).json({ text });
    } catch (err) {
      logger.error("OpenRouter chat error", err);
      res.status(500).json({ error: "chat_error" });
    }
  },
);
