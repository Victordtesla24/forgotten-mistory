# Observed baseline — https://forgotten-mistory.web.app/ — captured 2026-09-04 by the v7 orchestrator

This file is **ground truth for every auditor**. It was measured, not inferred. Do not contradict
it without producing a fresh measurement of your own.

## Where things are

- **Live URL** `https://forgotten-mistory.web.app/` — HTTP 200, 113,570 bytes of HTML, TTFB ~0.75 s.
- **Authoritative working copy** — the VPS, not this laptop. `ssh hos-vps` → `/root/forgotten-mistory`,
  branch `main`, root privileges. The local `/Users/vic/claude/forgotten-mistory` checkout is
  **stale** (it predates the whole v6 run) — never audit against it.
- **Live HTML snapshot** `/Users/vic/claude/forgotten-mistory/.audit-v7/live-2026-09-04.html`
- **Evidence corpus from the v6 run** `ssh hos-vps 'ls /root/forgotten-mistory/docs/delivery/evidence/v6-20260903T195241Z/'`
  — contains `AUDIT-RECONCILIATION.md`, `DEPLOYMENT-LOG.md`, `wave4-08-adversarial-review.md`,
  `T37-baseline-inventory.md`, `T38-consistency-register.md`, `T40-self-claim-register.md`,
  `FALSE-POSITIVE-REGISTER.md`, and the SPEC-* files. **Read the ones relevant to your dimension.**
- **v6 master prompt** `/Users/vic/Downloads/forgotten-mistory-master-execution-prompt-v6-site-audit.md`
  (identical content also at `/root/.claude/rebuilding-my-website-prompt.md` on the VPS).

## DOM structure as it actually stands

Six sections, in the mandated order, no seventh:

| id | scrollTop @1440 | height | notes |
|---|---|---|---|
| `hero` | 0 | 1234 | 1 `<canvas>` (WebGL atmosphere) |
| `about` | 1234 | 2502 | SVG "Compass" + 10 stacked prose dimensions |
| `experience` | 3736 | 3109 | duration-true bar chart (canvas, lazy) + 8 role entries |
| `skills` | 6845 | 3185 | bipartite gold link diagram + calibration table |
| `vitrine` | 10030 | 1472 | horizontal 6-plate carousel + "Excluded, and why" |
| `listen` | 11503 | 1086 | static prose + contact list + legal footer |

Document height 12,741 px at 1440×900; 15,975 px at 390×844.
9 `<svg>`, 1 `<canvas>` mounted at rest (hero); experience canvas mounts on scroll.
`prefers-reduced-motion` was **no-preference** for every measurement above.

## Measured defects — verified by the orchestrator, not inherited

### D-1 · Production console is not silent
`THREE.WebGLRenderer: Context Lost.` logged **2×** on a clean cache-bypassed load at 1440×900.
Breaks R-35 (zero warnings) **and** contradicts the site's own vitrine plate 06 copy — "one WebGL
context per section" — and R-170's preserved posture, which the Preservation Register says is
"no context loss". This is simultaneously a runtime defect and a T-40 self-claim contradiction.

### D-2 · Experience — the chart caption collides with the chart
The sentence "Three roles state a figure in the CV. The other five state none, and none was
invented for them — those carry an open bracket instead." renders **on top of** the lower band of
the chart plot, overlapping the axis region. The chart's container also paints a visible lighter
rectangle whose left edge (≈430 px) does not align with the content column (448 px), and the
`2010 / 2015 / 2020 / 2025 / now` axis labels sit **outside and below** that rectangle. Three
separate alignment failures in one artefact (R-48 8-point grid, R-103 optical alignment, R-98).

### D-3 · Experience — the ANZ bar is not the emphasised mark
Every bar is the same grey weight. R-110 reserves gold "for the single most important mark per
view"; the section's own copy says ANZ "is the reason the rest of this reads the way it does", and
R-174 makes ANZ the consequential role. Nothing in the encoding says so.

### D-4 · Skills — gold has become the theme, not the accent
The bipartite diagram renders roughly 18 of 20 links in gold. R-21 permits gold "sparingly,
deliberately, never a fill or a theme" and R-110 permits **one** gold mark per view. The current
semantic ("gold where the evidence was taken in production") is defensible in principle and
indefensible at that density. Needs deliberate adjudication, not a silent recolour.

### D-5 · Skills — the artefact is not the mandated class
R-187 mandates a **force-directed skill topology encoding proficiency, recency and adjacency**.
What ships is a static bipartite link chart: no force simulation, no recency channel, no adjacency
channel. The calibration semantics from R-166 survive (good), but the assigned visualisation class
from R-96 does not.

