/**
 * The assistant's client: sends a conversation to the chat function and yields
 * the reply, streamed when the function streams.
 *
 * The answer ladder, first success wins:
 *   1. the chat function at its Cloud Run origin, which streams;
 *   2. the same function through the same-origin /api/chat rewrite;
 *   3. the local knowledge base, which needs no network.
 *
 * No model is ever called from the browser. Every provider key stays inside the
 * function, so nothing reachable from here can leak one. See ./route.ts for why
 * the routes come in that order.
 */

import { localAnswer, sanitizeAnswer } from './local';
import { MINIVIC_CHAT_ORIGIN } from './origin';
import { buildChatRoutes, trimCappedAnswer, type ChatRoute } from './route';
import type { AssistantEvent, ChatTurn } from './types';

/** The function's limits, validated server-side before any model is called. */
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 16000;

/** The longest question the panel accepts: what the function keeps of one message. */
export const MAX_QUESTION_CHARS = MAX_MESSAGE_CHARS;

/** Prior turns sent along with the new question. */
const MAX_HISTORY_TURNS = 8;

/** The most a whole reply may take, streamed or not, on one route. */
const REQUEST_TIMEOUT_MS = 14000;

/** The function's default tone. The panel offers no persona choice. */
const PERSONA = 'hiring';

/** The ladder for this build. The origin is a build-time constant, so this is resolved once. */
const ROUTES = buildChatRoutes(MINIVIC_CHAT_ORIGIN);

/** What a visitor typed, made safe to send: trimmed and capped. Null when nothing is left. */
export function prepareQuestion(raw: string): string | null {
  const question = raw.trim().slice(0, MAX_QUESTION_CHARS).trimEnd();
  return question === '' ? null : question;
}

/**
 * Boot the chat function without spending anything. A cold container costs the
 * first visitor of a quiet period about a second on top of the model's own
 * time; fired when the panel opens, that start is paid while they read and type.
 *
 * Every route is warmed, since a visitor whose network refuses the direct one
 * lands on the rewrite and deserves a hot instance there too. The response is
 * read, not just fired: a fetch whose body is never consumed is cancelled by the
 * browser, and a cancelled ping primes nothing. Never rejects, never blocks.
 */
export function warmAssistant(): void {
  for (const route of ROUTES) {
    void fetch(route.warmUrl, { method: 'GET', cache: 'no-store', keepalive: true })
      .then((response) => response.arrayBuffer())
      .catch(() => {});
  }
}

/** The recent turns, trimmed so the request stays under the function's total ceiling. */
function windowOf(turns: readonly ChatTurn[]): ChatTurn[] {
  const recent = turns.slice(-(MAX_HISTORY_TURNS + 1)).map((turn) => ({
    role: turn.role,
    content: turn.content.slice(0, MAX_MESSAGE_CHARS),
  }));
  let total = recent.reduce((sum, turn) => sum + turn.content.length, 0);
  let start = 0;
  while (total > MAX_TOTAL_CHARS && start < recent.length - 1) {
    total -= recent[start].content.length;
    start += 1;
  }
  return recent.slice(start);
}

/**
 * One request's clock. A single controller carries the caller's abort, the
 * overall timeout and the route's first-byte deadline. The deadline is cancelled
 * the moment headers land, which for this function is the moment the first token
 * is on the wire, so a stream that has begun is never discarded.
 */
function openRequest(route: ChatRoute, caller: AbortSignal | undefined) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (caller?.aborted) abort();
  else caller?.addEventListener('abort', abort, { once: true });
  const overall = setTimeout(abort, REQUEST_TIMEOUT_MS);
  const firstByte =
    route.firstByteTimeoutMs === null ? null : setTimeout(abort, route.firstByteTimeoutMs);
  return {
    signal: controller.signal,
    headersReceived() {
      if (firstByte !== null) clearTimeout(firstByte);
    },
    close() {
      clearTimeout(overall);
      if (firstByte !== null) clearTimeout(firstByte);
      caller?.removeEventListener('abort', abort);
    },
  };
}

/** One frame of the function's event stream: a fragment, the end, or a failure after the start. */
interface StreamFrame {
  delta?: string;
  error?: string;
  route?: string;
}

