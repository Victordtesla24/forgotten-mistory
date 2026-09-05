# GAP BACKLOG — patch immediately (parallel)

Generated from ADV-REVIEW-20260905. Each gap is a board task. Spawn §5 profiles only via `/root/.sub-agents/hierarchy/profile_map.yaml`.

## P0 — ship in next 1–3 cadence windows

| ID | Section | Directive | Primary files | Profile |
|----|---------|-----------|---------------|---------|
| G-H1 | hero | Reinvention: ≤1 headline, ≤1 sentence, ≤1 CTA group, **dominant full-bleed** visual (video or GL). Remove ledger/disclaimer/availability from first fold. | `Hero.tsx`, `Hero.module.css`, `hero.ts` | analyst-programmer |
| G-H2 | hero | Atmosphere is the product, not wallpaper: reduce stage scrim; mount GL without idle deferral that blanks first paint; plan HyperFrames or equivalent signature (no fake PASS). | `HeroAtmosphere.tsx`, `atmosphere.glsl.ts`, `Scene.tsx` | solutions-architect → analyst-programmer |
| G-H3 | global | Purge non B/W/gold chrome: body blue-steel washes; stop shipping Tailwind red/orange utilities in prod CSS. | `app/globals.css`, build/CSS pipeline | cleanup-agent + analyst-programmer |
| G-A1 | about | Sourced evidence strings use `--gold` / `--gold-light` (C-8). | `About.module.css` | analyst-programmer |
| G-A2 | about | Replace cool-steel hatch with token greys/white. | `About.module.css` | analyst-programmer |
| G-S1 | skills | Add real R3F/GLSL flagship behind Bench (section currently has **zero** WebGL). | `Skills.tsx`, new `SkillsField.*` | analyst-programmer |
| G-V1 | vitrine | Neighbor plates must not look empty; default visible stroke or pre-draw. | `Drawings.tsx`, `Drawings.module.css` | analyst-programmer |
| G-V2 | vitrine | Client engagement CTA after curated work. | `Vitrine.tsx`, `vitrine.ts` | analyst-programmer |
| G-M1 | minivic | Remove `/api/realtime` + `/api/chat-with-vic` from send path; go straight to `/api/chat`. | `MiniVicBot.tsx`, `lib/miniVicBrain.ts` | analyst-programmer |
| G-M2 | minivic | Regenerate `public/assets/minivic-greeting.mp3` to match rewritten text intro (premade voice OK). | greeting asset + build script | analyst-programmer |
| G-M3 | minivic | Stream chat or warm instance so first answer token &lt;1.5s; drop `provider`/`model` from client payload. | `functions/index.js`, MiniVicBot | analyst-programmer |

## P1 — next windows

| ID | Directive |
|----|-----------|
| G-H4 | Replace 720p24 avatar with researched full-bleed placement; retire orphan `my-hero-avatar.mp4` or upscale path toward R5 |
| G-E1 | Experience: in-section CV dossier link; uplift strata toward signature (not wallpaper) |
| G-R1 | Align live brain with §0.4 (OpenRouter → Anthropic OAuth); stop advertising OpenAI as success |
| G-X1 | HyperFrames / ≥7 signature scenes plan — architecture task, then incremental ships |

## Parallelism rules

- Max 5 concurrent per profile; serialize ultracode/Opus.
- Each lane: own worktree → push branch → Deploy consolidate (`deploy.yml` + `fm-deploy-cadence.timer`).
- Independent `reviewer` on **live URL** after each Deploy (O2/O6). FAIL → feedback_refactor_loop.
- Never Hermes. Never ANTHROPIC_API_KEY. Never ask Owner.
