/**
 * G-M1 — MiniVic's send path goes straight to /api/chat.
 *
 * The independent reviewer (artifacts/adversarial/ADV-REVIEW-20260905.md) found
 * the `/api/chat-with-vic?taskId=` poller in the *served* bundle: a dead ladder
 * — POST /api/realtime/session → WebSocket → POST /api/chat-with-vic → poll
 * /api/chat-with-vic?taskId= → only then the client brain's /api/chat — that is
 * shipped to every visitor and can never run, because the static export throws
 * OFFLINE_MESSAGE before the first fetch.
 *
 * Two assertions, because either alone can be satisfied without the defect
 * being gone:
 *   - the SOURCE carries no reference to the dead endpoints (a build that
 *     tree-shakes today could stop tree-shaking tomorrow), and
 *   - the SHIPPED chunks carry none either (the reviewer measured the bundle,
 *     not the source, and the bundle is what a visitor downloads).
 *
 * The bundle half is skipped, loudly, when out/ has not been built — never
 * silently passed.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The endpoints the send path may no longer name, anywhere. */
const DEAD_ENDPOINTS = ['api/realtime', 'chat-with-vic', 'polloTaskId'];

/** Every source file under the client directories, recursively. */
function sourceFiles(dir) {
  const abs = path.join(repoRoot, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(rel));
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('MV-SEND-01: no client source names the dead realtime / chat-with-vic ladder', () => {
  const offenders = [];
  for (const rel of [...sourceFiles('components'), ...sourceFiles('lib'), ...sourceFiles('app')]) {
    const text = readFileSync(path.join(repoRoot, rel), 'utf8');
    text.split('\n').forEach((line, i) => {
      for (const needle of DEAD_ENDPOINTS) {
        if (line.includes(needle)) offenders.push(`${rel}:${i + 1} → ${needle}`);
      }
    });
  }
  assert.deepEqual(
    offenders,
    [],
    `the dead API ladder is still referenced in client source:\n${offenders.join('\n')}`,
  );
});

test('MV-SEND-02: the built bundle ships no reference to the dead ladder', () => {
  const chunkDir = path.join(repoRoot, 'out', '_next', 'static', 'chunks');
  assert.ok(
    existsSync(chunkDir),
    `out/_next/static/chunks is missing — run "npm run build:static" before this test; ` +
      `the bundle assertion must never be skipped silently`,
  );

  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith('.js')) files.push(abs);
    }
  };
  walk(chunkDir);
  assert.ok(files.length > 0, 'no JavaScript chunks found in out/_next/static/chunks');

  const offenders = [];
  for (const abs of files) {
    const text = readFileSync(abs, 'utf8');
    for (const needle of DEAD_ENDPOINTS) {
      if (text.includes(needle)) offenders.push(`${path.relative(repoRoot, abs)} → ${needle}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `the served bundle still carries the dead API ladder:\n${offenders.join('\n')}`,
  );
});
