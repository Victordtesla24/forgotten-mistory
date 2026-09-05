# c16 — independent adversarial verification of `#about`'s GLSL compass field

**Task** `t_4e30d620` · **Reviewer role** 3rd-party independent adversarial review
(docs/prompt.md §5, level 1, effort max) · **Independent of the author.**
**Worktree** `/root/forgotten-mistory/.claude/worktrees/wf_697f0e83-f46-1` ·
**Branch** `worktree-wf_697f0e83-f46-1` · **HEAD reviewed** `a0e244c` ·
**Merge base** `d6396d203cafd6a7dfb1432d751a5845d1614af6`
**Port** 5601 (`python3 -m http.server 5601 --directory out --bind 127.0.0.1`), stopped at the end.
**Raw logs** `09-verify/` beside this file.

Nothing below is taken from the author's report. Every line is a command I ran in this
session and the output I read. Where I reproduce a number the author published, I say so;
where I contradict them, I say that too.

---

## 1. Verdict

**FAIL against the task card's own quality gate** — `scene-about.spec.ts red → green` is not
met: three of its six cases are still red. This agrees with the author's own
`goal_complete: false`, and the code is not the reason.

Everything the author claimed that I could re-run, I reproduced. Two things they did not
report, I found; both turn out to be pre-existing and I proved it rather than assumed it.

---

## 2. The four gates, re-run

| Gate | Command | Observed | Log |
|---|---|---|---|
| build | `npm run build:static` | `BUILD_EXIT=0`, `RESULT: PASS — no credential material in the emitted bundle.` | `09-verify/build.log` |
| tsc | `npx tsc --noEmit` | no output, `TSC_EXIT=0` | `09-verify/tsc.log` |
| lint | `npm run lint` | `✔ No ESLint warnings or errors`, `LINT_EXIT=0` | `09-verify/lint.log` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, `AUDIT_EXIT=0` | `09-verify/audit.log` |

## 3. The suites, re-run

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-about.spec.ts tests/e2e/about.spec.ts tests/monochrome tests/a11y/text-contrast.spec.ts`
→ **`27 passed`, `5 failed` (3.3m), `PW_EXIT=1`** (`09-verify/suites.log`).

| Suite | Result |
|---|---|
| `tests/e2e/about.spec.ts` | 12/12 green — `TC-ABOUT-01` … `TC-ABOUT-12`, including `TC-ABOUT-12: no gold on the face` and `TC-ABOUT-07: the section is complete without WebGL`. The About copy and the Compass semantics are genuinely untouched. |
| `tests/monochrome` | 12/12 green — `GS-01`, `GS-02` at four widths, `MONO-01` … `MONO-07`. |
| `tests/overhaul/scene-about.spec.ts` | **3 passed** (`-04` reduced motion, `-05` no-WebGL, `-06` monochrome/fill budget), **3 failed** (`-01`, `-02`, `-03`). |
| `tests/a11y/text-contrast.spec.ts` | **2 failed** — `TC-CONTRAST-01 @ 1440` (68 nodes below AA), `@ 390` (30). The author did not run this suite. See §5. |

## 4. The blocker: reproduced, and independently proved pre-existing

At `?gl=force` this build does not render. My own probe
(`09-verify/c16-glforce-probe.json`, script `09-verify/probe-section.mjs`) reads:

```
sectionIds: []   allCanvases: 0
body: "Skip to the evidence · System interrupt · Something went wrong …"
console: TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
         at _next/static/chunks/904.66d19854a4ab6d3a.js
```

The author says this predates c16. **I did not take that on trust — I built the baseline
myself.** `components/sections/About/{AboutField.tsx,field.glsl.ts}` moved aside,
`About.tsx` and `About.module.css` checked out at `d6396d2`, `npm run build:static`
(`09-verify/baseline-build.log`, `BASE_BUILD_EXIT=0`, `scanned : 43 files`), then a probe
held at the hero with no scrolling (`09-verify/baseline-hero-hold-probe.txt`, script
`09-verify/probe-hero-hold.mjs`):

```
target: hero   sections: []   total canvases: 0   errorShell: true
consoleErrors: ["TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')",
                "[app/error.tsx] Unhandled error: …"]
