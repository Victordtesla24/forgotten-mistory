#!/usr/bin/env node
// first-token.mjs — independent reviewer re-run of the G-M4 cold first-token protocol.
// Written by rev-ec53e2b4-w1. Reuses NO number from the implementer's run.
//
// Timestamps the first NON-EMPTY `delta` on the SSE body (not the headers, not `done`),
// on BOTH routes:
//   origin  = https://minivicchat-hjdyjsrzvq-uc.a.run.app   (route the shipped client tries first)
//   hosting = https://forgotten-mistory.web.app/api/chat    (GAP-BACKLOG G-M4's named route)
//
// usage: node first-token.mjs <origin|hosting|both> <n> <label>
// Prints one JSON line per sample and a summary line.

const ROUTES = {
  origin: 'https://minivicchat-hjdyjsrzvq-uc.a.run.app/',
  hosting: 'https://forgotten-mistory.web.app/api/chat',
};

const QUESTION = 'In one sentence, what did Vikram do at the ATO?';

async function sample(route, url) {
  const t0 = process.hrtime.bigint();
  const ms = () => Number(process.hrtime.bigint() - t0) / 1e6;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify({ messages: [{ role: 'user', content: QUESTION }], stream: true }),
  });
  const tHeaders = ms();
  if (!res.body) throw new Error(`no body, status ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let tFirstToken = null;
  let firstTokenText = null;
  let provider = null;
  let model = null;
  let chunks = 0;
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks += 1;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      let evt;
      try { evt = JSON.parse(line.slice(5).trim()); } catch { continue; }
      if (typeof evt.delta === 'string' && evt.delta.length > 0) {
        text += evt.delta;
        if (tFirstToken === null) { tFirstToken = ms(); firstTokenText = evt.delta; }
      }
      if (evt.done) { provider = evt.provider ?? null; model = evt.model ?? null; }
    }
  }
  const tTotal = ms();
  return {
    route,
    status: res.status,
    contentType: res.headers.get('content-type'),
    xTimer: res.headers.get('x-timer'),
    headers_ms: +tHeaders.toFixed(1),
    first_token_ms: tFirstToken === null ? null : +tFirstToken.toFixed(1),
    total_ms: +tTotal.toFixed(1),
    network_chunks: chunks,          // 1 => the stream was collapsed/buffered
    first_token_text: firstTokenText,
    provider,
    model,
    chars: text.length,
  };
}

const which = process.argv[2] || 'both';
const n = Number(process.argv[3] || 7);
const label = process.argv[4] || '';
const routes = which === 'both' ? ['origin', 'hosting'] : [which];

const all = {};
for (const r of routes) {
  all[r] = [];
  for (let i = 1; i <= n; i++) {
    let row;
    try { row = await sample(r, ROUTES[r]); }
    catch (e) { row = { route: r, error: String(e && e.message || e) }; }
    row.i = i; row.label = label; row.at = new Date().toISOString();
    all[r].push(row);
    console.log(JSON.stringify(row));
    if (i < n) await new Promise((res) => setTimeout(res, 1200));
  }
}

for (const r of routes) {
  const v = all[r].map((x) => x.first_token_ms).filter((x) => typeof x === 'number').sort((a, b) => a - b);
  if (!v.length) { console.log(JSON.stringify({ summary: r, error: 'no samples' })); continue; }
  const med = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  console.log(JSON.stringify({
    summary: r, label, n: v.length,
    samples_ms: v, min_ms: v[0], median_ms: med, max_ms: v[v.length - 1],
    all_under_1500ms: v[v.length - 1] < 1500,
    over_1500ms_count: v.filter((x) => x >= 1500).length,
    providers: [...new Set(all[r].map((x) => x.provider))],
  }));
}
