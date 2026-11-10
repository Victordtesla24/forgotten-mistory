'use client';

import { useEffect, useReducer, useRef } from 'react';

import { askAssistant, prepareQuestion } from '@/lib/assistant/client';
import type { ChatTurn } from '@/lib/assistant/types';

interface UserMessage {
  id: string;
  role: 'user';
  text: string;
}

/**
 * Where an answer stands. `streaming` covers the wait before the first word as
 * well as the words arriving; `stopped` is the reader's own stop; `failed` is
 * anything unexpected that ended the send.
 */
type AnswerState = 'streaming' | 'done' | 'stopped' | 'failed';

export interface AssistantMessage {
  id: string;
  role: 'assistant';
  text: string;
  state: AnswerState;
  /** `local` means the live assistant could not be reached and the built-in knowledge answered. */
  via: 'live' | 'local';
  /** The slower route answered under a smaller output ceiling, so the answer is short on purpose. */
  shortened: boolean;
}

export type Message = UserMessage | AssistantMessage;

type Action =
  | { type: 'send'; userId: string; text: string; answerId: string }
  | { type: 'retry'; answerId: string }
  | { type: 'delta'; id: string; text: string }
  | { type: 'reply'; id: string; text: string; via: 'live' | 'local'; shortened: boolean }
  | { type: 'end'; id: string; state: 'stopped' | 'failed' }
  | { type: 'reset' };

function pending(id: string): AssistantMessage {
  return { id, role: 'assistant', text: '', state: 'streaming', via: 'live', shortened: false };
}

/** Change one answer that is still streaming; anything already settled is left alone. */
function whileStreaming(
  messages: Message[],
  id: string,
  change: (message: AssistantMessage) => AssistantMessage,
): Message[] {
  return messages.map((message) =>
    message.id === id && message.role === 'assistant' && message.state === 'streaming'
      ? change(message)
      : message,
  );
}

function reducer(messages: Message[], action: Action): Message[] {
  switch (action.type) {
    case 'send':
      return [
        ...messages,
        { id: action.userId, role: 'user', text: action.text },
        pending(action.answerId),
      ];
    case 'retry': {
      const lastQuestion = messages.findLastIndex((message) => message.role === 'user');
      return [...messages.slice(0, lastQuestion + 1), pending(action.answerId)];
    }
    case 'delta':
      return whileStreaming(messages, action.id, (message) => ({
        ...message,
        text: message.text + action.text,
      }));
    case 'reply':
      return whileStreaming(messages, action.id, (message) => ({
        ...message,
        text: action.text,
        state: 'done',
        via: action.via,
        shortened: action.shortened,
      }));
    case 'end':
      return whileStreaming(messages, action.id, (message) => ({ ...message, state: action.state }));
    case 'reset':
      return [];
  }
}

/** The turns the function is shown: questions, and the answers that finished. */
function toTurns(messages: readonly Message[]): ChatTurn[] {
  return messages.flatMap<ChatTurn>((message) => {
    if (message.role === 'user') return [{ role: 'user', content: message.text }];
    return message.state === 'done' ? [{ role: 'assistant', content: message.text }] : [];
  });
}

export interface Conversation {
  messages: Message[];
  /** An answer is on its way. */
  busy: boolean;
  /** Ask a question. Returns whether it was sent: nothing is sent when empty or while busy. */
  send: (raw: string) => boolean;
  /** Stop the answer that is on its way, keeping what has arrived. */
  stop: () => void;
  /** Ask the last question again, replacing its answer. */
  retry: () => void;
  /** Forget the conversation and start again. */
  reset: () => void;
}

/**
 * The conversation for the page session. It lives in memory only: it survives
 * the panel closing and opening, and is gone on reload.
 */
export function useConversation(): Conversation {
  const [messages, dispatch] = useReducer(reducer, []);
  const controller = useRef<AbortController | null>(null);
  const counter = useRef(0);

  const last = messages.at(-1);
  const busy = last?.role === 'assistant' && last.state === 'streaming';

  useEffect(() => () => controller.current?.abort(), []);

  const nextId = () => {
    counter.current += 1;
    return `message-${counter.current}`;
  };

  const run = async (turns: ChatTurn[], answerId: string) => {
    const abort = new AbortController();
    controller.current = abort;
    try {
      for await (const event of askAssistant(turns, abort.signal)) {
        dispatch(
          event.type === 'delta'
            ? { type: 'delta', id: answerId, text: event.text }
            : {
                type: 'reply',
                id: answerId,
                text: event.text,
                via: event.via,
                shortened: event.shortened,
              },
        );
      }
      // An answer that is still streaming here ended without a reply: it was aborted.
      dispatch({ type: 'end', id: answerId, state: 'stopped' });
    } catch {
      dispatch({ type: 'end', id: answerId, state: 'failed' });
    }
  };

  const send = (raw: string) => {
    const question = prepareQuestion(raw);
    if (question === null || busy) return false;
    const answerId = nextId();
    dispatch({ type: 'send', userId: nextId(), text: question, answerId });
    void run([...toTurns(messages), { role: 'user', content: question }], answerId);
    return true;
  };

  const retry = () => {
    const lastQuestion = messages.findLastIndex((message) => message.role === 'user');
    const question = messages[lastQuestion];
    if (busy || question?.role !== 'user') return;
    const answerId = nextId();
    dispatch({ type: 'retry', answerId });
    void run(
      [...toTurns(messages.slice(0, lastQuestion)), { role: 'user', content: question.text }],
      answerId,
    );
  };

  const stop = () => {
    controller.current?.abort();
    if (last?.role === 'assistant') dispatch({ type: 'end', id: last.id, state: 'stopped' });
  };

  const reset = () => {
    controller.current?.abort();
    dispatch({ type: 'reset' });
  };

  return { messages, busy, send, stop, retry, reset };
}
