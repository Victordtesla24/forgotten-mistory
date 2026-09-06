# t_w1_rev4 — WAVE-1 REVIEW 4 — independent adversarial review of the composite live SHA carrying t_w1_r2c (readable disclosure, attempts[], warm-prime via Hosting, origin race, AI-clone copy), t_w1_mv2 (launcher clickable on the first fold), t_w1_og1 (monochrome OG card) and t_w1_lad1 (ladder doc) — plus the REAL visitor cold sequence for G-M4 and the regression table

**Status:** todo · **Priority:** 100 · **Parents:** t_w1_r2c, t_w1_mv2, t_w1_og1 · **Created:** 2026-09-06T02:37:33.798Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Read the live build-commit at start (curl the page) and review THAT SHA; it must be a descendant of a134bb5c (r2c), fc03a0e6 (og1), 46accc4 (lad1) and the t_w1_mv2 commit named in the board comment on t_w1_mv2. Baselines: rev-ec53e2b4-w1 (F2–F8 + launcher regression), rev-12cd9123-w1 (G-MV1 FAIL at 390: hero portrait video covers the launcher). GAP-BACKLOG G-M4 bar: Hosting POST /api/chat first token < 1.5 s on a cold probe. The implementer measured strict-cold Hosting 7/7 < 1.5 s (max 1194) and origin first sample 2626 ms WITHOUT a warm ping; the shipped client fires GET /api/chat?warm=1 when the panel opens. Your job: measure what a visitor actually experiences and judge on that, and re-run everything else independently.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: the two prior reviews' 08-adversarial-review.md (what to attack), docs/architecture/MINIVIC-BRAIN-0-4.md §2(c) + the r2c addendum on the origin race policy, W1-R2C/07-first-token*.json (their numbers — not reused), orchestration-skill §10.
- S-2 Visitor cold sequence (do this FIRST, before any browser work, and keep your own /api/chat traffic out of the idle windows): with ≥ 10 min of zero chat traffic from this host, run ONE sequence = GET https://forgotten-mistory.web.app/api/chat?warm=1 (record status/time) → sleep 1.5 s → POST a valid question through Hosting AND (separately, next idle window) through the origin https://minivicchat-hjdyjsrzvq-uc.a.run.app with your own first-token reader; record first-token ms, provider, attempts[]. Two strict-cold sequences minimum (Hosting + origin), then five sequences with ≥ 3 min gaps. Report every number; PASS for G-M4 only if every strict-cold Hosting sequence is < 1.5 s and the origin sequence is either < 1.5 s or the client's race policy demonstrably delivers the Hosting answer first (verify in the browser with the network log which response the panel rendered and when).
- S-3 Function + copy: attempts[] present on the done event and JSON body with provider ids only (no URLs/keys); provider read at runtime in the disclosure; 'AI clone' absent from DOM, aria and shipped chunks (grep the _next chunks); note honestly that minivic-greeting.mp3 still speaks the retired sentence (listen: download and transcribe or read the txt) — grade it as a known OPEN item assigned to t_w2_r3a2, not a new FAIL.
- S-4 Browser (one headless Chrome at a time): 1440x900 and 390x844 — first fold, no scroll: elementFromPoint at the launcher centre is the pill; a REAL click opens the panel (this was FAIL at 390 in rev-12cd9123); the disclosure bar fully visible after an answer (scrollWidth ≤ clientWidth per line) in sentence case with 'via <provider>'; subtitle unclipped; badge 'MiniVic · synthetic'; the panel does not cover the H1 at 1440x900 (TC-BOT-14 contract 16 px clearance — measure and report; it was a pre-existing FAIL at 11 px); OG card: download /assets/og-image.png and measure dims + chroma; ladder doc on origin/main §1–2 consistent with the live files; regression: hero monochrome, G-C1 identical hrefs, G-V3, G-A3 ten sectors still countable, 0 pageerrors/console errors normal + ?gl=force at both widths, /api/tts 200.
- S-5 Write docs/delivery/evidence/v10-20260905T0515Z/G-REV/<sha>/08-adversarial-review.md (failures first; every verdict with command + number) and verdicts.json {sha, gaps:{'G-R2':…,'G-M4':…,'G-MV1':…,'G-OG1':…,'ladder_doc':…}, regression:{…}, R3:'OPEN', false_positives:[…]}; return {task_id:'t_w1_rev4', live_sha, verdicts, failures_first:[…], evidence:[…], goal_complete:true}. Read-only; ≤ 35 min including the idle windows (start the clock with S-2).

