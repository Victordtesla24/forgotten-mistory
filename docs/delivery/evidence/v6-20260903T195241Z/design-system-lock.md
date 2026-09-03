# Design System Lock — v6

**Repo:** `/root/forgotten-mistory` · **HEAD:** `d1fce27` (2026-09-03T17:53:38Z) ·
**Baseline audit:** `node scripts/validate/overhaul_static_audit.mjs` → **10/10 PASS** (run 2026-09-03).

**Requirements covered:** R-20, R-21, R-46, R-47, R-48, R-49, R-103, R-110 · SC-27.1, SC-29.1, SC-30.1 ·
execution step 10 · T-5, T-15.

**Method.** Every verdict below is reconciled against what the repository already ships. Nothing here
invents a parallel system: where the baseline is right it is *locked* (PRESENT), where it is right but
incomplete it is *extended* (EXTEND), where the requirement has no implementation at all it is *specified*
(MISSING). Contrast ratios are computed (WCAG 2.1 relative-luminance formula) from the literal token values
in `app/globals.css`, including alpha compositing over the actual ground each mark sits on. Spacing figures
come from a mechanical scan of all eleven section/mark CSS modules.

**Verdict roll-up**

| # | Item | Verdict |
|---|------|---------|
| 1 | Colour — monochrome ramp + one gold accent | **PRESENT**, with 3 EXTEND items and 1 defect |
| 2 | Type — face count ruling, modular scale, measure | **EXTEND** (faces PRESENT; scale MISSING) |
| 3 | Spatial — 8-point grid | **EXTEND** (rhythm PRESENT; 107 non-conforming declarations) |
| 4 | Motion — durations, easing, choreography | **EXTEND** (tokens PRESENT; reduced-motion choreography MISSING) |
| 5 | Interaction states — full designed library | **EXTEND** (hover/focus PRESENT; active/disabled/loading/empty MISSING) |

---

## 1 · Colour

### 1.1 The ramp — locked, ALREADY SHIPPED

Nine achromatic values and one hue, defined once. Ratios are against `--ink-900` `#0A0B0D`, the page ground
(`app/globals.css:151`, `app/globals.css:159`).

| Token | Value | Role | vs `--ink-900` | WCAG 2.1 |
|-------|-------|------|----------------|----------|
| `--ink-900` | `#0A0B0D` | page ground | — | `app/globals.css:6` |
| `--ink-800` | `#121317` | raised surface | — | `app/globals.css:7` |
| `--ink-700` | `#1B1D23` | card / panel | — | `app/globals.css:8` |
| `--ink-500` | `#3A3D46` | hairline / border | — | `app/globals.css:9` |
| `--ink-400` | `#8F93A3` | — | 6.44:1 | `app/globals.css:56` |
| `--ink-300` | `#6E7178` | tertiary label | **4.03:1** | `app/globals.css:57` |
| `--mist-400` | `#8A8F9A` | secondary text | 6.07:1 · AA | `app/globals.css:10` |
| `--mist-200` | `#C9CDD6` | body text | 12.36:1 · AAA | `app/globals.css:11` |
| `--mist-100` | `#D6D8E2` | — | 13.86:1 · AAA | `app/globals.css:55` |
| `--white` | `#F4F6FA` | primary text | 18.20:1 · AAA | `app/globals.css:12` |
| `--accent` | `#E8EBF0` | luminous highlight | 16.48:1 · AAA | `app/globals.css:13` |
| `--steel` | `#AEB6C2` | glow tint (never a fill) | 9.63:1 · AAA | `app/globals.css:14` |

**Verdict: PRESENT.** The ramp is complete, single-sourced, and mirrored in `design-tokens.json:29-43` and
`lib/palette.ts:8-33`. It is achromatic by construction: `--steel` is the most saturated value at
(194−174)/194 = **0.103**, comfortably under the audit's `SAT_MAX = 0.28`
(`scripts/validate/overhaul_static_audit.mjs:109-113`).

**One defect to fix: `--ink-300` at 4.03:1 is below AA for body text.** It is used as `.statusLabel` colour at
`components/sections/Skills/Skills.module.css:279` — 0.7rem mono, i.e. *small* text, which needs 4.5:1.
**Lock:** `--ink-300` is a **non-text token only** (rules, dividers, disabled chrome ≥3:1). Any label currently
using it moves to `--mist-400` (6.07:1). SC-30.1's disabled state (§5) is the one sanctioned text use, and only
because disabled text is exempt from 1.4.3.

### 1.2 Gold — the one hue, and what it means

`--gold: #c9a84c` and its four derivatives are declared once, at `app/globals.css:33-39`, with the meaning
written into the file at `app/globals.css:16-32`: *gold appears only where a figure has a source a reader could
go and check.* `lib/palette.ts:15-20` carries the same value and the same rule for WebGL. This is enforced —
`TC-NFR-MONO` (`scripts/validate/overhaul_static_audit.mjs:90-152`) permits the four gold hexes **only** in
`app/globals.css` and `lib/palette.ts` (`ACCENT_DEFINITION_FILES`, line 102) and fails any other file that
writes a chromatic hex, `rgb()` over 0.28 saturation, `hsl()` over 15% saturation, or a Tailwind colour
utility.

**Computed contrast — gold on the grounds actually used:**

| Foreground | on `--ink-900` `#0A0B0D` | on `--ink-800` `#121317` | on `--ink-700` `#1B1D23` | on `--card-bg` (white 3% over ink-900 → `#111214`) |
|---|---|---|---|---|
| `--gold` `#c9a84c` | **8.62:1** AAA | **8.12:1** AAA | **7.37:1** AAA | **8.20:1** AAA |
| `--gold-light` `#d4b65c` | **9.98:1** AAA | 9.41:1 AAA | 8.54:1 AAA | 9.50:1 AAA |
| `--gold-pale` `#e8d5a3` | **13.57:1** AAA | 12.80:1 AAA | 11.61:1 AAA | 12.92:1 AAA |
| `--gold-dark` `#b0923f` | **6.59:1** AA | 6.21:1 AA | 5.64:1 AA | 6.27:1 AA |

Gold on `--ink-500` `#3A3D46` is 4.75:1 — AA text, **not** AAA. `--gold-dark` on `--ink-500` is 3.63:1 —
non-text/large only. **Lock: gold text is only ever set on `--ink-900`/`--ink-800`/`--ink-700`/`--card-bg`.
Gold on `--ink-500` is prohibited for text under 24 px.**

**Alpha-composited gold, as it actually renders:**

| Use | Alpha | Composite | vs `#0A0B0D` | Requirement | Result |
|---|---|---|---|---|---|
| Caliper jaw, `sourced` (`components/marks/Caliper.module.css:75-80`) | 0.85 | `#ac9043` | **6.40:1** | non-text UI ≥3:1 | PASS |
| Bench production dot (`components/sections/Skills/Bench.module.css:219-222`) | 0.90 | — | **7.10:1** | non-text UI ≥3:1 | PASS |
| Listen closing rule (`components/sections/Listen/Listen.module.css:69-70`) | 0.55 | `#736130` | **3.26:1** | non-text UI ≥3:1 | PASS (marginal) |
| Vitrine live URL, **lit** plate (`components/sections/Vitrine/Vitrine.module.css:243`) | 1.0 | `#c9a84c` | **8.62:1** | text ≥4.5:1 | PASS |
| Vitrine live URL, **unlit** plate (`Vitrine.module.css:89` sets `opacity: 0.42`) | 0.42 | `#5e5333` | **2.37:1** | text ≥4.5:1 | **FAIL** |
| `--gold-veil` `rgb(201 168 76 / 0.13)` as border (`Vitrine.module.css:244`) | 0.13 | `#231f15` | **1.20:1** | decorative | never load-bearing |
| `--gold-border` `rgb(201 168 76 / 0.2)` (`app/globals.css:38`, used `app/globals.css:974`) | 0.20 | `#302a1a` | **1.38:1** | decorative | never load-bearing |

