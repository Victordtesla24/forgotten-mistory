# G-REV phase 2 — live re-probe of G-H3 (palette purge)

**Reviewer** — independent adversarial QA (docs/prompt.md §5, `verification` +
`3rd_party_independent_adversarial_review`, effort max). Read-only; no production file
was changed by this review.

| | |
|---|---|
| **Target** | `https://forgotten-mistory.web.app/` (live Firebase Hosting), cache-busted on every load |
| **Live `build-commit`** | `ceca1fa5` (`<meta name="build-commit" content="ceca1fa5"/>`) |
| **Claim under test** | `5d733ad` — *"served CSS is black, white and gold only"* (G-H3) |
| **Ancestry** | `git merge-base --is-ancestor 5d733ad ceca1fa5` → **YES**. The tasking named `d58c5c7b`; live is `ceca1fa5`, which is `d58c5c7b`'s child (`ceca1fa5` = consolidate of `worktree-wf_e036bba6-a3f-1`). Both carry `5d733ad`. Probing a **later** commit than the floor, not an earlier one. |
| **Probed at** | 2026-09-05, ~13:05–13:20Z |
| **Method** | Chrome (system, `--no-sandbox`), one browser context at a time, four contexts: `/` and `/?gl=force` × 1440×900 and 390×844 |

---

## VERDICT

### G-H3 — **PASS**

Every served stylesheet — including the lazily-loaded chunk that is **not** referenced from
the initial HTML — is achromatic apart from the seven gold tokens. The rendered page,
measured pixel-by-pixel with the subpixel-antialiasing artefact removed, carries
**0.0000 % non-gold chromatic pixels** at both widths on both paths once the photograph is
excluded. All four claims in `5d733ad`'s message reproduce.

**Two regressions were found that are not G-H3's** — see *Failures first*. They do not
change the G-H3 verdict but they are red, and they are new since the flagship-C baseline.

---

## Failures first

### FAIL-A — text contrast regressed at 1440 on **both** paths: 4 nodes below AA (was 0)

Not a palette failure — every colour involved is neutral — but a live WCAG 1.4.3 breach and
a straight regression against the flagship-C baseline (`G-REV/577d45af`: *0 of 159 below AA*
at 1440 still **and** 1440 `?gl=force`).

Run: the repository's own gate, unmodified, pointed at production —
`PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/a11y/text-contrast.spec.ts --workers=1`
→ **2 failed, 2 passed (3.7 m)**. Full log: `captures/text-contrast-live.log`.

| # | ratio (needs) | section | node | colours |
|---|---|---|---|---|
| 1 | **1.06:1** (4.5) | experience | `li#role-infocentric > h3.Experience_roleHeading > button.Experience_roleToggle > span.Experience_roleMeta:nth-of-type(2) > span.Experience_roleCompany:nth-of-type(1)` — "InfoCentric" | fg `rgb(205,205,205)` on sampled ground `rgb(200,199,199)` @ 16 px/400 |
| 2 | **3.63:1** (4.5) | skills | `figure.Bench_figure > … > div.Bench_band:nth-of-type(2) > p.Bench_bandLabel` — "Repositories" | fg `rgb(125,125,125)` on `rgb(39,39,39)` @ 11 px/400 |
| 3 | **4.00:1** (4.5) | skills | `… div.Bench_band:nth-of-type(3) > p.Bench_bandLabel` — "Credentials" | fg `rgb(125,125,125)` on `rgb(31,31,31)` @ 11 px/400 |
| 4 | **4.10:1** (4.5) | skills | `… div.Bench_band:nth-of-type(1) > p.Bench_bandLabel` — "Programmes" | fg `rgb(125,125,125)` on `rgb(29,29,29)` @ 11 px/400 |

The same four, identically, on `?gl=force` at 1440 (`TC-CONTRAST-02 @ 1440`).

**Attribution — explicitly not G-H3.** Three of the four are `.Bench_bandLabel`, a component
that did not exist at the `577d45af` baseline; `Bench` arrived with `66b0872`
*feat(skills): the bench sits on a lit GLSL field (G-S1)*. Node 1 is a near-white ground
under `#experience` (`rgb(200,199,199)`) — a light panel, again post-baseline. Every colour
in the table has channel spread ≤ 6, i.e. is neutral: no hue was introduced, so `5d733ad`
did not cause this. It is a **flagship-B/G-S1 regression surfaced by this sweep**, and it
needs a `feedback_refactor_loop` task against whoever owns `Bench` and the experience
light panel — not against G-H3.

