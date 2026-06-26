import { test, expect } from '@playwright/test';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ensureStaticBuild, OUT } from './helpers/staticServer';

/**
 * TC-CI-BUILD-ONCE — regression guard for the long-red CI `test` job.
 *
 * The job failed because boot/perf/durable/reduced-motion each ran
 * `npm run build:static` (`rm -rf .next out && next build`) from their beforeAll;
 * with fullyParallel + workers:3 those builds raced on a cold checkout and corrupted
 * each other's `.next` (~46 cascading failures). The fix builds `out/` once in
 * globalSetup so every per-spec `ensureStaticBuild()` is a no-op.
 *
 * This guard pins both halves of that contract:
 *   1. globalSetup actually produced the static export (`out/index.html` exists).
 *   2. `ensureStaticBuild()` does NOT rebuild when the export is fresh — a rebuild
 *      would `rm -rf .next out` from inside a worker and re-open the exact race.
 *      We assert the export's mtime is unchanged across repeated calls (a rebuild
 *      rewrites index.html and bumps the mtime).
 */
test.describe('TC-CI-BUILD-ONCE — static export is built once, never re-raced', () => {
  test('globalSetup built out/ and ensureStaticBuild() is a no-op when fresh', () => {
    const index = join(OUT, 'index.html');
    expect(
      existsSync(index),
      'globalSetup should have produced out/index.html before any spec runs',
    ).toBe(true);

    const mtimeBefore = statSync(index).mtimeMs;
    // Two extra calls mirror what concurrent workers do — both must short-circuit.
    ensureStaticBuild();
    ensureStaticBuild();
    const mtimeAfter = statSync(index).mtimeMs;

    expect(
      mtimeAfter,
      'ensureStaticBuild() rebuilt a fresh export — this re-introduces the worker build race',
    ).toBe(mtimeBefore);
  });
});
