# t_w1_rev5 — WAVE-2 REVIEW 5 — independent adversarial review of the live SHA carrying hero S2 (the light finds the figure: uFigure/uCopyGuard, re-rendered poster) + the story-contract tests + red-spec fixes: hero fold INTERIM (SPD per viewport/path, H1 contrast on glyph rects, 390), regression table, and the four earlier PASSes must still hold

**Status:** todo · **Priority:** 100 · **Parents:** t_w2_h1s2 · **Created:** 2026-09-06T03:25:17.759Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Read the live build-commit at start; it must descend from 9835a950 (hero S2), 8100d99b (story tests), a2891fc (red3). The hero set-piece is mid-flight (S3 typography, S4 parity/gate, S5 suite realignment still to land) — record the fold as INTERIM with numbers, grade only regressions. The S2 implementer reported: SPD ≥ 0.78 at 1440/1280/834 but 0.7153 at 390 (still), and TC-HERO-A11Y-01 red 8/8 on the H1 (P95 ground 0.83 vs glyph 0.92 under the font-box rect). Your job: measure the H1's readability as a READER sees it (contrast of the glyph ink against the P95 luminance under the glyph ink box, AND under the full line box — report both) at 1440/1280/834/390 on ?gl=force and reduced-motion; if the name is not readable at ≥ 4.5:1 on the glyph box, that is a FAIL regression (live readers see it now), not interim. Baselines: G-REV/97e19d07 and G-REV/12cd9123 verdicts.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read the two prior reviews' verdicts.json, docs/architecture/HERO-SETPIECE-v3.md §4.2/§7/§8 (the rules in tension), tests/overhaul/hero-plane-dominance.spec.ts + hero-setpiece.spec.ts (instrument), scripts/validate/hero_plane_dominance.mjs exports.
- S-2 Browser (one at a time): four viewports × (?gl=force settled, reduced-motion still): SPD via the instrument's own exports; H1 contrast on glyph ink box and line box; text-leaf blocks in the fold ≤ 3; ledger top ≥ innerHeight; figure inside the plane, ≤ 846 px; nothing plays by default (network log); LCP/CLS on live; 0 pageerrors/console errors; screenshots → G-REV/<sha>/.
- S-3 Regression table: G-H6 monochrome, G-C1, G-A3 ten sectors, G-MV1 first-fold click at 390, G-OG1, /api/tts, MiniVic disclosure visible, scene-7 band present, ?gl=off → 0 canvases (new deterministic contract from red3), TC-BOT-14 (report only; fix in flight).
- S-4 Write G-REV/<sha>/08-adversarial-review.md + verdicts.json {sha, interim:{hero:{spd:{...}, h1_contrast:{glyph_box:{...}, line_box:{...}}}}, regressions:{...}, R3:'OPEN'}; return {task_id:'t_w1_rev5', live_sha, verdicts, failures_first, evidence, goal_complete:true}. Read-only; ≤ 30 min.

## QUALITY GATES
- H1 readability measured on both boxes at 4 viewports × 2 paths with numbers
- Regression table re-run; failures first; interim clearly labelled
- Writes only under G-REV/<sha>/

## VERIFICATION
```bash
ls -t /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ | head -1
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T03:28:39.083Z)
running — dispatched 03:29Z reviewer rev-3657baa1-w2

## COMPLETE (2026-09-06T03:51:44.733Z)
Reviewer rev-3657baa1-w2 (max, 22 min): H1 readable by a reader (median local contrast 15.25–15.6:1 on the plate, 4 viewports × 2 paths) BUT F-1 GRADED FAIL: the plate is cut at the baseline so the 'p' descender of Deshpande leaves the plate onto near-white plane at every viewport/path (204/203/84/64 px at 1.10–1.55:1, one blob at the plate's bottom edge); F-2 glyph-box P95 < 4.5 at 6/8; F-3 line-box P95 red 8/8 (14.8–23.5% leading hangs off the plate); F-4 SPD 390 reduced-motion 0.7153 < SPD_MIN 0.75; F-5 FALSE POSITIVE in S2's report ('≥ 0.78 at 1280' — live 0.7788 gl / 0.7586 still); F-6 TC-BOT-14 panel over surname (mv4 queued). PASS: PLANE-02 8/8, SET-01 (2 blocks), SET-02 (zero margin), SET-03 figure ≤ 846, GL-01/02, nothing plays by default, PAL-01 chroma 0, LCP 972/772 ms CLS 0, 0 pageerrors, G-H6, G-C1, G-A3, G-MV1 390 click, G-OG1, disclosure visible, scene-7 band present, ?gl=off 0 canvases. Observation: gold body text in #about (about.ts:65 via --gold) beyond the gold rule → t_w2_a3g. Evidence G-REV/3657baa1/.