**Improvement in the same run:** the flagship-C `F2-contrast-gl` hairline (390 `?gl=force`,
1 of 145 at 4.496:1) is **gone** — `TC-CONTRAST-02 @ 390` now passes, as does
`TC-CONTRAST-01 @ 390`.

| viewport / path | flagship-C baseline (`577d45af`) | live now (`ceca1fa5`) | |
|---|---|---|---|
| 1440 `/` | 0 below AA, worst 4.66:1 | **4 below AA, worst 1.06:1** | **regressed** |
| 1440 `/?gl=force` | 0 below AA, worst 4.66:1 | **4 below AA, worst 1.06:1** | **regressed** |
| 390 `/` | 0 below AA, worst 4.65:1 | 0 below AA | held |
| 390 `/?gl=force` | 1 below AA @ 4.496:1 | **0 below AA** | **fixed** |

### FAIL-B (method, mine, disclosed) — the naive pixel histogram is unusable without disabling LCD text

My first rendered pass reported 0.66 % (1440) / 1.27 % (390) non-gold chromatic pixels, with
hue buckets at 15–29°, 195–224° and samples like `rgb(74,39,23)` and `rgb(27,51,93)`. Cropping
the reported coordinate (`captures/subpixel-aa-artefact-1440-about.png`, doc-space 60,1330
1440×900) shows the region is the **`#about` lede and "Ten dimensions" heading — plain grey
text on near-black**. The chroma is Chrome's **LCD subpixel antialiasing** on glyph edges, not
design colour. The naive histogram is recorded (`captures/probe-lcd-on.json`) so the artefact
is on the record and not silently dropped; the verdict below uses the corrected pass.

---

## Scan tables

### (a) hue-named utility class selectors in the served bundles

Regex over every served byte:
`\.(text|bg|border|ring|stroke|fill|from|to|via|outline|shadow|decoration|divide|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)`
(`captures/scan.mjs`; raw output `captures/css-chroma-scan-ceca1fa5.txt`).

**Bundles scanned — four, not three.** Three are linked from the HTML; the fourth,
`f1997129dcf85dfd.css`, is fetched lazily and was caught by watching the network log while
scrolling the whole page at 1440 and 390 on both paths. It was **not** in the baseline scan's
input set, so this is the first time it has been examined.

| bundle | bytes | source | hue utilities | chromatic literals |
|---|---:|---|---|---|
| `ad73c6c93a11143e.css` | 35 762 | `<link>` in HTML | 0 | 0 |
| `b6ca1a1e79117a86.css` | 61 986 | `<link>` in HTML | 0 | 7 (all gold) |
| `d40fff02ca78b1c1.css` | 30 521 | `<link>` in HTML | 0 | 0 |
| `f1997129dcf85dfd.css` | 2 632 | **lazy chunk**, observed on scroll | **0** | **0** |

**Baseline → now.** Every utility the baseline scans named is gone:

| baseline hit (`9ba97a5c` / `874f1ee9`) | live `ceca1fa5` |
|---|---|
| `.bg-red-500` ×3, `.border-red-500` ×3, `.text-red-500` | **absent** |
| `.border-orange-400` | **absent** |
| `.stroke-amber-400` | **absent** |
| `.bg-blue-600`, `.text-blue-500` | **absent** |
| `.bg-green-400`, `.bg-green-500` | **absent** |

What *is* emitted is the **`neutral-*`** scale only, and every one of its values is
achromatic:

```
.bg-neutral-500\/10{background-color:#7373731a}   .border-neutral-200\/25{border-color:#e5e5e540}
.bg-neutral-500\/15{background-color:#73737326}   .border-neutral-300\/40{border-color:#d4d4d466}
.via-neutral-950\/35{--tw-gradient-via:#0a0a0a59} .to-neutral-950\/15{--tw-gradient-to:#0a0a0a26}
```

Every `oklch()` in the whole served set — all seven of them, the Tailwind neutral ramp —
has **chroma 0 and hue 0**: `oklch(97% 0 0)`, `oklch(92.2% 0 0)`, `oklch(87% 0 0)`,
`oklch(70.8% 0 0)`, `oklch(55.6% 0 0)`, `oklch(26.9% 0 0)`, `oklch(14.5% 0 0)`.

