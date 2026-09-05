# 09 — Independent verification, C21 hero photograph

Reviewer: 3rd-party independent adversarial review (docs/prompt.md §5, level 1, effort max).
Independent of the author. Branch `worktree-wf_31b6f314-9ff-1` @ `e39f2e4`, worktree
`/root/forgotten-mistory/.claude/worktrees/wf_31b6f314-9ff-1`.
Rebuilt from scratch here (`npm run build:static`, build-stamp `e39f2e4d`), served on
`http://127.0.0.1:5601` (`python3 -m http.server 5601 --directory out --bind 127.0.0.1`).
Every number below was measured in this session; nothing is quoted from the author's report.

Owner instruction under test (2026-09-05 09:10Z, verbatim): *"Integrate my Photo with full
size, colours and dimension with creative decorations that match the website UI/UX Design.
Include a hover effect that plays the hero video avatar and not by default."*

---

## 1. Gates — literal exit codes observed

| Gate | Command | Exit | Line observed |
|---|---|---|---|
| build | `npm run build:static` | 0 | `✓ Compiled successfully in 48s` · `RESULT: PASS — no credential material` |
| types | `npx tsc --noEmit` | 0 | no output |
| lint | `npm run lint` | 0 | `✔ No ESLint warnings or errors` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | 0 | `RESULT: ALL PASS (10/10)` (incl. TC-NFR-TOKEN, TC-NFR-DEADCSS) |
| hero specs | `playwright test tests/e2e/hero-photo.spec.ts tests/e2e/hero.spec.ts --workers=2` | 0 | `34 passed (56.2s)` — TC-PHOTO-01…12 and TC-HERO-01…21 |
| a11y + monochrome + perf + cinematic | `playwright test tests/a11y/text-contrast.spec.ts tests/monochrome tests/perf/performance.spec.ts tests/overhaul/cinematic.spec.ts --workers=2` | **1** | `1 failed / 35 passed (1.5m)` — the one failure is **PERF-03**, `CLS: 0.2561` |

`tests/monochrome` (monochrome.spec.ts, gold-semantics.spec.ts, minivic-launcher.spec.ts)
— 20 passed, files unmodified by this change (`git diff` shows no test under
`tests/monochrome/`). `tests/a11y/text-contrast.spec.ts` — 3 passed (@1440, @390, and the
reduced-motion case). `tests/overhaul/cinematic.spec.ts` — passed, 0 failures.

## 2. Measurements taken independently (system Chrome, `channel: 'chrome'`)

Figure = `[data-testid="hero-portrait"]`; `--autoplay-policy=no-user-gesture-required` was
passed deliberately, so "silence at rest" is proved under a *more* permissive policy than
a real browser's.

| Viewport | Figure box (x, y, w × h) | % of viewport | Notes |
|---|---|---|---|
| 1440 × 900 | 825.6, 328.6 — **518.4 × 321.8** | **36.0 %** | right column, top edge on the role line |
| 1280 × 720 | 755.2, 273.3 — 460.8 × 289.7 | 36.0 % | |
| 834 × 1112 | 492.1, 312.5 — 300.2 × 200.0 | 36.0 % | `x` 492 > statement `x` — a real column |
| 390 × 844 | 0, 839.5 — **390 × 248.8** | 100 % (full-bleed) | starts below both actions |

- **Colour.** Computed filter chain on the media wrapper: `saturate(1.02) contrast(1.03)`
  — no `grayscale` at any ancestor. Decoded-pixel mean HSV saturation of the served still
  **0.2941** (max 0.9688), natural size `1480×826`, `currentSrc = my_avatar.avif`.
  Identical at all four widths. The photograph is genuinely in colour.
- **Silence at rest.** At every width, after `load` + 3.5 s: `src` attribute `null`,
  `currentSrc` `""`, `paused: true`, `preload="none"`, `autoplay: false`,
  `aria-hidden="true"`. `grep -c 'my-avatar.mp4' out/index.html` → **0**: the served HTML
  never names the loop.
- **On hover.** `currentSrc → my-avatar.mp4`, `paused: false`, `videoWidth×Height
  1280×720`, layer `opacity: 1` within 1.6 s; `currentTime` advances 1.51 s → 3.34 s
  between two reads, so it is playing, not a frozen first frame.
- **On leave.** `paused: true`, layer `opacity: 0` — it returns to the still.
- **Keyboard.** Tab reaches the toggle; on focus `aria-pressed="true"` /
  `aria-label="Pause the portrait"` with the loop playing; `Enter` → `aria-pressed="false"`,
  `"Play the portrait"`, `paused: true`. Deterministic, and it mirrors intent, not the
  decoder.
