# R-1 / SC-1.1 — Orchestration Corpus Index

**Requirement (verbatim, `/root/.claude/rebuilding-my-website-prompt.md:62`):**
> **R-1.** Read, index and implement **every single document** of AGENT ORCHESTRATION in `/root/.sub-agents` and all sub-folders and sub-directories, entering through `/root/.sub-agents/orchestrator/orchestration-skill.md`. Issue those documents to the agents that execute them.

**Success criterion (verbatim, `/root/.claude/rebuilding-my-website-prompt.md`, §3.1):**
> **SC-1.1** → R-1: Every `/root/.sub-agents` document enumerated, loaded and active; found count equals implemented count.

**Related precedence clause (`…prompt.md:20`, P-5):** "Primary orchestration entry point: `/root/.sub-agents/orchestrator/orchestration-skill.md`. The remainder of `/root/.sub-agents` and all sub-directories stay in force under R-1."

---

## 1. Enumeration — counts and reconciliation

Commands run (this session, working dir `/root/.sub-agents`):

```bash
find /root/.sub-agents -type f -not -path "*/.git/*" | sort   # -> 56 paths
find /root/.sub-agents -type f -not -path "*/.git/*" | wc -l  # -> 56
find /root/.sub-agents -type f -path "*/.git/*" | wc -l       # -> 54
find /root/.sub-agents -type d -not -path "*/.git/*" | sort
find /root/.sub-agents -type f -not -path "*/.git/*" -exec file {} \;
```

| Measure | Value |
| --- | --- |
| **FOUND count** (files under `/root/.sub-agents`, excluding `.git` internals) | **56** |
| **ENUMERATED count** (rows in §3 below, one per file) | **56** |
| **READ count** (files whose full contents were read in this session) | **56** |
| **ASSERTION** | **FOUND == ENUMERATED == READ == 56. SC-1.1 enumeration half is SATISFIED.** |
| Total files including `.git` internals | 110 (56 + 54) |

**On the task brief's "~110" estimate:** the total including git object/hook internals is exactly **110**. The corpus of actual orchestration documents is **56**. The 54 `.git` files are three empty, commit-less git repositories (`council/.git`, `orchestrator/.git`, `verifier/.git` — 18 files each: sample hooks, `config`, `HEAD`, `description`, `info/exclude`). `git -C <d> log -1` returns `fatal: your current branch 'main' does not have any commits yet` for all three, and `git status --porcelain` shows every corpus file as untracked (`??`). **Nothing is stored in git history; the working tree is the only source.**

**Skipped, and why:**

| Skipped | Count | Reason |
| --- | --- | --- |
| `council/.git/**`, `orchestrator/.git/**`, `verifier/.git/**` | 54 | Git plumbing (sample hooks, `config`, `HEAD`, `description`, `info/exclude`). No orchestration content; all three repos are commit-less so they hold no additional document versions. Explicitly excluded by the task brief. |
| Binary blobs | **0** | `file(1)` was run over all 56 files. Every one is text (UTF-8/ASCII/JSON/YAML) or empty. **No binary blob was found, therefore none was skipped.** |

**Directory inventory (5 content directories + 4 `.openclaw`/`.git` support dirs):** `/root/.sub-agents`, `claude-roles/`, `council/`, `council/.openclaw/`, `hierarchy/`, `orchestrator/`, `orchestrator/.openclaw/`, `verifier/`, `verifier/.openclaw/`.

---

## 2. Duplication map (established by `md5sum`, this session)

Eight documents exist as byte-identical copies replicated across the three OpenClaw workspaces (`council/`, `orchestrator/`, `verifier/`). This matters for R-1 because it means the corpus contains **31 distinct documents**, not 56, and issuing all 56 to agents would issue the same text three times.

| Document | Copies | md5 |
| --- | --- | --- |
| `AGENTS.md` | council, orchestrator, verifier | `44e3d4b147731617bb20a8a80b61b0e8` |
| `SOUL.md` | council, orchestrator, verifier | `8263e278a75be62b07d6291346bd7554` |
| `BOOTSTRAP.md` | council, orchestrator, verifier | `b80f67bf4d4b1b10d9b804846cc18f29` |
| `IDENTITY.md` | council, orchestrator, verifier | `5a2c256cf07897d07195639d9efec936` |
| `USER.md` | council, orchestrator, verifier | `332f691dcdbc0f1d55a69ebc588941b3` |
| `TOOLS.md` | council, orchestrator, verifier | `981c7c92a546f836030f8a43a80c8bb2` |
| `HEARTBEAT.md` | council, orchestrator, verifier | `bf26a0acb21fa55e345e4d66b29dcc42` |
| `hos-orchestrator.md` | council, orchestrator | `ae373bb729e44fdb4c365ec51396329a` |
| `qa-verifier.md` | council, verifier | `0337c3349c9ca5900404e9366de27c15` |

