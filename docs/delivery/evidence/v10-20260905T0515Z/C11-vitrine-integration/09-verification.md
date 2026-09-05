# C11 — independent verification (t_329d1673)

**Verdict: FAIL** — one of the cycle's own quality gates is red under the reviewer's
own run. Every R-c8 **C-02** acceptance line passes at 1280 / 1440 / 1920 / 390, every
*measurable* **C-06** line passes at 390, and `TC-HERO-12` clears the fold with 46.72 px
to spare — but `TC-CONTRAST-01 @ 390` fails on one node, so "specs green under the
reviewer's own run" is not met.

Reviewer: 3rd-party independent adversarial review, `docs/prompt.md` §5. Nothing below
is taken from the author's report; every number is a command's output or a
`getBoundingClientRect()` / `getComputedStyle()` reading taken in this session against a
build this reviewer produced.

- Worktree `/root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-2`, branch
  `worktree-wf_18f926b0-2a4-2`, `git log --oneline main..HEAD` → **2 commits**
  (`96732ff`, `b7b2ad4`).
- Build produced here, served on `127.0.0.1:5602` (`python3 -m http.server 5602
  --directory out --bind 127.0.0.1`). Ports 5599 and 8080 were confirmed still listening
  and were never bound or signalled.

---

## 1. Gates — reviewer's own runs

| gate | command | observed | exit |
|---|---|---|---|
| build | `npm run build:static` | `RESULT: PASS — no credential material in the emitted bundle.` | **0** |
| types | `npx tsc --noEmit` | no diagnostics | **0** |
| lint | `npm run lint` | `✔ No ESLint warnings or errors` | **0** |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)` | **0** |
| specs | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/e2e/vitrine.spec.ts tests/e2e/hero.spec.ts tests/a11y/text-contrast.spec.ts tests/monochrome tests/overhaul/page-spine.spec.ts` | **`1 failed` / `49 passed` (1.3m)** | **1** |

Green in that battery: `TC-VIT-01…13`, `TC-HERO-01…21` (including both `TC-HERO-12`s and
`TC-HERO-21`), `TC-CONTRAST-01 @ 1440`, `page-spine`, and all **9** `tests/monochrome`
specs (`GS-01`, `GS-02` at 1440 and 1920, `MONO-01…07`).

Run separately, because the battery above does not cover it:
`npx playwright test tests/a11y/gold-contrast.spec.ts` → **`3 passed` (8.7s)**, exit 0
(`GC-01`, `GC-02`, `GC-03`; `GC-03` sweep reports `0 offender(s)`).

Red: `tests/a11y/text-contrast.spec.ts:275 — TC-CONTRAST-01 @ 390`, one node —
`#role-body-ato > ul.Experience_bullets__MDbij > li:nth-of-type(1)` at **1.79:1**,
`fg rgb(205,205,205)` on `bg rgb(153,153,157)`, 15.09 px / 400.

---

## 2. R-c8 C-02 acceptance — measured, not read from the report

`review.md` line 77: *"At 1440 and 1920 the first card's border-left equals the heading's
left (within 1px); the right-most partial card fades rather than cuts (mask-image computed
non-'none'); card 01 carries [data-lit] on first paint; after scrollBy 600px on .rail
exactly one [data-lit]; unlit plate computed opacity >= 0.6; lit plate svg paths reach
stroke-dashoffset 0 by 900ms."*

