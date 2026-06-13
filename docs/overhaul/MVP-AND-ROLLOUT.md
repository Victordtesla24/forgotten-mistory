# Overhaul — MVP scope, fan-out lanes, rollout

Companion to `SPEC.md`. Defines the MVP for the approval checkpoint, the parallel work
lanes, and the publish plan.

---

## 1. MVP scope (the approval build)

A complete, deployable single-page portfolio that proves the design language and clears the
core gate — not every project effect, but enough to judge the direction.

**In the MVP**
- Monochrome design system (tokens, type, motion primitives) — replaces coral accent.
- Boot/preloader (signature motif seed) + sticky nav + responsive shell (no overflow).
- Hero (dual-pillar CTAs, one quantified proof, avatar) + proof bar (count-up metrics).
- About + full Experience (all roles, ATO evidence-harness highlighted).
- **3 signature WebGL/SVG effects** from §7: (1) JARVIS telemetry HUD [site motif],
  (2) WebSocket packet-flow latency, (3) ATO evidence-harness time-compression.
- Project catalogue (≥10 repos, real links, monochrome cards w/ motif).
- Skills/credentials/education.
- MiniVic chat (3-tier brain; recruiter/client presets) — text working; voice greeting
  using the **cloned** voice; avatar shown with corrected pre-rendered sync.
- Contact/takeaway (CV download, schedule-interview / book-a-conversation CTA to a live
  scheduling endpoint, socials).
- SEO/JSON-LD, a11y AA, perf budget met, monochrome + tone scans clean.

**Deferred to post-MVP fan-out**
- Remaining project micro-effects (the full per-repo table, §2.1).
- Live realtime D-ID lip-sync via the VPS dynamic path (FR-CLONE-LIVE, behind a flag) —
  D-ID Streaming API ↔ ElevenLabs WebSocket speech arrays, frame-accurate (~40 ms).
- Advanced "week-1 dossier" micro-artifact.

**MVP Definition of Done:** TC-FR-BOOT/NAV/HERO/PROOF/ABOUT/EXP/SCROLL/SIGFX(×3)/SHADER/LIGHT/
CATALOG/SKILLS/CHAT/VOICE/CLONE/CONTACT/SEO/RESP + TC-NFR-PERF/RENDER/TS/COMPLETE/A11Y/TONE/MONO/SEC
all PASS on static preview; visual baselines captured. (CHAT/VOICE/CLONE gate the very D-1/D-2/D-7
baseline defects the MVP exists to fix — they must not be declared done unverified.)
- **Clean TypeScript compilation (`tsc --noEmit` exits 0, `strict: true`) is a BLOCKING gate**
  before Phase-3 fan-out begins (SPEC NFR-TS).
- **Zero console/runtime errors across the entire MVP build** (not only signature scenes) — the
  prompt's "fully operational, error-free" bar (prompt §6).

---

## 2. Phase 3 — Recursive scaling via multi-agent parallel orchestration (fan-out lanes)

Per prompt §6 Phase 3, the validated MVP scales out through **automated sub-agentic
orchestration**: each lane is executed by an isolated sub-agent running **concurrently** where
the dependency graph permits (own files, no shared mutable state, so they compose without
conflict). The three sub-agent charters named in the prompt are bound to lanes L5/L7/L8 below
(**Sub-Agent A** = GLSL shaders, **Sub-Agent B** = ElevenLabs streaming audio pipes,
**Sub-Agent C** = resume schema fields). An internal validation loop (§3) runs after each
feature integration block.