`.openclaw/workspace-state.json` differs across the three only in its `bootstrapSeededAt` timestamp.

---

## 3. Full index — one row per file (56 rows)

Ordering: `find … | sort`. "Operative rule for this run" is stated only where the document imposes a rule on **this** v6 forgotten-mistory delivery run.

### 3.0 Repository root

| # | Path | What it governs | Operative rule(s) for this run |
| --- | --- | --- | --- |
| 1 | `/root/.sub-agents/.wtest` | Nothing. 0 bytes, `file` reports `empty`. | **No operative rule for this run.** Empty write-probe sentinel; contains no text to impose a rule. |
| 2 | `/root/.sub-agents/MANIFEST.sha256.json` | Corpus integrity: SHA-256 of 30 tracked paths, `canonical_root`, `immutable: true`, `single_source_policy`, `version 1.1.0`. | **BINDING.** (a) `immutable: true` — this run MUST NOT modify any corpus file; this task made zero writes under `/root/.sub-agents`. (b) `single_source_policy`: "No duplicate .sub-agents trees … no symlink workaround" — do not clone the corpus into the repo. (c) Its `canonical_root` is `/Users/vic/.sub-agents` (a macOS path) while the live corpus is `/root/.sub-agents`; the manifest is therefore a **ported artefact** and its hash set must be treated as advisory-with-drift (see §4). |

### 3.1 `claude-roles/` — the eight-role ring (17 files)