- **Reduced motion.** With `reducedMotion: 'reduce'`, hovering the figure leaves
  `src` attribute `null`, `currentSrc ""`, `paused: true` — hover is genuinely inert. A
  press then starts it (`currentSrc my-avatar.mp4`, `paused: false`, `currentTime 1.69`),
  which is a reader's own action and allowed. Confirmed: the only network request for
  `/assets/my-avatar.mp4` under reduced motion is raised **by the press**, never by hover.
- **TC-HERO-12 clearance @390.** `#hero a[href="#experience"]` ("See the evidence") bottom
  = **553.3 px**, inside the 844 px fold, with the full-bleed photograph below it.
- **LCP.** Element is `H1` at every width — 2176 ms @1440, 596 ms @1280, 800 ms @834,
  308 ms @390 (all < 2500 ms). PERF-02 `LCP: 852 ms`, PERF-06/PERF-07 green.
- **Page errors.** 0 at every width.

## 3. Decorations, tokens and gold — verified

- Chromatic sweep of every element inside the figure (`color`, `background-color`, four
  border colours, `outline-color`, `fill`, `stroke`, `box-shadow`, `background-image`,
  `text-decoration-color`; chromatic = max−min channel > 8): **offenders `[]`**.
  `--gold` is `#c9a84c`; it appears nowhere in or around the figure. The colour exemption
  is the photograph's pixels only.
- The decorations read as the site's drafting language and are drawn from tokens:
  `--card-border` (inset rule, frame, button), `--white` (four corner caliper ticks at
  0.7, the registration cross at 0.6, the focus ring), `--mist-400` + `--font-mono` +
  `--fs-micro` + `--ls-caption` (the caption plate and its leader line), `--ink-800`,
  `--ink-900`, `--space-1/2`. The bloom is `radial-gradient(… rgb(246 246 246 / 0.12) …)`
  — achromatic, `--white`'s own value at low alpha.
- **Token nit (not a gate failure).** Three literals in `Hero.module.css` use `rgb()`
  functional notation rather than a token: `rgb(246 246 246 / 0.12|0.09)` (`.portraitGlow`),
  `rgb(0 0 0 / 0.9)` (`.portraitMedia` shadow), `rgb(10 10 10 / 0.72)` (`.portraitToggle`).
  TC-NFR-TOKEN only forbids raw **hex**, so the audit is honestly green, and the pattern
  has precedent in `About`, `Skills`, `Experience`, `Vitrine` and `Bench` modules. Worth a
  token some day; it is not a violation today.

## 4. Judgement on the screens

Read at full size: `08-screens/hero-1440-rest.jpg`, `hero-390-rest.jpg`, plus my own
captures at 1440/1280/834/390 (rest, hover t≈1.5 s, hover t≈3.3 s, reduced motion).

- **Does it read as the hero's anchor?** Yes. At 1440 the figure occupies the whole right
  column, its top edge ruled to the role line and its caption plate landing above the
  ledger — the eye goes name → role → face. At 390 the full-bleed photograph closes the
  hero underneath both actions without stealing the fold.
- **In colour, at full size?** Yes — golden-hour warmth intact against near-black inks,
  face uncropped at the native 1480×826 aspect, no grey cast.
- **In the site's drafting language?** Yes: hairline rule inset 12 px, four caliper
  corner jaws, a registration cross top-right, a mono caption plate with a ruled leader
  line. Nothing decorative that the rest of the page does not already say.
- **Is the hover convincing?** Yes. Rest vs. a hover frame at t≈3.3 s differ by RMSE
  2.59 %, and two hover frames 1.8 s apart differ by 2.26 % — visible motion, not a still
  swap. Crops show the subject's head turned and expression changed while the frame,
  crop and light are identical, and the button glyph flips ▶ → ⏸. Because still and loop
  are one composition, the transition has no jump-cut: it reads as the photograph coming
  alive rather than a second asset loading. That is a strength, but it also means a
  single screenshot cannot evidence it — motion over time is the whole effect.

## 5. Finding — PERF-03 is red on this branch, and the author's justification did not reproduce

Observed, four local runs of `PERF-03` against this build on 5601 (phone viewport, six
scroll steps):

```
in the batch  → CLS: 0.2561  FAILED
alone, run 1  → CLS: 0.2561  FAILED
alone, run 2  → CLS: 0.0002  passed
alone, run 3  → CLS: 0.0002  passed
```