| clause | 1440 | 1920 | 1280 | 390 | verdict |
|---|---|---|---|---|---|
| `h2.left` vs `card01.left` (≤ 1 px) | 96 / 96 — **Δ 0.00** | 336 / 336 — **Δ 0.00** | 64 / 64 — **Δ 0.00** | 24 / 24 — **Δ 0.00** | **PASS** |
| right-most card fades (`mask-image` ≠ `none`) | `linear-gradient(to right, rgba(0,0,0,0) 0px, rgb(0,0,0) 72px, rgb(0,0,0) calc(100% - 64px), rgba(0,0,0,0) 100%)` | same, 80px | same, 64px | same, 24px | **PASS** |
| card 01 `[data-lit]` on first paint | `lit=[0]` | `lit=[0]` | `lit=[0]` | `lit=[0]` | **PASS** |
| after `scrollBy(600)` exactly one `[data-lit]` | `lit=[2]`, count 1 | `lit=[2]`, count 1 | `lit=[2]`, count 1 | `lit=[2]`, count 1 | **PASS** |
| unlit plate computed `opacity` ≥ 0.6 | **0.62** | 0.62 | 0.62 | 0.62 | **PASS** |
| lit plate SVG `stroke-dashoffset` 0 by 900 ms | 26 shapes, distinct offsets `["0px"]` | idem | idem | idem | **PASS** |

`card01.borderLeftWidth` is `1px` at every width, so the measured `left` is the border's
own left edge. Rail `scrollWidth` 3192 / 3672 / 3128 / 2140 against `clientWidth`
1440 / 1920 / 1280 / 390 — the rail really does overflow at every width, so the mask is
doing work rather than sitting on a non-scrolling row. `document.documentElement.scrollWidth`
equals the viewport at all four widths: the full-bleed rail introduces no page-level
horizontal scroll.

### S-4 — reduced motion

`browser.newContext({ reducedMotion: 'reduce' })`, sampled at **t = 100 ms** after the
section came into view: `matchMedia('(prefers-reduced-motion: reduce)').matches = true`,
lit plate index 0, 26 SVG shapes, `stroke-dashoffset = ["0px"]`, `animation-name = ["none"]`,
`transition-duration = ["0s"]`. The trace-on is instantaneous, not merely fast. **PASS.**

---

## 3. R-c8 C-06 acceptance and TC-HERO-12 — measured at 390 × 844

`review.md` line 76: *"At 390: document.documentElement.scrollWidth === 390; no caption
box extends past x=366; H1 sets one line per word with the portrait below the lede. At
1440: the three .figureNote boxes share the same height and the footnote top is 24px below
the tallest."*

| clause | measured | verdict |
|---|---|---|
| `documentElement.scrollWidth === 390` | **390** (`innerWidth` 390) | **PASS** |
| no caption box past x = 366 | caption rights **323.17 / 350.08 / 339.06** | **PASS** |
| H1 one line per word | `h1` box `l 24 · r 366 · w 342`, **2 line boxes** for the 2 words "Vikram Deshpande" | **PASS** |
| portrait below the lede | portrait `<figure>` at **l 278 · t 96 · r 366 · b 184**; the lede (`p.Hero_statement`) at **t 335.28 · b 462** → the portrait is **above** the H1, beside the eyebrow (`t 96 · b 115.5`) | **NOT MET — superseded, see F-2** |
| `TC-HERO-12`: an action ends inside 844 | both actions bottom **797.28** (page y) → **46.72 px** clearance | **PASS** |

At 1440 the fourth clause cannot be evaluated as written: see **F-3**.

---

## 4. Confirmations the orchestrator asked for

**Working tree.** `git status --porcelain` after the reviewer's build shows only
`app/data/generated/build-stamp.ts` and `reports/static-audit.json` — both regenerated by
`npm run build:static` — plus this file and the reviewer's own artefacts. `out/` is
gitignored. No stray source edit exists on the branch.

**`build-stamp.ts` is not null in the commit.** `git show HEAD:app/data/generated/build-stamp.ts`
→ `{"sha": "6dcb4f53", "authored": "2026-09-04T23:56:41Z", "clean": true}`. The file is not
in the two commits' diff at all, so S-7's `git checkout --` was honoured.

**The three rebaselined PNGs changed on purpose.** Old bytes recovered with
`git show 8dc4cf4:<path>` and compared to the committed bytes with ImageMagick, then both
opened and looked at:

