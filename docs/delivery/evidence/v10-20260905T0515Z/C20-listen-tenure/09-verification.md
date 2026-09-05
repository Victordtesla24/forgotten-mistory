# 09 — Independent adversarial verification (cycle 20: C-09 / C-11 / CC-02 / CC-05 / CC-09 / ADV-F-4 / ADV-6)

Reviewer profile: `docs/prompt.md` §5, `3rd_party_independent_adversarial_review`, level 1,
effort max. Independent of the author of `701971c…b9a9230`. Nothing below is taken from
the author's report; every number is a command run in this session against a build made
in this session.

- Worktree: `/root/forgotten-mistory/.claude/worktrees/wf_d9fbfbaa-53a-1`
- Branch HEAD verified: `b9a9230` (already an ancestor of `origin/main` @ `44691b0`)
- Rebuilt here: `npm run build:static` → `BUILD_EXIT=0` (`✓ Generating static pages (11/11)`, `✓ Exporting (2/2)`)
- Served: `python3 -m http.server 5601 --directory out --bind 127.0.0.1` (port 5601 was
  held by an orphaned server from worktree `wf_31b6f314-9ff-1` with no `playwright test`
  process attached; reclaimed with `fuser -k 5601/tcp`, released again at the end)

---

## 1. Gates, as observed

| Gate | Command | Result |
|---|---|---|
| build | `npm run build:static` | **exit 0** |
| tsc | `npx tsc --noEmit` | **exit 0** |
| lint | `npm run lint` | **exit 0** — `✔ No ESLint warnings or errors` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | **exit 0** — `RESULT: ALL PASS (10/10)` |
| targeted suites | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/e2e/audience-paths.spec.ts tests/e2e/listen.spec.ts tests/e2e/about.spec.ts tests/content tests/a11y/text-contrast.spec.ts tests/monochrome` | **exit 1** — `1 failed / 109 passed (2.4m)` |
| contrast, re-run alone | `… npx playwright test tests/a11y/text-contrast.spec.ts` | **exit 1** — `1 failed / 1 passed (35.6s)` |

Every named acceptance spec is green: AP-01…AP-05, TC-LISTEN-01…11, TC-ABOUT-13,
CT-09, CT-10, both CT-11s.

### The one red gate — TC-CONTRAST-01 @ 1440

```
1 text node(s) below AA — worst ten:
4.42:1 (needs 4.5) [about] div.About_instrumentStage__otsrl > svg.Compass_compass__KU_lT
  > g.Compass_sweep__DIKqO:nth-of-type(1) > g.Compass_rose__PW3GF > g:nth-of-type(1)
  > text.Compass_numeral__9WSmf — "01" fg rgb(224,224,224) on bg rgb(100,101,102) @ 3.4px/400
```

Reproduced twice, same node, same ratio — deterministic, not a flake. The 390 case passes.

Attribution: the failing node is a compass ring numeral over the ten luminous sectors added
by the **sibling** lane (`c6bf7ff feat(about): ten luminous sectors instead of an invisible
field`, reached this branch through the `fc856f1` merge of `origin/main`). It is not a
`#listen` or tenure change. `Compass.module.css:142-146` still carries the pre-sectors
comment asserting the numerals stay "above 4.5:1" over the sector fills; at 1440 that is
now false by 0.08. `c6bf7ff` is an ancestor of `origin/main`, so the defect is live, not
branch-local.

Bearing on this lane: `t_a88c6767`'s quality gates list **"contrast suite green"**, and the
author's report states `contrast: "exit 0"`. At the commit the author pushed, that gate is
red. The report's own `remaining` field concedes the suite was not re-run after the final
merge — so the finding is a reporting overstatement plus an unclosed gate, not fabrication.

---

## 2. Measurements taken here (Playwright + system Chrome, `out/` on :5601)

### `#listen` at 1440 (`innerWidth` 1440)

