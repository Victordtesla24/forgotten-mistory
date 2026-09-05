# t_g_m2 — ADV-FAIL P0 — G-M2 Regenerate greeting MP3 to match text

**Status:** ready · **Priority:** 99 · **Lane:** G-M · **Port:** 5606 · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
analyst-programmer — coding. Same worktree/branch as t_g_m1. The reviewer found the spoken greeting (`public/assets/minivic-greeting.mp3`, 198,156 bytes, 2026-09-03) still says the OLD "Hi, I'm Mini Vic — Vikram's AI clone…" while the on-screen intro is the rewritten employer-research text (`GREETING.hiring` in components/MiniVicBot.tsx — find its definition). §0.3-5: the introduction is one thing, heard and read. Regenerate the MP3 from the CURRENT intro text with ElevenLabs (key names ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID exist in /root/.claude/.env.production). A premade male English voice is acceptable if the configured voice id is an IVC clone the plan rejects (record the exact HTTP status and the decision). Owner directive already authorises this single paid call (ADV-REVIEW immediate patch order, lane D). Make the text a single source of truth so audio and text can never drift again.

## EXECUTION ORDER
- S-1 Read scripts/generate-cloned-greeting.ts, MiniVicBot.tsx GREETING definition + CLONED_VOICE_GREETING_HASH (…:290-291) + the TC-FR-VOICE test that asserts the hash (grep tests/ for CLONED_VOICE_GREETING_HASH / TC-FR-VOICE), and app/data/portfolio/listen.ts / avatar.ts for where intro copy lives.
- S-2 Refactor: move the intro text into a data module (e.g. export `miniVicGreeting` from app/data/portfolio/avatar.ts or a new app/data/portfolio/minivic.ts — check nothing similar exists first) imported by BOTH MiniVicBot.tsx and scripts/generate-cloned-greeting.ts; the script writes public/assets/minivic-greeting.mp3 AND public/assets/minivic-greeting.sha256 (or updates the hash constant via a generated module under app/data/generated/ following build_stamp.mjs conventions — do not hand-edit generated files). TDD: extend the TC-FR-VOICE assertion so the served MP3's SHA-256 equals the recorded hash AND add a node:test `tests/minivic_greeting.test.mjs` asserting the recorded transcript text file (write `public/assets/minivic-greeting.txt` with the exact text spoken) equals the current `GREETING.hiring` string — RED now because the old text differs.
- S-3 Run the generation once: `set -a; grep -E '^(ELEVENLABS_API_KEY|ELEVENLABS_VOICE_ID)=' /root/.claude/.env.production > /tmp/claude-0/-root-forgotten-mistory/46afcf46-5464-449d-9c0d-a9f0b25357cd/scratchpad/el.env; source that scratch file; set +a; npx tsx scripts/generate-cloned-greeting.ts` (never print the values; delete the scratch file after). If the voice id is rejected (4xx), call GET https://api.elevenlabs.io/v1/voices, pick a premade male English voice, pass it as ELEVENLABS_VOICE_ID, record the decision + status codes in 03-generation.log. Verify: `ffprobe` duration plausible for the text length (~ words/2.5 s), mp3 valid, size < 500 kB (asset budget).
- S-4 Rebuild; serve :5606; run TC-FR-VOICE + tests/overhaul/voiceover.spec.ts + avatar.spec.ts + the node:test → GREEN. Listen check: `ffmpeg -i public/assets/minivic-greeting.mp3 -f null -` clean.
- S-5 Ledger (include the mp3 + txt), commit `feat(minivic): spoken greeting regenerated from the rewritten intro — one source of truth (G-M2)`, push the G-M branch.

## QUALITY GATES
- [ ] Transcript test red→green; MP3 hash test green against the NEW file
- [ ] Spoken text == on-screen intro text (single import)
- [ ] Generation call recorded with status code; premade-voice decision logged if used; no secret printed
- [ ] MP3 < 500 kB, valid, plays in tests (voiceover.spec green)
- [ ] Ledger rows; branch pushed

## VERIFICATION
```bash
node --test tests/minivic_greeting.test.mjs
sha256sum public/assets/minivic-greeting.mp3   # equals the recorded hash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5606 npx playwright test tests/overhaul/voiceover.spec.ts tests/overhaul/avatar.spec.ts -g "VOICE|greeting|avatar"
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-M/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/analyst-programmer.SOUL.md + analyst-programmer.system-prompt.md (+ /root/.sub-agents/council/analyst-programmer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:27.915Z)
running — dispatched 12:1xZ (queued behind the first two lanes; host cap) — Workflow wf_b908a7a9-f5d lane:minivic-ladder+greeting, port 5606
