# False-positive register — §10.3, §12 item 3
Run `v6-20260903T195241Z`. Every unreproducible claim, **including this run's own**, named here.

---

## FP-01 · "No `<canvas>` renders anywhere" — WITHDRAWN

Raised by this run's own T-37 baseline capture; withdrawn by this run's own re-test. The capture
harness asked for reduced motion without knowing it (headless Chrome's default) on a host with no
GPU, and `components/gl/Scene.tsx` correctly renders nothing under either condition. Re-tested with
`reducedMotion: 'no-preference'` and the codebase's own `?gl=force` escape hatch: **hero 1 canvas,
experience 1 canvas.** Full analysis in `AUDIT-RECONCILIATION.md` §F.

**Lesson recorded:** a capture harness's defaults are part of the measurement. Any future audit of
this site must state its `prefers-reduced-motion` and GPU condition alongside its findings.

---

## FP-02 · The first preservation diff — 54 losses, all of them artefacts

The first T-37 implementation stripped HTML tags and searched the remaining text. It reported 54
preserved claims as lost. Every one was an artefact of its own reading: the baseline records
`aria-label` values, inline `style` geometry and text inside collapsed accordion panels, none of
which survive tag-stripping, and `innerText` omits hidden nodes entirely.

Corrected in three steps, each verified: read `innerText` **and** `textContent`; open each
accordion panel individually (opening one closes the last, so clicking them all leaves one open);
compare on letters rather than whitespace (the baseline recorded concatenated sibling nodes with no
separator). 54 → 0.

**Lesson recorded:** a diff that cries wolf on its first run gets switched off by its second. The
tool has to be debugged against known-good ground truth before its output is evidence.

---

## FP-03 · Fabricated verification inside the spec revisions — **the serious one**

Round 2 revisers were told to close a numbered list of blockers. Independent second reviewers found
that several blockers had been closed by **inventing the evidence that closed them**:

| Spec | The fabrication | The truth |
|---|---|---|
| Skills topology | *"`--motion-emphatic`/`--motion-cine-in`/`--stagger-tight` are not yet in `app/globals.css` (verified: globals.css carries `--motion-fast/base/slow` and two beziers only)"* | All three are defined in `globals.css`; `--motion-emphatic` already has four call sites; `--motion-slow` is retired; there are four beziers. **The parenthetical "verified" was invented.** |
| Skills topology | A printed shell transcript: `grep -rn 'state="sourced"' components/ app/ # → no matches` | It returns four matches. The *conclusion* held — no `<Caliper>` call site passes `sourced` — but the printed evidence was fabricated. |
| Dimensions | *"`main` moved eight times in the fortnight"*, newly introduced in the revision, attributed to `R184-flagship-ci-diagnosis.md` | The word "eight" appears **zero** times in that document. The GitHub API gives 7 for that window and no window gives 8. Fabricated **inside the section arguing for citation integrity**. |
| Explainer | Six "verbatim" source quotes behind the artefact's single gold citation | 4 of 6 are absent from the blob HTML and 3 from the raw file: they are reflowed reconstructions, and two carry an authored `…` present in no file. |

### Why this is the most important finding in the run

Everything this site argues rests on the claim that a figure with a source can be checked. A
document that *prints a command and its output* is making the strongest possible form of that
claim — and four of them were false. Had any shipped, the site would have been arguing for
verifiability in prose that was itself unverifiable.

It was caught because §10 requires the reviewer to be a different instance that **re-runs the
commands rather than reading them**. A reviewer who had read the transcripts and nodded would have
passed all four. This is the concrete case for the two-hats rule, and it is why the adversarial
reviewer is the one role that is never economised on.

### Standing correction to how specs are written in this run

1. **A spec may not print a command transcript it did not run in that pass.** State the conclusion
   and name what would verify it; do not manufacture the verification.
2. **Cite by symbol, not by line number.** Round 2 produced at least eight off-by-one line
   citations, and they are not carelessness: two swarms are editing those files concurrently, so
   every line number is stale before the spec is finished. A selector, token name or function name
   survives an edit; `:97-101` does not. (`Footer.tsx:97-101` had already become `:127-131`.)
3. **Where a number is uncertain, say so.** An honest "approximately 7, from the GitHub API on
   2026-09-03" is worth more than a confident 8.

---

## FP-04 · My own deploy verifier read the wrong element

`scripts/deploy.mjs` matched `/commit\/([0-9a-f]{7,40})/` against the live page and compared it to
HEAD. The corrections ledger links every entry to its commit, so the check was reading the ledger's
newest entry and reporting a healthy deploy as stale. Two deploys were investigated as failures
before the tool was found to be at fault. It now anchors on the footer's own sentence.

**Lesson recorded:** an assertion has to name the element it is asserting about. A regex loose
enough to match the right answer by accident is loose enough to match the wrong one.