| # | Path | What it governs | Operative rule(s) for this run |
| --- | --- | --- | --- |
| 3 | `claude-roles/INDEX.md` | Registry of the 8 roles × 2 files (SOUL + system-prompt), character budgets, validation status, read order. | **BINDING.** Names the ring this run must staff: `coder`, `researcher`, `tester`, `orchestrator`, `analyst`, `senior-sme`, `solution-architect`, `verifier`. Mandates read order: `<role>.SOUL.md` → `<role>.system-prompt.md` → `INDEX.md`. States the canonical contract source is `~/.opencode/CLAUDE.md`. **Note:** its character table is stale — it records `analyst.SOUL.md` at 325 chars where the file is 324 bytes, `coder.system-prompt.md` at 9177 vs 9214 bytes on disk, etc. Treat the table as informational, not as a gate. |
| 4 | `claude-roles/analyst.SOUL.md` | Analyst identity card. | **BINDING.** 1:1 traceability map of requirements/SC/deliverables; **refuses to silently drop requirements**; scope change only via explicit clarification, never agent-side reinterpretation. Directly governs how R-1…R-188 / SC-1.1…SC-96.1 are decomposed in this run. |
| 5 | `claude-roles/analyst.system-prompt.md` | Full Analyst charter: §1–§8 decomposition bundle, Clarification Protocol Gate, anti-compression policy. | **BINDING.** Every user statement → exactly one R-id, hierarchy preserved (`R-3.1.1` not flattened). Every SC is **binary and tool-executable** (`wc -m`, `grep -q`, HTTP 200, empty browser console) — subjective phrasing converted. Derived requirements surfaced with a derivation note. Ask only when a core input is missing. Output shape §1 prompt verbatim / §2 R / §3 SC / §4 C / §5 T / §6 deliverables map / §7 QS / §8 execution order. |
| 6 | `claude-roles/coder.SOUL.md` | Coder identity card. | **BINDING.** Zero placeholders/stubs/suppressed errors; Read → Edit → Write; uv-only Python; Conventional Commits; every line traceable to an R-id; verified against real APIs not mocks. |
| 7 | `claude-roles/coder.system-prompt.md` | Full Coder charter: file-op hierarchy, 3-question pre-op self-audit, dependency discipline, no-dummy-API rule, mengram protocol, commit discipline, post-task cleanup. | **BINDING.** Read before Edit; Edit before Write; Bash-create last resort. Pre-op self-audit (in-scope? path verified this session? fully implemented?) — any NO halts. `uv add → uv lock → uv sync → code → test → commit`; `uv lock --check` before every commit; locking **after** tests pass is a violation. Real endpoint + real key from `.env`; named-key error and halt if missing — never `os.getenv("KEY","dummy-key")`. No deferred-marker comments, no `pass` bodies, no `NotImplementedError`. Conventional Commits ≤72 chars; README updated on every commit; final commit on `main` only, `gh pr list --state open` empty. Post-task cleanup allow-list (caches, `*.pyc`, `*.tmp`, `htmlcov/`) with `.git/`/`.env`/deliverables never removed. |
| 8 | `claude-roles/orchestrator.SOUL.md` | Orchestrator identity card. | **BINDING.** ralph-loop-infinite v3.5.0: status token on every response; §3 exit report; **`approved` / `looks good` / `ship it` are FEEDBACK, never exit**; coordinates the 7 peers until HMAC-signed verifier PASS. |
| 9 | `claude-roles/orchestrator.system-prompt.md` | Full Orchestrator charter incl. the ralph-loop-infinite v3.5.0 contract excerpt and the no-bypass priority register (99999…99990). | **BINDING.** Status-token header on every response (`ACTIVE — Iteration N of ∞` / `COMPLETE — All SCs PASS` / `NOT YET ACTIVE — invoking now`); no valid token → **zero output**. Auto-arms on ship-language (`ship`, `deploy`, `production-ready`, `100% pass`, `final`, `done`, `complete`, `validate end-to-end`) — **this run's brief is saturated with those, so the gate arms**. Fixed pipeline: Analyst → Researcher → Solution Architect → Senior SME (plan audit) → Coder → Tester → Senior SME (build audit) → §3 exit report → Verifier. §3 exit report carries programmatic counts, visual breakpoints 375/768/1280/1920, WCAG AA verdict, and R/SC/deliverable traceability counts — every number from a tool call **in this session**. Softening language (`should be working`, `appears to pass`, `good enough`, `broadly OK`, `minor issues remain but…`) auto-fails. **Deployment containment: `firebase deploy` is on the explicit denied list until HMAC-valid PASS** — directly binding, since this repo deploys to Firebase Hosting. Soft-resolve does not disarm; only `/ralph-loop-infinite-disarm` with a ≥30-char typed user reason does; the Orchestrator cannot self-disarm. |
| 10 | `claude-roles/researcher.SOUL.md` | Researcher identity card. | **BINDING.** Primary sources only; mengram cache queried before every repeatable lookup; TTL contract observed; no fabrication. |
| 11 | `claude-roles/researcher.system-prompt.md` | Full Researcher charter: mengram-first protocol, Context7-first for library docs, citation discipline, version pinning, corroboration rule. | **BINDING.** Cache order: 3–5 keyword summary → `mcp__mengram__search` → hit-within-TTL returns `[CACHED — {date}]` and stops → else execute then `mcp__mengram__remember`. TTLs: web 24h · deep research 7d · code analysis 48h · docs 72h · API 1h · architecture 30d. Every finding ships `{claim, source_url, fetch_date, mengram_key}`; **no URL → no claim**. No primary support → `INSUFFICIENT EVIDENCE — {R-id}`, never a plausible substitute. Every library/API claim version-pinned ("latest" insufficient). ≥2 primary sources for security/financial/migration/deployment claims. Provider-stanza safety (live `curl` proof + governor profile first). |
| 12 | `claude-roles/senior-sme.SOUL.md` | Senior SME identity card. | **BINDING.** Fortune 500 bar (Google/Apple/Anthropic/Tesla/Stripe); exact versions; hardened security; root-cause fixes not symptom suppression. |
| 13 | `claude-roles/senior-sme.system-prompt.md` | Full Senior SME charter: quality bar comparanda, concrete-implementation rule, security hardening list, 100% prompt-execution accuracy, visual/UX audit, verdict vocabulary. | **BINDING.** Verdict is `APPROVED` / `APPROVED_WITH_CONDITIONS` / `REJECTED` with a fix list keyed to R-ids and SC-ids; conditions allowed only when mechanically verifiable **in the same loop iteration**. Category-only specs rejected ("use a web framework" → "Hono v4.6.x"). **Visual audit at 375 / 768 / 1280 / 1920 px** rejecting layout breaks, unstyled flashes, missing assets, broken icons, animation jank, contrast failures, dark-mode regressions — this is the direct quality gate over every forgotten-mistory section. Partial completion, "substantially complete", "broadly OK" are all FAIL. README must match the canonical Fortune-500 template; placeholder/TBD/lorem rejected. |
| 14 | `claude-roles/solution-architect.SOUL.md` | Solution Architect identity card. | **BINDING.** Input → Process → **Validation Gate** → Output at every level; deterministic stack choice; safe provider config; no architecture lacking a gate between processing and output. |
| 15 | `claude-roles/solution-architect.system-prompt.md` | Full Solution Architect charter: stack-scoring grid, structural-refinement rule, zero-loss policy, deterministic phrasing, pre-mortem, runbook, capacity/cost model. | **BINDING.** Every step exposes typed Input, fully-specified Process, a **binary Validation Gate**, and typed Output — gateless steps are rejected and re-authored. Zero-loss: every input becomes an output or lands in a **named, typed rejection bucket**; silent drops and payload-losing catch-alls forbidden. Deterministic phrasing: `must`/`is`/`returns`/`emits`, never `should`/`might`/`consider`/`roughly`. Top-3 failure modes per component with concrete mitigations. Every architecture paired with a runbook and a capacity/cost model. Hand-off includes Mermaid system + deployment topology diagrams. |
| 16 | `claude-roles/tester.SOUL.md` | Tester identity card. | **BINDING.** Real APIs, real DBs, real production environments — never mocks that mask divergence; no false positives; every assertion from an actual tool invocation this session. |
| 17 | `claude-roles/tester.system-prompt.md` | Full Tester charter: 3-layer evidence chain, real-dependency rule, real-API gate, no-false-positive policy, browser-side validation. | **BINDING.** Every behaviour-bearing SC needs unit **and** integration **and** e2e layers — missing one is itself a failure. Real DB engine mirroring production; no SQLite-as-pretend-Postgres. Real-API gate: at least one assertion proving the response came from the live endpoint (server-issued `request_id`, vendor-signed timestamp, real meter increment); replay-only suites cannot satisfy it. Rejects `assert True`, assertion-swallowing tests, mocks of the system under test, failure-swallowing teardowns. **Browser-side validation: production console free of uncaught exceptions and unhandled promise rejections, network log free of 4xx/5xx for required resources, breakpoints 375/768/1280/1920 verified for layout integrity, asset presence and WCAG AA contrast** — the operative acceptance shape for every forgotten-mistory section. Returns `{SC-id, test_layer, runner_command, runner_output_path, status, evidence_artefacts[]}`. |
| 18 | `claude-roles/verifier.SOUL.md` | Verifier identity card. | **BINDING.** Fresh Anthropic API context; reads the sealed prompt from state; evaluates the exit report against the original requirement; emits an HMAC-SHA256 signed verdict whose only PASS unlocks termination; approval phrases are FEEDBACK. |
| 19 | `claude-roles/verifier.system-prompt.md` | Full Verifier charter: fresh-context guarantee, input loading, evaluation rubric, verdict JSON schema, PASS criteria, no-leak discipline, determinism rule. | **BINDING.** Runs with **zero conversation history and zero side-channel state**; reads `~/.opencode/state/ralph-loop-infinite.sealed-prompt`. Rubric: 100% R-id coverage, 100% SC-id PASS evidence, independently recounted traceability numbers, artefacts must exist at cited paths (fabricated path → FAIL), softening-language scan, approval-substitution scan, **visual-validation scan requiring 375/768/1280/1920 breakpoint screenshots and matching layout-break / missing-asset / WCAG-AA counts**. Verdict JSON carries `sealed_prompt_sha256` and an HMAC-SHA256 `signature` over the canonical body; key at `~/.opencode/secrets/ralph-hmac.key` must be mode `0600` or the verifier refuses to sign and returns FAIL. Key never echoed, never logged. Determinism: disagreement → re-run at `temperature=0`, majority of three. FAIL → loop re-iterates **without contacting the user**. |

