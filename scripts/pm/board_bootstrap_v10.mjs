// One-time generator that created the v10 board on 2026-09-05 (kept as the record of the initial decomposition; re-running would overwrite live task files — do not run).
// PM bookkeeping: writes the file-backed Kanban board (docs/prompt.md §4) from the assessed state.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT = '/root/forgotten-mistory';
const K = path.join(ROOT, 'artifacts/kanban');
const NOW = new Date().toISOString();
const RUN = 'v10-20260905T0515Z';
const EV = `docs/delivery/evidence/${RUN}`;
const LIVE = 'https://forgotten-mistory.web.app';
const id = (slug) => 't_' + crypto.createHash('sha1').update(slug).digest('hex').slice(0, 8);
const H = {
  orchestrator: { role: 'feedback_refactor_loop', level: 'orchestrator', effort: 'ultracode', model: 'claude-fable-5-1 (ultracode) · Max OAuth' },
  reviewer: { role: '3rd_party_independent_adversarial_review', level: 1, effort: 'max', model: 'claude-opus · Max OAuth' },
  'solutions-architect': { role: 'architecture / requirements_analysis', level: 1, effort: 'max', model: 'claude-opus · Max OAuth' },
  'analyst-programmer': { role: 'coding', level: 2, effort: 'xhigh', model: 'claude-opus · Max OAuth' },
  tester: { role: 'testing / qa', level: 2, effort: 'xhigh', model: 'claude-opus · Max OAuth' },
  'cleanup-agent': { role: 'cleanup', level: 4, effort: 'medium', model: 'claude-sonnet · Max OAuth' },
  researcher: { role: 'research', level: 3, effort: 'high', model: 'perplexity/sonar-reasoning-pro · OpenRouter → Anthropic OAuth (§0.4 failover)' },
  coder: { role: 'coding / documentation', level: 4, effort: 'medium (xhigh when coding)', model: 'deepseek · OpenRouter → Anthropic OAuth (§0.4 failover)' },
};
const PROVIDER = (a) => (a === 'researcher' || a === 'coder')
  ? 'OpenRouter (OPENROUTER_API_KEY) — balance is −$5.38 (402) as of 2026-09-05T05:50Z, so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.'
  : 'Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.';
const BATTERY = [
  'npx tsc --noEmit',
  'npm run lint',
  'node scripts/validate/overhaul_static_audit.mjs   # must print RESULT: ALL PASS (10/10)',
  'npm run build:static',
  'python3 -m http.server <PORT> --directory out --bind 127.0.0.1 &   # 5601 or 5602 — never 5599/8080 (foreign servers)',
  'PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> npx playwright test   # 276 specs; every failure triaged with proof',
];
const tasks = [];
function T(o) { tasks.push(o); return o; }

// ---------- migrated from the retired Hermes board (ids preserved) ----------
T({ id: 't_c51b34a7', status: 'done', assignee: 'orchestrator', priority: 95, parents: [],
  title: 'Run v10 open — docs/prompt.md + v9 evidence (F-lighthouse-ci, F-security-upgrade, R-c12) recorded',
  summary: 'Commit 8dc4cf4 on origin/main; live build-commit 8dc4cf46; deploy run 05:18Z success.',
  order: ['S-1 Record run manifest → docs/delivery/evidence/v10-20260905T0515Z/00-run-manifest.json (done)', 'S-2 Commit v9 phase F + c12 evidence (done, 8dc4cf4)'],
  gates: ['[x] origin/main == live build-commit', '[x] manifest written'],
  verify: ['curl -s https://forgotten-mistory.web.app/ | grep -o \'name="build-commit" content="[^"]*"\''],
  migrated: 'Hermes board `default` task t_c51b34a7 (done) — migrated 2026-09-05T05:5xZ; Hermes is retired by docs/prompt.md (Runtime HARD).' });

T({ id: 't_62c9ee4d', status: 'running', assignee: 'analyst-programmer', priority: 92, parents: [],
  title: 'Cycle 13 — Next 15.5.25 security upgrade + checks.yml installs functions deps + .gitignore conflict markers',
  summary: 'Worktree .claude/worktrees/wf_18f926b0-2a4-1 (base 8dc4cf4). Battery already green there: tsc 0, lint 0, audit 10/10, build exit 0, secret scan PASS, root npm audit 0 vulns; regression log stopped at 243/276 (8 ✘, all in the CI-red list). Nothing committed yet.',
  order: [
    'S-1 In /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1: `git status` must show the 6 staged + 5 unstaged files listed in artifacts/kanban/tasks/t_62c9ee4d.md §STATE; do not re-apply the patch.',
    'S-2 `git checkout -- app/data/generated/build-stamp.ts` (D-7: the null stamp never lands). Stage `.github/workflows/checks.yml`, `.gitignore`, `tests/ci_pipeline.test.mjs`, `reports/static-audit.json`.',
    'S-3 Re-run the four node contract files: `node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs tests/github-telemetry.test.mjs tests/minivic_chat_function.test.mjs` → append to docs/delivery/evidence/v10-20260905T0515Z/C13-next15/04b-node-tests.log.',
    'S-4 Commit on branch worktree-wf_18f926b0-2a4-1: `chore(deps): next 15.5.25 — audit clean, CI installs functions deps` (Conventional Commits, ≤72 chars, imperative). Body cites 07-decisions.md D-1…D-8.',
    'S-5 Finish the full regression to completion on :5601 (serve out/ built from the committed tree) → 05-regression-full.log overwritten with the complete run; list every ✘ with the proof it is pre-existing (compare against docs/delivery/evidence/v10-20260905T0515Z/00-run-manifest.json ci_checks_33936783382).',
    'S-6 Append D-9 (commit sha, regression totals) to 07-decisions.md; commit the evidence: `docs(evidence): C13 regression complete`.',
  ],
  gates: ['[ ] tsc 0 errors', '[ ] lint 0 errors', '[ ] static audit 10/10', '[ ] build:static exit 0 + secret scan PASS', '[ ] npm audit --audit-level=high: 0', '[ ] 276 specs run to completion; every ✘ named + proven pre-existing on main', '[ ] build-stamp.ts unchanged vs HEAD in the commit', '[ ] two commits on the branch, nothing uncommitted except out/'],
  verify: ['git -C /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1 log --oneline main..HEAD   # 2 commits', 'git -C /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1 show --stat HEAD~1 | grep -c "package.json\\|checks.yml\\|.gitignore"   # 3', 'grep -c "✘" docs/delivery/evidence/v10-20260905T0515Z/C13-next15/05-regression-full.log', ...BATTERY],
  migrated: 'Hermes t_62c9ee4d (ready) — in-flight worktree found with the full battery run but no commit.',
  state: 'staged: .eslintrc.json app/not-found.tsx app/performance-benchmark/page.tsx package-lock.json package.json tsconfig.json · unstaged: .github/workflows/checks.yml .gitignore app/data/generated/build-stamp.ts reports/static-audit.json tests/ci_pipeline.test.mjs · untracked: docs/delivery/evidence/v10-20260905T0515Z/C13-next15/' });

