# n8n fix report — run v9-20260904T2312Z (E-n8n)

Written 2026-09-05T00:05Z–00:20Z by the n8n workflow engineer subagent under a 25-minute cap.
No workflow was executed. No paid API was called. Both workflows were changed with `update_workflow` (atomic, validated server-side) and re-read afterwards. Tags: **Verified** = observed in this session from n8n/MCP/file reads · **Inferred** = derived from Verified facts · **Assumed** = not checkable here.

## 0. Failures first

1. **End-to-end 4K proof is BLOCKED on OpenRouter credits.** Balance is −$5.38 (Verified by the orchestrator 23:13Z–23:30Z). Every OpenRouter call (script model, reviewer, `POST /api/v1/videos`, flux upscale) returns HTTP 402 until the Owner adds credits. Nothing in this report is a runtime proof; everything is structural.
2. **The fixes are saved but NOT published.** After the updates, `versionId` moved to the new versions but `activeVersionId` still points at the prior versions in both workflows (Verified, see §5). The live webhook/form still runs the old graph until `publish_workflow` is called. I did not publish: it was not in the brief and it changes live behaviour.
3. **The in-workflow UHD route is NOT built.** Neither workflow dispatches `black-forest-labs/flux-video-upscale` after the avatar-iv render. What exists (Verified): WF-B plans `needs_upscale`/`upscale_factor` for `UHD_4K` and accepts it on the form; WF-A rejects `UHD_4K` in `Normalise Brief` (`VALID_PROFILES = ['WEB_PARITY','MASTER_1080']`) and its planner says "flux-video-upscale disabled (not in R-140)". A second dispatch→poll→download→probe cycle, chunking (v8 proved full-length input is rejected by the upscaler: "input exceeds max size", chunks of 11.3 s accepted), concat and the 24 fps conform all need ffmpeg, which is not in the n8n runtime (Config.md §3.4). I could not build and validate that cycle blind inside the cap. See §6 for the exact design that remains.
4. **`validate_workflow` could not be applied to these workflows.** That tool validates n8n Workflow-SDK *code*, not a workflow ID, and there is no JSON→SDK exporter in the toolset (the SDK "import" section only lists the import statement). Substitutes used (Verified): `validate_node_config` on every new node type (all valid), `update_workflow`'s own atomic validation (`validationWarnings: []` on both), and a post-update re-read of nodes, credentials and connections (§5).
5. ElevenLabs tier is `payg`, `can_use_instant_voice_cloning=false` (Verified). The `ELEVENLABS_LIVE` branch in WF-A can never succeed; preflight already blocks it before spend (exec 23 proved it). Only `ELEVENLABS_ARCHIVE` (fixed words, real cloned voice) or `MODEL_NATIVE`/HeyGen built-in voice (not a clone) are usable.

## 1. Errored executions (Verified from execution data)

| WF | Exec | Failing node | Error text (verbatim, trimmed) | Input that caused it | Classification |
|---|---|---|---|---|---|
| A | 23 | Halt - Preflight Failed | "PREFLIGHT FAILED … BRIEF: expertise_anchor is required · BRIEF: portrait_url must be a public https:// URL … · BRIEF: voice_id is required in ELEVENLABS_LIVE mode · ELEVENLABS PLAN: can_use_instant_voice_cloning is false on tier "payg"…" | webhook body `{"concept":"x"}` | Correct halt, $0 spent. Not a defect. (At that version the default voice_source was ELEVENLABS_LIVE; now ELEVENLABS_ARCHIVE.) |
| A | 24 | Publish Voice Asset URL (Code) | ExpressionError "access to env vars denied" | full brief, ELEVENLABS_ARCHIVE, MASTER_1080, heygen/avatar-iv | Defect (`$env` blocked by N8N_BLOCK_ENV_ACCESS_IN_NODE). Already fixed before v9: node now hard-codes the public GitHub-raw archive MP3 URL; no `$env` remains in either workflow (grep Verified). |
| A | 29 | Halt - Preflight Failed | "…BRIEF: expertise_anchor is required" | `{"concept":"t"}` | Correct halt. Not a defect. |
| B | 17 | Halt - Register Violation | "OVER LENGTH: 64 words exceeds the 44-word ceiling for 15s at 150 wpm…" | 15 s brief, WEB_PARITY, Andrew voice, ceiling $5 | At that version a register violation halted on attempt 1. Already fixed before v9 by `Register Retry Controller` / `Gate - Register Retry Left` (2-rewrite budget, Config §6). |
| B | 18 | Review Schema → Adversarial Review | "Model output doesn't fit required format" | same brief; render completed, $ spent | Judgement parser hard-failed the run after a paid render. Since fixed: Adversarial Review has `onError: continueErrorOutput` + retry 2, error output → Fold Review Verdict → `review_usable=false` → Halt - Review Unavailable (§5.2b). Verified wiring. |
| B | 20 | Script Schema → Compose Explainer Script (attempt 2) | "The AI model returned an empty response to the Structured Output Parser" | refinement attempt after reviewer REJECTED | Script parser (auto-fix allowed by §5.2b) got an empty model reply. Since fixed: Compose has `continueErrorOutput` + retry 2, error output → Enforce Register → register retry. |
| B | 21 | Halt - Conform Required | "…Independent reviewer: UNKNOWN at confidence 0 … DEFECTS: CONFIG-2 frame rate: got 25 fps…" | 15 s brief | Two things: (a) the conform-only halt is a sanctioned terminal (Config §6); (b) a review reading UNKNOWN/0 opened the conform route — the §5.2b incident. Since fixed: `review_usable` requires CONFIRMED/REJECTED, confidence>0, ≥20 chars evidence, and `conform_only` requires `review_usable`. Verified in Fold Review Verdict code. |
| B | 22 | Halt - Conform Required | "…reviewer: REJECTED at confidence 1, raising no script defects … CONFIG-2 frame rate: got 25 fps" | 15 s brief, $0.8909 spent | Sanctioned terminal; correct behaviour. The 25 fps is a measured avatar-iv property (Config §3.0a). |

