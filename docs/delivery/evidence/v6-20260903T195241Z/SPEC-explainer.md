# SPEC · The Explainer Avatar

Run `v6-20260903T195241Z` · authority: R-147 … R-158, execution steps 18–20 and 28–31, Gate P, T-33 · T-35
Binding upstream: `AUDIT-RECONCILIATION.md` (row A-1), `DECISIONS.md` (D-01, D-04), `design-system-lock.md`,
`encoding-grammar.md`, `hero-visualisation-register.md` §4, `channel-analysis.md` §7–§8.

> **This document is a build order, not a proposal.** Every path, type, number, easing, citation and test below
> is fixed. An implementer executes it without making a further design decision. Where a fact could not be
> established, this document says so in those words and names the gate that must resolve it.

---

## 0 · The two corrections this spec makes to the contract

| # | Contract text | Verified reality | Effect on this spec |
|---|---|---|---|
| **0-A** | **R-186 / step 18:** "the audit finds **no self-presentational avatar video present**, so R-147's removal step is a no-op … record that finding explicitly and proceed" | **FALSE.** A 29-second self-presentational clip ships: `components/sections/Listen/Avatar.tsx` mounted at `components/sections/Listen/Listen.tsx:97`, with **4,078,491 bytes** of assets. Script line 1 is verbatim *"Hello. I'm Vikram Deshpande."* (`app/data/portfolio/avatar.ts:41`). | §1 replaces step 18. The removal is **real, shipped, verified work** under R-162 — not a recorded no-op. `SC-95.1`'s clause "the audit record explicitly documents that R-147's removal step was a no-op" is **unsatisfiable as written**; it is satisfied instead by this document plus `AUDIT-RECONCILIATION.md` row A-1, which record the opposite finding with evidence. Observation governs. |
| **0-B** | **Step 29:** produce the explainer at "**UHD 4K/8K**" | **Not achievable on R-140's model set.** Live catalogue read (§7.1): the ceiling across all seven named models is **1080p** (`veo-3.1-lite`, `wan-3.0`, `wan-3.0-prime`, `heygen/avatar-iv`); `minimax/hailuo-3-max` caps at **768p**; both Seedance rungs cap at **720p**. | Master and delivery are **1920×1080**. §7.6 records the one available upscaler and why R-139 forbids using it without an owner decision. **No silent substitution.** |

---

# 1 · The removal (R-147, R-162, SC-78.1)

The removal ships as its own deployment inside the 10-minute cadence, **before** any explainer asset exists.
It is not gated behind a flag, not commented out, and not deferred.

## 1.1 Every artefact that exists to introduce, justify or explain the avatar

Sizes are `stat -c%s` at run time; digests are `md5sum`.

### Delete outright

| # | Absolute path | Bytes | Lines | Why it exists |
|---|---|---|---|---|
| 1 | `/root/forgotten-mistory/components/sections/Listen/Avatar.tsx` | 4,122 | 114 | The player itself |
| 2 | `/root/forgotten-mistory/components/sections/Listen/Avatar.module.css` | 5,651 | 230 | Its only stylesheet |
| 3 | `/root/forgotten-mistory/app/data/portfolio/avatar.ts` | 2,441 | 47 | Invitation, disclosure, provenance list, transcript — **every copy line that exists to justify the avatar** |
| 4 | `/root/forgotten-mistory/public/assets/avatar/introduction.mp4` | 4,041,235 | — | md5 `1a08a866be2b8a6fe199f6ada8ff41e3` |
| 5 | `/root/forgotten-mistory/public/assets/avatar/poster.jpg` | 36,140 | — | md5 `514be1b980486d9090f8655c7da9963a` |
| 6 | `/root/forgotten-mistory/public/assets/avatar/introduction.vtt` | 1,116 | — | md5 `0a8a62679ade4ade4106c47ec1a5a49b` |
| 7 | `/root/forgotten-mistory/public/assets/avatar/` | — | — | The directory itself, once empty |

**Asset total removed from the repository and from `out/`: 4,078,491 bytes (4.08 MB decimal, 3.89 MiB).**
Those bytes are **not re-used, not re-encoded and not archived in-tree.** The clip is a self-introduction;
R-147 removes the thing, not its container. A copy of the three files is written **once** to
`docs/delivery/evidence/v6-20260903T195241Z/removed-assets/` **only if** the Owner asks at Gate P; absent that
instruction the deletion is terminal and the git history is the archive.

### Edit — the mount point and its surrounding copy

| # | Path:line (pre-edit) | Exact change |
|---|---|---|
| 8 | `components/sections/Listen/Listen.tsx:97` | Delete the line `        <Avatar />`. The `</section>` above it and the `</div>` below it close unchanged; **no placeholder, no comment, no `{/* removed */}` marker.** |
| 9 | `components/sections/Listen/Listen.tsx:5` | Delete `import Avatar from './Avatar';` |
| 10 | `components/sections/Listen/Listen.tsx:23-26` | Delete the four-line doc paragraph beginning *"The avatar sits here rather than in the hero…"* — it is a copy line that exists to justify the avatar. |
| 11 | `tests/e2e/listen.spec.ts:32-40` | The `TC-LISTEN-02` preamble comment cites *"the avatar module"* and *"the avatar's words are a disclosure"*. Rewrite to name only the three subjects that survive: the sentence, the channels, the coffee line. **The assertion is not weakened** — the sixty-five-word budget and its locator are unchanged. |
| 12 | `tests/e2e/listen.spec.ts:53-64` | Delete `TC-LISTEN-07` in full. Its subject no longer exists; it is **deleted, never rewritten into an assertion that passes on an empty page** (R-159). |
| 13 | `tests/e2e/listen.spec.ts:66-82` | Delete `TC-LISTEN-08` in full, same reasoning. |
| 14 | `tests/a11y/accessibility.spec.ts:92-93` | The comment *"The only remaining `<iframe>`-shaped content is the avatar's `<video>`"* becomes false. Replace with the true statement, and **re-evaluate `.exclude('iframe, iframe *')`**: if no `<iframe>` and no `<video>` remain in the DOM at audit time, the exclusion is deleted so axe audits the whole page. Removing an exclusion may surface violations; those are fixed, not re-excluded. |
| 15 | `scripts/validate/overhaul_static_audit.mjs:161-172` | The `ON_DEMAND_VIDEO = 5 * 1024 * 1024` third budget class and its `onDemand()` predicate `/(^|\/)assets\/avatar\//` exist **only** for the removed clip. §5.7 re-points them at the explainer's own path with a **tightened** cap. The 12-line justification comment at `:161-167` is rewritten for the new subject; it is not carried over verbatim, because it argues for a clip that no longer exists. |

### Adjudicate, do not blind-delete

| # | Path | Finding | Ruling |
|---|---|---|---|
| 16 | `lib/avatarContext.tsx` (68 ln) | Exists to pulse a `HeroAvatar` that **no longer exists** — `grep -rl HeroAvatar components app` returns nothing; the hero rebuild removed the portrait (`tests/overhaul/avatar.spec.ts:7-14`). It is still *written to* by `components/MiniVicBot.tsx:257,281-282` and *provided* at `app/layout.tsx:139,144`. | **Dead scaffolding with a live writer and no reader.** Remove the provider, the hook pair and the three call sites in the same commit, under R-82/§13 (dead code is a defect) — but as its **own** entry in the removal ledger, because it is chatbot scaffolding, not explainer copy. If `components/MiniVicBot.tsx` is under concurrent edit by the engagement swarm, this row defers to that swarm and is tracked, never dropped. |
| 17 | `lib/voiceoverController.ts:14` | Comment references the same dead `HeroAvatar` pattern. | Comment corrected in the same commit. Not a copy line about the avatar video; the file stays. |
| 18 | `public/assets/my-avatar.mp4` (147,481 B), `my-hero-avatar.mp4` (228,228 B), `my-avatar-voice.mp3` (501,178 B), `my_avatar.png` (178,777 B), `my_avatar.webp` (66,470 B), `my_avatar.avif` (41,343 B) | **Out of R-147's scope.** These belong to `MiniVicBot` (`components/MiniVicBot.tsx:225`), the OG card (`app/layout.tsx:108`) and `scripts/validate/phase05_graphics_fidelity.sh:21-23`. None introduces, justifies or explains the removed clip. | **Retained.** Deleting them would break the OG image and a validation gate. Recorded here so the removal audit does not read their survival as an incomplete removal. |
| 19 | `scripts/validate/phase09_avatar_sync.sh` | Targets a D-ID avatar stream on `127.0.0.1:8000` — which on this host is the **Aether production API** (D-05). | **Out of R-147's scope; already a defect under D-05.** Not touched by this spec. |

## 1.2 What happens to the mount point

`components/sections/Listen/Listen.tsx:97` is the last child of `.inner`, immediately after the corrections
ledger `<section>`. After removal, `.inner`'s last child is that ledger and the section ends on
`<p className={styles.colophon}>`. **Nothing replaces it.** The Listen section's own thesis
(`listen.ts:1-12`) is that the closing screen is *"nearly empty on purpose"* — restoring emptiness there is
the correct end state, and the explainer deliberately does **not** move into the vacated slot (§4.1).

## 1.3 Removal verification — T-33, Gate P

Runnable, and each can fail.

