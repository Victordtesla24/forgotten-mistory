# t_w3_pa — WAVE-3 PROTOTYPE A (solutions-architect, max) — a standalone hero-fold prototype of direction A (docs/architecture/proto/cinematic-A/index.html, three.js from /node_modules, no app code) rendering the first 6 s of the hero beat with the real words and the real shipped still, black and white only; deterministic frames via window.__fmProto.render(t) captured with system Chrome on SwiftShader at 1440x900 and 390x844 plus the reduced-motion still; CQ instruments measured on the frames — real pixels for the judge

**Status:** todo · **Priority:** 100 · **Parents:** t_w3_dA · **Created:** 2026-09-06T05:41:45.475Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). Stage 2 of direction A: prove the hero beat with real pixels so the judge scores frames, not prose. Same immovables as t_w3_dA (black/white/grey only, gold nowhere, the words from app/data/portfolio/hero.ts verbatim, the shipped still public/assets/my_avatar.avif or the poster public/assets/hero-atmosphere-poster.avif as the figure, no external network, no app code, tests or content edited). This is an architecture spike — a design artifact under docs/architecture/proto/, never imported by the app; it must still be real, complete, running code (no stubs).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- P-1 Read docs/architecture/CINEMATIC-VFX-v1-A.md §Direction, §Hero and §8 Prototype plan; app/data/portfolio/hero.ts; lib/palette.ts; the shipped still paths under public/assets/.
- P-2 Build docs/architecture/proto/cinematic-A/index.html (+ inline or sibling .js/.glsl; importmap 'three' → '/node_modules/three/build/three.module.js' and addons from '/node_modules/three/examples/jsm/'; no other dependency unless it is already in node_modules): the hero beat 0–6 s exactly as the spec's storyboard — the plane, the light model, the name struck by/into the light, the figure lit by the same source, grain/halation, dust/particles with depth. Expose window.__fmProto = { render(t), layers(), grainSigma(), renderer } so frames are deterministic (no Date.now in the render path — t is passed in). Respect prefers-reduced-motion: render(t) with matchMedia reduced → the static composition. DPR cap 1.5. Chroma 0 everywhere.
- P-3 Capture: python3 -m http.server 5603 --directory /root/forgotten-mistory (repo root, so /node_modules and /assets resolve) in the background (record its PID); a node script using the installed playwright with the system Chrome (channel 'chrome', args --no-sandbox --use-gl=angle --use-angle=swiftshader --ignore-gpu-blocklist --enable-unsafe-swiftshader) opens http://127.0.0.1:5603/docs/architecture/proto/cinematic-A/index.html, waits for window.__fmProto, calls render(t) for t = 0.5, 1.5, 3, 5 and screenshots each at 1440x900 and 390x844 (8 frames) plus one reduced-motion frame at 1440 (emulateMedia reducedMotion) → docs/delivery/evidence/v10-20260905T0515Z/W3-DIR-A/proto-<viewport>-t<t>.png and proto-1440-reduced.png; 0 pageerrors required (log them). Then measure on the frames with sharp: luma p1/p99 range, flat-fill ratio (64x64 tiles, luma σ < 0.01), max chroma (must be 0 within ±1/255), glyph-band luma variation across t (light-through-type), grain σ on a 128x128 flat-looking region → docs/delivery/evidence/v10-20260905T0515Z/W3-DIR-A/measurements.json. SwiftShader is slow: keep the raymarch/particle budget switchable via ?quality=proof so a frame renders in < 20 s; note the switch in the doc. Kill the server with kill <PID> (never pkill -f).
- P-4 Append §9 'Prototype: what the frames show' to docs/architecture/CINEMATIC-VFX-v1-A.md — the numbers, the frame paths, what is NOT yet proven (e.g. real fps). ≤ 30 min; if you would overrun, ship the smallest complete beat (plane + light + name) and say what is missing. Return {task_id:'t_w3_pa', proto:'docs/architecture/proto/cinematic-A/index.html', frames:[…], measurements:{…}, pageerrors:0, quality_switch:'…', unproven:[…], goal_complete:true}.

## QUALITY GATES
- Prototype runs with 0 pageerrors on SwiftShader; 9 frames captured at the named paths
- measurements.json present with luma range, flat-fill ratio, max chroma (= 0), light-through-type variation, grain σ
- Real words from hero.ts, real shipped still; no gold; no external network; no app/test/content file edited
- §9 appended to the direction doc with numbers and the unproven list

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-DIR-A/ | wc -l
node -e "const m=require('/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-DIR-A/measurements.json');console.log(JSON.stringify(m).slice(0,400))"
git -C /root/forgotten-mistory status --porcelain -- app components lib tests | wc -l
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
