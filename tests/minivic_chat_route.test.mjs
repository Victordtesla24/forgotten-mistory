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
  HOSTING_CHAT_SEND_URL,
  DIRECT_FIRST_BYTE_TIMEOUT_MS,
  isUsableChatOrigin,
  buildChatRoutes,
  runWithFallback,
  trimCappedAnswer,
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
  assert.equal(routes[1].sendUrl, HOSTING_CHAT_SEND_URL);
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
    assert.equal(routes[0].sendUrl, HOSTING_CHAT_SEND_URL);
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

/**
 * The measured worst-case cold first token on the origin route: the serial walk
 * of three dead rungs plus the model, timed by an independent reviewer after a
 * ≥10-minute idle
 * (docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/08-adversarial-review.md
 * F1, sample 1 = 2 449 ms; re-measured at 2 626 ms after a strict ≥10-minute
 * idle in W1-R2C/07-first-token-strictcold.json, which is the number pinned
 * here because it is the larger of the two). The deadline has to clear it or
 * the cold send is aborted on exactly the path the gate measures.
 */
const MEASURED_COLD_FIRST_TOKEN_MS = 2626;

test('MV-ROUTE-07: the direct deadline clears the measured cold walk, so a live stream is never discarded', () => {
  // This used to assert `=== 1500`, the R3 bar. That was wrong twice over: the
  // function writes its SSE headers on the first FRAGMENT, so this is a
  // first-token deadline, and the cold first token is 2 449 ms — so the client
  // aborted the origin on every cold send and then paid the buffered fallback
  // in full, which is worse than either route alone (review F2).
  assert.ok(
    DIRECT_FIRST_BYTE_TIMEOUT_MS > MEASURED_COLD_FIRST_TOKEN_MS,
    `the direct deadline (${DIRECT_FIRST_BYTE_TIMEOUT_MS} ms) must clear the measured cold ` +
      `first token (${MEASURED_COLD_FIRST_TOKEN_MS} ms) — below it, every cold send is aborted ` +
      'after paying for it',
  );
  // ...and it is still a deadline, not an absence of one: an origin that has
  // produced nothing by then has no answer to lose, and the certain path is the
  // better remaining bet well inside the 14 s overall timeout.
  assert.ok(
    DIRECT_FIRST_BYTE_TIMEOUT_MS <= 4000,
    'the direct deadline must stay a deadline — a visitor cannot wait on a dead origin',
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

/**
 * MV-ROUTE-10 — the fallback POST names itself (G-M4 correction, t_w1_m4b).
 *
 * Firebase Hosting's edge buffers the SSE reply, so the function shortens the
 * answer on that route alone. It can only do that if it knows which route the
 * request came in on, and the one signal that cannot be confused by a proxy is
 * the client saying so. The flag goes on the SEND url only: the warm ping does
 * no upstream work, and the direct rung must stay a bare origin POST so that
 * nothing about the fast path changes.
 */
test('MV-ROUTE-10: only the Hosting send carries the route flag the cap keys off', () => {
  const routes = buildChatRoutes(ORIGIN);
  const [origin, hosting] = routes;

  assert.equal(hosting.sendUrl, `${HOSTING_CHAT_ENDPOINT}?route=hosting`);
  assert.equal(HOSTING_CHAT_SEND_URL, `${HOSTING_CHAT_ENDPOINT}?route=hosting`);
  assert.equal(
    hosting.warmUrl,
    `${HOSTING_CHAT_ENDPOINT}?warm=1`,
    'the warm ping is untouched — it spends nothing and answers 204',
  );
  assert.ok(
    !origin.sendUrl.includes('route='),
    'the direct rung must remain a bare origin POST, so its 128-token ceiling is unchanged',
  );
  assert.ok(
    !origin.warmUrl.includes('route='),
    'the direct warm ping is untouched too',
  );
});

test('MV-ROUTE-11: the panel reads the route off the wire rather than guessing it', () => {
  const brain = read('lib/miniVicBrain.ts');
  assert.match(
    brain,
    /parsed\.route/,
    'the streamed done event names the route; the client must read it',
  );
  assert.match(
    brain,
    /route\?:\s*ChatRouteId \| null|route: ChatRouteId \| null/,
    'BrainReply must carry the route so the disclosure can be honest about it',
  );
});


/**
 * MV-ROUTE-12 — a ceiling must not ship a severed sentence.
 *
 * The first strings below are the real capped replies this task measured
 * against the deployed function (W1-M4B/04-hosting-verify.json and
 * 05-hosting-noflag-verify.json): both stop mid-clause, which is what a hard
 * `max_tokens` does. The trim keeps only what the model finished.
 */
test('MV-ROUTE-12: a capped answer is cut back to the last sentence it finished', () => {
  const measured =
    'At the ATO, I have led the Agile Kookaburras squad on the Payday Super reform ' +
    'program since March 2026, managing sprint cadence, PI planning, capacity, ' +
    'executive reporting, and delivering over 95% of the';
  const trimmed = trimCappedAnswer(measured);
  assert.ok(!trimmed.includes('95% of the'), 'the severed clause must not reach a reader');
  assert.ok(trimmed.endsWith('…'), 'with no finished sentence to keep, the cut is marked');
  assert.ok(
    trimmed.endsWith('executive reporting…'),
    `the last clause the model closed is kept, not discarded — got ${JSON.stringify(trimmed)}`,
  );
  assert.ok(
    measured.startsWith(trimmed.slice(0, -1)),
    'every word shown is a word the model wrote — nothing is rephrased',
  );

  const twoSentences =
    'I led the Agile Kookaburras squad on the Payday Super reform program from March 2026. ' +
    'Test-evidence automation cut effort by about 92% and I then';
  assert.equal(
    trimCappedAnswer(twoSentences),
    'I led the Agile Kookaburras squad on the Payday Super reform program from March 2026.',
  );

  const whole = 'Fifteen years, mostly delivery leadership.';
  assert.equal(trimCappedAnswer(whole), whole, 'a complete answer is returned untouched');

  assert.equal(trimCappedAnswer(''), '', 'nothing in, nothing invented out');
  assert.ok(
    !trimCappedAnswer('gpt-4.1-mini answered in 1.2').includes('…answered'),
    'a decimal point is not a sentence boundary',
  );
});
