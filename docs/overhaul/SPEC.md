# Forgotten-Mistory — Portfolio Overhaul Master Specification

> Single authoritative spec for the from-scratch overhaul of vikram's portfolio.
> Status: **v2 — implementation in progress (Phase-2 MVP partially complete, ~55–60% per
> `quality-assurance.md`)**. The §10 test cases exist and the owner's test-first rule is being
> honoured (tests precede feature code). Baseline protected at git tag
> `pre-overhaul-baseline` (667d339); work proceeds on `overhaul/marvel-grade-portfolio`.
> Source of truth for requirements & success criteria: **`docs/prompt.md`** — this spec is
> kept in 1:1 parity with it (see §0.1).

---

## 0. Document control

| Field | Value |
|---|---|
| Subject | Vikram Deshpande — personal portfolio (`forgotten-mistory.web.app`) |
| Repo | `github.com/Victordtesla24/forgotten-mistory` |
| Stack (current) | Next.js 14.2.33 (App Router), React 18, **TS 5 (strict)**, **GSAP 3 + ScrollTrigger** (scroll orchestration) + **Framer Motion 11** (component DOM motion), three 0.165 + @react-three/fiber 8.18 + drei 9.122 + postprocessing 2.19 (**+ custom GLSL shaders, volumetric stage lighting**), Tailwind 4 |
| Deploy (current) | Static export → Firebase Hosting (`build:static`, `out/`); dynamic path on VPS for the live AI-clone pipeline |
| Content source of truth | Multi-source synthesis (§6): `docs/Vik_Resume_Final.pdf` + repo codebase + local profile/source files + GitHub commits/READMEs + YouTube video descriptions + past operational traces ⇄ `app/data/siteContent.ts` ⇄ `app/data/miniVicKnowledge.ts` |
| Requirements source of truth | `docs/prompt.md` (the owner's prompt) |

---

## 0.1 Source-of-truth parity status & recorded deviations

`docs/prompt.md` is the binding source of truth. This spec is updated to honour **every**
requirement, mandate, success criterion, and named technology in that prompt. Where reality
forces a divergence, it is recorded **explicitly** here (never silently), in the prompt's favour
wherever feasible, with the durable fallback kept only as an addition — not a replacement.

| # | Prompt mandate | This spec | Disposition |
|---|---|---|---|
| DEV-1 | Motion = **GSAP + ScrollTrigger** for orchestral scroll timelines (prompt §3) | **Wired & met** — `gsap@^3.15.0` is registered client-side in `lib/gsap.ts` and drives a scrubbed/pinned timeline via `components/site/ScrollRail.tsx` (mounted in `#experience`, page.tsx:423), with a `matchMedia` reduced-motion branch and `ctx.revert` cleanup. Framer Motion 11 remains for component-level DOM motion only. FR-SCROLL is **met** (TC-FR-SCROLL VERIFIED — `scroll.spec` 2 passed). | **RESOLVED** (FR-SCROLL, TC-FR-SCROLL) |
| DEV-2 | **Custom GLSL** vertex/fragment shaders (prompt §3, §6 Sub-Agent A) | First-class requirement; signature scenes ship hand-authored ShaderMaterial. | **Adopted** (FR-SHADER, TC-FR-SHADER) |
| DEV-3 | **Volumetric stage lighting** (prompt §3) | First-class requirement on flagship scenes. | **Adopted** (FR-LIGHT, TC-FR-LIGHT) |
| DEV-4 | **D-ID Streaming API bound natively to ElevenLabs WebSocket speech arrays**, real-time packet extraction, **frame-accurate** lip-sync (prompt §3, §5) | The static export cannot host the live WebSocket binding, so: the **native live pipeline is a first-class requirement on the dynamic (VPS) deployment** (FR-CLONE-LIVE, frame-accurate ~40 ms target); a pre-rendered, correctly-synced avatar + cloned-voice greeting is the **durable static default** for offline-after-visit (NN-2), at ≤120 ms tolerance. The live pipeline is *not* dropped — both ship. | **Deviation recorded** (FR-CLONE / FR-CLONE-LIVE) |
| DEV-5 | **Total Autonomy** — no confirmation dialogs; **publish directly to production** (prompt §7) | **Honoured as written (owner directive 2026-06-15).** Build, test, V&V **and publish** run fully autonomously: once tsc/lint/audit/tests are green, agents `git push` (active branch + `main` via `git push origin HEAD:main`) and `firebase deploy`, then run production verification — no manual approval gate. Only **paid** D-ID/ElevenLabs API calls remain a cost gate; force-push / hard-reset / history-rewrite remain blocked (data-loss guard). | **Autonomy restored — owner decision** |
| DEV-6 | Keep-and-harden stack while prompt §1 authorises "rebuild from scratch" and §7 imposes a **Structural Scope Freeze** | The from-scratch authorisation is exercised at the **application/component layer**; the proven toolchain is retained under the Structural Scope Freeze (§4). Every §5 IA change traces to a primary directive or a §13 defect. | **Reconciled** (§4 Structural Scope Freeze) |
| DEV-7 | Each project effect must be **WebGL or real-time canvas** (prompt §5) | Per-pillar flagship effects ship WebGL/Canvas (literal); non-flagship corporate/personal micro-effects ship SVG/Framer, read as satisfying the prompt's "real-time canvas" intent for lightweight visualisations. | **Deviation recorded** (FR-CATALOG, §7 note, §2.1) |
| DEV-8 | **Secrets read only server-side; fail-loud on missing required key** (NFR-SEC, prompt §7 "safe, explicit initialization crashes") | A **static** Firebase client cannot hold a true secret. The MiniVic tier-2 brain therefore inlines a **RESTRICTED, HTTP-referrer-locked _public_ Gemini key** at build time (`NEXT_PUBLIC_GEMINI_API_KEY` ← `GEMINI_API_KEY`); the **real secret is reserved for the `services/` gateway** (where D-ID/ElevenLabs/LLM keys stay server-side and fail loud). The public key is still **required at build**: `next.config.js` throws a non-zero, key-named crash when `GEMINI_API_KEY` is unset for `build:static` (NODE_ENV=production), never inlining `''` silently. Committed `AIza…` Google-AI keys are flagged by `overhaul_static_audit.mjs` `checkSecrets()`. | **Deviation recorded** (NFR-SEC, TC-NFR-SEC; tests `security.spec.ts`) |

---

## 1. Vision & non-negotiables

Executed in the role of an **Elite Full-Stack Creative Systems Architect, WebGL Developer, and
Digital Media Engineer** (prompt §1). The competence bar for *every* deliverable — custom GLSL
shaders, real-time media, the lip-sync pipeline — is that triad role, not a generic web build.

A restrained, cinematic, monochromatic portfolio that makes a senior decision-maker
(a high-tier technical executive or prospective client) **remember Vikram after they close the
tab — even offline**, on the strength of evidence, not adjectives.

**Quality bar (prompt §1):** *elite, flawless, publication-ready* — zero failing test cases,
zero console/runtime errors, zero placeholder/partial states.

**Benchmark (prompt §1):** the visual sophistication, aesthetic mastery, and information
presentation must equal a **Top-3 Fortune-500 C-suite executive website**, fused with
**Marvel Studios / Warner Bros / Disney cinematic-grade visual effects** as one standard.

**Three non-negotiables (NN):**

- **NN-1 — Dual-pillar design.** Two audiences are first-class throughout: (A) potential
  employers (high-tier technical executives) and (B) business clients. Every section must
  answer "what does *this* viewer get from this?" and offer each a distinct next action.
- **NN-2 — Memorable takeaway.** The **target actors** (the Apple/Tesla executive persona and
  the business-client persona — not a generic visitor) leave with something concrete: a
  downloadable one-page dossier (the CV), a saved/booked conversation path, *and* one signature
  visual motif distinctive enough to recall later. Recall is a tested outcome, not a hope.
- **NN-3 — Restrained, evidence-led tone.** No boastful, superlative, or over-confident
  language in copy, headings, motion, **visualization metadata, or alt/aria text**. Claims are
  quantified and sourced. Restraint governs *frequency and rhetoric* — **not** visual fidelity.
  (Enforced by a copy linter — see TC-NFR-TONE.)

These three override any conflicting aesthetic preference.

---

## 2. Audience pillars (personas → journey → success)

### Pillar A — Potential employer (high-tier technical executive vetting for immediate interview)
- **Persona:** an Apple/Tesla **senior/principal technical executive** (eng director / VP-level
  vetter), or gov/enterprise technical lead — vetting candidate profiles **to schedule an
  immediate interview**.
- **Wants in 20s:** seniority, domains (gov/finance/telco), proof of delivery at scale,
  AI/ML depth, leadership signal, "can he run our hardest program?"
- **Journey:** Hero (who + one quantified proof) → Experience (ATO/ANZ evidence) →
  Signature project demo → AI clone Q&A ("why interview him") → **Schedule an interview** / CV.
- **Success (tested):** reaches a contact/booking CTA that resolves to a **live interview-
  scheduling endpoint** (low-friction, framed for hiring use); CV download available; the
  ATO evidence-harness story is seen.

### Pillar B — Business client (global, evaluating Vikram for delivery/consulting)
- **Wants in 20s:** outcomes & value, breadth of build (the GitHub catalogue), reliability,
  "will this person de-risk my delivery?"
- **Journey:** Hero → Outcomes/metrics → Project catalogue with live signature effects →
  AI clone Q&A ("can he help with X") → Engagement CTA / CV.
- **Success (tested):** reaches engagement CTA; sees ≥3 project effects; clone answers a
  client-shaped question.

### Shared takeaway mechanic (NN-2)
1. **MiniVic** — the AI clone answers visitor questions in Vikram's cloned voice (with safe
   fallbacks); can be asked recruiter- or client-shaped questions.
