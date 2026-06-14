import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * Static-gate TC bindings (no browser): the runnable audit + strict typecheck.
 * TC-NFR-TONE / MONO / PERF / PARITY / TYPE / SEC / ARCH-BENCH / COMPLETE
 *   ← overhaul_static_audit.mjs (8/8).
 * TC-NFR-TS ← `tsc --noEmit` exits 0 under strict.
 */

test.describe('Static gates', () => {
  test.describe.configure({ timeout: 180000 });

  test('TC-NFR-TONE/MONO/PERF/PARITY/TYPE/SEC/ARCH-BENCH/COMPLETE — static audit ALL PASS (8/8)', () => {
    const out = execSync('node scripts/validate/overhaul_static_audit.mjs', { encoding: 'utf8' });
    expect(out).toContain('ALL PASS');
    // Pin the expected check count so a silently-dropped check fails the gate.
    expect(out).toContain('(8/8)');
  });

  test('TC-NFR-TS — strict tsc --noEmit exits 0', () => {
    // execSync throws on non-zero exit; reaching the assertion means it passed.
    execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    expect(true).toBe(true);
  });
});
