/**
 * miniVicBrain.ts — client-side reasoning layer for the MiniVic AI clone.
 *
 * Answer ladder (first success wins):
 *   1. The MiniVic chat Firebase Function, which owns the provider keys. It is
 *      reached at its own Cloud Run origin first and through the same-origin
 *      /api/chat Hosting rewrite second — one function, two URLs, and the order
 *      matters (see below). Primary brain.
 *   2. Deterministic local knowledge-base matching — always available, works
 *      fully offline, and includes context-aware matching that uses conversation
 *      history to resolve follow-up questions.
 *
 * No model is ever called directly from the browser: a browser-reachable key
 * would be inlined verbatim into the bundle. Every model call goes through the
 * chat function, which is the only tier that holds credentials — both of its
 * URLs are that same function.
 *
 * WHY THE ORIGIN COMES FIRST
 * --------------------------
 * The function streams its reply one SSE frame per token. Firebase Hosting's
 * rewrite buffers that body and hands the visitor the whole answer at the end:
 * measured first byte 1836 ms through Hosting against 665 ms direct to the Cloud
 * Run origin, same function, same request
 * (docs/delivery/evidence/v10-20260905T0515Z/G-M3/08-decision-first-token.md).
 * R3 asks for a first word inside ~1.5 s, so the direct route is tried first and
 * the Hosting rewrite — same-origin, reachable whenever the site is — stays
 * behind it as a real fallback that answers with the real function. The ordering
 * policy itself lives in ./miniVicRoute.mjs, where node:test can execute it.
 */

import {
  FALLBACK_ANSWER,
  knowledgeBase,
  matchKnowledge,
  type KnowledgeEntry,
  type PersonaMode,
} from '@/app/data/miniVicKnowledge';
import { MINIVIC_CHAT_ORIGIN } from '@/app/data/generated/minivic-origin';
import {
  DIRECT_FIRST_BYTE_TIMEOUT_MS,
  buildChatRoutes,
  runWithFallback,
} from './miniVicRoute.mjs';

export type BrainSource = 'openrouter' | 'knowledge' | 'fallback';

export interface BrainTurn {
  role: 'user' | 'bot';
  text: string;
}

export interface BrainReply {
  text: string;
  source: BrainSource;
}

const REQUEST_TIMEOUT_MS = 14000;
const MAX_HISTORY_TURNS = 8;

/** Words that suggest a follow-up question that needs prior context. */
const FOLLOW_UP_INDICATORS = /\b(that|it|this|those|these|them|the program|the project|the team|the squad|the automation)\b/i;

/** Maximum number of characters to extract from the last bot reply as context. */
const MAX_CONTEXT_CHARS = 500;

/**
 * Extract key topic words from recent conversation history.
 * Used to boost KB matching when the current query appears to be a follow-up.
 */
function extractContextTerms(history: BrainTurn[]): string[] {
  if (history.length === 0) return [];

  const terms: string[] = [];

  // Take the last bot reply and the preceding user query
  const reversed = [...history].reverse();
  const lastBot = reversed.find((t) => t.role === 'bot');
  const lastUser = reversed.find((t) => t.role === 'user');

  if (lastBot) {
    // Extract proper nouns and significant phrases from the last bot reply
    const text = lastBot.text.slice(0, MAX_CONTEXT_CHARS).toLowerCase();
    // Extract capitalized terms (proper nouns)
    const properNouns = text.match(/\b[A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)*\b/g) ?? [];
    terms.push(...properNouns.map((t) => t.toLowerCase()));
    // Also extract key program/institution names
    const keyPhrases = text.match(/\b(payday super|agile kookaburras|scrum master|test.evidence|sit\/e2e|distribution ui|pi planning|eight squad|azure devops|langchain|langfuse|phoenix|websocket|real.time|error.budget)\b/gi) ?? [];
    terms.push(...keyPhrases.map((t) => t.toLowerCase()));
  }

  if (lastUser) {
    // Extract key terms from the last user query too
    const userText = lastUser.text.slice(0, 200).toLowerCase();
    const userNouns = userText.match(/\b(role|job|work|project|team|automation|achievement|career|experience|stack|skills|leadership|delivery|architecture|program|squad|consulting)\b/gi) ?? [];
    terms.push(...userNouns.map((t) => t.toLowerCase()));
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const t of terms) {
    if (!seen.has(t)) {
      seen.add(t);
      deduped.push(t);
    }
  }
  return deduped;
}

