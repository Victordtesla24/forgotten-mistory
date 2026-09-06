/**
 * build-timings.mjs — fold the per-run probe files into timings.json (task t_w3_m4r).
 *
 * Reads every NN-*.json this directory holds, groups them by route, and applies the
 * gate rule from the task spec: PASS only if the first token is under 1 500 ms on
 * BOTH routes in the cold (no warm-prime) run. Nothing here re-measures anything;
 * it only arranges numbers that are already on disk.
 *
 * `buffered` is derived, not asserted: a reply whose whole delta set lands inside
 * 50 ms of the first body byte was held by the edge and released in one piece.
 * (The probe's own stricter `buffered` field wants exact equality of two
 * millisecond stamps and reads false on a 1 ms spread, so it is recomputed here.)
 */
import fs from "node:fs";

const dir = new URL(".", import.meta.url).pathname;
const BAR_MS = 1500;

const files = fs
  .readdirSync(dir)
  .filter((f) => /^\d\d-.*\.json$/.test(f))
  .sort();

const rows = files.map((f) => {
  const d = JSON.parse(fs.readFileSync(dir + f, "utf8"));
  const bufferedDerived =
    d.firstChunkMs !== null &&
    d.lastTokenMs !== null &&
    d.lastTokenMs - d.firstChunkMs <= 50 &&
    d.totalMs - (d.firstTokenMs ?? 0) <= 50;
  return {
    file: f,
    label: d.label,
    at: d.at,
    target: d.target,
    warm: d.warmPrimed,
    warm_status: d.warmStatus,
    warm_ms: d.warmMs,
    status: d.status,
    content_type: d.contentType,
    first_byte_s: d.firstChunkMs === null ? null : d.firstChunkMs / 1000,
    first_token_s: d.firstTokenMs === null ? null : d.firstTokenMs / 1000,
    last_token_s: d.lastTokenMs === null ? null : d.lastTokenMs / 1000,
    total_s: d.totalMs === null ? null : d.totalMs / 1000,
    deltas: d.deltas,
    chars: d.chars,
    route: d.route,
    max_tokens: d.max_tokens,
    provider: d.provider,
    model: d.model,
    attempts: d.attempts,
    ladder_walked: Array.isArray(d.attempts)
      ? d.attempts.some((a) => a.outcome !== "answered" && a.ms > 0)
      : null,
    buffered: bufferedDerived,
    under_bar: d.firstTokenMs !== null && d.firstTokenMs < BAR_MS,
    answer_raw_tail: String(d.answer || "").slice(-80),
    error: d.error,
  };
});

const origin = rows.filter((r) => r.target === "origin");
const hosting = rows.filter((r) => r.target === "hosting");
const coldOrigin = origin.filter((r) => !r.warm);
const coldHosting = hosting.filter((r) => !r.warm);
const worst = (list) => (list.length ? Math.max(...list.map((r) => r.first_token_s)) : null);

const verdict =
  coldOrigin.length && coldHosting.length && coldOrigin.every((r) => r.under_bar) && coldHosting.every((r) => r.under_bar)
    ? "PASS"
    : "FAIL";

const out = {
  task: "t_w3_m4r",
  gap: "G-M4",
  reviewer: "rev-w3-m4 (independent; wrote none of the code under test)",
  built_at: new Date().toISOString(),
  live_build_commit: "83590944",
  live_url: "https://forgotten-mistory.web.app",
  origin_url: "https://minivicchat-hjdyjsrzvq-uc.a.run.app",
  bar_ms: BAR_MS,
  rule: "PASS only if first token < 1.5 s on BOTH routes in the cold (no warm-prime) run",
  origin,
  hosting,
  summary: {
    origin_cold_worst_first_token_s: worst(coldOrigin),
    hosting_cold_worst_first_token_s: worst(coldHosting),
    origin_warm_worst_first_token_s: worst(origin.filter((r) => r.warm)),
    hosting_warm_worst_first_token_s: worst(hosting.filter((r) => r.warm)),
  },
  disclosure_text: "· short answer on the proxy route",
  verdict,
};

fs.writeFileSync(dir + "timings.json", `${JSON.stringify(out, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      verdict,
      runs: rows.length,
      origin_cold: coldOrigin.map((r) => [r.label, r.first_token_s, r.under_bar]),
      hosting_cold: coldHosting.map((r) => [r.label, r.first_token_s, r.under_bar]),
      origin_warm: origin.filter((r) => r.warm).map((r) => [r.label, r.first_token_s, r.under_bar]),
      hosting_warm: hosting.filter((r) => r.warm).map((r) => [r.label, r.first_token_s, r.under_bar]),
      buffered: rows.map((r) => [r.label, r.buffered]),
      ladder_walked: rows.map((r) => [r.label, r.ladder_walked]),
    },
    null,
    2,
  ),
);
