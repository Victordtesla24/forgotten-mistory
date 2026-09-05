# 08 — Independent adversarial re-probe (PHASE 3 · G-A1 after the semantics correction)

**Task:** `t_g_rev` PHASE 3 · **Profile:** reviewer — verification / 3rd_party_independent_adversarial_review (level 1, effort max)
**Live URL:** https://forgotten-mistory.web.app/
**Probed:** 2026-09-05 12:54Z – 13:07Z · **Verdict: G-A1 PASS · no regression**
**Read-only run.** No production code was touched. Only files under this evidence directory were written.

Predecessor under review: `../e47221ed/08-adversarial-review.md` (**G-A1 FAIL — semantics**). Its four
named offending lines and its `probe2.mjs` sampled-ground contrast method are reused verbatim; every
number below was re-captured from scratch, none carried over.

---

## 0. The build I was asked to probe had already moved (again)

The task named live `37cbb52c` at 12:53:10Z. At the moment I read the meta:

```
$ curl -s https://forgotten-mistory.web.app/ | grep -oE '<meta name="build-commit"[^>]*>'
<meta name="build-commit" content="7d467770"/>          # 12:54:15Z
```

`7d467770` is **one docs-only commit on top of `37cbb52`**, and `37cbb52` is the consolidate merge
that carried `d958917` — the commit under test — into `main`:

```
7d46777 docs(adv): orchestrator compliance FAIL on O5 + rectify prompt
37cbb52 consolidate: merge worktree-wf_d917eafb-f9f-1 into main
d958917 fix(about): gold only where the evidence names a checkable record (G-A1 correction)

$ git diff --name-only 37cbb52 7d46777
docs/ORCHESTRATOR-RECTIFY-PROMPT.md
docs/adversarial/ORCH-COMPLIANCE-20260905T1245Z.md
$ git diff --name-only 37cbb52 7d46777 -- app components lib | wc -l
0
```

So the rendered artefact is byte-identical to `37cbb52c` for every file that can affect this verdict.
The directory keeps the `37cbb52c` name the task specified; the **measured** commit is `7d467770`,
and the live DOM confirms it in all four probe contexts (`captures/probe3.json` → `*.buildCommit`).

Evidence directory: `docs/delivery/evidence/v10-20260905T0515Z/G-REV/37cbb52c/`
Probes: `captures/probe3.mjs` (colour, contrast, calipers, gold census) · `captures/probe3b-gl.mjs`
(targeted `?gl=force` canvas attribution) · raw `captures/probe3.json`, `captures/probe3b-gl.json`.

---

## 1. Verdict — failures first

**There are no failures to put first.** Every claim in `d958917` reproduced on live, including the
semantic one that failed in phase 2. Stated plainly so the absence is not mistaken for an unrun check:

| Gap | Verdict | Measured on live `7d467770` | Evidence |
|-----|---------|------------------------------|----------|
| **G-A1** | **PASS** | Exactly **5 gold / 5 grey**, identical at 1440×900 and 390×844: `rgb(201,168,76)` = resolved `--gold` `#c9a84c` on Technical Skills, Experience Level, Industry Match, Role Alignment, North Star Align; `rgb(144,144,144)` = `--mist-400` on Culture Fit, Salary Fit, Location Match, Career Growth, Company Stability. **All four lines phase 2 flagged are now grey.** Every remaining gold line names a record I could open or check — two of them I checked against GitHub live (§3). All three `side==='role'` dimensions are grey and carry the open caliper — the mark contradiction is gone. All five grey lines still print their evidence (41–74 chars). Worst-case contrast against sampled composited ground: **7.84:1** (1440) / **8.66:1** (390) for gold, **5.62:1** / **5.22:1** for grey — every line clears AA 4.5:1. Whole-page gold census is **exactly 7**, all legitimate. 0 pageerrors, 0 failed requests in all four contexts. | §2–§6 below |

**`goal_complete = true`.**

---

## 2. The mechanical half — colour of all ten evidence nodes

`data-sourced` renders as a real attribute on all ten `<p class="About_evidence__WwIMJ">` nodes.
Colour is identical at both breakpoints; the table is not repeated for 390 because every triple
matches (`captures/probe3.json` → `390-normal.evidence`).

