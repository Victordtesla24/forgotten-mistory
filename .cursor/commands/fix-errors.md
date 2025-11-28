# **fix-errors — Repeat-Until-Green Loop**

# **Context**
- **Understanding & Strict adherence to testing directory structure** in `/tests/` directory
- **Previous test logs** from `/tests/logs/test-results/`

***STRICTLY NO DUPLICATE/NEW/ADDITIONAL/UNNECESSARY DOCUMENTATION OR FOLDER CREATION ALLOWED*** unless explicitly specified in user request.

# **Objective**
* **Fix errors until none remain** 
* **Ship production-grade changes (STRICTLY NO mocks/placeholders/fallbacks in runtime paths)**
* **Maintain an auditable Error Trail by APPENDING/UPSERTING** `.cursor/memory-bank/currentTaskContext.md` & `.cursor/memory-bank/progressTracking.md` 

# **Policy**
- Use `.cursor/rules/guard-rails.mdc` (always applied).
- **Research Pass** only via:
  * Official indexed `/docs/` directory (see guard-rails for subdirectories). If a required doc isn't indexed, pause and request adding it, then continue.
  * Internet search using `web_search` tool to find suitable & effective solutions with minimal code changes using credible, authentic, valid and top-rated/highly-reviewed online resources.

# **Verification Commands**
- Take screenshots of `http://localhost:8080/` & `https://forgotten-mistory.web.app/` & **compare the screenshots** side by side **THOROUGHLY**, & list exact replication discrepancies.
- Run: `npm run type-check` (TypeScript), `npm run lint` (ESLint), `npm test` (tests), `npm run build` (production build).

## Working Checklist (agent updates every cycle)
* [ ] **Parse failures** → rank by dependency/criticality
* [ ] **Pick top unchecked failure**
* [ ] **Root-cause & impact trace (end-to-end)**
* [ ] **Minimal, targeted fix plan (no scope creep)**
* [ ] **Implement fix + add/adjust tests if coverage is insufficient**
* [ ] **Verify: screenshots comparison, tests, type-check, lint, build** (see Verification Commands section)
* [ ] **If same class persists ≥2 attempts → Research Pass** (see Policy section; use official `/docs/` or `web_search` tool) → revise plan
* [ ] **Append/Upsert** to `.cursor/memory-bank/currentTaskContext.md` & `.cursor/memory-bank/progressTracking.md` (create if missing; see guard-rails Error Trail section for required sections)
* [ ] **Mark current failure done** → repeat

## Loop (repeat until all green)

| **Step** | **Workflow**                                                                             |
|----------|------------------------------------------------------------------------------------------|
| **[1]**  | `START` → **Execute test suite**                                                         |
| **[2]**  | **Monitor test output + console logs**                                                   |
| **[3]**  | **Collect & Rank Failures** by dependency/criticality                                    |
| **[4]**  | **Failures detected?**                                                                   |
|          |   -`NO` → Generate test summary report → `END`                                           |
|          |   -`YES` → Continue to Step [5]                                                          |
| **[5]**  | **Analyze test failure logs**                                                            |
| **[6]**  | **Root-Cause & Impact Analysis:**                                                        |
|          |   - Trace the flow (`UI ←→ API ←→ DB/cache`)                                             |
|          |   - Identify exact files/functions/lines                                                 |
|          |      - Describe *why* it broke                                                           |
| **[7]**  | **Targeted Fix Plan (Minimal Diff)**                                                     |
|          |   - Propose the minimal safe change set                                                  |
|          |   - Cross-check `/docs/` and invariants                                                  |
| **[8]**  | **Implement Fix**                                                                        |
| **[9]**  | **Verification Gate (`must pass`)**                                                      |
|          |   - Run verification commands (screenshots comparison, type-check, lint, tests, build)   |
|          |   - If anything fails, capture fresh evidence and return to Step [2]                     |
|          |   - If **same class of error** repeats ≥2 attempts → proceed to Step [10]                |
| **[10]** | **Research Pass (triggered after ≥2 failed attempts on same error class)**               |
|          |   - Search official indexed `/docs/` directory                                           |
|          |      - If required doc not indexed, pause, request addition, then continue               |
|          |      - Use `web_search` tool for credible, top-rated solutions with minimal code changes |
|          |        - Cite exact source/section in Error Trail                                        |
|          |        - Update fix plan, then return to Step [7]                                        |
| **[11]** | **Closure Criteria (for current failure)**                                               |
|          |   - Failure's tests pass; no regressions                                                 |
|          |   - Production build successful                                                          |
|          |   - Runtime paths free of mocks/placeholders/fallbacks                                   |
|          |   -  Append Error Trail: Fix Summary, Files Touched, Why It Works, Verification Evidence |
| **[12]** | **Re-run test suite** to validate fix                                                    |
| **[13]** | **Next Failure Processing**                                                              |
|          |   - Move to next checklist item                                                          |
|          |   - Do NOT declare completion until ALL failures resolved                                |
|          |   - Return to Step [1]                                                                   |

**Loop Exit Condition**: ALL verification commands pass (screenshots match, tests pass, type-check clean, lint clean, build successful)

## Outputs Each Cycle
* **Updated checklist** with current item ✔/✖
* **Verification results** (screenshots comparison, tests, type-check, lint, build) summarized
* **Error Trail append** with required sections:
  - Symptom
  - Root Cause
  - Impacted Modules
  - Evidence
  - Fix Summary
  - Files Touched
  - Why This Works
  - Verification Evidence
* **Append/Upsert** `.cursor/memory-bank/currentTaskContext.md` & `.cursor/memory-bank/progressTracking.md` with:
  - Task Summary at top
  - Latest cycle output
  - Next step checklist

## Non-Negotiables
* **No "green by mocking" in runtime code** (see guard-rails: No Fake Green section)
* **No guessing contracts—align with `/docs/` directory or pause to index the official doc** (see guard-rails: Scope & Evidence section)
* **No "task complete" until EVERYTHING is green** (verification commands: screenshots match, tests pass, type-check clean, lint clean, build successful) (see guard-rails: Completion Policy section)

--- End Command ---