'use client';

import { MessageCircle } from 'lucide-react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react';

import { ASSISTANT_OPEN_EVENT } from '@/components/site/openAssistant';
import { Button } from '@/components/ui/Button';

import { Panel } from './Panel';
import { useConversation } from './useConversation';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const LAUNCHER_ID = 'assistant-launcher';

/** Below this width the panel is a full-height sheet instead of a docked card. */
const SHEET_QUERY = '(width < 40rem)';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While the sheet is open, follow the visual viewport so the question box stays
 * above the on-screen keyboard, and stop the page behind it from scrolling.
 */
function useSheetViewport(dialogRef: RefObject<HTMLDialogElement | null>, active: boolean) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !active) return;
    const sheet = window.matchMedia(SHEET_QUERY);
    const viewport = window.visualViewport;
    const root = document.documentElement;

    const sync = () => {
      if (sheet.matches && viewport) {
        dialog.style.setProperty('--sheet-top', `${viewport.offsetTop}px`);
        dialog.style.setProperty('--sheet-height', `${viewport.height}px`);
      } else {
        dialog.style.removeProperty('--sheet-top');
        dialog.style.removeProperty('--sheet-height');
      }
      root.style.overflow = sheet.matches ? 'hidden' : '';
    };

    sync();
    sheet.addEventListener('change', sync);
    viewport?.addEventListener('resize', sync);
    viewport?.addEventListener('scroll', sync);
    return () => {
      sheet.removeEventListener('change', sync);
      viewport?.removeEventListener('resize', sync);
      viewport?.removeEventListener('scroll', sync);
      dialog.style.removeProperty('--sheet-top');
      dialog.style.removeProperty('--sheet-height');
      root.style.overflow = '';
    };
  }, [dialogRef, active]);
}

/**
 * Ask Mini Vic: a launcher fixed bottom-right and the chat panel it opens. The
 * panel is a native modal <dialog>, so it traps focus and closes on Escape; it
 * also opens on the page-wide 'assistant:open' event, which the header dispatches.
 * Mounted once in the layout, so the conversation lasts the page session.
 */
export default function Assistant() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pressedBackdropRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const conversation = useConversation();
  const reduced = useReducedMotion();
  const titleId = useId();
  const noteId = useId();

  useSheetViewport(dialogRef, open);

  const show = useCallback(() => {
    const element = dialogRef.current;
    if (!element) return;
    if (!element.open) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
      element.showModal();
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener(ASSISTANT_OPEN_EVENT, show);
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, show);
  }, [show]);

  /** Back to whatever opened the panel, or the launcher when that is gone or hidden. */
  const restoreFocus = () => {
    const opener = openerRef.current;
    const usable = opener?.isConnected && !opener.closest('dialog:not([open])');
    (usable ? opener : document.getElementById(LAUNCHER_ID))?.focus();
    openerRef.current = null;
  };

  /** Keep Tab inside the panel: past the last control it returns to the first, and back. */
  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !controls.some((control) => control === active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /**
   * A click on the backdrop lands on the dialog itself, since the panel fills it.
   * The press must start there too, so dragging a text selection out of the
   * question box and releasing outside does not close the panel.
   */
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (pressedBackdropRef.current && event.target === event.currentTarget) setOpen(false);
  };

  const motionProps = reduced
    ? { initial: false, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.2, ease: EASE } },
        transition: { duration: 0.32, ease: EASE },
      };

  return (
    <>
      <Button
        id={LAUNCHER_ID}
        size="lg"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="assistant-panel"
        onClick={show}
        className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 rounded-full px-5 shadow-float print:hidden"
      >
        <MessageCircle aria-hidden="true" className="size-5" />
        Ask Mini Vic
      </Button>

      <dialog
        ref={dialogRef}
        id="assistant-panel"
        aria-labelledby={titleId}
        aria-describedby={noteId}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => {
          setOpen(false);
          restoreFocus();
        }}
        onPointerDown={(event) => {
          pressedBackdropRef.current = event.target === event.currentTarget;
        }}
        onClick={closeOnBackdrop}
        onKeyDown={trapFocus}
        className="fixed top-auto right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] left-auto m-0 h-[38rem] max-h-[calc(100dvh-2rem)] w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-surface p-0 text-text shadow-float backdrop:bg-transparent max-sm:inset-x-0 max-sm:top-[var(--sheet-top,0px)] max-sm:bottom-auto max-sm:h-[var(--sheet-height,100dvh)] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-0"
      >
        <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
          {open ? (
            <m.div
              key="panel"
              animate={{ opacity: 1, y: 0, scale: 1 }}
              {...motionProps}
              className="flex h-full min-h-0 flex-col"
            >
              <Panel
                conversation={conversation}
                draft={draft}
                onDraftChange={setDraft}
                onClose={() => setOpen(false)}
                titleId={titleId}
                noteId={noteId}
              />
            </m.div>
          ) : null}
        </AnimatePresence>
      </dialog>
    </>
  );
}
