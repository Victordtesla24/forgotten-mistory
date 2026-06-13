import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * Static-gate TC bindings (no browser): the runnable audit + strict typecheck.
 * TC-NFR-TONE / MONO / PERF / PARITY / TYPE / SEC / ARCH-BENCH ← overhaul_static_audit.mjs (7/7).
 * TC-NFR-TS ← `tsc --noEmit` exits 0 under strict.
 */

test.describe('Static gates', () => {
  test.describe.configure({ timeout: 180000 });

  test('TC-NFR-TONE/MONO/PERF/PARITY/TYPE/SEC + ARCH-BENCH — static audit ALL PASS (7/7)', () => {
    const out = execSync('node scripts/validate/overhaul_static_audit.mjs', { encoding: 'utf8' });
    expect(out).toContain('ALL PASS');
  });

  test('TC-NFR-TS — strict tsc --noEmit exits 0', () => {
    // execSync throws on non-zero exit; reaching the assertion means it passed.
    execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    expect(true).toBe(true);
  });
});