| Id | Assertion | Command |
|---|---|---|
| `TC-RM-01` | Zero files under `components/`, `app/`, `lib/`, `public/`, `tests/`, `scripts/` match `/assets\/avatar\/introduction/` or import `Listen/Avatar` | `! grep -rl -e 'Listen/Avatar' -e 'assets/avatar/introduction' components app lib public tests scripts` |
| `TC-RM-02` | `public/assets/avatar/` does not exist | `! test -e public/assets/avatar` |
| `TC-RM-03` | The three md5s in §1.1 appear nowhere in `out/` after `npm run build:static` | `! find out -type f -exec md5sum {} + \| grep -E '1a08a866be2b8a6fe199f6ada8ff41e3\|514be1b980486d9090f8655c7da9963a\|0a8a62679ade4ade4106c47ec1a5a49b'` |
| `TC-RM-04` | The shipped HTML contains none of the four transcript sentences from `avatar.ts:41-46`, and no occurrence of the string `Hello. I'm Vikram Deshpande` | Playwright: `expect(await page.content()).not.toContain("Hello. I'm Vikram Deshpande")` |
| `TC-RM-05` | The Listen section renders **zero** `<video>`, `<figure>` and `<track>` elements | Playwright, `#listen` scoped, `toHaveCount(0)` on each |
| `TC-RM-06` | Production, post-deploy: `GET https://forgotten-mistory.web.app/assets/avatar/introduction.mp4` → **404** | `curl -sfo /dev/null -w '%{http_code}' …` asserted `== 404` |
| `TC-RM-07` | Removal is not behind a flag: zero occurrences of `avatar` in any env/flag/config consumed at build | `! grep -ri 'avatar' next.config.js firebase.json .env.example` |

`TC-RM-06` is the one that makes this a **shipped deliverable** rather than a working-tree change (R-162).

---

# 2 · Concept selection (R-149) — four candidates, one winner

R-149's four criteria, applied verbatim. "Coupled" is read strictly: the visualisation must **already be in
the register and slated to exist**, per `hero-visualisation-register.md`.

## 2.1 The candidates

### Candidate A — *"How an entailment guard reverts an unsupported LLM claim"* — **WINNER**

| Criterion | Verdict |
|---|---|
| **Genuinely difficult** | **Yes.** It requires the reader to hold three distinct things apart: token presence, semantic entailment, and *scope of attribution*. The failure it defeats — a claim whose every word is present in the evidence but attached to the wrong employer — is counter-intuitive to anyone who assumes "grounded" means "the words came from the source". |
| **Drawn from the R-8 corpus** | **Yes, and it is the most checkable item in the whole corpus.** Verified on the **public default branch**, not a local checkout: `GET repos/Victordtesla24/aether-job-career-agent/contents/apps/api/app/services/resume_tailor.py?ref=main` → blob sha `a0197fba84554d5d250d85c746db425a005d397c`, 132,909 bytes, 2,771 lines (retrieved 2026-09-03). Line numbers on `main` are identical to the local tree: `ENTAILMENT_SYSTEM_PROMPT` at `:100-119`, `_verify_entailment()` at `:2656`, the conservative fail-safe log at `:2691`, `_entailment_rejections()` at `:2711`, the deterministic token guard's own rationale at `:140-145`, the worked "for financial institutions" example at `:96` and `:2663`. |
| **Coupled to a hero visualisation** | **Yes — Section 4, The Bench.** `app/data/portfolio/skills.ts:131-138` already carries the capability `LLM evaluation and guardrails — Langfuse, Phoenix`, `sources: ['independent','aether']`, `evidence: '−38% error-budget breaches; entailment guard reverts unsupported claims'`, `status: 'non-production'`, `caveat: 'the −38% was measured against a simulated error budget, not live traffic'`. The Bench is a **registered hero** (`hero-visualisation-register.md` §4) and ships regardless of this explainer. |
| **Valuable to the audience** | **Yes, to both halves of the dual audience.** To the technical reviewer it is a design pattern with a runnable implementation. To the hiring executive it is the difference between a system that warns and a system that cannot ship the unsupported version — which is the accountability question in R-8's "Career Growth" dimension. |
| **Hands off into a visualisation that will actually exist** | **Yes** — §4.2. |

**The decisive additional property.** This concept is the only candidate whose *mechanism* claim is
`sourced` while its *number* stays `self-reported`. It therefore lets the site render the caliper's
**third state for the first time** (defect C-3) **without grading a single claim above its evidence**: the
gold mark attaches to a pinned line of public code, never to the −38 %.

### Candidate B — *"Why a mainframe test-evidence harness cut ~3 h to ~15 min across 200+ SIT/E2E scenarios and 8 squads"* — REJECTED

Corpus-solid: `corpus-cv.json /roles[0]/bullets[1]` verbatim, page 1, WORK EXPERIENCE, with metrics
`m-ato-01` (eight squads), `m-ato-03` (200+ SIT/E2E scenarios) and `m-ato-05` (75+ hours against 64 available).
It couples cleanly to **The Span + Mechanisms** (register §3).

**Rejected on criterion 1, "genuinely difficult".** The idea — automate evidence capture so a human stops
transcribing it — is immediately legible to both audiences at first hearing. The *difficulty* in that work was
organisational (a zero-new-approvals toolchain inside a government mainframe estate), and organisational
difficulty is not a *concept* a viewer can be taught and then apply to a fresh example. It would produce a
case study, and R-150 forbids anything but hook/crux/mental-model/payoff.

**Rejected on a second, harder ground: it is unverifiable by the viewer.** The ATO harness is not public.
The entire site is built on "go and check"; an explainer whose central claim cannot be opened would be the
one artefact on the page that asks for trust. Candidate A's claim opens in a browser.

### Candidate C — *"Why a claim without a checkable source is not a measurement"* — REJECTED

The calibration idea itself. It is the site's own thesis (`components/marks/Caliper.tsx:18-36`,
`app/data/portfolio/skills.ts:11-18`), and it couples to **The Instrument Face** (register §2).

**Rejected on criterion 2, "drawn from the R-8 corpus".** The R-8 corpus is his *work* — CV, repositories,
channel. This concept is drawn from **this website's own design rationale**. Teaching it would make the
explainer a commentary on the page it sits on.

