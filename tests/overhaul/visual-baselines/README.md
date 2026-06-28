# Visual Regression Baselines

Per-signature-scene per-breakpoint screenshot baselines for TC-NFR-RENDER.

## Structure

Playwright-managed baselines live in `tests/baselines/` (per `playwright.config.ts` snapshotDir).
The `render.spec.ts` tests use `toHaveScreenshot()` which auto-generates baselines on first run
with `UPDATE_SNAPSHOTS=1`.

## Generating Baselines

```bash
# Generate all render baselines
UPDATE_SNAPSHOTS=1 npx playwright test tests/overhaul/render.spec.ts --timeout=120000

# Update a specific snapshot
UPDATE_SNAPSHOTS=1 npx playwright test tests/overhaul/render.spec.ts:184 --timeout=120000
```

## Existing Baselines (as of 2026-06-28)

| Scene | Breakpoint | Baseline File | Status |
|---|---|---|---|
| Hero text content | 1280px (Desktop Chrome) | hero-text-content-chromium-darwin.png | VERIFIED |
| Work section VFX gallery | 1280px (Desktop Chrome) | work-section-chromium-darwin.png | VERIFIED |

## Note

The full hero section (`#hero`) cannot use `toHaveScreenshot()` because it contains a
continuously-animating R3F starfield canvas (SpaceScene) that prevents Playwright from
capturing two consecutive stable screenshots. The hero text content overlay
(`#hero .hero-content`) is used instead for stable visual regression.

## Breakpoint Plan (for future expansion)

Per SPEC §10, baselines should be captured at 375/768/1280/2560 px breakpoints.
The current Playwright config uses a single Desktop Chrome project. Multi-breakpoint
coverage requires additional Playwright projects in `playwright.config.ts`:

```ts
{
  name: 'mobile',
  use: { ...devices['iPhone 14'], viewport: { width: 375, height: 812 } },
},
{
  name: 'tablet',
  use: { ...devices['iPad Pro 11'], viewport: { width: 768, height: 1024 } },
},
{
  name: 'desktop-xl',
  use: { ...devices['Desktop Chrome'], viewport: { width: 2560, height: 1440 } },
},
```