Zero occurrences of `zinc|slate|amber|red|blue|green|orange|sky|indigo|rose|emerald|teal|cyan|violet|purple|fuchsia|pink|lime|yellow|stone|gray-<n>` anywhere in the served CSS. The only literal
`red` is inside Tailwind's own feature probe `@supports (color: color-mix(in lab, red, red))`,
which paints nothing.

### (b) colour literals with chroma

Thresholds as tasked: hex/rgb channel spread > 6; `hsl` saturation > 3 %; `oklch` chroma > 0.01.

| literal | spread / chroma | hue | verdict |
|---|---|---|---|
| `#c9a84c` (`--gold`) | 125 | 44° | gold token |
| `#d4b65c` (`--gold-light`) | 120 | 45° | gold token |
| `#e8d5a3` (`--gold-pale`) | 69 | 43° | gold token |
| `#b0923f` (`--gold-dark`) | 113 | 44° | gold token |
| `#c9a84c14` (`--gold-muted`) | 125 | 44° | gold token + alpha |
| `#c9a84c33` (`--gold-border`) | 125 | 44° | gold token + alpha |
| `#c9a84c21` (`--gold-veil`) | 125 | 44° | gold token + alpha |

**7 distinct chromatic literals across all four bundles; 0 non-gold.** The baseline's
blue-biased body washes **`#282a32` and `#24242a` return zero matches** (`grep -c` = 0).

The WebGL palette source is covered too — `lib/palette.ts`, the only place raw hex is
allowed to live for the shaders, holds three chromatic literals and all three are gold
(`#c9a84c`, `#d4b65c`, `#e8d5a3`); everything else in it is neutral.

### (c) computed `body` background-image on live

Identical in all four contexts:

```
background-image: radial-gradient(circle at 15% 20%, rgba(42, 42, 42, 0.26), rgba(0,0,0,0) 42%),
                  radial-gradient(circle at 82% 14%, rgba(42, 42, 42, 0.22), rgba(0,0,0,0) 36%),
                  radial-gradient(circle at 60% 85%, rgba(36, 36, 36, 0.18), rgba(0,0,0,0) 40%)
background-color: rgb(10, 10, 10)     (html: rgb(10, 10, 10))
```

Both washes are **equal-channel neutrals** (42,42,42 / 36,36,36) at the baseline's own alphas
(.26/.22/.18). The claimed luminance preservation checks out: the old `rgb(40 42 50)` has
relative luminance 0.2126·40 + 0.7152·42 + 0.0722·50 = **42.2**, the replacement is 42;
`rgb(36 36 42)` → 0.2126·36 + 0.7152·36 + 0.0722·42 = **36.4**, the replacement is 36. Depth
unchanged, hue removed — as stated.

### (d) computed `:root` tokens on live

Identical in all four contexts, every one achromatic (spread 0):

| token | value | spread | |
|---|---|---:|---|
| `--ink-900` | `#0a0a0a` | 0 | neutral |
| `--mist-400` | `#909090` | 0 | neutral |
| `--steel` | `#b8b8b8` | 0 | neutral |
| `--white` | `#f6f6f6` | 0 | neutral |
| `--accent` | `#ebebeb` | 0 | neutral |
| (context) `--ink-800` `#131313`, `--ink-700` `#1c1c1c`, `--mist-200` `#cdcdcd` | | 0 | neutral |
| `--gold` | `#c9a84c` | 125 | the one claim colour |

### Rendered pixel histogram — non-gold chromatic share

Full-page screenshots, `deviceScaleFactor: 1`, after scrolling the entire document.
Chroma = channel spread > 8; "gold-hued" = hue 35–50°. Run with
`--disable-lcd-text --disable-font-subpixel-positioning --font-render-hinting=none` so the
FAIL-B artefact cannot contaminate the count (`captures/probe2.mjs`,
`captures/probe-lcd-off-histogram.json`).

**Excluded, and said plainly:** three boxes per context — the hero photograph
(`#hero figure[class*="portrait"]`, the colour portrait allowed by prime directive /
TC-HERO-18) and the MiniVic launcher's `.minivic-launcher__disc` / `__portrait`, which paint
**the same photograph** (`background-image: url(/assets/my_avatar.webp)`) at 64 px in the
fixed dock. Nothing else was excluded.