Execution 30 (A) and 19 (B) succeeded; not re-read.

## 2. Validation

- `validate_workflow`: not applicable to JSON-native workflows (see §0 item 4). validateBefore = "N/A (SDK-code validator; no JSON→SDK path)"; validateAfter = "update_workflow atomic validation: validationWarnings [] on both; validate_node_config valid:true for httpRequest v4.5 (credits), code v2 (approval), outputParserStructured v1.3 (review schema)". (Verified)
- `validate_node_config` result (Verified): `{"valid":true,"results":[{"Preflight OpenRouter Credits":"valid"},{"Approval - Plan and Spend (B, code)":"valid"},{"Review Schema (B)":"valid"}]}`

## 3. Defect table — WF-A `YYNSZMYApt7N3U3B` (70 → 71 nodes)

| Node | Defect | Fix (v9) | Evidence |
|---|---|---|---|
| Assess Preflight (+ new Preflight OpenRouter Credits) | No balance check; `/api/v1/key` returns 200 with a negative balance, so a run would reach the paid LLM call and die on an unexplained 402 | Added `Preflight OpenRouter Credits` (GET `/api/v1/credits`, free, neverError, credential `OpenRouter - Avatar Studio`) between Merge Preflight Results and Assess Preflight; Assess computes `total_credits − total_usage` and blocks with: "OPENROUTER 402 Payment Required: credit balance is $−5.38 … returns HTTP 402 {"error":{"code":402,"message":"Insufficient credits. Add more using https://openrouter.ai/settings/credits"}} … this run cost $0.00." Balance<ceiling → advisory | Verified wiring post-update. The quoted 402 body shape is **Inferred** from OpenRouter's documented error format; the balance figure is computed live |
| Conformance Gate vs Config.md | Accepted 25 fps as "24±1 (heygen native)" and labelled defects R140-n — contradicts Config §2.1/§4 ("no close enough", exact 24/1) | CONFIG-2 now exact (>0.05 fails); every defect carries a class (CONFORM/REGENERATE/UNMEASURABLE per §4.1); emits `conform_fixable_only` and the §4.2 ffmpeg command with a bitrate cap derived from the profile budget | Verified: tolerance 1.05 absent, exact test present |
| Refinement Loop Controller | Would spend up to 3 paid attempts on a CONFORM-class-only failure (§4.1 forbids) and on an unusable review (§5.2b) | `can_retry=false` with `retry_block_reason` = "CONFORM REQUIRED (Config.md 4.1) … <command>" or "REVIEW UNAVAILABLE (5.2b)"; writer only receives reviewer script defects | Verified code saved. Routes to existing Halt - QA Not Met After 3 Attempts (message carries the reason) — WF-A still lacks a dedicated Halt - Conform Required node (WF-B has one) |
| Build Model Request Bodies | `body.provider = { heygen: … }` (Config §3.2: accepted and silently ignored); `expressiveness: 0.55` float (§3.2: enum only → 400 once the path is correct); prompt path sent no `voice_id` (§3.2: required) | `provider.options.heygen`, `expressiveness:'medium'`, `voice_id` (plan value or Andrew `6be73833ef9a4eb0aeee399b8fe9d62b`, id Verified from exec 17 data) on the prompt path | Verified saved |
| Normalise Brief / Resolve Generation Plan | `UHD_4K` rejected; upscale route disabled | **Not fixed** (see §6) | Verified |
| Approval - Plan and Spend / Publish | Already Code auto-approve (v7); ceiling enforced in Resolve Generation Plan (throws if estimate > max_spend) and Refinement Loop | No change | Verified |
| Route Voice Source → Synthesize Cloned Voice - Live | Cannot succeed on payg tier | Left in place; preflight blocks before spend | Verified (exec 23) |
| Script Schema / Review Schema | autoFix absent (=false) on both | No change needed (§5.2b) | Verified |
| Wait For Render / Fold Poll Results | Bounded: MAX_POLLS 90 × 15 s ≈ 22 min, then status `expired` | No change | Verified |