| element | font-size | color | background | height | right edge |
|---|---|---|---|---|---|
| `.engage` "Start a project" | 18px | `rgb(10,10,10)` | `rgb(246,246,246)` | 56.30 | 327.41 |
| `.pill` `sarkar.vikram@gmail.com` | 18px | `rgb(10,10,10)` | `rgb(246,246,246)` | 56.30 | 412.55 |
| `.channel` `+61 433 224 556` | 18px | `rgb(246,246,246)` | transparent | 44.00 | 260.70 |
| `.channel` `linkedin.com/in/vikramd-profile` | 18px | `rgb(246,246,246)` | transparent | 44.00 | 863.05 |
| `.channel` `github.com/Victordtesla24` | 18px | `rgb(246,246,246)` | transparent | 44.00 | 1223.83 |

- Rightmost route right edge ÷ innerWidth = **1223.83 / 1440 = 0.850** (C-09 gate > 0.7) ✔
- Pull-quote 23px ÷ channel 18px = **1.28** (CC-05 gate ≤ 1.6) ✔
- Grid tracks: `394.656px 394.672px 394.656px` — three tracks, one per address ✔
- Zero `pageerror`s while measuring.

### `#listen` at 390 (`innerWidth` 390)

All five anchors 16px; `.channel` colour `rgb(246,246,246)`, height 44.00; `.engage`/`.pill`
`rgb(10,10,10)` on `rgb(246,246,246)`, height 53.59. Quote 19px ÷ channel 16px = **1.19** ✔.
Rightmost right edge 326.56 / 390 = **0.837** ✔. Grid collapses to a single `342px` track ✔.

CC-05's literal acceptance (`font-size ≥ 16`, `color rgb(246,246,246)`, `height ≥ 44`) holds
for every `.channel`. The email is not a `.channel` — it is the `.pill`, ink-on-white, so it
clears the intent by inversion rather than by the letter of the selector.

### Padding symmetry (CC-09)

`#listen` computed block padding, top / bottom:

| 390 | 834 | 1280 | 1440 | 1920 |
|---|---|---|---|---|
| 108px / 108px | 108px / 108px | 108px / 108px | 108px / 108px | 108px / 108px |

|Δ| = 0 px at all five widths ✔

### The engagement action (CC-02 / AP-04 / AP-05)

Exactly one `[data-cta="engage"]` in `#listen`. Accessible name **"Start a project"**;
`href` = `mailto:sarkar.vikram@gmail.com?subject=Engagement%20enquiry%20%E2%80%94%20Vikram%20Deshpande`
(subject non-empty); box 231 × 56.30 at 1440, 213 × 53.59 at 390 — both ≥ 44 px. ✔

### Keyboard-only walk

From `document.body`, `Tab` reaches the engagement CTA on **press 77** with a visible ring
(`outline: 2px solid rgb(246,246,246)`, offset 4px). It is reachable and focus is never
trapped, but it is the last thing on the page — a keyboard client passes every repository
card and every skill strand first. Acceptable, not good.

### `#about` dial baseline (C-11)

At `scrollY = 0`: dial doc-top **1461.94**, first `ol li` doc-top **1461.94** → **Δ = 0.00 px**
(gate ≤ 4). At natural reading position (`scrollY = 860`) the two viewport tops are also
identical → visual Δ 0.00 px. `.instrumentStage` computes `align-self: start`,
`margin-top: 0px`. **C-11 verified in both frames of reference**, not only in the one the
test measures.

Caveat on the lane's own evidence: `08-screens/about-1440.jpg` is a full-page capture with
the stage pinned, so it shows the dial ~290 px below item 01 and cannot be read as evidence
for C-11. The measurement above, not that screenshot, is what closes the item.

---

## 3. Tenure decision (ADV-F-4 / ADV-6) — arithmetic recomputed independently

`pdftotext -layout public/docs/Vik_Resume_Final.pdf -`, line 3: **"15+ year Senior Technical
Leader"**. Role spans on the same PDF, summed here from scratch:

