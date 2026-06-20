'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

interface TerminalLine {
  id: number;
  html?: boolean;
  text: string;
}

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

const COMMANDS: Record<string, string[]> = {
  help: [
    'Available commands:',
    '  help            — this menu',
    '  stack           — current technology stack',
    '  sudo hire vic   — the only command that matters',
    '  whoami          — about the operator',
    '  clear           — clear the terminal',
    '  exit            — close the terminal',
  ],
  stack: [
    'Frontend  : Next.js 14 · React 18 · TypeScript · Framer Motion · R3F',
    'Backend   : Node.js · Python · Supabase/Postgres',
    'AI        : LangChain · Langfuse · Phoenix · Gemini · prompt engineering',
    'Mainframe : REXX · JCL · SDSF · SMF (ATO Payday Super test automation)',
    'Delivery  : Agile/Scrum/SAFe · Azure DevOps · PI planning',
  ],
  whoami: [
    'Vikram Deshpande — Scrum Master / Project Manager at the Australian',
    'Taxation Office (Payday Super program) and AI solutions architect.',
    '15+ years across government, finance, and telecommunications.',
  ],
  'sudo hire vic': [
    'Permission granted. Initiating recruitment sequence…',
    '→ Email: sarkar.vikram@gmail.com',
    '→ Phone: +61 433 224 556',
    'Response SLA: faster than the P95 latency target.',
  ],
};

const BURST_PARTICLES = 18;
let lineCounter = 0;
const makeLine = (text: string, html = false): TerminalLine => ({ id: ++lineCounter, text, html });

interface TypingState {
  text: string;
  shown: number;
}

/**
 * Hidden terminal easter egg. Opens via the Konami code or the footer trigger.
 * Command output types in one character at a time over a CRT scan-line overlay;
 * the arrow keys walk the command history; the Konami code opens the terminal
 * with a monochrome celebration burst. Under reduced motion the typewriter and
 * the scan-line sweep both fall away — output is printed at once and the surface
 * is static — while every command stays fully usable.
 */
export default function HiddenTerminal() {
  const prefersReducedMotion = useReducedMotionSafe();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    makeLine('Type help, sudo hire vic, stack, or try the Konami code.', true),
  ]);
  const [typingQueue, setTypingQueue] = useState<string[]>([]);
  const [typing, setTyping] = useState<TypingState | null>(null);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [burst, setBurst] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const konamiIndex = useRef(0);

  // Konami code listener (global).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const expected = KONAMI[konamiIndex.current];
      if (e.key === expected || e.key.toLowerCase() === expected) {
        konamiIndex.current += 1;
        if (konamiIndex.current === KONAMI.length) {
          konamiIndex.current = 0;
          setOpen(true);
          setLines((prev) => [...prev, makeLine('Konami code accepted. Welcome, player one.')]);
          setBurst(true);
        }
      } else {
        konamiIndex.current = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Escape closes; focus input on open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Remove the closed terminal from the tab order + accessibility tree so its input
  // is not focusable while aria-hidden (fixes axe aria-hidden-focus — TC-NFR-A11Y).
  useEffect(() => {
    if (overlayRef.current) overlayRef.current.inert = !open;
  }, [open]);

  // Keep the log scrolled to the latest line as it types.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines, typing]);

  // Per-character typewriter. Dequeues pending output lines and reveals each one
  // character at a time; reduced motion never enqueues, so this stays idle there.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    if (typing) {
      if (typing.shown >= typing.text.length) {
        setLines((prev) => [...prev, makeLine(typing.text)]);
        setTyping(null);
        return undefined;
      }
      const id = window.setTimeout(() => {
        setTyping((t) => (t ? { ...t, shown: t.shown + 1 } : t));
      }, 12);
      return () => window.clearTimeout(id);
    }
    if (typingQueue.length) {
      setTyping({ text: typingQueue[0], shown: 0 });
      setTypingQueue((prev) => prev.slice(1));
    }
    return undefined;
  }, [typing, typingQueue, prefersReducedMotion]);

  // Clear the celebration burst once it has played.
  useEffect(() => {
    if (!burst) return undefined;
    const id = window.setTimeout(() => setBurst(false), 2200);
    return () => window.clearTimeout(id);
  }, [burst]);

  const runCommand = useCallback(
    (raw: string) => {
      const command = raw.trim().toLowerCase();
      if (!command) return;

      setHistory((prev) => [...prev, raw]);
      setHistoryIndex(-1);
      setLines((prev) => [...prev, makeLine(`vic@vikram.io:~$ ${raw}`)]);

      if (command === 'clear') {
        setLines([]);
        setTyping(null);
        setTypingQueue([]);
        return;
      }
      if (command === 'exit') {
        setOpen(false);
        return;
      }
      const output = COMMANDS[command] ?? [`command not found: ${command}. Try 'help'.`];
      if (prefersReducedMotion) {
        setLines((prev) => [...prev, ...output.map((text) => makeLine(text))]);
      } else {
        setTypingQueue((prev) => [...prev, ...output]);
      }
    },
    [prefersReducedMotion],
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const idx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(idx);
      setInput(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const idx = historyIndex + 1;
      if (idx >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(idx);
        setInput(history[idx]);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className="terminal-trigger"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        ~/terminal
      </button>
      <div
        ref={overlayRef}
        id="terminal-overlay"
        className={`terminal-overlay${open ? ' open' : ''}`}
        aria-hidden={!open}
        role="dialog"
        aria-label="Hidden terminal"
      >
        <div className="terminal-window">
          <div className="terminal-scanline" data-terminal-scanline aria-hidden="true" />
          {burst && (
            <div className="konami-burst" data-konami-burst aria-hidden="true">
              {Array.from({ length: BURST_PARTICLES }, (_, i) => (
                <span
                  key={i}
                  className="burst-particle"
                  data-burst-particle
                  style={{ '--burst-angle': `${(360 / BURST_PARTICLES) * i}deg` } as React.CSSProperties}
                />
              ))}
            </div>
          )}
          <div className="terminal-bar">
            <div className="terminal-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="terminal-title">vikram.io // hidden terminal</div>
            <button type="button" id="terminal-close" aria-label="Close terminal" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="terminal-body" id="terminal-log" role="log" ref={logRef}>
            {lines.map((line) =>
              line.html ? (
                <div key={line.id} className="terminal-line">
                  Type <span className="accent">help</span>, <span className="accent">sudo hire vic</span>,{' '}
                  <span className="accent">stack</span>, or try the Konami code.
                </div>
              ) : (
                <div key={line.id} className="terminal-line">
                  {line.text}
                </div>
              ),
            )}
            {typing && (
              <div className="terminal-line terminal-line--typing">
                {typing.text.slice(0, typing.shown)}
                <span className="terminal-caret" aria-hidden="true" />
              </div>
            )}
          </div>
          <form
            id="terminal-form"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              runCommand(input);
              setInput('');
            }}
          >
            <span className="prompt">vic@vikram.io:~$</span>
            <input
              ref={inputRef}
              id="terminal-input"
              type="text"
              spellCheck={false}
              aria-label="Terminal input"
              placeholder="help | sudo hire vic | stack"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onInputKeyDown}
            />
          </form>
        </div>
      </div>
    </>
  );
}