### 3.2 `council/` — HOS council workspace (16 files)

| # | Path | What it governs | Operative rule(s) for this run |
| --- | --- | --- | --- |
| 20 | `council/.openclaw/workspace-state.json` | OpenClaw workspace bookkeeping: `{version: 1, bootstrapSeededAt: "2026-05-18T12:46:03.486Z"}`. | **No operative rule for this run.** Runtime seed marker for the OpenClaw agent host; imposes no delivery constraint. |
| 21 | `council/AGENTS.md` | OpenClaw workspace conventions: session startup, memory files, red lines, external-vs-internal actions, group-chat etiquette, heartbeats. | **PARTIALLY OPERATIVE.** Operative: the **Red Lines** — never exfiltrate private data; no destructive commands without asking; `trash` > `rm`; when in doubt, ask. Also operative: "Write it down — no mental notes", which underwrites the evidence-file discipline this run uses. Non-operative here: group-chat/Discord/WhatsApp etiquette, heartbeat rotation, TTS storytelling — this run is a non-interactive CLI delivery with no messaging surface. |
| 22 | `council/BOOTSTRAP.md` | First-run identity conversation for a fresh OpenClaw workspace; instructs the agent to name itself and then delete the file. | **No operative rule for this run.** First-boot persona script for the OpenClaw host, not a delivery contract. Its presence merely shows the council workspace was never bootstrapped. |
| 23 | `council/HEARTBEAT.md` | Heartbeat task checklist — deliberately empty (comment-only) to skip heartbeat API calls. | **No operative rule for this run.** Empty by design; no periodic task is registered. |
| 24 | `council/IDENTITY.md` | Blank identity template (name / creature / vibe / emoji / avatar), all fields unfilled. | **No operative rule for this run.** Unpopulated template. |
| 25 | `council/SOUL.md` | OpenClaw persona charter: be genuinely helpful, have opinions, be resourceful before asking, earn trust through competence, boundaries, continuity. | **PARTIALLY OPERATIVE.** Operative: **"Be resourceful before asking — read the file, check the context, search for it, then ask"** and "be careful with external actions, bold with internal ones" — both reinforce this run's non-interactive posture. Non-operative: tone/persona guidance, which is superseded for delivery work by the stricter `claude-roles/` charters and `orchestration-skill.md`. |
| 26 | `council/TOOLS.md` | Template for environment-specific local notes (cameras, SSH hosts, TTS voices) — worked examples only, nothing project-specific filled in. | **No operative rule for this run.** Empty template; contains no host or credential facts for this run. The one transferable principle ("skills are shared, your setup is yours") is already covered by the manifest's single-source policy. |
| 27 | `council/USER.md` | Blank "about your human" template (name / pronouns / timezone / notes), unfilled. | **No operative rule for this run.** Unpopulated template. |
| 28 | `council/analyst-programmer.md` | HOS Council Analyst/Programmer sub-agent (Claude Opus 4.7 wrapper; rotates `deepseek-v4-pro` / `minimax/m-2.7-thinking` / `gemini-3.1-pro-preview`, effort `xhigh`). | **BINDING for implementer dispatch.** Read via `Read`/`Glob`/`Grep` before any `Write`/`Edit`. Full type annotations. Every public function has ≥1 pytest case asserting real behaviour, not mocks of behaviour. ruff + `mypy --strict` + shellcheck clean **before** signalling `goal_complete`. Real APIs only, keys from `.env.local`, never a dummy. No `TODO`, no `pass`, no `NotImplementedError`. Forbidden: silent `try/except`, unjustified `# type: ignore`, re-exports to satisfy a type check, error-handling for impossible paths. Output contract: `{task_id, files_changed[path:line], tests_added, lint_status{ruff,mypy,pytest}, goal_complete}`. |
| 29 | `council/analyst_programmer.md` | Earlier/underscore variant of the same council seat (`model: deepseek/deepseek-chat`, `effort: xhigh`), expressed as quality gates and output templates rather than a tool contract. | **BINDING (complementary, not duplicate).** Adds the explicit quality-gate checklist: all functions typed · all public functions documented · no bare `except` · no TODO/FIXME · no placeholder implementations · **no mocked core logic in tests (mock boundaries only)** · ruff clean · `mypy --strict` clean · all tests pass. Adds the code-review output shape (severity/location/issue/fix table) and the test-docstring convention linking `T-N` → `R-X.Y` / `SC-X.Y` — which is the format this run's tests must use to satisfy SC traceability. |
| 30 | `council/cleanup-agent.md` | HOS Cleanup Agent — post-acceptance working-directory hygiene. | **BINDING at run end.** Runs **after** the quality gate accepts, never before. Removes: `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.eslintcache`, `.cache/`, `.parcel-cache/`, `.turbo/`, `*.pyc|pyo|class|o`, `*.tmp|temp|swp|bak`, `htmlcov/`, `.coverage`, `coverage.xml`, `.DS_Store`, `Thumbs.db`, `.ipynb_checkpoints/`, and only agent-created `.venv/`. **Never removes** `.git/`, `.github/`, `.env`, any `.env.*`, `.vscode/`, `.cursor/`, `.claude/`, mengram entries, or anything present before the task. Then `ruff format --check` + `ruff check`, fixing and re-verifying on failure. Output `{removed[], skipped[], ruff_format, ruff_lint, goal_complete}`. |
| 31 | `council/hos-orchestrator.md` | HOS Orchestrator sub-agent (byte-identical to row 46). Accountability charter, zero-clarification rule, council-of-3, effort cascade, ralph-loop enforcement, quality rating. | **BINDING.** (1) **X-expected ≡ X-delivered** — every stated requirement appears in the deliverable; no paraphrase, no scope reduction, no partial implementation. (2) **Zero clarification requests** — `AskUserQuestion` forbidden; infer, apply documented defaults, or continue on parallel tracks emitting `request_access_to_hermes(<resource>)`. (3) User ≡ Hermes authority. (4) **Forbidden linguistic patterns (auto-fail):** `good enough`, `should be working`, `appears to pass`, `broadly OK`, `minor issues remain`, `out of scope`, `cannot`, `blocker`, `looks like it works`, `seem to`, `might work`, `N/A` outside JSON nulls. (5) **First action on a raw prompt MUST be `/prompt-reconstruct`**, passing all 8 self-audit checks (clarity · completeness · testability · scope boundaries · dependencies · constraints · success criteria · deliverable mapping). (6) Council-of-3 = researcher + solutions_architect + analyst_programmer. (7) Quality JSON per task; **quality < 5 auto-arms the ralph-loop gate**. **Note a conflict:** this file caps depth at 3 and says spawned agents inherit one tier below; `hierarchy/effort_cascade.yaml` caps depth at 4 — see the contract document §5 for the resolution. |
| 32 | `council/qa-verifier.md` | HOS QA Verifier sub-agent (byte-identical to row 56). Eight binary verification gates + output contract. | **BINDING, with a stack caveat.** Gates: pytest exit 0 · `ruff check` exit 0 · `ruff format --check` exit 0 · `mypy --ignore-missing-imports` exit 0 · shellcheck exit 0 (when shell scripts exist) · `quality_rating.schema.json` validates · `preflight_check.sh` exit 0 · `uv lock --check` exit 0. Forbidden: "Looks correct, signing off" (every claim needs a tool-call exit code), skipping a gate as "doesn't apply", suppressing an error to pass a gate. Sign-off is binary `goal_complete: true` only when every gate is green. **Caveat:** the gate list is Python/`uv`-shaped; `forgotten-mistory` is a Next.js static-export project. The *gate discipline* (binary, exit-code-evidenced, no skipping, no suppression) transfers verbatim; the *specific commands* must be mapped to this repo's real toolchain and that mapping recorded, per `orchestration-skill.md` §9. |
| 33 | `council/researcher.md` | HOS Council Researcher seat (`perplexity/sonar-pro`, effort `high`). Research protocol and output format. | **BINDING for research dispatch.** Search broad → narrow; cross-reference multiple sources; source priority **official documentation > peer-reviewed > community consensus > individual opinions**; always note publication date and version relevance. Output shape: Findings Summary / Key Sources (URL + relevance) / Detailed Analysis / Recommendations / Confidence Level with justification. Constraints: never fabricate sources or citations; never present speculation as fact; always distinguish verified from inferred; state inconclusive research explicitly as known-vs-unknown. |
| 34 | `council/solutions-architect.md` | HOS Council Solutions Architect sub-agent (Opus 4.7 wrapper over `gpt-5.5-codex`, 1M context). Design-only, not implementation. | **BINDING for architecture dispatch.** Mandatory five-step output: restate the problem in 2–4 sentences including the orchestrator's declared success criteria → survey existing structure by reading the codebase → propose **1 winning design + 2 alternatives** with trade-offs across correctness/latency/cost/maintainability/testability → pick the winner and justify in one paragraph → numbered implementation plan where **each task maps to one specific file path** → risk register with a mitigation per assumption. Forbidden: non-load-bearing abstractions, future-proofing beyond stated SC, picking a winner without explicit trade-offs. Output `{task_id, winning_design, alternatives[], implementation_plan[{step,file,action}], risks[], goal_complete}`. |
| 35 | `council/solutions_architect.md` | Earlier/underscore variant of the architect seat (`openai/gpt-4o`, effort `high`), expressed as design principles. | **BINDING (complementary).** Adds the **Simplicity Hierarchy** — (1) no code, can we avoid this? (2) delete code, (3) simplify code, (4) write new code only if 1–3 fail — and **YAGNI enforcement**: no speculative generalization, no "might need later" abstractions, **three concrete uses before abstracting**, delete unused code paths. Adds the design output tables (Architecture Overview with Mermaid, Component/Responsibility/Interface, Trade-offs with Decision column, Dependencies with justification, Risk Assessment). Requires that a "simplest possible" alternative always accompanies the chosen design. |

