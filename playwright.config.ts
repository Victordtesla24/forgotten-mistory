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
  globalSetup: './tests/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The GPU-less CI runner serves a heavy WebGL page; serialising at workers:1 blew
  // past the job timeout. The production build has no on-demand compilation, so the
  // suite parallelises safely.
  workers: process.env.CI ? 3 : 2,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:8080',
  },
  projects: [
    {
      name: 'chromium',
      // CI installs the pinned Chromium build; local runs fall back to the
      // system Chrome so contributors don't need a browser download.
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
    },
  ],
  webServer: {
    // In CI the on-demand Next dev compiler made the heavy WebGL/R3F pages take
    // HOURS (the E2E job ran 2h+ and timed out). Serve a real production build
    // instead — deterministic and fast. Locally, reuse a running dev server (or
    // start one) so the contributor loop stays instant.
    command: process.env.CI ? 'npm run build && npx next start -p 8080' : 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 240000,
  },
});
