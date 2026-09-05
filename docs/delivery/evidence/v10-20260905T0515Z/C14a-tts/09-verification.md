# 09-verification.md — independent adversarial verification of C14a (the TTS voice)

**Task:** `artifacts/kanban/tasks/t_28011b3d.md` — V-C14a, reviewer profile
(`docs/prompt.md` §5, role `3rd_party_independent_adversarial_review`, level 1, effort max).
**Verified at:** 2026-09-05T06:45Z → 07:0xZ (UTC).
**Subject:** branch `worktree-wf_55e925e9-074-1` @ `4a3ed5b`, four commits
(`8c09833` the fix, `60a474f` the evidence, `3af523c` the cloned-id removal, `4a3ed5b` the spend correction).
**Worktree:** `/root/forgotten-mistory/.claude/worktrees/wf_55e925e9-074-1`.
**Raw transcript:** `docs/delivery/evidence/v10-20260905T0515Z/C14a-tts/09-verification-gates.log`.

## VERDICT — PASS, with three findings that belong to the record, not to the fix

The voice works. `POST /api/tts` on the live origin returns real MP3 bytes to this reviewer's
own probe, the spec is green against production on both of its assertions, the deployed
function is the redeployed revision, and the cloned voice id is gone from every shipped path.
The hard stop condition did not apply and was correctly not taken: the upstream refusal named
the **voice**, not the key, and the function still runs on `ELEVENLABS_API_KEY` **version 2** —
no secret was rotated, by the author or by this reviewer.

The three findings below are defects in the *delivery record*: one shipped number that the
author's own correction did not reach, three cited evidence files that are not in git, and a
docstring that describes a DOM relationship the code does not have. None of them makes the
site behave worse; all three make the record harder to audit. They are listed because a
verification that only records greens is not a verification.

The author's report is testimony. Nothing below is taken from it — where the author's number
and this reviewer's number agree, both were produced independently.

## Gates — re-run or re-measured by this reviewer

| # | gate | command | exit | observed |
|---|------|---------|------|----------|
| G1 | diff scope | `git diff main...HEAD --stat` | **0** | `1 file changed, 11 insertions(+), 5 deletions(-)` — only `07-decisions.md`, because the pipeline had already consolidated the branch |
| G1b | diff scope, full task | `git diff d6396d2..HEAD --stat` | **0** | `6 files changed, 369 insertions(+), 14 deletions(-)` — `functions/index.js`, `components/MiniVicBot.tsx`, `tests/e2e/avatar-voice.spec.ts`, `README.md` + two evidence files. Exactly the files the brief names, plus evidence. Nothing else touched |
| G2 | credential scan | `git diff main...HEAD \| grep -nE '[A-Za-z0-9]{32,}'` | **1** | zero hits |
| G2b | credential scan, full diff | same grep over `d6396d2..HEAD` | 0 | **3 hits, all benign** — ElevenLabs `request_id` correlation ids (`4fc56f01…`, `a6ce9f43…`, `ea776b04…`) quoted inside upstream error bodies in `01-diagnosis.md`. A targeted scan for `sk_` / `AIza` / `PRIVATE KEY` / `xi-api-key: <value>` / `ghp_` / `glpat-` / `AKIA` over the same diff exits **1** — no credential material |
| G3 | cloned voice gone | `grep -rn 0ZJ4kFDo6bZUNQsuULOW functions/ components/ app/ lib/` | **1** | **0 hits.** Repo-wide the id survives only in historical `docs/delivery/evidence/**` and the board's own task text — never in shipped code |
| G4 | live probe (1 paid call, 5 chars) | `curl … -d '{"text":"probe"}' …/api/tts` | **0** | `200 audio/mpeg 14254` · `file` → `Audio file with ID3 version 2.4.0, contains: MPEG ADTS, layer III, v1, 128 kbps, 44.1 kHz, Monaural`. Clears the 8 kB floor by 6 kB and is a real MP3, not a mislabelled error body |
| G5 | spec against live | `PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/e2e/avatar-voice.spec.ts` | **0** | `2 passed (3.2s)` — **both** assertions, against production |
| G5e | negative control | same spec with `TTS_ORIGIN` aimed at a Hosting 404 | 1 | `1 failed` · `Expected: 200  Received: 404`. The endpoint assertion bites; it is not vacuous. Free — a 404 at Hosting never reaches the function |
| G6 | function log | `npx firebase-tools functions:log --only elevenLabsTts -n 20` | **0** | serving `elevenlabstts-00009-sez` (UpdateFunction 06:35:06Z); **no `E` entry anywhere after the redeploy** through 06:40:54Z; secret pinned at `ELEVENLABS_API_KEY` **version 2**, unchanged |
| G7 | tsc | `npx tsc --noEmit` | **0** | no diagnostics |
| G8 | lint | `npm run lint` | **0** | `✔ No ESLint warnings or errors` |
| G9 | build | `npm run build:static` | **0** | `RESULT: PASS — no credential material in the emitted bundle` (43 files under `out/`) |
| G10 | audit | `node scripts/validate/overhaul_static_audit.mjs` | **0** | `RESULT: ALL PASS (10/10)` |

