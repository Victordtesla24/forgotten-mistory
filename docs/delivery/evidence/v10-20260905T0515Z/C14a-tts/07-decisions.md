# C14a — decisions, target, recovery path

## 1 · The cause was the voice, not the key — so this task did not stop

SPEC-v10 §R3(a) classified the 502 as Secret Manager drift. The function's own
log shows that drift was real and is already closed: failures up to
2026-09-04T23:21Z were HTTP 400 `invalid_api_key` /
`api_key_id_used_as_api_key`; after the `UpdateFunction` at 2026-09-05T00:01Z
put the function on `ELEVENLABS_API_KEY` **version 2**, every failure is HTTP
401 `ivc_not_permitted`. An authorization error naming the *voice* is not a
credential error, so the "capability: secret rotation" stop condition did not
apply and no secret was read, printed, compared or rotated by this task.
Evidence: `01-diagnosis.md`.

## 2 · Voice chosen

| field | value |
|---|---|
| voice_id | `JBFqnCBsd6RMkjVDRZzb` |
| name | George — Warm, Captivating Storyteller |
| category | `premade` (ElevenLabs default library, `is_library_voice:false`) |
| labels | `language:en`, `accent:british`, `gender:male`, `age:middle_aged`, `use_case:narrative_story` |

**Why this one.** The constraint is a premade adult male English voice — the
only category the `payg` plan will speak with. Among the premade male voices
returned by `creative_list_voices`, the alternatives were Roger (American,
conversational), Charlie (young Australian, "hyped"), Liam (young American,
social media), Callum (character/animation, "unsettling edge") and Harry
(character/animation, "fierce warrior"). Four of those are young or
character-acting voices and would read as a mismatch for a sixteen-year
delivery record; Roger is plausible but "laid-back/casual". George is the only
middle-aged, professional, narrative male voice in the set, and it also matches
the pre-rendered greeting asset already shipped in
`components/MiniVicBot.tsx` (documented there as "a professional British-male
voice"), so the greeting and the dynamic replies now sound like the same
speaker instead of two different ones.

It is explicitly **not** Vikram's voice, and the panel says so — see §4.

## 3 · Target and recovery path

- **Target changed in production:** Cloud Function `tts:elevenLabsTts`
  (us-central1), one constant — `functions/index.js` `VOICE_ID`. No secret, no
  IAM, no Hosting config, no other function touched. Deploy line:
  `✔ functions[tts:elevenLabsTts(us-central1)] Successful update operation.`
  (`firebase deploy --only functions:tts:elevenLabsTts` — the codebase is named
  `tts` in `firebase.json`, so the unqualified
  `--only functions:elevenLabsTts` filter matches nothing and aborts).
- **Recovery path:** the previous behaviour is one constant away and is
  redeployable from `main` at any time — check out the pre-change commit of
  `functions/index.js` and run the same deploy command. Secret Manager is
  untouched by this task, so `ELEVENLABS_API_KEY` keeps every version it had
  (the function stays pinned to version 2). Reverting restores the cloned
  voice id, which will resume 401-ing until the account has Instant Voice
  Cloning — the revert is safe, not useful.
- **What would make the clone work again:** a plan with IVC/PVC enabled. That
  is the owner-blocked row already recorded in SPEC-v10 §R3; nothing in this
  repository can lift it.

## 4 · The label

The site now speaks with a stock voice, so every place the voice can be heard
says so. `components/MiniVicBot.tsx` prints
**"Synthetic voice · not a recording of Vikram"** in the panel's identity strip,
directly under "Mini Vic", using existing chrome tokens only (no new colour, no
raw hex, no gold — gold means "this figure has a source" and a disclosure is not
a figure). `tests/e2e/avatar-voice.spec.ts` fails if it disappears while the
player remains. The privacy page's synthetic-media section
(`app/privacy/page.tsx:112`) already carried the long-form disclosure; this puts
the short form where the audio actually is.

`components/sections/Listen/Listen.tsx` plays no audio at all (no `<audio>`, no
voice call — `grep -ni "synthetic|voice|audio"` returns nothing), so it needs no
label; the only place the voice plays is the MiniVic panel.

## 5 · Cloned voice: gone from shipped code

`grep -rn 0ZJ4kFDo6bZUNQsuULOW functions/ components/ app/ lib/ scripts/ tests/`
→ 0 hits after the change (before: `functions/index.js:36`). The remaining hits
in the repository are all in `docs/delivery/evidence/**` — historical run
records, which must keep saying what they said.

## 6 · Spend

Two ElevenLabs TTS calls, **58 characters** total:

1. the mandated live probe, 53 characters → HTTP 200 `audio/mpeg`, 53 960 bytes
   (`04-probe.log`);
2. the spec's own `{"text":"probe"}`, 5 characters, when
   `tests/e2e/avatar-voice.spec.ts` was run green against the live endpoint
   (`04-tests-passing.log`).

The task authorises one verification call of ≤200 characters; the brief also
requires the spec to be re-run green against the live site, which is
necessarily a second call. Total characters stay far inside the cap. No other
paid call of any kind was made.

## 7 · Tools used

- `Bash` — `curl` (live `/api/tts` probe, before and after),
  `npx firebase-tools functions:log --only elevenLabsTts -n 50` (the diagnosis),
  `firebase deploy --only functions:tts:elevenLabsTts`, `npx tsc --noEmit`,
  `npm run lint`, `npm run build:static`,
  `node scripts/validate/overhaul_static_audit.mjs`,
  `node --test tests/minivic_chat_function.test.mjs`, `npx playwright test`,
  `git`.
- `Read` / `Edit` / `Write` — `functions/index.js`, `components/MiniVicBot.tsx`,
  `tests/e2e/avatar-voice.spec.ts`, this evidence directory.
- `mcp__claude_ai_ElevenLabs__creative_list_voices` — the voice catalogue the
  choice in §2 was made from (categories and labels quoted from its response).
- `ToolSearch` — to load that MCP tool's schema.

No secret was read by any of them: `/root/.claude/.env.production` was never
opened and `firebase functions:secrets:*` was never run.
