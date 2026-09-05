# C16b — the MiniVic correction: decisions

Task `t_c16b0001` (cycle 16b), closing V-c16 **F-V16-2** and **§4 (Label in Name)** and
R-c13 item 8 **CC-03a**. Feature commit `45eb252`.

**Tools used:** Read, Edit, Write, Bash (`npm ci` · `npm run build:static` ·
`npx tsc --noEmit` · `npm run lint` · `node scripts/validate/overhaul_static_audit.mjs` ·
`npx playwright test` · `magick`), Playwright (chromium, channel `chrome`, 2 workers,
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602`), and four measurement probes run **outside**
the repository so no scratch file lands in the tree: `/tmp/c16b_probe.mjs` (launcher +
panel/h1 geometry), `/tmp/c16b_h1sweep.mjs` (h1 glyph extent across 16 widths),
`/tmp/c16b_h1heights.mjs` (the same across a 5 × 9 width/height grid),
`/tmp/c16b_panelparts.mjs` / `…parts2.mjs` (panel internals + hit-testing). Every number
below is reproduced in `01-baseline.log`.

---

## 1. Tests first

Five assertions were written and run against a build of the **unpatched** tree
(`02-tests-failing.log`, 5 failed / 0 passed):

| spec | id | what it said on the unpatched tree |
|------|----|------------------------------------|
| `tests/e2e/chatbot.spec.ts` | TC-BOT-14 @1440×900 | `the panel top 332 must clear the lowest glyph of the hero name (325) by 16px, not sit on it` — 7px |
| `tests/e2e/chatbot.spec.ts` | TC-BOT-07 | `expected aria-label to match /^Ask Mini Vic\b/`, got `Open Mini Vic assistant` |
| `tests/a11y/minivic-launcher.spec.ts` | TC-MV-LABEL-01 | `closed: accessible name "Open Mini Vic assistant" must start with the visible label "Ask Mini Vic"` |
| `tests/a11y/minivic-launcher.spec.ts` | TC-MV-MARK-01 @1440 | `the launcher must paint at least one mark of its own at 1440: svgs=[], innerText="Ask Mini Vic"` |
| `tests/a11y/minivic-launcher.spec.ts` | TC-MV-MARK-01 @390 | `…svgs=[], innerText=""` |

TC-BOT-14 measures what a reader sees rather than what the layout engine boxes: every
`Range.getClientRects()` rect of every text node in `#hero h1`, at 1440×900, 1366×768 and
1280×800 — the reviewer's point that TC-BOT-12's stated invariant was broader than the one
viewport and one block box it actually checked.

## 2. F-V16-2 — why the panel's height, and not its position

The dock is `fixed bottom-6 right-6` and the launcher is 64px, so the panel's bottom edge
is fixed at `100svh − 5.5rem` and its top edge is that minus its own height. At `30rem`
the top landed at y=232 on a 1280×800 laptop while the name's glyphs run to y=301 — a
135 × 69px bite out of "Vikram Deshpande", confirmed in `08-screens` before and after.

Moving it sideways was measured, not assumed. At 1280 the name's glyphs reach x=959 and a
right-flush 27rem panel starts at x=824; clearing them horizontally needs a panel ≤ 281px
wide, and the same arithmetic gives ≤ 217px at 1024 and ≤ 169px at 834 — narrower than the
phone panel. The horizontal branch fails at exactly the widths the vertical branch handles
comfortably, so the height is the lever.

The cap is derived from a grid, not a guess. `/tmp/c16b_h1sweep.mjs` and
`/tmp/c16b_h1heights.mjs` walked 16 widths and a 5 × 9 width/height grid (390…1920 ×
640…1400): the name's lowest glyph never fell below **y=330**, and never above 45% of the
viewport height. Holding the panel's top at **22rem (352px)** clears the measured floor by
22px, which is:

```css
height: max(19rem, min(30rem, calc(100svh - 27.5rem)));
```

Measured after (`01-baseline.log`, second half): clearance **27px** at 1440×900, **62px**
at 1366×768, **51px** at 1280×800, **114px** at 390×844 — and **zero** glyph rects covered
at any of 1440, 1366, 1280, 1024, 834, 390.

**The 19rem floor, stated rather than hidden.** Below ~46.5rem of viewport height the
formula would leave less than the dialog's own chrome. The floor takes over there, and by
measurement the clearance still holds down to about 700px of viewport height (at vh 720 the
name's lowest glyph is ~293 and the panel starts at 328). Below that the guarantee lapses:
the name sits lower than a usable panel can start, and no CSS resolves that — it is a
trade, and this is where it is written down.

## 3. What the shorter panel cost, and what was done about it

At 1366×768 the cap leaves 328px for the whole dialog. With the stage at 160px and the
padding at full size the transcript was **32px** — one line. Three changes gave that back
to the conversation instead of the chrome:

- the stage is `h-40 min-h-[6.5rem] max-h-[32%]`, so it keeps its full 160px whenever
  there is room and shrinks to 104px when there is not;
- below 52rem of viewport height `.minivic-panel__controls` and `.minivic-panel__log` drop
  from `py-4`/`py-3` to `var(--space-1)`;
- the identity strip over the stage is `pointer-events-none`.

That last one is a defect this task introduced and then caught: with the stage under 160px
the absolutely-positioned identity block (`Mini Vic` / `Vikram's AI clone` / the synthetic
-voice disclosure) overlapped the transport row and **intercepted its clicks** —
`TC-BOT-10`, `TC-VOICE-02` and `TC-VOICE-03` failed with
`<div class="absolute inset-x-0 bottom-0 …"> intercepts pointer events`. The strip carries
no controls, so it has no business taking a click. Verified by hit-test:
`document.elementFromPoint` at the Mute button's centre now resolves inside the button at
all five viewports (`/tmp/c16b_panelparts2.mjs`).

Where it lands: transcript 114px at 1440×900, 54px at 1280×800, 32px at 1366×768, 16px at
1280×720 — with the composer, the quick prompts and the persona strip fully inside the
panel at every one. A 768px-tall laptop cannot both keep the page's headline legible and
give the assistant a tall transcript; the headline wins, and the number is recorded here
rather than left to be discovered.

## 4. CC-03a — the launcher paints its own resting state

The launcher shipped **one `<video>` with no source at all** — `currentSrc: ""`, no `src`,
no `<source>`, no `poster`, `readyState: 0` at every viewport measured — and `svgCount: 0`.
At 1440 the portrait and the "Ask Mini Vic" pill carried it; at 390, where the pill is
`display: none`, the control was a dark disc with a dimmed face and nothing else.

- **A permanent mark.** A 24 × 24 inline `<svg>` speech mark, `color: var(--white)`,
  `aria-hidden`, positioned above the portrait and below the video — so it is what the
  control paints before any network request resolves, and the avatar is the enhancement
  over it, which is the order CC-03a asks for.
- **No source-less video.** The element is rendered only when `toggleVideoSrc` has
  resolved, and it carries `poster="/assets/my_avatar.webp"` so its own first paint is the
  face.

**The mark's opacity is bounded, not chosen.** `TC-MV-OCCLUDE-02` caps every pixel the
closed launcher paints at 390 at the brightest ground that still carries `--mist-200` body
ink at 4.5:1 — luminance 0.0968, about rgb(87,87,87). White composited at α over the
portrait lands at `portraitPeak + α(255 − portraitPeak)`, so the portrait steps back to
`brightness(0.12)` below 87.5rem (peak ≈ rgb(33)) and the mark sits at α = 0.22; from
87.5rem up, where the page's own gutter holds the disc clear of the measure, both go to
full value (mark α = 0.92). Measured brightest pixel the closed launcher paints at 390:
**rgb(72,72,72), luminance 0.0648** against the 0.0968 ceiling — inside it with room, and
`TC-MV-OCCLUDE-01` / `TC-CONTRAST-01 @390` stay green.

This is the one place the direction and an existing gate pull against each other, and the
gate wins: a *fully* white mark at 390 would paint luminance 1.0 straight over the reading
column. What ships is the brightest mark the contrast ceiling permits — 2.4:1 against its
own plate, where the previous state was nothing at all.

## 5. Label in Name (WCAG 2.5.3) — and why `aria-expanded`

The pill reads "Ask Mini Vic"; the accessible name said "Open Mini Vic assistant". A
speech-input user reading the control aloud could not reach it. Two ways out: flip the name
between "Ask Mini Vic — open…" / "Ask Mini Vic — close…", or make the name constant and put
the state where a disclosure control belongs. The second is the standard pattern and the
honest one — a name that contradicts itself half the time ("Ask Mini Vic — close") is worse
than no state in the name — so the launcher is now:

```
aria-label="Ask Mini Vic — Vikram's AI clone"   aria-expanded={isOpen}
```

`TC-BOT-07` was re-pointed at that contract rather than deleted: it still asserts the
launcher announces which action it will perform, now through `aria-expanded`, and adds the
prefix rule. Nothing was relaxed — the test is strictly stronger than the string equality
it replaced, because `TC-MV-LABEL-01` additionally requires the name to start with whatever
the pill actually renders, so the two can never drift apart again.

## 6. Gates

| gate | command | observed | exit |
|---|---|---|---|
| types | `npx tsc --noEmit` | no output | 0 |
| lint | `npm run lint` | `✔ No ESLint warnings or errors` | 0 |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)` | 0 |
| build | `npm run build:static` | `RESULT: PASS — no credential material in the emitted bundle.` | 0 |
| suites | `…test tests/e2e/chatbot.spec.ts tests/a11y tests/monochrome tests/overhaul/avatar.spec.ts tests/overhaul/voiceover.spec.ts tests/e2e/avatar-voice.spec.ts tests/content/content-check.spec.ts --workers=2` | `91 passed (2.6m)` | 0 |
| contrast | `…test tests/a11y/text-contrast.spec.ts` | `2 passed` — `TC-CONTRAST-01 @390` and `@1440` | 0 |

`05-battery.log` is the concatenation of the four battery commands;
`04-tests-passing.log` is the suite run. The assigned battery was widened beyond the task's
list to `tests/overhaul/avatar.spec.ts`, `tests/overhaul/voiceover.spec.ts`,
`tests/e2e/avatar-voice.spec.ts` and `tests/content/content-check.spec.ts` because the
panel's internals were touched — that is how §3's click-interception defect was caught.

`tests/visual` was **not** run and no baseline was rebaselined. `VIS-04` was already red
before this change (C16 §6) and the panel is not in any baseline's clip; burying a
geometry change inside somebody else's open regression is what cycle 16 declined to do and
this one declines too.

## 7. Screens

`08-screens/` — `closed-launcher-1440.png` and `closed-launcher-390.png` (the resting
launcher, past the hero, at both ends of the range) and `open-panel-1280x800.png`,
`open-panel-1366x768.png`, `open-panel-1440x900.png` (the panel open at scroll 0, the three
widths F-V16-2 was reproduced on — the name is complete in all three). All five are under
160 kB.