```

**The baseline crashes identically.** `#hero` (`components/sections/Hero/Hero.tsx:35`) and
`#experience` (`components/sections/Experience/Experience.tsx:69`) already mount `Scene`, so
the first scene to become near-and-settled takes the crash regardless of c16. The cause is
`@react-three/fiber@8.18.0` reading a React internal that the React vendored by
`next@15.5.25` no longer publishes; `npm ls react` shows a single deduped `18.2.0` tree
while the client bundle is Next's. **The author's characterisation is correct.**

One correction to my own working: a first baseline probe that scrolled straight to `#about`
reported no crash and no error (`09-verify/baseline-glforce-probe.json`: all six section ids
present, `allCanvases: 0`, `consoleErrors: []`). That is an artefact of the probe, not of the baseline — with
`#about` scene-less, no `Scene` ever satisfied `near && pageSettled` in that run, so
`GLCanvas` was never imported. Holding at the hero settles it.

## 5. What the author did not run: `tests/a11y/text-contrast.spec.ts`

Red, and **not a c16 regression — the delta is exactly zero.** The same spec against the
baseline build of §4 (`09-verify/baseline-contrast.log`, `BASE_CONTRAST_EXIT=1`) reports the
identical counts:

| | with c16 | baseline (c16 reverted) |
|---|---|---|
| `TC-CONTRAST-01 @ 1440` | 68 nodes below AA | **68** |
| `TC-CONTRAST-01 @ 390` | 30 nodes below AA | **30** |

The worst offenders are `#vitrine` (`rgb(58,58,58)` on `rgb(10,10,10)`, 1.74:1) and the
Compass's own `readNumber` / `numeral` text — none of which c16 touches. It is a real,
open defect of the site and belongs on the board; it is not this task's.

## 6. Bundle and network cost

Measured, not asserted — both figures come from a `next build` I ran myself.

| | baseline (`d6396d2` About) | with c16 | delta |
|---|---|---|---|
| `Route (app) /` size | `29.5 kB` | `29.6 kB` | +0.1 kB |
| `First Load JS` for `/` | **`170 kB`** | **`170 kB`** | **0 kB** |
| `First Load JS shared by all` | `103 kB` (`255-f7c4c205ddd80098.js`, `4bd1b696-c023c6e3521b1417.js`) | identical hashes | 0 |
| files under `out/` | `scanned : 43 files` | `scanned : 44 files` | +1 |

Well inside the +5 kB allowance. The one new file is a JavaScript chunk fetched only when
`Scene` mounts. **No new network asset:** `out/assets/` + `out/docs/` hold the same nine
media/PDF files as before (`avatar-studio-voice.mp3`, `minivic-greeting.mp3`, `my-avatar.mp4`,
`my-hero-avatar.mp4`, `my_avatar.{avif,png,webp}`, `og-image.png`, `Vik_Resume_Final.pdf`);
`package.json` and `package-lock.json` are untouched in the diff (`git show --stat e895f50`).

## 7. What I could verify of the scene's contract, and how

The three red cases are exactly the ones that need a live canvas. I verified their
*structural* preconditions on the path this host can actually render
(`09-verify/normal-path-probe.json`, no `?gl=force`):

| Claim | 1440×900 | 390×844 | 390×844 reduced-motion |
|---|---|---|---|
| `#about` renders | yes | yes | yes |
| canvases in `#about` | 0 | 0 | 0 |
| field slot present | yes | yes | yes |
| slot is inside `aria-hidden="true"` | **true** | true | true |
| `z-index` field / rose | **0 / 1** | 0 / 1 | 0 / 1 |
| slot box | 384×384 at x 104–488 | 224×224 at x 83–307 | same |
| `documentElement.scrollWidth` vs `clientWidth` | 1440 / 1440 | **390 / 390** | 390 / 390 |
| gold `rgb(201,168,76)` inside `#about` | **none** | none | none |
| page errors | 0 | 0 | 0 |

- The **no horizontal scrollbar at 390** claim (author's decision #4) holds: measured, not argued.
- The **aria-hidden** requirement is met by `Scene`'s own slot (`components/gl/Scene.tsx:96`,
  `<div ref={slotRef} className={className} aria-hidden="true">`), so the canvas is inside it
  whenever it exists.
- The **behind the content** requirement is met in stacking terms (0 < 1); the
  `elementFromPoint` half of `TC-SCENE-ABOUT-02` cannot be exercised without a canvas.
