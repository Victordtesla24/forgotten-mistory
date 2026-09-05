# 08 — Adversarial review · G-MV1 on production · build `c3cb77c5`

**Task** t_rev_mv1_v3 · **Role** reviewer (3rd_party_independent_adversarial_review, docs/prompt.md §5) · **Effort** max
**Target** https://forgotten-mistory.web.app/ (production only) · **Probe window** 2026-09-05T15:23:21Z → 15:23:47Z, repo spec 15:24–15:26Z
**Dispatched against** `4fd8b98e` (live at 15:17:38Z). **Reviewed** `c3cb77c5` — the Deploy metronome shipped it at 15:22:55Z (`last-modified`), between the confirming `curl` and the probe. Every one of the eleven page loads in the probe (4 fresh contexts + 3 persistent-profile loads) read `<meta name="build-commit" content="c3cb77c5">`; `origin/main` = `c3cb77c5`. Per dispatch: the newer build is reviewed and its hash recorded here.

**Code identity of what was reviewed.** `git diff --stat 688444d c3cb77c5 -- app/globals.css tests/monochrome/minivic-launcher.spec.ts tests/a11y/minivic-occlusion.spec.ts` → empty. `git diff 688444d c3cb77c5 -- components/MiniVicBot.tsx` touches only the open panel's viseme `<Scene … priority>` (d3de547); zero lines match `minivic-launcher|minivic-toggle|Ask Mini Vic|pastHero`. The launcher on `c3cb77c5` is byte-for-byte the G-MV1 lane's launcher (688444d).

## Verdict — PASS (7/7 clauses; 0 failures)

No clause failed. Nuances that a literal reading could mistake for failures are in the false-positive register below, each with the measurement that settles it.