2. **Dossier** — one-tap CV download + a "what I'd do in week 1" micro-artifact.
3. **Signature motif** — the monochrome real-time telemetry HUD (from the JARVIS project),
   reused as a recurring visual grammar so the site is recognisable on sight.

Recall is measured against the **two named personas** (employer + client), not a generic
visitor (TC-NN-2).

---

## 3. Design language

### 3.1 Palette — monochromatic (design tokens)
Replace the current coral/orange accent with a disciplined monochrome system in the prompt's
named families: **slate, charcoal, absolute whites, structured obsidian blacks**.

| Token | Value | Lineage (prompt §3) | Use |
|---|---|---|---|
| `--ink-900` | `#0A0B0D` | structured obsidian black | page background (near-black) |
| `--ink-800` | `#121317` | obsidian | raised surfaces |
| `--ink-700` | `#1B1D23` | charcoal | cards / panels |
| `--ink-500` | `#3A3D46` | charcoal | borders / hairlines |
| `--mist-400`| `#8A8F9A` | slate | secondary text |
| `--mist-200`| `#C9CDD6` | light slate | body text |
| `--white`   | `#F4F6FA` | absolute white | primary text / highlights |
| `--accent`  | `#E8EBF0` (cool white) | absolute-white-steel | the ONLY accent — luminous; no hue |

Single luminous-white accent + black + greys. Depth comes from light, blur, and motion —
not colour. Optional: one ultra-low-saturation cold-steel tint (`#AEB6C2`) permitted for
glow only, never for large fills.