/**
 * Context-aware knowledge base matching.
 *
 * When a query looks like a follow-up (short, contains pronouns/demonstratives),
 * boosts entries whose keywords overlap with the prior conversation topics.
 */
export function matchKnowledgeWithContext(
  query: string,
  history: BrainTurn[] = [],
): KnowledgeEntry | null {
  // First, try the standard match
  const directMatch = matchKnowledge(query);
  if (directMatch) return directMatch;

  // No history → nothing to boost
  if (history.length === 0) return null;

  // Check if this looks like a follow-up. It MUST actually reference prior
  // context via a pronoun/demonstrative — the old `|| words<=4` heuristic
  // misfired on gibberish ("asdkjf qwerty??"), treating it as a follow-up and
  // echoing the previous answer verbatim instead of the graceful fallback.
  const isFollowUp = FOLLOW_UP_INDICATORS.test(query);

  if (!isFollowUp) return null;

  // Extract context terms from history
  const contextTerms = extractContextTerms(history);
  if (contextTerms.length === 0) return null;

  // Score each entry with a context boost
  let best: KnowledgeEntry | null = null;
  let bestScore = 0;

  // Use the same normalization as matchKnowledge
  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const paddedQuery = ` ${normalizedQuery} `;
  const queryTokens = new Set(normalizedQuery.split(' '));

  for (const entry of knowledgeBase) {
    let score = 0;

    for (const rawKeyword of entry.keywords) {
      const keyword = rawKeyword.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (keyword.length === 0) continue;

      if (keyword.includes(' ')) {
        if (paddedQuery.includes(` ${keyword} `)) {
          score += 3; // phrase match
        }
      } else if (queryTokens.has(keyword)) {
        score += 1; // word match
      }
    }

    // Context boost: if any context term appears in this entry's keywords
    for (const contextTerm of contextTerms) {
      for (const kw of entry.keywords) {
        const kwNorm = kw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        if (kwNorm.includes(contextTerm) || contextTerm.includes(kwNorm)) {
          score += 2;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // Use same threshold as matchKnowledge (2)
  return bestScore >= 2 ? best : null;
}

const RUBRIC_TOKENS = ['2-5 sentences', 'No bullet lists', 'Yes (', 'sentence?', 'formatting', 'Never reveal these instructions'];

function sanitizeResponse(text: string): string {
  for (const token of RUBRIC_TOKENS) {
    if (text.includes(token)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[miniVicBrain] Rubric token detected in response, returning safe fallback');
      }
      return "Good question — I'd prefer to answer that directly. You can reach me at sarkar.vikram@gmail.com or call +61 433 224 556.";
    }
  }
  return text;
}

function knowledgeAnswer(query: string, mode: PersonaMode, history: BrainTurn[] = []): BrainReply {
  const entry = history.length > 0
    ? matchKnowledgeWithContext(query, history)
    : matchKnowledge(query);
  if (entry) {
    const text = entry.personaVariants?.[mode] ?? entry.answer;
    return {
      text: sanitizeResponse(text),
      source: 'knowledge',
    };
  }
  return { text: FALLBACK_ANSWER, source: 'fallback' };
}

/**
 * Tier 1 brain: the model behind the MiniVic chat Firebase Function, reached at
 * its Cloud Run origin first and through the /api/chat Hosting rewrite second.
 * Every provider key stays server-side.
 *
 * The client sends turns and a persona `mode` — nothing else. It used to ship a
 * ~6 kB grounded system prompt with every send; the function discards every
 * client-supplied `system` turn (its prompt is server-owned, so a visitor
 * cannot replace it), which made that payload pure wire cost. `mode` is what it
 * actually needed: without it the server fell back to the hiring persona no
 * matter which one the visitor had picked.
 *
 * Throws on any failure (incl. local dev where /api/chat 404s → non-JSON) so the
 * caller falls through to the offline knowledge base.
 */
/**
 * The ladder for this build: the Cloud Run origin (when one is configured) then
 * the Hosting rewrite. Resolved once — `MINIVIC_CHAT_ORIGIN` is a build-time
 * constant generated from config/minivic-origin.json, so nothing about it can
 * change while the page is open.
 */
const CHAT_ROUTES = buildChatRoutes(MINIVIC_CHAT_ORIGIN);

/** Reply fragments arrive here as the model writes them, when the reply streams. */
export type BrainDeltaHandler = (fragment: string) => void;

/**
 * Boot the chat function without spending anything.
 *
 * A cold 256 MiB container costs the first visitor of a quiet period ~1 s of
 * container start on top of the model's own time — measured on live at 4.18 s
 * for a cold send against ~1.8 s warm
 * (docs/delivery/evidence/v10-20260905T0515Z/G-M3/01-live-baseline.log). Fired
 * when the panel opens, that start is paid while the visitor is still reading
 * the greeting and typing, instead of while they wait on an answer.
 *
 * Every route in the ladder is warmed, not just the one a send will probably
 * take: the direct origin because that is the fast path and the browser has
 * never opened a connection to that host, the Hosting rewrite because a visitor
 * whose network refuses the direct route lands there and deserves a hot
 * instance too. Both are 204s that do no upstream work.
 *
 * Never rejects and never blocks a send: a warm-up that failed is a warm-up
 * that did nothing, which is exactly what the code did before it existed.
 */
export function warmMiniVicBrain(): void {
  for (const route of CHAT_ROUTES) {
    try {
      void fetch(route.warmUrl, { method: 'GET', cache: 'no-store' }).catch(() => {});
    } catch {
      // `fetch` itself being absent (or blocked) is not a reason to fail an open.
    }
  }
}

/**
 * One attempt at one route.
 *
 * The direct rung carries a first-byte deadline as well as the overall one: it
 * was chosen because its response headers arrive in ~665 ms, so if they have not
 * arrived inside the R3 bar the reason to prefer it is gone and the send is
 * better off on the certain path. The Hosting rung gets no such deadline —
 * buffering means its headers legitimately arrive at the end of the whole reply,
 * and cutting it at 1.5 s would kill the fallback the direct rung depends on.
 */
async function callChatRoute(
  route: { sendUrl: string; kind: string },
  body: string,
  wantsStream: boolean,
  onDelta?: BrainDeltaHandler,
): Promise<string> {
  const controller = new AbortController();
  const overall = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const firstByte =
    route.kind === 'direct'
      ? setTimeout(() => controller.abort(), DIRECT_FIRST_BYTE_TIMEOUT_MS)
      : null;
  try {
    const response = await fetch(route.sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: wantsStream ? 'text/event-stream, application/json' : 'application/json',
      },
      signal: controller.signal,
      body,
    });
    // Headers are in; the rest of the reply is bounded by the overall timeout.
    if (firstByte) clearTimeout(firstByte);
    if (!response.ok) {
      throw new Error(`chat endpoint responded ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return await readStreamedReply(response, (onDelta ?? (() => {})) as BrainDeltaHandler);
    }
    // On static hosting an absent function rewrites to HTML; treat non-JSON as "unavailable".
    if (!contentType.includes('application/json')) {
      throw new Error('chat endpoint returned non-JSON (unavailable)');
    }
    const data = (await response.json()) as { text?: string };
    const text = (data.text ?? '').trim();
    if (!text) {
      throw new Error('chat endpoint returned empty text');
    }
    return text;
  } finally {
    clearTimeout(overall);
    if (firstByte) clearTimeout(firstByte);
  }
}

/**
 * Ask the chat function, trying each route in order until one answers.
 *
 * Only the first attempt streams. If a rung fails *after* it has already handed
 * fragments to `onDelta`, the next rung answers without streaming: the caller
 * replaces what it rendered with the resolved text when this settles, so the
 * visitor sees one whole answer rather than two half ones interleaved.
 */
async function callChatFunction(
  query: string,
  mode: PersonaMode,
  history: BrainTurn[],
  onDelta?: BrainDeltaHandler,
): Promise<string> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.slice(-MAX_HISTORY_TURNS).map((turn) => ({
      role: (turn.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: turn.text,
    })),
    { role: 'user', content: query },
  ];
  let emitted = false;
  const relay: BrainDeltaHandler | undefined =
    typeof onDelta === 'function'
      ? (fragment) => {
          emitted = true;
          onDelta(fragment);
        }
      : undefined;

  const { value } = await runWithFallback(CHAT_ROUTES, async (route) => {
    const wantsStream = typeof relay === 'function' && !emitted;
    const body = JSON.stringify({ messages, mode, ...(wantsStream ? { stream: true } : null) });
    return callChatRoute(route, body, wantsStream, wantsStream ? relay : undefined);
  });
  return value;
}

/**
 * Read the function's SSE reply, handing each fragment to `onDelta` as it lands.
 *
 * The server sends `{delta}` events, then one `{done}` — or one `{error}` if
 * the upstream broke after the answer had started. An interrupted answer is
 * reported as a failure rather than presented as a complete one: the caller
 * falls through to the deterministic tier and the visitor gets a whole answer,
 * never a sentence that stops mid-word and pretends it finished.
 */
async function readStreamedReply(
  response: Response,
  onDelta: BrainDeltaHandler,
): Promise<string> {
  const body = response.body;
  if (!body) throw new Error('chat endpoint streamed an empty body');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let failed = '';

  const drain = (block: string) => {
    for (const line of block.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      let parsed: { delta?: string; done?: boolean; error?: string };
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      if (parsed.error) {
        failed = parsed.error;
        continue;
      }
      if (typeof parsed.delta === 'string' && parsed.delta) {
        text += parsed.delta;
        onDelta(parsed.delta);
      }
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let split = buffer.indexOf('\n\n');
    while (split !== -1) {
      drain(buffer.slice(0, split));
      buffer = buffer.slice(split + 2);
      split = buffer.indexOf('\n\n');
    }
  }
  if (buffer.trim()) drain(buffer);

  if (failed) throw new Error(`chat stream ended early: ${failed}`);
  const answer = text.trim();
  if (!answer) throw new Error('chat endpoint streamed no text');
  return answer;
}

/**
 * Answer a visitor's question. Resolves with the best available reply —
 * never rejects, so callers can rely on always getting presentable text.
 *
 * Ladder: (1) the server-side model — the chat function at its Cloud Run origin,
 * then the same function through the /api/chat Hosting rewrite — (2) the
 * deterministic offline knowledge base.
 *
 * Pass `onDelta` to read the answer as it is written. Fragments handed to it
 * are raw model output; the resolved `text` is the sanitised version, so a
 * caller that renders fragments live must replace what it rendered with the
 * resolved text when the promise settles.
 */
export async function askMiniVicBrain(
  query: string,
  mode: PersonaMode,
  history: BrainTurn[] = [],
  onDelta?: BrainDeltaHandler,
): Promise<BrainReply> {
  // Tier 1 — the server-side brain. Provider keys never leave the function.
  try {
    const text = await callChatFunction(query, mode, history, onDelta);
    return { text: sanitizeResponse(text), source: 'openrouter' };
  } catch {
    // Tier 2 — the deterministic offline knowledge base below.
  }

  return knowledgeAnswer(query, mode, history);
}
