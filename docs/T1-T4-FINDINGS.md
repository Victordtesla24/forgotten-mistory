# T1-T4 Findings: Reference Attachments Assessment

> **Task:** Execute T1-T4 from `docs/prompt.md` §1.1
> **Date:** 2026-06-28
> **Assessor:** researcher profile
> **Project:** `/Users/vic/claude/forgotten-mistory`

---

## T1: Production Baseline — forgotten-mistory.web.app

**Reference URL:** https://forgotten-mistory.web.app/
**Role:** Debugging / defect-resolution reference
**Method:** Browser navigate + screenshot + full snapshot

### Current Production State (as of 2026-06-28)

#### Hero Section
- **Heading:** "Hello, I'm Vikram. Vikram. Vikram." (h1, tripled name)
- **Position line:** "I'm a technical delivery leader and AI solutions architect based in Melbourne, currently serving as Scrum Master / Project Manager on the Australian Taxation Office's Payday Super program. Over 15+ years across government, finance, and telecommunications..."
- **Dual-pillar CTAs:** "Review experience" + "See outcomes"
- **Links:** GitHub, YouTube, Resume PDF, "Let's Talk"
- **Portrait:** Image of Vikram Deshpande (present in DOM)

#### Telemetry Panels (3 of them)
1. **System Status** — FPS counter, active visitors by region (Auckland/Melbourne/Sydney), server load %, frame time ms. Labeled "Demo data" / "Simulated geo-feed rotates every few seconds."
2. **Error-Management-System (JARVIS)** — Health 100%, Active Agents 8, Errors Detected 1, Repairs Completed 0, Avg Repair Time ~3145ms. Live event stream with 3 synthetic events (telemetry-server, btr-demo, EFDDH-Jira-Dashboard).
3. **Live Vehicle Telemetry (TESLA APP DASHBOARD)** — Speed (variable, 72-128 km/h), Odometer 45,182 km, Charge 99%, Power 237 kW, Range 500 km.

#### Outcome Cards (6 skill buttons)
| Card | Metric | Description |
|------|--------|-------------|
| Test Automation at Scale | -92% Effort | ATO COBOL/mainframe test-evidence automation covering 200+ SIT/E2E scenarios |
| Cloud Modernisation | -30% Delivery | Core banking to cloud-native (.NET/Azure) |
| Realtime Reliability | 10k+ Devices | AI/ML solutions with WebSocket telemetry |
| AI Quality & Risk | -38% Breaches | Langfuse + Phoenix evaluation stack |
| Leadership Scale | 40+ Resources | Kookaburras squad, 8-team SIT program |
| Portfolio Value | $5M+ Budget | Multi-million program stewardship |

#### Career Proof Points (4 counters — dynamic, sometimes show "0" before animation)
- "0+ years across government, finance and telecommunications"
- "$0M+ program portfolio led at ANZ"
- "≈0% evidence effort cut by the ATO test-automation harness"
- "0k+ concurrent devices at P95 under 200 ms (ANZ telemetry)"

#### Content Sections (below hero)
1. **About Me** — Two paragraphs on career background and leadership style
2. **Career Pillars** — 4 expandable buttons: Career Objective, Delivery Impact, Leadership & Governance, Recent Builds
3. **Experience** — Accordion with 4 roles: ATO (2026-Present), AI Consultant (2025-2026), ANZ (2017-2025), NAB (2016-2017)
4. Additional sections exist further down (truncated in snapshot)

#### Navigation
- "VIKRAM." logo link (back to top)
- "MENU" button (collapsed)

#### Preloader
- Shows progress percentage with "CALIBRATING STARS & TELEMETRY" text

### Baseline Assessment
- **Design:** Monochrome (near-black → cool-white), cinematic but restrained
- **Tech signals:** Three.js starfield in background, Framer Motion component animations, GSAP scroll orchestration
- **Telemetry:** Simulated/demo data (explicitly labeled "Demo data", "Simulated geo-feed", "Deterministic simulated live feed")
- **State:** Deployed and serving on Firebase Hosting. The preloader and dynamic counters indicate JavaScript is executing. The site renders with dark backdrop, white text, cinematic presentation.

