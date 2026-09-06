# t_w2_x2f5 — CORRECTION G-A3 story (rev-12cd9123-w1 sub-claim FAIL) — the About field must encode WHICH dimensions are answered from light alone in the section's first-screen state: answered/open ≥ 1.6 at 1440 and 390 (ring and fan), ≥ 9/10 seams ≥ 12%, without raising luminance over type (READING_CEILING 0.10 / INSTRUMENT_CEILING 0.24 untouched) and with zero gold

**Status:** ready · **Priority:** 94 · **Parents:** t_w1_rev3 · **Created:** 2026-09-06T02:10:43.917Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: TC-SCENE-ABOUT-10 answered/open clause
Original output: t_w1_a3 e5c1e4d (live 12cd9123) — multiplicative state term (answered full light, open 45° hatch at ~0.40) measured 4.04 ring / 5.9 fan at 1440 with dimension 4 active.
Failing criteria (docs/delivery/evidence/v10-20260905T0515Z/G-REV/12cd9123/08-adversarial-review.md F-2, a3-field-probe.json): with dial+column hidden and the section at the top of the viewport (data-axis=-1, no dimension active), ring answered/open = 1.039 at 390x844 DPR3 (fan 0.983) and 1.596 at 1440; only 6/10 seams clear 12% at 1440; per-sector ring means at 1440: 0.7065 0.6327 0.3556 0.4980 0.0122 0.2169 0.0627 0.2303 0.5661 0.7133 — sector 5 (Culture Fit, answered) is the darkest, sector 9 (Company Stability, open) is 0.566: brightness tracks position on the plane, not about.ts; hatch energy does not separate the groups (0.944 / 1.088).
Required fix: in components/sections/About/field.glsl.ts (+ AboutField.tsx uniforms only if needed) make the state term dominate the positional light in EVERY state including data-axis=-1 — e.g. normalise the fan/haze by sector so each sector's base light is equal before the answered/open multiplier, and apply the multiplier to the fan as well as the ring — so that answered/open ≥ 1.6 holds at 1440 and 390 in the initial state and with any dimension active, ≥ 9/10 seams ≥ 12%, while plane dominance stays ≥ 0.75 (measured 75.2% — do not lose it), text contrast stays ≥ 4.5:1 (ceilings untouched), gold 0, TC-SCENE-ABOUT-01..09 + 11 stay green, flagship-visibility coverage/motion floors hold.
Verification: extend TC-SCENE-ABOUT-10 to run in BOTH states (data-axis=-1 and axis 4) at 1440 and 390 and to print the ten per-sector means; capture failing on origin/main first; then tests/overhaul/scene-about.spec.ts tests/overhaul/flagship-visibility.spec.ts -g ABOUT tests/a11y/text-contrast.spec.ts tests/e2e/about.spec.ts green on :5627; screenshots field-alone at both widths in both states.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w2-x2f5 from origin/main (.claude/worktrees/w2-x2f5, node_modules symlink). One build / one browser.
- S-1 Read the review F-2 + a3-field-probe.json + a3-hatch-texture.json; About/field.glsl.ts, AboutField.tsx, About.tsx (how data-axis and the masks reach uniforms), tests/overhaul/scene-about.spec.ts (TC-SCENE-ABOUT-10/11), docs/architecture/SIGNATURE-SCENES-v2.md §story contract (About: TC-STORY-ABOUT-01/02).
- S-2 TESTS FIRST: extend TC-SCENE-ABOUT-10 as specified (both states, both widths, per-sector means printed); capture failing → W2-X2/t_w2_x2f5/02-tests-failing.log.
- S-3 Implement the shader change (smallest); keep the ceilings; keep the dial ink demotion.
- S-4 Verify as specified; audit 10/10; tsc; lint; ?gl=force 0 pageerrors; screenshots.
- S-5 Ledger; commit 'feat(about): answered/open light dominates position in every state (G-A3 story)' with the two mandatory trailers; push worktree-w2-x2f5.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, measurements:{ratio_1440_init, ratio_390_init, ratio_1440_axis4, seams_1440, dominance, contrast_min}, gates:{...}, evidence:[], goal_complete}.

## QUALITY GATES
- answered/open ≥ 1.6 ring AND fan, both widths, both states; ≥ 9/10 seams ≥ 12%
- dominance ≥ 0.75; contrast ≥ 4.5:1; ceilings untouched; gold 0; ABOUT-01..09,11 green; flagship floors hold
- tests failed first; tsc · lint · build · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w2-x2f5 && PLAYWRIGHT_BASE_URL=http://127.0.0.1:5627 npx playwright test tests/overhaul/scene-about.spec.ts -g 'ABOUT-10'
git ls-remote --heads origin worktree-w2-x2f5
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T03:25:17.698Z)
SCOPE ADD 03:27Z (from t_w2_x2t1): TC-STORY-ABOUT-02@390 — role-side maxima must sit ≥ 15% below the candidate-side mean; measured deficit 0.1098 (role 0.1733, candidate 0.1947). Your answered/open ≥ 1.6 fix should carry this; run tests/overhaul/story-contract.spec.ts -g ABOUT at both widths and report both numbers.

## COMMENT (2026-09-06T04:07:55.990Z)
Lane outcome 04:07Z (ap-w2-x2f5): 479e2b2 fixed the ratio (ring 1.556 @1440 rest, 3.348→7.791 @390 rest, fan up to 14.996) but the three open wedges give up light across the plane and TC-FLAGSHIP-VIS-ABOUT coverage fell 15.52% → 13.66% (floor 15%); three measured attempts to buy area back either stayed under the floor (14.28/14.82) or broke TC-CONTRAST-01/02 at 390 (15.31%) because guarded light under type (ceilings 0.10/0.24) can never count as coverage — the unguarded plane at 390 is where the heading and the instrument sit. The AP REVERTED the shader (ef2979a, pushed) and kept the extended TC-SCENE-ABOUT-10 (both states, both widths, per-sector means printed) as a failing assertion in the repo. Correct §0.1 behaviour: no floor was lowered. Three-way tension (story ratio ≥ 1.6 vs coverage ≥ 15% vs contrast) → solutions-architect decision t_w2_a3sa.
