# LISTEN-FLAGSHIP — `#listen` becomes a flagship, and stays honest

**Task:** `t_g2_l1` · **Gap:** `G-L1` (P0 flagship) + `G-C1`/R4 (P1 client CTA) ·
**Review:** `artifacts/adversarial/ADV-REVIEW-20260905T1451Z.md` §Listen —
*"Deliberately sparse caliper field — opposite of the §0.3 flagship mandate (**P0**). Dual mailto engage pills; no booking (**P1**)."*
**Author:** solutions-architect (§5) · **Date:** 2026-09-05 · **Status:** design, ready to slice
**Scene:** S6 `listen-field` (`docs/architecture/SIGNATURE-SCENES-v1.md` §4.2–4.6) — the `sceneId` shipped
(`192d743`) and the field already clears the visibility floors on live `ff67273b`. What is missing is not a
canvas. It is a **subject**.

---

## 0. The finding, stated precisely

The field is not failing its floors. `tests/overhaul/flagship-visibility.spec.ts:163` lists
`{ section: 'listen', scene: 'listen-field' }` and the scene passes COVERAGE ≥ 0.15 at +0.06 and PEAK ≥ 0.35
at both widths. The reviewer's P0 is a **content** finding, and it is correct: the field draws a band of
light whose only time-varying term is

```glsl
float breath = 0.5 + 0.5 * sin(p.x * 1.7 - uTime * 1.05);   // listen.glsl.ts
```