So PERF-03 is **intermittently red on this branch**, ~2 failures in 4 runs, not "green
alone". Attribution probe at 390 with the same six-step scroll: on a passing run the only
layout-shift entry is `div.Hero_portraitMedia` **0.0002** (`390×37 → 390×41` at t≈357 ms —
the aspect box settling as the still decodes); on a failing run the entry is
`footer.Footer_footer` collapsing (`h 215.77 → 0`, 0.2559).

The author's report states this is pre-existing and that *"the identical 0.2559 footer
entry reproduces on https://forgotten-mistory.web.app (main, without this change)"*.
**That did not reproduce here.** Running the identical spec from this machine:

```
PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test \
  tests/perf/performance.spec.ts -g "PERF-03" --workers=1
→ CLS: 0.0001   1 passed
```

A direct `PerformanceObserver` read of production at 1280×720 and 834×1112 also returned
`total: 0, entries: []` (live `build-commit` `ce6799ec` / `ccb15241`).

What that does and does not establish, stated precisely:

- It **does** establish that the "reproduces on production" evidence offered for the
  budget breach is not reproducible, so the breach is currently **unexplained**, not
  excused.
- It does **not** establish that C21 caused it. Production is served by a CDN, not
  `python3 -m http.server`, and the shift is timing-dependent (2 of 4 identical local runs
  are clean). The missing control is the one nobody has run: build the branch's parent
  (`7ae763a`) in this same environment and run PERF-03 against it the same number of
  times. Until that control exists, the honest statement is "red intermittently, cause
  unattributed."
- The change also **removed** the only other page-wide CLS assertion: TC-HERO-15 used to
  assert `cls < 0.05` for the whole page and now asserts only the figure's own share
  (`fromFigure < 0.05`). That re-pointing is defensible on its own terms and is documented
  on the test, but combined with a red PERF-03 it leaves the site's CLS budget enforced by
  nothing that is currently green. `CLAUDE.md` Definition of Done requires `CLS < 0.05`.

## 6. Testimony vs. measurement

| Author's claim | Verdict |
|---|---|
| figure 518.39 × 321.81 @1440, 36.0 % of viewport | **confirmed** — 518.4 × 321.8, 36.0 % |
| 460.80 × 289.67 @1280; 300.23 × 199.98 @834; 390 × 248.75 @390 full-bleed | **confirmed** at all three |
| still is colour, no grayscale | **confirmed** — filter `saturate(1.02) contrast(1.03)`, mean pixel saturation 0.2941 |
| at rest: no `src`, `currentSrc ''`, `paused`, no request for the loop | **confirmed**, and the loop is absent from `out/index.html` |
| on hover: plays, opacity 1; on leave: pauses | **confirmed**, with `currentTime` advancing |
| reduced motion refuses hover and focus; button still works | **confirmed** |
| no gold, chrome achromatic; `tests/monochrome` unmodified, nothing excluded | **confirmed** — sweep returns `[]`, `git diff` touches no monochrome spec |
| tsc 0 · lint 0 · audit 10/10 · build 0 | **confirmed**, all four re-run here |
| 34 passed for the two hero specs | **confirmed** — `34 passed (56.2s)` |
| LCP green, `H1`/`IMG`, < 2500 ms | **confirmed** — `H1` at 308–2176 ms across four widths |
| "Alone, PERF-03 passes: CLS 0.0002" | **partly false** — 1 of 3 isolated runs failed at 0.2561 |
| "the identical 0.2559 footer entry reproduces on production, so it is pre-existing" | **not reproducible** — production passes PERF-03 at `CLS: 0.0001` from this machine |

## 7. Verdict

**FAIL** — on the gate, not on the feature.

The owner instruction is met and met well: the photograph is full size, in full colour,
decorated in the site's own drafting language, and the loop plays on hover and never by
default, at every width, with a working keyboard and reduced-motion path and no gold
anywhere near it. All twelve TC-PHOTO cases and all twenty-one TC-HERO cases pass, and
`tsc`, `lint`, the build and the 10/10 static audit are green in an independent rebuild.

It fails because one command in the required battery exits `1`: `PERF-03` breaches the
site's `CLS < 0.05` budget intermittently on this branch (`CLS: 0.2561`, `footer.Footer_footer`),
and the evidence offered to excuse it as pre-existing does not reproduce.

**Remaining step (one, and it is not a rewrite of C21):** build the branch's parent
`7ae763a` in this same environment and run `PERF-03` against it ≥5 times. If it is red
there too, the breach is genuinely pre-existing and belongs to a footer task — record the
control and C21 clears. If it is green there, the footer collapse arrived with this change
and must be fixed before the CLS budget can be called met.

---

Evidence for every line above: this session's commands, re-runnable as written. Server
stopped with `fuser -k 5601/tcp`.
