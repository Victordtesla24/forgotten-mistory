# t_w2_r3r — WAVE-2 research — R3 / G-R3 honest path: probe Higgsfield credits via the Higgsfield MCP (R12 evidence), confirm ElevenLabs capabilities incl. timestamped TTS for a viseme track, and specify the zero-credit real-time-seeming avatar path (4K master → viseme clips → WebSocket-free envelope/timestamp-driven mouth) with the ≤40 ms lip-sync budget and what stays OPEN

**Status:** ready · **Priority:** 94 · **Parents:** — · **Created:** 2026-09-06T00:56:51.306Z

## YOUR ROLE
researcher — research (docs/prompt.md §5). docs/prompt.md R3 / §2.1: real-time AI video avatar — ElevenLabs voice + Higgsfield avatar (or a pre-made animated avatar that seems real-time, driven by frame-accurate ~40 ms lip-sync) + brain per §0.4; < ~1.5 s first word. ADV-2315Z: live is a 720p24 muted loop + stock TTS + analyser visemes; 'MINIVIC LIVE' badge is false; no Higgsfield/WSS. GAP-BACKLOG G-R3: keep full realtime Higgsfield avatar OPEN/honest if credits block it; G-M4 + G-R2 + honest badge ship meanwhile. This research establishes the facts (credits, API capabilities) and the achievable slice with numbers. R12 requires MCP usage to be evidenced on the board — use the Higgsfield MCP tools (ToolSearch 'select:mcp__claude_ai_Higgsfield__balance,mcp__claude_ai_Higgsfield__show_plans_and_credits') and the ElevenLabs MCP (ToolSearch 'select:mcp__claude_ai_ElevenLabs__creative_list_voices') and record the raw responses (no secrets).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read docs/prompt.md §2.1, §0.4, R3, R6, §14 C-3/C-4; ADV-REVIEW-20260905T2315Z §MiniVic; GAP-BACKLOG G-R3/G-M4/G-R2; components/MiniVicBot.tsx (startSyntheticMouth, viseme stage, AVATAR_VIDEO_URL, badge); functions/index.js (elevenLabsTts: model, output format, whether timestamps are requested); docs/delivery/evidence/v10-20260905T0515Z/G2-H5/asset-ladder.md §9 (4K master at artifacts/masters/minivic-greeting-2160p-master.mp4, 1080p voiced, 720p idle); board tasks t_1e4e053e, t_dc096608, t_x1_07 (prior R3 architecture) via `node scripts/pm/kanban.mjs show <id>`.
- S-2 Probe with tools, record raw results: Higgsfield MCP balance / plans_and_credits (credits number, plan); ElevenLabs MCP list_voices (confirm the configured ELEVENLABS_VOICE_ID by NAME only is a stock/premade voice; never print keys); ElevenLabs docs for `/v1/text-to-speech/{voice_id}/with-timestamps` and the WebSocket `stream-input` API (character-level alignment → phoneme/viseme timing) — fetch the doc pages (firecrawl/WebFetch) and cite; Higgsfield API docs for whether any product offers real-time streaming avatars or only offline generation (cite). If a probe tool fails, record the exact error — do not guess.
- S-3 Specify the achievable slice with numbers: (a) viseme track: ElevenLabs timestamps → grapheme-to-viseme map (cite the mapping you use, e.g. Oculus/ARKit 15-viseme set) → schedule; (b) mouth rendering: which of the existing assets can supply viseme frames (the 4K master has the owner speaking the greeting — can K frames be extracted per viseme by aligning the greeting MP3 timestamps to the master? list the exact steps and tools: ffmpeg frame extraction, alignment via the same timestamp API on the greeting text); (c) sync budget: measure/estimate audio-to-frame drift sources (audio element currentTime resolution, rAF jitter) and show how ≤ 40 ms is verifiable in a Playwright test (tests/e2e/avatar-voice.spec.ts exists); (d) first-word budget: TTS first-byte from the live /api/tts (3 samples with curl -w '%{time_starttransfer}') added to the brain's first token; (e) what stays OPEN: true generative real-time video (Higgsfield credits = N, cost to unblock), and the honest badge wording.
- S-4 Write docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/R3-avatar-path.md (facts table with tool + timestamp per row; the slice; the OPEN register) and return {task_id:'t_w2_r3r', higgsfield:{credits, plan, tool_response_excerpt}, elevenlabs:{voice_is_premade, timestamps_api:bool, ws_api:bool}, tts_first_byte_s:[3], slice:{steps:[…], sync_test:'…', first_word_budget_s}, open:[…], badge_wording:'…', tools_used:[…], goal_complete:true}. Read-only; ≤ 25 min.

## QUALITY GATES
- Higgsfield credit figure comes from the MCP tool response captured in this task (or the exact error)
- Every API capability claim cites a fetched doc URL
- Slice steps are executable by an analyst-programmer without further research; ≤ 40 ms verification method named
- OPEN register is explicit; no R3 PASS claimed
- No secrets printed; ≤ 25 min; no app code edited

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/R3-avatar-path.md && grep -ci 'credit' /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/R3-avatar-path.md
```

## HIERARCHY
role_matrix: research → level 3 → effort **high** (effort_cascade.yaml; depth_cap 4). Model: perplexity/sonar-reasoning-pro · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.
