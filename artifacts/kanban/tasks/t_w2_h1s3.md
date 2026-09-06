# t_w2_h1s3 — G-H1 S3 — the name struck across the plane: H1 clamp(3.25rem,8vw,7rem), nav mark 1.25rem/1.125rem, baseline on the dissolve band never the face-safe box, one quiet CTA bar with 48 px targets

**Status:** todo · **Priority:** 95 · **Parents:** t_w2_h1s1 · **Created:** 2026-09-06T01:23:59.629Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). G-H1 hero set-piece, composition A (docs/architecture/HERO-SETPIECE-v3.md, SA t_w2_h1sa; research W2-RESEARCH/G-H1-G-X2-prior-art.md). This is slice S3 (g2h1v3-03) of §9. The recruiter sentence the fold must produce: 'His face is standing in the shaft of light that his name is written across.' ADV-2315Z §Hero FAIL is the baseline. Immovables (§10 of the brief): LCP < 2.5 s, CLS < 0.05, nothing plays by default, critical-path assets ≤ 500 kB / video ≤ 2.5 MB, palette B/W/gold with gold only on sourced claims, reduced-motion and no-GL paths are the same picture, keyboard order per §7, no upscale above 1480x826 (figure ≤ 846 CSS px), G-MV1 pill untouched, hero.ts copy unedited. Extra gates: G-MV1 untouched (Ask Mini Vic labelled and visible at 390); screenshots at 1440/1280/834/390.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w2-h1s3 /root/forgotten-mistory/.claude/worktrees/w2-h1s3 origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules. Never run more than one build or one Playwright browser at a time; never run ffmpeg in this slice.
- S-1 Read docs/architecture/HERO-SETPIECE-v3.md in full (§0–§12), then the files this slice names: components/sections/Hero/Hero.module.css, components/site/Navigation.tsx (mark size only), app/globals.css (nav token), tests/overhaul/hero-typography.spec.ts (new), tests/a11y/hero-contrast.spec.ts; plus scripts/validate/hero_plane_dominance.mjs (the SPD instrument and its exports) and CLAUDE.md gotchas (dead CSS fails the audit; reduced-motion + no-GL mandatory).
- S-2 TESTS FIRST (brief §8): write/extend exactly the cases this slice must turn green — TC-HERO-TYPE-01, TYPE-02, SET-05 (touch clause), A11Y-02 — with the thresholds verbatim from §8 (never lowered); run them on origin/main code and capture FAILING output → docs/delivery/evidence/v10-20260905T0515Z/W2-H1/t_w2_h1s3/02-tests-failing.log.
- S-3 Implement slice S3 (g2h1v3-03) exactly as §9 describes (files, geometry from §3, compositing from §4, fallbacks from §5, typography from §6). Smallest change; delete any CSS the change orphans in the same commit.
- S-4 Verify: npx tsc --noEmit · npm run lint · npm run build:static · node scripts/validate/overhaul_static_audit.mjs (10/10) · python3 -m http.server 5609 --directory out & then PLAYWRIGHT_BASE_URL=http://127.0.0.1:5609 npx playwright test <the slice's spec files> plus tests/e2e/hero.spec.ts tests/e2e/hero-fold.spec.ts tests/e2e/hero-photo.spec.ts (kill the server after). Screenshots of the fold at 1440x900, 1280x800, 834x1194, 390x844 on ?gl=force and reduced-motion → W2-H1/t_w2_h1s3/. LOOK at them against §2 and §3.
- S-5 Ledger before commit: git add -A; node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w2_h1s3 --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w2_h1s3.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w2-h1s3 -- <files>. Commit 'feat(hero): the name struck across the plane: H1 clamp(3.25rem,8vw,7rem), nav mark 1.25rem/1.125rem, baseline on the dissolve band never the face-safe box, one quiet CTA bar with 48 px targets (G-H1 S3 (g2h1v3-03))' with trailers Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com> and Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC; git push -u origin worktree-w2-h1s3 (once; report push_denied with sha if refused).
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, measurements:{spd_per_viewport_path, lit_fraction, h1_ratio, lcp_ms, cls}, gates:{tests_failed_first, tsc, lint, build, audit_10_10, slice_tests_green, hero_suites_green, no_dead_css, hero_ts_unedited}, evidence:[], decisions:[], goal_complete}.

## QUALITY GATES
- Slice tests (TC-HERO-TYPE-01, TYPE-02, SET-05 (touch clause), A11Y-02) captured failing first, then green at all four viewports on both paths where marked
- tsc · lint · build:static · static audit 10/10 (dead CSS removed in the same commit) · hero e2e suites green
- No threshold from §8 lowered; hero.ts unedited; no upscale; nothing plays by default; G-MV1 untouched
- Screenshots at the four viewports on both paths attached and LOOKED at
- Ledger before commit; pushed or push_denied; ≤ 30 min (report the smallest green pushed slice if overrunning)

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w2-h1s3 && node scripts/validate/overhaul_static_audit.mjs | tail -2
git ls-remote --heads origin worktree-w2-h1s3
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