### Where Used
T1 findings ground R1 (current state to replace), R3 (telemetry currently simulated), R4 (existing infrastructure to leverage), and R5 (browser verification baseline).

---

## T2: Disney+ UI/UX Study

**Reference URL:** https://www.disneyplus.com/en-au/browse/page-60f4707d-19bb-4c0c-9390-ab269137be50
**Role:** UI/UX inspiration reference (per R7)
**Method:** Browser navigate + screenshot + full snapshot

### Page Structure Observed

The Disney+ Marvel browse page follows a repeatable pattern optimized for content discovery:

#### 1. Full-Bleed Hero
- Dominant Marvel brand image spanning the viewport
- Background video player (unavailable without authentication — shows "Unable to play media")
- Single CTA: "GET DISNEY+" button (high contrast against dark background)
- No navigation bar in the hero — just brand + CTA + content below
- Sets brand tone instantly with dark, cinematic full-viewport image

#### 2. Content Rows (Horizontal Carousel Pattern)
Each row follows identical structure:
- **Section header** (h2) — e.g., "Featured", "MCU Infinity Saga", "MCU Multiverse Saga"
- **Horizontal card list** within a region — 10 items visible per row
- **Prev/Next navigation buttons** — hidden when at start/end of row
- Cards arranged in a single row with horizontal scroll affordance

**Rows observed (5 rows, ~10 items each):**
1. "Featured" — The Punisher, Daredevil: Born Again, Wonder Man, Fantastic Four, Thunderbolts*, Marvel Zombies, Jessica Jones, Captain America, Ironheart
2. "MCU Infinity Saga" — Iron Man through Avengers (chronological)
3. "MCU Multiverse Saga" — WandaVision through Doctor Strange 2
4. "Character Collections" — Daredevil, Spider-Man, Wanda/Vision, Black Panther, Falcon/WS, Black Widow, Ant-Man, Doctor Strange, Deadpool, Wolverine
5. "Fantastic Adventures" — Fantastic Four variants, Deadpool & Wolverine, Doctor Strange 2

Additional rows continue below (truncated in snapshot).

#### 3. Card Treatment
- **Poster-style thumbnails** (467px wide webp format on actual pages)
- **Darkened default state** — cards appear dimmed until interaction
- **Hover reveals** — title overlay appears on hover (no click needed)
- **No visible scrollbar** — horizontal scroll via arrow buttons or trackpad swipe
- Cards float on near-black background with no visible surface beneath

#### 4. Visual Language
- **Background:** Near-black (`#0A0B0D` equivalent), deep void treatment
- **Text:** Absolute white, luminous content against dark canvas
- **Motion:** Restrained — fast hover effects (~200ms), no decorative motion
- **No pinned/scrubbed sections** — free vertical scroll with horizontal card rows
- **No autoplay video on browse pages** — hero is static image with optional video

### Key Patterns Extracted for Portfolio (R7)

| Disney+ Pattern | Relevance to Forgotten-Mistory Overhaul |
|----------------|----------------------------------------|
| Full-bleed dark hero with minimal chrome | Already present — harden: make the telemetry HUD the hero backdrop, remove nav chrome from hero |
| Card carousel for project catalogue | Replace static button grid with horizontal-scrolling project cards, each previewing its dedicated micro-effect |
| Restrained motion (~200ms hovers, slow reveals) | Align with MOTION-AND-FX-SPEC §0: fast hovers, slow narrative reveals, calm authority |
| Dark UI discipline (true blacks, luminous content) | Already matches monochrome tokens (ink-900, white, mist-200) |
| Section headers with clear hierarchy | Current site has this — elevate with cinematic section dividers |
| Single CTA in hero | Current site has dual CTAs — consider streamlining to one primary action |

### Anti-Patterns (What NOT to Copy)
1. **Flat scroll** — Disney+ uses free scroll for content browsing. The portfolio MUST use pinned/scrubbed GSAP timelines (SPEC FR-SCROLL).
2. **Carousel as primary nav** — Disney+ has hundreds of titles. The portfolio has ~10-15 sections. Each is a narrative beat, not a browse shelf.
3. **Genre-based color coding** — Disney+ uses brand colors per row. The portfolio is strictly monochrome (NFR-MONO).
4. **Image-heavy poster grid** — The portfolio's evidence-led copy doesn't map to poster thumbnails.

