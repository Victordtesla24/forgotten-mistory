// Independent first-token reader — reviewer rev-97e19d07-w1. Read-only probe.
// usage: node ft.mjs <label> <warmUrl|-> <sendUrl>
import { performance } from 'node:perf_hooks';

const [, , label, warmUrl, sendUrl] = process.argv;

async function warm(url) {
  if (!url || url === '-') return null;
  const t0 = performance.now();
  try {
    const r = await fetch(url, { method: 'GET', cache: 'no-store' });
    const buf = await r.arrayBuffer();
    return { url, status: r.status, ms: Math.round(performance.now() - t0), bytes: buf.byteLength };
  } catch (e) {
    return { url, status: 'ERR', ms: Math.round(performance.now() - t0), error: String(e && e.message) };
  }
}

async function send(url) {
  const body = JSON.stringify({
    messages: [{ role: 'user', content: 'What did Vikram do at ANZ?' }],
    mode: 'hiring',
    stream: true,
  });
  const t0 = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
    body,
  });
  const headersMs = Math.round(performance.now() - t0);
  const ctype = res.headers.get('content-type') || '';
  let firstTokenMs = null, provider = null, attempts = null, text = '', doneEvent = null, firstChunkMs = null;
  if (ctype.includes('text/event-stream')) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (firstChunkMs === null) firstChunkMs = Math.round(performance.now() - t0);
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, i); buf = buf.slice(i + 2);
        for (const line of frame.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          let p; try { p = JSON.parse(raw); } catch { continue; }
          if (typeof p.delta === 'string' && p.delta) {
            if (firstTokenMs === null) firstTokenMs = Math.round(performance.now() - t0);
            text += p.delta;
          }
          if (p.provider) provider = String(p.provider);
          if (Array.isArray(p.attempts)) attempts = p.attempts;
          if (p.done || p.type === 'done' || p.event === 'done') doneEvent = p;
        }
      }
    }
  } else {
    const j = await res.json().catch(() => ({}));
    firstTokenMs = Math.round(performance.now() - t0);
    provider = j.provider ? String(j.provider) : null;
    attempts = Array.isArray(j.attempts) ? j.attempts : null;
    text = j.text || '';
  }
  const totalMs = Math.round(performance.now() - t0);
  return { url, status: res.status, ctype, headersMs, firstChunkMs, firstTokenMs, totalMs, provider, attempts, doneEvent, textLen: text.length, textHead: text.slice(0, 90) };
}

const out = { label, at: new Date().toISOString(), warm: await warm(warmUrl) };
if (warmUrl && warmUrl !== '-') await new Promise((r) => setTimeout(r, 1500));
out.sendAt = new Date().toISOString();
out.send = await send(sendUrl);
console.log(JSON.stringify(out));