**Rejected on a fatal second ground.** The site already argues this proposition *by construction* — fifteen
caliper marks, the `open` bracket, the Skills refusal, the *Excluded, and why* list. R-161 ("argue by artefact,
never by assertion") makes stating it aloud a **downgrade**: it converts the site's strongest demonstrated
argument into an asserted one. Candidate A instead **enacts** Candidate C on a live example, which is the
artefact form of the same claim.

### Candidate D — *"A Vedic astronomy algorithm, from śloka to Python"* — REJECTED

Corpus-real and the strongest single body of teaching evidence he has: 9 of 10 public videos, e.g.
*"Sanskrit Shlokas function like modern Computer Algorithms (If/Else logic)"* (`gMe4FZbjcQE`), *"Translating
the sun's longitude into Python"* (`Q1NwbcHbAh0`), *"कुंडलीचे 'डीबगिंग' (Debugging) कसे चालते?"* (`c_M_LSB65RA`)
— all verbatim in `corpus-youtube.json`.

**Rejected on criterion 3, "coupled to a hero visualisation".** The only visualisation it could hand into is
the **creator strand of The Double Rail** (register §5). Per `channel-analysis.md` §8 that strand's own
adjudication is that the channel corroborates **4 of 17** capability rows and **6 of 10** dimensions, and that
the Vedic cluster's join to Skills is via `sources[].id='rectifier'` where the register states plainly: *"It
evidences the domain, not the orchestration."* An explainer handing into a strand that has been formally
ruled a weak corroborator would be the site's loudest claim landing on its thinnest edge.

**Rejected on criterion 4.** The audience is hiring executives and technical reviewers for delivery and AI
assurance roles. Vedic astronomy is the most interesting thing on the channel and the least relevant to the
decision the audience is making. R-119 already bars leading with it.

**Not discarded.** Candidate D's *technique* is cited by this spec: §6.3 cross-links the explainer to the
channel communication-evidence model precisely because the channel proves *how he constructs an explanation*.

## 2.2 Selection record (R-149 "record the rationale", R-164)

| | A · entailment guard | B · mainframe harness | C · calibration | D · Vedic algorithm |
|---|---|---|---|---|
| Genuinely difficult | **PASS** | FAIL | PASS | PASS |
| From the R-8 corpus | **PASS** (public `main`) | PASS (CV p.1) | FAIL (site's own rationale) | PASS |
| Coupled to a hero visualisation | **PASS** (The Bench, §4) | PASS (The Span, §3) | PASS (Instrument Face, §2) | FAIL (weak strand) |
| Valuable to the audience | **PASS** (both halves) | PASS | PASS | FAIL |
| Viewer can check the claim | **PASS** | FAIL | n/a | PASS |
| **Verdict** | **SHIP** | reject | reject | reject |

---

# 3 · The script (R-150, R-153, SC-79.1, SC-82.1)

**Exactly four movements. Nothing else.** No greeting, no name, no sign-off, no call to action, no
"in this video". The clip opens on the failure and closes on the rule.

**Target 80.0 s** at 145 wpm · 192 words · inside R-150's 60–90 s band.

Every factual sentence carries its citation in the table. Citations are **spec-side**, not spoken; they render
on the page as the movement rail's hover/focus payload (§5.4) and in the transcript (§5.6).

## 3.1 Movement 1 · HOOK — 0.0 → 12.0 s · 29 words

> A résumé model rewrote one bullet to say "for financial institutions". Every one of those words was already
> somewhere in the candidate's own evidence. The claim was still false.

| Sentence | Source |
|---|---|
| The "for financial institutions" failure, verbatim as the worked example | `Victordtesla24/aether-job-career-agent` @ `main`, `apps/api/app/services/resume_tailor.py:96` — *"a semantic fabrication whose words all appear somewhere in the corpus (e.g. \"for financial institutions\" bled onto an employer the evidence never ties to finance)"* — and `:2663` |
| "the candidate's own evidence" is the only admissible source | same file, `:2559-2562` — *"The anti-fabrication evidence corpus is the candidate's evidence ONLY … The job description is NEVER folded in here"* |

## 3.2 Movement 2 · CRUX — 12.0 → 32.0 s · 49 words

> The word-level guard cannot catch that. It compares the content tokens of a rewrite against the evidence and
> rejects any token with no match. "Financial" and "institutions" both appear — on a different employer's
> bullet. Token grounding sees the words. It cannot see which employer the claim was attached to.

| Sentence | Source |
|---|---|
| What the deterministic guard does, and its exact rejection rule | `resume_tailor.py:140-145` — *"The anti-fabrication check compares content tokens of a rewritten bullet against the source resume … A bullet is rejected iff it contains a content token … with no normalized match in the evidence."* |
| Why it cannot catch this class | `resume_tailor.py:94-99` — *"Deterministic token grounding cannot catch a semantic fabrication whose words all appear somewhere in the corpus"* |
| Scope-of-attribution is the missing axis | `resume_tailor.py:2582-2590` — the context-scoping rationale, *"an extra evidence UNIT … that NAMES a specific employer/program … is context-bound: it may only lend its keywords to bullets in THAT context"* |

## 3.3 Movement 3 · MENTAL MODEL — 32.0 → 60.5 s · 69 words

> So stop asking whether the words are present, and ask whether the claim is entailed — by that bullet's own
> evidence, for that bullet's own employer. A second model reads the original, the rewrite and the scoped
> evidence, and returns one verdict per bullet. Not entailed, and the bullet reverts to what it said before.
> If the verifier itself fails, every changed bullet reverts. An unverified claim is never shipped.

| Sentence | Source |
|---|---|
| The entailment test and its two admissible grounds (a) / (b) | `resume_tailor.py:100-119`, `ENTAILMENT_SYSTEM_PROMPT` — *"ENTAILED only when each of its claims is either: (a) already present in that same bullet's ORIGINAL text, OR (b) DIRECTLY and SPECIFICALLY established by the EVIDENCE for THIS bullet's own employer / engagement / context."* |
| "even if that fact is true for a DIFFERENT employer" | same prompt, `:111-116` |
| One verdict per bullet, batched | `resume_tailor.py:2711-2745`, `_entailment_rejections()`; response contract `:119` — `{"results":[{"ref","entailed","reason"}]}` |
| Not entailed ⇒ revert to original | `resume_tailor.py:2700-2709` — `bullet["text"] = original; result.rejected.append(rewrite); result.changes -= 1` |
| Verifier failure ⇒ revert everything | `resume_tailor.py:2687-2695` — *"if the verifier call itself fails, EVERY changed bullet is reverted — an unverified claim is never shipped"* |

## 3.4 Movement 4 · PAYOFF — 60.5 → 80.0 s · 45 words

> A flag hands the decision to whoever reads it. A revert makes the unsupported version unshippable, and leaves
> the system's worst case as the text it could already prove. That is the rule this page is built on: never
> grade a claim above its evidence.

| Sentence | Source |
|---|---|
| Revert-not-flag as the design property | `resume_tailor.py:2668-2674` + `:6-9` — *"any bullet containing a token absent from the original resume text is rejected (the original bullet is kept instead)"* |
| "never grade a claim above its evidence" as **this site's** rule, not a claim about the repository | `app/data/portfolio/skills.ts:14-17`; `components/marks/Caliper.tsx:18-36`; `app/globals.css:22-28` |

## 3.5 Zero-apology register audit (R-153, R-158, SC-82.1, T-35)

The script contains **zero** instances of: *sorry, apolog\*, just a, only a, I'm not an expert, hopefully,
I tried, admittedly, to be fair, forgive, bear with, disclaimer, I should mention, full disclosure, please
note, unfortunately, I hope this*. It contains no first-person self-introduction, no credential recital and no
request for the viewer's indulgence. It contains **one** first-person-adjacent construction — "this page" —
and it is a statement of the rule, not of the speaker.

**Gate P assertion `TC-REG-01`:** the transcript is matched against the banned-lexeme list in
`tests/e2e/explainer.spec.ts` and must return zero hits. The list is fixed **before** the first render and is
never shortened after a failure (R-159).

**R-158 guard.** Removing apology never removes accuracy. The three accuracy obligations that survive intact:
(a) the production credit (§6.4) is not deleted or softened; (b) nothing in the script, the copy or the frame
implies camera capture; (c) the −38 % keeps its caveat everywhere it appears — the script never says it, and
the Bench's `caveat` string is unchanged.

---

# 4 · Placement and handoff (R-152, step 28)

## 4.1 Where it sits — and where it does not

**It does not return to Listen.** Listen's thesis is the emptiness after the density
(`app/data/portfolio/listen.ts:1-12`); the removed clip's own file argued it belonged there because the front
door would make it an advertisement. The explainer answers that differently: it is not an introduction at all,
so proximity to the thing it teaches wins over proximity to the invitation.

**It sits inside Section 4 — Skills & Certifications**, docked to the Bench's evidence rail, immediately
**after** the Bench and **before** the calibration table's footnotes. This is the strictest available reading
of R-152: the explainer is adjacent to, and hands directly into, the exact node it explains.

**Real-estate discipline (step 28).** At rest the explainer occupies **one 3-row block**: a 3.5rem-tall
still frame, a one-line title, and the movement rail. It never autoplays, never loops, and adds **zero**
network bytes before activation (§5.8). It does not push the Bench below the fold at any breakpoint in §5.2.

## 4.2 The handoff (R-152, SC-81.1)

At `t = 80.0 s` the player emits `explainer:handoff`. The handoff is **deterministic and animation-independent**
— it fires from the `ended` event and also from the "Skip to the node" control, so a viewer who never plays the
clip reaches the identical end state.

Handoff sequence, in order, with fixed numbers:

1. The player collapses to its rest block over `var(--motion-base)` (320 ms), `var(--motion-ease-standard)`.
2. `components/sections/Skills/Bench.tsx` receives `traceCapability('LLM evaluation and guardrails — Langfuse, Phoenix')` — the join key is the **verbatim `capability` string**, per `channel-analysis.md` §8 (*"`skills.ts` capabilities carry no stable `id` field, so the string is the only key available"*). The array index `6` is passed alongside as the documented redundancy.
3. The Bench lights the two wires `independent → capability[6]` and `aether → capability[6]` (`skills.ts:133`), over `var(--motion-cine-in)` (720 ms), `var(--motion-ease-emphasized)`.
4. The traced row renders its **`sourced` caliper** on the mechanism citation (§4.3). This is the **single gold mark in the view**; the Bench's own production dots step down to `--gold-pale` for the duration of the trace, per `design-system-lock.md` §1.3 item 7.
5. Focus moves to the traced row's `<button>`. `scroll-margin-block-start: var(--space-8)`. No scroll under `prefers-reduced-motion: reduce` — the row is focused in place and the wires are drawn already lit.

**Failure mode is specified:** if `traceCapability` cannot resolve the string (a refactor renamed it), the
player renders the handoff as a plain in-page anchor to `#skills` and `TC-XL-01` fails the build. It never
silently no-ops.

## 4.3 The `sourced` caliper — closing defect C-3 honestly

The Bench's traced row gains exactly one new mark:

```tsx
<Caliper state="sourced" label="Measured; source given.">
  <a href="https://github.com/Victordtesla24/aether-job-career-agent/blob/a0197fba84554d5d250d85c746db425a005d397c/apps/api/app/services/resume_tailor.py#L2656-L2709">
    resume_tailor.py:2656–2709
  </a>
</Caliper>
```

The permalink is **pinned to blob sha `a0197fba84554d5d250d85c746db425a005d397c`**, not to `main`, so the line
range cannot drift out from under the claim.

**What is graded, and what is not.** The `sourced` state attaches to **the existence and behaviour of the
mechanism** — which a reader opens and reads. It does **not** attach to the −38 %, which stays
`self-reported` with its `caveat` string unchanged, in the same row, one line below. C-3 is closed by adding a
claim whose evidence genuinely reaches that grade, never by promoting one that does not.

---

# 5 · The build — exact files, types, geometry, tests

## 5.1 Files

### Create

| Path | Purpose |
|---|---|
| `/root/forgotten-mistory/app/data/portfolio/explainer.ts` | The canonical dataset for this artefact: movements, cue timings, citations, transcript, credit, asset paths. **No copy lives in a component.** |
| `/root/forgotten-mistory/components/sections/Skills/Explainer.tsx` | The facade player + movement rail. `'use client'`. |
| `/root/forgotten-mistory/components/sections/Skills/Explainer.module.css` | Its only stylesheet. |
| `/root/forgotten-mistory/public/assets/explainer/entailment-guard.mp4` | H.264 High, 1920×1080, yuv420p, AAC-LC 128 kbps 48 kHz, `+faststart`. **Hard cap 3.5 MB** (§5.7). |
| `/root/forgotten-mistory/public/assets/explainer/entailment-guard.vtt` | Captions; **the single source of the four cue boundaries** in §3. |
| `/root/forgotten-mistory/public/assets/explainer/poster.jpg` | 1280×720, progressive, **≤ 90 KB**. |
| `/root/forgotten-mistory/docs/delivery/evidence/v6-20260903T195241Z/explainer-generation-records.json` | R-143 records (§7.4). |
| `/root/forgotten-mistory/docs/delivery/evidence/v6-20260903T195241Z/explainer-spend-ledger.md` | R-160 ledger (§7.5). |
| `/root/forgotten-mistory/docs/delivery/evidence/v6-20260903T195241Z/explainer-dossier.md` | R-112 dossier (§8). |
| `/root/forgotten-mistory/tests/e2e/explainer.spec.ts` | TC-EXP-*, TC-REG-*, TC-XL-*. |
| `/root/forgotten-mistory/tests/a11y/explainer.a11y.spec.ts` | TC-A11Y-EXP-*. |
| `/root/forgotten-mistory/tests/comprehension/T34-protocol.md` | The pre-registered comprehension protocol (§9). |

### Change

| Path | Change |
|---|---|
| `components/sections/Skills/Skills.tsx` | Mount `<Explainer />` after `<Bench />`; thread `traceCapability` down. |
| `components/sections/Skills/Bench.tsx` | Accept `tracedCapability?: string` and `onTraceResolved(ok: boolean)`; light the two wires; render the `sourced` caliper on the traced row. |
| `components/sections/Skills/Bench.module.css` | Add `[data-traced="true"]` rules; step non-traced production dots to `--gold-pale` while a trace is active. |
| `app/data/portfolio/about.ts` | Add `sourceRef` to the **North Star Align** dimension (§6.1). No prose change. |
| `app/data/portfolio/skills.ts` | Add `mechanismSource?: MechanismSource` to `Capability`; populate on index 6 only. **`evidence`, `status` and `caveat` are unchanged.** |
| `app/globals.css` | Add the type-scale and space tokens this component consumes (`design-system-lock.md` §2.2, §3.3) if the design-system swarm has not landed them first. |
| `scripts/validate/overhaul_static_audit.mjs` | Re-point the on-demand asset class (§5.7). |

## 5.2 Types — exact

```ts
// app/data/portfolio/explainer.ts

/** A place a spoken sentence can be checked. Three kinds, because a reader
 *  checks each one differently — this mirrors skills.ts `SourceKind`. */
export type CitationKind = 'repository-line' | 'cv-page' | 'video' | 'site-file';

export interface Citation {
  kind: CitationKind;
  /** Human label rendered in mono, e.g. `resume_tailor.py:2656–2709`. */
  label: string;
  /** Resolvable URL. For `repository-line`, ALWAYS a blob-sha permalink. */
  href: string;
  /** The blob sha the permalink is pinned to. Required when kind === 'repository-line'. */
  pinnedSha?: string;
  /** Verbatim quotation from the source. Never paraphrased. */
  quote: string;
}

export type MovementId = 'hook' | 'crux' | 'model' | 'payoff';

export interface Movement {
  id: MovementId;
  /** Rail label. Two words maximum. */
  label: string;
  /** Cue boundaries in seconds. MUST equal the VTT cue boundaries — asserted by TC-EXP-03. */
  start: number;
  end: number;
  /** The spoken words, verbatim, as one string per sentence. */
  lines: readonly string[];
  /** Citations for this movement, in the order the sentences occur. */
  citations: readonly Citation[];
}

export interface MechanismSource {
  /** The capability string this mechanism belongs to — the join key. */
  capability: string;
  citation: Citation;
  /** The caliper state this evidence earns. Only ever 'sourced' here; a
   *  mechanism you cannot open does not get a MechanismSource at all. */
  caliper: 'sourced';
}

export interface ExplainerContent {
  /** Rest-state title. One line, no verb phrase that sounds like a promise. */
  title: string;
  /** The concept, in one sentence, for the 3-second read (R-99). */
  headline: string;
  /** The takeaway line, authored prose in the site's voice (R-99). */
  takeaway: string;
  durationSeconds: 80;
  movements: readonly [Movement, Movement, Movement, Movement]; // exactly four (R-150)
  /** The handoff target — the verbatim skills.ts capability string. */
  handoff: { capability: string; indexHint: number };
  /** R-154/R-157. Exactly one sentence. Rendered once, in one place. */
  productionCredit: string;
  poster: '/assets/explainer/poster.jpg';
  video: '/assets/explainer/entailment-guard.mp4';
  captions: '/assets/explainer/entailment-guard.vtt';
}
```

The `readonly [Movement, Movement, Movement, Movement]` tuple makes "exactly four movements" a **compile-time**
constraint, not a lint rule. A fifth movement does not build.

## 5.3 Geometry — every number fixed

**Rest block.**

| Property | Value |
|---|---|
| Container `max-inline-size` | `min(100%, 44rem)` |
| Still frame | `3.5rem` tall × `6.222rem` wide (16:9), `border-radius: 2px`, `border: 1px solid var(--ink-700)` |
| Gap frame ↔ text | `var(--space-2)` (16px) |
| Title | `var(--fs-small)`, `--white`, `letter-spacing: 0.02em`, `line-height: 1.55` |
| Headline (3-s read) | `var(--fs-caption)`, `--mist-400`, `letter-spacing: 0.06em` |
| Rail height | `2px` at rest, `4px` on hover/focus-within |
| Rail width | 100% of container |
| Block ↔ Bench gap | `var(--space-6)` (48px) |
| Rest block total height | `7.5rem` at ≥768px, `9rem` below — **reserved at layout time**, so activation causes zero CLS |

**Active (expanded) player.**

| Property | Value |
|---|---|
| Frame | `aspect-ratio: 16 / 9`, `inline-size: min(100%, 44rem)`, `border: 1px solid var(--ink-700)`, `border-radius: 2px` |
| Expand transition | `max-block-size` is **not** animated (layout-triggering). The frame is `position: relative` with a `transform: scaleY()` reveal on an overlay, `var(--motion-emphatic)` (440 ms), `var(--motion-ease-emphasized)`; the video element fades `opacity 0→1` over `var(--motion-base)` (320 ms), `var(--motion-ease-standard)` |
| Collapse | `var(--motion-base)` (320 ms), `var(--motion-ease-exit)` |

**Movement rail — the data mark.**

| Property | Value |
|---|---|
| Geometry | four `<button>` segments in a flex row; each segment's `flex-grow` = its real duration in seconds, read from `explainerContent.movements[].{start,end}` |
| Widths (derived, not typed) | hook 12.0 s → 15.00 % · crux 20.0 s → 25.00 % · model 28.5 s → 35.625 % · payoff 19.5 s → 24.375 % |
| Segment separator | `1px` gap, `background: var(--ink-900)` |
| Segment fill, unplayed | `var(--ink-700)` |
| Segment fill, played | `var(--mist-400)` |
| Playhead | `1px` vertical rule, `var(--white)`, `transform: translateX()` only, driven by `requestAnimationFrame` off `video.currentTime` |
| Segment hover / focus | height `2px → 4px` over `var(--motion-fast)` (200 ms), `var(--motion-ease-chrome)`; `color` and `border-color` transitions **survive** reduced motion per `design-system-lock.md` §4.3 rule 3 |
| Focus ring | `outline: 2px solid var(--white); outline-offset: 2px` — the site's existing state library |
| Minimum target | `44 × 44 px` hit area via `::before` inset expansion; the visual rail stays 2–4 px |

**Typography of the citation payload.** Citation `label` renders in **IBM Plex Mono** at
`var(--fs-caption)` with `+0.02em` tracking and `font-variant-numeric: tabular-nums` — mono is the data
instrument (D-02), and a `file:line` reference is provenance, not prose. Citation `quote` renders in **Inter**
at `var(--fs-small)`, `--mist-200`, `max-inline-size: var(--measure-read)`.

**The one gold mark.** In the explainer's own view the single gold mark is the `sourced` caliper on the
mechanism permalink in the crux/model citation panel, rendered as an **inline link** — a permitted geometry
under `design-system-lock.md` §1.4 rule 2. Gold on `--ink-900` = **8.62:1**. Nothing else in this component
may be gold: no play glyph, no playhead, no rail segment, no progress fill, no "live" dot. `TC-NFR-MONO`
already fails a raw hex; `TC-EXP-09` additionally fails **more than one** element resolving to a gold token
inside `[data-component="explainer"]`.

## 5.4 Interaction depth (R-97) — four, named

| R-97 clause | Implementation |
|---|---|
| **Hover reveal** | Hovering a rail segment reveals that movement's citation list beneath the rail: `label` (mono, linked) + `quote` (verbatim). No layout shift — the panel is a fixed-height `4.5rem` region reserved at rest and empty. |
| **Focus and zoom** | Each segment is a real `<button>`. `Tab` traverses hook → crux → model → payoff. `Enter`/`Space` seeks playback to `movement.start` and expands that segment to `flex-grow: 2×` its share, redistributing the other three proportionally, over `var(--motion-base)`. `Escape` restores. |
| **Filtering / drill-down** | A `Citations only` toggle (`<button aria-pressed>`) collapses the transcript to just its cited sentences, each with its source line and verbatim quote. Persisted per viewer in `localStorage` key `fm.explainer.citationsOnly`, wrapped in `try/catch`, defaulting to `false` when storage throws. |
| **Curiosity-rewarding state** | **The two-verdict overlay.** Pressing `S` (or activating `Show both verdicts`) draws, beside the worked example sentence, the **deterministic token guard's** verdict (`PASS — every content token has a match`) and the **entailment verifier's** verdict (`NOT ENTAILED — "financial institutions" is established for a different employer`) as two rows sharing one baseline. It is the concept made operable in one glance, it is drawn from `resume_tailor.py:140-145` and `:100-119`, and it appears nowhere else on the site. |

## 5.5 Accessibility (R-101, SC-…, T-7, T-23)

**Keyboard traversal.** Rest block → play/expand button → four rail segments → `Citations only` → `Show both
verdicts` → `Skip to the node` → native video controls. No focus trap; `Escape` collapses the player and
returns focus to the play button.

**ARIA structure.**
```
<section data-component="explainer" aria-labelledby="explainer-title">
  <h3 id="explainer-title">…title…</h3>
  <p id="explainer-headline">…headline…</p>          <!-- the 3-second read -->
  <div role="group" aria-labelledby="explainer-rail-label">
    <span id="explainer-rail-label" class="visually-hidden">Four movements, drawn to their real durations</span>
    <button aria-describedby="explainer-cite-hook" …>Hook · 12 seconds</button>
    …
  </div>
  <div id="explainer-transcript" role="region" aria-label="Transcript with sources">…</div>
</section>
```
The video carries `<track kind="captions" srclang="en" default>` from the VTT.

**Insight-equivalent text alternative (R-101, and the hard one).** The alternative is **not** "a video about
entailment". It is the concept, in text, sufficient to pass §9's comprehension test **without playback**:
the four movements' `lines` rendered in order as prose, each followed by its citations, plus the two-verdict
overlay rendered as a two-row `<table>` with a `<caption>`. `TC-A11Y-EXP-04` asserts that with JavaScript
disabled the transcript, the citations and the two-verdict table are all present in the server-rendered HTML.

**Reduced motion — a beautiful composition, not an absence** (`design-system-lock.md` §4.3):
- The rail renders **already drawn**, all four segments at their real proportions, in `--mist-400` at
  `opacity: 0.45` with the current movement at `1.0` — the proportions are information and must be
  instantly true.
- Movements reveal by **sequenced opacity** with `--stagger-tight` (60 ms), no translation.
- `color` and `border-color` transitions **survive** at `var(--motion-fast)`.
- The playhead does not sweep; it **steps** to each cue boundary on `cuechange`.
- The handoff does not scroll: the Bench row is focused in place with its wires already lit.

## 5.6 Dual read (R-99, T-20)

| Read | Delivered by |
|---|---|
| **3-second headline** | `explainerContent.headline` — *"Word-level grounding passes a claim that is attached to the wrong employer."* Legible from the rest block with no interaction and no playback. |
| **30-second detail** | The movement rail with all four `label`s and durations, plus the two-verdict overlay's two rows and their units — the specific mechanism, the specific example, and the file:line each came from. |
| **One-line takeaway** | `explainerContent.takeaway` — ***"A warning moves the decision to a reader; a revert makes the unsupported version unshippable."*** Authored prose in the site's voice, falsifiable against `resume_tailor.py:2700-2709`. |

## 5.7 Performance (R-100, T-22)

| Clause | Budget |
|---|---|
| Frame rate | **60 fps** with the player, the rail, the playhead and the Bench trace all active, mid-tier mobile |
| Layout | `transform` and `opacity` only; the playhead is `translateX`; the rail uses `flex-grow` transitions **only** inside the focus-zoom, which is off the compositor path and therefore capped to the four 2–4 px segments |
| Lazy init | Nothing beyond the poster is fetched before activation. `<video>` is **not in the DOM** at rest; it mounts on activation with `preload="auto"` |
| **Declared memory ceiling** | **≤ 26 MB** for the explainer subtree with the clip decoding (1080p H.264 decode surface + poster + rail), measured by `performance.measureUserAgentSpecificMemory()` where available and by a heap-snapshot delta otherwise |
| Disposal | On collapse: `video.pause()`, `video.removeAttribute('src')`, `video.load()`, element unmounted, RAF cancelled, `cuechange` and `ended` listeners removed |
| WebGL | **None.** The explainer adds zero WebGL contexts; Section 4's single context budget is untouched |
| Low-power path | The rest block **is** the low-power composition: poster still + real-proportion rail + headline + takeaway + full transcript. It carries the whole concept and passes §9's test on its own |
| Page budget | LCP **< 2.0 s**, CLS **< 0.05** on 4G mobile. The rest block's height is reserved, so activation contributes **0.000** to CLS — asserted by `TC-EXP-08` |

**Asset gate.** `scripts/validate/overhaul_static_audit.mjs:161-172`: replace the predicate
`/(^|\/)assets\/avatar\//` with `/(^|\/)assets\/explainer\//` and **tighten** `ON_DEMAND_VIDEO` from
`5 * 1024 * 1024` to `3.5 * 1024 * 1024`. The 12-line justification comment is rewritten for the new subject.
The poster falls under the existing `IMG` cap of 500 KB and is additionally held to **90 KB** by
`TC-EXP-07`.

## 5.8 Tests — every one can fail (R-159, R-163)

`tests/e2e/explainer.spec.ts`

| Id | Assertion |
|---|---|
| `TC-EXP-01` | The rest block renders `title`, `headline`, the four rail segments and `takeaway` **with JavaScript disabled**. |
| `TC-EXP-02` | At rest, `#skills video` count is `0` and the network log contains **zero** requests to `/assets/explainer/entailment-guard.mp4`. |
| `TC-EXP-03` | The four `movements[].{start,end}` **exactly** equal the four cue boundaries parsed from `entailment-guard.vtt`. Drift fails the build. |
| `TC-EXP-04` | `movements.length === 4`, and the concatenated `lines` contain no sentence absent from the transcript rendered in the DOM. |
| `TC-EXP-05` | Every `Citation.href` returns HTTP 200; every `repository-line` citation's `href` contains its `pinnedSha`. |
| `TC-EXP-06` | Each rail segment's rendered width, as a fraction of the rail, equals its duration fraction to **±0.5 pp**. (An honest axis: the rail is a duration scale and may not be truncated — `encoding-grammar.md` §2.2.) |
| `TC-EXP-07` | `poster.jpg` ≤ 90 KB; `entailment-guard.mp4` ≤ 3.5 MB; the mp4 reports 1920×1080 and `moov` before `mdat`. |
| `TC-EXP-08` | Activating the player produces a cumulative layout shift of `0.000` in the section. |
| `TC-EXP-09` | Inside `[data-component="explainer"]`, **exactly one** element resolves to a gold token; it is an `<a>`; it sits inside a `Caliper` with `data-state="sourced"`. |
| `TC-EXP-10` | The clip's total duration is within `60 ≤ d ≤ 90` seconds and within ±1.0 s of `durationSeconds`. |
| `TC-REG-01` | Zero banned-lexeme hits across `title`, `headline`, `takeaway`, all `lines`, and `productionCredit` (§3.5). |
| `TC-REG-02` | `productionCredit` appears **exactly once** in the shipped HTML, and there is no `role="dialog"`, `role="alert"`, `role="tooltip"`, `title=` attribute, `<abbr>`, `<sup>`, `⚠`, `ⓘ` or `*` anywhere in the explainer subtree (R-157). |
| `TC-XL-01` | `explainerContent.handoff.capability` matches a `capabilities[].capability` string exactly; the resolved index is `6`. |
| `TC-XL-02` | After `ended` (and, separately, after `Skip to the node`), the Bench row for that capability has `data-traced="true"`, both source wires are lit, and focus is on that row's button. |
| `TC-XL-03` | The About **North Star Align** dimension links to the explainer, and the explainer links back. Both resolve. |
| `TC-XL-04` | The channel communication-evidence panel's explainer edge renders, and its label makes **no** claim about spoken delivery being corroborated by the channel (§6.3). |

`tests/a11y/explainer.a11y.spec.ts`

| Id | Assertion |
|---|---|
| `TC-A11Y-EXP-01` | axe, WCAG 2.2 AA tags, zero violations on the section at rest and expanded. |
| `TC-A11Y-EXP-02` | Full keyboard traversal in the §5.5 order; `Escape` collapses and restores focus; no trap. |
| `TC-A11Y-EXP-03` | Under `prefers-reduced-motion: reduce`: every rail segment is at its final width on first paint; no element's `transform` differs from `none` during entrance; a staggered opacity sequence is observable; the playhead steps rather than sweeps. |
| `TC-A11Y-EXP-04` | With JavaScript disabled, the transcript, every citation and the two-verdict table are present in the HTML. |
| `TC-A11Y-EXP-05` | Every rail segment's hit area is ≥ 44 × 44 CSS px. |

---

# 6 · Cross-links (R-156, SC-81.1)

Three links out, three links back. Every one resolves, and `TC-XL-03`/`TC-XL-04` fail the build if not.

## 6.1 → About Me · the **North Star Align** dimension

`app/data/portfolio/about.ts:103-107` reads, verbatim: *"Build systems whose claims can be checked. Everything
I ship is designed to refuse to fabricate its own evidence, and to say so when it cannot measure something."*
with `evidence: 'aether-job-career-agent · unmeasured signals read "not measured", never zero'`.

The explainer **is the mechanism behind that sentence.** Add to that dimension only:

```ts
sourceRef: {
  label: 'the mechanism',
  href: '#explainer',
  citation: { kind: 'repository-line', label: 'resume_tailor.py:2656–2709',
              pinnedSha: 'a0197fba84554d5d250d85c746db425a005d397c', … },
}
```

**No prose changes.** The dimension's answer already says the true thing; it gains a way to check it.
`channel-analysis.md` §8 independently ranks North Star Align the **strongest** corroborated dimension, which
is why it takes this edge rather than Career Growth. Career Growth (`about.ts:88-94`) already carries
`'Langfuse + Phoenix evaluation stack · −38% simulated error-budget breaches'` and is **left untouched** —
one edge, not two, so the link means something.

## 6.2 → Skills · the node

`capabilities[6]`, `LLM evaluation and guardrails — Langfuse, Phoenix`. This is the handoff target (§4.2) and
the site of the `sourced` caliper (§4.3). The `evidence` string, the `non-production` status and the
`caveat` are all **unchanged** — the explainer adds provenance, never grade.

## 6.3 → the channel communication-evidence model

`channel-analysis.md` §7 proves nine things about **how he constructs a written explanation** — analogy from
the audience's own domain first, cross-domain translation at the level of mechanism, naming the audience
inside the artefact, decomposition into numbered parts, a contract before the content — and explicitly rules
**not proven**: *"Spoken clarity, pacing, accent, filler rate, ability to hold a listener"*, because 0 of 11
records yielded transcript text.

The edge is therefore drawn in the honest direction, and its rendered label is fixed:

> **"The channel shows how he builds an explanation in writing. This is the first one you can hear."**

The explainer's structure is a **direct instance** of the proven pattern — hook = the contract before the
content (§7 item 5), crux = cross-domain translation at the level of mechanism (item 2), payoff = *"he states
the reframe he wants you to leave with, as an instruction"* (item 7). The panel names those three technique
edges and links each to the record that proves it (`gMe4FZbjcQE`, `Q1NwbcHbAh0`, `c_M_LSB65RA`).

**What the panel must never say**, and `TC-XL-04` enforces: that the channel corroborates his spoken
delivery. It does not; this clip is the first observable evidence of it, and the panel says exactly that.

## 6.4 The production credit (R-154, R-157, R-158, SC-83.1)

**Rendered once, in one place:** directly beneath the player frame, above the movement rail, inside the
explainer's own `<figcaption>`. **Never** in a modal, banner, badge, overlay, tooltip, `title=` attribute,
asterisk, footnote or warning icon. No adjacent pre-emptive language: no sentence before or after it prepares
the reader for it, excuses it, or explains why it is there.

**Treatment.** `var(--fs-caption)` · `--mist-400` · `letter-spacing: 0.06em` · `line-height: 1.5` · Inter ·
no italics · no rule above or below · `margin-block-start: var(--space-2)`. Model identifiers inside the
sentence render in **IBM Plex Mono** at the same step, because an identifier is data. This is the same
treatment a film gives a cinematographer: a line of authorship, in the work's own typeface, once.

**The exact sentence — branch A**, and the one that ships **if and only if** the ElevenLabs voice is verified
live per §7.3:

> **Vikram Deshpande wrote this and lent it his photograph and his cloned voice; `heygen/avatar-iv` rendered the likeness, `ElevenLabs` the voice.**

**The exact sentence — branch B**, which ships if the ElevenLabs voice cannot be verified:

> **Vikram Deshpande wrote this and lent it his photograph; `heygen/avatar-iv` rendered the likeness and spoke it in a synthetic voice that is not his.**

**Why two sentences and not one.** §7.3 establishes that the stored `ELEVENLABS_API_KEY` is currently an API
key **ID**, not a key, and the voice endpoint returns HTTP 400. R-158 is absolute: removing apology never
removes accuracy, and nothing may imply a provenance that is not true. Branch B is not an apology — it is a
credit that names what actually happened. **Gate P blocks the deploy until the branch is chosen against a live
verification result, and `TC-REG-03` asserts that the shipped string is byte-identical to the branch the
verification record selected.**

Both branches name **likeness, voice and pipeline**, exactly once, as required by R-157. Neither implies
camera capture; the verb is *rendered*, never *filmed*, *shot* or *recorded*.

---

# 7 · The generation ladder (R-139 … R-146, Gate O, T-32)

## 7.1 Model verification — live, and the truth is recorded

Verified **2026-09-03** against the account that serves this site (the `OPENROUTER_API_KEY` Firebase secret
used by `functions/index.js:20,149`; `GET /api/v1/key` → HTTP 200, `is_free_tier: false`, lifetime usage
$469.23).

**A trap worth recording.** `GET /api/v1/models` (425 entries) returns **none** of the seven ids, and a
partial-string search over it for `heygen`, `veo`, `seedance`, `wan`, `hailuo`, `alibaba` and `avatar`
returns **no match**. That endpoint lists chat models only. An implementer who stops there will wrongly
conclude the seven models do not exist. **They do.** They are served by a separate catalogue,
`GET /api/v1/videos/models` (28 entries), and a `chat/completions` call to any of them returns a precise
HTTP 400: *"`<id>` is a video generation model and cannot be used with the chat/completions endpoint. Use the
`/api/v1/videos` endpoint instead."*

**All seven named in R-140 exist and are callable with this account.** No substitutions were made and none
are needed.

| R-140 model id | Exists | Canonical slug | Max res | Aspect ratios | Durations (s) | Audio | Seed | Price (live `pricing_skus`) |
|---|---|---|---|---|---|---|---|---|
| `google/veo-3.1-lite` | **YES** | `google/veo-3.1-lite-20260331` | 1080p | 16:9, 9:16 | 4, 6, 8 | yes | **yes** | $0.08/s 1080p+audio · $0.05/s 1080p no-audio · $0.05/s 720p+audio · $0.03/s 720p no-audio |
| `bytedance/seedance-2.0-mini` | **YES** | `…-20260811` | 720p | 7 ratios | 4–15 | yes | **yes** | **token-priced**: $0.0000035/video-token; $0.0000021 with video input |
| `alibaba/wan-3.0` | **YES** | `…-20260824` | 1080p | 5 ratios | 2–30 | yes | **yes** | $0.05/s 480p · $0.10/s 720p · $0.20/s 1080p |
| `heygen/avatar-iv` | **YES** | `heygen/avatar-iv-20260625` | 1080p | 16:9, 9:16, 1:1 | **null** — length is set by the script/audio | **no** (`generate_audio:false`; voice arrives as input) | **NO** | **$0.05/s** |
| `bytedance/seedance-2.5` | **YES** | `…-20260807` | 720p | 6 ratios | 4–30 | yes | **yes** | **token-priced**: $0.0000107/video-token; $0.0000064 with video input |
| `alibaba/wan-3.0-prime` | **YES** | `…-20260827` | 1080p | 5 ratios | 2–30 | yes | **yes** | $0.068/s 480p · $0.14/s 720p · $0.28/s 1080p |
| `minimax/hailuo-3-max` | **YES** | `…-20260901` | **768p** | 6 ratios | 5–15 | **no** | **NO** | $0.05/s 480p · $0.08/s 768p |

**Three consequences that change the build, not the model list.**

1. **No 4K/8K exists on this ladder** (correction 0-B). Ceiling 1080p; `hailuo-3-max` 768p; both Seedance
   rungs 720p.
2. **`heygen/avatar-iv` and `minimax/hailuo-3-max` do not accept a seed.** R-143 requires a seed in every
   generation record. Those two records carry `"seed": null` with
   `"seedUnsupported": true, "seedUnsupportedEvidence": "GET /api/v1/videos/models → seed:false"`. **A null is
   never written where a value was obtainable**, and the reason travels with it — the same discipline the
   caliper's `open` state encodes.
3. **The two Seedance rungs are token-priced and the catalogue publishes no seconds-to-tokens conversion.**
   Their cost is therefore **not predictable** from duration. Their ceiling is enforced by a hard per-rung
   spend cap read from the completed job (§7.5), never by a projected figure. Publishing a projected figure
   for them would be exactly the unsourced number this site refuses.

## 7.2 The verified `POST /api/v1/videos` contract

Established by live probes against the same account.

```jsonc
{
  "model": "<one of the seven>",
  "prompt": "<required for every model except when avatar-iv is given audio>",
  "duration": 8,                 // must be a member of supported_durations
  "resolution": "1080p",
  "aspect_ratio": "16:9",
  "generate_audio": false,
  "seed": 20260903,              // omitted for avatar-iv and hailuo-3-max
  // Reference images — guidance, not exact frames:
  "input_references": [
    { "type": "image_url", "image_url": { "url": "https://…" } },
    { "type": "audio_url", "audio_url": { "url": "https://…" } }
  ],
  // Exact frame control — NOT supported by avatar-iv:
  "frame_images": [
    { "type": "image_url", "image_url": { "url": "https://…" }, "frame_type": "first_frame" }
  ]
}
```

Verified facts an implementer will otherwise lose a day to:

- `input_references[].type` discriminator accepts exactly **`image_url` | `audio_url` | `video_url`**.
  `input_audio` and `audio` are rejected by Zod.
- `frame_images[].frame_type` accepts exactly **`first_frame` | `last_frame`**, and
  `heygen/avatar-iv` **rejects both**: *"the provider integration for model \"heygen/avatar-iv\" does not
  support first_frame frame_images"*. Avatar-IV's likeness therefore arrives as an
  `input_references` **`image_url`**, never as a frame image.
- `heygen/avatar-iv` with an image but nothing else returns
  *"avatar-iv requires a prompt (script) or an audio input reference"* — so the voice arrives **either** as
  `prompt` + the `voice_id` passthrough **or** as an `audio_url` reference.
- Its upstream is HeyGen and it fetches URLs itself: *"Invalid URL in files[0]: URL must point to a public
  host."* Reference assets must be publicly reachable at generation time.
- Unknown top-level keys are **silently stripped** by the schema, so a mis-named field produces the same
  error as a missing one. Do not brute-force key names; use the four above.
- Response is `202` with `{ id, generation_id, polling_url, status }`. Poll `GET /api/v1/videos/{id}`.
  `DELETE` is **404 — a submitted job cannot be cancelled.**
- Passthrough for `heygen/avatar-iv`: `voice_id`, `voice_settings`, `motion_prompt`, `expressiveness`, `fit`,
  `remove_background`, `background`, `caption`, `title`.

> **`POST /api/v1/videos` starts a real, billable job that cannot be cancelled.** Every call in this ladder is
> made by `scripts/generate/explainer_ladder.mjs` behind an explicit `--confirm` flag, and every call writes
> its record **before** it is made and updates it on completion.

## 7.3 The voice — an unresolved dependency, stated plainly

R-29 and the branch-A credit both require **the owner's own cloned ElevenLabs voice**.

**Verified 2026-09-03:** the Firebase secret `ELEVENLABS_API_KEY` (version 1, ENABLED, consumed by
`functions/index.js:19,74`) is **an API key ID, not an API key**. Both
`GET https://api.elevenlabs.io/v1/voices/0ZJ4kFDo6bZUNQsuULOW` and `GET /v1/user` return **HTTP 400**:
`{"type":"authentication_error","code":"invalid_api_key","status":"api_key_id_used_as_api_key","message":"API key ID used as API key - only valid API keys can be used. API keys start with 'sk_'…"}`.

**This is also the root cause of defect C-7** (`/api/tts` deployed and 502-ing on an ElevenLabs upstream 400).
It is recorded here because it is the same secret; its repair is C-7's work item, not this spec's.

**Consequences, in order:**

1. **The cloned voice cannot be produced or verified today.** Voice id `0ZJ4kFDo6bZUNQsuULOW` is asserted by
   `functions/index.js:26` and is **not observable** with the stored credential. This spec does not assert it
   is his voice, and does not assert it is not.
2. **Gate P blocks on a live verification**, `TC-VOICE-01`: `GET /v1/voices/0ZJ4kFDo6bZUNQsuULOW` returns
   HTTP 200 and `category` indicates a cloned voice. Its recorded result — not an assumption — selects the
   credit branch in §6.4.
3. **Branch A path**: render the 80 s track from the script via ElevenLabs, publish it at a public HTTPS URL,
   and pass it to `heygen/avatar-iv` as an `input_references` `audio_url`. Lip-sync then follows his own
   voice.
4. **Branch B path**: pass the script as `prompt` with a HeyGen `voice_id` passthrough. The credit says so.
   **Under no circumstance does branch B ship branch A's sentence.**

## 7.4 Generation-record schema (R-143)

Written to `docs/delivery/evidence/v6-20260903T195241Z/explainer-generation-records.json`. One record per
submitted job — **including failures and rejected takes** (R-144).

```jsonc
{
  "schemaVersion": "explainer-gen-1",
  "runId": "v6-20260903T195241Z",
  "records": [{
    "recordId": "EXP-R4-T02",
    "rung": 4,
    "rungName": "presenter",
    "role": "heygen/avatar-iv → the talking-head presenter (R-140)",
    "modelId": "heygen/avatar-iv",
    "canonicalSlug": "heygen/avatar-iv-20260625",
    "endpoint": "POST https://openrouter.ai/api/v1/videos",
    "submittedAt": "<ISO-8601 UTC>",
    "requestBody": { /* the FULL body, verbatim, secrets redacted to null */ },
    "prompt": "<the full prompt string, verbatim — never truncated>",
    "seed": null,
    "seedUnsupported": true,
    "seedUnsupportedEvidence": "GET /api/v1/videos/models → heygen/avatar-iv.seed === false",
    "parameters": { "resolution": "1080p", "aspect_ratio": "16:9", "duration": null,
                    "generate_audio": false, "passthrough": { "voice_id": "…", "expressiveness": 0.5 } },
    "jobId": "<OpenRouter job id>",
    "generationId": "<gen-vid-…>",
    "pollCount": 0,
    "renderDurationSeconds": 0.0,      // submittedAt → terminal status, measured
    "status": "completed | failed | rejected",
    "failureReason": null,             // verbatim upstream error when status !== completed
    "rejectionReason": null,           // R-144: why a completed take was not shipped
    "escalatedTo": null,               // R-144: the rung escalated to, and why
    "outputUrl": null,
    "outputBytes": 0,
    "outputHash": { "algo": "sha256", "value": "<hex>" },
    "actualCostUsd": 0.0,              // read from the completed job / key usage delta. NEVER estimated.
    "costSource": "openrouter:/api/v1/key usage delta, measured before and after",
    "shipped": false
  }]
}
```

**Rules.** `actualCostUsd` is **measured**, never estimated — if the API returns no cost for a job, the field
is `null` with `costSource: "not returned by the API"`, and the ledger's total carries an `open` bracket for
that row. `prompt` is stored in full, never truncated. `outputHash` is computed over the downloaded bytes.
A record is written **before** submission and updated in place; a submitted job with no record is a Gate O
failure.

**Record EXP-R0-T00 (already written, and honest).** During this spec's verification of the endpoint contract
a request was submitted to `google/veo-3.1-lite` with `prompt: "x"` — job `u63tYUYq2NGXm8QbMVEY`,
generation `gen-vid-1788467817-r4NMwiG0OVJcQCoZkZ9X`, submitted 2026-09-03. It could not be cancelled
(`DELETE` → 404) and terminated `failed` — *"Video generation completed with no output (content may have been
filtered)"*. **Measured cost: $0.00** (`usage_daily` 0.00133413 before and after; `GET /api/v1/generation` →
404, no billable generation). It appears in the ledger as row 0 with `shipped: false`, because a spend ledger
that omits the spender's own mistakes is not a ledger.

