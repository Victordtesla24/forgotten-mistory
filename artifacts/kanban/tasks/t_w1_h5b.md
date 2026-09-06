# t_w1_h5b — CORRECTION G-H5 (reviewer rev-56ffed3e-w1 FAIL) — ship the higher rungs that the 2160p master makes possible: on-demand 1080p and 2160p monochrome loops under public/assets/avatar/ (≤5 MB each, ON_DEMAND_VIDEO budget), rung selection by viewport×DPR and save-data, the 720p rung stays the default; asset ladder promoted to docs/architecture/ASSET-LADDER.md; R5 still not claimed (24 fps)

**Status:** ready · **Priority:** 98 · **Parents:** t_w1_rev1 · **Created:** 2026-09-06T01:15:34.840Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: G-H5 resolution half
Original output: t_w1_h6h5 shipped only public/assets/my-hero-avatar.mp4 at 1280x720@24 (1.9 MB, greyscale) downscaled from artifacts/masters/minivic-greeting-2160p-master.mp4 (3840x2160@24, 58 MB, untracked), and kept the ladder under docs/delivery/evidence/…/G2-H5/asset-ladder.md.
Failing criteria (docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/08-adversarial-review.md, G-H5): GAP-BACKLOG requires either a ≥1080p path toward 4K or a published ladder stating no higher source exists — a 2160p master and a 1080p variant exist, so the escape hatch is false and every higher URL 404s (my-hero-avatar-1080.mp4, -2160.mp4, .webm).
Required fix: add on-demand rungs under public/assets/avatar/ (scripts/validate/overhaul_static_audit.mjs:170 gives that folder a 5 MB ON_DEMAND_VIDEO budget because the <video> has no src until play): my-hero-avatar-1080.mp4 (H.264, greyscale, ≤5 MB) and my-hero-avatar-2160.{mp4|webm} (AV1 or H.264 slow, greyscale, ≤5 MB — measure; monochrome 24 fps compresses well; if 2160p cannot fit under 5 MB at acceptable quality, ship the largest rung that does and record the measured size/quality in the ladder). Choose the rung at play time in components/sections/Hero/HeroPortrait.tsx and components/MiniVicBot.tsx: rung = smallest whose height ≥ rendered height × devicePixelRatio, capped when navigator.connection?.saveData; 720p (existing critical-path file) stays the default and the fallback. Move the ladder to docs/architecture/ASSET-LADDER.md (git mv, then update §9 with the new rungs, the master, measured sizes, and the sentence that R5 (2160p60) remains OPEN because the master is 24 fps). Never upscale; never commit artifacts/masters.
Verification: node --test tests/hero_assets_monochrome.test.mjs (extend: every rung greyscale, dims as declared, sizes under budget) · node scripts/validate/overhaul_static_audit.mjs (10/10) · e2e: at 1440 with DPR 2 the hover play picks the 2160 (or highest shipped) rung; at 390 DPR 3 picks 1080; saveData picks 720 — assert via the <video> src after play, on the static export.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w1-h5b /root/forgotten-mistory/.claude/worktrees/w1-h5b origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules.
- S-1 Read the reviewer's G-H5 section + verdicts.json; the current ladder; scripts/validate/overhaul_static_audit.mjs lines 150-190; app/data/portfolio/avatar.ts; HeroPortrait.tsx (how src is assigned on play); MiniVicBot.tsx AVATAR_VIDEO_URL usage; tests/hero_assets_monochrome.test.mjs; tests/e2e/hero-photo.spec.ts.
- S-2 TESTS FIRST (capture failing): extend tests/hero_assets_monochrome.test.mjs for the rung files (existence, dims, fps, greyscale, ≤ 5 MB); add tests/e2e/hero-photo.spec.ts cases for rung selection (emulate DPR/viewport; stub navigator.connection.saveData via addInitScript) asserting video.currentSrc after play.
- S-3 Encode from the master: ffmpeg -i artifacts/masters/minivic-greeting-2160p-master.mp4 -vf 'scale=1920:1080:flags=lanczos,format=gray,format=yuv420p' -c:v libx264 -preset slow -crf 21 -an -movflags +faststart public/assets/avatar/my-hero-avatar-1080.mp4; for 2160p try libaom-av1 (-crf 34 -cpu-used 6, .webm or .mp4) and libx264 -crf 24; keep the one ≤ 5 MB with the best measured quality (record SSIM vs master via ffmpeg -lavfi ssim if feasible). Chroma must measure 0 on frames 0/mid/last.
- S-4 Code: avatar.ts declares the ladder [{h:720,src:'/assets/my-hero-avatar.mp4'},{h:1080,src:'/assets/avatar/my-hero-avatar-1080.mp4'},{h:2160,src:'/assets/avatar/my-hero-avatar-2160.<ext>'}]; a small pure selector (lib/videoRung.ts or beside avatar.ts) with unit test; HeroPortrait + MiniVicBot call it when assigning src on play. No autoplay change. Keep the 301 for the old name.
- S-5 Verify: tsc · lint · build:static · audit 10/10 · node tests · e2e hero-photo + hero + chatbot on :5606 (kill after). Screenshots at 1440/390. Evidence → docs/delivery/evidence/v10-20260905T0515Z/W1-H5B/.
- S-6 Ledger (node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w1_h5b --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w1_h5b.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w1-h5b -- <files>); commit `feat(hero): on-demand 1080p/2160p monochrome rungs from the 4K master; ladder to docs/architecture (G-H5)` with trailers Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com> and Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC; git push -u origin worktree-w1-h5b.
- S-7 Return {task_id, branch, sha, pushed, push_denied, files_changed, rungs:[{h,w,fps,bytes,codec,chroma_max}], selector_rules, gates:{tests_failed_first, tsc, lint, build, audit_10_10, node_tests, e2e_targeted, no_upscale, masters_not_committed}, evidence:[], goal_complete}.

