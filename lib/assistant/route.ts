/**
 * Where a send goes, and in what order.
 *
 * The chat function is one deployment reachable two ways:
 *
 *   1. its Cloud Run origin (`https://<service>.a.run.app/`), whose server-sent
 *      event reply streams: first byte in roughly 0.7 s;
 *   2. `/api/chat`, the same function behind the Firebase Hosting rewrite. It is
 *      same-origin and reachable whenever the site is, but the edge buffers the
 *      whole reply, so the first byte is the last byte (roughly 1.8 s).
 *
 * The origin is tried first because a first word inside about 1.5 s needs the
 * stream. It is also the fragile route (cross-origin, subject to CORS and
 * corporate proxies, and its hostname changes if the service is recreated), so
 * the rewrite always sits behind it and answers with the real function. Nothing
 * here ever invents a reply.
 */

/** One rung of the ladder. */
export interface ChatRoute {
  /** Where a send POSTs to. */
  sendUrl: string;
  /** Where the warm-up GETs. It answers 204 and touches no model. */
  warmUrl: string;
  /** How long this route may take to produce response headers, or null for no limit. */
  firstByteTimeoutMs: number | null;
}

const HOSTING_CHAT_ENDPOINT = '/api/chat';

/**
 * How long the origin gets to produce response headers before the send is
 * handed to the rewrite.
 *
 * The function writes its stream headers on the first fragment, so this is a
 * first-token deadline, and it is cancelled the instant the headers land: a
 * stream that has begun is never discarded. It is sized to the cold path (the
 * serial walk of dead providers plus the answering one's first token, measured
 * at up to 2.6 s after a long idle) with margin. A warm origin answers in under
 * a second and never comes near it. The rewrite gets no such deadline, because
 * buffering means its headers legitimately arrive at the end of the reply.
 */
const DIRECT_FIRST_BYTE_TIMEOUT_MS = 3200;

/**
 * Is `value` something this client may send a visitor's question to? Narrow on
 * purpose: the origin arrives from build-time config, so a typo, a half-filled
 * variable or a URL with a path on it must degrade to the rewrite rather than
 * produce a request nobody intended.
 */
function isUsableChatOrigin(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  // The site is https, so anything else is a mixed-content block.
  if (url.protocol !== 'https:') return false;
  // Credentials have no business in a constant that ships to every browser.
  if (url.username || url.password) return false;
  // A path or a query would silently change what is being called.
  return url.pathname === '/' && !url.search && !url.hash;
}

/**
 * The ordered ladder for one send: the configured origin when it is usable,
 * then the Hosting rewrite, which is always present.
 *
 * The rewrite's send URL carries `route=hosting`, which tells the function it
 * came in through the buffering door and should keep its answer short. The
 * origin send stays a bare POST so its longer ceiling is untouched.
 */
export function buildChatRoutes(origin: string): ChatRoute[] {
  const routes: ChatRoute[] = [];
  if (isUsableChatOrigin(origin)) {
    const base = new URL(origin.trim()).origin;
    routes.push({
      sendUrl: `${base}/`,
      warmUrl: `${base}/?warm=1`,
      firstByteTimeoutMs: DIRECT_FIRST_BYTE_TIMEOUT_MS,
    });
  }
  routes.push({
    sendUrl: `${HOSTING_CHAT_ENDPOINT}?route=hosting`,
    warmUrl: `${HOSTING_CHAT_ENDPOINT}?warm=1`,
    firstByteTimeoutMs: null,
  });
  return routes;
}

/**
 * Drop the incomplete tail a hard output ceiling leaves behind.
 *
 * The rewrite route runs under a 48-token ceiling, and a ceiling does not
 * negotiate: a capped reply was measured ending "...and delivering over 95% of
 * the". A reader cannot tell a truncation from a model that lost its thread, so
 * the visible answer stops at the last sentence the model finished. Nothing is
 * added or rephrased. When the ceiling landed before any sentence ended, the
 * last closed clause is kept with an ellipsis, so the cut is visible rather than
 * passed off as a finished thought.
 */
export function trimCappedAnswer(text: string): string {
  const whole = text.trim();
  if (!whole) return whole;

  // A terminator only ends a sentence when whitespace or the end follows it, so
  // "95%." closes and "gpt-4.1-mini" does not.
  let end = -1;
  for (const match of whole.matchAll(/[.!?]["')\]]?(?=\s|$)/g)) {
    end = (match.index ?? 0) + match[0].length;
  }
  if (end > 0) {
    const kept = whole.slice(0, end).trim();
    // A reply that ends on a terminator was finished, however short. Otherwise one
    // surviving word and a full stop is not an answer, and a longer fragment is
    // more informative, so fall through to the clause cut.
    if (end === whole.length || kept.length >= 40) return kept;
  }

  const clause = whole.search(/[,;:](?=[^,;:]*$)/);
  if (clause >= 40) return `${whole.slice(0, clause)}…`;
  return `${whole.replace(/[\s,;:—-]+$/, '')}…`;
}