## 7.5 The ladder, the estimates, and the ceiling (R-141, R-142, R-160)

**R-141 is executed literally: nothing final ships from a discounted tier, and nothing is promoted until it is
approved on one.** R-142: the discount changes where iteration happens, never what is acceptable.

| Rung | Model | Role (R-140) | Shot budget | Predicted cost | Basis |
|---|---|---|---|---|---|
| 1 · previz | `google/veo-3.1-lite` | storyboard motion, blocking, shot length, pacing | 3 takes × 8 s, 720p, no audio | **$0.72** | 24 s × $0.03/s |
| 2 · iterate | `bytedance/seedance-2.0-mini` | every framing test, timing pass, transition trial | ≤ 12 takes, 720p | **cap $6.00** | token-priced; **no per-second figure exists** |
| 3 · bulk | `alibaba/wan-3.0` | supporting/ambient motion behind the citation panel | ≤ 6 takes × 10 s, 480p | **$3.00** | 60 s × $0.05/s |
| 4 · presenter | `heygen/avatar-iv` | the talking head, likeness, lip-sync, identity anchor | 4 takes × 80 s, 1080p | **$16.00** | 320 s × $0.05/s |
| 5 · inserts | `bytedance/seedance-2.5` | shipped cinematic inserts and section transitions | ≤ 5 takes, 720p | **cap $8.00** | token-priced |
| 6 · technical | `alibaba/wan-3.0-prime` | the two-verdict animation accompanying the visualisation | 3 inserts × 6 s, 1080p | **$5.04** | 18 s × $0.28/s |
| 7 · hero | `minimax/hailuo-3-max` | the single site-defining opening shot | 2 takes × 8 s, 768p | **$1.28** | 16 s × $0.08/s |
| | | | **Predicted total** | **$40.04** | |