### 3.3 `hierarchy/` — effort and model-tier assignment (2 files)

| # | Path | What it governs | Operative rule(s) for this run |
| --- | --- | --- | --- |
| 36 | `hierarchy/effort_cascade.yaml` | The effort scale, the level→effort mapping, and the delegation depth cap. | **BINDING — this run must obey it.** Scale, highest to lowest: `ultracode` (xhigh thinking effort with dynamic workflows) → `max` → `xhigh` → `high` → `medium` → `low`. Levels: **orchestrator = `ultracode`, and `ultracode` is "only allowed to be used solely for the Orchestration purposes"**; `level_1 = max`; `level_2 = xhigh`; `level_3 = high` (declared the *default* thinking effort); `level_4 = medium`. **`depth_cap: 4`.** ⚠ Hash drift vs `MANIFEST.sha256.json` — see §4. |
| 37 | `hierarchy/role_matrix.yaml` | Per-role level + effort assignment — the authoritative mapping this run uses to tier every dispatched agent. | **BINDING — this run must obey it.** Full table reproduced in the contract document §7. Level 1 / `max`: verification, validation, requirements_analysis, architecture, **3rd_party_independent_adversarial_review**. Level 2 / `xhigh`: coding, testing, qa. Level 3 / `high`: requirements_to_sc_mapping, output_to_deliverable_mapping, research, security, performance, observability. Level 4 / `medium`: documentation, cleanup. `orchestrator` level / `ultracode`: prompt_reconstruction ("Reconstructing prompts per 8-point self-audit") and feedback_refactor_loop. The adversarial-review entry is definitional for R-4/R-6: it "reject[s] every single output, claim, and deliverable by the Orchestrator or any other agent, reconstructing … every single claim to provide ruthlessly honest & truthful assessment … a mandatory requirement for all outputs, claims, and deliverables." ⚠ Hash drift vs `MANIFEST.sha256.json` — see §4. |

