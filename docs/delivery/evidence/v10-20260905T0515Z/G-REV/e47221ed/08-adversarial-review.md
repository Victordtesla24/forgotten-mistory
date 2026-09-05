# 08 — Independent adversarial re-probe (PHASE 2 · G-A1 / G-A2 on live)

**Task:** `t_g_rev` PHASE 2 · **Profile:** reviewer — verification / 3rd_party_independent_adversarial_review (level 1, effort max)
**Live URL:** https://forgotten-mistory.web.app/
**Probed:** 2026-09-05 12:28Z – 12:47Z · **Verdict: G-A1 FAIL (semantics) · G-A2 PASS · no regression**
**Read-only run.** No production code was touched. Only files under this evidence directory were written.

## 0. The build I was asked to probe had already moved

The task named live `e47221ed`. It had, at the moment of the probe:

```
$ curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
build-commit" content="843b679d"
$ git log --oneline e47221e..843b679d
843b679 consolidate: merge worktree-wf_b908a7a9-f5d-2 into main (branch wins conflicts)
a80d00e feat(vitrine): plates drawn at rest; engagement CTA after the work
675eea1 docs(cycle): v10 cycle 09 — ADV-FAIL intake, first wave dispatched, About gold live
```

`e47221ed` was live when the task was written (I read it at 12:28Z, `last-modified: Sat, 05 Sep
2026 12:26:41 GMT`); the ten-minute metronome shipped `843b679d` before the browser probe ran.
**Every number below was captured against `843b679d`**, which contains `03aa1ed` unchanged — the
About diff between the two is empty:

```
$ git diff --stat e47221e 843b679d -- components/sections/About/ app/data/portfolio/about.ts
(no output)
```

So the G-A1/G-A2 claims under test are byte-identical in the build I measured. The directory keeps
the `e47221ed` name the task specified; the *measured* commit is `843b679d` in every table.

Evidence directory: `docs/delivery/evidence/v10-20260905T0515Z/G-REV/e47221ed/`

---

## 1. Verdict table — failures first

| Gap | Verdict | Measured on live `843b679d` | Evidence |
|-----|---------|------------------------------|----------|
| **G-A1** | **FAIL** — mechanically right, semantically over-graded | Colour and contrast **pass**: 9 of 10 `.About_evidence__WwIMJ` compute to `rgb(201, 168, 76)` = resolved `--gold` `#c9a84c`, exactly 1 (Salary Fit) to `rgb(144, 144, 144)` = `--mist-400`, identically at 1440×900 and 390×844. Worst-case contrast against **sampled composited ground pixels** is **7.84:1** (1440) and **7.30:1** (390) — every gold line clears AA 4.5:1. **But four of the nine gold lines do not name a record a reader can check** (§3), and two of those sit on a dimension whose own caliper is `state="open"` — the site simultaneously marks the same claim "sourced" and "honestly not measurable". Prime directive 3: never grade a claim higher than its evidence. | `captures/probe2.json` → `1440-normal.evidence`, `.contrast`, `390-normal.contrast`; `captures/1440-normal-ground-*.png`; §3 below |
| **G-A2** | **PASS** | `dt.About_keySwatch[data-state='role']` computes `background-image: repeating-linear-gradient(45deg, rgba(144, 144, 144, 0.34) 0px, rgba(144, 144, 144, 0.34) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 4px)` — **two rgb triples, channel spread 0 and 0**, both ≤ 2. The cool steel `rgb(138 143 154)` (spread 16) is gone from the computed value at both breakpoints. Swatch is **not collapsed**: 25.59 × 13.59 CSS px, `display: block`, `visibility: visible`, `opacity: 0.55`, `border-style: dashed`, `border-color: rgb(184, 184, 184)` — same box as the `answered` swatch beside it. | `captures/probe2.json` → `1440-normal.swatches[1]`, `390-normal.swatches[1]`, `.swatchPixels`; `captures/1440-normal-key-role-swatch.png`, `captures/390-normal-key-role-swatch.png` |

**`goal_complete = false`** — G-A2 passes, G-A1 fails on meaning.

---

## 2. G-A1 — the mechanical half, measured (this half is clean)

Method: for each evidence node I scrolled it into view, set only its own glyphs to
`color: transparent`, screenshotted its exact bounding box, decoded the PNG, and computed contrast
between the node's declared `color` and **every distinct ground pixel in the box** — dominant and
worst-case. This measures the composited ground the text actually sits on, not a declared
`background-color` up the tree.

### 1440 × 900

