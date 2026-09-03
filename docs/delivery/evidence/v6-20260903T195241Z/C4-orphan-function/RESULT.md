# C-4 · Orphan billable Cloud Function — `FIXED-AND-VERIFIED`

**Defect.** `ssrforgottenmistory` (v2, us-central1, nodejs20, 256 MB) was deployed and billable but
referenced by nothing: absent from `firebase.json` rewrites, absent from `functions/index.js`, and
`grep -rn ssrforgottenmistory` over all source returned **zero** references. A leftover from the
Firebase webframeworks integration.

**Contract.** R-162 — removal is a deliverable, planned, deployed and verified like any feature,
never deferred and never left as dead code behind a flag. Decision D-06.

**Hazard handling (§9).** Target named and captured before the irreversible action
(`before.log`); recovery path recorded — the function is regenerable by re-enabling the
webframeworks experiment and redeploying, and it served no route the static export uses.

**Action.** `/usr/bin/firebase functions:delete ssrforgottenmistory --region us-central1 --force`
→ `✔ Successful delete operation.`

**Verification, captured fresh after the change:**
- `firebase functions:list` → exactly two functions remain, `elevenLabsTts` and `minivicChat`
  (`after.log`).
- `GET https://forgotten-mistory.web.app/` → **200**
- `POST https://forgotten-mistory.web.app/api/chat` → **200**

Live routes unaffected. The orphan is gone and the billing surface with it.