| Lane | Owns | Key files |
|---|---|---|
| **L1 Design system** | tokens, type, GSAP/ScrollTrigger + Framer motion primitives, Tailwind theme | `design-tokens.json`, `app/globals.css`, `lib/motion.ts` |
| **L2 Shell & nav** | layout, preloader, nav, responsive grid, footer | `app/layout.tsx`, `components/site/{Preloader,Navigation}.tsx` |
| **L3 Hero & proof** | hero, proof bar, avatar | `components/site/{Hero,HeroAvatar,ProofBar}.tsx` |
| **L4 Experience** | timeline/accordion | `components/site/ExperienceAccordion.tsx` |
| **L5 Signature FX — Sub-Agent A** | the WebGL/SVG scenes; **hardens/extends existing custom GLSL shaders** (`SpaceScene`, `TelemetryHud`) + adds volumetric stage lighting | `components/fx/*` (exists), `app/components/SpaceScene.tsx`, `components/fx/shaders/*` (new) |
| **L6 Catalogue** | project cards + micro-effects (per §2.1 per-repo table) | `components/site/ProjectsCatalogue.tsx` |
| **L7 MiniVic — Sub-Agent B** | chat (expanded context buffers), brain, voice, avatar sync; **configures automated ElevenLabs streaming audio pipes** (WebSocket speech-array subscription → real-time audio-packet extraction → buffered playback feeding the viseme bridge) | `components/MiniVicBot.tsx`, `lib/miniVicBrain.ts`, `app/api/*`, `services/api-gateway/*` |
| **L8 Content/parity — Sub-Agent C** | multi-source synthesis (§6); **updates/hardcodes resume schema fields** | `app/data/*`, `docs/Vik_Resume_Final.pdf` |
| **L9 Test/perf/a11y** | Playwright, Lighthouse, axe, `tsc`, placeholder/secret scans, audits | `tests/**`, `scripts/validate/*` |

Lanes L1→L2→L3/L4/L6 are sequential-ish (depend on tokens); L5/L7/L8/L9 run alongside.

### 2.1 Per-repo dedicated-effect table (one dedicated effect per project — prompt §5)

Prompt §5 requires **at least one dedicated effect per corporate AND personal GitHub project**.
Each row is a **real, link-resolvable** `github.com/Victordtesla24/<repo>` (verified against the
live account, March 2026) with its own effect (no bundling) — gated by TC-FR-CATALOG's "each link
returns 200". Repos surfaced later by the GitHub mining step (FR-SYNTH) are appended here as
discovered, each with its own effect — never a shared placeholder. All effects are monochrome
(NFR-MONO). Non-flagship rows ship SVG/Framer per DEV-7.

| Repo (real) | Type | Dedicated effect | Tech | Pillar |
|---|---|---|---|---|
| jarvis | personal | Telemetry HUD: gauges + sparklines + holo-ring (site motif) | R3F + custom GLSL + volumetric light + Canvas2D | A+B |
| telemetry-server | personal | WebSocket packet-flow along edges | R3F instanced | A+B |
| tesla-api | personal | Live P95 latency dial (real values) | R3F + Canvas | A+B |
| ride-with-vic-app | personal | Route/trip telemetry trace | Canvas2D | B |
| EFDDH-Jira-Analytics-Dashboard | personal (ANZ-era) | Sprint burndown/burnup animate | SVG + Framer | A |
| project_management_dashboard | personal | PI swimlane + velocity ticks | SVG + Framer | A |
| AI-Gmail-Mailbox-Manager | personal | Inbox-triage funnel; labels settle | Framer/SVG | B |
| tailor-resume-with-ai | personal | Résumé↔JD keyword-match arcs | SVG arcs | A+B |
| relationship-timeline-feature | personal | D3 event-arc customer-journey timeline | D3/SVG | B |
| Birth-Time-Rectifier | personal | Celestial sphere | R3F | B |
| containerised-birth-time-rectifier | personal | Containerised rectification pipeline trace | Canvas/SVG | B |
| jyotish-shastra | personal | Planetary ephemeris orbits | R3F | B |
| btr-demo | personal | Rectification convergence sweep | Canvas | B |
| rishi-prajnya | personal | AI career-guidance flow / Q&A constellation | SVG/Canvas | A+B |
| agsva-security-clearance-webapp | personal | Clearance stepper with secure lock-state transitions | Framer | A |
| Error-Management-System | personal | Self-healing pipeline graph: error→auto-fix | SVG graph | B |
| Image-Enhancer | personal | Before/after upscale reveal slider | CSS/Canvas | B |
| 3-tier-multi-agent-architecture | personal | Multi-agent orchestration graph (meta) | R3F/SVG | A+B |
| ralph-loop-infinite | personal | Recursive loop spiral | Canvas | B |
| openclaw-agents-ecosystem | personal | Agent-claw grasp/dispatch pulse | SVG | B |
| public-key-server | personal | Key-signing handshake pulse | SVG | B |
| prompt-reconstruct | personal | Token reflow: raw→optimised | Canvas/Framer | B |
| Advanced-Prompt-Creator | personal | Prompt-tree expansion | SVG | B |
| abentertainment | personal | Event timeline shimmer | SVG | B |
| indian-event-manager | personal | Seat-map shimmer | SVG | B |
| vik-legal-defence | personal | Case-timeline / evidence dashboard reveal | SVG | B |
| adblocker | personal | Filter-rule match pulse | Canvas/SVG | B |