/** A whole answer as it came off the wire. `route` is the front door the function says it answered on. */
interface WireReply {
  text: string;
  route: 'origin' | 'hosting' | null;
}

function parseFrame(line: string): StreamFrame | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const payload = trimmed.slice(5).trim();
  if (!payload) return null;
  try {
    return JSON.parse(payload) as StreamFrame;
  } catch {
    return null;
  }
}

/**
 * Read the function's event stream, yielding each fragment as it lands and
 * returning the whole answer. The function sends `{delta}` frames, then one
 * `{done}`, or one `{error}` if the upstream broke after the answer had begun.
 * An interrupted answer is a failure, never passed off as a finished one.
 */
async function* readStream(response: Response): AsyncGenerator<string, WireReply> {
  const body = response.body;
  if (!body) throw new Error('chat endpoint streamed an empty body');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let failure = '';
  let route: WireReply['route'] = null;

  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = done ? '' : (lines.pop() ?? '');
      for (const line of lines) {
        const frame = parseFrame(line);
        if (!frame) continue;
        if (frame.error) {
          failure = frame.error;
          continue;
        }
        if (frame.route === 'origin' || frame.route === 'hosting') route = frame.route;
        if (frame.delta) {
          text += frame.delta;
          yield frame.delta;
        }
      }
      if (done) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  if (failure) throw new Error(`chat stream ended early: ${failure}`);
  const answer = text.trim();
  if (!answer) throw new Error('chat endpoint streamed no text');
  return { text: answer, route };
}

async function readJson(response: Response): Promise<WireReply> {
  const data = (await response.json()) as { text?: string; route?: string };
  const text = (data.text ?? '').trim();
  if (!text) throw new Error('chat endpoint returned empty text');
  return { text, route: data.route === 'origin' || data.route === 'hosting' ? data.route : null };
}

/**
 * Answer the latest question in `turns`, which must end with it.
 *
 * Yields `delta` fragments while a streaming route writes, then one `reply`
 * (see AssistantEvent). It never throws on a network failure: when every route
 * fails the reply comes from the local knowledge base and says so with
 * `via: 'local'`. Aborting through `signal` ends the generator without a reply.
 *
 * Only an attempt that has not yet shown anything streams. If a route fails
 * after fragments were handed out, the next one answers whole and its reply
 * replaces them, so the reader sees one answer rather than two half ones.
 */
export async function* askAssistant(
  turns: readonly ChatTurn[],
  signal?: AbortSignal,
): AsyncGenerator<AssistantEvent> {
  const messages = windowOf(turns);
  let streamed = false;

  for (const route of ROUTES) {
    const request = openRequest(route, signal);
    try {
      const wantsStream = !streamed;
      const response = await fetch(route.sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: wantsStream ? 'text/event-stream, application/json' : 'application/json',
        },
        signal: request.signal,
        body: JSON.stringify({ messages, mode: PERSONA, ...(wantsStream ? { stream: true } : null) }),
      });
      request.headersReceived();
      if (!response.ok) throw new Error(`chat endpoint responded ${response.status}`);

      const contentType = response.headers.get('content-type') ?? '';
      let wire: WireReply;
      if (contentType.includes('text/event-stream')) {
        const fragments = readStream(response);
        let step = await fragments.next();
        while (!step.done) {
          streamed = true;
          yield { type: 'delta', text: step.value };
          step = await fragments.next();
        }
        wire = step.value;
      } else if (contentType.includes('application/json')) {
        wire = await readJson(response);
      } else {
        // Static hosting answers an absent function with HTML: treat it as unavailable.
        throw new Error('chat endpoint returned non-JSON (unavailable)');
      }

      const shortened = wire.route === 'hosting';
      yield {
        type: 'reply',
        text: sanitizeAnswer(shortened ? trimCappedAnswer(wire.text) : wire.text),
        via: 'live',
        shortened,
      };
      return;
    } catch {
      if (signal?.aborted) return;
    } finally {
      request.close();
    }
  }

  yield { type: 'reply', text: localAnswer(turns), via: 'local', shortened: false };
}
