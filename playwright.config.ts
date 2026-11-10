import { defineConfig, devices } from '@playwright/test';

/**
 * The suite runs against the static export in `out/`, served separately
 * (`npx serve out -l 4100`); point it elsewhere with PLAYWRIGHT_BASE_URL.
 * Locally Playwright drives the system Chrome; WebGL in headless Chrome needs
 * the SwiftShader flags below.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'chrome',
        launchOptions: {
          args: [
            '--no-sandbox',
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
  ],
});