T({ id: 't_8cdf3b61', status: 'running', assignee: 'analyst-programmer', priority: 90, parents: [],
  title: 'Cycle 11 — Vitrine rail mask/trace-on + lit-plate fix, Skills/About contrast, hero 390 one-fold (R-c8 C-02/C-06, TC-CONTRAST-01, TC-HERO-12)',
  summary: 'Worktree .claude/worktrees/wf_18f926b0-2a4-2 (base 8dc4cf4). Patch applied + real fixes D-1…D-6 written (07-decisions.md); TDD failing log captured (7 failed / 10 passed on unpatched main). NOT yet done: passing battery, regression, screenshots, D-7+, commit.',
  order: [
    'S-1 Read docs/delivery/evidence/v10-20260905T0515Z/C11-vitrine-integration/07-decisions.md (D-1…D-6) and `git status` in /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-2 — continue, do not redo.',
    'S-2 `.eslintrc.json` already carries "root": true (D-1); keep it — cycle 13 lands the identical line.',
    'S-3 Build (`npm run build:static`), serve on :5602, run `tests/e2e/vitrine.spec.ts tests/e2e/hero.spec.ts tests/a11y/text-contrast.spec.ts tests/overhaul/page-spine.spec.ts` → 04-tests-passing.log (all green incl. TC-VIT-10..13, TC-HERO-12, TC-CONTRAST-01 @1440 and @390).',
    'S-4 Screenshots of #vitrine, #hero, #about, #skills at 1440/1280/834/390 via 08-screenshots.mjs → 08-screens/*.png; look at them; record D-7 (visual) with what you saw.',
    'S-5 Full suite in two halves on :5602 (`--shard=1/2`, `--shard=2/2`) → 05-regression-a.log / 05-regression-b.log; every ✘ named and proven pre-existing (compare 00-run-manifest.json ci_checks list) or fixed.',
    'S-6 Rebaseline only the three intentional PNGs already in the diff (hero-section, hero-full, viewport-top-1440x900) with UPDATE_SNAPSHOTS=1 on those specs; open the PNGs before committing.',
    'S-7 `git checkout -- app/data/generated/build-stamp.ts`; commit on branch worktree-wf_18f926b0-2a4-2: `feat(vitrine): rail on the page spine, plates trace on when lit, hero holds one fold at 390`; second commit for evidence.',
  ],
  gates: ['[ ] TC-VIT-01..13 green', '[ ] TC-HERO-12 green at 390×844 (action bottom ≤ 844)', '[ ] TC-CONTRAST-01 green @1440 and @390', '[ ] tsc 0 · lint 0 · audit 10/10 · build exit 0', '[ ] full suite: every ✘ proven pre-existing or fixed', '[ ] no gold outside live repository URLs (tests/monochrome green)', '[ ] reduced-motion: dashoffset 0 immediately (TC-VIT-11)', '[ ] screenshots at 1440/1280/834/390 exist and were looked at'],
  verify: ['git -C /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-2 log --oneline main..HEAD', 'PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/e2e/vitrine.spec.ts tests/e2e/hero.spec.ts tests/a11y/text-contrast.spec.ts', ...BATTERY],
  migrated: 'Hermes t_8cdf3b61 (ready) — in-flight worktree found at decision D-6.' });

T({ id: 't_c3ece39c', status: 'todo', assignee: 'cleanup-agent', priority: 60, parents: ['t_62c9ee4d', 't_8cdf3b61'],
  title: 'Hygiene — remove the two superseded worktrees + /var/tmp/v6-wt once cycles 11/13 are on main; remote = main only',
  summary: 'decision.md (HYG-branches) already abandoned wt/data-backend and pruned 5 worktrees/4 branches. Left: .claude/worktrees/wf_7658aeb2-d07-1 (base 4f1d659, superseded by wf_18f926b0-2a4-2) and wf_dc0c232e-59d-1 (base 0c02861, superseded by wf_18f926b0-2a4-1); empty dir /var/tmp/v6-wt.',
  order: [
    'S-1 Preconditions (verify, do not assume): `git log --oneline -3 origin/main` contains the C13 and C11 commits; live build-commit meta equals origin/main HEAD.',
    'S-2 Archive each superseded diff first: `git -C <wt> diff > docs/delivery/evidence/v10-20260905T0515Z/HYG-branches/<name>-superseded.patch` (both), then `git worktree remove --force <wt>` and `git branch -D worktree-wf_7658aeb2-d07-1 worktree-wf_dc0c232e-59d-1`.',
    'S-3 `rmdir /var/tmp/v6-wt` (must be empty — `ls -A` first). `git worktree prune`.',
    'S-4 After the pipeline consolidates: `git ls-remote --heads origin` → refs/heads/main only; `gh pr list --state open` → empty; local `git branch` → main + only live council worktree branches.',
    'S-5 Append the actions + outputs to docs/delivery/evidence/v10-20260905T0515Z/HYG-branches/decision.md (section "Run v10 cycle H-2").',
  ],
  gates: ['[ ] both superseded diffs archived as .patch before removal', '[ ] remote heads == main only', '[ ] 0 open PRs', '[ ] no detached-HEAD worktrees', '[ ] nothing removed that is ahead of main (git rev-list --count main..<branch> == 0 proven)'],
  verify: ['git worktree list', 'git branch -a', 'git ls-remote --heads origin', 'gh pr list --state open'],
  migrated: 'Hermes t_c3ece39c (ready) — first half executed 05:22Z (decision.md).' });

T({ id: 't_d0066b7a', status: 'todo', assignee: 'tester', priority: 85, parents: ['t_62c9ee4d', 't_8cdf3b61'],
  title: 'Cycle 14 — every remaining red Playwright spec on main triaged and fixed until Checks e2e is green (0 regression, R8/C-7)',
  summary: 'Checks run 33936783382 on debd25b: 15 failed / 272 passed. C13 regression (Next 15) showed 8 ✘: GC-01 gold-contrast, TC-CONTRAST-01 @390/@1440, TC-BOT-12, TC-EXP-11, TC-HERO-12, TC-STATE-HOVER, TC-STATE-ACTIVE. Cycle 11 fixes CONTRAST + HERO-12. Remaining after landing: GC-01, TC-BOT-12, TC-EXP-11, TC-STATE-HOVER/ACTIVE + whatever the merged main shows.',
  order: [
    'S-1 Fresh worktree from origin/main after both parents landed; `npm ci && npm ci --prefix functions`; build; serve on :5601; full run → docs/delivery/evidence/v10-20260905T0515Z/C14-red-specs/01-baseline.log.',
    'S-2 For each ✘: reproduce alone (`--repeat-each=2`), classify {site defect | stale spec | test bug | harness (headless WebGL/CLS)} with the evidence line; a stale spec is retired only with proof the subject no longer exists.',
    'S-3 Site defects → fix in source (TDD: the red spec is the test); test bugs → fix the spec; harness-only → make the assertion environment-aware WITHOUT weakening it on a real browser (document why).',
    'S-4 Full suite green locally → 04-tests-passing.log; commit `test(regression): cycle 14 — <n> defects fixed, <m> specs corrected` + evidence commit; push branch.',
    'S-5 After deploy.yml consolidates: `gh run list --workflow Checks --limit 1` → e2e job conclusion recorded in 06-ci.log.',
  ],
  gates: ['[ ] 276/276 locally (or each remaining ✘ has a written, evidenced harness-only reason)', '[ ] no test deleted, no threshold loosened, no `test.skip` without a proven-stale subject', '[ ] Checks e2e job green on GitHub for the landed commit', '[ ] tsc/lint/audit/build green'],
  verify: ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test', 'gh run list --workflow Checks --limit 3 --json conclusion,headSha'],
  migrated: 'Hermes t_d0066b7a (ready).' });

