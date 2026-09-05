# C5 — Regression triage (v9-20260904T2312Z)

Worktree: `/root/forgotten-mistory/.claude/worktrees/wf_d2c0a366-fd2-1`
Branch: `worktree-wf_d2c0a366-fd2-1` (base 5f05575)
Started: 2026-09-05T00:21Z · hard cap 25 min · verification complete 00:40Z

Input: 276 tests, 236 passed, 40 failed against the cycle-1 static export
(`failing-tests.txt` here; `c1-full-suite.log` in the main checkout's copy of
this directory). None of these is a regression introduced today — the suite
could not be discovered before this run.

Toolchain in the worktree (all **Verified** this session, after the last edit):
`npm run build:static` exit 0 (secret scan PASS) · `npx tsc --noEmit` exit 0 ·
`npm run lint` clean · `node scripts/validate/overhaul_static_audit.mjs`
**10/10** (`static-audit-after.log`). Export served at `http://127.0.0.1:5603`
for every reproduction below; server stopped at the end.

Legend: **Verified** = derived from a tool call in this session ·
**Inferred** = reasoned from read source/logs · **Assumed** = not checked.

## Summary

| # | spec | failing | classification | action | after |
|---|------|---------|----------------|--------|-------|
| 1 | tests/e2e/contact.spec.ts | 17 | stale-subject | spec deleted | retired (17 → 0 tests) |
| 2 | tests/e2e/github-feed-fallback.spec.ts | 4 | stale-subject | spec deleted | retired (4 → 0 tests) |
| 3 | tests/a11y/reduced-motion-choreography.spec.ts | 5 | real-defect | six CSS modules re-scored | 7/7 pass |
| 4 | tests/overhaul/design-scale.spec.ts | 4 | real-defect | Footer.module.css `.sup` on the scale | 16/16 pass |
| 5 | tests/monochrome/gold-semantics.spec.ts GS-02 | 3 | real-defect | Vitrine `.live` steps down to `--gold-pale` (and a grey underline) off the lit plate | 5/5 pass |
| 6 | tests/a11y/gold-contrast.spec.ts | 2 | real-defect | GC-02 fixed in Skills.module.css; GC-01 needs the Vitrine rest-opacity change | GC-02 pass · **GC-01 still failing** |
| 7 | tests/overhaul/cinematic.spec.ts TC-CINE-06 | 1 | test-bug (contradictory contract) | assertion re-pointed to the R-46 fade band | 7/7 pass |
| 8 | tests/perf/performance.spec.ts PERF-06/07 | 2 | test-bug + real-defect | hardcoded :5599 / `.hero-title` / LCP reader fixed in the test; h1 no longer enters from opacity 0 (Hero.module.css) | 7/7 pass |
| 9 | tests/visual/screenshots.spec.ts VIS-04 | 1 | test-bug (stale baseline) | baseline regenerated for VIS-04 only, PNG inspected | 6/6 pass |

Net: 40 failing → **1** (GC-01). Suite size 276 → 255 (21 stale tests retired).

## Detail

### 1 · contact.spec.ts (17) — stale subject → deleted

- Every test failed in `gotoHome` on `waiting for locator('#contact')` (log
  lines 625–1119). **Verified.**
- `grep -rn 'id="contact"|#contact|contact-form' app components lib` → the only
  hit is a comment in `components/site/Navigation.tsx:9` recording that
  `#contact` was deleted in the rebuild. `grep -o 'id="…"' out/index.html`
  lists the six section ids (`hero about experience skills vitrine listen`) and
  no `contact`. **Verified.**
- Deletion commits: `components/site/ContactScroll.tsx` removed in **699933f**
  `refactor(deadcode): delete the site that no longer exists`;
  `components/site/ContactForm.tsx` + `ContactScroll.tsx` removed again in
  **6dcb4f5** `fix(toolchain): return main to green …` after the merge
  4174eea had restored them. `git log -S'id="contact"'` last touches
  **dc28bd3** `feat(vitrine): what is keeping me busy — six of thirty-eight`.
  **Verified.**