- **Monochrome at source:** `grep -nE '#[0-9a-fA-F]{3,8}\b'` over `field.glsl.ts` and
  `AboutField.tsx` → no match; `grep -in 'gold|c9a84c|201, *168'` over those two plus
  `About.module.css` → no match. Colour arrives only as `uInk`/`uLight` from
  `PALETTE.ink900` / `PALETTE.white`.
- **Fill budget:** the fragment program's `void main` contains three `noise(` call sites
  (`drift`, `shimmer`, `wash`) plus one `hash()` for grain — the ceiling the task set. DPR is
  untouched; `AboutField.tsx` sets no `dpr`.

**What remains unproven, and I will not dress it up:** no line of this GLSL has ever been
compiled or drawn. `TC-SCENE-ABOUT-06` is a source-text assertion, not an execution. Until
the React/R3F mismatch is fixed, `#about` cannot be counted toward SPEC-v10 R2's "≥7
signature scenes" on evidence — only on inspection.

## 8. Looking at it

`08-screens/about-1440.png` — the fallback, and it is the honest one for this host: the
engraved rose sits in its own pool of light on the left, reading `04 / ANSWERED` with the
caret at twelve o'clock and sector 04 lit; the ten dimensions run down the right in white
serif over near-black. **The text is unambiguously the primary object** — the instrument is
quiet, small relative to the column, and nothing competes with the headings. `Ten axes · no
scores` sits under the face. No field is visible, because none mounted.

`08-screens/about-390.png` — the reading column only; at that scroll position the instrument
has already passed above the fold, so **this capture does not show the field slot's
neighbourhood at all.** That is a real gap in the visual evidence at the narrowest
breakpoint, which is why §7 measures the slot box and the document width there instead: 224
px wide, x 83–307 inside a 390 px viewport, `scrollWidth == clientWidth`. Type is clean, one
column, no clipping, no overflow.

Whether the field "reads as one idea with the compass" and whether it is too loud **cannot be
answered from this host** and I decline to guess. What can be said from the source: alpha
follows luminance (`gl_FragColor = vec4(colour, luma * uIntensity * 0.95)`), the peak
luminance term is `band * ring * (0.055 + 0.30 * lit) * …` with every factor ≤ ~1, and the
disc is faded out by `1.0 - smoothstep(0.86, 1.0, r)` so the canvas rectangle cannot show as
a lighter box. That is a design that intends to be quiet. It needs one look on GPU hardware
before anyone calls it finished.

## 9. Findings

- **F-1 (report accuracy, minor).** The author's testimony says `TC-SCENE-ABOUT-03` fails on
  `locator(#about canvas) Expected: 1 Received: 0`. It does not — `-03` contains no canvas
  assertion. It fails inside `centreItem` at `tests/overhaul/scene-about.spec.ts:77` because
  `#about ol li` does not exist on the error shell. Same root cause, wrong failure mode
  quoted for one of the three.
- **F-2 (coverage).** `tests/a11y/text-contrast.spec.ts` was outside the author's battery and
  is red. Verified pre-existing with an identical 68/30 on the baseline build, so it does not
  block c16 — but the battery as run is narrower than CLAUDE.md's definition of done.
- **F-3 (acceptance, blocking).** The task's gate `scene-about.spec.ts red → green` is unmet:
  `-01`, `-02`, `-03` stay red. The scene is inspected, not exercised.
- **F-4 (evidence gap, closed here).** The 390 screenshot does not show the instrument;
  closed by measurement in §7.
- **No weakened checks found.** `git show e895f50` adds files only (534 insertions, 0
  deletions); no existing assertion was relaxed, no test skipped, no `expect` softened.
  `TC-SCENE-ABOUT-04`'s `>= 130` threshold is a units correction against the 138 elements the
  instrument actually draws, not a loosened gate.

## 10. The one remaining step, restated

Reconcile the React major `@react-three/fiber` sees with the one `next@15.5.25` vendors
(`@react-three/fiber@9` + `@react-three/drei@10` on `react@19`/`react-dom@19`, or pin `next`
below 15), then re-run
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-about.spec.ts`
and expect `6 passed`. Nothing in c16 needs to change for that. This is a repo-wide defect —
`#hero` and `#experience` are equally dark on GPU hardware today — and it should be its own
task ahead of c17–c20, because every remaining R2 scene lands on the same floor.