**Corporate work effects (non-repo — excluded from TC-FR-CATALOG link resolution).** Employers
(ANZ, NAB, Microsoft, Telstra, InfoCentric, MYOB) are **not** GitHub repos, so they are **not**
catalogue rows. Corporate work is represented by: the flagship **ATO COBOL evidence-harness**
"work" effect (SPEC §7 #4 — time-compression bar, legacy-terminal→pipeline morph, monochrome),
and the ANZ-era real-time-telemetry repos already listed above (`telemetry-server` / `tesla-api`
/ `ride-with-vic-app`). No employer is invented as a repo, and no employer effect misattributes
the engagement (e.g. Microsoft was an Azure ML telemetry gap-analysis, not a cloud migration;
Telstra was customer-journey scorecards, not network latency).

**Excluded repos (non-portfolio — no effect, by design).** `forgotten-mistory` (this site),
`EFDDH-Jira-Dashboard` (near-empty duplicate of `EFDDH-Jira-Analytics-Dashboard`),
`hostinger-vps-backup`, `claude-designs`, `Codex`, `chris-cole-website` (template test),
`cursor-uninstaller`, `cursor-vscode-anti-fake-coding-system`, `frontend`, `general-work`
(private), `cursor-tutor` (private). Listing them keeps "every project covered" provable and
honest rather than silently dropped.

---

## 3. Iteration loop (per lane / per feature integration block)

1. Write/extend the test for the lane's TCs (red).
2. Implement to green.
3. Visual + perf + a11y check.
4. Tone/mono/parity scan.
5. Append result to `docs/execution-log.md`.

---

## 4. Publish plan (owner-gated)

> **Deviation from prompt §7 (Total Autonomy) — recorded (SPEC DEV-5).** Prompt §7 mandates fully
> autonomous execution that **publishes directly to production** with no confirmation/verification
> gates. This publish plan **intentionally overrides** the direct-to-production clause per the
> owner's standing local-first workspace rule (`~/.codex/AGENTS.md`, `CLAUDE.md`): all build,
> test, and V&V steps run fully autonomously, but the **final push/deploy remains owner-gated**.
> To honour full autonomy instead, change this section to auto-deploy on all-green CI. Owner
> decision.

Local-first per owner's standing instruction; deploy/push only on explicit OK.
1. `npm run build:static` → serve `out/` → run full gate on static preview.
2. Owner reviews MVP (screenshots / local preview).
3. On OK: push branch → PR → CI green → `firebase deploy` (or CI deploy job).
4. Post-deploy V&V runbook (SPEC §12) against production.
5. Rollback path: `firebase hosting:rollback` + revert to `pre-overhaul-baseline`.

---

## 5. Risk register

| Risk | Mitigation |
|---|---|
| Live lip-sync needs a server the static site lacks | Ship synced pre-render as default; live path behind flag on VPS |
| ElevenLabs plan restricts cloned voice (D-1) | Pre-generate greeting from the correct voice id; cache as static asset; verify voice-id in test |
| WebGL FPS on mobile | Instancing, merged geometry, DPR cap, reduced-motion fallbacks, throttled CanvasTexture |
| Scope (one effect per ~38 repos) | Flagship 3 in MVP; rest catalogued + batched in fan-out |
| Perf regressions from media | Replace 6 MB JPEG icons with SVG; AVIF/WebP; lazy-load; budget test |
| Tone drift toward hype | Automated banned-word linter + manual review gate |