- Coverage that survives: the contact facts now live in `#listen`
  (`app/data/portfolio/listen.ts` — mailto, LinkedIn) and are asserted by
  `tests/e2e/listen.spec.ts`, `tests/overhaul/complete.spec.ts`
  TC-COMPLETE-05, `tests/content/content-check.spec.ts`. **Verified** (grep).
  CLAUDE.md forbids restoring a deleted section by reintroducing its component
  (`docs/prompt.md` R-16), so the spec is retired, not re-pointed.

### 2 · github-feed-fallback.spec.ts (4) — stale subject → deleted

- All four failed on `waiting for locator('#work')` (log lines 1119–1230);
  the spec then targets `#github-projects` / `data-github-source`. **Verified.**
- `grep -rn 'GithubFeed|github-projects|id="work"|data-github-source' app
  components lib` → zero hits. `out/index.html` has no `work` or
  `github-projects` id. **Verified.**
- `components/site/GithubFeed.tsx` deleted in **699933f** and again in
  **6dcb4f5** (same merge-restore story as §1). `git log -S'GithubFeed'` →
  6dcb4f5, 4e8961c, 4174eea, 699933f, ddd0e38. **Verified.**
- The `#vitrine` carousel is the replacement subject and has its own suites
  (`tests/e2e/vitrine.spec.ts`, complete.spec TC-COMPLETE-07). **Verified**
  (files exist; not re-run here).

### 3 · reduced-motion-choreography (5) — real defect → fixed in CSS modules

- Failures (log 126–625): About / Experience / Skills / Vitrine / Listen each
  had **0** opacity entrances under `prefers-reduced-motion` (RM-1), **0**
  stagger delays (RM-1), colour hover transitions crushed 200–320 ms → 0 ms
  (RM-4: About 53 offenders, Experience 18, Skills 11, Vitrine 8), and
  Experience had `span.roleChevron` still transitioning `transform 200ms`
  under reduce (RM-3, 10 offenders). Hero passed — its
  `Hero.module.css:395-416` block is the pattern the spec names. **Verified.**
- Cause: each module's reduce block was a kill switch —
  `transition: none` / `animation: none` on the colour affordances
  (`About.module.css:255`, `Compass.module.css:176`,
  `Experience.module.css:434`, `Skills.module.css:379`,
  `Vitrine.module.css:375`, `Listen.module.css:166`). **Verified** (read).
- Fix (smallest change, in the owning module, mirroring Hero): each reduce block
  now (a) fades the section's own children on an opacity-only keyframe —
  320 ms linear `both`, staggered 0/40/80/120/160(+) ms so the section still
  arrives in order; (b) keeps every colour transition at its default duration;
  (c) drops only movement — Compass `.rose` transform, Experience
  `.roleChevron(+::before/::after)` transform and the `.trackBar::before`
  transform leg, Vitrine `.plate` transform leg, Listen `.rule` scaleX and
  `.channel::after`. Plates and the Listen rule are **not** faded: the
  carousel's unlit state and the rule's 0.55 opacity are designed states that
  RM-2 says reduced motion must reproduce, not brighten. **Verified** (edits).
- After: `reduced-motion-cinematic-after.log` (first build) and
  `hero-recheck-after.log` (after the Hero change in §8) — 14 passed each:
  all seven RM tests plus the seven cinematic tests. **Verified.**

### 4 · design-scale (4) — real defect → fixed in Footer.module.css

- One stray at every breakpoint: `9.36px — first seen on sup.Footer_sup`
  (log 1438–1617). `Footer.module.css:68` set `.sup { font-size: 0.72em }`.
  **Verified.**
- Fix: `font-size: var(--fs-micro)` — the smallest step of the scale
  (`--fs-micro` at `app/globals.css:153`, not edited). Line-height 0 and the
  0.42em vertical-align are kept so the superscript still does not open the
  footer's line box. **Verified.**
- After: `design-scale-gold-contrast-perf-after.log` — all 16 design-scale
  tests pass. **Verified.**

### 5 · gold-semantics GS-02 (3) — real defect → fixed in Vitrine.module.css