## QUALITY GATES
- Every rung greyscale (chroma 0), declared dims true, ≤ 5 MB, from the master (no upscale)
- Selector chooses rungs as specified; 720p remains default and critical-path file unchanged in size class
- Ladder at docs/architecture/ASSET-LADDER.md states rungs, sizes, master, and R5 OPEN (24 fps)
- tsc · lint · build · audit 10/10 · node + targeted e2e green; ledger before commit; pushed
- artifacts/masters never staged (git status must not list it); ≤ 30 min (split encode vs code if needed)

## VERIFICATION
```bash
ls -la /root/forgotten-mistory/.claude/worktrees/w1-h5b/public/assets/avatar/
cd /root/forgotten-mistory/.claude/worktrees/w1-h5b && node --test tests/hero_assets_monochrome.test.mjs && node scripts/validate/overhaul_static_audit.mjs | tail -2
git ls-remote --heads origin worktree-w1-h5b
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:16:33.260Z)
running — dispatched 01:17Z fm-wave1-c (serialized AP)

## COMMENT (2026-09-06T01:22:25.954Z)
HOST INCIDENT 01:19–01:20Z: the 2160p encode ran with 78 threads and 3.3 GB RSS while two headless Chromes were active → load 82, swap saturated, kernel OOM-killed two Chrome renderers (pids 3080126, 3080387) and a tenant container's chromium. PM reniced the encode; it completed. Standing rule from now on (added to host facts): media encodes run with -threads 2 and nice -n 19, never concurrently with a Playwright lane; the cycle report records this.

## COMMENT (2026-09-06T01:38:28.774Z)
PM probe 01:39Z on LIVE 521dac9c (Deploy 34004286177, consolidate 4a15797): /assets/avatar/my-hero-avatar-1080.mp4 200 video/mp4 3,690,721 B; /assets/avatar/my-hero-avatar-2160.webm 200 video/webm 2,913,450 B; 720p canonical unchanged 1,916,328 B; docs/architecture/ASSET-LADDER.md on origin/main. Rung selection, greyscale of each rung and no-autoplay to be judged by the next independent reviewer (t_w1_rev3 on the composite SHA). Not done until then.

## COMMENT (2026-09-06T01:50:27.481Z)
Lane result 01:50Z: 4a15797 consolidated (live 521dac9c → 12cd9123). Three rungs all chroma 0; selector lib/videoRung.ts (need = box height × DPR; saveData → 720p; canPlayType gate; AV1 2160p only reached above 1080 device px — stated plainly in ASSET-LADDER.md §10.3); TC-PHOTO-19 proves zero requests at rest. Pre-existing TC-HERO-13/15 + TC-PHOTO-11 → t_w1_red2. Awaiting reviewer t_w1_rev3 (running).

## COMPLETE (2026-09-06T02:10:43.651Z)
Independent live PASS G-H5 resolution half (rev-12cd9123-w1); R5 remains OPEN on frame rate (24 fps). Live 521dac9c/12cd9123.
