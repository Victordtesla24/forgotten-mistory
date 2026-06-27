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
    // 127.0.0.1 (not "localhost"): the loopback static server binds IPv4, and
    // "localhost" can resolve to IPv6 ::1 first on some hosts.
    baseURL: 'http://127.0.0.1:8080',
    launchOptions: {
      // The e2e job runs on a GPU-capable runner (see docs/ci-gpu-runner.md). The GPU
      // specs need real hardware GL: CSS backdrop-filter compositing and the heavy
      // R3F/HUD frame rates only work on a GPU — under SwiftShader (GPU-less) backdrop-
      // filter is reported absent and WebGL is ~10-40x too slow (draws<200, rAF~4fps).
      // --ignore-gpu-blocklist / --enable-gpu-rasterization let Chromium use the runner's
      // GPU even if blocklisted; --enable-unsafe-swiftshader stays as a SAFE fallback so
      // WebGL still initialises if hardware GL is unavailable (it is ignored when a real
      // GPU is present). The backgrounding flags stop Chromium throttling
      // requestAnimationFrame to ~1fps off-foreground, which starves the scene loop and
      // the Framer-Motion reveals the specs assert on.
      args: [
        '--ignore-gpu-blocklist',
        '--enable-gpu-rasterization',
        '--enable-unsafe-swiftshader',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
      ],
    },
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
    // Production is a STATIC EXPORT (out/ -> Firebase Hosting), not an SSR server. In CI
    // serve that real artifact read-only via the same zero-dependency server the visual/
    // FPS jobs use. This (1) is faithful to production, (2) removes the `next start` SSR
    // server whose server-side `fetch` to the absent gateway (127.0.0.1:8000) spammed
    // ECONNREFUSED and broke pages, and (3) skips the backend tiers the static export
    // disables (NEXT_PUBLIC_STATIC_EXPORT=1) so the page is lighter under software WebGL.
    // `out/` is prebuilt by the deploy.yml `test` job (the dedicated `npm run build:static`
    // step) before Playwright starts, so this server always has an artifact to serve, and
    // globalSetup's ensureStaticBuild finds it fresh and no-ops. Locally, reuse/await a
    // running dev server so the contributor loop stays instant.
    command: process.env.CI
      ? 'node scripts/validate/serve_static_out.mjs'
      : 'npm run dev',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 240000,
    env: { PORT: '8080', HOST: '127.0.0.1', STATIC_DIR: 'out' },
  },
});
