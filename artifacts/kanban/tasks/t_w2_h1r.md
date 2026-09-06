# t_w2_h1r — WAVE-2 research — G-H1 hero set-piece prior art: three concrete first-fold compositions (dominant plane ≥75%, photograph IN the plane, one headline, one sentence, one CTA group, ledger below the fold) achievable with the existing 4K atmosphere GLSL, the 3840x2160@24 portrait master and zero credits; plus G-X2 prior art for the seventh cinematic scene

**Status:** ready · **Priority:** 95 · **Parents:** — · **Created:** 2026-09-06T00:56:51.256Z

## YOUR ROLE
researcher — research (docs/prompt.md §5). ADV-REVIEW-20260905T2315Z §Hero: live composition is a stacked hire landing over a smoky GL wallpaper — not a full-bleed set-piece; recruiter cannot name it in one sentence. R2: six data-scene slots, GL reads as wallpaper, not ≥7 cinematic scenes. This research feeds the solutions-architect (t_w2_h1sa) who will write the design brief the analyst-programmer builds. Evidence-based only: every reference is a real URL you fetched (SearXNG JSON API at http://127.0.0.1:8890/search?q=…&format=json is available on this host; WebFetch/firecrawl/perplexity MCP tools are available via ToolSearch; record which MCP/tool you used — R12 evidence). No fabricated citations.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: docs/prompt.md §2.1, §0.3-1/-3/-6, R1, R2, §14 C-1/C-6; docs/adversarial/ADV-REVIEW-20260905T2315Z.md (Hero + About + Experience rows, 'Why Claude Code failed' #2 and #9); docs/adversarial/GAP-BACKLOG.md G-H1/G-X2/G-E2/G-S2/G-H2; docs/architecture/HERO-FOLD-v2.md; docs/architecture/SIGNATURE-SCENES-v1.md + SIGNATURE-SCENES-NEXT.json; components/sections/Hero/{Hero.tsx,HeroAtmosphere.tsx,atmosphere.glsl.ts} (skim: what the scene can already do); docs/delivery/evidence/v10-20260905T0515Z/G2-H5/asset-ladder.md §9 (the 4K master + monochrome rungs); app/data/portfolio/hero.ts (the copy budget).
- S-2 Prior art (fetch, do not recall): 6–10 award-level portfolio/agency first folds (Awwwards SOTD/SOTY, FWA, CSSDA, plus 2–3 Marvel/Apple-grade product hero pages) where ONE visual plane owns ≥75% of the fold and the person/product sits inside it; for each record URL, what the plane is (video/GL/still), how the headline sits on it, how the CTA group is placed, how mobile handles it, and what makes it memorable in one sentence. Prefer monochrome or restrained palettes. Note any that use a pre-rendered 4K loop on hover/scroll rather than autoplay (this site's constraint: nothing plays by default, LCP < 2.5 s, video ≤ 2.5 MB on the critical path).
- S-3 Three compositions for THIS hero, each in ≤ 120 words + a 1-line ASCII fold sketch for 1440 and 390: (A) the atmosphere GLSL becomes the plane with the monochrome portrait composited inside it (light from the field wraps the figure; the 4K master plays on hover only); (B) the portrait plate itself is the plane — full-bleed monochrome still with the GLSL as volumetric light behind and around the figure; (C) a third option you find in prior art. For each: what a recruiter says in one sentence, LCP risk, reduced-motion path, no-GL path, palette compliance, and the exact existing assets/uniforms it can reuse. Rank them and say why.
- S-4 G-X2 seventh scene: read SIGNATURE-SCENES-NEXT.json (t_x1_10/11 HyperFrames plan) and find 3–5 references for a cinematic GLSL/Three.js scene that tells a delivery-leadership story (timelines as strata, telemetry as light, programmes as orbits) at 60 fps on 2021+ phones; note the technique (instancing, SDF, feedback buffers), the DPR/perf trick, and the reduced-motion fallback each uses. State honestly whether HyperFrames adds anything a plain R3F/GLSL scene cannot, given zero credits.
- S-5 Write docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/G-H1-G-X2-prior-art.md with all of the above (references as a table: URL · what · why it matters here · fetched-at), and return {task_id:'t_w2_h1r', compositions:[{id,summary,recruiter_sentence,rank,risks}], references:[{url,note}], seventh_scene:{candidates:[…],hyperframes_verdict}, tools_used:[…], goal_complete:true}. Read-only otherwise; ≤ 25 min.

## QUALITY GATES
- Every reference is a URL fetched in this task (fetched-at recorded); zero recalled/invented citations
- Three compositions each with recruiter sentence, LCP/reduced-motion/no-GL/palette notes, and reusable assets
- Seventh-scene section states the HyperFrames verdict with reasons
- tools_used lists the MCP/search tools actually invoked (R12)
- ≤ 25 min; no app code edited

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/G-H1-G-X2-prior-art.md && grep -c 'http' /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/G-H1-G-X2-prior-art.md
```

## HIERARCHY
role_matrix: research → level 3 → effort **high** (effort_cascade.yaml; depth_cap 4). Model: perplexity/sonar-reasoning-pro · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.

## COMPLETE (2026-09-06T01:05:35.518Z)
Research delivered (identity res-w2-h1r, ~22 min): docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/G-H1-G-X2-prior-art.md — 3 compositions ranked (A: portrait masked into the atmosphere shader via the unbound poolPlate uniform; B: portrait plate as plane, bierman.io precedent verified by screenshot; C: magazine cover, apple.com/apple-vision-pro precedent), 9 references with per-row fetch honesty, HyperFrames verdict (only verifiable 4K/60 path, but playback not interactive). PM verified file exists (25.7 kB, 11 URLs).