Found 5 defects; fixed 4 (the UHD route remains).

## 4. Defect table — WF-B `dfs7PNjfoTZxzaw4` (62 → 63 nodes)

| Node | Defect | Fix (v9) | Evidence |
|---|---|---|---|
| Assess Preflight (+ new Preflight OpenRouter Credits) | Only checked `limit_remaining` (null on this key → never fires); no balance check | Same credits node inserted between Preflight OpenRouter Key and Assess Preflight; same 402 blocker text | Verified wiring post-update |
| Approval - Plan and Spend (Wait, resume=form) | Never resumes non-interactively → run hangs forever after script + re-cost | Replaced by a Code node of the same name: APPROVE only if `0 < estimated_cost_usd ≤ max_spend_usd`, else DECLINE → Run Cancelled By Owner. Spend ceiling kept; register gate, byte-level conformance, review-usable and adversarial gates untouched | Verified: node type code, Gate - Register Clean → Approval → Gate - Plan Approved |
| Approval - Publish To Production (Wait, resume=form) | Never resumes | Replaced by a Code node of the same name: PUBLISH only when Fold Review Verdict says `releasable && review_usable && conformant_all`, else HOLD → Held By Owner - Not Published. Emits the field names Emit Delivery Note reads | Verified wiring |
| Email Publish-Approval Link | References `$execution.resumeFormUrl` (now undefined) | Left: neverError, informational only | Verified |
| Review Schema | autoFix absent (=false) | No change (§5.2b) | Verified |
| Compose Explainer Script / Adversarial Review | Already `continueErrorOutput` + retry 2 wired to the strict path | No change | Verified |
| Wait For Render / Fold Poll Results | Bounded 90 × 20 s = 30 min | No change | Verified |
| Post-render UHD route | Plans `upscale_factor` for UHD_4K but never dispatches flux-video-upscale | **Not fixed** (§6) | Verified |

Found 4 defects; fixed 3.

## 5. Post-update verification (Verified, re-read from n8n)

```
YYNSZMYApt7N3U3B active=true versionId=fc4a369a-5d4a-48af-9762-f7cc8a90e4eb activeVersionId=774b0543-dce0-42e0-bf32-345722c05d0c nodeCount=71 updatedAt=2026-09-05T00:14:02.401Z
  new node: Preflight OpenRouter Credits type=n8n-nodes-base.httpRequest v4.5 onError=continueRegularOutput cred={"openRouterApi":{"id":"orAvatarStudio01","name":"OpenRouter - Avatar Studio"}} url=https://openrouter.ai/api/v1/credits
  approval: Approval - Plan and Spend type=n8n-nodes-base.code
  approval: Approval - Publish To Production type=n8n-nodes-base.code
  conn: Gate - Register Clean -> Approval - Plan and Spend
  conn: Approval - Plan and Spend -> Gate - Plan Approved
  conn: Email Publish-Approval Link -> Approval - Publish To Production
  conn: Approval - Publish To Production -> Gate - Publish Approved
  conn: Merge Preflight Results -> Preflight OpenRouter Credits
  conn: Preflight OpenRouter Credits -> Assess Preflight
  conn: Preflight OpenRouter Credits -> Assess Preflight
  Review Schema autoFix=false
  Conformance Gate CONFIG-2 exact: true  tolerance-1.05 present: false
dfs7PNjfoTZxzaw4 active=true versionId=56ea98ea-269e-4aa8-916f-7002e72209a6 activeVersionId=d39da8f2-0c71-4df9-b41a-f93cd8a26b3e nodeCount=63 updatedAt=2026-09-05T00:14:32.532Z
  new node: Preflight OpenRouter Credits type=n8n-nodes-base.httpRequest v4.5 onError=continueRegularOutput cred={"openRouterApi":{"id":"orAvatarStudio01","name":"OpenRouter - Avatar Studio"}} url=https://openrouter.ai/api/v1/credits
  approval: Approval - Plan and Spend type=n8n-nodes-base.code
  approval: Approval - Publish To Production type=n8n-nodes-base.code
  conn: Gate - Register Clean -> Approval - Plan and Spend
  conn: Preflight OpenRouter Key -> Preflight OpenRouter Credits
  conn: Preflight OpenRouter Credits -> Assess Preflight
  conn: Approval - Plan and Spend -> Gate - Plan Approved
  conn: Email Publish-Approval Link -> Approval - Publish To Production
  conn: Approval - Publish To Production -> Gate - Publish Approved
  conn: Preflight OpenRouter Credits -> Assess Preflight
  Review Schema autoFix=false
  Conformance Gate CONFIG-2 exact: true  tolerance-1.05 present: false
```