**Hard spend ceiling: $60.00 USD**, enforced in three places:

1. `scripts/generate/explainer_ladder.mjs` reads `GET /api/v1/key` **before every submission** and refuses to
   submit when `usage − runStartUsage ≥ 60.00`.
2. A per-rung cap: rung 2 stops at $6.00, rung 5 at $8.00, no rung exceeds 150 % of its predicted figure.
3. Gate O fails if `explainer-spend-ledger.md`'s measured total exceeds $60.00, **or** if any record's
   `actualCostUsd` is an estimate rather than a measurement.

**R-144 · failure and rejection.** A rejected take records `rejectionReason` and, where it caused an
escalation, `escalatedTo` with the reason. **No rejected take ships and no draft-tier render is used as a
final** — `TC-GEN-03` asserts that every asset in `public/assets/explainer/` hashes to a record whose
`rung ∈ {4,5,6,7}` and `shipped: true`.

**R-160 · the ledger is reviewable output.** `explainer-spend-ledger.md` is a reader-facing document in the
site's register: one row per record, columns *rung · model · what it was for · render seconds · measured cost
· shipped?*, a total, and a plain sentence naming what was spent and what it bought — including row 0's $0.00
failure. It is not internal bookkeeping and it is not summarised away.

**R-145 · the ladder as workflow stages.** Seven stages, one per rung, each writing its ledger row at stage
exit. A stage cannot start until the previous stage has an approved take recorded — enforced by
`TC-GEN-02` over the record ordering, not by convention.