| # | Dimension | `data-sourced` | computed `color` | dominant ground | C(dom) | worst ground | **C(worst)** | AA |
|---|---|---|---|---|---|---|---|---|
| 0 | Technical Skills | true | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(21,23,25)` | **7.86** | ✅ |
| 1 | Experience Level | true | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(22,23,26)` | **7.84** | ✅ |
| 2 | Industry Match | true | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(22,23,25)` | **7.85** | ✅ |
| 3 | Role Alignment | true | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(21,23,25)` | **7.86** | ✅ |
| 4 | Culture Fit | true | `rgb(201,168,76)` | `rgb(20,20,23)` | 8.05 | `rgb(22,23,25)` | **7.85** | ✅ |
| 5 | **Salary Fit** | **false** | **`rgb(144,144,144)`** | `rgb(19,20,23)` | 5.77 | `rgb(22,22,25)` | **5.66** | ✅ |
| 6 | Location Match | true | `rgb(201,168,76)` | `rgb(20,20,23)` | 8.05 | `rgb(21,21,24)` | **7.97** | ✅ |
| 7 | Career Growth | true | `rgb(201,168,76)` | `rgb(19,20,22)` | 8.07 | `rgb(21,21,24)` | **7.97** | ✅ |
| 8 | Company Stability | true | `rgb(201,168,76)` | `rgb(19,20,22)` | 8.07 | `rgb(20,21,23)` | **8.00** | ✅ |
| 9 | North Star Align | true | `rgb(201,168,76)` | `rgb(18,19,21)` | 8.13 | `rgb(20,21,23)` | **8.00** | ✅ |

**9 gold · 1 neutral grey · minimum contrast 7.84:1** (the grey line clears AA on its own at 5.66:1).

### 390 × 844

Same 9/1 split, same triples (`rgb(201,168,76)` × 9, `rgb(144,144,144)` × 1), font-size 11.098 px.
Contrast: dominant 8.66 – 8.72, **worst-case 7.30** (Location Match, whose box overlaps a lighter
rule at `rgb(30,30,30)`); every other line's worst pixel is 8.66. All ≥ 4.5. Raw:
`captures/probe2.json` → `390-normal.contrast`.

The commit message claims "7.97:1 (1440) and 8.66:1 (390)". Both reproduce as **dominant-ground**
figures (7.99/8.05 and 8.66/8.71 here); my adversarial worst-pixel figures are 7.84 and 7.30 —
lower, still comfortably over AA. The claim is not overstated.

`data-sourced` renders as a real attribute on all ten `<p>` nodes, and the one `false` is Salary
Fit / "Open to permanent and contract engagements" — exactly as claimed.

---

## 3. G-A1 — the adversarial half: does each gold line name a checkable record?

Prime directive 3 (`CLAUDE.md`): `sourced` = *measured, with a source a reader can go and check*;
`self-reported` = *a CV figure with no published methodology behind it*. Gold means the first, not
the second. Commit `03aa1ed`'s own criterion — "an employer, a program, a named repository, **a
figure from the CV**" — admits the second category into the first. That is where it breaks.

| # | Dimension | Gold evidence line (verbatim) | Names a checkable record? | Verdict |
|---|---|---|---|---|
| 0 | Technical Skills | `38 public repositories · ATO evidence harness · ANZ platform migrations` | Yes — the repo count is checkable at `github.com/Victordtesla24`; ATO and ANZ are named employers | **OK** |
| 1 | Experience Level | `ATO · ANZ · NAB · Microsoft · Telstra · InfoCentric · MYOB` | Yes — seven named employers, checkable against CV/LinkedIn | **OK** |
| 2 | Industry Match | `Australian Taxation Office, ANZ, NAB, Telstra` | Yes — named employers | **OK** |
| 3 | Role Alignment | `Payday Super program · Agile Kookaburras squad · PI 47–48` | Partly — *Payday Super* is a publicly documented ATO program; *Agile Kookaburras* and *PI 47–48* are internal identifiers no outside reader can reach, but they are still named records rather than adjectives | **OK, weakest of the accepted set** |
| 4 | **Culture Fit** | `5+ squads, up to 40 practitioners onshore and offshore` | **No.** Names no employer, no program, no repository, no published methodology. It is a self-described figure of scale — the textbook `self-reported` case | **FLAG** |
| 6 | **Location Match** | `Currently on site with the ATO, Melbourne` | The employer is checkable, **but this dimension renders `<Caliper state="open">measured from the role</Caliper>`** — the site's own label for *"nothing here could honestly be measured about a person"*. Gold and an open jaw on one claim contradict each other | **FLAG — mark contradiction** |
| 7 | **Career Growth** | `Langfuse + Phoenix evaluation stack · −38% simulated error-budget breaches` | Half. *Langfuse* and *Phoenix* are named public tools; **`−38% simulated error-budget breaches`** is a self-reported figure that says *simulated* in its own text and publishes no methodology. The gold mark covers the whole line, including the figure | **FLAG** |
| 8 | **Company Stability** | `75+ hours of evidence against 64 available — escalated, then re-baselined` | **No.** A bare pair of numbers with no employer, program, repository, or methodology attached — **and** this dimension also carries the open `measured from the role` caliper | **FLAG — double** |
| 9 | North Star Align | `aether-job-career-agent · unmeasured signals read "not measured", never zero` | Yes — names a repository, and the behaviour claim is checkable inside it | **OK** |

