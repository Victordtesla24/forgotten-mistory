/**
 * hero_assets_monochrome.test.mjs — the hero portrait, checked in the bytes.
 *
 * docs/prompt.md §0.3-2 / C-8 and CLAUDE.md prime directive 4 say the site is
 * black, white and gold, and gold means one thing: this figure has a source.
 * Until 2026-09-06 the hero photograph and its loop were the one documented
 * chromatic exception (docs/architecture/PALETTE-EXCEPTIONS.md). That register
 * is retired: the mandate's literal palette wins, and the photograph ships
 * monochrome as re-encoded pixels — never as a `grayscale()` filter laid over a
 * colour file, and never at a resolution the source cannot honestly carry.
 *
 * This file is the pixel-level half of that contract. Every palette gate on the
 * site reads code (source colour literals, served CSS, computed styles); none of
 * them can see a raster asset, so a colour photograph could ship past all three.
 * These assertions read the actual decoded pixels of the three stills and three
 * frames of the loop, and they are the only guard that can catch it.
 *
 * The second half is honesty about resolution (G-H5): the loop is the owner's
 * hero video avatar at the name docs/prompt.md §0.3-3 gives it —
 * public/assets/my-hero-avatar.mp4 — at the measured ceiling of the best real
 * source on this host, 1280×720 @ 24 fps. No upscale is presented as anything
 * higher, and the retired duplicate name must be gone (R4: one binary, one URL,
 * a 301 in firebase.json for the old name).
 *
 * Usage:  node --test tests/hero_assets_monochrome.test.mjs
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'public', 'assets');

/** The canonical hero video avatar name, from docs/prompt.md §0.3-3. */
const LOOP = join(ASSETS, 'my-hero-avatar.mp4');
/** The name it replaces. One binary, one URL — the old name is a 301, not a file. */
const RETIRED_LOOP = join(ASSETS, 'my-avatar.mp4');

/** The measured ceiling of the best real portrait source on this host (S-2). */
const LOOP_WIDTH = 1280;
const LOOP_HEIGHT = 720;

/** The still master, measured with `identify` — all three formats share it. */
const STILL_WIDTH = 1480;
const STILL_HEIGHT = 826;

/**
 * Per-pixel chroma: max(|R-G|, |G-B|, |R-B|). Zero for a true grey. The
 * tolerance of 2/255 is the rounding budget of a YUV round-trip (the video is
 * 4:2:0 with flat chroma planes; WebP and AVIF likewise carry chroma planes),
 * not a licence for a hue — 2/255 is below the threshold of visibility.
 */
const CHROMA_MAX = 2;

/** Decode any raster to raw RGB and report the chroma distribution. */
async function chromaProfile(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  let worst = 0;
  let offenders = 0;
  let total = 0;
  for (let i = 0; i + channels - 1 < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const chroma = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (chroma > worst) worst = chroma;
    if (chroma > CHROMA_MAX) offenders += 1;
    total += 1;
  }
  return { worst, offenders, total, width: info.width, height: info.height };
}

function ffprobe(file, entries) {
  return execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'default=noprint_wrappers=1:nokey=1', file],
    { encoding: 'utf8' },
  )
    .trim()
    .split('\n');
}

describe('Hero stills are true greyscale in the bytes (G-H6)', () => {
  for (const name of ['my_avatar.png', 'my_avatar.webp', 'my_avatar.avif']) {
    it(`${name}: every pixel has chroma ≤ ${CHROMA_MAX}`, async () => {
      const file = join(ASSETS, name);
      assert.ok(existsSync(file), `${relative(ROOT, file)} is missing`);
      const { worst, offenders, total, width, height } = await chromaProfile(file);
      assert.equal(
        offenders,
        0,
        `${name}: ${offenders}/${total} pixels carry a hue (worst chroma ${worst}/255). `
        + 'The photograph must be re-encoded greyscale, not filtered in CSS.',
      );
      assert.equal(width, STILL_WIDTH, `${name} width`);
      assert.equal(height, STILL_HEIGHT, `${name} height`);
    });
  }
});

describe('The hero loop is true greyscale at its measured ceiling (G-H6, G-H5)', () => {
  let dir;
  const frames = [];

  before(() => {
    assert.ok(existsSync(LOOP), `${relative(ROOT, LOOP)} is missing — it is the canonical hero video avatar`);
    const [durationRaw] = ffprobe(LOOP, 'format=duration');
    const duration = Number.parseFloat(durationRaw);
    assert.ok(Number.isFinite(duration) && duration > 1, `loop duration is measurable: ${durationRaw}`);
    dir = mkdtempSync(join(tmpdir(), 'hero-loop-frames-'));
    // First, middle and last frame — a hue that survives only part of the clip
    // is still a hue.
    const stamps = [0, duration / 2, Math.max(0, duration - 0.2)];
    for (const [i, at] of stamps.entries()) {
      const out = join(dir, `frame-${i}.png`);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(at), '-i', LOOP, '-frames:v', '1', out]);
      frames.push({ at, out });
    }
  });

  after(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('frames 0, mid and last carry no hue', async () => {
    for (const { at, out } of frames) {
      const { worst, offenders, total } = await chromaProfile(out);
      assert.equal(
        offenders,
        0,
        `loop frame at ${at.toFixed(2)}s: ${offenders}/${total} pixels carry a hue (worst chroma ${worst}/255)`,
      );
    }
  });

  it(`is ${LOOP_WIDTH}×${LOOP_HEIGHT} — the honest ceiling, never presented as 4K`, () => {
    const [width, height] = ffprobe(LOOP, 'stream=width,height');
    assert.equal(Number(width), LOOP_WIDTH, 'loop width');
    assert.equal(Number(height), LOOP_HEIGHT, 'loop height');
  });

  it('is under the 5 MB video budget', () => {
    const bytes = statSync(LOOP).size;
    assert.ok(bytes < 5_000_000, `loop is ${bytes} B`);
  });

  it('the retired duplicate name ships no second binary (R4)', () => {
    assert.equal(
      existsSync(RETIRED_LOOP),
      false,
      `${relative(ROOT, RETIRED_LOOP)} still exists — the old name is a 301 in firebase.json, not a file`,
    );
  });
});