| context | sampled px | chromatic | gold-hued | **non-gold** | **non-gold share** |
|---|---:|---:|---:|---:|---:|
| 1440 `/` | 17 210 311 | 26 932 | 26 931 | **1** | **0.0000 %** (5.8 × 10⁻⁶ %) |
| 1440 `/?gl=force` | 17 210 311 | 26 932 | 26 931 | **1** | **0.0000 %** |
| 390 `/` | 6 840 600 | 7 775 | 7 775 | **0** | **0.0000 %** |
| 390 `/?gl=force` | 6 840 600 | 7 775 | 7 775 | **0** | **0.0000 %** |

The single non-gold pixel at 1440 is `rgb(81,80,72)` — spread 9, hue **51°**, one degree
outside my own 35–50° gold band, at doc-space (572, 7162). It is an antialiasing edge pixel
on a gold mark, not a coloured region.

**Other coloured regions found: none.** Independently of the pixels, a DOM-wide sweep of
**every element** on the page reading computed `backgroundColor`, `color`, `borderTopColor`,
`outlineColor`, `fill` and `stroke`, flagging any value with channel spread > 6 that is not
red ≥ green ≥ blue (gold-biased), returned an **empty list**
(`captures/dom-computed-colour-sweep.json`, key `chroma`). No element on the live page
carries a non-gold chromatic computed colour.

**Scope caveat, stated rather than glossed:** at capture time one `<canvas>` was mounted on
the `?gl=force` runs (the hero scene). `components/gl/Scene.tsx` releases a canvas once its
slot is well past the viewport, and the screenshot is taken after scrolling back to top, so
the about-field and career-strata shaders are **not** in the `?gl=force` pixel counts. Their
colour is governed at source by `lib/palette.ts`, scanned above and clean; a per-scene
in-viewport histogram was not run inside the wall-clock cap and is the one gap in this
verdict's rendered evidence.

---

## Regression sweep

| check | 1440 `/` | 1440 `?gl=force` | 390 `/` | 390 `?gl=force` |
|---|---|---|---|---|
| `pageerror` | **0** | **0** | **0** | **0** |
| failed requests | **0** | **0** | **0** | **0** |
| console `error` | 0 | 0 | 0 | 0 |
| `<canvas>` mounted | 0 (still path, expected) | 1 | 0 | 1 |

**Sections — all six present, none zero-height** (`document.getElementById`, height in CSS px):

| | hero | about | experience | skills | vitrine | listen |
|---|---:|---:|---:|---:|---:|---:|
| 1440 | 1294 | 2405 | 2995 | 3086 | 1460 | 913 |
| 390 | 1257 | 3576 | 4218 | 5898 | 1630 | 1006 |

**MiniVic launcher — still styled; the zinc→neutral swap dropped nothing.** Computed chrome
at 1440 (`captures/dom-computed-colour-sweep.json`, key `mv`):

| element | background | colour | border | shadow | box |
|---|---|---|---|---|---|
| `div.minivic-dock.fixed` | transparent | `rgb(246,246,246)` | — | none | 182×64 |
| `button.minivic-launcher.group` | transparent | `rgb(246,246,246)` | — | none | 182×64 |
| `span.minivic-launcher__pill` | `rgba(10,10,10,0.72)` | `rgb(205,205,205)` | `rgb(205,205,205)` | none | 110×28 |
| `span.minivic-launcher__disc` | `rgb(10,10,10)` | `rgb(246,246,246)` | `rgba(255,255,255,0.09)` | `rgba(0,0,0,0.55) 0 10px 30px` | 64×64 |
| `span.minivic-launcher__portrait` | — | — | — | — | `url(/assets/my_avatar.webp)` |
| `span.minivic-launcher__pulse.animate-ping` | `rgb(144,144,144)` | — | — | — | 17×17 |
| `span.minivic-launcher__dot` | `rgb(60,60,60)` | — | `rgb(10,10,10)` | — | 10×10 |
| `button.skip-link.minivic-skip` | `rgb(28,28,28)` | `rgb(246,246,246)` | `rgba(255,255,255,0.18)` | `rgba(0,0,0,0.5) 0 14px 44px -10px` | 117×42 |

