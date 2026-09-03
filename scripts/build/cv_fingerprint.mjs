/**
 * cv_fingerprint.mjs — stamps the calibration card's footer from the real file.
 *
 * The Skills section claims to be calibrated against the CV. That claim is only
 * worth printing if it is derived from the actual bytes of the actual PDF at
 * build time, so this script hashes the file and writes the digest into a
 * generated module the section imports. Hand-typing the hash would make the
 * footer a decoration that says "trustworthy" instead of a fact that is.
 *
 * Runs before `next build` (see package.json build:static). Fails loudly if the
 * CV is missing — a calibration card with no instrument to calibrate against is
 * worse than no card.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const CV_PATH = join(ROOT, 'public', 'docs', 'Vik_Resume_Final.pdf');
const OUT_PATH = join(ROOT, 'app', 'data', 'generated', 'cv-fingerprint.ts');

let bytes;
try {
  bytes = readFileSync(CV_PATH);
} catch {
  console.error(
    `[cv-fingerprint] FATAL: ${CV_PATH} is missing. The Skills section prints a ` +
      'digest of this file; it cannot be built without it.',
  );
  process.exit(1);
}

const digest = createHash('md5').update(bytes).digest('hex');
const short = digest.slice(0, 8);
// Size only. The file's mtime is when this checkout wrote it, not when the
// document was authored, and the page previously printed it as "document dated".
const { size } = statSync(CV_PATH);

const file = `/**
 * GENERATED FILE — do not edit.
 *
 * Written by scripts/build/cv_fingerprint.mjs on every build, from the bytes of
 * public/docs/Vik_Resume_Final.pdf. The Skills section prints this digest so a
 * reader can verify for themselves that the page and the CV are the same
 * document: \`md5sum public/docs/Vik_Resume_Final.pdf\`.
 */
export const cvFingerprint = {
  /** Full MD5 of the CV as shipped. */
  md5: '${digest}',
  /** The short form printed in the calibration footer. */
  short: '${short}',
  bytes: ${size},
} as const;
`;

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, file, 'utf8');
console.log(`[cv-fingerprint] ${short} · ${size} bytes`);