### D-6 · About — the Compass reads as a watermark, not an instrument
The ten-axis compass renders at very low luminance against near-black; its ticks and its `01…10`
labels are at or below the legibility floor at 1440. Commit `89eb90a` claimed "an instrument, not a
watermark"; measured, it is still closer to the watermark. The ten dimensions themselves render as
**ten stacked prose blocks** — R-188 requires "each dimension opening into its supporting evidence,
cross-linked to the Experience entry, repository or channel item that proves it". The evidence
strings are present as text, and none of them is a link.

### D-7 · Vitrine — five of six plates are illegible at rest
Non-focused carousel plates render at heavily reduced opacity; body copy on plates 01, 02, 04 and
05 falls well below WCAG 2.1 AA contrast while visible on screen. R-17 also asks each card to
"one-up the last" — the plates are uniform. A raw browser horizontal scrollbar is exposed at the
foot of the rail (R-49, R-90). The bespoke diagrams inside each plate are drawn in hairlines so
faint they read as noise at 100% zoom.

### D-8 · Listen — the closing section is the weakest screen on the site
R-60 requires the ending to be the **second-strongest moment**; R-96 assigns it "a participatory
interactive". What ships is a pull-quote, four lines of monospace contact text and a legal strip.
There is **no participatory element of any kind**, no feedback affordance, no form, no interaction.
The right ~45% of the composition is empty.

### D-9 · Footer — R-181's prohibited string has been re-introduced
The footer reads "… · All rights reserved." R-181 names *"All rights reserved"* as exactly the
boilerplate R-82 prohibits and requires an authored statement carrying "the honest build and deploy
signal that R-54 assigns to delivery excellence". The build stamp that shipped in deploy #2/#11
(`544c4f9`, `b638c66`) is **no longer on the page** — commit `9a99215` replaced the closing block
with the legal line and took the stamp with it. That is a regression under R-171 and R-43.

### D-10 · Hero — no signature moment, and half the canvas is void
The WebGL atmosphere reads as a faint diagonal smudge; nothing in it is identifiably an artefact,
so R-12 ("epic and sensational… technically like no other"), R-45 (one signature moment per
section) and R-96 ("WebGL signature scene from real repository, skill and delivery topology") are
all unmet. The composition is left-aligned in a full-bleed canvas and the right ~40% of the first
viewport carries nothing. There is no scroll cue. Zero gold anywhere in the first viewport.

### D-11 · `Download CV` still appears three times before any artefact
Header (`Download CV` pill) + hero secondary button + nav-overlay entry = 3 affordances, 2 of them
above the fold at 1440. R-179 requires one primary path per section and forbids the triple stack in
the first viewport. Mobile drops the header pill, so the desktop composition is the offender.

### D-12 · MiniVic is a floating bubble in grey
A circular launcher is pinned bottom-right on every section. R-75 forbids "a floating widget pasted
over the design"; R-135 forbids "floating bubbles… no primary real estate at rest"; R-70 specifies
a "gold-accent affordance". It is currently all three things wrong at once.

### D-13 · The chatbot answers, but does not answer from the corpus
`POST /api/chat` with `{"messages":[{"role":"user","content":"What did Vikram do at ANZ?"}]}` →
HTTP 200, body:

> "Vikram spent eight years at ANZ Banking Group. For specific details about his role and
> responsibilities during that time, I recommend checking the 'Experience' section of this website
> or contacting him directly at sarkar.vikram@gmail.com."

The page itself carries four sourced ANZ outcomes (10k+ devices at P95<200 ms, >30% delivery
efficiency, >15% infra cost, $5M+ portfolio / 5+ squads / 40+ practitioners). The endpoint declines
to use any of them. R-66 (answer from the retrieval index) and R-69 (deep-link to the proving
artefact) are unmet. There is no streaming: `GET /api/chat/stream` → **404**, so R-71's
"perceived first token under one second" cannot hold. The wrong-shaped payload
(`{"message": …}`) returns `{"error":"messages_required"}` — an unauthored error string (R-81).

### D-14 · Confirmed still absent
`/api/realtime/session` → **404**. No explainer avatar. **No YouTube / creator strand anywhere in
the DOM** — the vitrine is repositories only, so R-113…R-122, R-116 (dual-strand hero) and R-117
(content-DNA) are wholly unbuilt. The channel is real: `@vicd0ct`, channel id
`UCJSYpoFkGKKzYTKzAr8vGzQ`, 10 public videos, 2025-11-19 → 2026-04-16, subjects = Vedic/Sanskrit
astronomy algorithms (9) and a macOS telemetry HUD (1); 4 of 10 in Marathi.

