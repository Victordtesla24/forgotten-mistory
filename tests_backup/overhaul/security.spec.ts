import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * TC-NFR-SEC (static) — fail loud, not fail safe (SPEC NFR-SEC / §0.1 DEV-8 / CLAUDE.md rule 6).
 *
 * The static Firebase export inlines a RESTRICTED, HTTP-referrer-locked *public*
 * Gemini key for the client-side MiniVic brain (the real secret stays in the
 * services/ gateway). It is still required at build time: a missing key must
 * crash the build naming the variable, never silently inline an empty string.
 *
 * These assertions drive `next.config.js` directly (require() triggers the guard
 * at config-eval time) so the missing-key path surfaces the named key.
 */

function loadConfig(env: Record<string, string>): { ok: boolean; out: string } {
  try {
    const out = execSync(
      `node -e "require(process.cwd()+'/next.config.js'); process.stdout.write('CONFIG_OK')"`,
      { encoding: 'utf8', stdio: 'pipe', env: { ...process.env, ...env } },
    );
    return { ok: true, out };
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string; message?: string };
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}${err.message ?? ''}` };
  }
}

test.describe('TC-NFR-SEC — fail-loud required keys', () => {
  test('missing GEMINI_API_KEY fails the production static-export config, naming the key', () => {
    const r = loadConfig({ FIREBASE_STATIC_EXPORT: '1', NODE_ENV: 'production', GEMINI_API_KEY: '' });
    expect(r.ok, `config unexpectedly loaded:\n${r.out}`).toBe(false);
    expect(r.out, 'fail-loud message must name the missing key').toContain('GEMINI_API_KEY');
  });

  test('present GEMINI_API_KEY loads the static-export config cleanly', () => {
    const r = loadConfig({
      FIREBASE_STATIC_EXPORT: '1',
      NODE_ENV: 'production',
      GEMINI_API_KEY: 'AIzaTESTrestrictedpublickey0000000000000',
    });
    expect(r.ok, `config should load with the key present:\n${r.out}`).toBe(true);
    expect(r.out).toContain('CONFIG_OK');
  });

  test('dev / non-static build does not require the key (no false crash)', () => {
    const r = loadConfig({ FIREBASE_STATIC_EXPORT: '', NODE_ENV: 'development', GEMINI_API_KEY: '' });
    expect(r.ok, `dev build must not require the key:\n${r.out}`).toBe(true);
    expect(r.out).toContain('CONFIG_OK');
  });

  test('security headers present on the served document (CSP/HSTS/etc.)', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const h = res!.headers();
    expect(h['content-security-policy'] ?? '', 'CSP missing').toContain("frame-ancestors 'none'");
    expect(h['content-security-policy'] ?? '').toContain("default-src 'self'");
    expect(h['content-security-policy'] ?? '').toContain("object-src 'none'");
    expect(h['strict-transport-security'] ?? '', 'HSTS missing').toContain('max-age=');
    expect(h['x-content-type-options'], 'nosniff missing').toBe('nosniff');
    expect(h['x-frame-options'], 'X-Frame-Options missing').toBe('DENY');
    expect(h['referrer-policy'] ?? '', 'Referrer-Policy missing').toBeTruthy();
    expect(h['permissions-policy'] ?? '', 'Permissions-Policy missing').toContain('camera=()');
  });

  test('no high-severity secret leaks into the static export (out/)', () => {
    test.skip(!existsSync('out'), 'out/ not built in this run; CI builds then scans');
    // The restricted *public* Gemini key (AIza…, DEV-8) is allowed to be inlined; this
    // guards against true secrets (provider tokens, private keys) ever shipping to clients.
    const hits = execSync(
      "grep -rIlE 'sk-[A-Za-z0-9]{20,}|xai-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----' out || true",
      { encoding: 'utf8' },
    ).trim();
    expect(hits, `secret-like patterns found in out/:\n${hits}`).toBe('');
  });
});
