import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

/**
 * The suite runs against the static export in `out/`, served the way Firebase
 * Hosting serves it (clean URLs, a real 404.html). Build first: `npm run build`.
 *
 * Locally Playwright drives the system Chrome; CI uses the bundled Chromium.
 * WebGL in headless Chrome needs the SwiftShader flags below.
 */
const port = Number(process.env.PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;
const inCI = Boolean(process.env.CI);

if (!existsSync('out/index.html')) {
  throw new Error('out/ has no static export to test. Run `npm run build` first.');
}

const browser = {
  channel: inCI ? undefined : 'chrome',
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  },
} as const;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: inCI,
  retries: inCI ? 1 : 0,
  workers: inCI ? 2 : 3,
  reporter: [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    colorScheme: 'dark',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'], ...browser, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      grepInvert: /@desktop/,
      use: {
        ...devices['Desktop Chrome'],
        ...browser,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npx serve out -l ${port} --no-clipboard`,
    url: baseURL,
    reuseExistingServer: !inCI,
    timeout: 30_000,
  },
});
