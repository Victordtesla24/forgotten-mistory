import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Build the production static export (`out/`) ONCE before the worker pool spawns.
  // Without this, boot/perf/durable/reduced-motion each kicked off `npm run build:static`
  // from their beforeAll; under fullyParallel + workers:3 those builds raced and
  // corrupted each other's build dir (ENOENT _error.js / _not-found.rsc, ENOTEMPTY
  // .next/export), failing ~46 specs and blocking build/deploy. In CI the export is
  // prebuilt as a dedicated step (deploy.yml) so this no-ops there; locally this is the
  // build site. See tests/global-setup.ts for the webServer-ordering caveat.
  // globalSetup removed — dev server is running separately via `npx next dev -p 5599`
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  timeout: 90000,
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:5599',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
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