T({ id: 't_4adf34f7', status: 'todo', assignee: 'reviewer', priority: 95, parents: [id('deploy-c13'), id('deploy-c11')],
  title: 'R-c13 — adversarial + composition + motion council review of the LIVE site after cycles 11/13 land (O2/O6)',
  summary: 'Three independent reviewers (adversarial, composition, motion) against https://forgotten-mistory.web.app/?gl=force at 1440/1920/834/390 + reduced-motion + no-GL; merged verdict with a prioritised, file:line-exact backlog like R-c8. Also grades the §0.3 mandates (one flagship visualisation per section; black/white/gold only; narrative) and R2 (≥7 signature scenes — currently 2 GLSL + 4 SVG/CSS).',
  order: [
    'S-1 Read docs/delivery/evidence/v9-20260904T2312Z/R-c8/review.md (format + closed items C-01/C-02/ADV-F-1/MOT-F-2/C-05/C-06) and the live build-commit meta.',
    'S-2 Adversarial lens: console errors, pageerrors, failed requests, axe (wcag2a/2aa/21a/21aa), CSP/XFO/HSTS, asset budgets, reduced-motion running animations, no-GL readability, /api/chat 200 + resume-grounded answer, tab order, keyboard path to every CTA → R-c13/adversarial-report.json + adversarial-review.md.',
    'S-3 Composition lens (senior creative UI council): per section, exact aesthetic directions with px measurements and file:line targets; palette = tokens only, gold only on sourced → R-c13/council-composition.md.',
    'S-4 Motion lens: per section one flagship animation/visualisation graded against the Marvel-Studios/60 fps bar; fps sampled via requestAnimationFrame over 3 s at 1440 and 390; reduced-motion path per scene → R-c13/council-motion.md.',
    'S-5 Merge: verdict PASS/FAIL; contradictions resolved with reasons; backlog table (id, section, severity, tag, one line) + per-item Finding/Direction/Files/Acceptance → R-c13/review.md.',
  ],
  gates: ['[ ] every finding tagged Verified/Inferred/Assumed with the artifact path', '[ ] screenshots at 390/834/1280/1440/1920 in R-c13/capture/', '[ ] verdict stated; FAIL items carry exact acceptance lines', '[ ] no self-review: reviewer never touched cycles 11/13 code'],
  verify: ['ls docs/delivery/evidence/v10-20260905T0515Z/R-c13/', 'grep -c "^### " docs/delivery/evidence/v10-20260905T0515Z/R-c13/review.md'],
  migrated: 'Hermes t_4adf34f7 (ready).' });

T({ id: 't_3bf56e4a', status: 'todo', assignee: 'orchestrator', priority: 80, parents: [],
  title: 'EPIC — cycles 15+: fold the R-c8 / R-c13 backlog (children below carry the work; this task closes when every child is Done)',
  summary: 'Open R-c8 items after cycles 7/11/12/13: MOT-F-1, C-03 (verify), C-04 (+ADV-F-3), C-07, C-08, ADV-F-2, MOT-F-3, C-09, C-11, ADV-F-4. Each is a child task with the R-c8 direction verbatim as spec.',
  order: ['S-1 Children created (see parents field on each)', 'S-2 Close when all children Done and R-c13 PASS'],
  gates: ['[ ] all children Done', '[ ] R-c13 (or later) review verdict PASS'],
  verify: ['node -e "const b=require(\'/root/forgotten-mistory/artifacts/kanban/board.json\');console.log(b.tasks.filter(t=>t.parents.includes(\'t_3bf56e4a\')).map(t=>t.id+\':\'+t.status).join(\' \'))"'],
  migrated: 'Hermes t_3bf56e4a (ready) — split into children per §13.2 (Split rule).' });

// ---------- new: verification + deploy chain for the two in-flight cycles ----------
T({ id: id('verify-c13'), status: 'todo', assignee: 'reviewer', priority: 92, parents: ['t_62c9ee4d'],
  title: 'V-C13 — independent verification of cycle 13 (Next 15.5.25) from git + logs only',
  summary: 'Fresh reviewer; reads only the branch diff and the committed evidence logs; re-runs the deterministic gates itself.',
  order: [
    'S-1 `git -C /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1 diff main...HEAD --stat` — confirm exactly the files named in C13-next15/07-decisions.md D-1…D-3 changed plus evidence; no build-stamp null.',
    'S-2 Re-run yourself in that worktree: `npx tsc --noEmit`, `npm run lint`, `node scripts/validate/overhaul_static_audit.mjs`, `npm audit --audit-level=high`, `node --test tests/ci_pipeline.test.mjs` — capture exit codes.',
    'S-3 Read 05-regression-full.log: count ✘; each must be in the manifest\'s CI-red list (00-run-manifest.json → ci_checks_33936783382) or otherwise proven pre-existing.',
    'S-4 Write docs/delivery/evidence/v10-20260905T0515Z/C13-next15/09-verification.md: verdict PASS/FAIL, per-gate exit code, tagged claims.',
  ],
  gates: ['[ ] all five commands exit 0', '[ ] every regression ✘ pre-existing', '[ ] verdict written with evidence paths'],
  verify: ['cat docs/delivery/evidence/v10-20260905T0515Z/C13-next15/09-verification.md | head -20'] });

