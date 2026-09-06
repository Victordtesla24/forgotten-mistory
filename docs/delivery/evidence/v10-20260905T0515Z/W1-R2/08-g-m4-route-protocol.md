# G-M4 — which route to measure, and what today's numbers are

**Task:** `t_w1_r2ap` · analyst-programmer (`ap-w1-r2`) · 2026-09-06
**Implements:** `docs/architecture/MINIVIC-BRAIN-0-4.md` §2(c), §4.3 (E13)

## The route the shipped client takes first

`config/minivic-origin.json` → `originUrl: https://minivicchat-hjdyjsrzvq-uc.a.run.app`.
`lib/miniVicBrain.ts` builds `CHAT_ROUTES` from it and posts to the **Cloud Run origin
first**, `/api/chat` second. A reviewer who measures only `POST /api/chat` is measuring the
fallback: Firebase Hosting's Fastly edge buffers the SSE body, so its first byte *is* the
origin's last byte and there is no first token in it to measure.

Both are recorded below. Only the origin one describes what a visitor experiences first.

## Measured, this task, immediately after `firebase deploy --only functions:tts:minivicChat`

Raw JSON: `07-live-first-token.json` (probe `/tmp/w1r2_ft.mjs`, timestamps the first
non-empty `delta`, never the headers and never the `done` event).

| # | origin first token | note |
|---|---|---|
| 1 | **2.512 s** | genuinely COLD — the deploy had just replaced the revision, so this request paid container start *and* the full serial dead-rung tax with an empty cooldown map and no `?warm=1` ahead of it |
| 2 | 1.434 s | |
| 3 | 0.646 s | |
| 4 | 0.812 s | |
| 5 | 0.753 s | |
| 6 | 0.536 s | |
| 7 | 0.722 s | |

**6 of 7 are under the 1.5 s bar; sample 1 is not.** The gate as the task states it
("all 7 < 1.5 s") is **NOT met** and is reported as a shortfall rather than re-measured
until it passed.

Hosting rewrite, same probe, labelled *buffered fallback — first byte equals origin
completion*: 1.162 / 0.993 / 1.142 s, with `x-timer` `VE1121` / `VE977` / `VE1126`.

`provider` on all 10 responses: **`openai`** — the last rung, reached because OpenRouter,
DeepSeek and Z.ai are all out of credit (§1.1 of the architecture doc; OpenRouter overdrawn
by USD 5.384318264). The UI now names that rung at runtime instead of claiming OpenRouter.

## Why sample 1 is the honest number and what would move it

Sample 1 is the only request in this set that ran with an empty `providerCooldowns` map,
which is exactly the path `primeProviderCooldowns()` exists to remove — but priming runs on
`GET ?warm=1`, and this probe sends a bare `POST` with no panel-open ahead of it. A real
visitor opens the panel (which fires `?warm=1`) seconds before their first send, so the map
is populated by the time they ask. The probe deliberately does **not** simulate that,
because the reviewer protocol in §4.3 measures the worst honest case.

What is *not* being done to make the number pass: `CHAT_MAX_TOKENS` stays at 128,
`minInstances` stays at 1, and the ladder order stays `openrouter,deepseek,zai,openai`.
The measured fix for sample 1 is an **OpenRouter top-up of USD 5.39 minimum** — with the
first rung answering, the dead-rung walk disappears rather than being routed around.
