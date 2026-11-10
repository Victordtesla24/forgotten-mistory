'use client';

import { ArrowUpRight, Info, RefreshCw, TriangleAlert } from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { SUGGESTED_QUESTIONS } from '@/lib/assistant/suggestions';
import { cn } from '@/lib/cn';

import { AnswerText } from './AnswerText';
import type { AssistantMessage, Message } from './useConversation';

/** How close to the bottom, in px, still counts as following the conversation. */
const FOLLOW_DISTANCE = 80;

/** Space kept above the newest question when an exchange is taller than the log. */
const QUESTION_GAP = 16;

const EASE = [0.22, 1, 0.36, 1] as const;

interface MessageListProps {
  messages: Message[];
  busy: boolean;
  onAsk: (question: string) => void;
  onRetry: () => void;
}

/** Three dots that breathe while the first word is on its way; still under reduced motion. */
function Thinking() {
  const reduced = useReducedMotion();
  return (
    <p className="type-small flex items-center gap-1.5 py-1.5 text-muted">
      <VisuallyHidden>Mini Vic is writing</VisuallyHidden>
      {[0, 1, 2].map((dot) => (
        <m.span
          key={dot}
          aria-hidden="true"
          className="size-1.5 rounded-full bg-muted"
          animate={reduced ? undefined : { opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </p>
  );
}

/** What a reader should know about how this answer came to them, and whether to try again. */
function notice(message: AssistantMessage): { text: string; serious: boolean; retry: boolean } | null {
  switch (message.state) {
    case 'stopped':
      return { text: 'Stopped.', serious: false, retry: true };
    case 'failed':
      return { text: 'Something went wrong, so there is no answer yet.', serious: true, retry: true };
    case 'done':
      if (message.via === 'local') {
        return {
          text: 'The live assistant is not available right now, so this answer comes from a built-in summary of the CV.',
          serious: true,
          retry: true,
        };
      }
      return message.shortened
        ? {
            text: 'Short answer: this reply came over the slower route, which keeps answers brief.',
            serious: false,
            retry: false,
          }
        : null;
    case 'streaming':
      return null;
  }
}

function AssistantBubble({
  message,
  isLast,
  onRetry,
}: {
  message: AssistantMessage;
  isLast: boolean;
  onRetry: () => void;
}) {
  const note = notice(message);
  const Icon = note?.serious ? TriangleAlert : Info;
  return (
    <div className="grid min-w-0 max-w-full gap-1.5">
      <p className="type-eyebrow text-muted" aria-hidden="true">
        Mini Vic
      </p>
      <VisuallyHidden>Mini Vic says:</VisuallyHidden>
      {message.text === '' && message.state === 'streaming' ? (
        <Thinking />
      ) : (
        <AnswerText text={message.text} className="type-small text-text" />
      )}
      {note ? (
        <div className="type-small mt-1 grid gap-2 rounded-md border border-line bg-raised px-3 py-2 text-muted">
          <p className="flex items-start gap-2">
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{note.text}</span>
          </p>
          {note.retry && isLast ? (
            <Button variant="secondary" onClick={onRetry} className="justify-self-start">
              <RefreshCw aria-hidden="true" className="size-4" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Starters({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    <div className="grid gap-3 py-1">
      <p className="type-small text-muted">
        Ask about Vikram&rsquo;s experience, results or availability. For example:
      </p>
      <ul className="grid gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onAsk(question)}
              className="type-small flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-line bg-bg px-3 py-2 text-left transition-colors hover:border-line-strong hover:bg-raised"
            >
              {question}
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The conversation: a polite live region that follows the newest message while
 * the reader is at the bottom, and leaves them alone once they scroll up to read.
 * It is busy while an answer is arriving, so assistive technology announces the
 * finished answer rather than every fragment of it.
 */
export function MessageList({ messages, busy, onAsk, onRetry }: MessageListProps) {
  const reduced = useReducedMotion();
  const logRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  // Messages already on screen when the panel opens appear in place; only new ones enter.
  const present = useRef(new Set(messages.map((message) => message.id)));

  const last = messages.at(-1);
  const questions = messages.filter((message) => message.role === 'user').length;
  const askedBefore = useRef(questions);

  useLayoutEffect(() => {
    const log = logRef.current;
    if (!log) return;
    // A new question, or a fresh chat, puts the reader back at the newest message.
    if (questions !== askedBefore.current) {
      askedBefore.current = questions;
      following.current = true;
    }
    if (!following.current) return;
    // Follow the bottom, but never scroll the newest question out of view: once an
    // exchange is taller than the log, the reader starts at its beginning.
    const asked = log.querySelectorAll<HTMLElement>('[data-role="user"]');
    const newest = asked.item(asked.length - 1);
    const bottom = log.scrollHeight - log.clientHeight;
    log.scrollTop = newest ? Math.min(bottom, newest.offsetTop - QUESTION_GAP) : bottom;
  }, [messages, questions]);

  return (
    <div
      ref={logRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-busy={busy}
      aria-label="Conversation with Mini Vic"
      tabIndex={0}
      onScroll={(event) => {
        const log = event.currentTarget;
        following.current = log.scrollHeight - log.scrollTop - log.clientHeight < FOLLOW_DISTANCE;
      }}
      className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 focus-visible:-outline-offset-2 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]"
    >
      {messages.length === 0 ? <Starters onAsk={onAsk} /> : null}
      <ol className="grid gap-5">
        {messages.map((message) => (
          <m.li
            key={message.id}
            data-role={message.role}
            initial={reduced || present.current.has(message.id) ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role === 'user' ? (
              <div className="type-small max-w-[85%] rounded-md border border-line bg-accent-soft px-3 py-2 text-text">
                <VisuallyHidden>You said:</VisuallyHidden>
                <p className="max-w-none wrap-anywhere whitespace-pre-line">{message.text}</p>
              </div>
            ) : (
              <AssistantBubble message={message} isLast={message === last} onRetry={onRetry} />
            )}
          </m.li>
        ))}
      </ol>
    </div>
  );
}
