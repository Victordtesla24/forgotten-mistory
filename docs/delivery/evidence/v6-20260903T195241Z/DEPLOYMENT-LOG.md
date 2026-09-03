# Deployment log — run `v6-20260903T195241Z`
R-30 (deploy each unit as soon as its tests pass) · R-31 (every uplift visible in production) ·
R-32 (ship something deployed, visible, functional and operational every 10 minutes) · SC-20.1

Every row was verified against the live URL **after** the deploy, with a fresh capture. A gate
number without a captured output is not recorded here.

| # | Commit | What shipped | Gates | Verified live |
|---|--------|--------------|-------|---------------|
| 1 | `4338ac2` | The dimensions citation resolves to `apps/api/app/routers/jobs.py` instead of the repo root; the dead self-contradicting `dossier` export and stale `proof` array removed; MiniVic's knowledge base aligned to the one sourced years figure | tsc · lint · audit 10/10 · build · content 14/14 | `GET /` 200; both hrefs present, the file-level one resolving; `grep -ci fifteen` → **0**; "Sixteen years" present |
| 2 | `544c4f9` | The page's first `<footer>`: an authored statement plus a build stamp read from git at build time, linking the short SHA to the commit that produced the bytes | tsc · lint · audit 10/10 · build · content+a11y 40/40 | `<footer>` live; statement present; stamp `544c4f97` links to its own commit |
| 3 | `9b9abd5` | Six phase validators stopped passing by talking to the production API on :8000 — identity-asserting readiness guard, port moved to 8010, PID liveness, phase 21 refuses loudly instead of dying on a deleted driver; C-2 withdrawn as this run's own false positive | tsc · lint · audit 10/10 · `bash -n` ×6 | Guard demonstrably fails against the real conflict (captured) |
| 4 | `1a9babb` | The skip link the stylesheet had always styled but the markup never rendered; `<main id="main">` target added | tsc · lint · audit 10/10 · build · a11y+content 34/34 | First Tab focuses `.skip-link`; `#main` present; `<footer>` present; stamp `1a9babb5`; **0 console errors** |
| 5 | `9733a85` | R-147: the self-presentation clip removed — player, stylesheet, data module and 4,078,491 bytes of assets; two baseless axe exclusions removed so the whole page is now audited | tsc · lint · audit 10/10 · build · a11y+listen+content 35/35 | **TC-RM-06:** `/assets/avatar/introduction.mp4` → **404** in production; greeting appears **0** times; stamp `9733a85b` |

## Standing verification

Measured on production after ship 4, recorded because they are SC-32.1 and R-90 evidence and
neither needed a fix:

- **LCP 412 ms** (budget < 2000 ms), **CLS 0** (budget < 0.05), DOMContentLoaded 217 ms, load
  486 ms — measured at 390x844, the mobile composition.
- **No video or poster is fetched on load.** The page pulls 1 document, 12 scripts, 2 stylesheets
  and 5 fonts. Nothing else.
- **22 outbound links checked, 21 healthy.** The single non-200 is
  `linkedin.com/in/vikramd-profile` returning **999**, which is LinkedIn's anti-bot response to a
  non-browser client, not a dead link — the same 999 the corpus agent hit. Recorded as a false
  positive of the checker, not a defect.

`POST /api/chat` → 200 and `GET /` → 200 after every deploy. Third-party request count remains
**0** (the tracker-free stance in R-170 is intact). The Firebase functions surface is
`elevenLabsTts` + `minivicChat` only, since the orphan `ssrforgottenmistory` was removed.

## Remote hygiene (§15, §11.8)

`main` is the only branch on the remote and there are zero open PRs — re-verified after each push.
One local worktree branch, `wt/data-backend`, exists for an in-flight work item; it is never
pushed, and merges to `main` and is deleted when that item lands.