### 3.4 `orchestrator/` — the entry point (10 files)

| # | Path | What it governs | Operative rule(s) for this run |
| --- | --- | --- | --- |
| 38 | `orchestrator/.openclaw/workspace-state.json` | `{version: 1, bootstrapSeededAt: "2026-05-18T12:45:33.540Z"}`. | **No operative rule for this run.** Runtime seed marker. |
| 39 | `orchestrator/AGENTS.md` | Byte-identical to `council/AGENTS.md` (row 21). | Same as row 21: Red Lines operative; messaging/heartbeat guidance non-operative. |
| 40 | `orchestrator/BOOTSTRAP.md` | Byte-identical to `council/BOOTSTRAP.md` (row 22). | **No operative rule for this run.** |
| 41 | `orchestrator/HEARTBEAT.md` | Byte-identical to `council/HEARTBEAT.md` (row 23). | **No operative rule for this run.** |
| 42 | `orchestrator/IDENTITY.md` | Byte-identical to `council/IDENTITY.md` (row 24). | **No operative rule for this run.** |
| 43 | `orchestrator/SOUL.md` | Byte-identical to `council/SOUL.md` (row 25). | Same as row 25: "resourceful before asking" operative; persona guidance superseded. |
| 44 | `orchestrator/TOOLS.md` | Byte-identical to `council/TOOLS.md` (row 26). | **No operative rule for this run.** |
| 45 | `orchestrator/USER.md` | Byte-identical to `council/USER.md` (row 27). | **No operative rule for this run.** |
| 46 | `orchestrator/hos-orchestrator.md` | Byte-identical to `council/hos-orchestrator.md` (row 31). | Same as row 31 — accountability charter, zero-clarification, forbidden linguistic patterns, `/prompt-reconstruct` first, council-of-3, quality<5 auto-arms the gate. |
| 47 | `orchestrator/orchestration-skill.md` | **THE ENTRY POINT** named by R-1 and P-5. 119,489 bytes / 1,739 lines. §0–§17 delivery contract: mission, role/authority, ground truth, review-mode writes, corrections, two-hats, swarm design, SDLC, evidence standard, adversarial review, exit gates, reporting, banned behaviours, decision policy, branch/PR hygiene, kickoff, one-line standard. | **BINDING — the master operating contract for this run.** Consolidated in full in `R1-orchestration-contract.md`. Headline rules: §0 "MUST/MUST NOT are binding; a violation is a failed run"; §0 mandates reading `/root/.claude/.env.production` and **every script, document, folder and sub-folder of `/root/.sub-agents/`** before any work — "User/Owner-mandated … binding prerequisites, not background reading" (this task is that read). §2 orchestrate, do not hand-execute; always read the inputs yourself and run ≥1 deterministic verification per unit. §6 two hats. §7 swarm roles + tiering + concurrency. §8 the 11-step SDLC. §9 evidence layout under `docs/delivery/evidence/<RUN_ID>/`. §10 adversarial review. §11 twelve exit gates. §12 failures-first reporting. §13 banned behaviours. §15 branch/PR hygiene. §16 kickoff. **Structural finding:** the file contains the contract **twice** — lines 1–988 (the `aether`-instantiated copy) and lines 989–1739 (an older `[$Project_Name]`-templated copy). Divergences are documented in the contract document §10. |