| span | months |
|---|---|
| May 2010 → Aug 2011 | 15 |
| Aug 2011 → Nov 2014 | 39 |
| Nov 2014 → Oct 2015 | 11 |
| Oct 2015 → Oct 2016 | 12 |
| Nov 2016 → Sept 2017 | 10 |
| Sept 2017 → June 2025 | 93 |
| June 2025 → Feb 2026 | 8 |
| March 2026 → Sept 2026 | 6 |
| **total** | **194 months = 16.167 y** |

Elapsed May 2010 → September 2026 = 196 months = **16.333 y**. `app/data/siteContent.ts`
role `dates` match the PDF span-for-span. So "Sixteen years" is supported by the CV's own
dates, and the task's first branch ("keep sixteen and print the arithmetic beside it")
is the correct one. Rendered claims, read out of the DOM:

| section | element | carries 2010 | carries 2026 |
|---|---|---|---|
| `#hero` | `p` | yes | yes |
| `#about` | `p` | yes | yes |
| `#experience` | `h2` ("Sixteen years, to scale · May 2010 → September 2026") | yes | yes |

Three claims, three derivations, no orphan figure. CT-11 enforces it. ✔

---

## 4. Findings

1. **BLOCKING — `contrast suite green` is a declared gate of `t_a88c6767` and it is red at
   the shipped HEAD.** TC-CONTRAST-01 @ 1440, 4.42:1 vs 4.5, deterministic. Inherited from
   the merged sibling lane, live on `origin/main`. Fix belongs in
   `components/sections/About/Compass.module.css` (`.numeral` opacity/colour, or the sector
   fill under it) — and the comment at `:142-146` must stop asserting a ratio the build
   does not hold. Not a `#listen`/tenure defect; it is an unclosed gate on the commit this
   lane shipped, and the report called it `exit 0`.
2. **Two filled plates, and the CTA is the smaller of them.** `app/data/portfolio/listen.ts:24`
   documents the engagement action as "the only filled plate in the section", but
   `Listen.module.css .pill` gives the email the same `background: var(--white); color:
   var(--ink-900)` treatment one row below, 288 px wide against the CTA's 231 px. On the
   1440 screenshot a client sees two identical white pills, the second larger. The comment
   is now false, and the visual hierarchy points at the address rather than at the action.
3. **Duplicate test id `CT-11`.** `tests/content/content-check.spec.ts` now has both
   "CT-11: GitHub and LinkedIn are linked from the closing section" (:222) and "CT-11: every
   tenure claim on the page carries its evidence" (:308). Both pass; the id no longer
   identifies a single assertion, which breaks the traceability the ledger relies on.
   Renumber the new one.
4. **`app/data/siteContent.ts` still says "sixteen years" twice with no anchors** — `:69`
   (`subtitle`) and `:480` (`longevity.claim`). `t_652f383d` named this file in scope
   (`grep "ixteen"`). Neither string reaches the DOM today (only `contact` and `experience`
   are imported from that module), so CT-11 cannot see them and the page is not currently
   in breach — but they are two un-derived tenure claims sitting in the content source of
   truth, ready to render the moment something imports them.
5. **The engagement CTA is tab stop 77.** Reachable with a visible ring, so AP-02's
   sibling requirement holds, but a keyboard client crosses the entire page to reach the
   one action written for them.

## 5. Verdict

**FAIL** — on finding 1 alone. Every acceptance item this lane was given (C-09, C-11,
CC-02, CC-05, CC-09, ADV-F-4/ADV-6) is independently verified correct, and the tenure
arithmetic holds against the PDF; but a quality gate the task lists is red at the commit
that shipped, and the report recorded it as passing. The remedy is small and belongs to
whoever owns the compass sectors.

Raw artefacts for this pass, committed beside this file: `09-verify-build.log`,
`09-verify-tests.log`, `09-verify-contrast-rerun.log`, `09-verify-measurements.json`.
