import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // No globalSetup and no webServer: the static export in `out/` is built and
  // served separately, and the suite is pointed at it with PLAYWRIGHT_BASE_URL.
  // This is deliberate. Each spec used to kick off `npm run build:static` from
  // its own beforeAll; under fullyParallel those builds raced and corrupted each
  // other's build dir (ENOENT _error.js / _not-found.rsc, ENOTEMPTY .next/export),
  // failing ~46 specs at once for a reason that had nothing to do with any of
  // them. The `tests/global-setup.ts` no-op that replaced that arrangement was
  // itself deleted once nothing referenced it. In CI the export is prebuilt as a
  // dedicated step (deploy.yml).
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],
  timeout: process.env.CI ? 180000 : 90000, // 3 min timeout in CI, 1.5 min locally
  use: {
    trace: 'on-first-retry',
    // Orchestrator lane serves `npm run dev` on :8080; allow override for CI/static.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
      // Allow describe-level overrides (telemetry-stability / hero D-NAME suites).
      timeout: 90000,
    },
  ],
  // Snapshot config for visual-regression (toHaveScreenshot)
  snapshotDir: './tests/baselines',
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === '1' ? 'all' : 'missing',
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  // webServer removed — dev server is already running on :5599 (started manually)
  // Run `npx next dev -p 5599` before running tests
});