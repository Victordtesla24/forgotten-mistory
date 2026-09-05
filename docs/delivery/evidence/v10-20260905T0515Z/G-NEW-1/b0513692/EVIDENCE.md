# G-NEW-1 tester re-probe — build-commit b0513692 (task t_g_new1t)

Independent tester re-probe of the **LIVE** site `https://forgotten-mistory.web.app/` at viewport **390**
after a fresh deploy. Do-not-implement-CSS lane; evidence-only.

## Live build-commit

```
$ curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
build-commit" content="b0513692"   # stable across 3 consecutive reads
```

Prior session builds: `b2ac21be` (17:01Z) → `33e7ce64` (17:09Z) → **`b0513692`** (17:22Z, current).

## Method

Headless Chrome (system `google-chrome` via Playwright `channel:'chrome'`, `--no-sandbox`),
context `viewport 390x844, deviceScaleFactor 2, isMobile`. Scripts `probe-390.mjs`, `probe-390b.mjs`.

## Assertions at innerWidth=390 (live DOM)

- `.minivic-launcher__pill` found: **true**
- computed `display`: **block** → **!== none** ✅
- computed `visibility`: visible, `opacity`: 1
- visible text: **"Ask Mini Vic"** — rendered `<span aria-hidden="true">` (NOT aria-only; the button's
  distinct `aria-label` = `"Ask Mini Vic — Vikram's AI clone"`). ✅
- reveal: launcher is `position: static`, pinned in viewport; occluded by hero portrait at scroll 0
  (`pointer-events:none`, `elementFromPoint` → `Hero_portraitVideo`); after scroll it is topmost
  (`elementFromPoint` → `minivic-launcher__pill`). Screenshot confirms visible render.

## Screenshots (390)

- `minivic-launcher-390-b0513692.png` — **shows "Ask Mini Vic" pill** (bottom-right). Primary gate evidence.
- `minivic-launcher-390-b0513692-pill.png` — element crop of `.minivic-launcher`.
- `hero-390-b0513692.png` — hero at scroll 0 (launcher occluded by portrait, expected).

## Gates

| Gate | Result |
|------|--------|
| 390 screenshot shows "Ask Mini Vic" | PASS |
| pill computed `display` !== none | PASS (`display: block`) |
| visible text (not aria-only) | PASS |
| build-commit recorded | PASS (`b0513692`) |

**VERDICT: PASS**