### D-15 · The site still says its metrics are not live
Vitrine stamp: "38 public repositories · metrics harvested 2026-09-03 from the GitHub API, not
live". `scripts/build/harvest_repos.mjs` is run by hand and appears in no build script and no CI.
R-182 requires a deploy-time refresh. Currently the sentence is *true*, which is the only reason
this is not also a T-40 failure — and it must stay true through whatever replaces it.

### D-16 · Flagship CI is still red
`aether-job-career-agent` — the first repository a technical reviewer opens — is red on `main`,
and the vitrine says so. R-184 requires it repaired, then the limits line rewritten.
Reproducible causes recorded in `R184-flagship-ci-diagnosis.md` on the VPS.

## What the v6 run genuinely delivered — treat as PASSED unless you can falsify it

Do not re-litigate these. Verify-only, and protect them under the Preservation Register.

- Six sections in the mandated order; **no** standalone `#architecture-lab`; no orphan nav entry.
- One sourced years figure — "Sixteen" — in hero, About 02 and the Experience heading.
  `grep -i ifteen` over the deployed HTML returns 0.
- The dimensions citation resolves to `Victordtesla24/aether-job-career-agent`
  `apps/api/app/routers/jobs.py`.
- Counters never animate from zero: first-frame value == settled value == JS-disabled value.
  R-175 / SC-90.1 satisfied by construction.
- Nav labels carry the mandated section titles; "Work" / "Contact" / "Architecture" are gone.
- The self-presentation avatar clip and 4,078,491 bytes of its assets are removed;
  `/assets/avatar/introduction.mp4` → 404 in production.
- The terminal easter egg never existed in this codebase; only dead CSS did, and it was deleted.
- Skip link renders and is the first Tab stop; `<main id="main">` exists.
- Evidence-provenance labelling intact: "(Self-reported figure.)", "(Not measurable; reason
  given.)", "the CV states none for this role, and none was invented".
- Skills calibration semantics intact: three states, evidence column, where column, the refusal of
  proficiency bars, the −38%-against-a-simulated-budget footnote, and the CV calibration line with
  MD5 `16b856c0` / 157,615 bytes.
- Vitrine honesty instruments intact: a *Limits* line on every plate and the *Excluded, and why*
  list with a reason per exclusion.
- Duration-true experience timeline intact — every bar drawn to real duration on one axis.
- Zero third-party requests; zero third-party hosts; no tracker.
- Standing production measurement after ship 4: **LCP 412 ms, CLS 0** at 390×844.

## Known-open items the v6 run itself recorded as failing

From `wave4-08-adversarial-review.md` — **VERDICT: FAIL**, no commit made:

- **F-1** the R-183 telemetry rewrite broke the vitrine rail (`TC-VIT-09`, `VIS-05`): plate 06's
  new description wraps to four lines where every other plate wraps to two, pushing its metrics row
  49 px out of line.
- **F-2** the chatbot's grounding validator cannot see a **one-word** organisation — its entity
  regex requires two consecutive capitalised tokens — so injected "Vercel", "Sequoia", "Snowflake",
  "Optus", "Google", "Cambridge" passed the guard and were asserted **in the owner's first person**,
  3 runs of 3, on both the buffered and streaming transports. This is why `/api/chat` was
  subsequently narrowed (`7e1e3f1`, "close an ungrounded, publicly callable LLM endpoint") — the
  narrowing is a containment, not a fix, and D-13 is its cost.
- `forgotten-mistory`'s **own** CI is red on `main`: Playwright a11y specs hit
  `ERR_CONNECTION_REFUSED at localhost:8080`, the Firebase deploy job exits 127 on an IAM 403, and
  `npm audit` gates on high-severity advisories.
- 5 of the 9 mandated open-source layers in R-84 are **absent**: GSAP + ScrollTrigger, Lenis,
  three.js `postprocessing`, D3, and an installed Lighthouse CI runner.
- The caliper's third state, `sourced` ("Measured; source given."), is defined at `Caliper.tsx:44`
  and rendered by nothing — the mark's three-state grammar is two-thirds legible.
  **It must not be fixed by inventing a sourced mark.**

## Measurement discipline every auditor must honour

Headless Chrome reports `prefers-reduced-motion: reduce` by default and this VPS has no GPU, so a
naive capture records "0 canvases" and calls the WebGL scenes broken. They are not — the site
deliberately renders nothing under reduced motion or software rasterisation. **State your
`prefers-reduced-motion` and GPU condition alongside every visual finding**, or your finding is
inadmissible. This is FP-01 in the run's own false-positive register and it will recur.
