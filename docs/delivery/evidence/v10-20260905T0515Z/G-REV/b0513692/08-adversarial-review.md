# 08 — Independent adversarial production review (ADV-1556Z lane)

**Task:** `t_rev_adv1556` · **Role:** reviewer / 3rd-party independent adversarial review (docs/prompt.md §5, effort max)
**Reviewer identity:** fresh session; did NOT author any 1556Z patch. Read-only.
**Live URL (sole SoT):** https://forgotten-mistory.web.app/ — localhost is not production.
**Probed:** 2026-09-05T17:03Z–17:22Z (UTC)

## Live build-commit(s) during this probe

| Order | build-commit | Notes |
|-------|--------------|-------|
| initial | `b2ac21be` | prior-FAIL baseline; deep browser + curl + ffprobe probe |
| **current (authoritative)** | **`b0513692`** | deploy landed **mid-review** (`consolidate: merge worktree-gv3-1556 / gnew1-1556 / gh1-placement-research`); re-probed live |

`curl -fsS https://forgotten-mistory.web.app/ | grep build-commit` → `b2ac21be` at 17:03Z, `b0513692` at 17:16Z.
Cache: `cache-control: public, max-age=0, must-revalidate` (verified).

Files changed `b2ac21b..b0513692`: `app/data/portfolio/listen.ts`, `app/data/portfolio/vitrine.ts`, `app/globals.css`, `components/sections/Vitrine/{Drawings,Vitrine}.module.css`, `docs/architecture/G-C1-HONEST-CTA.md`, `docs/delivery/evidence/.../G-H1/placement-research.md`, `tests/*`. Hero, About, assets, functions **untouched**.

---

## Overall verdict: **FAIL** (8 FAIL / 2 PASS)

Two gaps closed on live since the 1556Z FAIL (**G-NEW-1**, **G-C1**). The remaining eight P0 gaps — the ones that constitute the mandated cinematic/AI reinvention — remain FAIL on the current live build. Playwright-green, Deploy count, `data-scene` census, architecture markdown, and mailto-relabelling were **not** counted as matrix PASS.

| Gap | Verdict | Live evidence (b0513692 unless noted) |
|-----|---------|----------------------------------------|
| G-NEW-1 | **PASS** | MiniVic pill honest at 390 |
| G-C1 | **PASS** | Honest "Email …" labels, no fake booking product |
| G-V3 | **FAIL** | Rest-plate composited contrast not certifiable ≥4.5:1 on all six |
| G-H6 | **FAIL** | Colour hero, no PALETTE-EXCEPTIONS memo |
| G-H1 | **FAIL** | Two-column résumé landing, no dominant plane |
| G-A3 | **FAIL** | Radar dial is the content, GL field is not |
| G-L1 | **FAIL** | Reading stays "—", flagship instrument absent |
| G-M4 | **FAIL** | Cold `/api/chat` TTFB 3.67s; R3 avatar open |
| G-H5 | **FAIL** | 720p24 loop + 360p orphan + PNG dim mismatch |
| G-X2 | **FAIL** | 6 scene mounts, 1 GL canvas at a time, HyperFrames=0 |

**R3 full Higgsfield real-time avatar: OPEN (honest).** Not realtime; a 1280×720@24 loop + premade TTS with a "synthetic voice" banner. Correctly kept open, not Owner-blocked.

---

## Per-gap detail (binary, live evidence)

### G-NEW-1 — MiniVic pill frozen visible at all widths — **PASS**
`Runtime.evaluate` at emulated `innerWidth:390` (both `b2ac21be` and `b0513692`):
```
{innerWidth:390, pill:{text:"Ask Mini Vic", display:"block", visibility:"visible", opacity:"1", visibleInVp:true}}
```
No `display:none` below 834px on live. Accessibility snapshot exposes `button "Ask Mini Vic"`.

### G-C1 — real calendar OR honest rename — **PASS** (was FAIL on b2ac21be)
Live CTA hrefs + labels on `b0513692`:
- Listen close: **"Email a 20-minute-call agenda"** → `mailto:sarkar.vikram@gmail.com?subject=20-minute%20call…`
- Vitrine engage: **"Email a project brief"** → `mailto:sarkar.vikram@gmail.com?subject=Engagement%20enquiry…`

Both plates are now honestly labelled **"Email …"** (no longer "Book a 20-minute call" / "Start a project"), both resolve to the **same inbox** (allowed). No invented Cal.com/Calendly URL. `docs/architecture/G-C1-HONEST-CTA.md` present. Env audit (names only, never sourced/printed): `grep -E '^[A-Z][A-Z0-9_]*=' /root/.claude/.env.production | sed 's/=.*//' | grep -ciE 'cal|calendar|book|schedul|meet'` → **0** — no calendar key exists, so honest labels are the only correct design. Acceptance path (b) met.
> On `b2ac21be` this was FAIL: two different mailto promises labelled "Book" / "Start a project".