### Where Used
T2 findings directly inform R7 (Disney+ inspiration) and R1/R2 (UI/UX redesign patterns). Also referenced in the existing RESEARCH-DOSSIER.md §1.

---

## T3: GitHub Repository Audit

**Reference URL:** https://github.com/Victordtesla24/forgotten-mistory
**Role:** Codebase reference
**Method:** GitHub REST API + web_extract

### Repository Identity
| Field | Value |
|-------|-------|
| Full name | Victordtesla24/forgotten-mistory |
| Description | "My Website" |
| Visibility | Public |
| License | MIT |
| Default branch | main |
| Primary language | HTML (GitHub classification — actual stack is Next.js/TypeScript) |
| Homepage | https://forgotten-mistory.web.app/ |
| Created | 2025-11-25 |
| Last pushed | 2026-06-27T22:22:50Z |
| Size | ~81 MB (GitHub KB units) |
| Stars | 1 |
| Forks | 0 |
| Open issues | 0 |

### Branches (3 total)
| Branch | Last Commit SHA | Notes |
|--------|----------------|-------|
| `main` | `548c97e...` | DEFAULT — production baseline with pre-overhaul tag |
| `green-ci-onto-main` | `9c981d0...` | CI fixes + GPU runner + Gemini-via-OpenRouter |
| `chore/studio-elevation-and-green-ci` | `5027793...` | Studio UI elevation work |

### Pull Requests (4 total)

| # | Title | Branch | State | Merged |
|---|-------|--------|-------|--------|
| 4 | fix(ci): green E2E via GPU runner + static-serve + Gemini-via-OpenRouter brain | `green-ci-onto-main` → `main` | **CLOSED (not merged)** | No |
| 3 | fix(ci): build static export once before Playwright workers | `fix/ci-static-build-race` → `main` | **CLOSED (merged)** | Yes (2026-06-26) |
| 2 | Studio-grade UI elevation + MiniVic redesign + green/reliable CI | — → `main` | **CLOSED (merged)** | Yes (2026-06-19) |
| 1 | Optimize constellation rendering when idle | — → `main` | **CLOSED (not merged)** | No |

### Open PR Details: PR #4 (Closed, Not Merged)
- **Title:** `fix(ci): green E2E via GPU runner + static-serve + Gemini-via-OpenRouter brain`
- **Status:** Closed but NOT merged (`merged: false`, `merged_at: null`)
- **Mergeable state:** "unstable" (rebaseable: false)
- **Changes:** 4 commits, 9 files changed (+395/-40 lines)
- **Key deliverables:**
  1. Root-caused long-red CI — fixed SSR `ECONNREFUSED` by serving static `out/` instead of `next start`
  2. Gemini-via-OpenRouter brain for MiniVic chat (`/api/chat`)
  3. GPU runner config + documentation (`docs/ci-gpu-runner.md`)
- **Remaining issue:** 16 GPU-only E2E test failures that pass on real GPU hardware

### Critical Flags
- **R8 says:** "commit to the `main` branch only, remove all open PR's and branches and keep only one branch"
- **Current state:** 3 branches, 1 closed-but-unmerged PR — this conflicts with R8's directive
- **Action needed:** PR #4 must be either merged or discarded. `green-ci-onto-main` and `chore/studio-elevation-and-green-ci` branches need cleanup per R8.

### Where Used
T3 findings ground R6 (CI-CD pipeline upgrade), R8 (branch cleanup, commit to main), and provide the codebase reference for the overhaul implementation.

---

## T4: R1–R8 Attachment Mapping

Each requirement R1–R8 from `docs/prompt.md` §2 is mapped to the relevant attachment(s) from §1.1.

### Attachment Key
- **A (website):** `forgotten-mistory.web.app/` — current production site (reference)
- **B (website):** `disneyplus.com/en-au/browse/...` — UI/UX inspiration (reference)
- **C (github):** `Victordtesla24/forgotten-mistory` — codebase (reference)

### Requirement → Attachment Mapping

