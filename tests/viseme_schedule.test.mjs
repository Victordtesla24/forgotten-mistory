/**
 * VS-01…VS-08 — the greeting's viseme schedule (MINIVIC-AVATAR-v1.md §3).
 *
 * `lib/visemeSchedule.ts` turns an ElevenLabs *character* alignment into the cue
 * list the mouth renderer reads. These assertions fix the two properties that
 * make such a cue list safe to drive a face with:
 *
 *   1. it is a *partition* of the audio — sorted, gapless, non-overlapping,
 *      covering [0, durationSeconds] — so `visemeIndexAt` is total and no frame
 *      can fall between two cues and freeze the mouth;
 *   2. it describes *this* audio — `sourceSha256` is the digest of the MP3 the
 *      site ships, and the alignment was produced by the same synthesis call
 *      that produced those bytes (§2.2). A schedule that is precise about a
 *      different render is worse than no schedule at all.
 *
 * The viseme indices are read out of `lib/visemeMap.ts`'s own labels rather than
 * typed here, so this file cannot drift from the 22-entry set the renderer,
 * the GLSL stage and the canvas path already share (§3.1 — no new taxonomy).
 *
 * `MIN_CUE_S` is 0.040 s. It is the drift budget of §5.4 expressed as a lower
 * bound on cue length, and it is asserted as an exact float — never rounded,
 * never restated as "40" in another unit.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  graphemeRuns,
  buildSchedule,
  visemeIndexAt,
  SILENCE_MIN_S,
  MIN_CUE_S,
} from '../lib/visemeSchedule.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VISEME_MAP = path.join(repoRoot, 'lib', 'visemeMap.ts');
const ALIGNMENT = path.join(repoRoot, 'app', 'data', 'generated', 'greeting-alignment.ts');
const ASSET = path.join(repoRoot, 'app', 'data', 'generated', 'greeting-asset.ts');
const ENVELOPE = path.join(repoRoot, 'app', 'data', 'generated', 'greeting-envelope.ts');
const MP3 = path.join(repoRoot, 'public', 'assets', 'minivic-greeting.mp3');

/**
 * `label` → `index`, read from the VISEME_SHAPES literal in lib/visemeMap.ts.
 * Parsing the source (rather than importing it) keeps this test runnable under
 * plain `node --test`, and keeps the indices sourced from the file of record.
 */
function visemeIndexByLabel() {
  const source = readFileSync(VISEME_MAP, 'utf8');
  const byLabel = new Map();
  const entry = /\{\s*index:\s*(\d+),\s*label:\s*'([^']+)'/g;
  let m;
  while ((m = entry.exec(source)) !== null) byLabel.set(m[2], Number(m[1]));
  assert.ok(byLabel.size > 0, 'no VISEME_SHAPES entries parsed out of lib/visemeMap.ts');
  return byLabel;
}

const LABEL_INDEX = visemeIndexByLabel();
const VISEME_COUNT = LABEL_INDEX.size;

/** Reads `export const <name> = <number|string literal>` out of a generated module. */
function readGeneratedScalar(file, name) {
  const source = readFileSync(file, 'utf8');
  const m = source.match(new RegExp(`${name}\\s*[:=]\\s*'([0-9a-f]{64})'`));
  assert.ok(m, `${name} not found in ${path.relative(repoRoot, file)}`);
  return m[1];
}

/** Builds an alignment fixture from per-character [start, end] pairs. */
function alignment(chars, spans) {
  return {
    characters: chars,
    characterStartTimesSeconds: spans.map((s) => s[0]),
    characterEndTimesSeconds: spans.map((s) => s[1]),
  };
}

/** "m a . _ m a" with the punctuation gap sized by the caller. */
function pausedGreeting(gapSeconds) {
  const half = gapSeconds / 2;
  const chars = ['m', 'a', '.', ' ', 'm', 'a'];
  const spans = [
    [0.0, 0.1],
    [0.1, 0.2],
    [0.2, 0.2 + half],
    [0.2 + half, 0.2 + gapSeconds],
    [0.2 + gapSeconds, 0.3 + gapSeconds],
    [0.3 + gapSeconds, 0.4 + gapSeconds],
  ];
  return { alignment: alignment(chars, spans), duration: 0.4 + gapSeconds };
}