— a sine wave, tuned (the shader's own comment says so) *to clear a motion floor*. That is a scene built to
pass a test rather than to say something. Every other flagship on this site draws data: the strata draw
sixteen years, the compass draws ten scored dimensions, the bench draws what was tested. `#listen` draws
`sin()`.

**The fix is not more light. It is to give the same band a source.** The section already owns a real signal
nobody has plotted: `public/assets/minivic-greeting.mp3` — 24.98 s of the synthetic introduction, its
transcript in `public/assets/minivic-greeting.txt`, its SHA-256 already pinned in
`app/data/generated/greeting-asset.ts`. The closing screen is where the site says *speak to me*; the light
it says it in should be the shape of him speaking.

---

## 1. The story

> **The instrument is set down on the voice, and four routes arrive along it.**
>
> The band of light under the caliper is the greeting's own envelope — twenty-five seconds of the synthetic
> introduction, drawn as loudness across the frame. The four ways to reach him arrive as four marks on that
> line, closing in sequence as the jaws close. Two of the four are records a reader can open and check, and
> those two — only those two — are gold. Then the instrument reads the one thing it can honestly measure in
> this section: how long the voice was.

Nothing here is invented. Every pixel is one of three sources, and each is nameable:

| Visual element | What it is | Data source (exact path / command) | Sourced? |
|---|---|---|---|
| The band's height across x | Loudness of the greeting at that moment | `public/assets/minivic-greeting.mp3` → `app/data/generated/greeting-envelope.ts` (built by `scripts/build/greeting_envelope.mjs`, ffmpeg PCM → 256 RMS buckets) | **yes** — digest-pinned to the MP3 |
| The band's length / the x axis | 24.98 s | `ffprobe -v error -show_entries format=duration -of csv=p=0 public/assets/minivic-greeting.mp3` → `24.984671` | **yes** — measured |
| Four marks on the band | The four channels | `listenContent.channels` (`app/data/portfolio/listen.ts`) | n/a — they are the routes themselves |
| Gold on two of the four marks | A channel whose href is a **public record a reader can open** | `channel.kind === 'external'` → `linkedin.com/in/vikramd-profile`, `github.com/Victordtesla24` | **yes** — the URL is the check |
| No gold on the other two | An address is not a record. There is nothing at `mailto:` or `tel:` to open and verify | `channel.kind === 'email' \| 'phone'` | correctly withheld |
| The caliper reading | `24.98 s` | same `ffprobe` figure, emitted into the generated file — never typed by hand | **yes** |

**Where the gold lives:** in the DOM, on SVG hairlines inside the existing caliper's coordinate space — **not
in the shader**. `SIGNATURE-SCENES-v1.md` §4.2–4.6 reserves the only shader gold accent for S5
`vitrine-field`, and `tests/overhaul/scene-listen.spec.ts` TC-SCENE-LISTEN-06 asserts
`glsl.toLowerCase()).not.toContain('gold')`. Both stay true. The field remains monochrome light; the claim
is made by a mark, at hairline weight, which is exactly what `--gold` is for (CLAUDE.md prime directive 4).

**The one beat stays one beat.** MOT-F-4 and TC-SCENE-LISTEN-03 hold: nothing gains a clock. The arrivals are
*phases of `uClose`* — the jaws' own 0 → 1 over one `--motion-cine-long` (1.16 s), each mark staggered inside
that same window. There is no loop, no second animation, no `animation-iteration-count: infinite` anywhere in
`#listen`.

---

## 2. Clauses and their acceptance tests

Each clause is falsifiable and owns at least one assertion. New tests live in
`tests/overhaul/listen-flagship.spec.ts` unless named otherwise.

### C1 — The band is the greeting, not a sine
`scripts/build/greeting_envelope.mjs` runs in `npm run build` / `build:static` (beside `cv_fingerprint.mjs`)
and emits `app/data/generated/greeting-envelope.ts`: `envelope: readonly number[]` (256 values, 0 → 1, peak
normalised), `durationSeconds: 24.98`, `sourceSha256` copied from the same digest
`app/data/generated/greeting-asset.ts` carries. `listen.glsl.ts` gains `uEnvelope` (a 256×1 `DataTexture`,
`LinearFilter`) and the `sin()` breath term is deleted; the band's amplitude at `p.x` is the envelope sample
at `p.x`.

- **TC-LISTEN-FLAG-01** — the generated file exists, has exactly 256 samples, every sample ∈ [0, 1], at least
  one ≥ 0.9 and at least one ≤ 0.1 (it is a waveform, not a constant), and its `sourceSha256` **equals**
  `greetingAudioSha256` in `app/data/generated/greeting-asset.ts`. A regenerated MP3 with a stale envelope
  fails here — the same defect class the greeting digest was introduced to catch.
- **TC-LISTEN-FLAG-02** — `listen.glsl.ts` contains `uEnvelope`, contains **no** `sin(` in the fragment
  program's `main`, still contains no `#rrggbb` literal and no `gold`, and still makes ≤ 3 `noise()` calls
  (unchanged budget from TC-SCENE-LISTEN-06).
- **TC-LISTEN-FLAG-03** (no regression) — `flagship-visibility.spec.ts` `listen-field` still clears
  COVERAGE ≥ 0.15 at +0.06, PEAK ≥ 0.35 and the fallback floor ≥ 0.08 at **both** 1440 and 390.

### C2 — Four routes arrive on the line
Four `<g data-arrival="email|phone|external">` marks, one per `listenContent.channels` entry, in the same
order, positioned along the caliper's beam.

- **TC-LISTEN-FLAG-04** — `#listen [data-arrival]` count === `listenContent.channels.length` (4), and their
  DOM order matches the data order. Their x positions are strictly increasing (they are a timeline, not a
  cluster).

### C3 — Gold means a record, here as everywhere
- **TC-LISTEN-FLAG-05** — exactly 2 arrival marks compute a stroke equal to `--gold`; they are precisely the
  marks whose channel `kind === 'external'`; and **no other element in `#listen`** — type, plate, beam,
  reading, canvas pixel — is gold. This **amends** `tests/e2e/listen.spec.ts` TC-LISTEN-08 ("nothing in the
  closing section is gold") from *none* to *these two and nothing else*. The amendment is deliberate and
  narrowing, not a weakening: the old rule was "no claim is made here"; the new rule is "the only claims made
  here are the two the reader can check". **Reversal cost: one commit** — drop the `data-record` flag and
  TC-LISTEN-08 returns to `toHaveCount(0)`.

### C4 — One beat, still
- **TC-LISTEN-FLAG-06** — every animated element in `#listen` (jaws, rule, arrivals) resolves an
  `animation-duration` of `--motion-cine-long` and an `animation-iteration-count` of `1`; the sum of any
  mark's `animation-delay` + duration ≤ the jaws' own window. TC-SCENE-LISTEN-03 (no animation on the scene
  slot) stays green untouched.
- **TC-LISTEN-FLAG-07** — under `prefers-reduced-motion: reduce`: zero canvases in `#listen`, all four
  arrivals present, every `animation-duration` `0s`, the caliper drawn closed. Under `getContext` returning
  `null` for webgl: identical, plus zero page errors. (Extends TC-SCENE-LISTEN-04/05, same shape.)

### C5 — The instrument finally measures something
The reading changes from `—` to `24.98 s`, read from `greeting-envelope.ts`, with the existing
"synthetic introduction" labelling elsewhere in the section carrying the meaning. No new sentence.

- **TC-LISTEN-FLAG-08** — the reading's text === `` `${durationSeconds.toFixed(2)} s` `` from the generated
  file, and that number is within 0.01 s of `ffprobe`'s duration for the MP3 on disk. Hand-typing the figure
  fails.
- **TC-LISTEN-02 (existing, must stay green)** — the closing copy stays **under 65 words**. The reading adds
  two. If the count exceeds 64, trim `coffee` before shipping — the cap is not negotiable.

---

## 3. The client CTA — decision, with its evidence

### 3.1 Is there a real booking tool? **No. Verified by key name, values never read.**

```bash
grep -E '^[A-Z][A-Z0-9_]*=' /root/.claude/.env.production | sed 's/=.*//' | sort -u        # → 45 key names
grep -E '^[A-Z][A-Z0-9_]*=' /root/.claude/.env.production | sed 's/=.*//' | sort -u \
  | grep -ciE 'cal|calendar|book|schedul|meet'                                             # → 0
```

45 unique keys; **zero** matching `cal|calendar|book|schedul|meet`. There is no `CAL_COM_URL`, no
`CALENDLY_URL`, no `SAVVYCAL_URL`, no booking key of any name. No value was read, printed or logged.
`app/data/portfolio/listen.ts` already records the same conclusion in its own comment: *"There is no booking
tool on this account, and inventing a calendar link that 404s would be worse than none."*

**Decision: ship no booking link.** A fabricated `cal.com/vikram` is a 404 in front of the one visitor who
was ready to buy — strictly worse than no link, and a direct R7 breach.

**Activation condition, so a future agent needs no new design:** if a key **named** `CAL_COM_URL` or
`CALENDLY_URL` ever appears in `.env.production`, a build step emits it into `app/data/generated/` (same
pattern as `cv-fingerprint.ts`), `listenContent.engage` prefers that href, and the plate label becomes
"Book a 20-minute call →". A booking URL is public by nature, but it still passes through
`scripts/validate/built_output_secret_scan.mjs` like every other generated value. Until that key exists,
`TC-LISTEN-CTA-04` asserts the built output contains **no** booking host at all.

### 3.2 Is a response-time commitment sourced? **No. Do not print one.**

`app/data/siteContent.ts:512` states the site's own standing rule: *"Nothing here promises a response time or
anything else unverifiable."* No response-time figure exists in the CV data, `siteContent.ts`, or any
portfolio data file (`grep -rn "within 24\|response time\|respond" app/data/` → only that disclaimer). A
"reply within 24 h" line would be an unsourced claim in the section whose entire argument is that claims
carry sources. **Omit it.** Reversal cost: one line in `listen.ts` if a sourced commitment ever exists.

### 3.3 What ships instead: the agenda mailto

The reviewer's actual complaint — "dual mailto engage pills" — is that the section offers a filled plate
(*Start a project*) and, one row below, the raw email address, which is the **same route** wearing different
type. Two identical doors is not two options.

**Ship one door, and make it do the scheduling work a booking tool would do.**

| | Now | After |
|---|---|---|
| Plate label | `Start a project` | `Book a 20-minute call` |
| Subject | `Engagement enquiry — Vikram Deshpande` | `20-minute call — <subject line naming the role or project>` |
| Body | *(empty)* | a four-line agenda the sender edits in place |
| Email row below | a second filled pill | a plain channel, like the other three |

The prefilled body is the whole point — it converts a blank compose window into a scheduling handshake, which
is the function a booking page performs:

```
What you're building:
The decision you need made:
Two or three times that suit you (Melbourne time):
Anything I should read first:
```

Melbourne is sourced — `contact` and `listenContent.coffee` both already say so. Nothing in the body is a
promise; every line is a prompt to the sender.

- **TC-LISTEN-CTA-01** — `#listen` contains exactly **one** filled action plate (`[data-cta="engage"]`); the
  email channel is styled as a channel, not a plate. Anchor count stays 5 (`TC-SCENE-LISTEN-04/05` unchanged).
- **TC-LISTEN-CTA-02** — `engage.href` starts `mailto:` + `contact.email`, carries both `subject=` and
  `body=`, the decoded body has ≥ 4 newline-separated agenda lines, and the whole href is **≤ 900 characters**
  (older desktop clients truncate long mailto URLs; 900 is comfortably inside every mainstream client).
- **TC-LISTEN-CTA-03** — no unsourced timing promise: `#listen`'s text matches
  `/within\s+\d+\s*(h|hours|business\s+days)/i` **zero** times.
- **TC-LISTEN-CTA-04** — `grep -rniE 'cal\.com|calendly|savvycal' out/` → 0 matches, until a booking key name
  exists.

---

## 4. What this does not change

`Scene`/`useGLCapability` mounting, DPR caps, the reduced-motion path, the no-form rule (TC-LISTEN-03), the
four real anchors (TC-LISTEN-04), the underline behaviour (TC-LISTEN-05), the jaws' measured closed width
(TC-LISTEN-06/11), the monochrome palette, or the section's word budget. The section stays the quietest screen
on the site — it simply stops being an empty one.

## 5. Reversal costs, stated once

| Change | Reversal |
|---|---|
| Envelope replaces `sin()` | one commit: restore the breath term, delete the generated file and its build step |
| Two gold arrival marks | one commit: drop `data-record`, TC-LISTEN-08 returns to `toHaveCount(0)` |
| Reading `—` → `24.98 s` | one commit: restore the literal `—`, TC-LISTEN-FLAG-08 deleted |
| Agenda mailto | one field in `listen.ts` |
| No response-time line | one line in `listen.ts`, **only** once a source exists |

## 6. Slices

`docs/architecture/LISTEN-TASKS.json` — six slices, each ≤ 30 minutes, each shipping something a recruiter or
a client can see, first slice first (`listen-cta-agenda`, DOM-only, no GL, one cadence window).
