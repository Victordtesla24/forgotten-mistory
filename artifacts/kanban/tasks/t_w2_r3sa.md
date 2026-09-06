# t_w2_r3sa — WAVE-2 architecture — R3 second form: the avatar that SEEMS real-time (docs/prompt.md §2.1): ElevenLabs with-timestamps/WS → viseme schedule → mouth frames from the 4K master (greeting) + vector visemes (dynamic replies), audio.currentTime-driven in rAF, ≤40 ms drift proven by test, first word < 1.5 s budget, honest labelling; ≤30-min slices

**Status:** todo · **Priority:** 92 · **Parents:** t_w2_r3r · **Created:** 2026-09-06T01:05:35.884Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). Input: docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/R3-avatar-path.md (facts: Higgsfield 0 credits + no real-time surface; ElevenLabs character-level timestamps REST + word-level WS; TTS cold 2.9 s / warm 0.46 s; existing startSyntheticMouth + 21-viseme map in lib/visemeMap.ts; 4K master at artifacts/masters/minivic-greeting-2160p-master.mp4 untracked). Also docs/architecture/MINIVIC-BRAIN-0-4.md (brain ladder + first-token decision, t_w1_r2sa). Goal: a design an analyst-programmer can build in ≤30-min slices that turns the MiniVic face from a muted loop into a lip-synced avatar driven by the real TTS timing, with the drift measured, and copy that never claims live video generation. Cost gate: any paid ElevenLabs call beyond normal TTS usage (e.g. IVC/cloning) is NOT authorised — design within the premade voice; note what the cloned voice would change.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read the research doc, MINIVIC-BRAIN-0-4.md, docs/prompt.md §2.1/R3/§0.3-3/-4/-5 and §14 C-4/C-6/C-7, ADV-2315Z §MiniVic, components/MiniVicBot.tsx (viseme stage, startSyntheticMouth, audio element, panel geometry, badge), lib/visemeMap.ts, functions/index.js elevenLabsTts (endpoint, format, caching), tests/e2e/avatar-voice.spec.ts + tests/e2e/chatbot.spec.ts + tests/overhaul/viseme-stage.spec.ts, scripts/build/greeting_envelope.mjs (how the greeting envelope is precomputed at build), app/data/generated/greeting-asset.ts.
- S-2 Design: (a) TTS path: function switches to /with-timestamps (REST) for replies and returns audio + alignment in one response (shape it: JSON with base64 audio + character timings, or multipart) — or WS stream-input for lower first-word latency; choose with the measured numbers and say which meets < 1.5 s first word when combined with the brain's first token; cache the greeting alignment at build time like the envelope; (b) viseme schedule: grapheme→viseme table (name the standard set you map to and the rules), schedule shape, silence handling; (c) rendering: for the greeting, a mouth-crop sprite sheet from the 4K master frames aligned to the greeting timestamps (exact ffmpeg extraction + alignment steps; sprite size budget ≤ 500 kB image budget or on-demand); for dynamic replies, the existing vector/GLSL viseme stage driven by the schedule; (d) sync: audio.currentTime sampled in rAF; expected drift analysis; the two test hooks (data-viseme-index / window.__minivicVisemeSchedule) and the Playwright assertion |expected−actual| ≤ 40 ms at ≥ 20 sampled instants; (e) honest copy: badge + panel line + privacy note wording that states TTS is real and live, the face is pre-rendered/synthetic, no live video generation; (f) reduced-motion and no-GL behaviour; (g) what remains OPEN (true generative real-time video; phoneme-level timing) and what the cloned voice would change.
- S-3 TDD first: list tests with file + assertion + threshold (function contract test for the timestamps response shape; schedule unit test; e2e drift test; badge/copy test; first-word budget test method on live).
- S-4 Slice into ≤ 30-min analyst-programmer tasks (function + client + tests + evidence), ordered so the first slice is recruiter-visible (honest badge + schedule-driven mouth on the greeting). Write docs/architecture/MINIVIC-AVATAR-v1.md (new) with all of the above; return {task_id:'t_w2_r3sa', tts_path:'rest-with-timestamps|ws', first_word_budget_s, schedule_shape, sprite_plan, tests:[…], slices:[{id,title,files,gates,minutes}], open:[…], copy:{badge, line}, doc, goal_complete:true}. Read-only for app code; ≤ 30 min.

## QUALITY GATES
- Design uses only capabilities proven in the research doc (no invented APIs); every latency claim cites a measured number or is labelled estimate
- ≤ 40 ms drift has a concrete, implementable test
- Copy never claims live video generation; OPEN register explicit
- Slices ≤ 30 min, first slice recruiter-visible
- No app code edited; no paid IVC/cloning calls designed in

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/architecture/MINIVIC-AVATAR-v1.md && grep -c 'viseme' /root/forgotten-mistory/docs/architecture/MINIVIC-AVATAR-v1.md
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:05:36.170Z)
running — dispatched 01:07Z fm-wave2-sa (sequential, opus max)

## COMPLETE (2026-09-06T01:49:34.882Z)
SA delivered docs/architecture/MINIVIC-AVATAR-v1.md + MINIVIC-AVATAR-TASKS.json (PM verified files exist): REST /with-timestamps (WS rejected: would expose ELEVENLABS_API_KEY client-side; no socket to upgrade in Functions v2); schedule shape [tStart,tEnd,visemeIndex] float64 over the existing 22-viseme table; master is NOT a recording of the greeting (12.3 s video vs 24.98 s MP3) → representative-frame atlas, not timeline alignment; first-word claim limited to the greeting (< 1.5 s by construction); dynamic reply 1.55–1.98 s warm as a range, never claimed; 7 slices A1–A7 (A1 folded into t_w1_r2c; A2–A7 on the board).
