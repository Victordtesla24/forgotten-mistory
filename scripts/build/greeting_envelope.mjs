#!/usr/bin/env node
/**
 * greeting_envelope.mjs — turns the greeting into the shape of him speaking.
 *
 * `#listen` draws a band of light under the caliper. Until this script existed
 * that band's only time-varying term was `0.5 + 0.5 * sin(p.x * 1.7 - uTime)`
 * — a sine tuned by the shader's own comment to clear a motion floor, i.e. a
 * scene built to pass a test rather than to say something (LISTEN-FLAGSHIP.md
 * §0). Every other flagship on this site draws data; this one drew `sin()`.
 *
 * The section already owns a real signal nobody had plotted:
 * `public/assets/minivic-greeting.mp3` — 24.98 s of the synthetic introduction.
 * This script reads its actual bytes, decodes them to mono PCM with ffmpeg,
 * folds the samples into 256 RMS buckets, peak-normalises them to 0 → 1, and
 * writes them into a generated module the field uploads as a texture. The band
 * then rises and falls with the greeting's own loudness across the frame: the
 * closing light stops being a wave and becomes his voice.
 *
 * `sourceSha256` is the SHA-256 of the MP3, and it is asserted equal to
 * `greetingAudioSha256` in app/data/generated/greeting-asset.ts before anything
 * is written. That is the whole point of pinning it: a regenerated greeting with
 * a stale envelope fails the build here, the same defect class the greeting
 * digest was introduced to catch (a recording that spoke the old script while
 * the on-screen introduction had been rewritten).
 *
 * Runs before `next build` in both `build` and `build:static`, beside
 * cv_fingerprint.mjs. Fails loudly if the MP3 is missing, if ffmpeg/ffprobe are
 * unavailable, or if the digest does not match the asset module — a waveform
 * with nothing to be the waveform of is worse than a sine.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const MP3_PATH = join(ROOT, 'public', 'assets', 'minivic-greeting.mp3');
const ASSET_PATH = join(ROOT, 'app', 'data', 'generated', 'greeting-asset.ts');
const OUT_PATH = join(ROOT, 'app', 'data', 'generated', 'greeting-envelope.ts');

/** The band is a 256×1 texture; one RMS bucket per texel. */
const BUCKETS = 256;
/** Mono PCM at 8 kHz: enough to resolve a voice's loudness, tiny to decode. */
const SAMPLE_RATE = 8000;

function fail(message) {
  console.error(`[greeting-envelope] FATAL: ${message}`);
  process.exit(1);
}

let mp3Bytes;
try {
  mp3Bytes = readFileSync(MP3_PATH);
} catch {
  fail(
    `${MP3_PATH} is missing. #listen draws this file's loudness as light; it ` +
      'cannot be built without it.',
  );
}

const sourceSha256 = createHash('sha256').update(mp3Bytes).digest('hex');

// The digest must match the one the asset module already carries. If it does
// not, the MP3 was regenerated without regenerating greeting-asset.ts (or vice
// versa) and the envelope would describe a file the rest of the app no longer
// ships. Fail rather than pin the wrong bytes.
let assetSource;
try {
  assetSource = readFileSync(ASSET_PATH, 'utf8');
} catch {
  fail(`${ASSET_PATH} is missing; cannot verify the envelope pins the shipped greeting.`);
}
const assetMatch = assetSource.match(/greetingAudioSha256\s*=\s*'([0-9a-f]{64})'/);
if (!assetMatch) {
  fail(`could not read greetingAudioSha256 from ${ASSET_PATH}.`);
}
if (assetMatch[1] !== sourceSha256) {
  fail(
    `the MP3 digest ${sourceSha256} does not equal greetingAudioSha256 ` +
      `${assetMatch[1]} in greeting-asset.ts — the greeting and its envelope have ` +
      'drifted. Regenerate the greeting asset, then this envelope.',
  );
}

// Decode to signed 16-bit mono PCM at 8 kHz, straight to stdout. `-v error`
// keeps the pipe clean of ffmpeg's banner so the buffer is nothing but samples.
let pcm;
try {
  pcm = execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', MP3_PATH, '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 's16le', '-'],
    { maxBuffer: 1 << 28 },
  );
} catch (error) {
  fail(`ffmpeg failed to decode the greeting: ${error instanceof Error ? error.message : error}`);
}

const sampleCount = Math.floor(pcm.length / 2);
if (sampleCount < BUCKETS) {
  fail(`decoded only ${sampleCount} samples — too few to fill ${BUCKETS} buckets.`);
}