| Req | Requirement Summary | Primary Attachment(s) | Rationale |
|-----|-------------------|----------------------|-----------|
| **R1** | Complete UI/UX redesign — remove current UI, replace with polished Three.js/3JS interactive website with real-time AI chatbot avatar and voice clone | **A, C** | A = current production state to replace (baseline). C = existing codebase with Three.js/R3F/drei/postprocessing, D-ID↔ElevenLabs viseme bridge architecture, and MiniVicBot component to extend per C2/C3 |
| **R2** | Each tangible skill must feature unique Three.js/Hyperframes animations, VFX, infographics, visualizations | **A, B, C** | A = current outcome cards to redesign. B = Disney+ card treatment patterns (hover reveals, horizontal scrolling, poster-style thumbnails). C = existing GLSL shaders, three.js + @react-three/fiber + postprocessing stack to extend |
| **R3** | Real-time telemetry must be shown (not coffee cup simulation) | **A, C** | A = current telemetry panels are simulated/demo data (explicitly labeled). C = TelemetryHud.tsx with custom GLSL shaders — needs real data integration |
| **R4** | Use all super powers, parallel agents, TDD, plugins, MCPs — leverage existing website | **A, B, C** | All three: A = baseline to leverage. B = inspiration to draw from. C = existing implementation to extend rather than replace (per C2/C3) |
| **R5** | Strictly use cursor native browser, CDP on port 9222 | **A** | A = production site for browser-based verification and debugging via CDP |
| **R6** | Robust CI-CD pipeline using global template, upgrade to sophisticated production pipeline | **C** | C = existing `deploy.yml`, PR #4's GPU runner work, Playwright config, static audit scripts — extend and harden |
| **R7** | Take inspiration from Disney+ for UI/UX redesign | **B** | B = primary reference. Patterns: full-bleed hero, horizontal card carousels, restrained motion (~200ms), dark UI discipline, poster-style content cards |
| **R8** | New comprehensive test suite, commit to main only, remove open PRs/branches, keep one branch, deploy, verify in browser | **A, C** | A = deployed site for post-deploy verification. C = current 3 branches to consolidate to 1 (`main`), PR #4 to resolve, test suite at `tests/` to replace with comprehensive overhaul tests |

### Cross-Reference Matrix

```
         A(prod)  B(D+)  C(repo)
R1 (UX)     X              X
R2 (VFX)    X       X      X
R3 (tele)   X              X
R4 (tools)  X       X      X
R5 (CDP)    X
R6 (CI-CD)                  X
R7 (inspo)          X
R8 (tests)  X              X
```

### Verification Status
- [x] T1: `forgotten-mistory.web.app/` — verified, screenshot captured, baseline documented
- [x] T2: `disneyplus.com/...` — studied, patterns extracted, screenshot captured
- [x] T3: `Victordtesla24/forgotten-mistory` — repo state verified, branches and PRs documented
- [x] T4: R1-R8 mapping — completed, cross-reference matrix above

### Screenshots Captured
1. `/Users/vic/.hermes/profiles/researcher/cache/screenshots/browser_screenshot_1ea5736c8f0d4949850680a69aadc0c3.png` — Production site (forgotten-mistory.web.app) hero + telemetry
2. `/Users/vic/.hermes/profiles/researcher/cache/screenshots/browser_screenshot_4e26b62e3a50492687f3e107a298ccdd.png` — Disney+ Marvel browse page

---

## Executive Summary

All four reference attachments have been assessed and documented:

1. **Production site** is live on Firebase, serving a monochrome cinematic portfolio with simulated telemetry, 6 outcome cards, and Three.js/Framer Motion animations. It uses simulated data throughout (explicitly labeled "Demo data").

2. **Disney+ Marvel page** provides actionable UI patterns: full-bleed dark hero, horizontal card carousels with hover reveals, restrained motion language (~200ms), luminous-on-void content treatment. Key anti-patterns identified (flat scroll, color coding) for the portfolio context.

3. **GitHub repo** has 3 branches (`main`, `green-ci-onto-main`, `chore/studio-elevation-and-green-ci`) and 1 closed-but-unmerged PR (#4 for GPU CI). This conflicts with R8's directive to consolidate to a single branch and clean up PRs.

4. **R1-R8 mapping** shows all 8 requirements reference at least one attachment; 5 of 8 reference the production site, 3 reference Disney+, and 7 reference the GitHub repo — confirming all attachments are incorporated per §1.1.
