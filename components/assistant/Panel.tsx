'use client';

import { SquarePen, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { warmAssistant } from '@/lib/assistant/client';

import { Composer } from './Composer';
import { MessageList } from './MessageList';
import type { Conversation } from './useConversation';

interface PanelProps {
  conversation: Conversation;
  draft: string;
  onDraftChange: (draft: string) => void;
  onClose: () => void;
  titleId: string;
  noteId: string;
}

/**
 * Put focus where the reader's next move is. A keyboard or mouse user types into
 * the box; on a touch screen that would raise the keyboard over the answer, so
 * focus goes to the title instead, which keeps it inside the panel.
 */
function focusReader(input: HTMLTextAreaElement | null, title: HTMLHeadingElement | null) {
  if (window.matchMedia('(pointer: fine)').matches) input?.focus();
  else title?.focus({ preventScroll: true });
}

/**
 * What is inside the dialog: the header, the conversation and the question box.
 * It is mounted each time the panel opens, which is when the chat function is
 * warmed and focus is moved in.
 */
export function Panel({ conversation, draft, onDraftChange, onClose, titleId, noteId }: PanelProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { messages, busy, send, stop, retry, reset } = conversation;

  const focusNext = () => focusReader(inputRef.current, titleRef.current);

  useEffect(() => {
    warmAssistant();
    focusReader(inputRef.current, titleRef.current);
  }, []);

  const ask = (question: string) => {
    send(question);
    focusNext();
  };

  return (
    <>
      <header className="shrink-0 border-b border-line pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-3 pl-[max(1rem,env(safe-area-inset-left))]">
        <div className="flex items-center gap-2">
          <h2 ref={titleRef} id={titleId} tabIndex={-1} className="type-h3 min-w-0 flex-1 outline-none">
            Ask Mini Vic
          </h2>
          {messages.length > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                focusNext();
              }}
              className="min-w-11 shrink-0 px-3"
            >
              <SquarePen aria-hidden="true" className="size-4" />
              <span className="max-[360px]:sr-only">New chat</span>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 w-11 shrink-0 px-0"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>
        <p id={noteId} className="type-small text-muted">
          AI assistant — answers may be wrong; check the CV for anything that matters
        </p>
      </header>

      <MessageList
        messages={messages}
        busy={busy}
        onAsk={ask}
        onRetry={() => {
          retry();
          focusNext();
        }}
      />

      <Composer
        value={draft}
        onChange={onDraftChange}
        onSubmit={() => {
          if (send(draft)) onDraftChange('');
          focusNext();
        }}
        onStop={() => {
          stop();
          focusNext();
        }}
        busy={busy}
        inputRef={inputRef}
      />
    </>
  );
}
