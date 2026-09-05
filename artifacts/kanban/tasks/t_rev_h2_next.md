# t_rev_h2_next — Reviewer probe — G-H2 on the next live build carrying the real poster (t_x1_02c) + column grade (9e41474) + no-Suspense first paint (6f4ba6c): url() poster ≥ 0.10 luminance GL-blocked and JS-off, first-paint canvas timing, AA both paths, flagship floors, LCP/CLS

**Status:** todo · **Priority:** 98 · **Parents:** t_x1_02c · **Created:** 2026-09-05T14:24:22.399Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). One-Deploy reviewer task (RECTIFY 14:12Z cadence rule). Re-probe G-H2's FAIL clauses from G-REV/e3f0206c/08-adversarial-review.md on the build that carries t_x1_02c: .stage computed background-image contains url(/assets/…) and the stage box mean luminance ≥ 0.10 at 1440 and 390 with the WebGL chunk blocked AND with javaScriptEnabled:false; poster asset ≤ 500 kB and its source ≥ 3840×2160 (read the committed render script + asset headers); TC-HERO-SCRIM-01 semantics (outer thirds ≥ 0.06 brighter than the reading band) at 1440/390 gl + still; hero canvas mount time after DCL at /?gl=force (report ms, label SwiftShader); AA walk over #hero at 1440/390 on both paths; flagship hero floors; LCP < 2.5 s (LCP element named), CLS < 0.05 on 3 unskipped cold loads ×3 widths; no-JS: full page paints (6 headings, hero h1/statement/actions/photo) at 1440/390; 0 pageerrors. Verdict per clause, failures first, false-positive register (claims in the poster commit you cannot reproduce), one-line status of other open items. Write G-REV/<build>/08-adversarial-review.md, push a docs branch, return the structured verdict; the orchestrator completes this task on receipt.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- wait for the Deploy carrying t_x1_02c (orchestrator dispatches you with the build id)
- probe as above with your own scripts (reuse method from G-REV/e3f0206c/captures)
- write the report + captures; push

## QUALITY GATES
- Every clause has a fresh live number
- Failures first; register present
- PASS only if poster + luminance + JS-off + AA + floors all hold

## VERIFICATION
```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
