# Finding — the caliper's `sourced` state is defined but never rendered

**Run:** `v6-20260903T195241Z` · **Item:** wave 2 — the gold rule and the WCAG failures
**Status:** RECORDED, NOT RESOLVED. Deliberately left open for the Skills swarm to
resolve against real data.
**Raised by:** the Test Author for this item, while reproducing the design-system lock's
colour findings.
**Requirements touched:** R-21 (gold is a claim), R-110 (one mark per view), the
Preservation Register's *metric provenance label* invariant (R-165), `CLAUDE.md` prime
directive 3 ("never grade a claim higher than its evidence").

---

## The finding

`components/marks/Caliper.tsx` defines three states, and the mark is the one device this
site asks a reader to learn:

```
components/marks/Caliper.tsx:43-47
      sourced: 'Measured; source given.',
      'self-reported': 'Self-reported figure.',
      open: 'Not measurable; reason given.',
```

`sourced` is declared at line 44. **Nothing on the site renders it.** Two states carry the
whole page.

## Evidence

**1 — Source tree.** No call site passes the state at all:

```
$ grep -rn 'state="sourced"' --include=*.tsx app components | wc -l
0
```

Every `Caliper` call site in the tree, complete:

| File:line | State passed |
|---|---|
| `components/sections/Hero/Hero.tsx:68` | `self-reported` |
| `components/sections/About/About.tsx:107` | `open` |
| `components/sections/Experience/Experience.tsx:176` | `self-reported` |
| `components/sections/Experience/Experience.tsx:186` | `open` |
| `components/sections/Skills/Skills.tsx:114` | `open` |
| `components/sections/Vitrine/Vitrine.tsx:149` | `open` |

**2 — Built static export** (`npm run build:static`, HEAD `d1fce27`, this run):

```
$ grep -o 'data-state="sourced"'       out/index.html | wc -l   →  0
$ grep -o 'data-state="self-reported"' out/index.html | wc -l   →  6
$ grep -o 'data-state="open"'          out/index.html | wc -l   →  9
$ grep -o 'Measured; source given.'    out/index.html | wc -l   →  0
$ grep -o 'Self-reported figure.'      out/index.html | wc -l   →  6
$ grep -o 'Not measurable; reason given.' out/index.html | wc -l → 5
```

**3 — Production baseline**, captured independently from
<https://forgotten-mistory.web.app/> on 2026-09-03T20:03:42Z and recorded at
`docs/delivery/evidence/v6-20260903T195241Z/T37-baseline-inventory.json`
(`1_metrics_with_provenance`):

- `caliper_states_observed_on_the_live_site` = `["open", "self-reported"]`
- `count_desktop` = 15, `count_mobile` = 15, `desktop_mobile_parity` = `true`
- distribution across the 15 desktop marks: `experience/open` ×5, `experience/self-reported` ×3,
  `hero/self-reported` ×3, `about/open` ×3, `skills/open` ×1
- `gloss_string_not_observed_on_this_baseline` already names it:
  *"Measured; source given. — the 'sourced' caliper state is defined in the component but
  no element on the live page currently renders it"*

Three independent observations — the source tree, the export built in this run, and the
production capture — agree. The state is dead on the page and alive in the component.

## Why this is not fixed here, and must not be fixed by inventing a mark

The obvious "fix" is to promote a figure to `sourced` so the third state appears. **That is
the one thing this site must never do.** `app/globals.css:16-32` and `CLAUDE.md` prime
directive 3 both state the rule: gold, and the closed caliper, mean *this figure has a
source a reader can go and check*. Grading a claim higher than its evidence to make a
design system look complete would be exactly the failure the instrument exists to prevent,
and `tests/content/content-check.spec.ts` CT-10 already fails the build if the hero's three
figures are re-marked `sourced` — an earlier pass did precisely that and was caught.

So the state stays unrendered until a figure genuinely earns it.

## What resolution would require (for the Skills swarm)

A `sourced` mark is legitimate only where **all** of these hold:

1. The figure was measured, not recalled — an instrument, a log, a run, a repository.
2. The measurement's source is printed beside the figure, in the page copy, as a thing a
   reader can open: a file path, a repository URL, a dated capture.
3. The source is reachable by that reader without privileged access.

The nearest existing candidates, and why none of them qualifies *as currently written*:

| Candidate | Where | Why it is not `sourced` today |
|---|---|---|
| Skills rows at `data-status="production"` | `components/sections/Skills/Skills.module.css:271` | The gold status glyph asserts "measured in production", but the row prints no reachable source for the measurement — the claim and its evidence are not joined on the page. |
| The three live repository URLs | `app/data/portfolio/vitrine.ts` (3 of 6 plates) | These *are* checkable deployments, but they are links, not figures — there is no measured number for a caliper to close on. |
| The repository metrics on each plate | `components/sections/Vitrine/Vitrine.tsx:141-157` | Harvested from the GitHub API at a stated date (`.stamp`), which is a real provenance — but the plate labels it as a dated harvest, not as a live measurement, and the caliper beside it is deliberately `open` ("not harvested"). |

**Recommendation to the Skills swarm:** do not add a `sourced` mark unless requirement 2
can be satisfied with a real, printed, reachable source. If no figure on this site can
satisfy it, the honest resolutions are, in order of preference:

1. Find or produce one real measurement with a printed source and mark it `sourced`.
2. Leave the state defined and unused, and say so where a reader can see it — the legend
   in `components/sections/Skills/Skills.tsx:114` already teaches the mark, and can teach
   all three states without claiming any figure holds the third.

Deleting the `sourced` branch from `Caliper.tsx` is **not** recommended: it would remove
the vocabulary that makes `self-reported` and `open` mean something, and it would delete
the very distinction the Preservation Register protects.

## Reproduction commands

```bash
cd /root/forgotten-mistory
grep -rn 'state="sourced"' --include=*.tsx app components   # → no matches
npm run build:static
grep -c 'data-state="sourced"' out/index.html               # → 0
python3 - <<'PY'
import json
d = json.load(open('docs/delivery/evidence/v6-20260903T195241Z/T37-baseline-inventory.json'))
print(d['1_metrics_with_provenance']['caliper_states_observed_on_the_live_site'])
PY
```

## Claim tagging

- The `sourced` state is defined at `components/marks/Caliper.tsx:44` — **Verified** (file read this run).
- No call site renders it — **Verified** (grep over `app/**` + `components/**`, this run).
- The built export contains zero `sourced` marks and 15 marks in the other two states —
  **Verified** (`out/index.html`, built this run).
- Production carried the same 15 marks in the same two states on 2026-09-03 — **Verified**
  against `T37-baseline-inventory.json`, which was captured in this run by another agent;
  independently corroborated here by the export built from the same commit.
- That no figure on the site can currently satisfy the three `sourced` requirements —
  **Inferred** from reading every call site and its data file; the Skills swarm holds the
  data that could overturn it.