**R-146 · same routing for the visualisation's motion.** The two-verdict overlay's animation (§5.4) is a
generated asset and goes through rung 6 (`alibaba/wan-3.0-prime`) like any other technical animation. **R-111
binds absolutely: no model output is ever a quantitative mark.** The overlay's two verdict rows are drawn from
`explainer.ts` data in SVG; only the ambient motion behind them is generated. `TC-GEN-04` asserts no generated
asset is referenced by any element that renders a number.

## 7.6 The upscaler — available, and not used without a decision

`black-forest-labs/flux-video-upscale` exists in the same catalogue (`upscale_factor` 1.5–3.0; 7.5–10.5 ¢ per
megapixel-second). A 3× upscale of the 1080p master would reach 5760×3240 — beyond 4K.

**It is not in R-140, and R-139 permits "only the models named in R-140".** This spec therefore **does not use
it**, ships a 1080p master, and records the option here so the decision is the Owner's and is made in the
open. Reaching step 29's "UHD 4K/8K" requires amending R-140; it cannot be reached by the ladder as written.

---

# 8 · The dossier (R-112, SC-…)

`explainer-dossier.md` ships with the artefact and follows the ten-point structure used by every entry in
`hero-visualisation-register.md`:

1. **What it shows** — the four movements drawn to their real durations, and the two-verdict overlay.
2. **Dataset and provenance** — `app/data/portfolio/explainer.ts`; every citation a resolvable URL; every
   `repository-line` pinned to blob sha `a0197fb…`; the CV figures it deliberately does **not** restate.
