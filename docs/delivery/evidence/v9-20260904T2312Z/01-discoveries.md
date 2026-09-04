# v9 — discoveries before dispatch (failures first)

Every line below was observed by the orchestrator in this session (2026-09-04T23:06Z–23:25Z) with the command named. Nothing is carried over from a prior run's acceptance note.

## Production (https://forgotten-mistory.web.app)

| # | Finding | Evidence | Tag |
|---|---|---|---|
| P1 | `/api/chat` returns the HTML index (`content-type: text/html`, HTTP 200) instead of the Cloud Function, so MiniVic's tier-1 brain never answers on the live site. | `curl -X POST …/api/chat` → HTML; `curl -sI` shows `cache-control: no-store` | Verified |
| P2 | Cause of P1: the v8 run deployed hosting with `firebase.static.json` (SPA fallback `** → /index.html`, `no-store`, **no `/api/*` rewrites, no CSP/X-Frame/Referrer headers**) — `scripts/deploy/firebase_static_deploy.sh` uses `--config firebase.static.json`. Live headers match that file, not `firebase.json`. | `cat firebase.static.json`; live headers | Verified |
| P3 | The live page carries no `build-commit` meta: it was built from an uncommitted tree at 21:53Z and released 22:41Z. | `curl … \| grep build-commit` → empty; `ls -la out/index.html`; `firebase hosting:channel:list` | Verified |
| P4 | Cloud Functions `minivicChat` and `elevenLabsTts` are deployed (v2, us-central1) but `minivicChat` answers 502 `{"error":"chat_upstream_failed","status":402}`. | `firebase functions:list`; direct POST to the function URL; `firebase functions:log` shows OpenRouter 402 | Verified |
| P5 | OpenRouter account balance is **−$5.38** (`total_credits` 2890.50, `total_usage` 2895.88). Every OpenRouter chat and video call is refused with 402 until the Owner adds credits. The v8 run recorded ~$38.7 of flux upscales. | `GET /api/v1/credits`; chat probe → 402 | Verified |
| P6 | Fallback rungs in the function ladder: DeepSeek → "Insufficient Balance"; Z.ai → code 1113 insufficient balance; **OpenAI `gpt-4.1-mini` answers** with the local key. The deployed function's DEEPSEEK/ZAI/OPENAI/ELEVENLABS secrets differ from `~/.claude/.env.production` (sha256 fingerprints compared; OPENROUTER is the same key). | provider probes; `firebase functions:secrets:access … \| sha256sum` | Verified |
| P7 | ElevenLabs: tier `payg`, `can_use_instant_voice_cloning=false`; cloned voice `0ZJ4kFDo6bZUNQsuULOW` ("my_voice_clone") exists but TTS with it is denied (`ivc_not_permitted` per v7/v8). Characters used 28,916 / 37,471. | `GET /v1/user/subscription`, `GET /v1/voices/{id}` | Verified |

## Repository (main @ c0ab52e → 22d11a0 after committing the v8 hero parallax source)

| # | Finding | Evidence | Tag |
|---|---|---|---|
| R1 | `npx tsc --noEmit` exit 2: `components/site/ContactScroll.tsx` imports missing `@/lib/gsap`; `components/site/GithubFeed.tsx` imports missing `@/lib/useReducedMotionSafe`. Neither file is imported by any entry point. | `baseline-tsc.log`; `grep -rn` | Verified |
| R2 | `functions/index.js:452` redeclares `const messages` → SyntaxError; the function cannot even load, so it cannot be redeployed as-is. | `node --test tests/minivic_chat_function.test.mjs` | Verified |
| R3 | Playwright discovers **0 tests**: no `testMatch`, so `tests/*.test.mjs` (node:test files) are collected and R2's SyntaxError aborts discovery. CLAUDE.md claims 167 tests. | `npx playwright test --list` → "Total: 0 tests in 0 files" | Verified |
| R4 | Static audit 8/10: TC-NFR-PERF fails on 9 oversized mp4s left by v8 (56 MB `my-avatar.mp4` 3840×2160, 110 MB `explainer/*`, 4.5 MB `minivic-greeting.mp4`); TC-NFR-COMPLETE fails on `app/components/SpaceScene.tsx:14` (dead stub). | `node scripts/validate/overhaul_static_audit.mjs` | Verified |
| R5 | `components/MiniVicBot.tsx` sets `AVATAR_VIDEO_URL = "/assets/my-avatar.mp4"` — the file now in the tree is the 56 MB 4K master, so opening the bot would fetch 56 MB. | `grep -n AVATAR_VIDEO_URL`; `ffprobe` | Verified |
| R6 | `components/site/HeroAvatar.tsx` (the original hero video avatar, `my-hero-avatar.mp4` 640×360 silent loop 160 KB) is referenced by nothing; the hero renders no avatar. | `grep -rn HeroAvatar app components lib` | Verified |
| R7 | CI on `main` red on every push since 2026-09-04T00:11Z: quality + lint (R1), test (R2/R3), lighthouse (`lhci collect` produced no `lhr-*.json`), Security (`npm audit --audit-level=high`: next 14.2.35 — patched only in ≥15.5.21 / 16.3.4; browserslist ≤4.28.6; fflate). build/deploy jobs skipped. | `gh run list`, `gh run view 33870471708 --log-failed`, `npm audit --json` | Verified |
| R8 | Stale worktrees from earlier agents: `/var/tmp/dbg-wt`, `/var/tmp/v6-clean`, `/var/tmp/v6-wt/data-backend` (branch `wt/data-backend`, 3 unmerged test-only commits, dirty). Remote holds `main` only; 0 open PRs. | `git worktree list`; `gh pr list` | Verified |
| R9 | Greys in the design tokens are cool-tinted (`--mist-400 #8A8F9A`, `--mist-200 #C9CDD6`, `--steel #AEB6C2`, `--accent #E8EBF0`, `--white #F4F6FA`); the Owner's "claude design system" (Aether) is obsidian `#08080A` + gilt `#C9A84C`. | `app/globals.css :root`, `/root/dev/aether-job-career-agent/.claude/DESIGN-SYSTEM.md` | Verified |

## n8n (local instance http://127.0.0.1:5678, project "Admin Platform")

| # | Finding | Evidence | Tag |
|---|---|---|---|
| N1 | Two active workflows generate avatars: `YYNSZMYApt7N3U3B` (70 nodes, webhook; execs 23/24/29 error, 30 success) and `dfs7PNjfoTZxzaw4` (62 nodes, form; execs 20/21/22 error, 19 success). | n8n MCP `search_workflows`, `search_workflow_executions` | Verified |
| N2 | Any paid proof run is blocked by P5 until credits are added. The v8 4K masters were produced by hand-chunked flux upscales outside n8n. | P5; `v8-…/SUMMARY.json` | Verified |

## Secret-handling note (self-reported)

Sourcing `~/.claude/.env.production` with `. file` executed malformed lines and echoed two non-`KEY=VALUE` lines into the orchestrator's tool output (a public SSH key and a `9router_api_key` string). Nothing left the session. Subsequent loads use a `grep -E '^[A-Z][A-Z0-9_]*='` reader. Workers are briefed never to source the file directly.