/** A longer fixture: real words, an internal alignment gap, and a lead-in. */
function mixedFixture() {
  const text = 'the show moves fast, sing on.';
  const chars = [...text];
  const spans = [];
  let t = 0.12; // lead-in silence before the first character
  for (let i = 0; i < chars.length; i += 1) {
    // A deliberate 0.09 s hole in the middle of the alignment (after the comma)
    // so the gap-filling rule of VS-02 has something to fill.
    if (i === 20) t += 0.09;
    spans.push([t, t + 0.055]);
    t += 0.055;
  }
  return { alignment: alignment(chars, spans), duration: t + 0.2 };
}

const SHA_ZERO = '0'.repeat(64);

// ── VS-01 ────────────────────────────────────────────────────────────────────
test('VS-01: cues are sorted, every tEnd > tStart, and no two cues overlap', () => {
  for (const [name, f] of [
    ['paused-80ms', pausedGreeting(0.08)],
    ['paused-30ms', pausedGreeting(0.03)],
    ['mixed', mixedFixture()],
  ]) {
    const schedule = buildSchedule(f.alignment, {
      sourceSha256: SHA_ZERO,
      durationSeconds: f.duration,
    });
    assert.ok(schedule.cues.length > 0, `${name}: schedule has no cues`);
    for (let i = 0; i < schedule.cues.length; i += 1) {
      const [tStart, tEnd] = schedule.cues[i];
      assert.ok(tEnd > tStart, `${name}: cue ${i} has tEnd ${tEnd} <= tStart ${tStart}`);
      if (i > 0) {
        const prevEnd = schedule.cues[i - 1][1];
        assert.ok(tStart >= prevEnd, `${name}: cue ${i} starts ${tStart} before cue ${i - 1} ends ${prevEnd}`);
      }
    }
  }
});

// ── VS-02 ────────────────────────────────────────────────────────────────────
test('VS-02: cues cover [0, durationSeconds] and every gap is an explicit viseme-0 cue', () => {
  const f = mixedFixture();
  const schedule = buildSchedule(f.alignment, {
    sourceSha256: SHA_ZERO,
    durationSeconds: f.duration,
  });
  assert.equal(schedule.cues[0][0], 0, 'the first cue does not start at 0');
  assert.equal(
    schedule.cues[schedule.cues.length - 1][1],
    schedule.durationSeconds,
    'the last cue does not end at durationSeconds',
  );
  for (let i = 1; i < schedule.cues.length; i += 1) {
    assert.equal(
      schedule.cues[i][0],
      schedule.cues[i - 1][1],
      `a hole survives between cue ${i - 1} and cue ${i} — the cue list is not a partition`,
    );
  }
  // The lead-in before the first character is silence, and it is a real cue.
  assert.equal(schedule.cues[0][2], 0, 'the lead-in before the first character is not viseme 0');
  // The 0.09 s hole inside the alignment became its own viseme-0 cue.
  const interiorSilence = schedule.cues
    .slice(1, -1)
    .filter((c) => c[2] === 0 && c[1] - c[0] >= SILENCE_MIN_S);
  assert.ok(
    interiorSilence.length >= 1,
    'the 0.09 s hole inside the alignment did not become an explicit viseme-0 cue',
  );
});

// ── VS-03 ────────────────────────────────────────────────────────────────────
test('VS-03: every visemeIndex is an index of the existing VISEME_SHAPES set', () => {
  assert.equal(VISEME_COUNT, 22, 'lib/visemeMap.ts no longer declares 22 viseme shapes');
  const f = mixedFixture();
  const schedule = buildSchedule(f.alignment, {
    sourceSha256: SHA_ZERO,
    durationSeconds: f.duration,
  });
  for (const [, , index] of schedule.cues) {
    assert.ok(Number.isInteger(index), `viseme index ${index} is not an integer`);
    assert.ok(index >= 0 && index <= VISEME_COUNT - 1, `viseme index ${index} is outside 0…${VISEME_COUNT - 1}`);
  }
  // The rule table itself may never invent an index either.
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const probe = `${letters} ${letters.toUpperCase()} the show ought oil boy tion sion laugh talk field shoe`;
  for (const run of graphemeRuns(probe)) {
    assert.ok(
      run.viseme >= 0 && run.viseme <= VISEME_COUNT - 1,
      `graphemeRuns produced index ${run.viseme}, outside 0…${VISEME_COUNT - 1}`,
    );
  }
});