The unlit-plate failure is not gold-specific — the whole plate is at 0.42, so `--mist-200` there is 2.94:1 and
`--white` is 3.85:1. **Lock:** the raking-light dim is a *presentation* state; unlit plates must carry
`aria-hidden` semantics or the floor must be raised to `opacity: 0.62` (which puts `--mist-200` at 4.9:1 and
gold at 3.8:1 — still short for gold text). **Preferred fix: raise the unlit floor to 0.62 and set `.live` on
unlit plates to `--gold-pale`** (13.57:1 at full, 5.9:1 at 0.62).

### 1.3 The one-gold-mark-per-view rule (R-110)

Gold surfaces that exist today, complete list:

| # | File:line | Mark | Legitimate under the rule? |
|---|-----------|------|----------------------------|
| 1 | `components/marks/Caliper.module.css:77-78` | `sourced` caliper jaws | **Yes** — the canonical use |
| 2 | `components/sections/Skills/Skills.module.css:271` | `tr[data-status="production"] .statusGlyph` | **Yes** — "measured in production" |
| 3 | `components/sections/Skills/Skills.module.css:109` | legend glyph for that same mark | **Yes** — a key must be drawn as the thing it explains |
| 4 | `components/sections/Skills/Skills.module.css:373` | `inset 2px 0 0` on the traced row | **Yes** — points at a sourced row |
| 5 | `components/sections/Skills/Bench.module.css:220` | production status dot | **Yes** — same claim, bench side |
| 6 | `components/sections/Skills/Bench.tsx:297-300` | lit wire gradient | **Yes** — traces source→capability |
| 7 | `components/sections/Vitrine/Vitrine.module.css:243,248` | `.live` repository URL | **Yes**, but ×3 in one rail (see below) |
| 8 | `components/sections/Listen/Listen.module.css:69` | closing hairline rule | **Borderline** — decorative, not a figure with a source |
| 9 | `components/MiniVicBot.tsx:1244` | `background: isSpeaking ? var(--gold-light) : var(--gold)` on a "MiniVic Live" status dot | **NO — this is gold as status decoration** |

