# G-M4 — Independent live reviewer: Hosting POST /api/chat TTFB

**Gap:** G-M4 (t_g2_m4b) — Hosting `POST /api/chat` TTFB **< 1.5 s** on a cold probe (not Cloud Run origin-only). R3 full avatar stays OPEN.
**Reviewer stance:** §5 `reviewer` — read-only, 3rd-party independent adversarial QA at effort `max` (docs/prompt.md §8 / O2 / O6). Fresh identity; **not** the G-M4 author `14f7e680`.
**Live URL:** https://forgotten-mistory.web.app/api/chat
**Live build-commit at review:** `2806edec` (meta `build-commit` on `/`, HTTP 200, `last-modified Sat, 05 Sep 2026 17:28:57 GMT`).
**Probed:** 2026-09-06 (UTC) from VPS.

---

## Verdict: **FAIL**

Hosting `POST /api/chat` TTFB with a **valid** MiniVic payload is **~1.70 s median** (range 1.488–1.997 s) — over the < 1.5 s budget. The Cloud Run origin itself is fast (~0.57–0.79 s), but the **Hosting path** the recruiter's browser actually hits does not meet budget. This is the same failure class as ADV-1556Z (was 2.295 s on `b2ac21be`); improved, still FAIL.

---

## Measurements (`curl … -w %{time_starttransfer}`)

Valid MiniVic payload (the shape the site sends — `messages[]` + `mode:"hiring"` + `stream:true`):

```json
{"messages":[{"role":"assistant","content":"…CV intro…"},{"role":"user","content":"What did Vikram do at the ATO?"}],"mode":"hiring","stream":true}
```

### A · Hosting POST, valid payload, `stream:true` (client-realistic)
| run | http | time_starttransfer (s) | total (s) |
|-----|------|------------------------|-----------|
| 1 | 200 | 1.997 | 1.997 |
| 2 | 200 | 1.704 | 1.704 |
| 3 | 200 | 1.488 | 1.489 |
| 4 | 200 | 1.502 | 1.502 |
| 5 | 200 | 1.710 | 1.710 |

**Median TTFB = 1.704 s. Only 1/5 samples (1.488 s) landed under 1.5 s. FAIL.**
Firebase Hosting buffers the SSE stream (first byte == last byte: `starttransfer ≈ total`), so streaming gives no perceived-latency relief on the Hosting path.

### B · Hosting POST, valid payload, `stream:false`
| run | http | time_starttransfer (s) |
|-----|------|------------------------|
| 1 | 200 | 2.375 |
| 2 | 200 | 1.658 |
| 3 | 200 | 1.703 |

FAIL (≥ 1.66 s).

### C · Cloud Run origin direct (`minivicchat-hjdyjsrzvq-uc.a.run.app`), same valid payload
| run | http | time_starttransfer (s) |
|-----|------|------------------------|
| 1 | 200 | 0.730 |
| 2 | 200 | 0.791 |
| 3 | 200 | 0.575 |

Origin is fast — confirms the gap is the **Hosting rewrite path**, not the model/origin.

---

## The author's "0.116–0.177 s" claim is a measurement artifact

The task VERIFICATION line and the AP's claim use `--data '{"message":"ping"}'`, which is **invalid** and returns `HTTP 400 {"error":"messages_required"}` instantly:

```
POST /api/chat  {"message":"ping"}  →  HTTP 400 · starttransfer 0.115 s
```

0.115 s ≈ the claimed 0.116 s. That number times the **400 validation-reject path**, not a real MiniVic answer. On a **valid** payload the Hosting path is ~1.70 s. Not a PASS.

---

## Commands (reproducible)

```bash
# build-commit
curl -sS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'

# Hosting TTFB, valid payload (repeat)
curl -sS -o /dev/null -X POST https://forgotten-mistory.web.app/api/chat \
  -H 'content-type: application/json' \
  --data '{"messages":[{"role":"user","content":"What did Vikram do at the ATO?"}],"mode":"hiring","stream":true}' \
  -w '%{http_code} %{time_starttransfer}\n'
```

---

## R3 — avatar remains **OPEN**

Per plan §0.1(6) and t_g2_m4b: full R3 real-time Higgsfield lip-synced avatar is **not** claimed and stays honestly OPEN. Greeting MP3 / TTS path is out of scope for this TTFB gap and does not close R3.

## Result (structured)

```json
{ "live_commit": "2806edec", "hosting_ttfb": "1.704s (median; 1.488–1.997s over 5 runs, valid stream payload)", "verdict": "FAIL", "r3": "OPEN" }
```

**§9 correction owed to t_g2_m4b:** the Hosting path (not origin) must reach < 1.5 s TTFB on a valid payload — unbuffered/streaming rewrite or a warm same-region hosting→origin hop. Re-measure with a valid `messages[]` payload, never `{"message":"ping"}`.