### G-V3 — six plates ≥4.5:1 composited at rest — **FAIL**
Live computed styles on `b0513692` show a **real remediation**: rest-plate `opacity` raised **0.62 → 0.82** (lit plate `opacity:1`). Analytical composited model over plate fill: lit ≈18.3:1, rest ≈9.9:1. **However this cannot be certified to the binary bar:**
- No reliable **composited pixel** measurement is obtainable in this review environment: CDP `Page.captureScreenshot` (clip + fromSurface) of every plate drawing region returns a **uniform `rgb(10,10,10)` surface** (107,226/107,226 px = channel 10) — the SVG/GL drawing layer does not composite into the captured surface. Sample retained at `shots/vitrine-rest-plate-surface-capture.png`.
- The CSS model ignores hairline anti-aliasing on **0.75px** strokes; halving AA coverage drops the model to ≈3.1:1 — below 4.5:1. Prior independent pixel sample was 3.60–4.24:1 at opacity 0.62.
- Plates **3 and 6** (indices 2, 5) expose **no measurable primary stroke** (`svg path` stroke = null).

Verdict: improved and plausibly near the threshold, but **not measured ≥4.5:1 composited on all six at rest** → does not clear the binary gate. Implementer must supply a per-plate composited pixel measurement (review capture path cannot see the drawing layer).

### G-H6 — B/W/gold OR palette-exception memo — **FAIL**
Hero portrait live is a **colour** photograph (`assets/my_avatar.avif`, computed `filter:none`; colour visible in first-fold screenshot). `components/sections/Hero/Hero.module.css:836` → `filter: saturate(1.02) contrast(1.03)`. `docs/architecture/PALETTE-EXCEPTIONS.md` **absent** on origin/main (`b0513692`). Colour-without-memo = FAIL.

### G-H1 — one dominant visual plane ≥~75% — **FAIL**
First fold (1440×900 and 390) is a **two-column résumé landing**: left = name plate "Vikram Deshpande" + role line + a four-line ATO CV paragraph + "See the evidence"/"Download CV" buttons; right = viewfinder-bracketed portrait card ("—Photograph · Melbourne"). No full-bleed video/GL plane at ≥~75% weight; the ledger/CTAs sit on the first fold. Screenshots: `shots/hero-desktop-1440`, `shots/hero-mobile-390`.

### G-A3 — recruiter recall is the GL field, not the radar — **FAIL**
Dominant recruiter-visible object in `#about` is the **`Compass_compass` SVG dial** (224×224, aria "Instrument face of ten dimensions", heading "Ten dimensions, answered"). `#about` contains **0 `<canvas>`**; `data-scene="about-field"` is an SSR census marker, not a live GL field driving recall.

### G-L1 — envelope band / measured reading / gold / marks — **FAIL**
Live Listen reading is **"—"** (by design: `Listen.tsx:39` "the reading between them stays '—': the section makes no claim"). No measured greeting duration, no visible envelope-driven instrument a recruiter can name, no arrival marks, no gold. The one filled CTA is the honest mailto (see G-C1). Flagship not delivered.

### G-M4 — Hosting `POST /api/chat` cold TTFB <1.5s — **FAIL**
`b2ac21be` true cold probe: **ttfb=3.670s** (http 200); warm 1.100s. `b0513692` warm-ish: 1.371s. The **cold** requirement (<1.5s) is not met; only the warm container clears it. Full R3 avatar correctly **OPEN** (720p loop + synthetic-voice banner).

### G-H5 — ≥1080p path / stop 360p / fix PNG — **FAIL**
`ffprobe` on live assets (both builds, byte-identical `content-length`):
- `assets/my-avatar.mp4` → **1280×720@24** h264 (not ≥1080p/4K), 1,096,301 B
- `assets/my-hero-avatar.mp4` → **640×360@24** h264, still HTTP 200, 160,156 B (360p orphan not withdrawn)
- `public/assets/my_avatar.png` → **900×502**, but `HeroPortrait.tsx:33` declares **1480×826** (dimension lie). No asset-ladder memo retracting the R5 claim.

### G-X2 — ≥7 visible cinematic 60fps scenes — **FAIL**
Live DOM: `[data-scene]` = **6** (`hero-atmosphere, about-field, career-strata, skills-bench, vitrine-field, listen-field`) + MiniVic viseme when open = the "7th". Only **1 `<canvas>` mounted at a time** (per-section GL field; e.g. `vitrine-field` 598×1308 when in view; `about` had 0). HyperFrames in product path = **0**. This is a scene-mount/viseme census, not ≥7 visible cinematic 60fps set-pieces.

---

## Why still FAIL (ranked)
1. The two closures (G-NEW-1, G-C1) are honesty/craft fixes, not the mandated reinvention. R1/R2/R3/R5/§14 remain untouched on live.
2. Substitution patterns are being retired honestly (mailto relabelled "Email", reading kept "—") — good — but the flagship instruments (G-L1 band, G-A3 GL field, G-X2 cinematic scenes) are still not built.
3. Assets and hero (G-H1/H5/H6) had **zero** commits in this deploy.
4. G-V3 is the only patched-but-unproven gap: a genuine opacity bump that this review cannot certify to ≥4.5:1 composited because the review capture path cannot rasterise the drawing layer; implementer must attach a per-plate composited measurement.

## Do NOT close on this build
G-V3, G-H6, G-H1, G-A3, G-L1, G-M4, G-H5, G-X2. Reopen any board "done" that still fails this live review (O2/O6). Next reviewer cycle → new folder `G-REV/<next-build-commit>/`.
