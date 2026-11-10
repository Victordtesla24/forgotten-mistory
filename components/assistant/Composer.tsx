'use client';

import { ArrowUp, Square } from 'lucide-react';
import { useId, useLayoutEffect, type KeyboardEvent, type RefObject } from 'react';

import { Button } from '@/components/ui/Button';
import { MAX_QUESTION_CHARS, prepareQuestion } from '@/lib/assistant/client';

/** The input grows to this many lines, then scrolls. */
const MAX_ROWS = 4;

/** The counter appears once this few characters remain. */
const COUNTER_THRESHOLD = 400;

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  /** An answer is arriving: sending is off and stopping is on. */
  busy: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

/** The question box: Enter sends, Shift+Enter makes a new line, and it grows to four lines. */
export function Composer({ value, onChange, onSubmit, onStop, busy, inputRef }: ComposerProps) {
  const hintId = useId();
  const canSend = !busy && prepareQuestion(value) !== null;
  const remaining = MAX_QUESTION_CHARS - value.length;

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    const line = parseFloat(getComputedStyle(input).lineHeight);
    input.style.height = `${Math.min(input.scrollHeight, line * MAX_ROWS)}px`;
  }, [value, inputRef]);

  const submit = () => {
    if (canSend) onSubmit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="shrink-0 border-t border-line pt-3 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]"
    >
      <div className="flex items-end gap-2 rounded-md border border-line-strong bg-bg py-1 pr-1 pl-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_QUESTION_CHARS}
          enterKeyHint="send"
          aria-label="Your question for Mini Vic"
          aria-describedby={hintId}
          placeholder="Ask about Vikram’s experience"
          className="min-w-0 flex-1 resize-none self-center bg-transparent py-1 text-base leading-6 text-text outline-none placeholder:text-muted"
        />
        {busy ? (
          <Button
            variant="secondary"
            aria-label="Stop"
            onClick={onStop}
            className="w-11 shrink-0 px-0"
          >
            <Square aria-hidden="true" className="size-4 fill-current" />
          </Button>
        ) : null}
        <Button type="submit" aria-label="Send" disabled={!canSend} className="w-11 shrink-0 px-0">
          <ArrowUp aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <div className="type-meta mt-2 flex items-center justify-between gap-3 text-muted">
        <span id={hintId} className="hidden pointer-fine:inline">
          Enter to send, Shift+Enter for a new line
        </span>
        {remaining <= COUNTER_THRESHOLD ? (
          <span className="ml-auto">
            {value.length.toLocaleString('en-AU')} / {MAX_QUESTION_CHARS.toLocaleString('en-AU')}
          </span>
        ) : null}
      </div>
    </form>
  );
}
