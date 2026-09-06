/**
 * miniVicRoute.mjs — where a MiniVic send goes, and in what order.
 *
 * This is the *policy* half of the send path, kept free of `fetch`, React and
 * TypeScript so `node --test tests/minivic_chat_route.test.mjs` can execute it
 * directly rather than assert about its source text. `lib/miniVicBrain.ts`
 * supplies the transport (`attempt`); everything about which URL is tried, when
 * a URL is eligible at all, and what happens when one fails lives here.
 *
 * WHY THERE ARE TWO ROUTES
 * ------------------------
 * The MiniVic chat function is one deployment reachable two ways:
 *
 *   1. `https://<service>.a.run.app/` — the Cloud Run origin. Its SSE reply
 *      streams: measured first byte 665 ms (P50, n=5).
 *   2. `/api/chat` — the same function through the Firebase Hosting rewrite.
 *      Same-origin, always reachable when the site is, and the edge buffers the
 *      whole SSE body: measured first byte 1836 ms (P50, n=5), which is also the
 *      last byte.
 *
 * (docs/delivery/evidence/v10-20260905T0515Z/G-M3/08-decision-first-token.md.)
 *
 * R3 asks for a first word inside ~1.5 s, so (1) is tried first. (1) is also the
 * fragile one — a cross-origin request to a deploy-specific hostname, subject to
 * CORS, corporate proxies and a URL that changes if the service is ever
 * recreated — so (2) is always behind it. The fallback answers with the real
 * function; it never invents a reply.
 */

/** The same-origin Hosting rewrite. Always the last rung, never removed. */
export const HOSTING_CHAT_ENDPOINT = '/api/chat';

/**
 * How long the direct rung gets to produce response headers before the send is
 * handed to the fallback.
 *
 * THIS IS NOT THE R3 BAR, and setting it to the bar was a bug. The function
 * writes its SSE headers on the FIRST FRAGMENT, not before the ladder runs
 * (functions/index.js `beginStream`), so this deadline is a first-*token*
 * deadline. On a cold cooldown map the origin's first token is 2 449 ms — the
 * serial walk of three dead rungs plus the model — so a 1 500 ms abort killed
 * the origin request on exactly the cold send the gate measures, and the
 * visitor paid 1 500 ms of aborted request AND the buffered Hosting fallback in
 * full: worse than either route alone (adversarial review F2/F1,
 * docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/08-adversarial-review.md).
 *
 * The policy is now: the origin stays primary and gets a budget derived from
 * that measured cold walk — 3 200 ms — and the budget is cancelled the instant
 * the response headers land, which for this function means the instant the first
 * token is on the wire. A stream that has begun is therefore never discarded;
 * only an origin that has produced nothing at all by the end of the cold walk
 * is abandoned, and abandoning it then is right because it has no answer to
 * lose. The warm path is untouched: a warm origin's first token is 470–880 ms,
 * nowhere near this ceiling, so nobody waits 2 600 ms for a route that works.
 */
export const DIRECT_FIRST_BYTE_TIMEOUT_MS = 3200;

/*
 * Why 3 200 and not 2 600. The first pass took the reviewer's 2 449 ms as the
 * worst cold first token and set 2 600. Re-measured on 2026-09-06 after a
 * strict ≥10-minute idle against the redeployed function
 * (docs/delivery/evidence/v10-20260905T0515Z/W1-R2C/07-first-token-strictcold.json),
 * the first post-idle origin send came back at **2 626 ms** — 26 ms past that
 * budget, which would have aborted it and paid the Hosting fallback on top:
 * the exact defect, moved 1.1 s later. The bound is not one sample, it is the
 * sum of the two things a cold send pays — the serial dead-rung walk (~1.67 s,
 * independently measured) plus the answering rung's own first token (P95 ~1.1 s
 * over the 14 samples in that file) ≈ 2.8 s — so the budget is 3 200 ms, that
 * sum with margin. It is only ever reached by an origin that has produced
 * NOTHING; six of those seven cold sends first-tokened in 465–1 408 ms and the
 * three warm ones in 488–714 ms, none of which comes near it.
 */

/**
 * Is `value` something this client may send a visitor's question to?
 *
 * Deliberately narrow. The origin arrives from build-time config, so a typo, a
 * half-filled environment variable or a copied URL with a path on it must
 * degrade to the Hosting rewrite rather than produce a request nobody intended.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isUsableChatOrigin(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  // https only: the site is https, so anything else is a mixed-content block.
  if (url.protocol !== 'https:') return false;
  // Credentials have no business in a constant that ships to every browser.
  if (url.username || url.password) return false;
  // A path or a query would silently change what is being called.
  if (url.pathname !== '/' || url.search || url.hash) return false;
  return true;
}

/**
 * @typedef {object} ChatRoute
 * @property {'origin'|'hosting'} id
 * @property {'direct'|'rewrite'} kind
 * @property {string} sendUrl  URL a send POSTs to.
 * @property {string} warmUrl  URL the warm ping GETs.
 * @property {boolean} crossOrigin Whether the browser will treat it as CORS.
 */

/**
 * The ordered ladder for one send.
 *
 * @param {unknown} origin The configured Cloud Run origin, or anything at all.
 * @returns {ChatRoute[]} Always at least the Hosting rewrite.
 */
export function buildChatRoutes(origin) {
  /** @type {ChatRoute[]} */
  const routes = [];
  if (isUsableChatOrigin(origin)) {
    const base = new URL(String(origin).trim()).origin;
    routes.push({
      id: 'origin',
      kind: 'direct',
      sendUrl: `${base}/`,
      warmUrl: `${base}/?warm=1`,
      crossOrigin: true,
    });
  }
  routes.push({
    id: 'hosting',
    kind: 'rewrite',
    sendUrl: HOSTING_CHAT_ENDPOINT,
    warmUrl: `${HOSTING_CHAT_ENDPOINT}?warm=1`,
    crossOrigin: false,
  });
  return routes;
}

/**
 * Try each route in order until one produces a value.
 *
 * Every failure is kept and reported — a rung that failed is a fact about the
 * deployment, not noise to swallow. When *every* rung fails this rejects: the
 * caller (`askMiniVicBrain`) then falls through to the deterministic knowledge
 * tier, so the visitor still gets a whole, true answer. Resolving with
 * something invented here would be the one outcome that is never acceptable.
 *
 * @template T
 * @param {ChatRoute[]} routes
 * @param {(route: ChatRoute) => Promise<T>} attempt
 * @returns {Promise<{value: T, route: ChatRoute, failures: Array<{route: ChatRoute, error: unknown}>}>}
 */
export async function runWithFallback(routes, attempt) {
  const failures = [];
  for (const route of routes) {
    try {
      const value = await attempt(route);
      return { value, route, failures };
    } catch (error) {
      failures.push({ route, error });
    }
  }
  const detail = failures
    .map(({ route, error }) => `${route.id}: ${error instanceof Error ? error.message : String(error)}`)
    .join('; ');
  throw new Error(`every chat route failed — ${detail || 'no routes were configured'}`);
}
