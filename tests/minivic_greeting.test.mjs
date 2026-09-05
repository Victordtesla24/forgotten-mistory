/**
 * G-M2 — the introduction is one thing, heard and read (docs/prompt.md §0.3-5).
 *
 * The reviewer measured the shipped greeting MP3 at sha 369e1eb2… — byte-identical
 * to the asset generated on 2026-09-03 from the OLD "Hi, I'm Mini Vic — Vikram's
 * AI clone…" script — while the on-screen intro had since been rewritten to the
 * employer-research text (GREETING.hiring). A visitor read one introduction and
 * heard another.
 *
 * These assertions make that drift impossible to reintroduce:
 *   1. public/assets/minivic-greeting.txt records the words actually spoken, and
 *      they are character-for-character GREETING.hiring;
 *   2. the shipped MP3 hashes to the digest the app asserts at runtime
 *      (TC-VOICE-01 reads it off window.__CLONED_VOICE_GREETING_HASH__), so a
 *      regenerated audio file and a stale constant cannot both pass.
 *
 * GREETING.hiring is read out of the TypeScript source rather than imported,
 * because node:test runs without a TypeScript loader; the source is the same
 * single definition MiniVicBot.tsx and the generation script both consume.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const KNOWLEDGE = path.join(repoRoot, 'app', 'data', 'miniVicKnowledge.ts');
const TRANSCRIPT = path.join(repoRoot, 'public', 'assets', 'minivic-greeting.txt');
const MP3 = path.join(repoRoot, 'public', 'assets', 'minivic-greeting.mp3');
const GENERATED = path.join(repoRoot, 'app', 'data', 'generated', 'greeting-asset.ts');

/** The `hiring:` member of the GREETING record, as the source declares it. */
function greetingHiring() {
  const source = readFileSync(KNOWLEDGE, 'utf8');
  const record = source.match(/export const GREETING:[^=]*=\s*\{/);
  assert.ok(record, 'GREETING record not found in app/data/miniVicKnowledge.ts');
  const after = source.slice(record.index);
  const member = after.match(/\bhiring:\s*("(?:[^"\\]|\\.)*")/);
  assert.ok(member, 'GREETING.hiring string literal not found');
  return JSON.parse(member[1]);
}

test('MV-GREET-01: the recorded transcript is exactly the on-screen introduction', () => {
  assert.ok(
    existsSync(TRANSCRIPT),
    'public/assets/minivic-greeting.txt is missing — the generation script must record ' +
      'the words it spoke so audio and text can be compared',
  );
  const spoken = readFileSync(TRANSCRIPT, 'utf8').trim();
  assert.equal(
    spoken,
    greetingHiring(),
    'the spoken greeting and the on-screen introduction have drifted apart',
  );
});

test('MV-GREET-02: the shipped MP3 hashes to the digest the app asserts', () => {
  assert.ok(existsSync(MP3), 'public/assets/minivic-greeting.mp3 is missing');
  assert.ok(
    existsSync(GENERATED),
    'app/data/generated/greeting-asset.ts is missing — the generation script writes it ' +
      'so the runtime hash constant can never be hand-edited out of step with the audio',
  );

  const actual = createHash('sha256').update(readFileSync(MP3)).digest('hex');
  const declared = readFileSync(GENERATED, 'utf8').match(
    /greetingAudioSha256\s*(?::\s*string\s*)?=\s*'([0-9a-f]{64})'/,
  );
  assert.ok(declared, 'greetingAudioSha256 not found in app/data/generated/greeting-asset.ts');
  assert.equal(actual, declared[1], 'the greeting MP3 does not match its recorded SHA-256');
});

test('MV-GREET-03: the greeting asset stays inside the 500 kB budget', () => {
  assert.ok(existsSync(MP3), 'public/assets/minivic-greeting.mp3 is missing');
  const bytes = readFileSync(MP3).length;
  assert.ok(bytes > 10_000, `greeting MP3 is implausibly small (${bytes} bytes)`);
  assert.ok(bytes < 500_000, `greeting MP3 is ${bytes} bytes, over the 500 kB asset budget`);
});