The two build-generated tracked files the build rewrote (`app/data/generated/build-stamp.ts`,
`reports/static-audit.json`) were restored with `git checkout --`; `git status --porcelain`
printed nothing afterwards.

## What this reviewer checked beyond the gate list

**The fix is the fix, not a mask.** `functions/index.js:54` is now
`const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"` with no fallback and no second code path; the key
comes from `ELEVENLABS_API_KEY.value()` on a `defineSecret`, with no `||` default and no
dummy-key pattern. The handler's failure path (`:114–128`) still surfaces upstream failures as
502/500 with a `logger.error` — it never fabricates audio and never degrades silently. That
matters more than the green: a fix that had swallowed the 401 would also have made the probe
pass.

**The label assertion is not tautological.** `grep -rni synthetic components/` returns one
piece of rendered text — `MiniVicBot.tsx:1355`, "Synthetic voice · not a recording of Vikram".
The other hits are the `startSyntheticMouth()` identifier and comments, none of which reach the
DOM. And it is genuinely red-before: `git show d6396d2:components/MiniVicBot.tsx | grep -i
synthetic` returns the identifier and nothing else, so before this commit the panel rendered no
disclosure at all.

**The client half is live, which the author could not yet claim.** `origin/main` is `15fb165`
(`consolidate: merge worktree-wf_55e925e9-074-1 into main`), the live
`<meta name="build-commit">` reads `15fb165b`, and `Synthetic voice` is present in the deployed
chunk `/_next/static/chunks/app/layout-983fd1e49cc1f867.js`. All four commits — `4a3ed5b`
included — are on `origin/main`. The author's "remaining: not yet on Hosting" caveat is now
stale in the site's favour, and G5 proves it: the label test passes against production.

**The blob lifecycle does not leak.** `speakReply` adds each object URL to `objectUrlsRef`
before calling `rememberLastAudio`, which revokes the previous URL when it is replaced
(`:339–343`), and the unmount path revokes the whole set (`:350–351`). Replay still works
because the current URL is the one retained.

## Findings

**F1 — the README still prints a number the author's own correction retracted.**
`README.md:304` records "58 TTS characters spent". Commit `4a3ed5b` exists precisely to correct
that count, and `07-decisions.md` §6 now reads "Three ElevenLabs TTS calls, **63 characters**".
The correction reached the evidence file and not the delivery log, so the shipped README carries
a figure the repo elsewhere says is wrong. One line, one number. Left for the author/orchestrator
rather than edited here: an independent reviewer who rewrites the artefact under review stops
being independent.

**F2 — three of the five cited evidence files are not in git.**
`02-tests-failing.log`, `04-probe.log` and `04-tests-passing.log` are matched by
`.gitignore:42` (`*.log`) and are untracked. Only `01-diagnosis.md` and `07-decisions.md` are in
`main`. So the red-run proof, the probe result and the green-run proof exist *only* inside this
worktree and vanish with it — an auditor reading from `main` cannot reach them. This is not a
convention gap: the sibling C13 evidence directory in the same run
(`…/C13-next15/`) has **twelve** `.log` files tracked, all force-added past the same ignore rule.
C14a simply missed the `-f`. **This reviewer has force-added the three files unmodified**, with
their sha256 recorded in `09-verification-gates.log` (G7) so anyone can confirm nothing in them
was touched:

