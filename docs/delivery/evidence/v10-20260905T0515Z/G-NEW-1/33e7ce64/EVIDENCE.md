# G-NEW-1 tester evidence — ADV-1556Z (task t_g_new1t)

Independent tester probe of the **LIVE** site `https://forgotten-mistory.web.app/` at viewport **390**.
Do-not-implement-CSS lane; evidence-only.

## Live build-commit

```
$ curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
build-commit" content="33e7ce64"
```

Note: at the start of this session (17:01Z) the page reported `b2ac21be`; the site was
**redeployed mid-session** and now reports `33e7ce64` (confirmed stable across 3 consecutive
reads). Assertions below were run against the live page and hold on both builds. Authoritative
live commit for this run: **33e7ce64**.

## Method

Headless Chrome (system `google-chrome` via Playwright `channel:'chrome'`, `--no-sandbox`),
context `viewport 390x844, deviceScaleFactor 2, isMobile`. Scripts:
- `probe-390.mjs` — assert computed style + capture.
- `probe-390b.mjs` — reveal-state + hit-test diagnostics.

## Assertions (all against live DOM at innerWidth=390)

- `.minivic-launcher__pill` found: **true**
- computed `display`: **block** → **!== none** ✅ (PASS gate)
- computed `visibility`: visible, `opacity`: 1
- visible text: **"Ask Mini Vic"** (this is the rendered `<span>` text, `aria-hidden="true"`)
- the button's separate `aria-label` = `"Ask Mini Vic — Vikram's AI clone"` — so the pill text is
  **visible (non-aria) text**, exactly as required (not aria-only). ✅

### Reveal behaviour (why the top-of-page shot does not show it)
The launcher is `position: static`, pinned in the viewport (rect top≈776 constant across scroll).
At scroll 0 the hero portrait video overlays it (`pointer-events: none`; `elementFromPoint` →
`Hero_portraitVideo`). After scrolling into content, `pointer-events: auto` and `elementFromPoint`
→ `minivic-launcher__pill` (topmost, un-occluded). It is genuinely rendered — see screenshot.

## Screenshots (390 viewport)

- `minivic-launcher-390-33e7ce64.png` — **shows "Ask Mini Vic" pill** (bottom-right), primary gate evidence.
- `minivic-launcher-390-33e7ce64-pill.png` — element crop of `.minivic-launcher`.
- `hero-390-33e7ce64.png` — hero at scroll 0 (launcher occluded by portrait, expected).

## Raw probe output (probe-390.mjs)

```json
{
  "buildCommit": "33e7ce64",
  "probe": {
    "innerWidth": 390, "found": true,
    "display": "block", "visibility": "visible", "opacity": "1",
    "ariaHidden": "true", "text": "Ask Mini Vic",
    "rect": { "w": 106.375, "h": 29.09375, "top": 783.45, "left": 207.625 },
    "btnAriaLabel": "Ask Mini Vic — Vikram's AI clone", "btnDisplay": "flex"
  }
}
```

## Gates

| Gate | Result |
|------|--------|
| 390 screenshot shows "Ask Mini Vic" | PASS (`minivic-launcher-390-33e7ce64.png`) |
| pill computed `display` !== none | PASS (`display: block`) |
| visible text (not aria-only) | PASS (span text, aria-hidden; distinct from button aria-label) |
| build-commit recorded | PASS (`33e7ce64`) |

**VERDICT: PASS**