3. **Interactions** — the four of §5.4, named against R-97's four clauses.
4. **Demonstrated skill** — AI assurance made teachable: a real failure class, its mechanism, and the design
   property that defeats it, delivered in 80 seconds.
5. **Takeaway line** — §5.6.
6. **Performance measurements** — the §5.7 budgets **and the measured values** from T-22: sustained fps,
   peak subtree memory against the 26 MB ceiling, LCP, CLS, and the transfer bytes of every asset.
7. **Accessible equivalent** — §5.5, with the T-34 result showing the text-only path passes comprehension.
8. **Render class** — HTML/`<video>` + SVG rail. Zero WebGL contexts. Correct under R-109.
9. **Status** — build state and open items.
10. **Preservation obligations** — the `sourced` caliper's pinned permalink, the credit's exact sentence, and
    the caveat that must travel with the −38 % wherever it appears.

---

# 9 · The comprehension test (R-151, T-34, SC-80.1) — pre-registered

**Pre-registered before the first render. R-159 forbids altering, softening, re-scoping or re-recruiting this
test after a failure.** It is recorded verbatim at `tests/comprehension/T34-protocol.md` and its git commit
hash is cited in the Gate P record, so any later edit is visible.

## 9.1 Protocol

- **n = 10** participants: 5 senior technical (engineer / architect / staff+), 5 non-technical hiring-side
  (recruiter / hiring manager / delivery lead). None has read this repository.