**Defect (#9).** `components/MiniVicBot.tsx:1244` spends gold on a liveness indicator. That is precisely the
failure mode `app/globals.css:26-28` warns about ("the moment it becomes an accent for things that merely look
important, it stops being evidence and becomes brass"). It passes `TC-NFR-MONO` only because it references the
token rather than the hex — the gate checks *definition discipline*, not *semantic discipline*.
**Lock: that dot becomes `--mist-200` (speaking) / `--ink-500` (idle). Gold is removed from `MiniVicBot.tsx`.**

**Item #7, per-view budget.** `app/data/portfolio/vitrine.ts:49,59,96` define three `live` URLs across six
plates, all in one horizontal rail — up to three gold marks in one viewport.
**Lock:** the *lit* plate keeps `--gold`; unlit plates render `.live` in `--gold-pale` at the raised dim floor.
One saturated gold mark per view, the rest present but recessive. This satisfies R-110's "single most important
mark per view" without deleting evidence.

**Item #8.** The Listen rule is described in-file as "the caliper bracket at one pixel". Keep it — it is the
closing instance of the site's one mark — but it is the *only* sanctioned non-figure gold, and it is alone in
its view (`Listen.module.css` has no other gold).

### 1.4 Locked colour rules

1. Every colour in `app/**` and `components/**` is a `var(--token)`. Raw hex lives only in `app/globals.css`
   and `lib/palette.ts` — enforced, `overhaul_static_audit.mjs:100-137`.
2. Gold is never a `background` of an area, never a `fill` of a shape larger than 0.5rem, never a theme,
   never a hover-only flourish. Permitted geometries: a 1px rule, a ≤0.5rem dot, a ≤2px inset rule, a glyph,
   an inline link, a caliper jaw.
3. **One saturated gold mark per view.** Additional sourced marks in the same view step down to `--gold-pale`
   or recede with their container.
4. Gold text only on `--ink-900` / `--ink-800` / `--ink-700` / `--card-bg`. Never on `--ink-500`.
5. Gold never carries meaning alone: every gold mark is paired with a text label (`.statusLabel`,
   `Caliper`'s visually-hidden gloss at `components/marks/Caliper.module.css:149-159`, the live URL's own text).
   This is why the system survives 1.4.1 Use of Colour.
6. `--ink-300` is non-text.

---

## 2 · Type

### 2.1 The three-faces ruling (R-47 vs TC-NFR-TYPE) — resolved under P-3

**The tension.** R-47 demands "one display face, one text face". The shipped site loads three families —
Source Serif 4 (`app/layout.tsx:24-31`), Inter (`app/layout.tsx:45-51`), IBM Plex Mono
(`app/layout.tsx:55-61`) — and `TC-NFR-TYPE` explicitly sanctions three
(`scripts/validate/overhaul_static_audit.mjs:205-241`, gate title: *"Three font families — Source Serif 4
(display) + Inter (body) + IBM Plex Mono (data)"*).

**Ruling: three faces stand. Two *voices*, one *instrument*.**

**Rationale (P-3 — apply both, resolve toward the higher bar, never by lowering an inherited standard).**
R-47's constraint is about **voice discipline**: a page must not speak in three competing personalities.
IBM Plex Mono on this site is not a third voice — it is a **measuring instrument**. It never sets a heading,
never sets a sentence a reader reads at length, and never carries emphasis. Its 40 occurrences across the
section modules are, without exception, provenance and data: source labels
(`components/sections/About/About.module.css:72,84`), axis readouts
(`components/sections/Experience/Experience.module.css:177,202`), tabular figures
(`components/sections/Skills/Bench.module.css:204` sets `font-variant-numeric: tabular-nums` on a mono run),
status labels (`components/sections/Skills/Skills.module.css:275`), repository URLs
(`components/sections/Vitrine/Vitrine.module.css:177`). Dropping it would force provenance data into Inter,
where a 12-digit hash and a date column stop aligning and the evidence stops *looking* like evidence — that is
**lowering** the standard R-47 exists to protect, which P-3 forbids. Conversely, collapsing display and body
into one face would also violate R-47. So: **Source Serif 4 = the display voice. Inter = the text voice. IBM
Plex Mono = the data instrument, categorically not a voice.** Both requirements are satisfied at the higher bar.

**The instrument's charter (binding):** mono is permitted only on — source attributions, dates and durations,
numeric readouts and axis labels, status/state labels, hashes and identifiers, repository and live URLs,
eyebrow/kicker labels that name a measurement. Mono is prohibited on — any heading level, any sentence over
~12 words, any button label, any body paragraph, any emphasis.

**Verdict: ALREADY SHIPPED.** Faces, weights and loading strategy are all correct:
Source Serif 4 at **400 only** (`app/layout.tsx:26`) — the comment at `app/layout.tsx:20-23` records that the
300 was removed as 47 kB of dead preload; the italic is a separate non-preloaded face used exactly once
(`app/layout.tsx:36-43`, consumed at `components/sections/Listen/Listen.module.css:52`); Inter at 400/500/600
(`app/layout.tsx:47`); Plex Mono at 400/500, not preloaded (`app/layout.tsx:57-60`). Synthetic bold is
eliminated site-wide by `app/globals.css:255-259` (`font-weight: 400` on `h1,h2,h3,.role`).

### 2.2 The modular scale — MISSING

**Finding.** There is no scale. A mechanical count across the eleven section/mark modules returns
**40 distinct `font-size` values, 19 distinct `line-height` values and 19 distinct `letter-spacing` values**,
including 13 uses of `0.68rem`, 9 of `0.74rem`, 8 of `0.72rem`, 7 of `0.66rem` and 5 of `0.62rem` — five
different "small label" sizes doing one job. Nine of the sizes appear exactly once. `design-tokens.json:22-27`
does define five type roles, but they specify **Inter Variable at weight 700/600** for display and h1 — a stack
the site no longer uses — so the token file is stale and nothing consumes it.

**What is right and must be kept.** Five of the six sections already share an identical header triple:
kicker `0.74rem` / title `clamp(2rem, 4.2vw, 3.4rem)` / lede `clamp(1rem, 1.25vw, 1.12rem)` —
`About.module.css:32,42,52` · `Experience.module.css:30,40,50` · `Skills.module.css:32,42,52` ·
`Vitrine.module.css:26,36,46` · `Listen.module.css:31,41`. That is the spine of the scale; the lock formalises
it rather than replacing it.

**Locked scale.** Ratio **1.20 (minor third)** at the small end, opening to **1.25** above `step-4`, anchored on
the shipped `1rem` body and the shipped `clamp(2rem, 4.2vw, 3.4rem)` section title. Declare in
`app/globals.css :root`; every module consumes the token, never a literal.

| Step | Token | Clamp | Optical tuning | Replaces (examples) |
|---|---|---|---|---|
| −3 | `--fs-micro` | `clamp(0.625rem, 0.20vw + 0.58rem, 0.6875rem)` | `letter-spacing: 0.08em`, `line-height: 1.5` | 0.60/0.62/0.66rem |
| −2 | `--fs-caption` | `clamp(0.6875rem, 0.22vw + 0.64rem, 0.75rem)` | `letter-spacing: 0.06em`, `line-height: 1.5` | 0.66/0.68/0.70/0.72rem |
| −1 | `--fs-small` | `clamp(0.8125rem, 0.25vw + 0.75rem, 0.875rem)` | `letter-spacing: 0.02em`, `line-height: 1.55` | 0.74/0.76/0.78/0.80/0.82rem |
| 0 | `--fs-body` | `clamp(0.9375rem, 0.30vw + 0.87rem, 1rem)` | `letter-spacing: 0`, `line-height: 1.68` | 0.85/0.88/0.92/0.95/0.98rem |
| 1 | `--fs-lede` | `clamp(1rem, 0.40vw + 0.90rem, 1.125rem)` | `letter-spacing: −0.005em`, `line-height: 1.68` | the shipped lede clamp |
| 2 | `--fs-h3` | `clamp(1.1875rem, 0.75vw + 1.0rem, 1.4375rem)` | `letter-spacing: −0.012em`, `line-height: 1.35` | 1.05rem, `clamp(1.05rem,…,1.4rem)` |
| 3 | `--fs-h2` | `clamp(1.4375rem, 1.4vw + 1.1rem, 1.875rem)` | `letter-spacing: −0.018em`, `line-height: 1.20` | `clamp(1.4rem,…,1.9rem)` |
| 4 | `--fs-title` | `clamp(2rem, 4.2vw, 3.4rem)` **(shipped, unchanged)** | `letter-spacing: −0.025em`, `line-height: 1.05` (both shipped, `Skills.module.css:44-45`) | `Skills.module.css:42` et al |
| 5 | `--fs-display` | `clamp(2.4rem, 5.6vw, 4rem)` — shipped, but only as the short-viewport `.name` inside `@media (max-height: 860px)` (`Hero.module.css:30,36-38`); promoted here to a full step | `letter-spacing: −0.03em`, `line-height: 0.94` | `Hero.module.css:37` |
| 6 | `--fs-name` | `clamp(3rem, 8.2vw, 7.5rem)` **(shipped)** | `letter-spacing: −0.035em` (shipped, `Hero.module.css:146`), `line-height: 0.94` (shipped, `:145`; `0.92` under `max-height: 860px`, `:45`) | `Hero.module.css:143` |

**Per-step optical tuning is part of the token, not a per-site-decision.** Tracking opens as size falls and
tightens as it rises (the negative tracking at display sizes is already the shipped instinct —
`app/globals.css:258`, `Skills.module.css:45`). Mono steps carry `+0.02em` over the sans value at the same step
because Plex Mono's sidebearings are tighter than Inter's; `font-variant-numeric: tabular-nums` is mandatory on
any mono step that renders a figure (already correct at `Hero.module.css:205`, `About.module.css:164`,
`Experience.module.css:329`, `Bench.module.css:204`, `Listen.module.css:244`).

Line-height is bound to the step, collapsing 19 values to 6: `1.05` (steps 4–6), `1.20` (step 3), `1.35`
(step 2), `1.68` (steps 0–1), `1.55` (step −1), `1.50` (steps −2/−3).

**Verdict: MISSING.** No token exists; `design-tokens.json:22-27` is stale and must be regenerated from the
above.

### 2.3 Measure — 55–75ch at every breakpoint

The site correctly uses the `ch` unit, which tracks the font-size clamp, so the measure is breakpoint-stable by
construction. Audited state:

| File:line | Measure | R-47 (55–75ch) |
|---|---|---|
| `components/sections/Experience/Experience.module.css:349` | `74ch` | PASS |
| `components/sections/Listen/Listen.module.css:195` | `62ch` | PASS |
| `components/sections/Experience/Experience.module.css:425` | `62ch` | PASS |
| `components/sections/About/About.module.css:203` | `60ch` | PASS |
| `components/sections/Skills/Bench.module.css:16` | `58ch` | PASS |
| `components/sections/Hero/Hero.module.css:225` | `58ch` | PASS |
| `components/sections/Skills/Skills.module.css:51` | `56ch` | PASS |
| `components/sections/Vitrine/Vitrine.module.css:45` | `56ch` | PASS |
| `components/sections/Experience/Experience.module.css:49` | `54ch` | **FAIL** (−1) |
| `components/sections/About/About.module.css:51` | `52ch` | **FAIL** |
| `components/sections/Listen/Avatar.module.css:167` | `52ch` | **FAIL** |
| `components/sections/Hero/Hero.module.css:160` | `46ch` | **FAIL** |
| `components/sections/Listen/Avatar.module.css:134` | `44ch` | **FAIL** |
| `components/sections/Listen/Listen.module.css:59,67` | `26ch` | **Exempt** — display sentence + rule, not running text |

**Lock.** Two classes of measure, both tokenised:
`--measure-read: 66ch` (clamped 58–72ch) for any element containing running prose — every FAIL above moves to
it; and `--measure-display: 26ch` for display-size single sentences (Listen's closing statement and its rule),
which are typographic objects, not paragraphs, and are explicitly exempted. Nothing between 27ch and 57ch is
permitted for prose.

**Verdict: EXTEND.** Technique correct, five values out of band, no token, no test.

### 2.4 Hierarchy with imagery disabled (R-47) — PRESENT
Verified by construction: every section's `h2` is a real heading at `--fs-title`, every figure carries a text
label beside its mark, and `Caliper`'s state is spoken via a visually-hidden gloss
(`components/marks/Caliper.module.css:149-159`, produced at `components/marks/Caliper.tsx:54`). No section
depends on an image to be scannable.

---

## 3 · Spatial system (R-48, SC-29.1)

### 3.1 What is shipped

- **Vertical rhythm, one across all six sections: PRESENT.** `section { padding: 10rem 0 }`
  (`app/globals.css:411`) — 160 px, on-grid — plus `--beat-pad: clamp(6rem, 12vh, 11rem)`
  (`app/globals.css:96`) and `--gutter: clamp(1.25rem, 5vw, 4rem)` (`app/globals.css:100`).
- **A spacing scale is declared: PARTIAL.** `design-tokens.json:10-21` names ten steps —
  but it is a **4-point** scale wearing an 8-point label (`"grid": "8pt"`, `design-tokens.json:6`), since it
  contains `0.25rem` (4 px) and `0.75rem` (12 px). Nothing in `app/globals.css` exposes these as CSS custom
  properties, so **no module can consume them**; every module writes literals.
- **Negative space as executive signal: PRESENT.** 10rem section padding, `.header { margin-bottom:
  clamp(2.5rem, 6vh, 3.5rem) }` (`Skills.module.css:27`), and the Listen section deliberately near-empty.

### 3.2 The audit — every spacing value that does not resolve to the 8-point scale

Scan: all `margin*`, `padding*`, `gap`, `row/column-gap`, `top/right/bottom/left`, `inset` declarations in the
eleven section + mark CSS modules; `rem` converted at 16 px; `em/%/vh/vw/ch` excluded (relative units, judged
separately). Result: **107 declarations carrying 113 non-conforming values — 35 land on a 4-point half-step,
72 land off the grid entirely, plus 3 hairline (1px/−1px) values exempted below.**

**Class A — off the grid entirely (72 values).** These resolve to neither an 8 px nor a 4 px step and must be
rewritten to the nearest scale token.

```
components/sections/About/About.module.css:40  margin: 0 0 clamp(1.5rem, 3vh, 2.2rem)   -> 2.2rem=35.2px [OFF-GRID]
components/sections/About/About.module.css:50  margin: 0 0 1.1rem   -> 1.1rem=17.6px [OFF-GRID]
components/sections/About/About.module.css:181  margin: 0 0 0.55rem   -> 0.55rem=8.8px [OFF-GRID]
components/sections/About/About.module.css:196  padding: 0.2rem 0.5rem   -> 0.2rem=3.2px [OFF-GRID]
components/sections/About/About.module.css:202  margin: 0 0 0.6rem   -> 0.6rem=9.6px [OFF-GRID]
components/sections/About/About.module.css:254  gap: 0.55rem   -> 0.55rem=8.8px [OFF-GRID]
components/sections/About/About.module.css:258  padding-top: 1.1rem   -> 1.1rem=17.6px [OFF-GRID]
components/sections/About/About.module.css:266  gap: 0.7rem   -> 0.7rem=11.2px [OFF-GRID]
components/sections/Experience/Experience.module.css:102  gap: 0.35rem   -> 0.35rem=5.6px [OFF-GRID]
components/sections/Experience/Experience.module.css:115  padding: 0.4rem 0   -> 0.4rem=6.4px [OFF-GRID]
components/sections/Experience/Experience.module.css:155  top: 0.35rem   -> 0.35rem=5.6px [OFF-GRID]
components/sections/Experience/Experience.module.css:168  top: 0.2rem   -> 0.2rem=3.2px [OFF-GRID]
components/sections/Experience/Experience.module.css:174  left: calc(100% + 0.6rem)   -> 0.6rem=9.6px [OFF-GRID]
components/sections/Experience/Experience.module.css:263  gap: 0.2rem   -> 0.2rem=3.2px [OFF-GRID]
components/sections/Experience/Experience.module.css:318  gap: 0.6rem   -> 0.6rem=9.6px [OFF-GRID]
components/sections/Experience/Experience.module.css:339  padding-top: 1.1rem   -> 1.1rem=17.6px [OFF-GRID]
components/sections/Experience/Experience.module.css:348  gap: 0.85rem   -> 0.85rem=13.6px [OFF-GRID]
components/sections/Experience/Experience.module.css:398  margin-top: 0.4rem   -> 0.4rem=6.4px [OFF-GRID]
components/sections/Hero/Hero.module.css:41  margin-bottom: 0.7rem   -> 0.7rem=11.2px [OFF-GRID]
components/sections/Hero/Hero.module.css:49  margin-top: 0.6rem   -> 0.6rem=9.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:54  margin-top: 0.85rem   -> 0.85rem=13.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:60  margin-top: 1.1rem   -> 1.1rem=17.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:64  padding-top: 0.7rem   -> 0.7rem=11.2px [OFF-GRID]
components/sections/Hero/Hero.module.css:72  margin-top: 0.85rem   -> 0.85rem=13.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:123  gap: 0.6rem   -> 0.6rem=9.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:151  margin: clamp(1rem, 2.4vh, 1.6rem) 0 0   -> 1.6rem=25.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:159  margin: clamp(1.4rem, 3vh, 2.2rem) 0 0   -> 1.4rem=22.4px [OFF-GRID], 2.2rem=35.2px [OFF-GRID]
components/sections/Hero/Hero.module.css:193  gap: 0.35rem   -> 0.35rem=5.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:237  gap: 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Hero/Hero.module.css:247  padding: 0 1.6rem   -> 1.6rem=25.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:293  gap: 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Hero/Hero.module.css:309  padding-bottom: 1px   -> 1px=1px [OFF-GRID]
components/sections/Hero/Hero.module.css:324  gap: 1.1rem   -> 1.1rem=17.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:346  gap: 0.85rem   -> 0.85rem=13.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:354  padding-top: 0.7rem   -> 0.7rem=11.2px [OFF-GRID]
components/sections/Hero/Hero.module.css:376  gap: 0.6rem   -> 0.6rem=9.6px [OFF-GRID]
components/sections/Hero/Hero.module.css:382  padding: 0 1.1rem   -> 1.1rem=17.6px [OFF-GRID]
components/sections/Listen/Avatar.module.css:106  padding: 0.5rem 0.7rem   -> 0.7rem=11.2px [OFF-GRID]
components/sections/Listen/Avatar.module.css:128  gap: 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Listen/Avatar.module.css:171  margin: 0 0 0.7rem   -> 0.7rem=11.2px [OFF-GRID]
components/sections/Listen/Avatar.module.css:179  gap: 0.35rem   -> 0.35rem=5.6px [OFF-GRID]
components/sections/Listen/Avatar.module.css:180  margin: 1.1rem 0 0   -> 1.1rem=17.6px [OFF-GRID]
components/sections/Listen/Avatar.module.css:181  padding-top: 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Listen/Listen.module.css:113  bottom: -3px   -> -3px=-3px [OFF-GRID]
components/sections/Listen/Listen.module.css:213  padding: 0.7rem 0   -> 0.7rem=11.2px [OFF-GRID]
components/sections/Listen/Listen.module.css:256  margin: 1.1rem 0 0   -> 1.1rem=17.6px [OFF-GRID]
components/sections/Listen/Listen.module.css:267  row-gap: 0.3rem   -> 0.3rem=4.8px [OFF-GRID]
components/sections/Skills/Bench.module.css:113  gap: 0.1rem   -> 0.1rem=1.6px [OFF-GRID]
components/sections/Skills/Bench.module.css:132  gap: 0.1rem   -> 0.1rem=1.6px [OFF-GRID]
components/sections/Skills/Bench.module.css:133  padding-bottom: 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Skills/Bench.module.css:137  padding-top: 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Skills/Bench.module.css:142  margin: 0 0 0.45rem   -> 0.45rem=7.2px [OFF-GRID]
components/sections/Skills/Bench.module.css:155  padding: 0.32rem 0   -> 0.32rem=5.12px [OFF-GRID]
components/sections/Skills/Bench.module.css:244  gap: 0.3rem   -> 0.3rem=4.8px [OFF-GRID]
components/sections/Skills/Bench.module.css:308  gap: 0.45rem   -> 0.45rem=7.2px [OFF-GRID]
components/sections/Skills/Bench.module.css:317  margin: 0.5rem 0 0.1rem   -> 0.1rem=1.6px [OFF-GRID]
components/sections/Skills/Bench.module.css:325  margin-top: 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Skills/Bench.module.css:331  padding: 0.34rem 0.6rem   -> 0.34rem=5.44px [OFF-GRID], 0.6rem=9.6px [OFF-GRID]
components/sections/Skills/Skills.module.css:122  gap: 0.4rem   -> 0.4rem=6.4px [OFF-GRID]
components/sections/Skills/Skills.module.css:127  padding: 0 0.9rem   -> 0.9rem=14.4px [OFF-GRID]
components/sections/Skills/Skills.module.css:187  padding: 0.6rem clamp(0.6rem, 1.4vw, 1rem)   -> 0.6rem=9.6px [OFF-GRID], 0.6rem=9.6px [OFF-GRID]
components/sections/Skills/Skills.module.css:213  padding: 0.85rem clamp(0.6rem, 1.4vw, 1rem)   -> 0.85rem=13.6px [OFF-GRID], 0.6rem=9.6px [OFF-GRID]
components/sections/Skills/Skills.module.css:237  margin-top: 0.35rem   -> 0.35rem=5.6px [OFF-GRID]
components/sections/Skills/Skills.module.css:290  padding: 1.1rem clamp(1rem, 2.5vw, 2rem)   -> 1.1rem=17.6px [OFF-GRID]
components/sections/Skills/Skills.module.css:344  padding: 0.2rem 0 !important   -> 0.2rem=3.2px [OFF-GRID]
components/sections/Skills/Skills.module.css:349  margin-bottom: 0.35rem   -> 0.35rem=5.6px [OFF-GRID]
components/sections/Vitrine/Vitrine.module.css:83  gap: 0.85rem   -> 0.85rem=13.6px [OFF-GRID]
components/sections/Vitrine/Vitrine.module.css:155  margin: 0.4rem 0   -> 0.4rem=6.4px [OFF-GRID]
components/sections/Vitrine/Vitrine.module.css:200  margin: 0.35rem 0 0   -> 0.35rem=5.6px [OFF-GRID]
components/sections/Vitrine/Vitrine.module.css:231  padding-bottom: 1px   -> 1px=1px [OFF-GRID]
components/sections/Vitrine/Vitrine.module.css:334  gap: 0.15rem   -> 0.15rem=2.4px [OFF-GRID]
components/marks/Caliper.module.css:154  margin: -1px   -> -1px=-1px [OFF-GRID]```

**Class B — 4-point half-steps (35 values).** These conform to `design-tokens.json`'s de-facto 4 pt scale but
not to R-48's 8-point grid. They are the cheaper fix: each is one token substitution.

```
components/sections/About/About.module.css:66  margin: 1.75rem 0 0   -> 1.75rem=28px [4pt half-step]
components/sections/About/About.module.css:102  gap: 1.25rem   -> 1.25rem=20px [4pt half-step]
components/sections/About/About.module.css:141  padding: clamp(1.25rem, 2.5vh, 1.75rem) 0   -> 1.25rem=20px [4pt half-step], 1.75rem=28px [4pt half-step]
components/sections/About/About.module.css:180  gap: 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/About/About.module.css:235  gap: 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/Experience/Experience.module.css:113  gap: 1.25rem   -> 1.25rem=20px [4pt half-step]
components/sections/Experience/Experience.module.css:194  margin-left: calc(min(12rem, max(7rem, 20%)) + 1.25rem)   -> 1.25rem=20px [4pt half-step]
components/sections/Experience/Experience.module.css:219  padding: clamp(1.25rem, 2.5vh, 1.75rem) 0   -> 1.25rem=20px [4pt half-step], 1.75rem=28px [4pt half-step]
components/sections/Experience/Experience.module.css:354  padding-left: 1.25rem   -> 1.25rem=20px [4pt half-step]
components/sections/Experience/Experience.module.css:374  gap: 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/Experience/Experience.module.css:386  margin-left: calc(7rem + 0.75rem)   -> 0.75rem=12px [4pt half-step]
components/sections/Experience/Experience.module.css:391  gap: 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/Hero/Hero.module.css:32  padding-top: max(clamp(4rem, 9vh, 6rem), calc(var(--nav-height) + 0.75rem))   -> 0.75rem=12px [4pt half-step]
components/sections/Hero/Hero.module.css:33  padding-bottom: clamp(1.25rem, 3vh, 2rem)   -> 1.25rem=20px [4pt half-step]
components/sections/Hero/Hero.module.css:332  gap: 1.25rem   -> 1.25rem=20px [4pt half-step]
components/sections/Listen/Avatar.module.css:14  gap: clamp(1.25rem, 3vw, 2rem)   -> 1.25rem=20px [4pt half-step]
components/sections/Listen/Avatar.module.css:188  gap: 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/Listen/Listen.module.css:68  margin: clamp(2rem, 4vh, 2.75rem) 0 clamp(2.5rem, 5vh, 3.5rem)   -> 2.75rem=44px [4pt half-step]
components/sections/Listen/Listen.module.css:89  gap: 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/Listen/Listen.module.css:153  padding-top: 1.25rem   -> 1.25rem=20px [4pt half-step]
components/sections/Listen/Listen.module.css:180  padding-top: clamp(1.75rem, 3.5vh, 2.5rem)   -> 1.75rem=28px [4pt half-step]
components/sections/Listen/Listen.module.css:185  margin: 0 0 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/Skills/Bench.module.css:15  margin: 0 0 clamp(1.5rem, 3vh, 2.25rem)   -> 2.25rem=36px [4pt half-step]
components/sections/Skills/Bench.module.css:248  margin: clamp(1.75rem, 3.5vh, 2.5rem) 0 0   -> 1.75rem=28px [4pt half-step]
components/sections/Skills/Skills.module.css:80  gap: 1.25rem   -> 1.25rem=20px [4pt half-step]
components/sections/Skills/Skills.module.css:81  padding: 1.25rem clamp(1rem, 2.5vw, 2rem)   -> 1.25rem=20px [4pt half-step]
components/sections/Skills/Skills.module.css:88  gap: 1.25rem   -> 1.25rem=20px [4pt half-step]
components/sections/Skills/Skills.module.css:159  padding: 0.75rem clamp(1rem, 2.5vw, 2rem) 0   -> 0.75rem=12px [4pt half-step]
components/sections/Vitrine/Vitrine.module.css:54  gap: clamp(1rem, 2vw, 1.75rem)   -> 1.75rem=28px [4pt half-step]
components/sections/Vitrine/Vitrine.module.css:84  padding: clamp(1.5rem, 2.5vw, 2.25rem)   -> 2.25rem=36px [4pt half-step]
components/sections/Vitrine/Vitrine.module.css:156  padding: 0.75rem 0   -> 0.75rem=12px [4pt half-step]
components/sections/Vitrine/Vitrine.module.css:165  gap: 0.75rem   -> 0.75rem=12px [4pt half-step]
components/sections/Vitrine/Vitrine.module.css:172  gap: 0.25rem   -> 0.25rem=4px [4pt half-step]
components/sections/Vitrine/Vitrine.module.css:208  margin-bottom: 0.25rem   -> 0.25rem=4px [4pt half-step]
components/sections/Vitrine/Vitrine.module.css:222  padding-top: 0.75rem   -> 0.75rem=12px [4pt half-step]```

**Class C — hairline, exempt (3 values).** `Hero.module.css:309` `padding-bottom: 1px` and
`Vitrine.module.css:231` `padding-bottom: 1px` are underline offsets — optical, one device pixel, not rhythm.
`Caliper.module.css:154` `margin: -1px` is the standard visually-hidden clip. `Listen.module.css:113`
`bottom: -3px` is the underline offset on `.channel::after` (confirmed at `Listen.module.css:108-113`) and should move to `-4px` (a half-step) or be
expressed in `em`. **Lock: 1px hairlines and visually-hidden offsets are exempt from SC-29.1; every other
sub-4px value is not.**

### 3.3 The locked spatial system

Declare the scale as CSS custom properties in `app/globals.css :root` — the missing link that forces module
authors onto the grid instead of typing literals:

```css
--space-0:  0;
--space-05: 0.25rem;  /*  4px — hairline gaps only (icon↔label, dot↔text) */
--space-1:  0.5rem;   /*  8px */
--space-2:  1rem;     /* 16px */
--space-3:  1.5rem;   /* 24px */
--space-4:  2rem;     /* 32px */
--space-5:  2.5rem;   /* 40px */
--space-6:  3rem;     /* 48px */
--space-8:  4rem;     /* 64px */
--space-10: 5rem;     /* 80px */
--space-14: 7rem;     /* 112px */
--space-20: 10rem;    /* 160px — the shipped section rhythm, app/globals.css:411 */
```

**Rules.**
1. Every spacing declaration in `components/**` is `var(--space-*)`, a `clamp()` whose **both endpoints** are
   `var(--space-*)`, or a `calc()` over them. No literal `rem`/`px` spacing.
2. `--space-05` (4 px) is the **only** sub-8 step, and is permitted only for intra-component gaps under 0.5rem
   (a dot beside its label). It is not a layout step.
3. Fluid spacing uses on-grid endpoints: `clamp(var(--space-3), 5vh, var(--space-6))`, never
   `clamp(1.25rem, 2.5vh, 1.75rem)` (the pattern at `About.module.css:141` and `Experience.module.css:219`).
4. `design-tokens.json:6` currently claims `"grid": "8pt"` while listing 4 pt steps. Regenerate the file from
   the block above so the declared grid and the shipped grid are the same thing.
5. **Gate:** extend `overhaul_static_audit.mjs` with `TC-NFR-GRID` — parse the same properties this audit
   parsed, fail on any literal length that is not a multiple of 8 px, allowing the Class C exemptions and
   `--space-05`. Without a gate, SC-29.1 will drift back within two commits.

**Verdict: EXTEND.** One vertical rhythm and generous negative space are PRESENT; the 8-point *scale* is
MISSING as a consumable token set, and 107 declarations are non-conforming.

---

## 4 · Motion (R-46, SC-27.1)

### 4.1 Reconciliation against the shipped `--motion-*` tokens

| Token | Value | `app/globals.css` | R-46 band |
|---|---|---|---|
| `--motion-fast` | `220ms` | line 86 | interface 200–450 ms — **in band** |
| `--motion-base` | `360ms` | line 87 | interface 200–450 ms — **in band** |
| `--motion-slow` | `520ms` | line 88 | **out of band** — above interface (450), below cinematic (600) |
| `--motion-ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | line 89 | custom bezier — **PASS** |
| `--motion-ease-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` | line 90 | custom bezier — **PASS** |

Discipline is good: every section module references the easing tokens; there are **zero** `ease`, `ease-in`,
`ease-out` or `ease-in-out` keywords in any section module (verified — the only `linear` matches are
`linear-gradient`, plus one deliberate `heroFade 320ms linear` at `Hero.module.css:397` inside the
reduced-motion block). Only one bezier is written inline anywhere in `components/**`
(`Bench.module.css:57`, and it is a `var(--motion-ease-emphasized, …)` fallback). The nav uses a third bezier
`cubic-bezier(0.22, 0.61, 0.36, 1)` at `app/globals.css:287,921` — untokenised.

**Raw durations still written as literals (14 occurrences), and their R-46 band:**

| File:line | Duration | Band |
|---|---|---|
| `Hero.module.css:104` | `900ms` heroRise | cinematic 600–1200 — PASS |
| `Bench.module.css:57` | `820ms` trace | cinematic — PASS |
| `Listen.module.css:72` | `720ms` ruleDraw (200 ms delay) | cinematic — PASS |
| `Compass.module.css:24` | `680ms` needle | cinematic — PASS |
| `Hero.module.css:397` | `320ms` heroFade (reduced-motion) | interface — PASS |
| `Bench.module.css:48,49` | `320ms` ×2 | interface — PASS |
| `Skills.module.css:62` | `240ms` cardSettle | interface — PASS |
| `Bench.module.css:165,166` | `180ms` ×2 | **below 200 ms** |
| `Listen.module.css:118` | `120ms` | **below 200 ms** |
| `Hero.module.css:105` | `90ms` stagger step | stagger interval, exempt |
| `Hero.module.css:398` | `40ms` stagger step | stagger interval, exempt |

**Staggered choreography: PRESENT.** `Hero.module.css:104-105` —
`animation-delay: calc(var(--step, 0) * 90ms + 120ms)` — a real per-element stagger, mirrored under reduced
motion at `Hero.module.css:397-398` with a 40 ms step. `Bench.module.css:57` staggers via `var(--delay)`.

**Compositor-safe properties: PRESENT.** Animated properties across the modules are `transform`, `opacity`,
`color`, `border-color`, `background`, `box-shadow`, `stroke-opacity` (`Bench.module.css:95-96` documents the
deliberate choice of `stroke-opacity` over `opacity`). No `width`/`height`/`top`/`left` animation. The one
`scaleX` reveal (`Listen.module.css` `ruleDraw`) is transform-only. `will-change` is applied only during the
active window, not permanently (`app/globals.css:660-663` records the rule).

### 4.2 Locked motion system

```css
/* Interface — R-46 200–450ms */
--motion-fast:      200ms;   /* was 220ms; snap to band floor */
--motion-base:      320ms;   /* was 360ms */
--motion-emphatic:  440ms;   /* new — replaces the out-of-band 520ms */
/* Cinematic — R-46 600–1200ms */
--motion-cine-in:   720ms;
--motion-cine:      900ms;
--motion-cine-long: 1160ms;
/* Stagger intervals (not durations — exempt from the bands) */
--stagger-tight:    60ms;
--stagger:          90ms;
--stagger-loose:   140ms;
/* Easing — custom bezier only, no keywords, ever */
--motion-ease-standard:   cubic-bezier(0.22, 1, 0.36, 1);    /* shipped, keep */
--motion-ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);     /* shipped, keep */
--motion-ease-exit:       cubic-bezier(0.4, 0, 1, 1);        /* new — exits accelerate */
--motion-ease-chrome:     cubic-bezier(0.22, 0.61, 0.36, 1); /* tokenises globals.css:287,921 */
```

Actions: `--motion-slow: 520ms` is retired in favour of `--motion-emphatic: 440ms` (interface) or
`--motion-cine-in: 720ms` (cinematic) at each call site; `Bench.module.css:165-166` (180 ms) and
`Listen.module.css:118` (120 ms) rise to `var(--motion-fast)`; every remaining literal duration becomes a token.

**Verdict: EXTEND.** Bezier discipline, compositor safety and stagger are PRESENT and genuinely good; one token
is out of band, three call sites are under the interface floor, and 14 durations are untokenised.

### 4.3 The parallel reduced-motion choreography — MISSING

**This is the largest gap in the motion system.** R-46 requires *"a parallel reduced-motion choreography that
stays memorable"*, and SC-27.1 requires it *"certified memorable"*. What ships is a global **kill switch**:

- `app/globals.css:691-699` and again `app/globals.css:841-854` force
  `animation-duration: 0.001ms !important` / `transition-duration: 0.01ms !important` on `*, *::before,
  *::after`. Declared twice, at two different magnitudes.
- Eight of the eleven section modules then add `transition: none` / `animation: none`
  (`About.module.css:239-245`, `Compass.module.css:176-183`, `Experience.module.css:402-408`,
  `Listen.module.css:162-169`, `Avatar.module.css:220-226`, `Bench.module.css:85-90`,
  `Skills.module.css:358-364`, `Vitrine.module.css:341-347`).

Every one of these **removes** motion. Only **one** place on the site offers a *parallel* choreography:
`Hero.module.css:389-398`, where the entrance is re-scored as `heroFade 320ms linear both` with a 40 ms
stagger — the elements still arrive in sequence, just without travel. That is exactly the pattern R-46 asks for,
and it exists in one section out of six.

**Lock — the reduced-motion score.** The reduced path is a *different arrangement of the same piece*, not
silence. Three permitted instruments, all vestibular-safe:

1. **Sequenced opacity** — reveals keep their order and their stagger (`--stagger-tight`), losing only
   translation. Generalise `Hero.module.css:389-398` to all six sections.
2. **Instant-state truth** — anything that *is information* renders in its final state immediately, never
   hidden: the Compass needle points (`Compass.module.css:177-178` already states this intent), the Bench wires
   are drawn (`Bench.module.css:86-89` already does this), the Listen rule is at full width
   (`Listen.module.css:163-166` already does this). Keep all three; they are the correct half of the pattern.
3. **Colour and weight transitions survive** at `--motion-fast`. A hover that changes `color` or `border-color`
   causes no vestibular response and is the primary affordance signal; killing it (as
   `Skills.module.css:363-364`, `Vitrine.module.css:342-344`, `Avatar.module.css:221-225`,
   `About.module.css:240-244`, `Experience.module.css:403-408` all currently do) makes the interface feel
   *broken* rather than *calm*, and degrades SC-30.1 at the same time.

Implementation: replace the two blanket `!important` blocks with a single guard that neutralises **transform**
and **scroll-behavior** only, and let each section's reduced-motion block *re-score* rather than mute.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-name: none !important;          /* transform-driven keyframes off */
    scroll-behavior: auto !important;
  }
  /* colour/opacity transitions survive at --motion-fast; each section then
     opts its own elements back in with a fade-only entrance. */
}
```

**Test (T-15 / SC-27.1):** a Playwright spec under `prefers-reduced-motion: reduce` asserting, per section,
that (a) every revealed element reaches `opacity: 1`, (b) no element's `transform` differs from `none` during
entrance, and (c) at least one ordered, staggered fade is observable — i.e. the choreography is *present*, not
merely *harmless*. No such spec exists today.

---

## 5 · Interaction states (R-49, SC-30.1, R-103)

SC-30.1 requires **full designed state coverage on every interactive element and zero browser-default states**.

### 5.1 What is shipped

- A site-wide focus ring exists: `app/globals.css:510-524` (`2px solid var(--accent-color)`, `offset 3px`) for
  the global chrome, and each section module declares its own `:focus-visible` — `Hero.module.css:281-285`,
  `Vitrine.module.css:97-100,257-261`, `Skills.module.css:152`, `Bench.module.css:181`,
  `Experience.module.css:124,245`, `Listen.module.css:131,234`, `Avatar.module.css:42,161`,
  `About.module.css:154`. Ring contrast: `--white` on `--ink-900` = **18.20:1**; `--accent` = **16.48:1**.
  Both clear 1.4.11's 3:1 for non-text UI by a wide margin. **PRESENT.**
- `:focus-visible` (not `:focus`) throughout — pointer clicks stay ring-free. **PRESENT.**
- Selected/expanded states are designed and semantic: `aria-pressed` styled at `Skills.module.css:146`,
  `aria-expanded` on `Experience.tsx:161` and `Avatar.tsx:91`, `[data-active]` at `About.module.css:150,168`,
  `Compass.module.css:84,91,123`, `Experience.module.css:141,165,185`, `[data-lit]` at
  `Vitrine.module.css:105`. **PRESENT — and better than most systems ship.**

### 5.2 The gap, per element

Every interactive element on the site today, with its state coverage. **`—` = state not designed.**

| # | Element | Source | hover | focus-visible | active | disabled | loading | empty |
|---|---|---|---|---|---|---|---|---|
| 1 | Hero primary action | `Hero.tsx:86` / `Hero.module.css:265` | ✅ | ✅ 281 | — | — | — | n/a |
| 2 | Hero secondary action | `Hero.tsx:89` / `Hero.module.css:276` | ✅ | ✅ 282 | — | — | — | n/a |
| 3 | Hero inline links | `Hero.tsx:102` / `Hero.module.css:315` | ✅ | ✅ 283 | — | n/a | n/a | n/a |
| 4 | About provenance link | `About.tsx:47` / `About.module.css:78` | ✅ | **—** | — | n/a | n/a | n/a |
| 5 | About dimension item (`tabIndex=0`) | `About.tsx:96` / `About.module.css:150,154` | **—** | ✅ 154 | — | n/a | n/a | n/a |
| 6 | Experience track button | `Experience.tsx:97` / `Experience.module.css:166` | ✅ | ✅ 124 | — | — | — | n/a |
| 7 | Experience role toggle | `Experience.tsx:158` / `Experience.module.css:245` | **—** | ✅ 245 | — | — | n/a | n/a |
| 8 | Skills filter (`aria-pressed`) | `Skills.tsx:129` / `Skills.module.css:141,146,152` | ✅ | ✅ | — | — | n/a | **—** |
| 9 | Bench node button | `Bench.tsx:347` / `Bench.module.css:176,181` | ✅ | ✅ | — | — | — | n/a |
| 10 | Bench capability node button | `Bench.tsx:374` / `Bench.module.css:176,181` | ✅ | ✅ | — | — | — | n/a |
| 11 | Vitrine plate (`tabIndex=0`) | `Vitrine.tsx:125` / `Vitrine.module.css:97` | **—** (only `[data-lit]`) | ✅ 97 | — | n/a | n/a | n/a |
| 12 | Vitrine source link | `Vitrine.tsx:164` / `Vitrine.module.css:252` | ✅ | ✅ 257 | — | n/a | n/a | n/a |
| 13 | Vitrine live URL | `Vitrine.tsx:168` / `Vitrine.module.css:247` | ✅ | ✅ 258 | — | n/a | n/a | n/a |
| 14 | Listen channel link | `Listen.tsx:47` / `Listen.module.css:121-131` | ✅ | ✅ | — | n/a | n/a | n/a |
| 15 | Listen correction hash | `Listen.tsx:75` / `Listen.module.css:229,234` | ✅ | ✅ | — | n/a | n/a | n/a |
| 16 | Avatar play trigger | `Avatar.tsx:66` / `Avatar.module.css:42,59,95` | ✅ | ✅ | — | — | **—** | n/a |
| 17 | Avatar transcript toggle | `Avatar.tsx:88` / `Avatar.module.css:156,161` | ✅ | ✅ | — | — | n/a | — |
| 18 | Nav logo | `Navigation.tsx:129` / `app/globals.css:516` | **—** | ✅ | — | n/a | n/a | n/a |
| 19 | Nav CV chip | `Navigation.tsx:156` / `app/globals.css:494,498` | ✅ | ✅ | — | — | — | n/a |
| 20 | Nav menu toggle | `Navigation.tsx:159` / `app/globals.css:515` | **—** | ✅ | — | n/a | n/a | n/a |
| 21 | Nav overlay links | `app/globals.css:387,514` | ✅ | ✅ | — | n/a | n/a | n/a |
| 22 | SW toast reload | `ServiceWorkerRegister.tsx:90` / `app/globals.css:1007` | ✅ | **—** | — | — | — | n/a |
| 23 | MiniVic controls | `MiniVicBot.tsx:1248+` | Tailwind | **—** (bare `focus:`, and `focus:outline-none` at `MiniVicBot.tsx:1199`) | — | — | partial | — |

**Totals: `:active` designed on 0 of 23. `:disabled` designed on 0 of 23. Loading designed on 0. Empty-state
designed on 0.** Five elements are missing hover (#5, #7, #11, #18, #20); three are missing focus-visible (#4, #22, #23).
`app/globals.css:800-801` styles `#mini-vic-input:focus` with `border-color` alone and no ring; `MiniVicBot.tsx:1199`
sets `focus:outline-none` on the panel and `MiniVicBot.tsx:1478` uses `focus:` rather than `focus-visible:`.
These are the only bare-`:focus` treatments on the site.

### 5.3 The locked state library

Every interactive element implements all six. Values are token-only and every state changes at least two
signals (colour + geometry), so none depends on colour alone.

| State | Definition | Motion |
|---|---|---|
| **rest** | `--mist-200` text, `--card-border` edge | — |
| **hover** | text → `--white`; edge → `--card-border-hover` (`app/globals.css:64`); +1 elevation step (`--elev-1`, `app/globals.css:105`). Never a `transform` on text links. | `--motion-fast` `--motion-ease-standard` |
| **focus-visible** | `outline: 2px solid var(--white)` (18.20:1), `outline-offset: 3px`. Never removed, never colour-only, never `:focus`. | none (instant) |
| **active** | **NEW.** `transform: translateY(1px) scale(0.995)` on buttons; text links darken to `--mist-200` and the underline goes solid. Confirms the press before the state changes. | `--motion-fast` `--motion-ease-exit` |
| **disabled** | **NEW.** `color: var(--ink-300)`, `border-color: var(--ink-500)`, `opacity: 1` (never fade — it destroys contrast), `cursor: not-allowed`, `pointer-events: none`, plus `aria-disabled`. Contrast 4.03:1, permitted because 1.4.3 exempts disabled controls. | none |
| **loading** | **NEW.** `aria-busy="true"`; the label stays and is joined by a 1px indeterminate rule that traverses the control's bottom edge at `--motion-cine` in `--mist-400`. **No spinner** (R-51 forbids spinner-only states), **no label swap** (that causes a reflow). Under reduced motion the rule is static at 40 % width with `aria-busy` still set. | `--motion-cine`, transform-only |
| **empty** | **NEW.** Never a blank region. A mono `--fs-caption` line in `--mist-400` stating *what* is absent and *why*, on the same baseline grid the populated state used, so the container does not resize. Required at: Skills filter returning no rows (`Skills.tsx:129`), Avatar transcript before load (`Avatar.tsx:88`), any GitHub/telemetry surface whose fetch returns nothing. |

**Cursor-state design (R-49):** `app/globals.css:69` declares `--cursor-size`, and lines 225-232 document a
`body[data-cursor-state]` machine and `[data-magnetic]` proximity zones — but the rules themselves have been
stripped; only `[data-magnetic]` at lines 233-243 survives. `* { cursor: auto }` at `app/globals.css:125`
means the site currently renders the **browser default cursor everywhere**. Under SC-30.1 ("zero browser-default
states") this is a gap: **lock** three cursor states — `default`, `interactive` (over any element in the table
above), `dragging` (over the Vitrine rail) — driven by `body[data-cursor-state]`, with `cursor: auto` restored
under `prefers-reduced-motion` (as `app/globals.css:697` already does).

**Craft signals (R-103) — status:** tabular figures **PRESENT** (5 sites, §2.2); `text-wrap: balance`
**PARTIAL** (one use, `Experience.module.css:138` — lock it onto every `.title` and `.lede`); optical alignment
and hand-tuned easing **PRESENT**; custom iconography **PRESENT** (the caliper, drawn in CSS —
`Caliper.module.css:11-65`); considered empty/zero states **MISSING** (above); true small caps **MISSING** (no
`font-variant-caps` anywhere — the uppercase kickers use `text-transform: uppercase` with `letter-spacing:
0.2em`, e.g. `Skills.module.css:34-35`, which is the correct fallback given Source Serif 4 ships no SC set;
**lock the tracked-uppercase treatment as the deliberate ruling**, not an oversight); hanging punctuation
**MISSING** (`hanging-punctuation: first` on `.lede` and blockquote-like copy, Safari-only but free).

**Verdict: EXTEND.** Focus and selected states are PRESENT and well done. `:active`, `:disabled`, loading and
empty are **MISSING across the entire site**; five elements lack hover, three lack focus-visible, the MiniVic panel
removes its outline outright, and the cursor-state machine is declared but not implemented.

---

## 6 · Build order

1. **Colour (small, high value).** Remove gold from `MiniVicBot.tsx:1244`. Raise the Vitrine unlit floor to
   `0.62` and step unlit `.live` to `--gold-pale`. Move `.statusLabel` off `--ink-300`.
2. **Spacing tokens.** Add the `--space-*` block to `app/globals.css`, regenerate `design-tokens.json`, then
   sweep the 107 declarations in §3.2 (Class B first — one substitution each — then Class A). Land
   `TC-NFR-GRID` in the same commit so it cannot regress.
3. **Type tokens.** Add `--fs-*` + bound line-heights, regenerate the stale `design-tokens.json:22-27`, sweep
   the 40 font sizes onto 10 steps, move the five out-of-band measures to `--measure-read`.
4. **Motion tokens.** Retire `--motion-slow`, add the cinematic and stagger tokens, tokenise the 14 literals and
   the nav bezier.
5. **Reduced-motion choreography.** Replace the two blanket `!important` blocks with the guard in §4.3;
   generalise the Hero's fade-stagger to all six sections; land the T-15 spec.
6. **State library.** `:active`, `:disabled`, loading and empty across all 23 elements; close the six hover and
   three focus gaps; implement the three cursor states.

Each step is gated by the existing `Definition of done` in `CLAUDE.md`: `tsc` clean · `lint` clean · static
audit 10/10 (11/11 after `TC-NFR-GRID`) · full Playwright suite green.