- At 768/1280/1920 two `a.Vitrine_live` URLs (`aether…`, `abentertainment…`)
  share the viewport in saturated `rgb(201,168,76)` (log 1295–1403). The
  assertion text prescribes the remedy: "additional sourced marks step down to
  `--gold-pale`". **Verified.**
- Fix, two steps: (1) `.live { color: var(--gold-pale) }` with
  `.plate[data-lit] .live { color: var(--gold) }` — the lit plate carries the
  one saturated mark; its neighbours in shadow keep the gold meaning (this
  figure has a source) one step paler. (2) The first re-run still counted two
  marks because the unlit URL's `--gold-veil` underline is the same RGB at
  alpha 0.13 and the spec matches gold by RGB regardless of alpha
  (`gold-semantics-after.log` first run, lines 26/32). The underline therefore
  moved into the lit rule too; unlit URLs keep the grey `--card-border`
  hairline every `.source` link already uses. `--gold-pale` and `--gold-veil`
  are existing tokens (`globals.css:35,39`). **Verified.**
- After: `gold-semantics-after.log` — 5 passed (phone/tablet/laptop/desktop
  GS-02 plus GS-01). VIS-05 (vitrine baseline) still passes within the 1 %
  pixel tolerance, so the step-down did not need a new baseline
  (`visual-after.log`). **Verified.**

### 6 · gold-contrast (2) — real defect → GC-02 fixed; GC-01 needs a Vitrine design change

- **GC-02** (Skills): six "measured in production" labels at **3.92:1**
  (`#6e7178` = `--ink-300` on the card ground). Fix: `.statusLabel` →
  `--ink-400` (`#8F93A3`); the spec now measures **6.27:1** for all six. Only
  that rule changed; the `pending` row override already used `--mist-400`.
  **Verified** (`gold-contrast-after.log`).
- **GC-01** (Vitrine): the two *unlit* plates' live URLs composited to
  **2.38:1** because `.plate { opacity: 0.42 }` (`Vitrine.module.css:90`)
  dims the whole plate. After §5 they measure **3.15:1 / 3.16:1** — better,
  still short. No text colour can clear 4.5:1 through a 0.42 opacity chain on
  `--ink-900` (**Verified** for `--gold` and `--gold-pale`; **Inferred** for
  the rest from WCAG relative-luminance arithmetic). At the rest opacity the
  orchestrator has already scheduled for Cycle 11 (**0.62**), `--gold-pale`
  composites to ≈5.5:1 (**Inferred**). That is a section design decision with
  a visual-baseline consequence (VIS-05), so it is **not** made here;
  direction recorded below. GC-01 is the one test still failing.

### 7 · cinematic TC-CINE-06 (1) — contradictory contract → test re-pointed

- The test asserted the reduced-motion `heroFade` duration is **< 20 ms**
  (`cinematic.spec.ts:208`), i.e. that "the site-wide guard in globals.css
  collapses its duration to ~0". That guard is exactly the R-46 kill switch
  that `reduced-motion-choreography.spec.ts` RM-1 (fade **150–600 ms**) and
  RM-5 (no universal duration override) forbid — and the Hero passes RM-1 at
  320 ms. Two live specs cannot demand both; the choreography spec cites the
  governing requirement (R-46 / R-101 / SC-27.1, lock §4.3). **Verified**
  (both specs read).
- Fix: the assertion now reads the keyframes the h1's running animation
  interpolates off the shipped CSSOM and requires exactly `['opacity']`, a
  duration inside 150–600 ms, and `transform: none` — a stricter statement of
  "a fade, not a rise", with the comment explaining the change. No threshold
  was widened: the old `< 20` is replaced by the contract that supersedes it.
- After: 7/7 cinematic pass (`hero-recheck-after.log`). **Verified.**

### 8 · performance PERF-06 / PERF-07 (2) — test bugs + one real hero defect

- Test bug (both): hardcoded `http://localhost:5599/`, and PERF-06 looked for
  `<h1 class="hero-title">` / `#hero .hero-title`, which left with the old
  hero — the h1 is `#hero-name` (`Hero.tsx:44`). Fixed: the config `baseURL`
  fixture is threaded into `browser.newContext`, and the selector/regex target
  `id="hero-name"`. **Verified.**
