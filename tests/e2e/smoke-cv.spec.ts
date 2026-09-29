import { test, expect } from '@playwright/test';

/**
 * Smoke: the CV dossier is downloadable (J2, UX-C0-001).
 *
 * Runs against the static export in the `gates` job and against production in
 * the `deploy` job (`--grep @smoke`). It checks the one artefact a recruiter
 * leaves the page with: the PDF must answer 200 with a PDF content-type and a
 * real body. The MD5 parity with the Skills fingerprint is asserted by
 * TC-SKILL-08; this test only guards the wire.
 *
 * Note: python3's http.server (the CI static server) labels .pdf as
 * application/pdf too, so the content-type assertion holds on both hosts.
 */
test('TC-SMOKE-CV-01: the CV dossier answers 200 as a PDF @smoke', async ({ request }) => {
  const response = await request.get('/docs/Vik_Resume_Final.pdf');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type'] ?? '').toContain('application/pdf');
  const body = await response.body();
  expect(body.byteLength).toBeGreaterThan(10_000);
  expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
});