| baseline | size | `compare -metric AE` | changed-pixel bbox |
|---|---|---|---|
| `tests/baselines/visual/.../viewport-top-1440x900-chromium-linux.png` | 1440×900 | 184287 (14.22 %) | `1247x731+96+131` |
| `tests/baselines/visual/.../hero-full-chromium-linux.png` | 1280×742 | 134378 (14.15 %) | `1151x615+64+101` |
| `tests/baselines/overhaul/.../hero-section-chromium-linux.png` | 1280×742 | 134244 (14.13 %) | `1151x615+64+101` |

What actually changed, in all three and only there: the hero ledger's three provenance
captions lift from `--ink-300` (#7D7D7D) to `--mist-400` (#909090), and the third caption
**"ANZ · real-time telemetry platform" collapses from two lines to one**, so the
"self-reported…" footnote and the rows under it move up. H1, eyebrow, portrait stamp, the
three figures, the caliper jaws, both action buttons and the contact row are unmoved. No
gold enters any of the three. That is exactly what `Hero.module.css`
(`.ledgerSource { color: var(--mist-400) }`, `.ledgerText { display: contents }`) and the
`Hero.tsx` wrapper `<span class={styles.ledgerText}>` produce. **Intentional, and the
right three files.** Side-by-side composites: `09-verify-screens/` plus the ImageMagick
figures above.

**`tests/monochrome` and `tests/a11y/gold-contrast.spec.ts` are unchanged in behaviour.**
`git diff --name-only 8dc4cf4..HEAD | grep '^tests/'` returns exactly four paths: the three
baseline PNGs above and the new `tests/e2e/vitrine.spec.ts`. Nothing under `tests/monochrome`
or `tests/a11y` is touched — so neither can have been weakened. Both ran green here:
9 `tests/monochrome` specs in the main battery, and `tests/a11y/gold-contrast.spec.ts`
`3 passed` in its own run.

**No gold outside live repository URLs in `#vitrine`.** Runtime scan of every element under
`#vitrine` at 1440 for a non-achromatic (R≠G≠B) computed value on `color`,
`background-color`, all four border colours, `fill`, `stroke` and `outline-color`:
**13 hits, all on `a.Vitrine_live__PwDxH`** — `https://aether.srv1356245.hstgr.cloud`
(`rgb(201,168,76)`, the lit plate), `https://abentertainment.com.au` and
`https://forgotten-mistory.web.app` (`rgb(232,213,163)`, `--gold-pale`). Zero hits anywhere
else in the section. Source side agrees: every `--gold*` reference in
`components/sections/Vitrine/` sits on `.live` or one of its states.

---

## 5. Findings

### F-1 — BLOCKER for this cycle's gate. `TC-CONTRAST-01 @ 390` is red; the cause is the MiniVic launcher, and it is real.

The author's D-8 diagnosis is **independently confirmed**, by replicating the spec's own
viewport-stepping walk rather than by reading the report. At `scrollY = 5064` the failing
node's nine sample points are `[87,779] [195,779] [304,779] [86,805] [192,805] [298,805]
[89,830] [203,830] [317,830]`. Eight sampled grounds are `rgb(14,14,16)` … `rgb(31,33,36)`
→ **10.15 – 12.13 : 1**. The ninth, `[304,779]`, returns the `elementsFromPoint` stack
`button.group.relative → div.fixed.bottom-6 → li` and a masked-screenshot pixel of
**`rgb(153,153,157)` → 1.79 : 1**. The launcher's viewport box at that scroll is
`{l:302, t:756, r:366, b:820}`, `position: fixed`, `z-index: 10030`.

Two things follow, and both are true:

1. **The gate is unmet.** The cycle's own list says "TC-CONTRAST-01 green @1440 and @390".
   It is red. No exemption was added, no threshold moved, no token swapped to hide it —
   verified by reading the spec: `expect(failures.length).toBe(0)` at line 287 is intact and
   `tests/a11y/` is untouched by the diff.
2. **It is not a pure test artefact.** At 390 the launcher genuinely paints an opaque light
   disc over body prose in `#experience`; a reader sees the occlusion the sampler sees. The
   remedy is chrome work in `components/MiniVicBot.tsx` / the MiniVic tokens in
   `app/globals.css` — a dark in-palette plate under the portrait, or docking the launcher
   clear of the reading column at ≤ 480 px — plus the test that would have caught it.

**This cycle did not cause it and materially improved it.** `.bullets li { color: var(--mist-200) }`
is untouched (the only `Experience.module.css` change is the new
`p.roleHeadline .roleHeadlineOpen` rule). Against the branch base, `02-tests-failing.log`
records **68 failing nodes @1440 and 30 @390**; after the diff this reviewer measures
**0 @1440 and 1 @390**.

### F-2 — C-06's third clause is not met, and the supersession is nowhere recorded.

"…with the portrait below the lede" is **not** satisfied: the portrait figure measures
`(278–366, 96–184)` — byte-for-byte the geometry the review flagged as the defect
("the portrait tile (x=278-366, y=96-184) sits beside the eyebrow"). It is superseded by a
later binding decision: `docs/delivery/evidence/v9-20260904T2312Z/B-research/02-hero-avatar-placement.md`
§4 "Recommendation — P1", guarded by `TC-HERO-21: below 720 px the portrait is an 88 px
poster stamp with no video`, which asserts the **opposite** placement
(`box.y <= eyebrow.y + eyebrow.height`, `tests/e2e/hero.spec.ts:695-698`). TC-HERO-21 is
green in this run, and the H1 now owns the full 342 px measure and sets one line per word,
so the defect C-06 was written to remove is gone by another route. But nothing on this
branch records that one of C-06's four clauses was deliberately overruled, and a later
reader can close C-06 believing all four held. **Record the supersession.**

### F-3 — C-06's fourth clause names a class that no longer exists.

`grep -rn figureNote --include=*.ts --include=*.tsx --include=*.css` over the tree returns
**zero hits**; the comment at `Hero.module.css:241` still names `.figureNote`. Its successor
`.ledgerSource` measures **36 / 36 / 18 px** at 1440 — not one shared height — while the
three `.ledgerItem` boxes do share **123.88 px**, and there is no footnote element to measure
the 24 px against (`[class*="ledgerNote"], [class*="note"]` → 0 elements). The clause is
unmeasurable as written; the invariant it was reaching for (three entries, one box height)
holds at the `.ledgerItem` level.

### F-4 — one evidence file is filed under the wrong run.

`docs/delivery/evidence/v9-20260904T2312Z/C11-vitrine-integration/apply_edits.py` (609 lines)
is committed in `b7b2ad4` under the **v9** timestamp while every other C11 artefact of this
cycle sits under **v10-20260905T0515Z**. Misfiled, not wrong; it costs a future reader a
search.

---

## 6. Evidence produced by this verification

- `09-verify-screens/hero-1440.png`, `09-verify-screens/hero-390.png` — reviewer's own
  captures at 1440×900 and 390×844.
- `09-verify-screens/vitrine-1440.png`, `09-verify-screens/vitrine-390.png` — reviewer's own
  `#vitrine` element captures; card 01 lit and traced at rest, the rail fading into the right
  gutter, gold only on the live URL.
- Author artefacts checked against these: `04-tests-passing.log`, `06-audit.log`,
  `07-decisions.md`, `09-visual-verify.log`, `08-screens/*.png`.

## 7. Remaining step to turn this FAIL into a PASS

One step, and it is outside the files this cycle touched: make the MiniVic launcher stop
painting an opaque light surface over body prose at ≤ 480 px — a dark in-palette plate under
the portrait in `components/MiniVicBot.tsx`, or dock the launcher clear of the reading column —
add the test that would have caught the occlusion, rebaseline any MiniVic snapshot it moves,
then

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/a11y/text-contrast.spec.ts
```

must print `2 passed`.