Every value is a neutral (`10,10,10` · `28,28,28` · `60,60,60` · `144,144,144` ·
`205,205,205` · `246,246,246` — all spread 0) and every part of the chrome is present and
sized: dock, pill, disc, portrait, pulse, dot, skip link. Nothing collapsed to `0×0`, nothing
lost a background, nothing lost its shadow. **The swap held.**

---

## False-positive register

Every claim in `5d733ad`'s message was checked against the live artifact and the tree. **No
claim failed to reproduce — the register is empty.**

| claim, verbatim from `5d733ad` | reproduced? | evidence |
|---|---|---|
| *"Tailwind v4 `source(none)` + `@source` app/components (stray hue utilities came from quoted class names in `reports/`)"* | **yes** | `app/globals.css:9-11` is exactly `@import "tailwindcss" source(none); @source "../app"; @source "../components";`. Effect confirmed downstream: zero hue utilities in four served bundles vs. eleven at baseline. |
| *"body washes … re-expressed as equal-luminance neutrals"* | **yes** | live computed `body` background-image = `rgba(42,42,42,.26)`, `rgba(42,42,42,.22)`, `rgba(36,36,36,.18)`; luminance arithmetic verified above (42.2→42, 36.4→36); `#282a32`/`#24242a` absent from all served CSS. |
| *"rim/key tints neutral"* | **yes** | `app/globals.css:235-239` — `--rim`/`--rim-strong` on `rgb(246 246 246)` + `rgb(235 235 235)`, `--keylight` on `rgb(184 184 184)`; all spread 0. |
| *"zinc/slate utilities in MiniVic → neutral"* | **yes** | zero `zinc-`/`slate-` in served CSS; MiniVic chrome table above is entirely neutral **and** structurally intact. |
| *"v3 `tailwind.config.js` removed"* | **yes** | `ls tailwind.config.*` → no such file at `ceca1fa5`; the commit's `--stat` shows `tailwind.config.js | 12 -`. |

One thing the message says that this review deliberately does **not** endorse: *"the
monochrome/contrast battery runs in parallel and lands in a follow-up evidence commit."*
The contrast battery, run here against production, is **red at 1440 on both paths** (FAIL-A).
That is not G-H3's doing, but the follow-up evidence commit must not land claiming the
battery is green.

---

## Remaining P0 gaps — one line each

- **G-H2 — partial.** The scrim is gone per the flagship-C review (`G-REV/577d45af`); not
  re-probed here, no contradicting evidence observed.
- **G-M3 — FAIL, baseline measured** in `G-REV/ca2b442`/`874f1ee9`; unchanged by this pass,
  still open.
- **G-H1 / G-S1 — probed by a sibling**, not duplicated here. Noted only in passing: three of
  FAIL-A's four contrast nodes are `.Bench_bandLabel`, which belongs to G-S1's bench
  (`66b0872`), so that sibling's probe should be told to expect a contrast finding.
- **G-H3 — CLOSED, PASS** (this document).

---

## Reproduce

```bash
# served CSS, all four bundles (the fourth is lazy — watch the network log while scrolling)
curl -s https://forgotten-mistory.web.app/ | grep -o '/_next/static/css/[a-z0-9]*\.css'
node captures/scan.mjs <each>.css

# rendered histogram, LCD subpixel text disabled (mandatory — see FAIL-B)
node captures/probe2.mjs

# contrast, the repository's own gate against production
PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app \
  npx playwright test tests/a11y/text-contrast.spec.ts --workers=1
```

## Files

```
captures/css-chroma-scan-ceca1fa5.txt        (a)+(b) over the three linked bundles
captures/css-chroma-scan-lazy-chunk.txt      (a)+(b) over the lazy f1997129dcf85dfd.css
captures/probe-lcd-on.json                   naive histogram + computed body/:root/sections/CSS requests
captures/probe-lcd-off-histogram.json        corrected histogram — the verdict's numbers
captures/dom-computed-colour-sweep.json      DOM-wide chromatic sweep (empty) + MiniVic chrome
captures/text-contrast-live.log              full Playwright output, 2 failed / 2 passed
captures/subpixel-aa-artefact-1440-about.png the crop that proves FAIL-B is an artefact
captures/{1440,390}-{still,glforce}-nolcd-fullpage.png   downscaled full-page captures
captures/scan.mjs, captures/probe2.mjs       the two probes, verbatim
```
