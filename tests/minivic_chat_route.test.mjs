/**
 * G-M3b — which URL a MiniVic send goes to, and what happens when it fails.
 *
 * G-M3 proved (docs/delivery/evidence/v10-20260905T0515Z/G-M3/08-decision-first-token.md)
 * that the *same function*, reached two ways, behaves differently: direct to the
 * Cloud Run origin the SSE reply's first byte lands at 665 ms (P50, n=5); through
 * the Firebase Hosting rewrite the edge holds every frame and the first byte is
 * also the last, at 1836 ms. R3 asks for a first word inside ~1.5 s, so the send
 * has to prefer the origin.
 *
 * Preferring it is only safe if the fallback is real. The run.app hostname is
 * deploy-specific, the browser's request to it is cross-origin (CORS can be
 * withdrawn by a config change nobody remembers making), and a visitor behind a
 * corporate proxy may simply not reach it. In every one of those cases the send
 * must still be answered — through the Hosting rewrite, which is same-origin and
 * always reachable when the site itself is.
 *
 * These tests own the *policy*: the order of the ladder, when the origin is not
 * eligible at all, and that a failing rung really does hand over to the next one.
 * The wire order in a browser is asserted by tests/e2e/minivic-send-path.spec.ts
 * (MV-ORIGIN-01); the live first-token measurement is in
 * docs/delivery/evidence/v10-20260905T0515Z/G-M3b/07-prod-verification/.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  HOSTING_CHAT_ENDPOINT,
  DIRECT_FIRST_BYTE_TIMEOUT_MS,
  isUsableChatOrigin,
  buildChatRoutes,
  runWithFallback,
} from '../lib/miniVicRoute.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(repoRoot, rel), 'utf8');

const ORIGIN = 'https://minivicchat-hjdyjsrzvq-uc.a.run.app';

test('MV-ROUTE-01: with an origin configured the direct route is tried first, Hosting second', () => {
  const routes = buildChatRoutes(ORIGIN);
  assert.equal(routes.length, 2, 'both rungs must exist — the fallback is not optional');
  assert.deepEqual(
    routes.map((r) => r.id),
    ['origin', 'hosting'],
    'the buffered Hosting path must never be tried before the streaming origin',
  );
  assert.equal(routes[0].sendUrl, `${ORIGIN}/`);
  assert.equal(routes[0].warmUrl, `${ORIGIN}/?warm=1`);
  assert.equal(routes[1].sendUrl, HOSTING_CHAT_ENDPOINT);
  assert.equal(routes[1].warmUrl, `${HOSTING_CHAT_ENDPOINT}?warm=1`);
});

test('MV-ROUTE-02: with no origin configured the ladder is the Hosting rewrite alone', () => {
  for (const empty of ['', '   ', null, undefined]) {
    const routes = buildChatRoutes(empty);
    assert.deepEqual(
      routes.map((r) => r.id),
      ['hosting'],
      `an unconfigured origin (${JSON.stringify(empty)}) must not produce a direct rung`,
    );
    assert.equal(routes[0].sendUrl, HOSTING_CHAT_ENDPOINT);
  }
});

test('MV-ROUTE-03: only an https origin with no path of its own is eligible', () => {
  assert.equal(isUsableChatOrigin(ORIGIN), true);
  assert.equal(isUsableChatOrigin(`${ORIGIN}/`), true);
  for (const bad of [
    'http://minivicchat-hjdyjsrzvq-uc.a.run.app', // plaintext: a mixed-content block, not a route
    '//minivicchat-hjdyjsrzvq-uc.a.run.app', // protocol-relative: unparseable without a base
    '/api/chat', // already the fallback
    'javascript:alert(1)',
    'https://user:pw@minivicchat-hjdyjsrzvq-uc.a.run.app', // credentials in a public constant
    'https://minivicchat-hjdyjsrzvq-uc.a.run.app/api/chat', // a path would change what is called
    'not a url',
  ]) {
    assert.equal(isUsableChatOrigin(bad), false, `${bad} must not be accepted as a chat origin`);
  }
  // Something ineligible must degrade to the fallback, never throw at import time.
  assert.deepEqual(
    buildChatRoutes('http://insecure.example').map((r) => r.id),
    ['hosting'],
  );
});

test('MV-ROUTE-04: a failing direct rung hands the send to Hosting, and the answer is the fallback rung\'s', async () => {
  const tried = [];
  const result = await runWithFallback(buildChatRoutes(ORIGIN), async (route) => {
    tried.push(route.id);
    if (route.id === 'origin') throw new TypeError('Failed to fetch');
    return 'answered by hosting';
  });
  assert.deepEqual(tried, ['origin', 'hosting'], 'the fallback rung was never attempted');
  assert.equal(result.value, 'answered by hosting');
  assert.equal(result.route.id, 'hosting');
  assert.equal(result.failures.length, 1);
  assert.match(String(result.failures[0].error), /Failed to fetch/);
});

test('MV-ROUTE-05: a working direct rung is not double-sent through Hosting', async () => {
  const tried = [];
  const result = await runWithFallback(buildChatRoutes(ORIGIN), async (route) => {
    tried.push(route.id);
    return 'answered by origin';
  });
  assert.deepEqual(tried, ['origin'], 'the send was billed twice');
  assert.equal(result.route.id, 'origin');
  assert.deepEqual(result.failures, []);
});

test('MV-ROUTE-06: when every rung fails the caller is told, never handed an invented answer', async () => {
  await assert.rejects(
    () =>
      runWithFallback(buildChatRoutes(ORIGIN), async (route) => {
        throw new Error(`${route.id} down`);
      }),
    (error) => {
      // The caller (askMiniVicBrain) turns this into the deterministic knowledge
      // tier. A resolved value here would be a fabricated reply — §13.
      assert.match(String(error.message), /origin down/);
      assert.match(String(error.message), /hosting down/);
      return true;
    },
  );
});

test('MV-ROUTE-07: the first-byte deadline on the direct rung is the R3 bar itself', () => {
  assert.equal(
    DIRECT_FIRST_BYTE_TIMEOUT_MS,
    1500,
    'a direct rung that has not answered inside the R3 bar has already lost; hand over',
  );
});

test('MV-ROUTE-08: one config point — config, generated module and the CSP all name the same origin', () => {
  const configured = JSON.parse(read('config/minivic-origin.json')).originUrl;
  assert.equal(isUsableChatOrigin(configured), true, 'config/minivic-origin.json is not a usable origin');

  const generated = read('app/data/generated/minivic-origin.ts');
  assert.ok(
    generated.includes(JSON.stringify(configured)),
    'app/data/generated/minivic-origin.ts is stale — run scripts/build/minivic_origin.mjs',
  );

  // A CSP that does not name the origin blocks the direct route in the browser
  // and silently costs every visitor the buffered path. It is one file away from
  // the constant, so it is asserted rather than trusted.
  const hosting = JSON.parse(read('firebase.json')).hosting;
  const csp = hosting.headers
    .flatMap((h) => h.headers)
    .find((h) => h.key === 'Content-Security-Policy');
  assert.ok(csp, 'firebase.json serves no Content-Security-Policy');
  const connectSrc = csp.value.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src'));
  assert.ok(connectSrc, 'the CSP has no connect-src directive');
  assert.ok(
    connectSrc.split(/\s+/).includes(configured),
    `connect-src does not allow the chat origin:\n${connectSrc}`,
  );
});

test('MV-ROUTE-09: no component hard-codes the deploy-specific run.app hostname', () => {
  const configuredHost = new URL(JSON.parse(read('config/minivic-origin.json')).originUrl).host;
  const generatedConstant = path.join('app', 'data', 'generated', 'minivic-origin.ts');
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(ts|tsx|mjs)$/.test(entry.name) && rel !== generatedConstant) {
        if (read(rel).includes(configuredHost)) offenders.push(rel);
      }
    }
  };
  for (const dir of ['components', 'app', 'lib']) walk(dir);
  assert.deepEqual(
    offenders,
    [],
    `the deploy-specific origin is hard-coded outside the generated config point:\n${offenders.join('\n')}`,
  );
});