T({ id: id('verify-c11'), status: 'todo', assignee: 'reviewer', priority: 90, parents: ['t_8cdf3b61'],
  title: 'V-C11 — independent verification of cycle 11 (Vitrine / contrast / hero 390) from git + logs + screenshots',
  summary: 'Fresh reviewer; verifies acceptance lines of R-c8 C-02 and C-06 plus TC-CONTRAST-01/TC-HERO-12 against the branch build, not the author\'s report.',
  order: [
    'S-1 In /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-2: `git log --oneline main..HEAD` (2 commits expected); build; serve :5602.',
    'S-2 Run tests/e2e/vitrine.spec.ts tests/e2e/hero.spec.ts tests/a11y/text-contrast.spec.ts tests/monochrome yourself; all green.',
    'S-3 Open the 08-screens PNGs at 1440 and 390; confirm card 01 lit at rest, right-most card fades, first card border-left == heading left (≤1px), hero action within 844 at 390.',
    'S-4 Reduced-motion check: context reducedMotion:"reduce" → lit plate strokes dashoffset 0 at 100 ms.',
    'S-5 Write C11-vitrine-integration/09-verification.md: verdict + evidence.',
  ],
  gates: ['[ ] specs green under the reviewer\'s own run', '[ ] acceptance measurements recorded (px values)', '[ ] verdict written'],
  verify: ['head -20 docs/delivery/evidence/v10-20260905T0515Z/C11-vitrine-integration/09-verification.md'] });

T({ id: id('deploy-c13'), status: 'todo', assignee: 'orchestrator', priority: 93, parents: [id('verify-c13')],
  title: 'D-C13 — merge cycle 13 into main, push, verify the live build-commit',
  summary: 'Orchestrator consolidation duty (O3/O4). git merge --no-ff worktree-wf_18f926b0-2a4-1 into main; git push origin HEAD:main; deploy.yml deploys; verify meta.',
  order: ['S-1 `git merge --no-ff worktree-wf_18f926b0-2a4-1` on main (ledger rows appended first)', 'S-2 `git push origin HEAD:main`', 'S-3 `gh run watch` the Deploy run; then `curl -s https://forgotten-mistory.web.app/ | grep build-commit` == HEAD[0:8]', 'S-4 Record in artifacts/kanban/cycles/'],
  gates: ['[ ] ledger rows for every changed file', '[ ] live build-commit == main HEAD', '[ ] Deploy run success'],
  verify: ['gh run list --workflow Deploy --limit 1 --json conclusion,headSha', 'curl -s https://forgotten-mistory.web.app/ | grep -o \'content="[0-9a-f]\\{8\\}"\''] });

T({ id: id('deploy-c11'), status: 'todo', assignee: 'orchestrator', priority: 91, parents: [id('verify-c11')],
  title: 'D-C11 — merge cycle 11 into main, push, verify the live build-commit',
  summary: 'Same as D-C13 for worktree-wf_18f926b0-2a4-2; .eslintrc.json root:true is identical on both sides (no conflict expected).',
  order: ['S-1 `git merge --no-ff worktree-wf_18f926b0-2a4-2`', 'S-2 push HEAD:main', 'S-3 verify live meta', 'S-4 cycle record'],
  gates: ['[ ] ledger rows', '[ ] live build-commit == HEAD', '[ ] Deploy success'],
  verify: ['curl -s https://forgotten-mistory.web.app/ | grep -o \'content="[0-9a-f]\\{8\\}"\''] });

T({ id: id('board-bootstrap'), status: 'done', assignee: 'orchestrator', priority: 100, parents: [],
  title: 'Board bootstrap — file-backed Kanban (artifacts/kanban), ledger, owner prompt refresh committed',
  summary: 'docs/prompt.md refreshed by the Owner (Fable 5.1 ultracode, no Hermes, file-backed board); Hermes board `default` retired — its 7 tasks migrated with ids preserved; artifacts/kanban/ un-ignored so the ledger is versioned.',
  order: ['S-1 artifacts/kanban/board.json + tasks/*.md + cycles/ + delegation-ledger.jsonl', 'S-2 .gitignore: !artifacts/kanban/ !artifacts/delegation-ledger.jsonl', 'S-3 commit docs(prompt)+board+HYG evidence; push HEAD:main'],
  gates: ['[x] board.json parses', '[x] every task file has the eight sections in order', '[x] committed on main'],
  verify: ['node -e "JSON.parse(require(\'fs\').readFileSync(\'/root/forgotten-mistory/artifacts/kanban/board.json\'))"'] });

// ---------- cycles 15+ children (R-c8 directions, verbatim intent) ----------
const c8 = (slug, pr, title, summary, order, gates, verify, assignee = 'analyst-programmer', parents = ['t_3bf56e4a', id('deploy-c11')]) =>
  T({ id: id(slug), status: 'todo', assignee, priority: pr, parents, title, summary, order, gates, verify });