/* -------------------------------------------------------------------------- */
/* The on-demand rungs (G-H5).                                                 */
/*                                                                            */
/* The 720p file above is the default and the fallback, and it is the only     */
/* rung on the 2.5 MB critical-path video budget. It is not the ceiling of the */
/* source: the master on this host is 3840x2160 @ 24 fps, so claiming 720p as  */
/* an honest maximum was false and every larger URL the ladder implied 404'd   */
/* (ADV-REVIEW-20260905T2315Z / reviewer 56ffed3e, G-H5). The larger encodes   */
/* now ship under public/assets/avatar/, which                                 */
/* scripts/validate/overhaul_static_audit.mjs gives a 5 MB on-demand budget    */
/* because that <video> carries no `src` until a reader presses play.          */
/*                                                                            */
/* These assertions read the shipped bytes of every rung the data file         */
/* declares — dimensions, frame rate, size and hue — so a rung cannot be       */
/* declared and not shipped, shipped at a size it does not have, upscaled past */
/* the master, or quietly re-encoded in colour.                               */
/* -------------------------------------------------------------------------- */

/** The genuine master this whole ladder is cut from. Never committed (58 MB). */
const MASTER = { width: 3840, height: 2160, fps: 24 };
/** ON_DEMAND_VIDEO in scripts/validate/overhaul_static_audit.mjs. */
const ON_DEMAND_BUDGET = 5 * 1024 * 1024;

/** The ladder as app/data/portfolio/avatar.ts declares it — parsed, not retyped. */
function declaredLadder() {
  const source = readFileSync(join(ROOT, 'app', 'data', 'portfolio', 'avatar.ts'), 'utf8');
  const block = source.slice(source.indexOf('ladder: ['));
  const rungs = [];
  for (const m of block.matchAll(
    /height:\s*(\d+),\s*\n\s*width:\s*(\d+),\s*\n\s*src:\s*'([^']+)',[\s\S]*?type:\s*'([^']+)'/g,
  )) {
    rungs.push({ height: Number(m[1]), width: Number(m[2]), src: m[3], type: m[4] });
  }
  return rungs;
}

describe('The loop ships a real ladder, not a claim (G-H5)', () => {
  const ladder = declaredLadder();

  it('declares three ascending rungs, the 720p file first', () => {
    assert.equal(ladder.length, 3, `avatar.ts declares ${ladder.length} rungs: ${JSON.stringify(ladder)}`);
    assert.deepEqual(
      ladder.map((r) => r.height),
      [720, 1080, 2160],
      'the ladder is ascending and reaches the master resolution',
    );
    assert.equal(ladder[0].src, '/assets/my-hero-avatar.mp4', 'the base rung is the canonical critical-path file');
  });

  for (const rung of ladder) {
    const file = join(ROOT, 'public', rung.src.replace(/^\//, ''));
    const name = rung.src;

    it(`${name}: exists, and is ${rung.width}x${rung.height} @ ${MASTER.fps} fps as declared`, () => {
      assert.ok(existsSync(file), `${relative(ROOT, file)} is declared in avatar.ts but not shipped`);
      const [width, height, rate] = ffprobe(file, 'stream=width,height,r_frame_rate');
      assert.equal(Number(width), rung.width, `${name} width`);
      assert.equal(Number(height), rung.height, `${name} height`);
      const [num, den] = rate.split('/').map(Number);
      assert.equal(Math.round(num / (den || 1)), MASTER.fps, `${name} frame rate`);
    });

    it(`${name}: is a downscale of the master, never an upscale`, () => {
      assert.ok(
        rung.width <= MASTER.width && rung.height <= MASTER.height,
        `${name} is ${rung.width}x${rung.height}, larger than the ${MASTER.width}x${MASTER.height} master`,
      );
    });

    it(`${name}: is under the ${(ON_DEMAND_BUDGET / 1048576).toFixed(0)} MB on-demand budget`, () => {
      const bytes = statSync(file).size;
      assert.ok(bytes <= ON_DEMAND_BUDGET, `${name} is ${(bytes / 1048576).toFixed(2)} MB`);
    });

    it(`${name}: frames 0, mid and last carry no hue`, async () => {
      const [durationRaw] = ffprobe(file, 'format=duration');
      const duration = Number.parseFloat(durationRaw);
      assert.ok(Number.isFinite(duration) && duration > 1, `${name} duration is measurable: ${durationRaw}`);
      const dir = mkdtempSync(join(tmpdir(), 'rung-frames-'));
      try {
        for (const [i, at] of [0, duration / 2, Math.max(0, duration - 0.2)].entries()) {
          const out = join(dir, `frame-${i}.png`);
          execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(at), '-i', file, '-frames:v', '1', out]);
          const { worst, offenders, total } = await chromaProfile(out);
          assert.equal(
            offenders,
            0,
            `${name} at ${at.toFixed(2)}s: ${offenders}/${total} pixels carry a hue (worst chroma ${worst}/255)`,
          );
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }
});