### 3.5 `verifier/` — QA verifier workspace (9 files)

| # | Path | What it governs | Operative rule(s) for this run |
| --- | --- | --- | --- |
| 48 | `verifier/.openclaw/workspace-state.json` | `{version: 1, bootstrapSeededAt: "2026-05-18T12:45:48.474Z"}`. | **No operative rule for this run.** Runtime seed marker. |
| 49 | `verifier/AGENTS.md` | Byte-identical to `council/AGENTS.md` (row 21). | Same as row 21. |
| 50 | `verifier/BOOTSTRAP.md` | Byte-identical to `council/BOOTSTRAP.md` (row 22). | **No operative rule for this run.** |
| 51 | `verifier/HEARTBEAT.md` | Byte-identical to `council/HEARTBEAT.md` (row 23). | **No operative rule for this run.** |
| 52 | `verifier/IDENTITY.md` | Byte-identical to `council/IDENTITY.md` (row 24). | **No operative rule for this run.** |
| 53 | `verifier/SOUL.md` | Byte-identical to `council/SOUL.md` (row 25). | Same as row 25. |
| 54 | `verifier/TOOLS.md` | Byte-identical to `council/TOOLS.md` (row 26). | **No operative rule for this run.** |
| 55 | `verifier/USER.md` | Byte-identical to `council/USER.md` (row 27). | **No operative rule for this run.** |
| 56 | `verifier/qa-verifier.md` | Byte-identical to `council/qa-verifier.md` (row 32). | Same as row 32 — eight binary exit-code gates, no gate skipping, no error suppression, binary `goal_complete`. |

**Row count: 56. Found count: 56. Equal.**

---

## 4. `MANIFEST.sha256.json` verification — result: **DRIFT CONFIRMED**

Method (run this session, read-only; nothing under `/root/.sub-agents` was modified):

