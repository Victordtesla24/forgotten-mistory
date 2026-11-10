'use client';

import { Menu, X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/Button';
import { site } from '@/content/site';
import { cn } from '@/lib/cn';

import { navItems } from './nav';
import { openAssistant } from './openAssistant';

/** The menu for narrow screens: a native modal <dialog> sheet with the same links. */
export function MobileMenu({ active, className }: { active: string | null; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 900px)');
    const closeWhenWide = () => {
      if (!wide.matches) return;
      dialogRef.current?.close();
      setOpen(false);
    };
    wide.addEventListener('change', closeWhenWide);
    return () => wide.removeEventListener('change', closeWhenWide);
  }, []);

  const show = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };

  return (
    <div className={className}>
      <Button
        variant="secondary"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={show}
      >
        <Menu aria-hidden="true" className="size-5" />
        <span className="max-[360px]:sr-only">Menu</span>
      </Button>
      <dialog
        ref={dialogRef}
        id="site-menu"
        aria-label="Site menu"
        onClose={() => setOpen(false)}
        className="menu-sheet fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-bg p-0 text-text open:block"
      >
        <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
          {open ? (
            <m.div
              key="sheet"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-dvh flex-col px-gutter pb-8"
            >
              <div className="flex h-header items-center justify-between">
                <span className="font-semibold tracking-tight">{site.name}</span>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  <X aria-hidden="true" className="size-5" />
                  Close
                </Button>
              </div>
              <nav aria-label="Menu" className="mt-6">
                <ul className="grid">
                  {navItems.map((item) => (
                    <li key={item.id} className="border-b border-line">
                      <a
                        href={`/#${item.id}`}
                        onClick={() => setOpen(false)}
                        aria-current={active === item.id ? 'location' : undefined}
                        className={cn(
                          'type-h3 flex min-h-14 items-center',
                          active === item.id ? 'text-accent' : 'text-text',
                        )}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto grid gap-3 pt-8">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setOpen(false);
                    openAssistant();
                  }}
                >
                  Ask Mini Vic
                </Button>
                <ButtonLink size="lg" href={`mailto:${site.channels.email}`}>
                  Email me
                </ButtonLink>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </dialog>
    </div>
  );
}