- **One viewing.** No pause, no rewind, no transcript, no replay. Playback is observed.
- The two-verdict overlay may be triggered during that single viewing; it is part of the artefact.
- Immediately after: no notes, no re-reading, no access to the page.
- **Arm B (accessibility parity, T-23):** 3 further participants receive **only** the text alternative
  (transcript + citations + two-verdict table, no video). They sit the identical test.

## 9.2 Part 1 — restate

*"In your own words: what was the problem, and what does the fix actually do?"*

Scored against five binary criteria:

| | Criterion |
|---|---|
| **R1** | States that a word-level / token check **passes** the bad claim — that word presence is not the test. |
| **R2** | Names the unit of scope: the claim must be established for **that bullet's own employer / engagement / context**, not merely present somewhere in the evidence. |
| **R3** | States the outcome is a **revert to the original text** — not a warning, flag, deletion, score or human review. *(mandatory)* |
| **R4** | States that a **second model / judge** makes the entailment decision. |
| **R5** | States the fail-safe direction: if the verifier fails, changed text **reverts** (it does not ship). |

## 9.3 Part 2 — apply to a fresh example

The example below appears in **no** frame, caption or transcript of the clip.

> A tailoring model rewrites a bullet for **ANZ Banking Group**.
> **Original:** *"Led migration of 40 services to Azure."*
> **Rewritten:** *"Led migration of 40 services to Azure for a Tier-1 bank under APRA CPS 234."*
> Elsewhere in the same candidate's evidence — on a **different** employer's bullet — the phrase *"APRA CPS
> 234"* appears, and the words *"Tier-1"* and *"bank"* both appear.
>
> **Q1.** What does the deterministic token guard do with this rewrite?
> **Q2.** What does the entailment verifier do, and why?
> **Q3.** What text is actually shipped?

**The correct answer, in full:**

> **A1.** It **passes** it. Every content token in the rewrite — *Tier-1*, *bank*, *APRA*, *CPS*, *234* — has
> a normalised match somewhere in the evidence, and the guard rejects only tokens with **no** match.
> **A2.** It marks it **NOT ENTAILED**. *"APRA CPS 234"* and *"Tier-1 bank"* are established for a **different**
> employer, and the verifier's rule admits a claim only when it is already in that bullet's own original text
> or is directly and specifically established by the evidence **for that bullet's own employer**. The
> prompt says so explicitly: a claim is not entailed *"even if that fact is true for a DIFFERENT employer in
> the evidence, and even if the individual words appear elsewhere in the corpus."* World knowledge — that ANZ
> is in fact a bank — is inadmissible.
> **A3.** The original: **"Led migration of 40 services to Azure."** The bullet reverts, the rewrite is
> recorded in `rejected`, and the change count decrements. *(And if the verifier call itself had failed, this
> bullet would have reverted anyway.)*

**Applied criteria:**

| | Criterion |
|---|---|
| **A1** | Says the token guard **passes** it. |
| **A2** | Says the verifier marks it not entailed, **and** gives the wrong-employer/wrong-context reason. *(mandatory)* |
| **A3** | Gives the shipped text as the **original** sentence. *(mandatory)* |

## 9.4 Pass criterion — fixed

- **An individual passes** iff they score **≥ 4 of 5** on Part 1 **with R3 satisfied**, **and** **3 of 3** on
  Part 2. R3, A2 and A3 are mandatory because they are exactly "restate correctly" and "apply to a fresh
  example".
- **T-34 passes** iff **≥ 8 of 10** participants pass, **with at least 3 of the 5 non-technical participants
  passing** — a concept only engineers can restate is not taught, it is confirmed.
- **Arm B passes** iff **≥ 2 of 3** text-only participants pass. Arm B failing while the main arm passes is a
  **R-101 failure**, not a script failure, and reopens §5.5.
- **Scoring is by two independent raters** against the criteria above, blind to arm; disagreement is resolved
  by a third rater. Rater instructions are in the protocol file.

## 9.5 On failure

R-159 is absolute. **The test is never altered, softened, re-scoped or re-run with different participants.**
A failure reopens the script (§3) and the visual design (§5), a new take is produced through the ladder, and
the **same** test is run with a **fresh** cohort. The failed run stays in the Gate P record with its scores.

---

# 10 · Gate P — the closure list

Gate P passes when **all** of the following hold, each with a recorded verdict and a named accountable owner
(R-163):

| | Requirement | Evidence |
|---|---|---|
| 1 | The removal is deployed and verified in production | `TC-RM-01 … TC-RM-07`, `TC-RM-06` against the live URL |
| 2 | Exactly one explainer ships, corpus-sourced, four movements, zero padding | `TC-EXP-04`, `TC-EXP-10`, the §3 citation tables, the `readonly [M,M,M,M]` tuple |
| 3 | Every factual sentence resolves to a live source | `TC-EXP-05` |
| 4 | Zero apologetic, justifying, defensive or self-diminishing language | `TC-REG-01` (T-35) |
| 5 | Exactly one production credit, rendered as authorship; provenance accurate; nothing implies camera capture | `TC-REG-02`, `TC-REG-03`, `TC-VOICE-01` |
| 6 | The handoff and all three cross-links resolve | `TC-XL-01 … TC-XL-04` |
| 7 | The comprehension test passes, on the pre-registered criteria, both arms | §9, protocol commit hash cited |
| 8 | Every generated asset has a complete record; the ledger is reviewable; spend ≤ $60.00; no estimated costs | `TC-GEN-01 … TC-GEN-04`, Gate O |
| 9 | Exactly one gold mark, on a `sourced` caliper over a sha-pinned permalink | `TC-EXP-09`, `TC-NFR-MONO` |
| 10 | The performance envelope is measured, not asserted | T-22 against §5.7, dossier item 6 |
| 11 | Accessibility, including the beautiful reduced-motion composition | `TC-A11Y-EXP-01 … 05` |
| 12 | Correction 0-A and correction 0-B are on the record | this document + `AUDIT-RECONCILIATION.md` row A-1 |

**Gate P cannot pass while §7.3's voice verification is unresolved** — the credit branch is undecided until
`TC-VOICE-01` has a recorded result, and shipping either sentence without it would be a claim graded above
its evidence.
