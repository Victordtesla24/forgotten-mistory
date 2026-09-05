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
 * handed to the fallback. It is the R3 bar itself: a direct route that has not
 * answered by then has already lost the thing it was chosen for, and the
 * buffered path — slower, but certain — is the better remaining bet.
 */
export const DIRECT_FIRST_BYTE_TIMEOUT_MS = 1500;

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
