# Independent live review — `rev-b4b4a9a3-c23`

| | |
|---|---|
| **Reviewer identity** | `rev-b4b4a9a3-c23` (fresh; does **not** resume `rev-64404134-c22`) |
| **Tasks** | `t_l1_05` / `t_g2_l1` / `t_rev_adv1556` |
| **Live SoT** | <https://forgotten-mistory.web.app/> |
| **Live `build-commit`** | **`b4b4a9a3`** (measured on every probe run, all viewports) |
| **Probed at** | 2026-09-05 ~19:33–19:45Z |
| **Method** | Local Playwright 1.57.0 driving system Chrome (`--no-sandbox`); GL runs add `--use-gl=swiftshader --enable-unsafe-swiftshader` and `?gl=force`. Read-only — no production code touched. |

Live SHA cross-check: `curl -I` → `last-modified: Sat, 05 Sep 2026 19:30:30 GMT`,
`cache-control: public, max-age=0, must-revalidate`; review worktree `git rev-parse --short=8 HEAD`
= `b4b4a9a3` (`consolidate: merge worktree-rev-64404134-c22 into main`). Localhost was **not** used
for any verdict.

---

## Primary gate — G-L1 C5: the Listen caliper reads the greeting's own length

**Verdict: PASS.**

The reading between the caliper jaws renders the measured duration, not `—`.

| Measurement | Value |
|---|---|
| Selector | `#listen [data-reading]` |
| Element | `<text data-reading="true" class="Listen_reading___amBx" x="160" y="20">` |
| **`textContent`** | **`24.98 s`** |
| Computed `color` | `rgb(144, 144, 144)` |
| Computed `fill` | `rgb(144, 144, 144)` |
| `--gold` resolved live | `#c9a84c` → `rgb(201, 168, 76)` |
| Gold? | **No** — `rgb(144,144,144) ≠ rgb(201,168,76)` |
| `visibility` / `opacity` / `display` | `visible` / `1` / `block` |
| Bounding rect @1440 | `50.41 × 15` px at `(230.8, 476.9)` |
| Bounding rect @390 | `46.53 × 14` px at `(160.7, 331.1)` |
| `#listen` in view when read | `true` (both viewports) |
| Page errors / console errors | `[]` / `[]` |

**Provenance chain — the figure is measured, not typed.**

- `app/data/generated/greeting-envelope.ts:277` → `durationSeconds: 24.984671`
- `components/sections/Listen/Listen.tsx:35` → ``const READING = `${greetingEnvelope.durationSeconds.toFixed(2)} s`;``
- `(24.984671).toFixed(2)` → `"24.98"` → `"24.98 s"` — exactly what the live DOM renders.
- `components/sections/Listen/Listen.tsx:280,287` — `data-reading` carries `{READING}`.
- The same envelope drives the shader: `components/sections/Listen/ListenField.tsx:103`
  → `uDuration: { value: greetingEnvelope.durationSeconds }`. The band and the printed
  reading are pinned to one artefact.

Served HTML (pre-hydration) already contains the figure — `grep -c '24\.98 s'` → `1`, inside
the `data-reading` `<text>` — so the reading is correct on first paint and after hydration,
at both widths. No `—` fallback anywhere on the live path.

Evidence: `probes/probe-l1c5.mjs`, `listen-desktop-1440.png`, `listen-mobile-390.png`,
`section-listen-1440.png`.

---

## Holds re-confirmed (not reopened)

### G-NEW-1 — "Ask Mini Vic" pill at 390 — **HOLD PASS** (with a recorded nuance)

The first pass at this nearly produced a false FAIL: a naive text match for *Ask Mini Vic*
binds to `button.skip-link.minivic-skip`, the a11y bypass control, which is parked off-screen
at `y = -45` by design. The pill under test is `.minivic-launcher__pill`. Corrected measurement:

| Width | `display` | `visibility` | `opacity` | rect | in viewport |
|---|---|---|---|---|---|
| 390 | `block` | `visible` | `1` | `106 × 29` @ `(208, 783)` | ✅ |
| 833 | `block` | `visible` | `1` | `112 × 30` @ `(625, 773)` | ✅ |
| 1440 | `block` | `visible` | `1` | `112 × 30` @ `(1232, 773)` | ✅ |

Text renders as `Ask Mini Vic`, `color: rgb(205,205,205)` on `background: rgb(10,10,10)`.
**No `display: none` at any width**, on the pill or any ancestor — the G-MV1 / G-NEW-1
regression is absent. `app/globals.css:396` holds `display: inline-block`; the live computed
value is `block` because `.minivic-launcher` is `display: flex` and flex items are blockified.
That is correct CSS, **not** a regression — recorded here so a later reviewer does not flag it.

**Nuance, recorded not failed:** `.minivic-dock` is `opacity: 0; pointer-events: none` while
the hero is on screen, becoming `opacity: 1; pointer-events: auto` from `#about` onward. This
is **width-independent** — identical at 390 and 1440 (see `probes/probe-dock-opacity.json`) —
so it does not hide the control on mobile and is not the dirty-tree hide G-NEW-1 guards
against. Flagging it only so the fade is a known, deliberate behaviour rather than a surprise.

