# t_w2_r3a4 — WAVE-2 R3 R3-A4 — elevenLabsTts content-negotiates /with-timestamps (Accept) while a cached bundle still gets its MP3; TS-FN-01..06; deployed and probed with both Accept values; no secret in logs

**Status:** todo · **Priority:** 92 · **Parents:** — · **Created:** 2026-09-06T01:49:34.635Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Slice R3-A4 of docs/architecture/MINIVIC-AVATAR-v1.md (SA t_w2_r3sa; research W2-RESEARCH/R3-avatar-path.md; brain routing MINIVIC-BRAIN-0-4.md). Full definition (files, gates, test ids) = the entry with id R3-A4 in docs/architecture/MINIVIC-AVATAR-TASKS.json. docs/prompt.md §2.1 second form: a pre-made animated avatar that SEEMS real-time, driven by frame-accurate (~40 ms) lip-sync; R3 first form (generative real-time Higgsfield video) is structurally OPEN (async submit-then-poll only, 0 credits) and must never be claimed. Cost gate: only ordinary TTS calls with the configured premade voice (ELEVENLABS_VOICE_ID by name); no IVC/cloning; no Higgsfield generation. Slice R3-A1 (badge/copy) is being delivered by t_w1_r2c — keep the badge and panel line verbatim from MINIVIC-BRAIN-0-4 §2(b); only the third line changes, and only once lip-sync is real.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w2-r3a4 /root/forgotten-mistory/.claude/worktrees/w2-r3a4 origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules; cd functions && npm ci. One build / one browser at a time; any ffmpeg frame extraction runs with nice -n 19 -threads 2 and never concurrently with a Playwright run.
- S-1 Read docs/architecture/MINIVIC-AVATAR-v1.md in full, the R3-A4 entry in docs/architecture/MINIVIC-AVATAR-TASKS.json, then: functions/index.js, tests/minivic_tts_timestamps.test.mjs; plus components/MiniVicBot.tsx (viseme stage, startSyntheticMouth, audio element), lib/visemeMap.ts, functions/index.js elevenLabsTts, scripts/build/greeting_envelope.mjs, app/data/generated/greeting-asset.ts, tests/e2e/avatar-voice.spec.ts, tests/overhaul/viseme-stage.spec.ts.
- S-2 TESTS FIRST: write the tests the entry names (ids verbatim, thresholds verbatim — 40 ms is 0.040 s and never rounded); run on origin/main and capture FAILING → docs/delivery/evidence/v10-20260905T0515Z/W2-R3/t_w2_r3a4/02-tests-failing.log.
- S-3 Implement slice R3-A4 exactly as the entry and the doc describe; smallest change; never print secrets; never ship the API key to the client.
- S-4 Verify: npx tsc --noEmit · npm run lint · npm run build:static · node scripts/validate/overhaul_static_audit.mjs (10/10) · node --test <this slice's node tests> · python3 -m http.server 5622 --directory out & then PLAYWRIGHT_BASE_URL=http://127.0.0.1:5622 npx playwright test <this slice's specs> tests/e2e/chatbot.spec.ts (kill after) · deploy the function with firebase deploy --only functions:tts:minivicChat --project forgotten-mistory --non-interactive and probe both Accept values through https://forgotten-mistory.web.app/api/tts. Screenshots of the open panel at 1440/390 → W2-R3/t_w2_r3a4/.
- S-5 Ledger before commit (node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w2_r3a4 --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w2_r3a4.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w2-r3a4 -- <files>); commit 'feat(minivic): R3-A4' with trailers Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com> and Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC; git push -u origin worktree-w2-r3a4 (once; report push_denied with sha if refused).
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, measurements:{...}, gates:{tests_first, tsc, lint, build, audit_10_10, slice_tests, no_secret_in_client, no_r3_pass_claim}, evidence:[], decisions:[], goal_complete}.

## QUALITY GATES
- Entry gates satisfied verbatim; no threshold lowered; 40 ms never rounded
- tsc · lint · build · audit 10/10 · slice tests + chatbot e2e green
- No API key reaches the client; no IVC/cloning/Higgsfield calls; R3 first form never claimed
- Ledger before commit; pushed or push_denied; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-r3a4
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