**4 of 9 gold lines fail the meaning test; 2 of those also contradict their own caliper.**

The caliper contradiction is structural, not cosmetic. `components/sections/About/About.tsx:220-232`
renders the open caliper for every `dimension.side === 'role'`; the live DOM shows three such
dimensions — **Salary Fit, Location Match, Company Stability**. Only Salary Fit was given
`sourced: false`. The other two now carry gold on a dimension the same component declares
unmeasurable. The `sourced` flag was added to `Dimension` (`app/data/portfolio/about.ts:37`) without
being reconciled against the `side` flag already there, so the two marks can and do disagree.

Verified caliper states in `#about` on live: **15 caliper nodes, every one `state="open"`, all
painted `rgb(205, 205, 205)` — none gold** (`captures/probe2b-numerals.json` → `calipers`). So the
section contains no *closed* jaw to justify a gold reading; the only gold in `#about` is on the
evidence lines themselves.

**Recommended remediation (for the implementer, not applied here):** set `sourced: false` on
Culture Fit (#4) and Company Stability (#8); either set `sourced: false` on Location Match (#6) or
drop its open caliper, since one dimension cannot honestly hold both marks; and for Career Growth
(#7) either split the line so the mark covers only `Langfuse + Phoenix evaluation stack`, or drop
it to `false` while the figure stays simulated. A test asserting `side === 'role' ⇒ sourced ===
false` would make the two flags impossible to drift apart.

---

## 4. G-A2 — measured

| Check | Result |
|---|---|
| Computed `background-image` rgb triples | `rgba(144, 144, 144, 0.34)` (spread **0**) and `rgba(0, 0, 0, 0)` (spread **0**) — **no triple with spread > 2** ✅ |
| Old value present? | `rgb(138 143 154)` / `rgba(138, 143, 154, …)`: **0 occurrences** in the computed value at 1440 or 390 ✅ |
| Swatch collapsed? | **No** — 25.59 × 13.59 CSS px at both breakpoints, `display: block`, `visibility: visible`, `opacity: 0.55`, dashed border `rgb(184, 184, 184)`; identical box to the `answered` swatch ✅ |
| Rendered pixels in the swatch region | Top colours `rgb(18,18,21)`, `rgb(16,17,19)`, `rgb(18,18,20)`… — max channel spread **4**, from the page's own body radial washes (`rgba(40,42,50,…)`, gap **G-H3**, unremediated), not from this rule. Scoped note, not a G-A2 finding. |

`captures/1440-normal-key-role-swatch.png`, `captures/390-normal-key-role-swatch.png`.

---

## 5. Regression check

| Context | Status | pageerrors | failed requests | canvases | `build-commit` |
|---|---|---|---|---|---|
| 1440×900 normal | 200 | **0** | 0 | 0 | 843b679d |
| 390×844 normal | 200 | **0** | 0 | 0 | 843b679d |
| 1440×900 `?gl=force` | 200 | **0** | 0 | 1 | 843b679d |
| 390×844 `?gl=force` | 200 | **0** | 0 | **0** | 843b679d |

**No regression attributable to `03aa1ed`.** Zero page errors and zero failed requests in all four
contexts. Section screenshots: `captures/{1440-normal,390-normal,1440-glforce,390-glforce}-about.png`.

**Two observations that are NOT established as regressions, declared rather than asserted:**

1. **390 `?gl=force` yielded 0 canvases** where phase 1 recorded 1. My probe measures after
   scrolling to `#about`; the phase-1 count was taken at the initial fold. A hero scene that
   unmounts off-screen would produce exactly this difference. **Method-divergent — not a confirmed
   regression, and nothing in `03aa1ed` touches GL.** Needs a fold-anchored re-measure to settle.
2. **Gold count across the whole page rose from 2 to 11 visible nodes** — the intended delta.

### Every gold-painted node on the page, and whether it is a legitimate sourced mark

| # | Section | Node | Gold on | Legitimate per prime directive 4? |
|---|---|---|---|---|
| 0–8 | `#about` | `p.About_evidence__WwIMJ` × 9 | `color` | **Mechanically yes** — "this figure has a source". **Semantically 4 of the 9 are not** (§3). |
| 9 | `#skills` | `span.Skills_legendGlyph.Skills_measuredMark` — the `●` glyph | `color` | **Yes** — the "measured in production" mark, one of the three permitted uses. |
| 10 | `#vitrine` | `a.Vitrine_live` — `aether.srv1356245.hstgr.cloud` | `color`, borders | **Yes** — a live repository/deployment URL, the third permitted use. |

**No gold appears as a fill, a background, or a theme anywhere on the page**, at either breakpoint.
Nodes 9 and 10 are unchanged from the pre-remediation state. Raw: `probe2.json` → `*.goldNodes`.

### Compass numeral '01' — pre-existing, not worsened

Baseline (`G-A/06-a11y-text-contrast-preexisting.log:14`, and the same line in
`C20-listen-tenure/09-verify-contrast-rerun.log`):
`4.42:1 (needs 4.5) … text.Compass_numeral — "01" fg rgb(224,224,224) on bg rgb(100,101,102) @ 3.4px/400`.

Independently re-measured on live `843b679d`, all ten numerals, same ground-sampling method
(`captures/probe2b-numerals.json`):

| numeral | declared fill | opacity | composited fg | dominant ground | C(dom) | worst ground | **C(worst)** |
|---|---|---|---|---|---|---|---|
| 01 | `rgb(246,246,246)` | 0.85 | ≈`rgb(221,221,221)` | `rgb(79,80,82)` | 7.47 | `rgb(85,86,88)` | 6.80 |
| 04 (active) | `rgb(246,246,246)` | **1** | `rgb(246,246,246)` | `rgb(95,95,98)` | 5.89 | `rgb(131,131,133)` | **3.50** ❌ |
| 02,03,05–10 | `rgb(246,246,246)` | 0.85 | ≈`rgb(221,221,221)` | `rgb(79–83,…)` | 7.02–7.56 | — | 6.27–6.80 |

The composited foreground ≈ `rgb(221,221,221)` reconciles with the harness's `rgb(224,224,224)`, so
this is the same element. **The numeral row is still sub-AA** — my worst-pixel figure under the
active numeral is 3.50:1 against the harness's 4.42:1 — but the two numbers come from **different
methods** (worst antialiased pixel over the sweep arc vs. one representative background), so I
**cannot and do not claim it worsened**. `03aa1ed` changed only `About.tsx` and `About.module.css`;
`Compass.tsx` and `Compass.module.css` are untouched between `9ba97a5c` and `843b679d`.
**Recorded as pre-existing and unchanged, exactly as the task instructed.**

---

## 6. False-positive register

Claims from commit `03aa1ed` or the board that I could **not** reproduce, verbatim with the
contradicting evidence:

1. **`03aa1ed` commit body — "and these lines are that source: an employer, a program, a named
   repository, *a figure off the CV*."**
   Contradicted by `CLAUDE.md` prime directive 3, which is binding: *"`self-reported` — a CV figure
   with no published methodology behind it."* A CV figure is precisely what `sourced` is **not**.
   The criterion the commit applied admits `5+ squads, up to 40 practitioners` and `75+ hours of
   evidence against 64 available` into gold. Live evidence: `probe2.json` →
   `1440-normal.evidence[4].text`, `[8].text`, both `dataSourced: "true"`, both
   `color: rgb(201, 168, 76)`.

2. **`03aa1ed` commit body — "The tenth, Salary Fit's 'Open to permanent and contract engagements',
   states an intention rather than a record, so it keeps the caption grey."**
   The *narrow* claim reproduces exactly (node 5, `data-sourced="false"`, `rgb(144,144,144)`). The
   implied claim — that Salary Fit is the **only** line stating something other than a record — does
   not: it is one of **three** dimensions rendering the open `measured from the role` caliper, and
   the other two (Location Match, Company Stability) were graded `sourced: true`.
   Evidence: `About.tsx:220` (`dimension.side === 'role'` ⇒ open caliper); live DOM h3 text for
   nodes 5, 6 and 8 all contain `measured from the role`; `probe2b-numerals.json` → `calipers`
   (15 nodes, all `state="open"`).

3. **`03aa1ed` commit body — "--gold measures 8.4:1 on the section ground (CC-A1 samples the
   composited pixels at 1440 and 390)" (in the CSS comment) vs. "7.97:1 (1440) and 8.66:1 (390)"
   (in the message).** Two different figures for the same measurement in one commit. Mine:
   7.99–8.13 dominant at 1440, 8.66–8.72 dominant at 390. The message's pair reproduces; the CSS
   comment's single "8.4:1" matches neither breakpoint. Cosmetic, recorded for completeness.

4. **The task brief's "live … now serves build-commit `e47221ed`".** It did at 12:28Z; by the time
   the browser probe ran it served `843b679d` (§0). Not a false claim — a ten-minute metronome
   moving under the task. Recorded so the numbers are attributable.

**What I did not measure (declared, not inferred):**
- **Whether the 390 `?gl=force` canvas count is a real regression.** Method-divergent from phase 1
  (§5.1). Not established either way; must not be reported as a regression.
- **Frame rate / motion smoothness.** SwiftShader on a shared host cannot produce a trustworthy
  number; unchanged from phase 1.
- **The other nine P0 gaps** beyond the one-line status in §7 — out of PHASE 2 scope.

---

## 7. The other nine P0 gaps — status unchanged (one line each)

No re-measure was in scope; each line states whether a remediation commit exists at or before the
deployed `843b679d`.

| Gap | Status at `843b679d` |
|---|---|
| **G-H1** hero fold density | **FAIL, unchanged** — no remediation commit; hero data/CSS untouched since `9ba97a5c`. |
| **G-H2** hero flagship GL | **FAIL, unchanged** — no remediation commit; live HTML still ships **0 `<canvas>`** on a normal load at both breakpoints (`probe2.json` → `*.canvases`), GL only under `?gl=force`. |
| **G-H3** chroma in the served bundle | **FAIL, unchanged** — no remediation commit; incidentally re-observed, the body washes still composite blue-biased pixels behind `#about` (channel spread up to 4 in the swatch region, §4). |
| **G-S1** skills flagship GL | **FAIL, unchanged** — no remediation commit; `#skills` still carries no canvas in any of the four contexts. |
| **G-V1** vitrine plates ghosted at rest | **FAIL on record — but a remediation commit is now live and unverified**: `a80d00e feat(vitrine): plates drawn at rest; engagement CTA after the work` landed between `e47221ed` and `843b679d`. **Not re-probed here** (out of scope); status must be re-measured before it is closed. |
| **G-V2** no engagement CTA in vitrine | **Observed change, not verified**: the served HTML at `843b679d` now contains `Start a project` ×2 and `mailto:sarkar.vikram@gmail.com?subject=Engagement enquiry — Vikram Deshpande`, where phase 1 measured `engagementCta: []`. Same commit `a80d00e`. **Recorded as observed; not a PASS until measured in a browser context.** |
| **G-M1** `/api/chat-with-vic` poller in the client bundle | **FAIL, unchanged** — no remediation commit. |
| **G-M2** stale greeting mp3 | **FAIL, unchanged** — no remediation commit; the asset blob is untouched in `e47221e..843b679d`. |
| **G-M3** no streaming / unmeasured TTFT | **FAIL, unchanged** — no remediation commit. |

---

## 8. Reproduce

```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
git diff --stat e47221e 843b679d -- components/sections/About/ app/data/portfolio/about.ts   # empty
ln -s /root/forgotten-mistory/node_modules node_modules                                       # gitignored
node docs/delivery/evidence/v10-20260905T0515Z/G-REV/e47221ed/captures/probe2.mjs             # 4 contexts
node docs/delivery/evidence/v10-20260905T0515Z/G-REV/e47221ed/captures/probe2b-numerals.mjs   # numerals + calipers
```

Artifacts: `captures/probe2.json`, `captures/probe2b-numerals.json`,
`captures/{1440-normal,390-normal,1440-glforce,390-glforce}-about.png`,
`captures/*-key-role-swatch.png`, `captures/*-ground-{0..9}.png`, `captures/*-numeral-ground.png`.

---

## 9. Sign-off

```json
{
  "task_id": "t_g_rev",
  "phase": 2,
  "live_build_commit_measured": "843b679d",
  "live_build_commit_in_brief": "e47221ed",
  "about_diff_between_them": "empty",
  "verdicts": { "G-A1": "FAIL", "G-A2": "PASS" },
  "regressions": [],
  "goal_complete": false
}
```

G-A2 is clean and should close. **G-A1 must not close**: the colour is right and the contrast is
comfortable, but four of the nine gold lines grade a self-description as a sourced record, and two
of those sit on a dimension the same component marks unmeasurable. A `feedback_refactor_loop` task
against `t_g_a1` is required — §3 names the four lines and the fix.
