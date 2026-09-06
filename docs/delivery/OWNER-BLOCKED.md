# OWNER-BLOCKED — decisions that cost money and are therefore not the agent's to make

Every item here is blocked on a **cost** decision, not on engineering. Nothing on this page has been
enabled. Each entry states what it costs, what it buys, and what happens if the answer is "no".

---

## OB-1 — G-M4 first token < 1500 ms is upstream-bound (opened 2026-09-06 by `t_w3_m4c`)

### The gate

`docs/adversarial/GAP-BACKLOG.md` G-M4: the MiniVic chat's first token must arrive in **under
1500 ms** on a cold send, on both the Cloud Run origin and the Firebase Hosting rewrite.

### What has already been done for free

| Change | Where | Effect |
|---|---|---|
| `minInstances: 1` — no scale-to-zero | `functions/index.js` (predates this task) | The ~1 s container start is already bought and is **not** an available saving |
| `fm-minivic-warm.timer` every 120 s against **both** warm URLs | `scripts/ops/systemd/`, `/etc/systemd/system/` | Keeps the per-instance provider cooldown map primed between visitors; both endpoints answer 204 |
| `PRIME_REFRESH_MARGIN_MS = 180 s` | `functions/index.js`, asserted by `tests/minivic_chat_function.test.mjs` MV-WARM-10 | Re-primes before the map lapses, closing the ~2 min/10 min window in which a send paid the ~1.67 s serial dead-rung walk |
| 48-token ceiling on the buffered Hosting route, 128 on the origin | `functions/index.js`, `lib/miniVicRoute.mjs` (predates this task) | Shortens origin *completion*, which is what Hosting pays as first-byte |

With all of that live, the three unfunded rungs cost **0 ms** each — every `attempts[]` array on
every sample reads `openrouter cooling_down 0 ms · deepseek cooling_down 0 ms · zai cooling_down
0 ms`. There is no remaining free millisecond in this repository's control.

### What is left, measured

The single funded rung — `openai / gpt-4.1-mini` — is the whole budget:

| sample | first token | of which `openai answered` |
|---|---|---|
| review `02-origin-cold` (06:31Z) | 1900 ms | 1119 ms |
| review `01-hosting-cold-strict` (06:31Z) | 1793 ms | 1278 ms |
| `W3-M4C/c1b-origin-cold` (06:56Z, post-fix) | 1529 ms | **1731 ms** |
| `W3-M4C/c1a-hosting-cold` (06:56Z, post-fix) | 1193 ms | 932 ms |

On a bad upstream minute the provider call alone exceeds the 1500 ms bar before any transport is
counted. That is not a defect this repository can fix.

### The options, with prices

1. **Top up the OpenRouter rung — the ladder's first rung, currently overdrawn by USD 5.38**
   (`docs/architecture/MINIVIC-BRAIN-0-4.md` §1.1).
   *Cost:* the arrears plus whatever credit is loaded — call it **USD 10-25 one-off**, then usage.
   *Buys:* a second funded rung, so a slow minute on one provider is not the whole budget, and the
   §0.4 ladder stops always walking to its last rung. It does **not** guarantee < 1500 ms on its
   own — OpenRouter is itself a broker and adds a hop — so this is a variance fix, not a floor fix.
2. **Move the funded rung to a lower-latency model or tier** (e.g. an OpenAI account with higher
   rate-limit tier, or a smaller/faster model).
   *Cost:* usage-priced; a tier change is typically a spend commitment rather than a fixed fee.
   *Buys:* the only lever that moves the 932-1731 ms term itself. This is the option that would
   actually close the gate.
3. **Accept the bar as upstream-bound and restate it.** Re-word G-M4 as "first token < 1500 ms
   *warm*, and < 2000 ms cold", which the measured evidence supports today.
   *Cost:* nothing. *Buys:* an honest gate. *Loses:* the original promise.

### What is NOT the answer

**Cloud Run min-instances.** The parent task named it as the cost option to escalate. It is
**already enabled** (`minInstances: 1`) and has been for some time, so raising it buys nothing —
the instance is warm, the map is primed, and the container start is not in these numbers. Recording
this so the option is not re-opened as if it were untried. Nothing about instance count was changed
by `t_w3_m4c`.

### If the answer is "no"

The site keeps working exactly as it does now: warm sends land at ~820-1320 ms, cold sends land at
~1100-1900 ms depending on the provider's minute, and the panel's disclosure already tells the
visitor when the short proxy route answered. Nothing degrades; only the 1500 ms cold claim stays
unmet, and G-M4 stays open in `docs/adversarial/GAP-BACKLOG.md`.
