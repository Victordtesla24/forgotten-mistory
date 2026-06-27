import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:8080',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  // Snapshot config for visual-regression (toHaveScreenshot)
  snapshotDir: './tests/screenshots',
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === '1' ? 'all' : 'missing',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,   // 1% pixel diff threshold
      threshold: 0.2,            // per-pixel colour tolerance
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