Version IDs after: WF-A `fc4a369a-5d4a-48af-9762-f7cc8a90e4eb` (prior `774b0543-…`), WF-B `56ea98ea-269e-4aa8-916f-7002e72209a6` (prior `7c484466-…`, active `d39da8f2-…`). **activeVersionId unchanged in both → publish required.**

## 6. What could NOT be proven, and the UHD route that remains

- No paid call was made, so nothing here is a runtime proof: the 402 blocker text, the ceiling-gated approvals, the exact-fps gate and the conform-only no-retry are all structural (code + wiring Verified, behaviour Inferred).
- **UHD route design still to build (both workflows):** after `Conformance Gate vs Config.md`, when `target_profile === 'UHD_4K'` and the candidate is 1080p CONFORM-class-only: (1) if measured bytes ≤ the upscaler's input limit (limit not published in Config; v8 Verified: a 33.9 s / ~14 MB 1080p file was rejected, 11.3 s chunks accepted) dispatch `POST /api/v1/videos` `{model:"black-forest-labs/flux-video-upscale", upscale_factor:2, input_references:[{type:"video_url", video_url:{url:<content_url>}}]}`, re-enter the existing poll loop with a `stage:"upscale"` flag, re-probe against 3840×2160; (2) otherwise emit a chunk plan — `ffmpeg -ss/-t` into ≤11 s segments (ffmpeg is outside n8n), N upscale dispatches, `concat` demuxer, then the §4.2 conform at 24 fps — as a `Halt - Conform Required`-style directive, because chunking/concat/conform cannot run inside n8n. Cost from v8 evidence (Verified): $8.92 per 11.3 s chunk, $9.70 for one full greeting upscale.
- **Cheapest proof run once credits exist (Config §3 pricing):** WF-B form, `heygen/avatar-iv` at $0.05/s, 15 s target (the 38-word floor of §5.2a; 10 s cannot satisfy the content contract), WEB_PARITY. Video ≈ $0.75 (exec 21 measured $0.7461 for 15.08 s, Verified); script + reviewer LLM ≈ $0.10 (Inferred from exec 17 token counts ≈1.9k tokens on Sonnet 4.6 plus one Gemini 3.1 Pro call). **≈ $0.85 total.** Expected terminal: `Halt - Conform Required` (25 fps native) with the §4.2 command — that proves preflight, ceiling-gated approval, exact gate and the no-retry rule at $0.85. A true 4K proof adds ≥ $8.92 for one flux chunk and is additionally blocked on the unbuilt route above.

### Proof-run inputs (WF-B `dfs7PNjfoTZxzaw4`, form trigger; identical keys accepted by WF-A's webhook `POST /webhook/avatar-studio-run` minus `heygen_voice`)
```json
{"concept":"Why exactly-once delivery is a property of the consumer, not the broker: an idempotency key gives a replayed event a stable identity and a bounded replay window keeps the remembered-key set finite","expertise_anchor":"Payday Super event ingestion at the ATO - employer submissions replayed after partial batch failures, deduplicated on a composite payer-and-period key at the consumer inside a bounded replay window, coordinated across a SAFe train","portrait_url":"https://forgotten-mistory.web.app/assets/my_avatar.png","heygen_voice":"Andrew (English, male)","duration_seconds":"15","aspect_ratio":"16:9","delivery_profile":"WEB_PARITY","models":"heygen/avatar-iv","max_spend_usd":"2","notify_email":"sarkar.vikram@gmail.com"}
```
Before running: add OpenRouter credits (≥ $2 for this run), then `publish_workflow` on both IDs so the v9 versions go live.