## QUALITY GATES
- Visitor sequence measured independently with the reviewer's own reader; verdict on the route the panel actually renders
- Every verdict cites a command and a captured number/screenshot
- Launcher click judged by a real click at both widths on the first fold
- Failures first; R3 OPEN; greeting MP3 drift graded as assigned-OPEN, not hidden
- Writes only under G-REV/<sha>/

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ | tail -3
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T02:37:57.432Z)
SCOPE NOTE 02:40Z: the composite SHA will also carry hero S1 (worktree-w2-h1s1 9287089 — [data-plane=hero] wraps Scene + figure; portrait inside the plane; role/location/caption below the fold). Record the fold state as INTERIM evidence (SPD baseline per viewport, text-leaf blocks ≤ 3, ledger top ≥ innerHeight, figure inside the plane, no upscale, LCP/CLS on live) — do not grade G-H1 PASS/FAIL until S4 lands; do flag any regression (contrast, pageerrors, G-MV1) as FAIL.

## COMMENT (2026-09-06T02:41:42.339Z)
SCOPE NOTE 02:47Z: the composite SHA also carries scene 7's mount (worktree-w2-x2s1 — sceneId career-descent, a sticky 160vh band after the chart in #experience, uSpans from experience.ts, one caption line over the canvas). Record INTERIM evidence (do not grade R2/G-X2 until s2/s3 land): data-scene=career-descent present in the served HTML, canvases ≥ 1 under ?gl=force in #experience at 1440/390, 0 pageerrors, only a caption over the canvas (no heading/paragraph/CTA), gold 0 in the canvas, text contrast in #experience ≥ 4.5:1, MiniVic dock not occluding .trackYears / [data-chart] (G-E2), and the recruiter sentence you would say about the band in one line. Any regression is a FAIL.

## STATUS (2026-09-06T02:48:46.346Z)
running — dispatched 02:49Z reviewer rev-97e19d07-w1 on the composite SHA

## COMPLETE (2026-09-06T03:23:09.444Z)
Reviewer rev-97e19d07-w1 (max, 32 min incl. two ≥10-min idle windows): G-R2 PASS (order behavioural, disclosure readable, attempts[], warm 204), G-MV1 PASS (pill wins hit-test and a real click opens the panel on the first fold at 390 and 1440), G-OG1 PASS (2400x1260 chroma 0), ladder doc PASS (F-3: two stale §1 rows og-image/greeting.txt, §11 'untouched'), R3 OPEN, greeting MP3 drift OPEN→t_w2_r3a2, hero S1 + scene-7 interim recorded with no regression, LCP/CLS PASS, 0 pageerrors. FAIL: G-M4 on the Hosting fallback (strict-cold 1805 ms; Fastly buffers the whole SSE so Hosting first byte = origin completion; the panel renders the ORIGIN route at 725/978 ms, origin strict-cold 965 ms, 0/5 over) → t_w1_m4b; TC-BOT-14 at 1440 (panel x 984→1416 covers the H1 glyph run 560→1215 by 231 px; pre-existing) → t_w1_mv4; F-4 MINIVIC-BRAIN-0-4 addendum 3200 vs 2600 contradiction → t_w1_doc2. Evidence G-REV/97e19d07/.