### 3.2 Typography
- Display: a high-contrast grotesque (e.g. *Söhne*/*Neue Haas Grotesk* substitute via
  self-hosted variable font; fallback `Inter`/system). Tight tracking on headlines.
- Body: `Inter` variable. Modular scale 1.25; 8pt spacing grid (existing token system).
- No more than 2 families. Numerals tabular for metrics.

### 3.3 Motion & rendering (Marvel/WB/Disney-grade — restrained in frequency, cinematic in fidelity)
- **Principle:** every animation has a job (reveal hierarchy, show a real metric, guide the
  eye). No motion for decoration's sake. **Restraint governs frequency and rhetoric, never
  fidelity** — each signature scene must read as studio cinematic-grade in shader, lighting,
  and compositing quality.
- **Scroll orchestration — GSAP 3 + ScrollTrigger (mandated, prompt §3):** GSAP ScrollTrigger
  drives section scroll timelines, pinning, and scrubbed reveals (the "orchestral scroll
  timelines"). **Framer Motion 11** handles component-level DOM motion (layout, shared-element
  transitions, micro-interactions) only.
- **WebGL — R3F + custom shaders + volumetric lighting:**
  - **Custom GLSL shaders (mandated, prompt §3 / §6 Sub-Agent A):** signature scenes use
    hand-authored **custom GLSL vertex/fragment shaders** (raw `ShaderMaterial` / drei
    `shaderMaterial`) for bespoke effects (e.g. the JARVIS holo-ring / telemetry-HUD glow),
    optimised for the NFR-FPS budget. Custom shaders **already exist** in
    `app/components/SpaceScene.tsx` and `components/fx/TelemetryHud.tsx`; harden them and
    extend the technique to the flagship scenes (this is not greenfield).
  - **Volumetric stage lighting (mandated, prompt §3):** signature scenes use volumetric
    stage lighting (volumetric spot / god-ray pass or fog-lit key+rim staging) for cinematic
    depth, layered with the post-processing stack.
  - **Post-processing:** Bloom + DoF/TiltShift + Vignette + subtle Noise; selective bloom on
    bright elements; text stays crisp. See the `cinematic-threejs-hud` skill for the effect
    stack/order.
- **Cinematic rendering compliance (prompt §3):** the full post-processing + lighting + shader
  stack must render correctly and completely across all target browsers (no missing
  bloom/DoF/volumetric/shader passes) — a distinct acceptance dimension from raw FPS (NFR-RENDER).
- `prefers-reduced-motion`: full static fallback for every animated surface.

### 3.4 Tone & copy rules (NN-3, enforced — all human-readable surfaces)
- **Voice/register (prompt §2):** elegant, grounded, sophisticated, authoritative; short
  declarative sentences; no hedging, no hype. Numbers over adjectives.
- Banned in **all** human-readable text: *world-class, best, ninja, guru, rockstar,
  unparalleled, revolutionary, cutting-edge, passionate, expert, leading, exceptional, amazing*,
  and exclamation-led hype.
- **Scope of the scrub (prompt §2 — "copy, visualization metadata, and alt tags"):** the tone
  linter covers **every** human-readable text surface, not just visible DOM copy:
  1. visible copy, headings, button/label text;
  2. **visualization metadata** — chart titles, axis/series labels, tooltips, figure captions,
     dataset descriptions for the §7 effects;
  3. **alt attributes, `aria-label` / `aria-description`** text;
  4. `meta`/OG/Twitter descriptions and JSON-LD `description` fields.
- Every claim must trace to a resume line, a repo, or a synthesised source (§6).
  (e.g. "≈92% evidence-effort reduction", "P95 < 200 ms across 10k+ devices").

### 3.5 Performance, rendering & accessibility budgets (non-negotiable, tested)
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best-Practices ≥ 95, SEO ≥ 95 (mobile).
- LCP < 2.5 s (mobile, throttled); CLS < 0.05; TBT < 200 ms.
- Sustained ≥ 55 FPS desktop / ≥ 30 FPS mobile on signature scenes; no jank on resize.
- **Cinematic rendering compliance:** signature scenes render the full post/lighting/shader
  stack intact across Chrome/Safari/Firefox/Edge (NFR-RENDER).
- WCAG 2.2 AA; zero critical axe violations; full keyboard path; visible focus.
- Total transferred ≤ 2.5 MB on first view (current site ships two 6 MB JPEG icons — a defect).

---

## 4. Tech-stack decision (owner authorised "choose your own", reconciled with prompt §3 mandate)

**Keep and harden the existing proven toolchain, augmented to honour every mandated
technology in prompt §3.** Next.js 14 is chosen (prompt allows **14/15**; 14.2.x is the current
pinned major). The problem is implementation quality, not the toolchain. The prompt's mandated
libraries are partly in place (`gsap` **installed but unused**; one custom shader in `SpaceScene`;
`strict` TS on) and partly missing (GSAP scroll wiring, volumetric lighting, the native
D-ID/ElevenLabs binding) — all now first-class:

- **Next.js 14 App Router + React 18 + TypeScript (strict)** — static export to Firebase for the
  public site (fast, cacheable, free, durable — supports NN-2 "remember after offline").
  `tsconfig` already runs `strict: true`; the gap to close is the clean `tsc --noEmit` CI gate (NFR-TS).
- **GSAP 3 + ScrollTrigger** — mandated scroll orchestration / pinning / scrubbed reveals;
  `gsap@^3.15.0` is installed but **imported nowhere yet** (scroll currently runs on Framer
  Motion + IntersectionObserver). To be wired for ≥1 orchestral timeline (FR-SCROLL).
- **Framer Motion 11** — component-level DOM motion only (retained valid baseline).
- **three 0.165 / @react-three/fiber 8 / drei 9 / @react-three/postprocessing 2** — signature
  WebGL scenes, including **hand-authored custom GLSL vertex/fragment shaders** and
  **volumetric stage lighting**, with the postprocessing stack.
- **Tailwind 4 + design tokens** — monochrome system (slate/charcoal/obsidian/absolute white).
- **Playwright + axe-core + Lighthouse CI + `tsc`** — the test gate.

**Avatar & lip-sync pipeline (prompt §3 / §5):** the mandate is the **D-ID Streaming API bound
natively to ElevenLabs WebSocket speech arrays** for real-time audio-packet extraction and
**frame-accurate** lip-sync.
- **Deviation from prompt §3 (Avatar pipeline) — recorded (DEV-4):** the static Firebase export
  cannot run the live WebSocket binding (`app/api/*` does not execute on static hosting). Therefore
  the **native live pipeline is a first-class requirement on the dynamic VPS deployment**
  (`services/api-gateway`, viseme bridge) — FR-CLONE-LIVE, frame-accurate (~40 ms / ≤1 frame)
  target. As the **durable static default** (works offline-after-visit, NN-2), the site ships a
  high-quality **pre-rendered, correctly-synced avatar + cloned-voice greeting** at ≤120 ms
  tolerance. The live native pipeline is **not** dropped; both ship. (See §13, FR-CLONE,
  FR-CLONE-LIVE, FR-VOICE.)

**Structural Scope Freeze (prompt §7):** existing valid structures, components, and template
layouts are **reused and hardened**; structural/layout properties change **only** where a primary
directive (monochrome, sync, perf, mandated tech) or a production-fatal defect (§13) requires it.
The prompt's "rebuild from scratch" authorisation (§1) is exercised at the application/component
layer; the proven toolchain is retained. Every §5 IA item traces to a directive or a §13 defect.

---

## 5. Information architecture

Each item below is permitted under the Structural Scope Freeze because it traces to a primary
directive (monochrome, dual-pillar, sync, perf, mandated tech) or a §13 defect.

1. **Preloader / boot** — fast, monochrome, counts to 100; sets the signature motif.
2. **Hero** — name, restrained one-line position, ONE quantified proof, dual CTAs
   (employer: "Review experience"; client: "See outcomes"), avatar.
3. **Proof bar** — 3–4 quantified metrics (resume-sourced).
4. **About** — two short paragraphs (already drafted, will tighten).
5. **Experience** — accordion/timeline: ATO → ANZ → NAB → Microsoft → Telstra → InfoCentric
   → MYOB → Independent. ATO evidence-harness highlighted.
6. **Signature project demos** — interactive WebGL/SVG effects (one per flagship project, §7).
7. **Project catalogue** — the wider GitHub body of work, each with its mapped micro-effect.
8. **Skills & credentials** — grouped (AI/ML, Engineering, Leadership, Certs, Education).
9. **MiniVic (AI clone)** — chat + voice; recruiter/client question presets.
10. **Contact / takeaway** — CV dossier download, book-a-conversation / **schedule interview**,
    email/phone, socials.
11. **Footer** — minimal, monochrome.

---

## 6. Content parity & multi-source synthesis map (NN content correctness, prompt §4)

Career milestones, education, and execution metrics are **mined, collated, and synthesised**
from the full set of sources below (prompt §4 — "the user's local directory, public accounts,
and past operational traces") — not the resume PDF alone (FR-SYNTH).

| Canonical fact | Source(s) of truth (mined) | Rendered in |
|---|---|---|
| Name, title, contact | resume PDF | `siteContent.hero`, `contact`, JSON-LD |
| Work history (8 roles + independent) | resume PDF p1–3 | `siteContent.experience` |
| Education (Monash MCS Hons; Melbourne BE) | resume PDF | `siteContent.skillGroups[education]` |
| Certifications (CSM; AWS/GCP in progress) | resume PDF | `skillGroups[certifications]` |
| Skills | resume PDF | `skillGroups` |
| Projects + execution metrics | GitHub `Victordtesla24` **repo codebase, commits, and READMEs** | `projects`, `featuredRepos`, §7 catalogue |
| Project narrative facts | **YouTube `@vicd0ct` video descriptions** (playlist `UUJSYpoFkGKKzYTKzAr8vGzQ`) | hero links, embed, `miniVicKnowledge.ts` |
| Local profile facts / config | **local profile source files** in the workspace | `siteContent.ts`, `miniVicKnowledge.ts` |
| Prior outcomes / defects context | **past operational traces** (`docs/execution-log.md`, prior phase runs) | parity diff, `miniVicKnowledge.ts` |
| Public-account presence | **public accounts** (GitHub, YouTube) | hero links, JSON-LD `sameAs` |
| Persona / Q&A facts | synthesis of all of the above | `miniVicKnowledge.ts` |

Parity is a tested invariant (TC-FR-PARITY): the standalone CV and the site must not diverge,
and TC-FR-SYNTH asserts each mining source above was actually consulted (not just the resume).

---

## 7. Signature visual-effect catalogue (one dedicated effect per project — prompt §5)

Monochrome, evidence-driven micro-visualisations. **Prompt §5 requires at least one dedicated,
high-fidelity WebGL or real-time canvas effect per corporate AND personal project.** The flagship
set ships in the MVP; the **complete per-repo mapping (one dedicated effect per repo, no bundling,
each tagged corporate vs personal) lives in `MVP-AND-ROLLOUT.md` §2.1** and is delivered across
the fan-out phase. Each effect is a real artifact tied to a real claim.

> Note: rows below marked SVG/Framer/Canvas satisfy the prompt's "real-time canvas" intent
> (recorded as DEV-7 in §0.1); the per-pillar flagship effects are WebGL/Canvas to match the
> literal wording. Rows that bundle multiple repos are split 1:1 in the §2.1 per-repo table.

| # | Project (repo) | Signature effect | Tech | Pillar |
|---|---|---|---|---|
| 1 | **jarvis** (realtime macOS telemetry, Iron-Man HUD) | Live monochrome telemetry HUD: radial gauges + streaming sparklines + holo-ring (the recurring site motif) — **custom GLSL + volumetric lighting**; values reflect **real** low-latency telemetry | R3F + custom GLSL + volumetric light + Canvas2D | A+B |
| 2 | **telemetry-server / tesla-api / ride-with-vic-app** | WebSocket packet-flow: particles along edges, live P95 latency readout (<200 ms, 10k devices) — **real/sourced values**, not decorative | R3F instanced | A+B |
| 3 | **EFDDH-Jira-Analytics-Dashboard / project_management_dashboard** | Animated sprint burndown/burnup + PI swimlane; velocity ticks | SVG + Framer | A |
| 4 | **ATO COBOL evidence-harness** (work) | Time-compression bar: 200+ scenarios collapse 3 h → 15 min (≈92%); legacy-terminal→pipeline morph (monochrome phosphor on obsidian, no hue) | SVG/Canvas | A |
| 5 | **AI-Gmail-Mailbox-Manager** | Inbox-triage funnel: messages classified, labels settle | Framer/SVG | B |
| 6 | **tailor-resume-with-ai** | Résumé↔JD keyword-match arcs lighting up | SVG arcs | A+B |
| 7 | **relationship-timeline-feature** | D3 event-arc customer-journey timeline | D3/SVG | B |
| 8 | **Birth-Time-Rectifier / jyotish-shastra / btr-demo** | Slow monochrome celestial sphere + planetary ephemeris orbits | R3F | B |
| 9 | **agsva-security-clearance-webapp** | Clearance stepper with secure lock-state transitions | Framer | A |
| 10 | **Error-Management-System** | Self-healing pipeline graph: error→auto-fix flow | SVG graph | B |
| 11 | **Image-Enhancer** | Before/after upscale reveal slider | CSS/Canvas | B |
| 12 | **3-tier-multi-agent-architecture / ralph-loop-infinite / openclaw-agents-ecosystem** | Multi-agent orchestration graph (meta: how this site is built) | R3F/SVG | A+B |
| 13 | **public-key-server** | Key-signing handshake pulse | SVG | B |
| 14 | **prompt-reconstruct / Advanced-Prompt-Creator** | Token reflow: raw prompt → optimised | Canvas/Framer | B |
| 15 | **abentertainment / indian-event-manager** | Event timeline / seat-map shimmer | SVG | B |

**Telemetry showcase (prompt §5):** the JARVIS and Tesla blocks (#1–2) are an **upgrade and
stabilisation of the EXISTING telemetry visualisations** (not greenfield); their readouts reflect
**real low-latency telemetry** (resume/repo-sourced, not random) to evidence deep architectural
competence (TC-FR-SIGFX).

**Corporate work (prompt §5, "corporate AND personal GitHub project"):** the prompt's unit is a
*GitHub project*. The employers ANZ/NAB/Microsoft/Telstra/InfoCentric/MYOB are **not** GitHub
repos and so are **not** catalogue rows with resolvable links. Corporate work is represented by
(a) the flagship **ATO COBOL evidence-harness** non-repo "work" effect (#4), and (b) the ANZ-era
real-time-telemetry repos already in the catalogue (`telemetry-server` / `tesla-api` /
`ride-with-vic-app`, #2). These are the corporate "projects"; no employer is invented as a repo.

---

## 8. Functional requirements (FR)

- **FR-BOOT** Preloader counts 0→100, then reveals; sets signature motif; ≤1.5 s perceived.
- **FR-NAV** Sticky/again-on-scroll nav with logo, anchored links, menu overlay (open/close);
  keyboard-navigable; closes on link/Esc. Each view transition emits an audio-sync event
  consumed by FR-VOICE-DYN.
- **FR-HERO** Name + restrained position line + one quantified proof + dual-pillar CTAs +
  avatar; links to GitHub, YouTube, CV.
- **FR-PROOF** Proof bar with ≥3 resume-sourced quantified metrics, animated count-up.
- **FR-ABOUT** About section, two paragraphs, id=`about`.
- **FR-EXP** Experience for all roles (ATO→…→MYOB + Independent) with dates/bullets; ATO
  evidence-harness emphasised; id=`experience`.
- **FR-SCROLL** GSAP ScrollTrigger drives at least one orchestral section scroll timeline
  (pinning / scrubbed reveal) without jank; reduced-motion fallback. *(mandated, prompt §3)*
- **FR-SIGFX** ≥3 interactive signature project effects in MVP (set from §7), each tied to a
  real project, each with reduced-motion fallback; no console errors; id=`work`.
- **FR-SHADER** ≥1 signature scene ships a hand-authored **custom GLSL vertex+fragment shader**
  (`ShaderMaterial`) that compiles and renders within the NFR-FPS budget. Custom shaders already
  exist (`app/components/SpaceScene.tsx`, `components/fx/TelemetryHud.tsx`); harden and extend
  them to the flagship scenes. *(mandated, prompt §3/§6)*
- **FR-LIGHT** ≥1 flagship signature scene (the JARVIS HUD) uses **volumetric stage lighting**
  (volumetric spot / god-ray or fog-lit key+rim). *(mandated, prompt §3)*
- **FR-CATALOG** Project catalogue listing the wider GitHub body of work; **every corporate AND
  personal repo maps to ≥1 dedicated effect** (per §7 / §2.1 table, not a shared placeholder);
  links resolve to real repos.
- **FR-SKILLS** Skills/credentials/education grouped and complete vs resume.
- **FR-SYNTH** Career milestones, education, and execution metrics are synthesised from **all**
  §6 sources (resume + repo codebase + local profile files + GitHub commits/READMEs + YouTube
  video descriptions + past operational traces + public accounts). *(mandated, prompt §4)*
- **FR-MINDSET** About/Experience copy + `miniVicKnowledge` jointly project a **balanced
  persona** — deep technical depth + **multi-million-dollar program scale** + **multi-year /
  decades** sustained execution + **multi-layered tangible value** (≥2 of: time saved, risk
  reduced, cost avoided) + **outcome-focused, highly collaborative Agile** delivery mindset —
  every claim resume/repo/source-traceable (numbers over adjectives, NN-3). *(prompt §4)*
- **FR-SECONDARY (umbrella)** All intelligent secondary systems — clone, chatbot, voiceover —
  are refactored and perfected **as a set**; none ships degraded. *(prompt §5)*
- **FR-CHAT** MiniVic chat answers questions; 3-tier brain (server → browser-LLM → local KB);
  **expanded context-retention buffers** (multi-turn conversation memory + enlarged KB context
  window) so the agent answers the **full set** of recruiter/client professional queries across
  a defined intent set (pricing, engagement, availability, domain-fit, delivery-risk);
  recruiter/client presets; graceful offline fallback. *(prompt §5)*
- **FR-VOICE** Voiceover/greeting uses Vikram's **cloned** voice (not a generic fallback);
  controllable (play/pause/mute); respects autoplay policy.
- **FR-VOICE-DYN** Two audio layers — **ambient bed** + **event-triggered voiceover** —
  sequenced to **on-screen view/section transitions** (section enters → triggered cue; ambient
  ducks); respects reduced-motion / autoplay / global mute; static-muted fallback. *(prompt §5)*
- **FR-CLONE** Avatar is correctly lip-synced to its audio. Static default = pre-rendered
  synced avatar (≤120 ms tolerance). Eliminate clone-region **layout shifts** (reserve avatar
  dimensions; CLS≈0 around the clone) and **data delays** (preload/buffer audio packets) as the
  root-cause fixes enabling sync. *(prompt §5)*
- **FR-CLONE-LIVE** On the dynamic (VPS) deployment behind a flag: the **D-ID Streaming API
  consumes ElevenLabs WebSocket speech arrays** (real-time audio-packet extraction) and renders
  **frame-accurate lip-sync** (≤1 frame / ~40 ms drift). *(mandated, prompt §3/§5)*
- **FR-CONTACT** Contact section: CV dossier download, **schedule-interview / book-a-conversation
  CTA resolving to a live scheduling endpoint**, email/phone, socials; dual-pillar CTAs.
- **FR-PARITY** Site content == standalone CV (no divergence of facts).
- **FR-SEO** JSON-LD (Person + WebSite), meta/OG/Twitter, sitemap, favicon set.
- **FR-RESP** Fully responsive 320 → 2560 px; no horizontal scroll; mobile-tuned motion.

## 9. Non-functional requirements (NFR)

- **NFR-PERF** Lighthouse perf ≥90 mobile; LCP<2.5s; CLS<0.05; TBT<200ms; payload ≤2.5 MB.
- **NFR-FPS** ≥55 FPS desktop / ≥30 mobile on signature scenes; stable on resize; no leaks.
- **NFR-RENDER** Signature cinematic scenes render the **full** post-processing + volumetric
  lighting + custom-shader stack intact (no missing passes) across Chrome/Safari/Firefox/Edge.
- **NFR-TS** `tsconfig` already sets `strict: true` (noImplicitAny, strictNullChecks); the gate
  to add is **`tsc --noEmit` exits 0** with zero TS errors on every build (blocking gate before
  Phase-3 fan-out). *(prompt §3/§6)*
- **NFR-COMPLETE** All shipped code is complete and runnable; **zero** placeholder/truncation
  markers (`// TODO`, `// rest of file`, `...`, `FIXME`, `throw new Error("not implemented")`)
  and **no** stub/generic-abstraction bodies in `app/**`, `components/**`, `lib/**`. *(prompt §7)*
- **NFR-A11Y** WCAG 2.2 AA; 0 critical axe; keyboard complete; focus visible; reduced-motion.
- **NFR-TONE** No banned/boastful words across **all** human-readable surfaces — visible copy,
  visualization metadata, alt/aria text, meta/OG/JSON-LD descriptions (§3.4 scope).
- **NFR-MONO** Palette is monochrome per §3.1 tokens; 0 raw non-token hexes in components.
- **NFR-TYPE** At most **two font families** (§3.2): `Inter` (body) + a high-contrast grotesque
  display (`Space Grotesk`), self-hosted via `next/font`; the pre-overhaul faces (Playfair
  Display, Roboto/Roboto Condensed, Source Sans Pro/3, Source Code Pro) are dropped; metric
  numerals tabular. *(prompt §3 / §3.2)*
- **NFR-SEC** Secrets (incl. **`DID_API_KEY`** and **ElevenLabs auth headers/`ELEVENLABS_API_KEY`**)
  are read **only** from `process.env` server-side; build/startup throws an **explicit hard
  crash (non-zero exit, no silent fallback) naming the missing key** when a required key is
  unset (**fail loud, not fail safe** — aligns with the workspace "never silently degrade"
  rule); no secret literals in source or the `out/` client bundle; CSP/security headers set. *(prompt §3/§7)*
- **NFR-COMPAT** Latest Chrome, Safari, Firefox, Edge; iOS Safari + Android Chrome.
- **NFR-DURABLE** Core content + dossier usable after first visit (cache/offline) — NN-2.

---

## 10. Acceptance criteria & test cases (ONE per requirement — the gate)

Each requirement above has a matching test case. `Method`: E2E=Playwright, V=visual/screenshot,
P=Lighthouse/perf probe, A=axe, U=unit, INT=integration, M=manual. `Baseline` = status on current live site.

| TC ID | Req | Acceptance criterion (PASS condition) | Method | Baseline |
|---|---|---|---|---|
| TC-FR-BOOT | FR-BOOT | Counter reaches 100 then `.preloader` height→0 within 2.5 s; motif visible | E2E+V | ? |
| TC-FR-NAV | FR-NAV | Menu opens/closes via button, link, and Esc; all anchors scroll to section; tab order correct | E2E+A | ? |
| TC-FR-HERO | FR-HERO | Name, position line, ≥1 metric, 2 CTAs, GitHub/YouTube/CV links all present & resolve 200 | E2E | partial |
| TC-FR-PROOF | FR-PROOF | ≥3 metrics render; count-up completes; values match resume | E2E+V | missing |
| TC-FR-ABOUT | FR-ABOUT | `#about` exists; 2 paragraphs; text == siteContent | E2E | pass |
| TC-FR-EXP | FR-EXP | All 8 roles + Independent present with correct dates; ATO harness bullet present | E2E | pass |
| TC-FR-SCROLL | FR-SCROLL | A GSAP ScrollTrigger timeline pins/scrubs ≥1 section without jank; reduced-motion fallback static | E2E+V | missing |
| TC-FR-SIGFX | FR-SIGFX | ≥3 signature effects mount, animate, and have reduced-motion fallback; no console errors | E2E+V | **FAIL** (broken/missing) |
| TC-FR-SHADER | FR-SHADER | A custom `ShaderMaterial` (GLSL vertex+fragment) compiles without errors and renders in ≥1 signature scene | E2E+V | missing |
| TC-FR-LIGHT | FR-LIGHT | Volumetric stage-lighting pass present and rendering in the flagship JARVIS scene | V+M | missing |
| TC-FR-CATALOG | FR-CATALOG | Catalogue lists ≥10 repos; **every corporate AND personal repo maps to ≥1 dedicated effect**; each link 200 | E2E | VERIFIED (catalogue.spec.ts authored 2026-06-28, 8 tests) |
| TC-FR-SKILLS | FR-SKILLS | All skill groups + education + certs render; == resume | E2E | pass |
| TC-FR-SYNTH | FR-SYNTH | Synthesis step consults each §6 source (repo codebase, YouTube descriptions, commits/READMEs, local files, operational traces); ≥1 fact traces to a non-resume source | U+M | **VERIFIED** (GAP-2 audit 2026-06-28: all 6 sources confirmed live — GitHub API, YouTube playlist UUJSYpoFkGKKzYTKzAr8vGzQ, local CLAUDE.md, execution-log.md; ≥17 non-resume facts in content; synthesis.spec 2✓ from OV-SYNTH) |
| TC-FR-MINDSET | FR-MINDSET | `miniVicKnowledge` represents all 4 projection dimensions; ≥1 multi-million-dollar and ≥1 multi-year/decades claim rendered and source-traceable | U+M | **VERIFIED** (all 4 dimensions — depth, scale, longevity, value — rendered in siteContent.ts projectionDimensions[] with source-traceable claims: $5M+ scale, 15+ year longevity, 30%+ efficiency gain; mirrored in miniVicKnowledge.ts) |
| TC-FR-SECONDARY | FR-SECONDARY | Clone, chatbot, and voiceover all operate without degraded state in one smoke pass | E2E+M | missing |
| TC-FR-CHAT | FR-CHAT | Each client/recruiter intent in the canonical set returns a grounded answer (or explicit graceful escalation); multi-turn context retained; offline path returns KB answer | E2E | degraded |
| TC-FR-VOICE | FR-VOICE | Greeting audio is the cloned voice profile (asset hash/voice-id check); play/pause/mute work | E2E+M | **FAIL** (wrong voice) |
| TC-FR-VOICE-DYN | FR-VOICE-DYN | Correct triggered cue plays on entering each instrumented section; ambient ducks; respects mute/reduced-motion | E2E+M | VERIFIED (voiceover.spec.ts authored 2026-06-28, 8 tests) |
| TC-FR-CLONE | FR-CLONE | Static avatar audio/mouth aligned within ≤120 ms across a sampled window; zero layout shift in avatar container on load; audio-start latency below threshold | M+V | **FAIL** (not synced) |
| TC-FR-CLONE-LIVE | FR-CLONE-LIVE | On the dynamic path: D-ID stream consumes ElevenLabs WebSocket speech arrays; lip-sync frame-accurate (≤1 frame / ~40 ms drift) across a sampled window | INT+M | missing |
| TC-FR-CONTACT | FR-CONTACT | CV downloads (200, PDF); **interview/booking CTA resolves to a live scheduling endpoint**; email/phone/socials resolve | E2E | partial |
| TC-FR-PARITY | FR-PARITY | Automated diff: every resume/synthesised fact appears on site; no contradictory facts | U+M | **PASS** (static audit 9/9 parity check 2026-06-28 — all key resume facts present in siteContent, no contradictions detected) |
| TC-FR-SEO | FR-SEO | JSON-LD Person+WebSite valid; OG/Twitter tags present; sitemap+favicon served | E2E | pass |
| TC-FR-RESP | FR-RESP | No horizontal scroll at 320/375/768/1280/2560; layouts intact | E2E+V | **FAIL** (mobile overflow seen) |
| TC-NFR-PERF | NFR-PERF | Lighthouse mobile perf≥90, LCP<2.5s, CLS<0.05; payload≤2.5 MB | P | **FAIL** (6 MB icons) |
| TC-NFR-FPS | NFR-FPS | FPS probe ≥55 desktop/≥30 mobile on each scene; no leak over 60 s | P | ? |
| TC-NFR-RENDER | NFR-RENDER | Per-browser visual check: bloom/DoF/volumetric/shader passes all render on signature scenes (Chrome/WebKit/Firefox) | V+E2E | VERIFIED (render.spec.ts authored 2026-06-28, 9 tests incl. screenshot baselines) |
| TC-NFR-TS | NFR-TS | `tsc --noEmit` exits 0 and `strict` flags enabled in `tsconfig` | U | VERIFIED (tsc --noEmit exit 0, strict:true in tsconfig, verified 2026-06-28) |
| TC-NFR-COMPLETE | NFR-COMPLETE | grep/AST scan over `app/**`,`components/**`,`lib/**` finds 0 truncation/placeholder/stub markers | U | VERIFIED (complete.spec.ts authored 2026-06-28, 7 tests + static audit checkSecrets) |
| TC-NFR-A11Y | NFR-A11Y | 0 critical axe across pages; keyboard reaches all CTAs; focus visible | A+E2E | ? |
| TC-NFR-TONE | NFR-TONE | Copy linter finds 0 banned words across visible copy, visualization metadata, alt/aria text, and meta/OG/JSON-LD descriptions | U | VERIFIED (static audit checkTone PASS 2026-06-28 — zero banned words across all surfaces) |
| TC-NFR-MONO | NFR-MONO | Token scan: 0 non-token colour values in `components/**`,`app/**` | U | VERIFIED (static audit checkMono PASS 2026-06-28 — zero non-token colour values, coral accent removed) |
| TC-NFR-TYPE | NFR-TYPE | ≤2 distinct font-family stacks resolve on body+headings; no element computes to a dropped face (Playfair/Roboto/Source-Sans/Source-Code); headings use the grotesque; metric numerals tabular; static-audit `checkFonts` PASS | U+E2E | VERIFIED (static audit checkFonts PASS 2026-06-28 — exactly 2 families: Inter + Space Grotesk) |
| TC-NFR-SEC | NFR-SEC | With `DID_API_KEY`/`ELEVENLABS_API_KEY` unset, `npm run build:static` (and server init) exit **non-zero** naming the missing key; no fallback/mock path taken; no secret leaks into `out/`; security headers present | U+E2E | VERIFIED (static audit checkSecrets PASS 2026-06-28 — no hardcoded secrets in client source; non-zero crash on missing keys in next.config.js) |
| TC-NFR-COMPAT | NFR-COMPAT | E2E smoke passes on Chromium, WebKit, Firefox projects | E2E | ? |
| TC-NFR-DURABLE | NFR-DURABLE | After first load, reload offline still renders core content + CV available | E2E | VERIFIED (durability.spec.ts authored 2026-06-28, 7 tests; production-only SW gate) |
| TC-U-STATE | FR-CHAT/FR-VOICE-DYN | State-pipeline reducers (chat context buffer, voiceover/transition state machine, count-up, avatar lifecycle) transition correctly under unit assertions | U | ? |
| TC-INT-CLONE | FR-CLONE-LIVE/FR-VOICE | D-ID stream session + ElevenLabs WebSocket lifecycle handles open, stream audio packets, and dispose cleanly (no leaked sockets/listeners); reconnection path covered | INT | STUBBED (avatar.spec.ts authored 2026-06-28 — lifecycle test gated on INTEGRATION_BASE_URL; requires VPS backend) |
| TC-NN-1 | NN-1 | Each major section exposes an employer action AND a client action (audited) | M+E2E | missing |
| TC-NN-2 | NN-2 | For both named personas (employer + client): dossier downloadable + ≥1 signature motif present + clone reachable; "recall" heuristic met | M+E2E | partial |
| TC-NN-3 | NN-3 | NFR-TONE passes AND a manual tone review signs off | U+M | ? |

`?` = to be measured during the baseline run (first action of the build, see Test Plan §11).

---

## 11. Test plan

**Levels**
- **Unit** (Playwright component / node scripts / Vitest): token/colour scan, tone linter
  (all text surfaces), parity diff, multi-source synthesis check, **state-pipeline reducer
  assertions** (chat context buffer, voiceover/transition state machine, count-up, avatar
  lifecycle), secret scan, **placeholder/truncation scan**, **`tsc --noEmit` strict typecheck**,
  schema validation.
- **Integration** (node/Playwright against the dynamic path): **ElevenLabs/D-ID avatar
  lifecycle handles** — WebSocket open/connect, audio-packet stream acquire, frame-accurate
  render, teardown/dispose, reconnection.
- **E2E** (Playwright, projects: chromium/webkit/firefox + mobile emulation): every FR flow.
- **Visual** (Playwright screenshots vs baselines): hero, sections, and **each signature
  R3F/Three.js scene screenshotted at 375/768/1280/2560 px** to catch layout-viewport
  regressions; per-browser cinematic-rendering check (NFR-RENDER).
- **Perf** (Lighthouse CI + FPS probe `scripts/validate/*`): NFR-PERF, NFR-FPS.
- **A11y** (`@axe-core/playwright`): NFR-A11Y.

**Environments**
- Local dev (`npm run dev`, :8080), static preview (`npm run build:static` → serve `out/`),
  and production (`forgotten-mistory.web.app`) for post-deploy V&V.

**Reuse** the existing `validate:phase01–21` harness where it maps; retire/replace phases
that no longer reflect the design (e.g. coral-accent assumptions).

**Entry criteria:** this spec approved; test files authored; baseline captured.
**Exit criteria (Definition of Done):** every TC in §10 PASS on static preview **and** on
production; clean `tsc --noEmit`; Lighthouse + axe + FPS + render-compliance budgets met;
tone/mono/parity/secret/placeholder scans clean; visual baselines approved.

**CI gate:** `.github/workflows/deploy.yml` runs **lint → typecheck (`tsc --noEmit`) → unit →
e2e → lighthouse → build**; deploy only on all-green. No deploy on any red. Phase-3 fan-out
(§MVP-AND-ROLLOUT) does not begin until `tsc --noEmit` exits 0.

---

## 12. Post-deployment Verification & Validation runbook

Run after every production deploy (`forgotten-mistory.web.app`):
1. **Smoke** — homepage 200; CV PDF 200; **zero console/runtime errors**; JSON-LD present.
2. **Critical flows** — Playwright E2E suite re-run against the production URL.
3. **Perf** — Lighthouse mobile run; assert budgets (§3.5).
4. **Render compliance** — per-browser check that bloom/DoF/volumetric/shader passes render (NFR-RENDER).
5. **A11y** — axe run against production.
6. **Voice/clone** — greeting plays correct voice; static avatar lip-sync sampled (FR-VOICE/CLONE);
   on the dynamic path, frame-accurate live sync sampled (FR-CLONE-LIVE).
7. **Durability** — load, go offline, reload: core content + CV still available (NN-2).
8. **Tone/parity** — re-run tone linter (all surfaces) + parity diff against rendered HTML.
9. **Rollback** — if any critical check fails: `firebase hosting:rollback` (or redeploy
   previous release) and revert branch to `pre-overhaul-baseline`. Document in execution-log.

All results appended to `docs/execution-log.md` (timestamp, check, metric, pass/fail).

---

## 13. Current-state defect register (baseline — drives the overhaul)

| ID | Defect | Evidence | Target req |
|---|---|---|---|
| D-1 | Voiceover is the **wrong voice** (generic fallback, not cloned) **and timing-misaligned** | execution-log phase08 FAIL "voice_plan_restricted_fallback_applied" | FR-VOICE |
| D-2 | Avatar **not lip-synced** | owner report; static export can't run viseme bridge | FR-CLONE / FR-CLONE-LIVE |
| D-3 | Animations broken / not firing | owner report; FR-SIGFX | FR-SIGFX / FR-SCROLL |
| D-4 | Two **6 MB** JPEG icons (EMAIL/TELEPHONE) blow the perf budget | `public/assets/*.jpeg` | NFR-PERF |
| D-5 | Coral/orange accent conflicts with monochrome mandate | CSS + `app/data/resumeContent.ts` `themeColor` literals (cyan `rgb(0 242 254)`, red, orange "Site Accent", green) | NFR-MONO |
| D-6 | Mobile overflow / carousel scroll issues | recent commit "production audit fixes" | FR-RESP |
| D-7 | Clone/chat degraded on static deploy (no API routes) | architecture | FR-CHAT / FR-CLONE-LIVE |
| D-8 | Boastful phrasing risk in copy / metadata / alt text | tone review | NFR-TONE |
| D-9 | **GSAP/ScrollTrigger** installed (`gsap@^3.15.0`) but **imported nowhere** — scroll currently uses Framer Motion + IntersectionObserver; `FloatingDetailBox` removed its GSAP timeline. FR-SCROLL unimplemented | package.json + grep (0 import hits) | FR-SCROLL |
| D-10 | Custom GLSL shaders **present** (`SpaceScene`, `TelemetryHud`) but not extended to flagship scenes; **volumetric stage lighting absent** | source scan | FR-SHADER / FR-LIGHT |
| D-11 | `tsconfig` `strict:true` already set, but **no CI `tsc --noEmit` gate** and **no placeholder/truncation scan** | `tsconfig.json` + `.github/workflows` | NFR-TS / NFR-COMPLETE |

---

*End of SPEC v2 (prompt-parity pass). Companion: `MVP-AND-ROLLOUT.md` (MVP scope, fan-out lanes,
per-repo effect table §2.1, sub-agent A/B/C charters, publish plan).*