// ── VS-04 ────────────────────────────────────────────────────────────────────
test('VS-04: no cue is shorter than MIN_CUE_S = 0.04 s', () => {
  assert.equal(MIN_CUE_S, 0.04, 'MIN_CUE_S is not 0.04 s — the drift budget was restated');
  assert.equal(SILENCE_MIN_S, 0.06, 'SILENCE_MIN_S is not 0.06 s');

  // Characters far shorter than the floor: the merge rule must absorb them all.
  const text = 'the quick sixth show, sing.';
  const chars = [...text];
  const spans = chars.map((_, i) => [i * 0.011, (i + 1) * 0.011]);
  const duration = chars.length * 0.011 + 0.05;
  const fixtures = [
    ['fine-grained', buildSchedule(alignment(chars, spans), { sourceSha256: SHA_ZERO, durationSeconds: duration })],
    ['paused-80ms', buildSchedule(pausedGreeting(0.08).alignment, { sourceSha256: SHA_ZERO, durationSeconds: pausedGreeting(0.08).duration })],
    ['mixed', buildSchedule(mixedFixture().alignment, { sourceSha256: SHA_ZERO, durationSeconds: mixedFixture().duration })],
  ];
  for (const [name, schedule] of fixtures) {
    for (let i = 0; i < schedule.cues.length; i += 1) {
      const [tStart, tEnd] = schedule.cues[i];
      assert.ok(
        tEnd - tStart >= MIN_CUE_S,
        `${name}: cue ${i} lasts ${(tEnd - tStart).toFixed(6)} s, under MIN_CUE_S ${MIN_CUE_S}`,
      );
    }
  }
});

// ── VS-05 ────────────────────────────────────────────────────────────────────
test('VS-05: the rule table maps th sh oo m f s ng to the visemeMap.ts indices', () => {
  const expectations = [
    ['th', 'TH'],
    ['sh', 'SH'],
    ['oo', 'UW'],
    ['m', 'PB'],
    ['f', 'FV'],
    ['s', 'S'],
    ['ng', 'NG'],
  ];
  for (const [grapheme, label] of expectations) {
    const expected = LABEL_INDEX.get(label);
    assert.ok(expected !== undefined, `lib/visemeMap.ts has no viseme labelled ${label}`);
    const runs = graphemeRuns(grapheme);
    assert.equal(runs.length, 1, `graphemeRuns('${grapheme}') split into ${runs.length} runs — longest-match failed`);
    assert.equal(runs[0].start, 0, `graphemeRuns('${grapheme}') did not start at 0`);
    assert.equal(runs[0].end, grapheme.length, `graphemeRuns('${grapheme}') did not consume the whole grapheme`);
    assert.equal(
      runs[0].viseme,
      expected,
      `'${grapheme}' mapped to ${runs[0].viseme}, not ${label} = ${expected}`,
    );
  }
  // Longest-match is ordered: `th` must never resolve as `t` + `h`.
  const th = graphemeRuns('this');
  assert.equal(th[0].end, 2, "'th' in 'this' was split into 't' + 'h'");
});

// ── VS-06 ────────────────────────────────────────────────────────────────────
test('VS-06: buildSchedule is deterministic — byte-identical JSON across runs', () => {
  const f = mixedFixture();
  const once = JSON.stringify(
    buildSchedule(f.alignment, { sourceSha256: SHA_ZERO, durationSeconds: f.duration }),
  );
  for (let i = 0; i < 5; i += 1) {
    const again = JSON.stringify(
      buildSchedule(mixedFixture().alignment, { sourceSha256: SHA_ZERO, durationSeconds: mixedFixture().duration }),
    );
    assert.equal(again, once, `run ${i + 1} produced different JSON — buildSchedule is not deterministic`);
  }
});

