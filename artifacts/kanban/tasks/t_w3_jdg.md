# t_w3_jdg — WAVE-3 JUDGE (reviewer, max, independent) — score direction A (title-sequence) and direction B (simulation) on the Owner's words, the AQ rubric applied to the real prototype frames, the CQ gate-set quality, feasibility on this stack and host, risk to the immovables, and time-to-first-visible-ship; re-derive ≥ 3 frame measurements per direction yourself; verdict with winner, grafts from the loser, must-fix list, hard NOs — docs/delivery/evidence/v10-20260905T0515Z/W3-JUDGE/

**Status:** todo · **Priority:** 100 · **Parents:** t_w3_pa, t_w3_pb · **Created:** 2026-09-06T05:41:45.647Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). You judge; you never edit app code, docs or tests. The Owner's words (artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md): 'remove all this shabby UI/UX, visualisations etc., and replace it with MARVEL STUDIOS grade visual effects and visualisations quality and sophistication. Only black, white..'. The four Owner screenshots are the FAIL baseline. Score with instruments and the rubric; adjectives are not scores (R7).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- J-1 Read: the directive note and the four Owner screenshots; docs/prompt.md §0.3, R1, R2, R7, §14; docs/architecture/CINEMATIC-VFX-v1-A.md + CINEMATIC-VFX-TASKS-A.json + evidence W3-DIR-A/ (frames + measurements.json); the same for B. Look at every frame (Read renders PNGs).
- J-2 Score each direction, with the reason beside every number: D1 fidelity to the Owner's words (replace not polish; Marvel-grade craft; black/white only; gold nowhere in effects) 0–10 · D2 AQ rubric from the frames (each AQ criterion 0–5; compare the frame to the Owner's hero screenshot side by side and to the named reference craft) · D3 CQ gate-set quality (instrumented, thresholds, no adjectives, carried instruments present) 0–10 · D4 feasibility on the stack/host (bundle ceiling, GPU ladder, ≤30-min slices with real files, test plan, 4-core build time) 0–10 · D5 safety of the immovables (LCP/CLS, budgets, a11y, reduced-motion, no-GL, R7, G-MV1) 0–10 · D6 minutes to the first visible hero ship (from the slices). Weighted total: D1 30 %, D2 30 %, D3 10 %, D4 15 %, D5 15 %; D6 reported, not weighted.
- J-3 Re-derive at least three measurements per direction from the frames yourself (sharp or python) — luma range, flat-fill ratio, max chroma — and report where your numbers differ from the SA's.
- J-4 Verdict: winner (or 'neither — both fail the bar on X' with the exact fix required), grafts to take from the loser (specific mechanisms), must-fix list before synthesis, hard NOs (anything that would break an immovable), and the recruiter sentence each hero frame produces. Write docs/delivery/evidence/v10-20260905T0515Z/W3-JUDGE/verdict.md and verdicts.json ({A:{D1..D6,AQ:{…},total},B:{…},winner,grafts:[…],must_fix:[…],hard_no:[…]}). ≤ 30 min. Return the verdicts.json object plus task_id:'t_w3_jdg', goal_complete:true.

## QUALITY GATES
- Every score carries a reason and, where a frame is involved, a frame path
- ≥ 3 independently re-derived measurements per direction
- Winner + grafts + must-fix + hard NOs written; nothing edited outside W3-JUDGE/

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-JUDGE/verdicts.json
git -C /root/forgotten-mistory status --porcelain -- app components lib tests docs/architecture | wc -l
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## DECISION (2026-09-06T05:56:15.608Z)
05:58Z the prototype stage was cut for time: score AQ from each spec's storyboards, technique and any frames present (W3-DIR-A/B may be empty); where no frame exists, score AQ on the mechanism described and say so; add D7 'time to a credible hero on the interim frame' — the removal slices (t_w3_rm1/rm2, docs/architecture/INTERIM-FRAME.md) strip every current effect, so slice 1 builds on a black frame.

## UPDATE (06:29Z) — prototypes exist after all
Prototype A landed (docs/architecture/proto/cinematic-A/index.html; frames + measurements.json in docs/delivery/evidence/v10-20260905T0515Z/W3-DIR-A/). Prototype B is being captured now (W3-DIR-B/); start with J-1 on both specs and W3-DIR-A, then before J-2 poll for W3-DIR-B/measurements.json every 30 s for up to 10 minutes (a `while` loop on the file path — never on a process name); if it never appears, score B's AQ from the spec and say so. The interim frame (removal slice 0a) is live at 83590944: slice 1 of the winning direction builds on a black ground with the words, the photograph, the ledger and the ten rows already in place (docs/architecture/INTERIM-FRAME.md).

## STATUS (2026-09-06T06:29:09.929Z)
running — dispatched 06:29Z fm-wave3-judge-synth (reviewer opus/max) — proto B still capturing; judge polls for W3-DIR-B/measurements.json

## COMPLETE (2026-09-06T07:00:31.308Z)
Verdict (W3-JUDGE/verdict.md, verdicts.json, 06:53Z): WINNER B (simulation school) by 0.13/10 — narrow, on the frame: B's hero is the only one with a legible key, visible atmosphere and the subject lit inside the volume, the only one passing CQ-01 in the gate's own colour space (0.917 vs A 0.370), no AQ criterion below 3 (AQ mean 3.625 vs A 3.25 with AQ-02=2). NEITHER clears the AQ ship bar (mean >= 4.0) — the loop iterates. Grafts from A: per-section canvases behind Scene.tsx/useGLCapability (no single renderer), A1-shaped 30-min first slice on the interim frame, stills rendered from the shader inside build:static, A's anamorphic/finish stack to the tap. Must-fix: grain into band (B measured 0.0074-0.0097 vs authored 0.018), layer separation (1 of 4 pairs clears 1.35), per-pixel ground ceiling inside text rects (name-box contrast 3.86:1 measured), fix both measurement instruments (A used Rec.709 on gamma sRGB; B's CQ-02 under-specified). Hard NOs: no troika/postprocessing/GSAP/Text3D; no single WebGLRenderer for the document.