| # | Dimension | `side` | `data-sourced` | computed `color` | token |
|---|---|---|---|---|---|
| 0 | Technical Skills | candidate | `true` | `rgb(201, 168, 76)` | **gold** |
| 1 | Experience Level | candidate | `true` | `rgb(201, 168, 76)` | **gold** |
| 2 | Industry Match | candidate | `true` | `rgb(201, 168, 76)` | **gold** |
| 3 | Role Alignment | candidate | `true` | `rgb(201, 168, 76)` | **gold** |
| 4 | Culture Fit | candidate | `false` | `rgb(144, 144, 144)` | grey |
| 5 | Salary Fit | **role** | `false` | `rgb(144, 144, 144)` | grey |
| 6 | Location Match | **role** | `false` | `rgb(144, 144, 144)` | grey |
| 7 | Career Growth | candidate | `false` | `rgb(144, 144, 144)` | grey |
| 8 | Company Stability | **role** | `false` | `rgb(144, 144, 144)` | grey |
| 9 | North Star Align | candidate | `true` | `rgb(201, 168, 76)` | **gold** |

**5 gold · 5 grey**, exactly the split `d958917` claims, exactly the dimensions it names.
Resolved tokens read back from `:root`: `--gold: #c9a84c`, `--mist-400: #909090` — so
`rgb(201,168,76)` and `rgb(144,144,144)` are those two tokens and nothing else.