c8('c15-mot-f1', 82, 'Cycle 15 — MOT-F-1 + C-03: #experience becomes the narrated signature (bars grow on entry, strata bound to spans, white playhead; labels inside the card)',
  'R-c8 items 5 and 6. Gold rejected for the playhead (dates are self-reported). Files: components/sections/Experience/{CareerStrata.tsx,strata.glsl.ts,Experience.module.css,Experience.tsx}; tests/overhaul/experience-signature.spec.ts (TDD first).',
  ['S-1 Write tests/overhaul/experience-signature.spec.ts from the R-c8 acceptance: at 100 ms first .trackBar scaleX < 0.5; all bars matrix(1,0,0,1,0,0) within 1500 ms; ZERO elements in #experience with rgb(201,168,76) in color/background/stroke; a playhead element with computed color rgb(246,246,246); under reducedMotion no bar ever scaleX < 1; every .trackYears right ≤ chartCard.right − 16 at 390/834/1280/1440/1920 and scrollWidth === innerWidth. Run → red log.',
   'S-2 strata.glsl.ts: uniforms uSpans (vec4[8]), uProgress, uHover; per-row brighten +0.10 inside the span up to uProgress; hover row +0.06 lerped on CPU at delta*1.4. Keep one quad, 3 noise lookups/pixel, DPR cap.',
   'S-3 Experience.module.css .trackBar: mount scaleX(0) origin left → scaleX(1) on 35% intersection, transform 900ms cubic-bezier(0.16,1,0.3,1), 60 ms stagger per row; 1px vertical playhead + 4px tick in var(--white) at the right chart edge; .trackLine padding-right 4.5rem; .trackYears max-width 4rem, static below 52rem; rest bar var(--mist-400) @0.72.',
   'S-4 Reduced motion: keep experienceFade 320 ms opacity, no scaleX. Full battery; screenshots 1440/1280/834/390; commit `feat(experience): bars grow to scale on entry, strata follow the spans`.'],
  ['[ ] spec red before, green after', '[ ] 0 gold in #experience', '[ ] 60 fps sampled at 1440 (rAF over 3 s ≥ 55 fps) and no jank at 390', '[ ] reduced-motion path static', '[ ] battery green'],
  ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/experience-signature.spec.ts tests/e2e/experience.spec.ts']);

c8('c16-minivic-launcher', 84, 'Cycle 16 — C-04 + ADV-F-3 + ADV-F-2: the MiniVic launcher reads as a labelled chat affordance, is achromatic, is reachable in 3 tab stops',
  'R-c8 items 7, 12, 13. Files: components/MiniVicBot.tsx, app/globals.css (MiniVic chrome block), components/site/Navigation.tsx; tests/monochrome + tests/a11y (TDD first).',
  ['S-1 Tests first: (a) every computed colour inside [data-testid=minivic-toggle] satisfies R==G==B and none is rgb(201,168,76); (b) ancestor-chain eval shows no aria-hidden="true" between the launcher and <html> while axe reports 0 aria-hidden-focus violations at 1440 and 390; (c) Tab from the top: within 3 stops an element with accessible name "Ask Mini Vic" is focused; Enter → activeElement has data-testid=minivic-toggle and the panel is open. Run → red.',
   'S-2 Launcher: fill the ring with the grayscale portrait already used in the open panel header (filter: grayscale(1) contrast(1.05); border-radius 50%) inset 2px inside 1px solid var(--card-border); label pill "Ask Mini Vic" to its left at ≥834 (font-size var(--fs-caption), letter-spacing var(--ls-caption), color var(--mist-200), background rgb(10 10 10 / 0.72), padding var(--space-1) var(--space-2), radius 999px); icon-only below 834; replace bg-zinc-400/bg-zinc-500 with var(--mist-400)/var(--ink-500). Keep data-testid and 44px hit area. No --gold.',
   'S-3 Second skip link "Ask Mini Vic" next to "Skip to the evidence" in Navigation.tsx: focuses the toggle and opens the panel.',
   'S-4 Battery; screenshots closed-state 1440/390; commit `feat(minivic): a labelled launcher, reachable in three tab stops`.'],
  ['[ ] three specs green', '[ ] closed-state 1440 screenshot shows portrait + label', '[ ] monochrome suite green', '[ ] battery green'],
  ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/monochrome tests/a11y tests/e2e/chatbot.spec.ts']);

c8('c17-skills-gold', 78, 'Cycle 17 — C-08 (+Motion F-6): #skills gold as a mark, not a mass — dim sourced strands at rest, hovered path lit',
  'R-c8 item 10. Files: components/sections/Skills/{Bench.module.css,Bench.tsx,Skills.module.css}. Terminal node dots stay gold at full opacity.',
  ['S-1 Test first (tests/monochrome or tests/e2e/skills.spec.ts): at rest at 1440 no gold path (stroke rgb(201,168,76)) has stroke-opacity > 0.3; hover a capability node → within 300 ms ≥1 path stroke-opacity 1 and ≥1 path 0.18. Run → red.',
   'S-2 Rest: sourced strands stroke var(--gold), stroke-opacity 0.28, width 1; non-sourced var(--ink-500) @0.35. .node:hover → that node\'s wires opacity 1 width 1.5 (gold stays gold), others 0.18, 200 ms cubic-bezier(0.22,1,0.36,1); reduced motion = colour-only transition.',
   'S-3 Battery; screenshot 1440 rest + hover; commit `feat(skills): gold strands rest dim and light on hover`.'],
  ['[ ] spec green', '[ ] static audit TC gold rule still 10/10', '[ ] battery green'],
  ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/e2e/skills.spec.ts tests/monochrome']);

c8('c18-nav-cv', 70, 'Cycle 18 — C-07: one "Download CV" in the first viewport (nav action demoted to text until scrolled)',
  'R-c8 item 11. Files: components/site/Navigation.tsx, app/globals.css nav block.',
  ['S-1 Test first: at 1440 scrollY 0 the hero frame contains exactly one filled CTA and one outline CTA; the nav control\'s computed border-style is none (or its text is "CV"); after scrolling past the hero, [data-scrolled] restores the pill. Run → red.',
   'S-2 Implement: remove pill border/background at top, color var(--mist-200), font-size var(--fs-small), letter-spacing var(--ls-small); pill only under [data-scrolled].',
   'S-3 Battery; screenshots 1440 top + scrolled; commit `feat(nav): the CV action defers to the hero until the reader scrolls`.'],
  ['[ ] spec green', '[ ] TC-CINE-03 (nav frosts on scroll) still green', '[ ] battery green'],
  ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/e2e/hero.spec.ts tests/overhaul/cinematic.spec.ts']);

c8('c19-hero-nogl', 68, 'Cycle 19 — MOT-F-3: the no-WebGL / reduced-motion hero carries a still of the same light (radial + grain), GL fades it out',
  'R-c8 item 14. Files: components/sections/Hero/{Hero.module.css,HeroAtmosphere.tsx,Hero.tsx}.',
  ['S-1 Test first (tests/overhaul/cinematic.spec.ts or hero.spec.ts): with getContext stubbed null → #hero canvas count 0 and getComputedStyle(.stage).backgroundImage contains "radial-gradient"; with GL → canvas exists and .stage opacity reaches 0 within 1500 ms. Run → red.',
   'S-2 .stage (canvas absent): radial-gradient(60% 55% at 22% 30%, rgb(255 255 255 / 0.11), transparent 70%) + linear-gradient(to top, rgb(255 255 255 / 0.05), transparent 45%) + inline SVG feTurbulence baseFrequency 0.9 grain at opacity 0.06 mix-blend-mode screen. Under GL fade to 0 over 720 ms cubic-bezier(0.16,1,0.3,1) as uIntensity → 1; HeroAtmosphere.tsx intensity ramp delta*0.65 → delta*0.87.',
   'S-3 Battery; screenshots 390 no-GL + 1440 GL; commit `feat(hero): the fallback ground keeps the scene\'s light`.'],
  ['[ ] spec green both branches', '[ ] LCP unchanged (<2.5 s) — Lighthouse mobile run recorded', '[ ] battery green'],
  ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/cinematic.spec.ts tests/e2e/hero.spec.ts']);

c8('c20-listen-about', 66, 'Cycle 20 — C-09 + C-11: #listen contact routes carry the page\'s business end; #about dial and list share a baseline',
  'R-c8 items 15 and 16. Files: components/sections/Listen/{Listen.module.css,Listen.tsx}, components/sections/About/About.module.css. No second motion beat in #listen (MOT-F-4 confirms the caliper-close is the one).',
  ['S-1 Tests first: (a) in #listen the email and LinkedIn are the second-highest-contrast elements after the pull-quote and the rightmost contact item right edge > 0.7 × innerWidth at 1440; (b) at 1440 the #about dial svg bounding top equals the first list item top within 4 px. Run → red.',
   'S-2 Listen: .contactItem font-size var(--fs-lede), color var(--white), mono, line-height var(--lh-snug); email as a filled pill (background var(--white), color var(--ink-900), padding var(--space-2) var(--space-4), radius 999px); four routes in grid repeat(auto-fit, minmax(16rem, 1fr)) gap var(--space-4). About: dial wrapper align-self start, margin-top 0.',
   'S-3 Battery (Listen caliper beat TC-LISTEN-06..08 must stay green); screenshots 1440/390; commit `feat(listen): the contact routes carry the weight of the page\'s business end`.'],
  ['[ ] both specs green', '[ ] TC-LISTEN-06..08 green', '[ ] contrast suite green', '[ ] battery green'],
  ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/e2e/listen.spec.ts tests/e2e/about.spec.ts tests/a11y']);

c8('c21-tenure-copy', 64, 'Cycle 21 — ADV-F-4: headline tenure matches the CV ("15+ years", not "Sixteen years") everywhere the number appears',
  'R-c8 item 17 (content parity, R7). Files: app/data/portfolio/{vitrine,experience,hero}.ts, app/data/siteContent.ts (grep "ixteen"), tests/content/content-check.spec.ts. Source: public/docs/Vik_Resume_Final.pdf line 3 ("15+ year") — or, if the roles sum to ≥16 years on the CV\'s own dates, keep sixteen and print the arithmetic beside it. Decide from the PDF text, record the decision.',
  ['S-1 `pdftotext -layout public/docs/Vik_Resume_Final.pdf - | head -5` and sum the role spans in app/data/portfolio/experience.ts; write the decision to the task comment.',
   'S-2 Test first: a content-check assertion that the site\'s headline tenure equals the CV-derived value. Run → red.',
   'S-3 Change the data files only (single source of truth); battery; commit `content(experience): tenure matches the CV`.'],
  ['[ ] content-check spec green', '[ ] cv-fingerprint regenerated by the build, not hand-edited', '[ ] battery green'],
  ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/content'], 'coder');

// ---------- requirements matrix tracking (R1–R12, O1–O6, §0.3) ----------
const REQ = (slug, pr, title, summary, status, assignee, order, gates, verify, parents = []) =>
  T({ id: id(slug), status, assignee, priority: pr, parents, title, summary, order, gates, verify });

REQ('spec-r-matrix', 96, 'R9/TDD — requirements spec + test-case list for every unmet R-item and §0.3 mandate before any further code',
  'solutions-architect (level 1, max). Produces docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md: for each of R1–R12, O1–O6, M1–M7 the current state (Verified from the live site/repo, with the command), the gap, the binary acceptance test (spec file + assertion), and the cycle that closes it. Inputs: docs/prompt.md §2–§3, §0.2, §0.3, §14; R-c8 review; C13/C11 evidence; this board.',
  'ready', 'solutions-architect',
  ['S-1 Inventory signature scenes: components/sections/*/ — GLSL (Hero atmosphere, Experience strata) vs SVG/CSS (About compass, Skills bench, Vitrine drawings, Listen caliper); grade each against R2 (Three.js/R3F + GLSL, 60 fps, reduced-motion fallback) and §0.3-1 (one flagship per section). State how many R2-grade scenes exist and the cheapest path to ≥7 without regressing LCP < 2.5 s / 500 kB asset cap.',
   'S-2 R4 audience paths: walk employer → CV dossier (public/docs/Vik_Resume_Final.pdf link) and client → engagement CTA on the live page with Playwright; record click-through completion or the gap.',
   'S-3 R3 avatar: design the achievable architecture under the Owner-blocked credit state (OpenRouter −$5.38, Higgsfield 0 credits, ElevenLabs payg/IVC refused): brain = the deployed Cloud Function ladder (OpenRouter first when credited → OpenAI rung today); voice = ElevenLabs stock voice labelled synthetic (no cloning); avatar = pre-rendered loop (existing public/assets/my-hero-avatar.mp4 / minivic-greeting.mp4) with mouth-state switching driven by the audio envelope; latency budget ≤1.5 s first word. List the exact tests (tests/e2e/avatar-*.spec.ts) that prove it, and the parts that stay Owner-blocked (true lip-sync ≤40 ms needs a generated viseme track).',
   'S-4 R5/R6 4K: inventory every raster/video asset in public/ with `identify`/`ffprobe`; list which are ≥3840×2160/2160p60 and which are Owner-blocked (generation needs credits); no fabricated 4K.',
   'S-5 R1/§0.3-6 narrative: per section, the story beat it tells and the missing beat; feed R-c13.',
   'S-6 Write SPEC-v10.md with a table R-id → state → gap → test → cycle; then create the board children (title + acceptance) in artifacts/kanban/tasks/ via the orchestrator (return them as structured output).'],
  ['[ ] every R/O/M id has a row', '[ ] every gap has a named spec file + assertion', '[ ] no claim without a command/URL', '[ ] Owner-blocked items named as such with the credit that unblocks them'],
  ['test -s docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md && grep -c "^| R" docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md']);

REQ('r3-avatar-agent', 88, 'R3 — real-time AI video-avatar agent (brain → voice → avatar), perceived real-time, within the credit state',
  'Blocked in part: Higgsfield 0 credits, ElevenLabs IVC refused, OpenRouter −$5.38 (all Owner-blocked, re-probed 2026-09-05T05:50Z). The achievable slice (stock synthetic voice + pre-rendered avatar loop + envelope-driven mouth state + the working chat ladder) is specified by t_spec-r-matrix S-3 and built as cycles 22+.',
  'blocked', 'analyst-programmer',
  ['S-1 Wait for SPEC-v10.md §R3 (parent)', 'S-2 TDD: tests/e2e/avatar-agent.spec.ts (first word ≤1.5 s from send; video element playing while audio plays; labelled synthetic)', 'S-3 Implement per spec; battery; deploy; adversarial review'],
  ['[ ] spec exists', '[ ] first-word latency measured on the live site', '[ ] lip-sync ≤40 ms — Owner-blocked until a viseme track can be generated (record, do not fake)'],
  ['PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/e2e/avatar-agent.spec.ts'], [id('spec-r-matrix')]);

REQ('r2-seven-scenes', 86, 'R2 — ≥7 signature Three.js/GLSL scenes at 60 fps with reduced-motion fallbacks (currently 2 GLSL + 4 SVG/CSS)',
  'Gap owner: SPEC-v10.md §R2 names the scenes to add/upgrade (candidates: About compass → GLSL rose; Skills bench → instanced wires; Vitrine → shader plates; Listen → caliper field; a page-level transition scene) under LCP/asset budgets. Each scene = one cycle with its own spec.',
  'todo', 'analyst-programmer',
  ['S-1 Per SPEC-v10.md §R2, one child cycle per scene (created by the orchestrator when the spec lands)', 'S-2 Each: TDD spec (fps sample ≥55 over 3 s at 1440; reduced-motion static; no-GL readable), implement, battery, deploy, review'],
  ['[ ] ≥7 scenes mounted through components/gl/Scene.tsx', '[ ] fps evidence per scene', '[ ] reduced-motion + no-GL per scene'],
  ['grep -rl "components/gl/Scene" components/sections | wc -l'], [id('spec-r-matrix')]);

REQ('r4-audience-paths', 84, 'R4 — employer reaches the CV dossier and client reaches the engagement CTA, both click-through complete',
  'Verify on the live site; fix any gap found by SPEC-v10.md S-2.', 'todo', 'tester',
  ['S-1 tests/e2e/audience-paths.spec.ts: from / an employer reaches Vik_Resume_Final.pdf (HTTP 200, content-type application/pdf) in ≤2 clicks; a client reaches a booking/engagement CTA (mailto/calendar/contact) in ≤2 clicks; both keyboard-only.', 'S-2 Run against https://forgotten-mistory.web.app; fix gaps via analyst-programmer child if red.'],
  ['[ ] spec green on the live URL'], ['PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/e2e/audience-paths.spec.ts'], [id('spec-r-matrix')]);

REQ('r5-r6-4k-assets', 60, 'R5/R6 — every raster/video asset ≥4K (3840×2160 / 2160p60), generated only via Higgsfield after a written plan + prompt review',
  'Owner-blocked: Higgsfield MCP shows 0 credits / free plan; OpenRouter negative. No generation is fired without credits (C-4). The inventory (SPEC-v10.md S-4) records what exists at 4K (v8 masters under artifacts/masters/) and what waits.',
  'blocked', 'researcher',
  ['S-1 Inventory + plan per asset (prompt, model Seedance 2.0 / latest, target 3840×2160p60) written BEFORE any generation', 'S-2 On credits: one confirmed pass per asset; verify with ffprobe; encode AV1/AVIF; lazy-load; stay under the 500 kB critical-path cap'],
  ['[ ] plan reviewed', '[ ] Owner credits present (re-probe before every attempt)', '[ ] every generated asset verified ≥4K by ffprobe'],
  ['ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 <asset>'], [id('spec-r-matrix')]);

REQ('r7-content-parity', 70, 'R7 — every claim traces to the CV / LinkedIn / a named repository; zero fabricated facts',
  'Held by tests/content/content-check.spec.ts + scripts/build/cv_fingerprint.mjs (v9 cycle "content": ANZ headcount fixed, function grounding pinned). Open: ADV-F-4 tenure (cycle 21). Re-audited by every adversarial review.',
  'todo', 'reviewer',
  ['S-1 Part of R-c13: content-parity pass over the live DOM vs public/docs/Vik_Resume_Final.pdf text', 'S-2 Any mismatch → a coder task on app/data/portfolio/*.ts only'],
  ['[ ] R-c13 content section reports 0 mismatches after cycle 21'], ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/content'], [id('c21-tenure-copy')]);

REQ('r8-o3-cicd', 90, 'R8/O3 — simple autonomous CI/CD: deploy.yml consolidates every branch into main and deploys every push + every 10 min; checks.yml reports only',
  'Shipped 2026-09-05 (3d5ef60, 283ce4e, debd25b): Deploy runs 05:18Z/01:38Z/01:37Z/01:35Z all success; live build-commit == origin/main (8dc4cf46). Checks red on known items (fixed by cycles 13/14). Remaining: keep it that way — never add a gate to the deploy path.',
  'done', 'solutions-architect',
  ['S-1 (done) one job consolidate-and-deploy; concurrency deploy-production, cancel-in-progress false', 'S-2 (done) tests/ci_pipeline.test.mjs holds the shape'],
  ['[x] Deploy success on the last 4 pushes', '[x] live meta == main', '[x] no needs:/gates on deploy'],
  ['gh run list --workflow Deploy --limit 4 --json conclusion', 'node --test tests/ci_pipeline.test.mjs']);

REQ('o1-o5-cadence', 90, 'O1/O5 — a production publish within every 10-minute window while work exists; no workflow > 30 min',
  'Orchestrator standing duty. deploy.yml fires on push and on */10. Each council task is capped at 30 min (max_runtime_seconds 1800); longer work is split. Cycle reports in artifacts/kanban/cycles/ carry the timestamps.',
  'running', 'orchestrator',
  ['S-1 Every cycle: merge what is verified, push HEAD:main, record deploy time + build-commit', 'S-2 Watch `gh run list --workflow Deploy` for cadence breaches; O3 forbids fixing a breach with a gate'],
  ['[ ] deploys ≥1 per 10-min window when work exists (cycle reports)', '[ ] no agent run > 30 min (split otherwise)'],
  ['gh run list --workflow Deploy --limit 12 --json createdAt,conclusion']);

REQ('o2-o6-adversarial-per-deploy', 95, 'O2/O6 — every production deploy gets an independent adversarial review + senior creative UI council; FAIL → refactor loop until PASS',
  'Standing duty: R-c1, R-c5, R-c8 done (v9); R-c12 capture only; R-c13 queued (t_4adf34f7) for the first deploy of this session. Every later deploy gets an R-c<n> task with the same three lenses.',
  'running', 'reviewer',
  ['S-1 For each deploy: create R-c<n> (adversarial + composition + motion) parented on the deploy task', 'S-2 FAIL → correction tasks (§9) → re-deploy → re-review'],
  ['[ ] no deploy without a review artifact', '[ ] latest verdict PASS before "done"'],
  ['ls docs/delivery/evidence/v10-20260905T0515Z/ | grep ^R-']);

REQ('o4-parallel-unblocked', 80, 'O4 — parallel workflows never deadlock; conflicts consolidated into main by the orchestrator',
  'Two batteries max on this host (4 cores, ~4.5 GB free): ports 5601 and 5602. Worktrees are independent; merges are the orchestrator\'s; a conflict is resolved locally, never escalated.',
  'running', 'orchestrator',
  ['S-1 Serialize heavy Opus work; never two Playwright batteries on one port', 'S-2 On conflict: merge locally in favour of the newer verified change; record the decision on the task'],
  ['[ ] no task Blocked on a sibling for > 1 cycle'], ['git worktree list', 'ss -ltn | grep -E ":(5601|5602)"']);

REQ('m3-hero-avatar-placement', 60, '§0.3-3 — original hero video avatar placed by research (P1 beside the pitch, poster-first)',
  'Done in v9 cycle 4 (9321998b, C4-hero-portrait, TC-HERO-12..21) from B-research/02-avatar-placement; cycle 11 fixes the 390 fold (C-06). Re-graded by R-c13.',
  'done', 'analyst-programmer', ['S-1 (done) HeroPortrait.tsx mounted', 'S-2 (cycle 11) 390 layout'], ['[x] TC-HERO-13..21 green (v9)', '[ ] R-c13 grades the placement'], ['grep -rn HeroPortrait app components | grep -v "HeroPortrait.tsx" | head -3']);

REQ('m4-n8n-avatar-workflows', 55, '§0.3-4 — n8n avatar workflows produce site-grade avatar video (credit preflight, 24 fps, autonomous gates)',
  'Repaired + published in v9 (E-n8n/n8n-fix.md, publish.log) — workflows YYNSZMYApt7N3U3B and dfs7PNjfoTZxzaw4. End-to-end 4K proof run is Owner-blocked (OpenRouter/Higgsfield credits). Re-verify the published state each run; fire nothing paid.',
  'blocked', 'researcher', ['S-1 n8n MCP: get_workflow_details on both ids → active/published, node count unchanged', 'S-2 On credits: one proof run per the written plan'], ['[x] both workflows published (v9)', '[ ] proof run — Owner-blocked'], ['# n8n MCP get_workflow_details YYNSZMYApt7N3U3B']);

REQ('m5-minivic-intro', 55, '§0.3-5 — MiniVic introduction rewritten from employer research (substance, six employer-ordered prompts)',
  'Done in v9 cycle 3 (5f05575, B-research/01-employer-expectations.md, 78 specs). Live probe 05:5xZ: /api/chat 200, resume-grounded ANZ answer in 4.0 s on the OpenAI rung. Open: the deployed greeting MP3 still speaks the old sentence (ElevenLabs IVC refused) — folded into R3.',
  'done', 'analyst-programmer', ['S-1 (done)'], ['[x] TC-BOT intro specs green', '[x] live answer grounded'], ['curl -s -X POST -H "content-type: application/json" -d \'{"messages":[{"role":"user","content":"What did Vikram do at ANZ?"}]}\' https://forgotten-mistory.web.app/api/chat | head -c 200']);

REQ('m2-palette', 75, '§0.3-2 / C-8 — black, white, gold only; gold = sourced-claim mark',
  'Held by the static audit raw-hex gate + tests/monochrome; v9 cycle 5 moved tokens to neutral AA. Open: C-08 gold mass in #skills (cycle 17) and the zinc pip on the launcher (cycle 16).',
  'todo', 'reviewer', ['S-1 closes with cycles 16 + 17 and an R-c13 palette pass'], ['[ ] tests/monochrome green', '[ ] R-c13 palette section clean'], ['PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/monochrome'], [id('c16-minivic-launcher'), id('c17-skills-gold')]);

REQ('m1-flagship-per-section', 85, '§0.3-1 / §0.3-6 — every section has exactly one flagship visualisation that tells its story (visual + text as one)',
  'Graded by R-c8 motion council: #about and #experience failed; About compass fixed (cycle 12), Experience is cycle 15. R-c13 re-grades all six.',
  'todo', 'reviewer', ['S-1 R-c13 motion + composition lenses grade all six sections', 'S-2 FAIL items → cycles'], ['[ ] R-c13 motion verdict PASS for all six'], ['grep -n "Verdict" docs/delivery/evidence/v10-20260905T0515Z/R-c13/council-motion.md'], [id('c15-mot-f1'), 't_4adf34f7']);

REQ('r11-fusion-council', 50, 'R11 — one-time Fusion Council final gate (docs/fusion-os.md) after PEA 100% + adversarial PASS; every direction folded back',
  'Not before every other task is Done and the latest R-c<n> verdict is PASS. Panel per non-trivial item: researcher → solutions-architect → analyst-programmer; scores + surgical directions; PM re-delegates all of them.',
  'todo', 'orchestrator', ['S-1 Trigger only when the board shows 0 Todo/Running/Blocked outside Owner-blocked credit items and the latest review is PASS', 'S-2 Run per docs/fusion-os.md; write docs/delivery/evidence/v10-20260905T0515Z/FUSION/'], ['[ ] convened once', '[ ] every direction on the board and Done'], ['ls docs/delivery/evidence/v10-20260905T0515Z/FUSION/'],
  ['t_3bf56e4a', 't_4adf34f7', id('r2-seven-scenes'), id('r4-audience-paths'), 't_d0066b7a']);

REQ('r12-tools-evidence', 40, 'R12 — MCP servers / skills actively used and evidenced (Higgsfield balance probe, n8n, chrome-devtools/Playwright, Perplexity research, Figma where a design is exchanged)',
  'Evidence so far: n8n MCP (v9 E-n8n), Higgsfield MCP balance (v10 manifest), Playwright (every battery), Perplexity/Firecrawl (v9 B-research). Each future cycle names the tool it used in its decisions file.',
  'running', 'orchestrator', ['S-1 Each cycle\'s 07-decisions.md carries a "Tools used" line'], ['[ ] every cycle ≥1 named tool with the call'], ['grep -rl "Tools used" docs/delivery/evidence/v10-20260905T0515Z/*/07-decisions.md | wc -l']);

// ---------- write ----------
const columns = ['triage', 'todo', 'ready', 'running', 'blocked', 'done', 'archived'];
const board = { version: 1, run_id: RUN, updated: NOW, live_url: LIVE, columns, tasks: [] };
for (const t of tasks) {
  const h = H[t.assignee];
  const body = `# ${t.id} — ${t.title}

**Status:** ${t.status} · **Priority:** ${t.priority} · **Parents:** ${t.parents.length ? t.parents.join(', ') : '—'} · **Created:** ${NOW}
${t.migrated ? `\n> Continuity: ${t.migrated}\n` : ''}
## YOUR ROLE
${t.assignee} — ${h.role} (docs/prompt.md §5). ${t.summary}

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: ${EV}/. Live: ${LIVE}. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a \`grep -E '^[A-Z][A-Z0-9_]*='\` reader, never \`source\` it, never print values.
${t.state ? `\n### STATE (observed by the orchestrator at ${NOW})\n${t.state}\n` : ''}
## EXECUTION ORDER
${t.order.map((s) => `- ${s}`).join('\n')}

## QUALITY GATES
${t.gates.map((g) => `- ${g}`).join('\n')}

## VERIFICATION
\`\`\`bash
${t.verify.join('\n')}
\`\`\`

## HIERARCHY
role_matrix: ${h.role} → level ${h.level} → effort **${h.effort}** (effort_cascade.yaml; depth_cap 4). Model: ${h.model}. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
${PROVIDER(t.assignee)}
`;
  fs.writeFileSync(path.join(K, 'tasks', `${t.id}.md`), body);
  board.tasks.push({ id: t.id, title: t.title, status: t.status, assignee: t.assignee, priority: t.priority, parents: t.parents, skills: [],
    hierarchy: { role: h.role, level: h.level, effort: h.effort }, provider: (t.assignee === 'researcher' || t.assignee === 'coder') ? 'openrouter→anthropic-oauth' : 'anthropic-oauth',
    created: NOW, updated: NOW, summary: t.summary, decisions: [], comments: [] });
}
fs.writeFileSync(path.join(K, 'board.json'), JSON.stringify(board, null, 2) + '\n');
const ledger = path.join(ROOT, 'artifacts/delegation-ledger.jsonl');
if (!fs.existsSync(ledger)) fs.writeFileSync(ledger, '');
console.log(`wrote ${tasks.length} tasks`);
for (const c of columns) console.log(c.padEnd(9), tasks.filter((t) => t.status === c).map((t) => t.id).join(' '));
