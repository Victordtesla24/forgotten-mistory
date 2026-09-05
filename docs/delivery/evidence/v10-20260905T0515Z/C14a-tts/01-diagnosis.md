# C14a — `/api/tts` 502: what the function's own log says

**When:** 2026-09-05T06:25Z · **Where:** worktree `wf_55e925e9-074-1`, branch
`worktree-wf_55e925e9-074-1` · **Project:** `forgotten-mistory` (us-central1).

## 1 · The live symptom

```
$ curl -s -D - -o /tmp/tts_probe_body.bin -w "HTTP %{http_code} ct=%{content_type} size=%{size_download} time=%{time_total}\n" \
    -X POST -H 'content-type: application/json' -d '{"text":"probe"}' \
    https://forgotten-mistory.web.app/api/tts
HTTP 502 ct=application/json; charset=utf-8 size=44 time=1.274398
HTTP/2 502
content-type: application/json; charset=utf-8
server: Google Frontend
date: Sat, 05 Sep 2026 06:25:14 GMT
content-length: 44

$ cat /tmp/tts_probe_body.bin
{"error":"tts_upstream_failed","status":401}
```

The body is exactly `{"error":"tts_upstream_failed","status":401}` — the 502 the site
returns is `functions/index.js:100` re-wrapping an upstream **401**.

## 2 · What the upstream 401 actually is

`functions/index.js:98` logs `{status, detail}` on every upstream failure, and the
detail carries ElevenLabs' own `detail.status`. Read verbatim from the function:

```
$ npx firebase-tools functions:log --only elevenLabsTts -n 50
```

The two most recent failures — one from the request above (06:25:14Z) and one an hour
earlier (06:04:53Z) — are the same error:

```
2026-09-05T06:25:14.378361Z E elevenlabstts: {"message":"Error: ElevenLabs TTS failed\n    at ... at /workspace/index.js:98:16","status":401,"detail":"{\"detail\":{\"type\":\"authorization_error\",\"code\":\"subscription_required\",\"message\":\"Instantly cloned voices are not available on your current plan. Please upgrade your subscription.\",\"status\":\"ivc_not_permitted\",\"request_id\":\"4fc56f0152c1e409837d1782151ac78f\"}}"}

2026-09-05T06:04:53.353202Z E elevenlabstts: {"status":401,"detail":"{\"detail\":{\"type\":\"authorization_error\",\"code\":\"subscription_required\",\"message\":\"Instantly cloned voices are not available on your current plan. Please upgrade your subscription.\",\"status\":\"ivc_not_permitted\",\"request_id\":\"a6ce9f43ef805076b3f7ac787d85f02e\"}}","message":"Error: ElevenLabs TTS failed\n    at ... at /workspace/index.js:98:16"}
```

`detail.status` is **`ivc_not_permitted`**, `type` is `authorization_error`, `code` is
`subscription_required`. That is a **voice-permission** refusal, not a credential
refusal: the key authenticated and the account was read; the *voice* was rejected.

## 3 · The key itself was the previous defect, and it is already fixed

The same log shows the key defect this task inherited, and shows it ending. Before
2026-09-05T00:01Z the failures were HTTP **400** with a different `detail.status`:

```
2026-09-04T23:21:13.217929Z E elevenlabstts: {"status":400,"detail":"{\"detail\":{\"type\":\"authentication_error\",\"code\":\"invalid_api_key\",\"message\":\"API key ID used as API key - only valid API keys can be used. API keys start with 'sk_' and are shown when the key is created or rotated.\",\"status\":\"api_key_id_used_as_api_key\",\"request_id\":\"ea776b0440911490a15751df51fc5a03","message":"Error: ElevenLabs TTS failed\n    at ... at /workspace/index.js:88:16"}
```

At `2026-09-05T00:01:44Z` an `UpdateFunction` audit entry lands the function on
`secret_environment_variables:[{secret:"ELEVENLABS_API_KEY", version:"2"}]`, and from
`2026-09-05T00:03:26Z` onward **every** failure is the 401 `ivc_not_permitted` above —
never `invalid_api_key` again. The key on version 2 authenticates. The Secret Manager
drift named in SPEC-v10 §R3(a) is closed; what is left is the voice.

So this task does **not** hit its "capability: secret rotation" stop condition: the
detail does not name the API key.

## 4 · Root cause

`functions/index.js:36` sends every request to Vikram's **instantly-cloned** voice:

```js
const VOICE_ID = "0ZJ4kFDo6bZUNQsuULOW";   // category "cloned"
```

The account's plan (`payg`, `can_use_instant_voice_cloning=false` — SPEC-v10 §R3 and
`v9-20260904T2312Z/00-run-manifest.json`) refuses instantly-cloned voices outright, at
any credit balance. `creative_list_voices` confirms `0ZJ4kFDo6bZUNQsuULOW` is
`"category":"cloned"`. Every `/api/tts` request therefore 401s at ElevenLabs and 502s
at the browser, whatever the text and whatever the key.

**Fix (orchestrator decision §0.1):** speak with an ElevenLabs **premade** voice and
label the voice synthetic wherever it can be heard. Voice chosen, target and recovery
path recorded in `07-decisions.md`.