```
6977e230391105a04f9803240af08e524934ba1a389e61a54c0ab2a7dd4e12b7  02-tests-failing.log
4611c339eb16cdb7c54e1c8e89571b199afc1e3880a311749a9f93202a1bfff6  04-probe.log
97383f026a15739abe9e33a75deae7b06cd557d3c1717afb740b28e4019b622c  04-tests-passing.log
```

**F3 — the spec's docstring describes a nesting the DOM does not have.**
`02-tests-failing.log` captured the red run against an earlier draft whose line 72 read
`panel.locator('[data-testid="minivic-audio"]')`; the committed spec reads
`page.locator(…)`. That reads at first like an assertion widened to force a green, and the brief
asks for exactly that check — so it was checked, and it is not. The `<audio
data-testid="minivic-audio">` at `MiniVicBot.tsx:1629` is a **sibling** of the panel (it sits
after the toggle `</button>`, outside the `isOpen &&` block), never a descendant. The
panel-scoped form asserted a false structural fact and could not have passed against any build;
page-scoping it was a correction, not a relaxation. Two residues remain: the spec's own
docstring (line 28) still claims "`[data-testid="minivic-audio"]` lives inside it", which is
false; and because the red run aborted on that line, **no log captures the label assertion
failing on its own merits** — that red is established here instead, by the `d6396d2` grep above,
not by the committed evidence. The docstring's conclusion ("deleting the label while keeping the
player fails here") still holds: the label assertion is panel-scoped.

## Smaller notes, for the record

- **`04-probe.log` presents a byte prefix as "format proof"; it is not stable.** The log records
  `magic=fffb90c4` (a raw MPEG frame header). This reviewer's probe against the same revision
  returned `49443304` — an ID3v2.4 tag. Both are valid MP3; ElevenLabs simply does not emit a
  byte-stable prefix. Nothing asserts on it, so nothing is at risk, but it should not be quoted
  as an invariant.
- **A copy tension one line above the disclosure.** The panel prints "Vikram's AI clone · ask me
  anything" directly above "Synthetic voice · not a recording of Vikram". The disclosure is
  present, specific and correctly placed where the audio plays; the line above it still says
  "clone". An editor's call, not a gate — flagged because prime directive 3 is about never
  grading a claim above its evidence.
- **Voice choice is sound and documented.** `JBFqnCBsd6RMkjVDRZzb` is an ElevenLabs *premade*
  voice; `07-decisions.md` §2 records why the other premade males were rejected (young,
  character-acting, or "laid-back"), and it matches the British-male greeting already shipped, so
  greeting and replies sound like one speaker.

## Containment

No secret was read, printed, compared or rotated by this reviewer.
`/root/.claude/.env.production` was never opened; no `firebase functions:secrets:*` command was
run; the function remains pinned to `ELEVENLABS_API_KEY` version 2 (G6). No static server was
started, so ports 5599 / 8080 / 5601 / 5602 / 5603 were untouched.

**Reviewer spend: two paid ElevenLabs calls, 5 characters each — 10 characters total** (the G4
curl probe and the spec's own `{"text":"probe"}` in G5), which is what the brief authorises
("one live probe … accept the one extra short call"). The negative control 404s at Hosting and
never reaches ElevenLabs; `functions:log` is a read. No image, video, chat or avatar render.

## Still open after this task — unchanged, and correctly so

Vikram's own cloned voice needs an ElevenLabs plan with Instant or Professional Voice Cloning
(`payg` reports `ivc:false` / `pvc:false`), and a true ≤40 ms viseme track still needs a
generated phoneme timeline — SPEC-v10 §R3(c), owner-blocked. This task neither touched nor
claimed either.
