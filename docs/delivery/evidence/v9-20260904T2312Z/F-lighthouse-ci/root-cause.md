# Phase F — CI `lighthouse` job: root cause and fix

Run v9-20260904T2312Z · worktree `/root/forgotten-mistory/.claude/worktrees/wf_c737298c-fc7-1` · branch `worktree-wf_c737298c-fc7-1` · commit `b733e41b50d6486582151d088f19479a50a798e9`
Evidence tags: **Verified** = observed in this session from a tool call or a primary source; **Inferred** = follows from verified facts; **Assumed** = not checked.

## What actually failed (Verified — `ci-log-excerpt.log`, from run 33933075366)

The symptom brief said the *Composite performance score* step found zero `.lighthouseci/lhr-*.json` files. The job log says otherwise:

| Step | Outcome in the log |
| --- | --- |
| `lhci collect` | `Running Lighthouse 3 time(s)` on both URLs, `Done running Lighthouse!` |
| `lhci assert` | `Checking assertions against 2 URL(s), 6 total run(s)` … `All results processed!` |
| Composite performance score | `##[notice]http://127.0.0.1:3000/ composite performance score 0.98 meets the 0.80 target` and `…/performance-benchmark … 0.99 …` — it **read the six LHR files** |
| CI summary | ran, no error |
| **Upload Lighthouse reports** | `include-hidden-files: false` in the resolved inputs, then `##[error]No files were found with the provided path: .lighthouseci/. No artifacts will be uploaded.` — the only `##[error]` in the job |

Because that step has `if-no-files-found: error` (correct: an empty collect must fail), the job failed, and `build.needs` includes `lighthouse`, so build and deploy never ran.

## Why the upload found nothing (Verified)

- `actions/upload-artifact@v4` resolved to SHA `ea165f8d65b6e75b540449e92b4886f43607fa02` = tag **v4.6.2** (`git ls-remote --tags`).
- v4.6.2 `action.yml` declares `include-hidden-files` (default `false`); `src/shared/search.ts` passes `excludeHiddenFiles: !includeHiddenFiles` to `@actions/glob`.
- `@actions/glob` `internal-globber.ts` line 132: `if (options.excludeHiddenFiles && path.basename(item.path).match(/^\./)) continue` — evaluated **before** the directory branch, so a dot-directory is skipped and never traversed.
- upstream README: *"Hidden files are defined as any file beginning with `.` or files within folders beginning with `.`."*
- `.lighthouseci/` is such a folder, so every `lhr-*.json` / `lhr-*.html` inside it was excluded.

## When it started (Verified)

`git log -S"if-no-files-found: error" -- .github/workflows/deploy.yml` → `4174eea` (2026-09-04). That commit pointed the upload at `.lighthouseci/` with `if-no-files-found: error`; the hidden-file default has been `false` since upload-artifact v4.4.0, so the first run after 4174eea failed and every push since has been unable to deploy through CI.

## Candidates that were tested and ruled out

| Candidate | Verdict | Evidence |
| --- | --- | --- |
| (a) lhci 0.13 writes LHRs somewhere else | **Ruled out (Verified)** | local run: `npx --yes @lhci/cli@0.13.0 collect` wrote `./.lighthouseci/lhr-<ts>.json` + `.html` in the cwd; `.lighthouseci/reports` does not exist (only `lhci upload --target=filesystem` creates it). The CI composite step read them. See `lhci-local.log`. |
| (b) `set -euo pipefail` + `trap cleanup EXIT` + `shopt -s nullglob` interaction | **Ruled out (Verified)** | the composite step ran after the trap and printed the two `##[notice]` verdicts with real scores. |
| (c) `assert` or the filesystem upload target deleting/moving files | **Ruled out (Verified)** | files were present after assert (composite read them); `lhci upload` is never invoked, so the `upload` block in lighthouserc.json is inert. |
| (d) `npx --yes @lhci/cli@0.13.0` drifting to a newer patch | **Ruled out (Verified)** | `npx --yes @lhci/cli@0.13.0 --version` → `0.13.0`; `npm view @lhci/cli@0.13 version` → `0.13.0` (latest overall is 0.15.1). An exact spec is pinned. |
| (e) upload-artifact excludes the hidden directory | **Root cause (Verified)** | above. |

## Fix (smallest correct change)

`.github/workflows/deploy.yml`, step *Upload Lighthouse reports*: add `include-hidden-files: true`; keep `if-no-files-found: error`, `if: always()`, no `continue-on-error`. The comment above the step now states the real cause. The uploaded files are Lighthouse audits of a public page — no secrets (Verified by listing the local output: only `lhr-*.json` / `lhr-*.html`).

`tests/ci_pipeline.test.mjs`: two new contract tests (written first, failed on the unfixed workflow, pass after):
1. the lighthouse upload step reads `.lighthouseci/`, sets `include-hidden-files: true`, keeps `if-no-files-found: error`, has no `continue-on-error`, and the composite step still exits 1 on zero reports;
2. every `upload-artifact@v4` step whose `path` starts with `.` sets `include-hidden-files: true`.

`README.md`: delivery-log row for this fix.

## Verification on this host (Verified — `verification.log`)

- `node --test tests/ci_pipeline.test.mjs` → 22/22 (was 20/20 before the tests were added; 20/22 with tests and without the fix).
- `js-yaml@4.3.1` parses `deploy.yml`; upload step inputs read back as `{"name":"lighthouse-html-report","path":".lighthouseci/","include-hidden-files":true,"if-no-files-found":"error","retention-days":30}`.
- `node scripts/validate/ci_pipeline_robustness.mjs` → ALL PASS (27/27).
- `build.needs` unchanged: `["quality","lint","lighthouse","axe"]`.

## Not done here

- The fix is committed on the worktree branch only; not pushed, not deployed (per the brief). The CI proof is the next push to `main`: expect the `lighthouse` job's upload step to report the six `lhr-*` files and `build` → `deploy` to run.
- The local reproduction audited `/` only (static `out/` has no `/performance-benchmark` route — that page is served by `next start` in CI); it was run to establish *where* lhci writes, which does not depend on the page.
