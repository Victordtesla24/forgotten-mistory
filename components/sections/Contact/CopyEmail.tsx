'use client';

import { useState } from 'react';

import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';

/** How long the button says what happened before it reads as the action again. */
const SETTLE_MS = 2400;

/** The pending return to the action's label; a second press starts the wait again. */
let settle: ReturnType<typeof setTimeout> | undefined;

interface CopyEmailProps {
  address: string;
  label: string;
  done: string;
  failed: string;
  /** How the button is drawn, said by the section so that it is in the page's HTML and not in its script. */
  variant: ButtonVariant;
  size: ButtonSize;
  className: string;
}

/**
 * Puts the email address on the clipboard, for a reader whose browser has no mail app behind
 * `mailto:`. The button says what happened for a moment, then reads as the action again, and a
 * live region says it to a screen reader, so a second press is answered like the first. A browser
 * with no clipboard to ask, or one that refuses, is told that copying is not available. Only script can operate it, so it is not on a page without script; the address is
 * always in the list beside it.
 */
export function CopyEmail({ address, label, done, failed, ...button }: CopyEmailProps) {
  const [said, setSaid] = useState('');

  const copy = async () => {
    let result = failed;
    try {
      await navigator.clipboard.writeText(address);
      result = done;
    } catch {
      // No clipboard, or a refusal: `result` already says so.
    }
    setSaid(result);
    clearTimeout(settle);
    settle = setTimeout(setSaid, SETTLE_MS, '');
  };

  return (
    <>
      <Button {...button} onClick={copy}>
        {said || label}
      </Button>
      <span role="status" className="sr-only">
        {said}
      </span>
    </>
  );
}
