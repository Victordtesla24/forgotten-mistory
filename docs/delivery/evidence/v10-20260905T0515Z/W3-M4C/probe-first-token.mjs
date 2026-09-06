/**
 * probe-first-token.mjs — reviewer-owned first-token reader for G-M4 (task t_w3_m4r).
 *
 * Written by the reviewer (rev-w3-m4), not by the implementer, so the numbers in
 * ../M4/timings.json do not depend on the measuring code the change shipped with
 * (docs/delivery/evidence/v10-20260905T0515Z/W1-M4B/00-first-token-reader.mjs).
 *
 * One run per process. A process is the "fresh context": a new undici agent, a new
 * TLS session, no keep-alive socket carried over from the previous run.
 *
 * The request is byte-for-byte the shape the browser sends (lib/miniVicBrain.ts
 * callChatRoute): POST, Content-Type: application/json,
 * Accept: text/event-stream, application/json, body {messages, mode, stream:true}.
 *
 * Timings, all from the same monotonic t0 taken immediately before fetch():
 *   headersMs    response headers land (the function writes SSE headers on its
 *                FIRST fragment — functions/index.js beginStream — so on a
 *                streaming route this is already ~ first token)
 *   firstChunkMs first body byte
 *   firstTokenMs first non-empty {delta} payload  <-- the gate's number
 *   lastTokenMs  last non-empty {delta}
 *   totalMs      stream end
 * Buffered is not asserted, it is derived: firstChunkMs === lastTokenMs and
 * totalMs - firstTokenMs <= 50 ms means the edge held the whole body.
 *
 * Usage:
 *   node probe-first-token.mjs --target=origin|hosting --warm=0|1 --label=NN-name --out=DIR
 * No key, header or secret of any kind is read, sent or printed: both endpoints
 * are public.
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "1"] = a.replace(/^--/, "").split("=");
    return [k, v];
  }),
);

const ORIGIN_BASE = "https://minivicchat-hjdyjsrzvq-uc.a.run.app";
const HOSTING_BASE = "https://forgotten-mistory.web.app";

const target = args.target === "hosting" ? "hosting" : "origin";
const warm = args.warm === "1" || args.warm === "true";
const label = args.label || `${target}-${warm ? "warm" : "cold"}`;
const outDir = args.out || ".";
const question =
  args.q ||
  "In one sentence, what did Vikram do at the ATO?";

const urls =
  target === "origin"
    ? { warmUrl: `${ORIGIN_BASE}/?warm=1`, postUrl: `${ORIGIN_BASE}/` }
    : {
        warmUrl: `${HOSTING_BASE}/api/chat?warm=1`,
        // The exact URL the shipped client uses for the fallback send
        // (lib/miniVicRoute.mjs HOSTING_CHAT_SEND_URL).
        postUrl: `${HOSTING_BASE}/api/chat?route=hosting`,
      };

const out = {
  label,
  at: new Date().toISOString(),
  target,
  warmPrimed: warm,
  question,
  ...urls,
  warmStatus: null,
  warmMs: null,
  status: null,
  contentType: null,
  headersMs: null,
  firstChunkMs: null,
  firstTokenMs: null,
  lastTokenMs: null,
  totalMs: null,
  deltas: 0,
  chars: 0,
  provider: null,
  model: null,
  route: null,
  max_tokens: null,
  attempts: null,
  buffered: null,
  answer: "",
  rawFrames: [],
  error: null,
};

try {
  if (warm) {
    const w0 = performance.now();
    const wres = await fetch(urls.warmUrl, { method: "GET", cache: "no-store" });
    await wres.arrayBuffer();
    out.warmStatus = wres.status;
    out.warmMs = Math.round(performance.now() - w0);
    // The browser fires the warm ping when the panel opens and the visitor then
    // types; 400 ms stands in for that gap without inventing a long one.
    await new Promise((r) => setTimeout(r, 400));
  }

  const body = JSON.stringify({
    messages: [{ role: "user", content: question }],
    mode: "hiring",
    stream: true,
  });

  const t0 = performance.now();
  const res = await fetch(urls.postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream, application/json",
    },
    body,
  });
  out.headersMs = Math.round(performance.now() - t0);
  out.status = res.status;
  out.contentType = res.headers.get("content-type");

  const decoder = new TextDecoder();
  let buffer = "";
  const drain = (block) => {
    for (const line of block.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      out.rawFrames.push({ ms: Math.round(performance.now() - t0), payload });
      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      if (typeof parsed.delta === "string" && parsed.delta.length) {
        if (out.firstTokenMs === null) out.firstTokenMs = Math.round(performance.now() - t0);
        out.lastTokenMs = Math.round(performance.now() - t0);
        out.deltas += 1;
        out.chars += parsed.delta.length;
        out.answer += parsed.delta;
      }
      if (parsed.done === true) {
        out.provider = parsed.provider ?? null;
        out.model = parsed.model ?? null;
        out.route = parsed.route ?? null;
        out.max_tokens = parsed.max_tokens ?? null;
        out.attempts = parsed.attempts ?? null;
      }
      if (parsed.error) out.error = parsed.error;
    }
  };

  if ((out.contentType || "").includes("text/event-stream")) {
    for await (const chunk of res.body) {
      if (out.firstChunkMs === null) out.firstChunkMs = Math.round(performance.now() - t0);
      buffer += decoder.decode(chunk, { stream: true });
      let split = buffer.indexOf("\n\n");
      while (split !== -1) {
        drain(buffer.slice(0, split));
        buffer = buffer.slice(split + 2);
        split = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim()) drain(buffer);
  } else {
    const text = await res.text();
    out.firstChunkMs = Math.round(performance.now() - t0);
    try {
      const json = JSON.parse(text);
      out.answer = json.text ?? "";
      out.provider = json.provider ?? null;
      out.model = json.model ?? null;
      out.route = json.route ?? null;
      out.max_tokens = json.max_tokens ?? null;
      out.attempts = json.attempts ?? null;
      // A non-streamed JSON reply has no token boundary earlier than its body.
      out.firstTokenMs = out.firstChunkMs;
      out.lastTokenMs = out.firstChunkMs;
      out.chars = String(out.answer).length;
    } catch {
      out.error = `non-json body: ${text.slice(0, 200)}`;
    }
  }
  out.totalMs = Math.round(performance.now() - t0);
  out.buffered =
    out.firstChunkMs !== null &&
    out.lastTokenMs !== null &&
    out.firstChunkMs === out.lastTokenMs &&
    out.totalMs - (out.firstTokenMs ?? 0) <= 50;
} catch (err) {
  out.error = String(err && err.message ? err.message : err);
}

const { writeFileSync } = await import("node:fs");
const path = `${outDir}/${label}.json`;
writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`);
const { rawFrames, ...summary } = out;
console.log(JSON.stringify({ ...summary, frames: rawFrames.length, file: path }, null, 2));
