# Incident 01 · Production served source that existed in no commit

**Found:** 2026-09-03, during the first real run of the T-37 preservation diff.
**Severity:** high — production and `main` diverged silently, and the page's own build stamp
asserted a commit that did not contain the bytes being served.
**Status:** `CLOSED` — production re-deployed from a clean checkout and now matches `main`
exactly; a guard now makes the failure visible rather than silent.

## What happened

`firebase.json` declares `"predeploy": ["npm run build:static"]`. That builds the **working tree**,
not `HEAD`. While a concurrent swarm had uncommitted changes in that tree, every deploy I ran
carried their in-progress source into production.

The divergence was concrete and checkable:

| | `Experience.tsx` axis-tick offset |
|---|---|
| `git show HEAD:components/sections/Experience/Experience.tsx` | `1.25rem` |
| working tree | `var(--space-2)` |
| **production HTML** | **`var(--space-2)`** |

So production ran code that was in no commit, under a footer reading *"This page was built from
commit f701558"* — a commit whose content differed from what a reader would have been looking at.

## Why it matters more than an ordinary staleness bug

The stamp exists **to be checked**. R-183 forbids the site carrying a statement about itself that
its own code contradicts, and this was that failure in its sharpest form: a reader who followed the
link would have found different bytes and had every reason to stop trusting the page above it. The
feature built to demonstrate delivery honesty was the one telling the untruth.

It also breaches §15's separation between a verified artefact and a deployed one: the shipped code
had passed no unit gate of its own, because it was mid-implementation.

## How it was found

Not by a test. The T-37 diff reported 24 "weakened" claims; chasing each one down proved 24 of them
were artefacts of the diff itself — and the last check, `grep -c "var(--space-2)"` against the
production HTML, returned 1 where `HEAD` had 0. **The bug was found while debugging the tool
looking for a different bug.** That is worth recording: the diff earned its place before it ever
passed.

## Fix

1. **The stamp refuses to lie.** It now runs `git diff --name-only HEAD` and renders nothing when a
   tracked file differs. Absence is the honest signal — the same rule it already followed for a
   build outside a checkout. Exactly two paths are exempt, `app/data/generated/` and `reports/`,
   because `build:static` derives both from the commit before Next renders anything; without that
   exemption the guard suppressed the stamp on every build, clean or not.
2. **Production reconciled.** Rebuilt and deployed from a detached worktree at `main`, leaving the
   concurrent swarm's working tree untouched. Verified after: stamp `1672d17`, `main` `1672d170`,
   and `grep -c "var(--space-2)"` against production → **0**.

## Two bugs inside the fix, both caught before shipping

- The first guard used `git status --porcelain`, trimmed the output, then sliced three characters
  off each line to drop the status prefix. Trimming removes the leading space of the *first* line,
  so the slice cut into the path and the exemption never matched — suppressing the stamp on every
  build. Caught by asking why a clean build had no stamp instead of assuming it was correct.
- The guard was then **proved able to fail**: a stray comment appended to `globals.css` made the
  stamp vanish, and reverting it brought the stamp back. A gate that cannot fail is decoration.

## Standing consequence

Any deploy run from a dirty tree now ships a page with **no build stamp**, which is both honest to
the reader and immediately visible to whoever deployed it. The durable fix is to deploy only from a
clean checkout; the guard makes forgetting loud instead of silent.
