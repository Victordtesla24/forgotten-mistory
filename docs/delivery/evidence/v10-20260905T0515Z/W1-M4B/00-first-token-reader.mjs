/**
 * 00-first-token-reader.mjs — W1-M4B's own first-token reader (task t_w1_m4b S-5/S-7).
 *
 * Written for this task; it does not reuse the implementer probes of W1-R2C nor
 * the reviewer's 00-first-token-reader.mjs. It warm-pings exactly as the shipped
 * client does (GET ?warm=1, read the body, sleep 1.5 s), then POSTs the same
 * body MiniVicBot sends and timestamps: response headers, the first SSE chunk on
 * the socket, the first `delta` fragment carrying real text, the last delta, and
 * the end of the body. On a streaming route those separate; on a buffered route
 * they collapse, which is the whole finding this task is about.
 *
 * Usage: node 00-first-token-reader.mjs <label> <warmUrl> <postUrl> [question]
 * Writes <label>.json to the cwd and prints the same object.
 */
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const [, , label, warmUrl, postUrl, question] = process.argv;
if (!label || !warmUrl || !postUrl) {
  console.error('usage: node 00-first-token-reader.mjs <label> <warmUrl> <postUrl> [question]');
  process.exit(2);
}
const QUESTION = question || 'In one sentence, what did Vikram do at the ATO?';

const warmStartedAt = Date.now();
const warmRes = await fetch(warmUrl, { method: 'GET', cache: 'no-store' });
await warmRes.arrayBuffer();
const warmMs = Date.now() - warmStartedAt;
await sleep(1500);

const body = JSON.stringify({
  messages: [{ role: 'user', content: QUESTION }],
  mode: 'hiring',
  stream: true,
});
const startedAt = Date.now();
const res = await fetch(postUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'text/event-stream, application/json' },
  body,
});
const headersMs = Date.now() - startedAt;
const contentType = res.headers.get('content-type') || '';

let firstChunkMs = null;
let firstTokenMs = null;
let lastTokenMs = null;
let text = '';
let provider = null;
let model = null;
let route = null;
let maxTokens = null;
let attempts = null;
let deltas = 0;

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
const drain = (block) => {
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload) continue;
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      continue;
    }
    if (typeof parsed.delta === 'string' && parsed.delta) {
      if (firstTokenMs === null) firstTokenMs = Date.now() - startedAt;
      lastTokenMs = Date.now() - startedAt;
      deltas += 1;
      text += parsed.delta;
    }
    if (parsed.provider) provider = parsed.provider;
    if (parsed.model) model = parsed.model;
    if (parsed.route) route = parsed.route;
    if (typeof parsed.max_tokens === 'number') maxTokens = parsed.max_tokens;
    if (Array.isArray(parsed.attempts)) attempts = parsed.attempts;
  }
};
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  if (firstChunkMs === null) firstChunkMs = Date.now() - startedAt;
  buffer += decoder.decode(value, { stream: true });
  let split = buffer.indexOf('\n\n');
  while (split !== -1) {
    drain(buffer.slice(0, split));
    buffer = buffer.slice(split + 2);
    split = buffer.indexOf('\n\n');
  }
}
if (buffer.trim()) drain(buffer);
const totalMs = Date.now() - startedAt;

// Generation throughput, measured rather than assumed: characters produced
// between the first and the last delta. Only meaningful on a streaming route;
// on a buffered one first == last and this is reported as null.
const streamedSpanMs = firstTokenMs !== null && lastTokenMs !== null ? lastTokenMs - firstTokenMs : null;
const charsPerSecond = streamedSpanMs && streamedSpanMs > 0 ? Math.round((text.length / streamedSpanMs) * 1000) : null;

const out = {
  label,
  at: new Date(startedAt).toISOString(),
  warmUrl,
  postUrl,
  warmStatus: warmRes.status,
  warmMs,
  status: res.status,
  contentType,
  headersMs,
  firstChunkMs,
  firstTokenMs,
  lastTokenMs,
  totalMs,
  streamedSpanMs,
  charsPerSecond,
  deltas,
  chars: text.length,
  provider,
  model,
  route,
  max_tokens: maxTokens,
  attempts,
  answer: text,
};
writeFileSync(`${label}.json`, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify(out, null, 2));