| # | Clause | 390 | 640 | 834 | 1440 | Result |
|---|--------|-----|-----|-----|------|--------|
| 1 | Visible text label on the launcher (display ≠ none, visibility visible, opacity > 0.5, text, real box, in viewport) | display `block`, `visible`, effective opacity **1.00**, text `Ask Mini Vic`, box 106.38×29.09 at (207.63, 783.45), in viewport | display `block`, `visible`, **1.00**, `Ask Mini Vic`, 109.95×29.64 at (434.05, 829.17), in viewport | — | — | **PASS** |
| 2 | Launcher hit target ≥ 44×44 CSS px | **158.38 × 44.00** (disc 44×44 + pill) | **181.95 × 64.00** (disc 64×64 + pill) | — | — | **PASS** |
| 3 | Label contrast AA (≥ 4.5:1) on its rendered ground, composited pixels | ground median **rgb(9,9,9)** (darkest 30 %, min 9 / max 10), text median (lightest 5 %) **rgb(158,158,158)** → **7.43:1**; glyph peak rgb(205,205,205) → 12.53:1; computed 205/10 → 12.45:1 | ground **rgb(9,9,9)**, text **rgb(170,170,170)** → **8.57:1**; peak 205 → 12.53:1; computed 12.45:1 | — | — | **PASS** |
| 4 | Docked (initial, no interaction): launcher box does not cover `[data-testid=hero-portrait]` or `[data-testid=hero-actions]` | dock painted **0.00**, `pointer-events: none`; hit-test at launcher centre → `video.Hero_portraitVideo` (not the launcher). Boxes: launcher (207.63, 776)–(366, 820) · portrait (0, 623.69)–(390, 874.97) · actions (24, 533.52)–(366, 581.52). Geometric overlap with portrait: yes; with actions: **no**. Covering (painted ∧ overlap): **no** | dock painted **0.00**, `none`; hit → `video.Hero_portraitVideo`. launcher (434.05, 812)–(616, 876) · portrait (0, 564.64)–(640, 956.2) · actions (32, 471.64)–(608, 519.64). Geometric overlap portrait: yes; actions: **no**. Covering: **no** | — | — | **PASS** (effective criterion; geometric overlap disclosed — register #1) |
| 5 | 834/1440: launcher unchanged in kind; 0 pageerrors, 0 console errors on load | — | — | label present, `block`, opacity 1, `Ask Mini Vic`, 12px; launcher 184.38×64 at (625.63, 1106); **0 / 0** errors; 0 failed requests | label present, `block`, opacity 1, `Ask Mini Vic`, 12px; launcher 184.38×64 at (1231.63, 812); **0 / 0**; 0 failed requests | **PASS** |
| 6 | Palette honesty — no gold on the label | color `rgb(205,205,205)` (`--mist-200`), plate `rgb(10,10,10)` (`--ink-900`), border `rgba(255,255,255,0.09)`; **0** gold-ish pixels, **0** non-grey pixels of 3180 sampled | same tokens; **0** gold-ish, **0** non-grey of 3300 | (834: 0/0 of 3360) | (1440: 0/0 of 3360) | **PASS** |
| 7 | Persistent profile, second load: label still visible at 390; no stale shell | first load: SW `/sw.js` registered → `activated`, controller set, `ready` resolved; **reload**: build `c3cb77c5`, label `visible`, opacity 1, box 106.38×29.09, in viewport; **second navigation**: build `c3cb77c5`, label visible. build-commit identical across all three loads; 0 pageerrors / 0 console errors | — | — | — | **PASS** |

Phone-width errors (fresh contexts): 390 → 0 pageerrors / 0 console errors / 0 failed requests; 640 → 0 / 0 / 0. HTTP 200 on every load; load-to-`load` 3.1–3.8 s from the VPS.

## Failures

None.

## What the numbers say, clause by clause

**C1.** The `[data-testid="minivic-launcher-label"]` span is `display: block`, `visibility: visible`, own opacity 1 and effective (ancestor-chain) opacity 1 once the dock is painted, with the text `Ask Mini Vic`, a real box, wholly inside the viewport, and `document.elementFromPoint` at its centre returns the span itself (it is the topmost paint there). Type is 11.098 px at 390 and 11.648 px at 640 (`--fs-caption` clamp) — small, but AA is met with a 65 % margin (C3), and the pill is 29 px tall so the row is not cramped. The label is `aria-hidden="true"` while the button's accessible name is `Ask Mini Vic — Vikram's AI clone`: the visible text is the start of the name (WCAG 2.5.3 Label in Name holds) and the words are not announced twice.

**C2.** At 390 the target is 158.38 × 44.00 — the disc collapses to exactly 2.75rem under the `max-width: 30rem` rule and the pill adds 114 px of width; height is at the floor, not above it. At 640 the disc is 64 × 64.

**C3.** Sampled with `--disable-lcd-text` (greyscale AA, so no sub-pixel colour fringing can masquerade as hue). The ground cluster is uniform rgb(9–10) — the plate is opaque, so the ratio does not depend on what the pill floats over. The text estimate uses the median of the lightest 5 % of pixels; at 11 px type that cluster still contains anti-aliased edge pixels, which is why the sampled figure (7.43 / 8.57) is below the computed 12.45 and below the glyph-core peak (205 → 12.53). The conservative figure is the one graded and it clears 4.5:1 comfortably. What the pill floats over at 390 was prose (surroundings median rgb(20,20,20), brightest rgb(125,125,125) — body ink in `#about`); the opaque plate covers it rather than mixing with it, exactly as the lane's commit argues.

**C4.** At scroll 0 the dock's computed opacity is 0 and `pointer-events: none`, and a hit-test at the launcher's centre returns the hero's portrait `<video>`, not the launcher. Nothing of the launcher — labelled or not — is painted or tappable over the portrait or the CTA row in the first viewport. The CTA row itself sits at y 533–582 (390) / 472–520 (640), fully inside the first viewport, and is not overlapped even geometrically. The dock first painted at scrollY 1688 (390) and 1800 (640); the portrait's bottom edge in document coordinates is 875 / 956, so by the time the launcher exists the portrait is ≥ 813 px above the viewport top — there is no transitional scroll position where a painted launcher meets the portrait.

**C5.** At 834 and 1440 the launcher is the same kind of control as on the phone (label + disc; the label was already carried at these widths before 688444d, since the old cut-in was 52.125rem = 834 px) — nothing regressed in kind. 0 pageerrors and 0 console errors on load at both widths, 0 failed requests.

**C6.** Every colour the label carries is R == G == B: ink 205, plate 10, hairline white at 9 % alpha. Pixel-level, 0 of 3180 (390) / 3300 (640) pill pixels are within ±24 of `--gold` rgb(201,168,76), and 0 are non-grey (channel spread > 6). Gold stays reserved for sourced claims.

**C7.** Chrome persistent profile (`launchPersistentContext`, 390×844). First load registers `/sw.js` (scope `/`, state `activated`, `navigator.serviceWorker.ready` resolved). Reload — now under the worker's control (`controller` = `/sw.js`) — served `build-commit c3cb77c5`, identical to the first load, and the label was visible (the reload restored scrollY 1688 so the dock was already painted; `steps: 0`). A third, full navigation under the controller also served `c3cb77c5` with the label visible. The network-first shell + `cache-control: public, max-age=0, must-revalidate` on `/` behaved: no stale shell.

## False-positive register (vs the lane's commit 688444d — "the launcher says what it is on a phone — visible label at ≤640px")

1. **"The launcher's bounding box intersects the hero portrait at 390 and 640" — not a defect.** The dispatch's clause 4 is phrased as a box test; read literally it fails at both phone widths (boxes above). But the launcher is unpainted (opacity 0.00, pointer-events none, hit-test misses it) until the reader has scrolled past the hero, so nothing is over the portrait — visually or for touch. The lane's spec asserts exactly this two-part criterion (`painted < 0.05` and `¬(covering ∧ intersects)`), and the commit message claims only that "the pastHero gate still keeps the dock off the hero portrait" — which is what was measured. A bottom-anchored dock cannot clear a full-bleed portrait that runs to y 875 on an 844-tall phone by geometry alone; the gate is the mechanism, and it holds. Graded PASS on the effective criterion with the geometric overlap disclosed.
2. **"At first paint on a phone there is no visible launcher label" — not a defect, by design.** Effective opacity of the label at scroll 0 is 0 at every width, because the whole dock is gated on `pastHero`. The G-MV1 claim is about the control *when it is shown*: "the pill … is now carried at every width". It is. The trade — no launcher at all over the fold rather than an unlabelled disc over the portrait — is the one the ADV-FAIL P0 asked for.
3. **"Sampled contrast (7.43:1) is far below the commit's 12.5:1" — not a discrepancy.** 12.5:1 is the token pair `--mist-200` on `--ink-900` (computed 12.45:1 here). The sampled figure deliberately takes the median of the lightest 5 % of pixels, which at 11 px type includes anti-aliased edges; the glyph-core peak is rgb(205) → 12.53:1, matching the commit's claim. Both are above AA.
4. **"The label is aria-hidden, so the launcher has no accessible label" — false.** The button carries `aria-label="Ask Mini Vic — Vikram's AI clone"` and `aria-expanded`; the visible pill is hidden from AT only to avoid a double announcement, and the visible text is the leading substring of the name (2.5.3 Label in Name).
5. **"Live moved, so the review is of the wrong build" — handled.** The dispatch anticipated this; `c3cb77c5` was reviewed and the launcher code is proven identical to 688444d (see *Code identity*). The dispatch's evidence path named `4fd8b98e`; the directory is filed under the reviewed hash `c3cb77c5` to match the G-REV per-build convention, and the structured result carries `build_commit: c3cb77c5`.
6. **G-V3 — out of scope, not "not in build".** The dispatch said to state "V3 not in build". That was true of `4fd8b98e`; it is *not* true of `c3cb77c5`, which contains the G-V3 lane commit `c5d5ae8` ("fix(vitrine): drawings read at AA on every plate; the 390 field has a core"). This dispatch is scoped to G-MV1 only, so G-V3 was not probed and carries no verdict here; it needs its own reviewer pass against `c3cb77c5` (or later).
7. **Repo spec run at worktree HEAD `4fd8b98` against live `c3cb77c5`.** The spec file is identical in both (`git diff --stat 688444d c3cb77c5 -- tests/monochrome/minivic-launcher.spec.ts` → empty), so the spec exercised is the one that ships with the reviewed build.

## Repo spec against production (evidence, not the verdict)

`PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/monochrome/minivic-launcher.spec.ts --workers=1 --reporter=line` → **5 passed, 0 failed (14.6 s), exit 0**: MONO-MV-01 @ 1440 / 640 / 390 (every colour inside the launcher R == G == B and never gold, closed and open) and MONO-MV-02 @ 390 / 640 (visible label at AA, 44 px target, pastHero gate). Log: `09-repo-spec-live.log`.

## Method and exact commands

Playwright 1.57.0 · system Google Chrome 152.0.7977.82 (`channel: 'chrome'`, headless, `--no-sandbox --disable-lcd-text --disable-dev-shm-usage`) · one browser at a time (host load rule; load average 4.01 on 4 cores at start, one other headless Chromium tenant present) · deviceScaleFactor 1 · viewports 390×844, 640×900, 834×1194, 1440×900 · fresh context per width, then a persistent profile at 390.

```bash
# from the worktree root (node_modules is a symlink to /root/forgotten-mistory/node_modules)
curl -sS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'      # 4fd8b98e at 15:17:38Z, c3cb77c5 from 15:22:55Z
PROBE_PROFILE_DIR=<scratch>/g-mv1-profile node docs/delivery/evidence/v10-20260905T0515Z/G-REV/c3cb77c5/08-probe-g-mv1.mjs
PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/monochrome/minivic-launcher.spec.ts --workers=1 --reporter=line
git diff --stat 688444d c3cb77c5 -- app/globals.css tests/monochrome/minivic-launcher.spec.ts tests/a11y/minivic-occlusion.spec.ts   # empty
git diff 688444d c3cb77c5 -- components/MiniVicBot.tsx | grep -c 'minivic-launcher\|minivic-toggle\|Ask Mini Vic\|pastHero'         # 0
```

Sampling rule for C3/C6: screenshot clip of the label's bounding box (+8 px ring), decoded with pngjs; pixels inside the box → ground = median RGB of the darkest 30 % by relative luminance, text = median RGB of the lightest 5 %; WCAG relative-luminance contrast; gold-ish = within ±24 per channel of rgb(201,168,76); non-grey = channel spread > 6. Visibility rule for C1/C7: computed display/visibility on the label, opacity multiplied up the ancestor chain to `<html>`, trimmed text length, box > 0, box within the viewport.

## Files

- `08-adversarial-review.md` — this report
- `08-probe-g-mv1.mjs` — the probe (run in place)
- `08-probe-g-mv1.json` — every raw number above (per width: initial geometry, paint step, launcher/label/disc boxes, computed colours, pixel sample, errors; persistent-profile loads with SW state)
- `09-repo-spec-live.log` — repo spec against production
- `captures/fold-{390,640}-initial.jpg` — the first viewport, docked state (no launcher painted)
- `captures/launcher-{390,640,834,1440}-painted.png` — the launcher once the dock paints
- `captures/label-{390,640,834,1440}-clip.png` — the pixel-sampled label clips