```python
import json, hashlib, os
m = json.load(open('MANIFEST.sha256.json'))
for p, h in m['files'].items():
    a = hashlib.sha256(open(p,'rb').read()).hexdigest()   # compared to h
```

| Result | Count |
| --- | --- |
| Manifest entries | 30 |
| **MATCH** | **27** |
| **DRIFT (hash mismatch)** | **2** |
| **MISSING (recorded path absent on disk)** | **1** |
| Files on disk not tracked by the manifest | 26 |

### 4.1 Drift — two files whose content no longer matches the recorded hash

| Path | Recorded SHA-256 | Actual SHA-256 (computed this session) |
| --- | --- | --- |
| `hierarchy/effort_cascade.yaml` | `aa87602a7771f7cd807d8a21ee28a988ae082daebbcbcfffce76a619204e0c2d` | `a22691f7c38663d08db216627ca3e429555cc13c423588cecaea78f490d8d55f` |
| `hierarchy/role_matrix.yaml` | `df187edc36b43c5a94d7d4355be963a878854994e70c7d702ec9f03b20b18511` | `cc9c2a1eb0f2f5a817453e4389ce2106400d71f99ce1ba1a6612647ac393f602` |

**Both drifted files are exactly the two files this task was instructed to obey for effort and model-tier assignment.** Because the three git repos hold no commits, there is **no recorded prior version to diff against** — the nature of the change is **not observable**, and this index does not speculate about it. Consequence for this run, stated plainly: the effort/role assignment is taken from the **on-disk content** (reproduced in the contract document §7), and it is recorded here that the on-disk content is **not the content the manifest was sealed over**.

### 4.2 Missing — one recorded path that does not exist

| Recorded path | Recorded SHA-256 | Disk state |
| --- | --- | --- |
| `orchestrator/orchestrator-skill.md` | `a095a805652542428f4b1c3d993ef077a7275656a97f90382c619fdc3a9a4097` | **Absent.** The directory contains `orchestrator/orchestration-skill.md` (note: *orchestration*, not *orchestrator*), which is a **different file with a different hash**. |

Verification of the near-name file (run this session):

```bash
$ sha256sum orchestrator/orchestration-skill.md
c9856e5864d0c78ab44bd6325ee3e7901f27d5f28c5c3f2785c6fbc5349b0845  orchestrator/orchestration-skill.md
```

`c9856e58…` != `a095a805…`, so `orchestration-skill.md` is **not** the manifest's `orchestrator-skill.md` under a new name.

So this is not merely a rename: **the file the manifest sealed no longer exists in any form on this host.** The file that *is* present, `orchestration-skill.md`, is the one R-1 and P-5 name as the entry point, so this run proceeds from it — while recording that it is **unattested by the manifest**. Given the manifest declares `immutable: true`, that is a material integrity finding, not a bookkeeping detail.

### 4.3 Untracked — 26 files on disk that the manifest does not cover

`.wtest` · the three `.openclaw/workspace-state.json` · the 21 OpenClaw workspace docs (`AGENTS.md`, `BOOTSTRAP.md`, `HEARTBEAT.md`, `IDENTITY.md`, `SOUL.md`, `TOOLS.md`, `USER.md` × council/orchestrator/verifier) · `orchestrator/orchestration-skill.md`.

The manifest tracks the 30 curated role/hierarchy documents only; the OpenClaw scaffolding was added to the tree after the manifest was sealed. `orchestration-skill.md` being untracked is the one entry in this list that matters, and it is covered in §4.2.

### 4.4 Manifest root mismatch

`"canonical_root": "/Users/vic/.sub-agents"` — a macOS path. The live corpus is `/root/.sub-agents` on Linux (`srv1356245`, Ubuntu 26.04). The manifest is a ported artefact; its `single_source_policy` ("No duplicate .sub-agents trees … no symlink workaround") is nonetheless read as binding on the live tree.

**Nothing was modified. No file under `/root/.sub-agents` was written, renamed, chmod'ed or deleted by this task.**

---

## 5. SC-1.1 status

| Clause of SC-1.1 | Status | Evidence |
| --- | --- | --- |
| "Every `/root/.sub-agents` document enumerated" | **SATISFIED** | §3, 56 rows |
| "loaded" (read in full) | **SATISFIED** | 56 of 56 files read this session; §1 |
| "found count equals implemented count" — enumeration half | **SATISFIED** | found 56 == enumerated 56 == read 56 |
| "…active" / "implemented count" — issuance half | **PENDING, by design** | Discharged by issuing `R1-orchestration-contract.md` to every dispatched swarm and citing it in each swarm's brief. Not closable by this task alone; closes when the run's swarm briefs demonstrably carry the contract. |

---

*Artifacts written by this task, both under `/root/forgotten-mistory/docs/delivery/evidence/v6-20260903T195241Z/`: `R1-orchestration-index.md` (this file) and `R1-orchestration-contract.md`. No temp files left in the repository.*