// RMS per bucket over the full duration: bucket i owns the samples in
// [i·N/256, (i+1)·N/256). RMS (not peak) so a single click does not spike a
// bucket; loudness, which is what the eye reads as height, is an energy average.
const raw = new Float64Array(BUCKETS);
for (let b = 0; b < BUCKETS; b += 1) {
  const start = Math.floor((b * sampleCount) / BUCKETS);
  const end = Math.floor(((b + 1) * sampleCount) / BUCKETS);
  let sumSquares = 0;
  for (let i = start; i < end; i += 1) {
    const sample = pcm.readInt16LE(i * 2) / 32768;
    sumSquares += sample * sample;
  }
  const n = end - start;
  raw[b] = n > 0 ? Math.sqrt(sumSquares / n) : 0;
}

// Peak-normalise so the loudest moment reads as 1.0 and the axis is the voice's
// own dynamic range rather than an absolute dBFS the reader cannot see.
let peak = 0;
for (let b = 0; b < BUCKETS; b += 1) {
  if (raw[b] > peak) peak = raw[b];
}
if (peak <= 0) {
  fail('the greeting decoded to silence — every RMS bucket is zero.');
}

const envelope = new Array(BUCKETS);
for (let b = 0; b < BUCKETS; b += 1) {
  // Five decimals: below what an 8-bit R8 texture can carry, so the file is
  // small and stable across rebuilds while losing nothing the shader can show.
  envelope[b] = Math.round((raw[b] / peak) * 1e5) / 1e5;
}

// A waveform, not a constant: the peak is 1.0 by construction, and a real voice
// has at least one bucket at a tenth of it or less (the lead-in, a pause, the
// tail). If it does not, something upstream flattened the signal — fail rather
// than ship a band that only looks like data.
const hasLoud = envelope.some((v) => v >= 0.9);
const hasQuiet = envelope.some((v) => v <= 0.1);
if (!hasLoud || !hasQuiet) {
  fail(
    `the envelope is not a waveform (loud≥0.9: ${hasLoud}, quiet≤0.1: ${hasQuiet}); ` +
      'the greeting may have been normalised or trimmed to a constant level.',
  );
}

// Duration from the container, not from the sample count: the same figure the
// caliper's reading is drawn from (LISTEN-FLAGSHIP.md C5), measured once here so
// it can never be typed by hand.
let durationSeconds;
try {
  const probed = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', MP3_PATH],
    { encoding: 'utf8' },
  ).trim();
  durationSeconds = Number(probed);
} catch (error) {
  fail(`ffprobe failed to read the greeting duration: ${error instanceof Error ? error.message : error}`);
}
if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
  fail(`ffprobe returned a non-positive duration (${durationSeconds}).`);
}

const file = `/**
 * GENERATED FILE — do not edit.
 *
 * Written by scripts/build/greeting_envelope.mjs on every build, from the bytes
 * of public/assets/minivic-greeting.mp3: ffmpeg decodes it to mono PCM, this
 * script folds the samples into ${BUCKETS} RMS buckets and peak-normalises them
 * to 0 → 1. \`#listen\`'s field uploads \`envelope\` as a ${BUCKETS}×1 texture and
 * the band's height at each x is the greeting's loudness at that moment — the
 * closing light is the shape of him speaking, not a sine.
 *
 * \`sourceSha256\` is the SHA-256 of the MP3, asserted equal to
 * \`greetingAudioSha256\` in ./greeting-asset.ts at build time so a regenerated
 * greeting can never keep a stale envelope. Verify:
 * \`sha256sum public/assets/minivic-greeting.mp3\`.
 */
export const greetingEnvelope = {
  /** ${BUCKETS} peak-normalised RMS loudness buckets across the greeting, each 0 → 1. */
  envelope: [
${envelope.map((v, i) => `    ${v}${i === BUCKETS - 1 ? '' : ','}`).join('\n')}
  ],
  /** The greeting's length in seconds, from \`ffprobe\` on the MP3. */
  durationSeconds: ${durationSeconds},
  /** SHA-256 of the MP3 these buckets were read from; equals greetingAudioSha256. */
  sourceSha256: '${sourceSha256}',
} as const;
`;

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, file, 'utf8');
console.log(
  `[greeting-envelope] ${BUCKETS} buckets · peak 1.0 · ${durationSeconds.toFixed(3)} s · ${sourceSha256.slice(0, 8)}`,
);