- Real defect, exposed once PERF-06 could see the h1: with JS blocked it read
  **opacity 0.66** mid-entrance (`No-JS hero title: {"opacity":0.660218…}`)
  because `heroRise` starts every hero child at `opacity: 0`
  (`Hero.module.css:105`). Fix (Hero.module.css only): `.name {
  animation-name: heroRiseSolid }` — a transform-only rise (14 px → 0) on the
  same beat and easing as its siblings, so the name is painted solid from the
  first frame. Under reduced motion the existing `heroFade` block still
  applies (TC-CINE-06 contract unchanged, re-verified). After: `No-JS hero
  title: {"opacity":1,…}`. **Verified.**
- Test bug (PERF-07): after the hero fix it still logged `LCP entry: null`
  while PERF-02 — same phone viewport — reported `LCP: 484 ms`. The
  difference is the reader: PERF-07 polled
  `performance.getEntriesByType('largest-contentful-paint')`, which returns
  nothing for that type (LCP entries are only delivered through a
  PerformanceObserver list), and its observer callback ignored its list and
  re-polled. Fixed to read `list.getEntries()` exactly as PERF-02 does;
  every assertion is unchanged. After: `LCP entry:
  {"startTime":660,"tag":"H1","className":"Hero_name__vovn8"}` — the hero name
  is the LCP element, within budget. `perf-after.log` — 7 passed. **Verified.**

### 9 · visual VIS-04 (1) — stale baseline → regenerated for this test only

- Expected 1280×1739, received 1280×818 (log 1670+). The Listen section lost
  its self-presentation clip and disclaimer in **9733a85** and the footer was
  replaced in **9a99215**; the committed PNG predates both. **Verified**
  (`git log -- components/sections/Listen`, `-- tests/baselines`).
- Action: `UPDATE_SNAPSHOTS=1 … -g VIS-04` only (1 passed, baseline written),
  then the whole visual suite re-run without the flag — 6 passed
  (`visual-after.log`). **Verified.**
- The regenerated PNG (`tests/baselines/visual/screenshots.spec.ts-snapshots/
  listen-section-chromium-linux.png`, 1280×818) was opened and shows: the
  kicker "ALWAYS WILLING TO LISTEN", the serif heading "Feedback & coffee?",
  the italic sentence "I have been wrong often enough to want to hear it early…",
  a short gold hairline rule, the four mono channels (email, phone, LinkedIn,
  GitHub), the "COFFEE · MELBOURNE CBD · I'LL COME TO YOU" line, and the
  MiniVic launcher disc at the right edge. No clip, no disclaimer — the section
  as it is built today. **Verified** (image read).

## Token directions (not applied here — orchestrator owns tokens)

- None required. Every fix above lives in a CSS module or a test; `:root`,
  `design-tokens.json` and `lib/palette.ts` were not touched.

## Section-design directions (not tokens, but not made here either)

- **Vitrine rest opacity** (`Vitrine.module.css:90`, `.plate { opacity: 0.42 }`)
  → **0.62** (already Cycle 11, task #11). With §5's `--gold-pale` step-down in
  place this clears GC-01 (≈5.5:1) — do it together with a VIS-05 baseline
  refresh.

## Still failing at cap

- `tests/a11y/gold-contrast.spec.ts` GC-01 — needs the Vitrine rest-opacity
  change above (3.15:1 today; 4.5:1 required).

## Files changed

- Deleted: `tests/e2e/contact.spec.ts`, `tests/e2e/github-feed-fallback.spec.ts`
- CSS modules: `About`, `Compass`, `Experience`, `Skills`, `Vitrine`, `Listen`,
  `Hero`, `site/Footer`
- Tests: `tests/overhaul/cinematic.spec.ts`, `tests/perf/performance.spec.ts`
- Baseline: `tests/baselines/visual/screenshots.spec.ts-snapshots/listen-section-chromium-linux.png`
- Evidence: this directory (`*-after.log`, `static-audit-after.log`,
  `failing-tests.txt`), `reports/static-audit.json` (audit output, tracked)
