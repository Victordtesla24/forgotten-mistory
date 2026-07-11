#!/usr/bin/env node
/*
 * cdp-verify.mjs — dependency-free Node ESM script that drives Cursor's in-IDE
 * Simple Browser (or any CDP target) on 127.0.0.1:9222 to load a URL, capture a
 * full-page screenshot, and collect console/log/exception diagnostics.
 *
 * Mirrors the protocol used by ~/.cursor-cdp/cdp.cjs: GET http://127.0.0.1:9222/json
 * to list targets, pick the first http(s) webview/page target with a
 * webSocketDebuggerUrl, attach via WebSocket, and drive the Page/Runtime/Log CDP
 * domains. Uses Node's built-in fetch + global WebSocket (Node 22+) — no deps.
 *
 * Usage:
 *   node scripts/verify/cdp-verify.mjs [url] [outputPngPath]
 *
 * Defaults:
 *   url            https://forgotten-mistory.web.app
 *   outputPngPath  artifacts/cdp/verify-<safe-url>.png
 *   (a sibling <outputPngPath-without-.png>.json is always written next to the
 *   screenshot with the collected console messages / exceptions)
 *
 * Exit codes:
 *   0 — page loaded, no console errors/exceptions
 *   1 — page loaded, but console errors/exceptions were present (printed)
 *   2 — :9222 unreachable or no usable CDP target found (env-not-available)
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = process.env.CDP_PORT || 9222;
const NAV_WAIT_MS = Number(process.env.NAV_WAIT_MS || 3000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function safeUrlSlug(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'target';
}

async function listTargets() {
  const res = await fetch(`http://${HOST}:${PORT}/json`);
  if (!res.ok) throw new Error(`CDP /json returned HTTP ${res.status}`);
  return res.json();
}

function pickTarget(targets) {
  const usable = targets.filter(
    (t) => t.webSocketDebuggerUrl && (t.type === 'page' || t.type === 'webview'),
  );
  return usable.find((t) => /^https?:/.test(t.url || '')) || usable[0];
}

function attach(ws) {
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id != null && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    } else if (m.method) {
      events.push(m);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  return { send, events };
}

async function main() {
  const [urlArg, outArg] = process.argv.slice(2);
  const targetUrl = urlArg || 'https://forgotten-mistory.web.app';

  let targets;
  try {
    targets = await listTargets();
  } catch (err) {
    console.error(`ENV-NOT-AVAILABLE: could not reach CDP endpoint at ${HOST}:${PORT} (${err.message})`);
    process.exit(2);
  }

  const target = pickTarget(targets);
  if (!target) {
    console.error(`ENV-NOT-AVAILABLE: no usable http(s) webview/page CDP target found on ${HOST}:${PORT}`);
    process.exit(2);
  }

  const outPngPath = outArg
    ? path.resolve(REPO_ROOT, outArg)
    : path.resolve(REPO_ROOT, 'artifacts', 'cdp', `verify-${safeUrlSlug(targetUrl)}.png`);
  const outJsonPath = outPngPath.replace(/\.png$/i, '.json');

  await mkdir(path.dirname(outPngPath), { recursive: true });

  let ws;
  try {
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('ws connect failed')), { once: true });
    });
  } catch (err) {
    console.error(`ENV-NOT-AVAILABLE: could not attach to CDP target websocket (${err.message})`);
    process.exit(2);
  }

  const c = attach(ws);

  try {
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Log.enable');

    await c.send('Page.navigate', { url: targetUrl });
    await sleep(NAV_WAIT_MS);

    const locationResult = await c.send('Runtime.evaluate', {
      expression: 'location.href',
      returnByValue: true,
    });
    const loadedUrl = locationResult?.result?.value ?? null;

    const shotResult = await c.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    await writeFile(outPngPath, Buffer.from(shotResult.data, 'base64'));

    const consoleMsgs = [];
    const exceptions = [];
    for (const e of c.events) {
      if (e.method === 'Runtime.consoleAPICalled') {
        consoleMsgs.push({
          type: e.params.type,
          text: (e.params.args || [])
            .map((a) => a.value ?? a.description ?? a.unserializableValue ?? a.type)
            .join(' '),
        });
      } else if (e.method === 'Log.entryAdded') {
        consoleMsgs.push({ type: e.params.entry.level, text: e.params.entry.text });
      } else if (e.method === 'Runtime.exceptionThrown') {
        exceptions.push(
          e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text,
        );
      }
    }

    const consoleErrors = consoleMsgs.filter((m) => /error|severe/i.test(m.type));

    const artifact = {
      requestedUrl: targetUrl,
      loadedUrl,
      target: { title: target.title, url: target.url, type: target.type },
      screenshot: path.relative(REPO_ROOT, outPngPath),
      console: { total: consoleMsgs.length, messages: consoleMsgs, errors: consoleErrors },
      exceptions,
      timestamp: new Date().toISOString(),
    };

    await writeFile(outJsonPath, JSON.stringify(artifact, null, 2));

    console.log(`loaded -> ${loadedUrl}`);
    console.log(`screenshot -> ${path.relative(REPO_ROOT, outPngPath)}`);
    console.log(`artifact -> ${path.relative(REPO_ROOT, outJsonPath)}`);

    if (consoleErrors.length > 0 || exceptions.length > 0) {
      console.error(`console errors: ${consoleErrors.length}, exceptions: ${exceptions.length}`);
      for (const m of consoleErrors) console.error(`  [console:${m.type}] ${m.text}`);
      for (const ex of exceptions) console.error(`  [exception] ${ex}`);
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  } finally {
    ws.close();
  }
}

main().catch((err) => {
  console.error('ERR:', err.message);
  process.exit(1);
});
