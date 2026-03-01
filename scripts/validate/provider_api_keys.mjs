#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_ENV_PATH = path.join(ROOT_DIR, ".env");
const TIMEOUT_MS = 15000;

function parseDotEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timeout);
  }
}

function summarizeBody(text) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > 220 ? `${normalized.slice(0, 220)}...` : normalized;
}

async function validateOpenAI(apiKey) {
  // OpenAI API docs: https://platform.openai.com/docs/api-reference/models/list
  const { response, text } = await fetchWithTimeout("https://api.openai.com/v1/models", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: "openai",
      status: response.status,
      message: summarizeBody(text) || "OpenAI model listing failed"
    };
  }

  return { ok: true, provider: "openai", status: response.status, message: "Key accepted by /v1/models" };
}

async function validateGemini(apiKey) {
  // Gemini API docs: https://ai.google.dev/api/models#method:-models.list
  const { response, text } = await fetchWithTimeout("https://generativelanguage.googleapis.com/v1beta/models", {
    method: "GET",
    headers: { "x-goog-api-key": apiKey }
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: "gemini",
      status: response.status,
      message: summarizeBody(text) || "Gemini model listing failed"
    };
  }

  return { ok: true, provider: "gemini", status: response.status, message: "Key accepted by /v1beta/models" };
}

async function validateElevenLabs(apiKey) {
  // ElevenLabs docs: https://elevenlabs.io/docs/api-reference/models/get
  const { response, text } = await fetchWithTimeout("https://api.elevenlabs.io/v1/models", {
    method: "GET",
    headers: { "xi-api-key": apiKey }
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: "elevenlabs",
      status: response.status,
      message: summarizeBody(text) || "ElevenLabs model listing failed"
    };
  }

  return { ok: true, provider: "elevenlabs", status: response.status, message: "Key accepted by /v1/models" };
}

async function validateDid(apiKey) {
  // D-ID API docs: https://docs.d-id.com/reference/api-keys-overview
  const { response, text } = await fetchWithTimeout("https://api.d-id.com/agents", {
    method: "GET",
    headers: { Authorization: `Basic ${apiKey}` }
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: "d-id",
      status: response.status,
      message: summarizeBody(text) || "D-ID agents listing failed"
    };
  }

  return { ok: true, provider: "d-id", status: response.status, message: "Key accepted by /agents" };
}

function printResults(results) {
  const rows = results.map((r) => ({
    provider: r.provider,
    status: r.ok ? "PASS" : "FAIL",
    http: r.status,
    message: r.message
  }));
  console.table(rows);
}

async function main() {
  const envPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ENV_PATH;
  const fileEnv = fs.existsSync(envPath) ? parseDotEnv(envPath) : {};
  if (!fs.existsSync(envPath)) {
    console.warn(`Env file not found at ${envPath}; falling back to process environment variables.`);
  }
  const env = {
    ...fileEnv,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || fileEnv.OPENAI_API_KEY || "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || fileEnv.GEMINI_API_KEY || "",
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || fileEnv.ELEVENLABS_API_KEY || "",
    DID_API_KEY: process.env.DID_API_KEY || fileEnv.DID_API_KEY || ""
  };
  const checks = [];

  if (env.OPENAI_API_KEY) checks.push({ provider: "openai", run: () => validateOpenAI(env.OPENAI_API_KEY) });
  if (env.GEMINI_API_KEY) checks.push({ provider: "gemini", run: () => validateGemini(env.GEMINI_API_KEY) });
  if (env.ELEVENLABS_API_KEY) checks.push({ provider: "elevenlabs", run: () => validateElevenLabs(env.ELEVENLABS_API_KEY) });
  if (env.DID_API_KEY) checks.push({ provider: "d-id", run: () => validateDid(env.DID_API_KEY) });

  if (checks.length === 0) {
    console.error("No provider API keys found in env file or process env. Expected one or more of OPENAI_API_KEY, GEMINI_API_KEY, ELEVENLABS_API_KEY, DID_API_KEY.");
    process.exit(1);
  }

  const settled = await Promise.allSettled(checks.map((c) => c.run()));
  const results = settled.map((s, idx) => {
    if (s.status === "fulfilled") return s.value;
    const provider = checks[idx]?.provider || "unknown";
    return {
      ok: false,
      provider,
      status: 0,
      message: String(s.reason)
    };
  });

  printResults(results);

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`Provider API validation failed for: ${failed.map((f) => f.provider).join(", ")}`);
    process.exit(1);
  }

  console.log("All configured provider API keys validated successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