| scrollY @390 | section | dock opacity | pointer-events |
|---|---|---|---|
| 0 | hero | `0` | `none` |
| 870 | hero | `0` | `none` |
| 2611 | about | `1` | `auto` |
| 12186 | skills | `1` | `auto` |
| 17409 | listen | `1` | `auto` |

### G-C1 — honest email labels — **HOLD PASS**

Every `mailto:` on the live page, with its subject:

| Section | Label | Subject |
|---|---|---|
| hero | `Email` | — |
| vitrine | `Email a project brief` | `Engagement enquiry — Vikram Deshpande` |
| listen | `Email a 20-minute-call agenda` | `20-minute call — Vikram Deshpande` |
| listen | `sarkar.vikram@gmail.com` | — |
| (footer) | `Contact support` | `Portfolio — support` |

No plate says **Book** or **Start a project**. Both engage plates take the "rename the plates"
branch of G-C1: each names the medium it actually is (*Email …*), so no plate promises a
calendar it cannot honour. Two `mailto:` links remain, but they are two honestly-labelled
emails rather than two conflicting promises — the failure mode G-C1 names ("two different
mailto promises") is not present. **R4 is still not satisfied by a real calendar URL** — that
part of G-C1 remains open, exactly as the launch instruction requires (a mailto is not an R4 PASS).

### Listen gold discipline — **PASS**

Full computed-style sweep of every element in `#listen` for `rgb(201,168,76)` across
`color`/`fill`/`stroke`/`border`/`background`: exactly **4** hits, all `stroke`, all on
`Listen_arrivalJawLeft/Right` paths — i.e. two arrival marks with closed (sourced) jaws,
consistent with "gold only on LinkedIn + GitHub". Gold is **not** on the reading, not on the
band, not a fill or background.

### GL health under forced SwiftShader — **PASS**

`?gl=force` with `--use-gl=swiftshader`; renderer reports
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)`.
**Zero `pageerror`s** across every run, including the full-page scroll walk. No repeat of the
R3F/React-19 page-wide crash class.

---

## G-A3 and G-X2 — measured, and both stay **FAIL**

These were not rubber-stamped. A first census taken from scroll-top showed 1 canvas page-wide
and would have over-reported the failure; scenes **unmount when scrolled away**, so the honest
measurement is per-section *while that section is in view*:

| Section | canvases in view | backing store | CSS box | page-wide mounted |
|---|---|---|---|---|
| hero | 1 | 720 × 730 | 1440 × 1460 | 1 |
| about | 1 | **192 × 192** | **384 × 384** | 1 |
| experience | 1 | 648 × 268 | 1298 × 536 | 1 |
| skills | 1 | 1248 × 579 | 1248 × 580 | 1 |
| vitrine | 1 | 1296 × 759 | 1296 × 759 | 2 |
| listen | 1 | 1440 × 900 | 1440 × 901 | 2 |

**G-A3 — FAIL.** `#about` does mount a GL canvas, but at `384 × 384` CSS px it is exactly
coincident with `svg.Compass_compass__KU_lT` (`384 × 384`). The GL lives *inside* the compass
widget rather than carrying the section. Compare Listen's full-bleed `1440 × 900`. The
recruiter's recall of `#about` is still the radar/compass widget, which is precisely what
G-A3 rules out. Heading reads `Ten dimensions, answered`.

**G-X2 — FAIL.** Six GL scenes exist page-wide, one per section, and never more than two are
mounted at once. G-X2 requires **≥ 7 visible cinematic scenes**. 6 < 7 on the measured live
build, and a 384 × 384 inset inside a widget does not read as a cinematic scene.

---

## Verdict

| Gate | Verdict | Basis |
|---|---|---|
| **G-L1 C5** (primary) | **PASS** | `[data-reading]` = `24.98 s`, `rgb(144,144,144)`, not gold, both viewports, live `b4b4a9a3` |
| G-NEW-1 | HOLD PASS | pill `106 × 29` in viewport @390, no `display:none` in the ancestor chain |
| G-C1 (honest labels) | HOLD PASS | no Book / Start-a-project plate; R4 calendar still open |
| Listen gold discipline | PASS | 4 gold strokes, arrival jaws only |
| GL health (`?gl=force`) | PASS | 0 page errors, SwiftShader |
| G-A3 | **FAIL** | `#about` GL is a 384 × 384 inset coincident with the compass SVG |
| G-X2 | **FAIL** | 6 GL scenes page-wide, requirement is ≥ 7 |

Per `reviewer.system-prompt.md` §3, the two FAILs must open a `feedback_refactor_loop`
task — they may not be silent-closed.

**Not claimed here:** this review does not assert O1/O5 cadence, and makes no frame-rate claim
(no 60 fps PASS is asserted off SwiftShader). No self-approval: the reviewer identity is
independent of the authoring agent for `t_l1_05`, and `6b4755c` (the C5 implementation) was
verified against live output rather than against its own commit message.