// ── VS-07 ────────────────────────────────────────────────────────────────────
test('VS-07: a >=60 ms punctuation gap yields a viseme-0 cue; a <60 ms gap is absorbed', () => {
  const long = pausedGreeting(0.08);
  const longSchedule = buildSchedule(long.alignment, {
    sourceSha256: SHA_ZERO,
    durationSeconds: long.duration,
  });
  const longSilence = longSchedule.cues.filter((c) => c[2] === 0 && c[0] > 0 && c[1] < longSchedule.durationSeconds);
  assert.equal(
    longSilence.length,
    1,
    `an 80 ms punctuation gap produced ${longSilence.length} interior viseme-0 cues, expected 1`,
  );
  assert.equal(longSilence[0][0], 0.2, 'the silence cue does not begin where the punctuation does');

  const short = pausedGreeting(0.03);
  const shortSchedule = buildSchedule(short.alignment, {
    sourceSha256: SHA_ZERO,
    durationSeconds: short.duration,
  });
  const shortSilence = shortSchedule.cues.filter(
    (c) => c[2] === 0 && c[0] > 0 && c[1] < shortSchedule.durationSeconds,
  );
  assert.equal(
    shortSilence.length,
    0,
    'a 30 ms punctuation gap was emitted as a viseme-0 cue instead of being absorbed',
  );
  // Absorbed, not dropped: the preceding cue now owns that time.
  assert.equal(visemeIndexAt(shortSchedule, 0.215), LABEL_INDEX.get('AE'));
});

// ── VS-08 ────────────────────────────────────────────────────────────────────
test('VS-08: the real greeting schedule matches the shipped MP3, three ways', async () => {
  const { greetingAlignment } = await import(`file://${ALIGNMENT}`);
  const mp3Sha256 = createHash('sha256').update(readFileSync(MP3)).digest('hex');
  const assetSha256 = readGeneratedScalar(ASSET, 'greetingAudioSha256');
  const envelopeSha256 = readGeneratedScalar(ENVELOPE, 'sourceSha256');

  assert.equal(
    greetingAlignment.sourceSha256,
    assetSha256,
    'the alignment does not describe the audio greeting-asset.ts pins',
  );
  assert.equal(assetSha256, mp3Sha256, 'greeting-asset.ts pins a digest the shipped MP3 does not have');
  assert.equal(envelopeSha256, mp3Sha256, 'greeting-envelope.ts pins a digest the shipped MP3 does not have');

  const schedule = buildSchedule(greetingAlignment, { sourceSha256: greetingAlignment.sourceSha256 });
  assert.equal(schedule.version, 1);
  assert.equal(schedule.sourceSha256, mp3Sha256, 'the built schedule does not carry the MP3 digest');

  // The duration of record is ffprobe's, written into greeting-envelope.ts from
  // these same MP3 bytes. The schedule is built from character end times, so the
  // two are independent measurements of one file and must agree to 50 ms.
  const envelopeSource = readFileSync(ENVELOPE, 'utf8');
  const durationMatch = envelopeSource.match(/durationSeconds:\s*([0-9.]+)/);
  assert.ok(durationMatch, 'greeting-envelope.ts carries no durationSeconds');
  const audioDuration = Number(durationMatch[1]);
  assert.ok(
    Math.abs(schedule.durationSeconds - audioDuration) <= 0.05,
    `the schedule spans ${schedule.durationSeconds} s but the MP3 is ${audioDuration} s — ` +
      `${Math.abs(schedule.durationSeconds - audioDuration).toFixed(6)} s apart, over the 50 ms tolerance`,
  );

  // The invariants of VS-01…VS-04, asserted on the artefact that actually ships.
  assert.ok(schedule.cues.length > 50, `only ${schedule.cues.length} cues for a ${audioDuration} s greeting`);
  assert.equal(schedule.cues[0][0], 0);
  assert.equal(schedule.cues[schedule.cues.length - 1][1], schedule.durationSeconds);
  for (let i = 0; i < schedule.cues.length; i += 1) {
    const [tStart, tEnd, index] = schedule.cues[i];
    assert.ok(tEnd - tStart >= MIN_CUE_S, `real cue ${i} lasts ${tEnd - tStart} s, under ${MIN_CUE_S}`);
    assert.ok(index >= 0 && index <= VISEME_COUNT - 1, `real cue ${i} has index ${index}`);
    if (i > 0) assert.equal(tStart, schedule.cues[i - 1][1], `real cue ${i} does not abut its predecessor`);
  }

  // visemeIndexAt is total across the whole greeting and never leaves the set.
  for (let t = 0; t <= audioDuration; t += 0.25) {
    const index = visemeIndexAt(schedule, t);
    assert.ok(index >= 0 && index <= VISEME_COUNT - 1, `visemeIndexAt(${t}) returned ${index}`);
  }
  assert.equal(visemeIndexAt(schedule, -1), 0, 'before the audio starts the mouth is not at rest');
  assert.equal(visemeIndexAt(schedule, audioDuration + 5), 0, 'after the audio ends the mouth is not at rest');
});