Phase 2's four flagged lines — Culture Fit (#4), Location Match (#6), Career Growth (#7), Company
Stability (#8) — **are all four now grey**. That is the full remediation phase 2 recommended, with
Location Match resolved by the `sourced: false` option rather than by dropping its caliper.

---

## 3. The adversarial half — does each gold line name a record a reader can open or check?

I judged these myself against prime directive 3 (`sourced` = *measured, with a source a reader can go
and check*), and did not take the commit's word for any of them. Where a claim was externally
checkable I went and checked it rather than reasoning about it.

| # | Dimension | Gold line (verbatim from live DOM) | Record named | My verdict |
|---|---|---|---|---|
| 0 | Technical Skills | `38 public repositories · ATO evidence harness · ANZ platform migrations` | **Checked live:** `api.github.com/users/Victordtesla24` → `"public_repos": 38` — the figure is exact, today, from the register it points at. Plus two named employers (ATO, ANZ). | **OK — verified externally** |
| 1 | Experience Level | `ATO · ANZ · NAB · Microsoft · Telstra · InfoCentric · MYOB` | Seven named employers, each checkable on LinkedIn / the CV. Contains no figure at all — nothing here to over-grade. | **OK — strongest of the set** |
| 2 | Industry Match | `Australian Taxation Office, ANZ, NAB, Telstra` | Four named employers. No figure. | **OK** |
| 3 | Role Alignment | `Payday Super program · Agile Kookaburras squad · PI 47–48` | *Payday Super* is a publicly documented ATO program — the exact record type the task names as acceptable. *Agile Kookaburras* and *PI 47–48* are internal identifiers an outside reader cannot reach, but they are **named records, not adjectives and not performance figures** — `PI 47–48` labels a program increment, it does not assert an achievement. | **OK — weakest admitted, but no unverifiable figure rides on the mark** |
| 9 | North Star Align | `aether-job-career-agent · unmeasured signals read "not measured", never zero` | **Checked live:** `github.com/Victordtesla24/aether-job-career-agent` → **HTTP 200**. The repository exists and is public; the behaviour claim is checkable inside it. | **OK — verified externally** |

**0 of 5 gold lines is a self-description. 0 of 5 carries an unverifiable figure.**

The two categories phase 2 correctly rejected are both gone from gold:

- **self-described scale** — `5+ squads, up to 40 practitioners onshore and offshore` (Culture Fit) and
  `75+ hours of evidence against 64 available` (Company Stability) → both now `rgb(144,144,144)`.
- **a figure that says *simulated* in its own text** — `−38% simulated error-budget breaches`
  (Career Growth) → now `rgb(144,144,144)`.

I tried to break the remaining five and could not. The closest thing to a crack is Role Alignment's
`Agile Kookaburras squad · PI 47–48`: an outside reader cannot open those. I do **not** flag it,
because the criterion is *names a checkable record*, the line's lead element (`Payday Super program`)
is exactly such a record, and the two internal identifiers make no claim of merit that the gold mark
could inflate. Recording the reasoning so a future reviewer can disagree with it on the record.

### The caliper contradiction is resolved

Phase 2's structural finding: three dimensions render `<Caliper state="open">measured from the role</Caliper>`
(`About.tsx:220`, driven by `dimension.side === 'role'`) while two of them were graded `sourced: true`
— the site marking one claim both *sourced* and *honestly not measurable*.

Live now:

| `side==='role'` dimension | caliper in its own `<li>` | caliper colour | evidence colour |
|---|---|---|---|
| Salary Fit | `state="open"` — "measured from the role" | `rgb(205, 205, 205)` | `rgb(144, 144, 144)` grey |
| Location Match | `state="open"` — "measured from the role" | `rgb(205, 205, 205)` | `rgb(144, 144, 144)` grey |
| Company Stability | `state="open"` — "measured from the role" | `rgb(205, 205, 205)` | `rgb(144, 144, 144)` grey |

**All three are grey.** `#about` holds 15 caliper nodes, **every one `state="open"`, all painted
`rgb(205,205,205)` — none gold**, so no closed jaw anywhere contradicts anything. Confirmed in source
too: every `side: 'role'` entry in `app/data/portfolio/about.ts` carries `sourced: false` (lines
104–108, 112–119, 136–142). No dimension holds gold and an open jaw at once.
(`captures/probe3.json` → `1440-normal.evidence[*].calipers`, `.calipersInAbout`.)

### The grey lines still print their evidence — nothing was deleted

| # | Dimension | Grey line (verbatim) | length |
|---|---|---|---|
| 4 | Culture Fit | `5+ squads, up to 40 practitioners onshore and offshore` | 54 |
| 5 | Salary Fit | `Open to permanent and contract engagements` | 42 |
| 6 | Location Match | `Currently on site with the ATO, Melbourne` | 41 |
| 7 | Career Growth | `Langfuse + Phoenix evaluation stack · −38% simulated error-budget breaches` | 74 |
| 8 | Company Stability | `75+ hours of evidence against 64 available — escalated, then re-baselined` | 73 |

**All five > 10 chars**, all byte-identical to the pre-correction text. The correction changed the
*grade*, not the content — `d958917`'s "nothing was deleted" claim reproduces exactly.

---

## 4. Contrast — every line, against sampled composited ground

Method identical to phase 2: scroll the node into view, set **only its own glyphs** to
`color: transparent`, screenshot its exact bounding box, decode the PNG, and compute contrast between
the declared `color` and **every distinct ground pixel in the box** — dominant and worst-case. This
measures the ground the text actually sits on, not a declared `background-color` up the tree.

### 1440 × 900

| # | Dimension | fg | dominant ground | C(dom) | worst ground | **C(worst)** | AA |
|---|---|---|---|---|---|---|---|
| 0 | Technical Skills | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(21,23,25)` | **7.86** | ✅ |
| 1 | Experience Level | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(22,23,26)` | **7.84** | ✅ |
| 2 | Industry Match | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(22,23,25)` | **7.85** | ✅ |
| 3 | Role Alignment | `rgb(201,168,76)` | `rgb(20,21,24)` | 7.99 | `rgb(22,23,25)` | **7.85** | ✅ |
| 4 | Culture Fit | `rgb(144,144,144)` | `rgb(20,20,23)` | 5.76 | `rgb(22,23,25)` | **5.62** | ✅ |
| 5 | Salary Fit | `rgb(144,144,144)` | `rgb(19,20,23)` | 5.77 | `rgb(21,23,25)` | **5.63** | ✅ |
| 6 | Location Match | `rgb(144,144,144)` | `rgb(20,20,23)` | 5.76 | `rgb(21,21,24)` | **5.71** | ✅ |
| 7 | Career Growth | `rgb(144,144,144)` | `rgb(19,20,22)` | 5.77 | `rgb(21,21,24)` | **5.71** | ✅ |
| 8 | Company Stability | `rgb(144,144,144)` | `rgb(19,20,22)` | 5.77 | `rgb(20,21,23)` | **5.72** | ✅ |
| 9 | North Star Align | `rgb(201,168,76)` | `rgb(18,19,21)` | 8.13 | `rgb(20,21,23)` | **8.00** | ✅ |

**Minimum gold worst-case 7.84:1** · minimum overall 5.62:1 · **all ten ≥ 4.5:1.**

### 390 × 844

Same 5/5 split, same triples. Gold: dominant 8.66–8.71, **worst-case 8.66**. Grey: dominant 6.20–6.24,
**worst-case 5.22** (Location Match, whose box overlaps a lighter rule at `rgb(30,30,30)`); every other
grey line's worst pixel is 6.20. **All ten ≥ 4.5:1.**

Raw: `captures/probe3.json` → `1440-normal.contrast`, `390-normal.contrast`; per-node ground PNGs
`captures/{1440,390}-normal-ground-{0..9}.png`.

---

## 5. Whole-page gold census — 7, exactly as the task predicted

Phase 2 counted 11 visible gold nodes. The census run is byte-identical (same selector sweep over
`color`, all four border colours, `fill`, `stroke`, `outlineColor`, `textDecorationColor`,
`caretColor`, `backgroundImage`, `boxShadow`, filtered to nodes that actually paint).

| # | Section | Node | Gold on | Legitimate per prime directive 4? |
|---|---|---|---|---|
| 0 | `#about` | `p.About_evidence` — "38 public repositories · ATO evidence harness · ANZ platform migrations" | `color` | **Yes** — sourced figure, verified against the GitHub API today |
| 1 | `#about` | `p.About_evidence` — "ATO · ANZ · NAB · Microsoft · Telstra · InfoCentric · MYOB" | `color` | **Yes** — named employers |
| 2 | `#about` | `p.About_evidence` — "Australian Taxation Office, ANZ, NAB, Telstra" | `color` | **Yes** — named employers |
| 3 | `#about` | `p.About_evidence` — "Payday Super program · Agile Kookaburras squad · PI 47–48" | `color` | **Yes** — named public ATO program |
| 4 | `#about` | `p.About_evidence` — "aether-job-career-agent · unmeasured signals read \"not measured\", never zero" | `color` | **Yes** — named repository, HTTP 200 today |
| 5 | `#skills` | `span.Skills_legendGlyph.Skills_measuredMark` — the `●` glyph | `color` | **Yes** — the "measured in production" mark, a permitted use |
| 6 | `#vitrine` | `a.Vitrine_live` — `aether.srv1356245.hstgr.cloud` | `color`, borders | **Yes** — a live deployment URL, a permitted use |

**7 visible gold nodes at 1440 and 7 at 390 — 5 About + Skills measured mark + Vitrine live URL.**
Exactly the count the task predicted; down from phase 2's 11 by the four demoted lines.
**No gold appears as a fill, a background, or a theme anywhere on the page**, at either breakpoint.
The `borderTopColor`/`caretColor`/`outlineColor` entries beside each `color=` hit are inherited
`currentColor` defaults on unbordered text nodes, not painted gold rules — box widths confirm no
border is drawn. Nodes 5 and 6 are unchanged from the pre-correction state.

---

## 6. Regression check

| Context | status | **pageerrors** | failed requests | canvases (probe3) | `build-commit` |
|---|---|---|---|---|---|
| 1440×900 normal | 200 | **0** | 0 | 0 | 7d467770 |
| 390×844 normal | 200 | **0** | 0 | 0 | 7d467770 |
| 1440×900 `?gl=force` | 200 | **0** | 0 | 0 → **1** (§6.1) | 7d467770 |
| 390×844 `?gl=force` | 200 | **0** | 0 | 0 → **1 at fold** (§6.1) | 7d467770 |

**No regression.** Zero page errors and zero failed requests in every context at both widths.
Section screenshots: `captures/{1440-normal,390-normal,1440-glforce,390-glforce}-about.png`.

### 6.1 The canvas count was my own probe's timing artefact — and it settles phase 2's open question

`probe3.mjs` reported **0 canvases under `?gl=force` at both widths**, where phase 2 reported 1 at
1440. Rather than file that as a regression, I isolated it (`probe3b-gl.mjs`, 2500 ms settle instead
of 1200 ms, sampled at four scroll positions, and asking the browser itself for a GL context):

| width | GL context | renderer | at fold | at `#experience` | at `#about` | back at fold |
|---|---|---|---|---|---|---|
| 1440 | `webgl2` | ANGLE / **SwiftShader** (Vulkan 1.3.0, Subzero) | **1** | **1** | **1** | **1** |
| 390 | `webgl2` | ANGLE / **SwiftShader** (Vulkan 1.3.0, Subzero) | **1** | 0 | 0 | **1** |

**WebGL is alive on live under forced SwiftShader, with 0 pageerrors.** My 0-count came from too
short a settle in `probe3.mjs`, not from the site. Recorded as a **probe defect, not a finding.**

This also **settles phase 2's declared-unmeasured item #1** ("390 `?gl=force` yielded 0 canvases where
phase 1 recorded 1 — method-divergent, not established either way"). It is now established: at 390 the
canvas **is** present at the first fold, unmounts when scrolled away, and **remounts on scroll back**.
Phase 2's hypothesis — "a hero scene that unmounts off-screen would produce exactly this difference" —
is confirmed. **Not a regression; intended off-screen unmount behaviour.**

---

## 7. False-positive register

Claims in `d958917` (or the task brief) I could **not** reproduce, verbatim with the contradicting
evidence.

**The register is empty of substantive entries.** Every load-bearing claim in `d958917` reproduced on
live. The two entries below are recorded for completeness and neither affects the verdict:

1. **Task brief — "live https://forgotten-mistory.web.app/ served build-commit `37cbb52c` at
   12:53:10Z".** It did; by the time I read the meta at 12:54:15Z it served `7d467770`. **Not a false
   claim** — a ten-minute metronome moving under the task, and the intervening commit is docs-only
   (§0). Recorded so every number above is attributable to a commit.

2. **Phase 2's carried-forward figure — "the commit message claims 7.97:1 (1440) and 8.66:1 (390)".**
   My dominant-ground figures are 7.99–8.13 (1440) and 8.66–8.71 (390); worst-pixel 7.84 and 8.66.
   The 390 figure reproduces exactly; the 1440 figure is 0.02 low against my dominant sample. Cosmetic,
   in the claimant's own disfavour, well clear of AA either way.

**Claims I verified rather than accepted:** the `38 public repositories` count (GitHub API → 38) and
the `aether-job-career-agent` repository (HTTP 200). Both hold today. Neither was checked by phase 2.

**What I did not measure (declared, not inferred):**
- **Frame rate / motion smoothness.** SwiftShader on a loaded shared host cannot produce a trustworthy
  number. Unchanged position from phases 1 and 2.
- **The Compass numeral sub-AA contrast.** Pre-existing, re-measured in full by phase 2, and
  `Compass.tsx` / `Compass.module.css` are untouched by `d958917`. Not re-run; not claimed either way.
- **G-M1 / G-M2**, being probed by a sibling — deliberately not duplicated.

---

## 8. One-line status on the other P0 gaps

Observation-only. No remediation was claimed for any of these in the commit under test, and I did not
go looking beyond what the G-A1 probe already had in hand.

| Gap | Status on live `7d467770` |
|---|---|
| **G-H1** — hero reinvention (≤1 headline / ≤1 sentence / ≤1 CTA, dominant full-bleed visual; ledger and availability off the first fold) | **No remediation observed.** Nothing in `d958917`…`7d467770` touches `Hero.*` or `hero.ts`; not independently re-probed this phase. |
| **G-H2** — atmosphere as the product (reduce stage scrim, mount GL without idle deferral blanking first paint) | **No remediation observed**, but one datum in its favour: under `?gl=force` the hero canvas **is** mounted at the first fold at both widths with 0 pageerrors (§6.1), so the deferral does not blank first paint in the forced path. Scrim density not measured. |
| **G-H3** — purge non-B/W/gold chrome (body blue-steel washes; stop shipping Tailwind red/orange utilities) | **Unremediated, with fresh evidence.** The live stylesheet `/_next/static/css/de33c3ebedb3aae9.css` still ships **4 distinct red/orange utility selectors** — `.bg-red-500`, `.border-red-500`, `.text-red-500`, `.border-orange-400` (8 occurrences). The body wash also still composites: my 1440 ground samples are `rgb(20,21,24)` / `rgb(22,23,26)` — a blue-leaning channel spread of 3–4 on what should be neutral near-black. (Neither harms G-A1: contrast was measured against these real pixels.) |
| **G-S1** — real R3F/GLSL flagship in `#skills` | **Unremediated.** `#skills` contains **zero canvases** in every one of the six contexts I sampled, including both `?gl=force` passes at both widths. |
| **G-M1 / G-M2** — MiniVic send path and greeting asset | **Not probed — being handled by a sibling reviewer.** Deliberately not duplicated. |

---

## 9. Bottom line

`d958917` does what it says. The five gold lines each name a record — two of which I opened and
checked live today — the five demoted lines keep their text and lost only the claim, every
`side==='role'` dimension is grey beneath its own open caliper, the page-wide gold census is down from
11 to exactly 7, and every line clears AA against the pixels it actually sits on at both widths with
zero page errors. Phase 2's FAIL is **cleared**, and its one declared-unmeasured question is settled
as intended behaviour rather than a regression.

**G-A1: PASS · no regression · `goal_complete = true`.**
