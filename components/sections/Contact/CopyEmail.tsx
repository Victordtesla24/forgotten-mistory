'use client';

import { useState } from 'react';

import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';

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
 * `mailto:`. Once pressed the button says what happened, and goes on saying it, and a live region
 * says it to a screen reader; pressing it again copies again. Only script can operate it, so it is not on a page without script; the address is
 * always in the list beside it.
 */
export function CopyEmail({ address, label, done, failed, ...button }: CopyEmailProps) {
  const [said, setSaid] = useState('');

  /* The site is served over HTTPS only, where the clipboard is always there to ask; a browser that refuses is told so. */
  const copy = () =>
    navigator.clipboard.writeText(address).then(
      () => setSaid(done),
      () => setSaid(failed),
    );

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
