'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

let lineCounter = 0;
const makeLine = (text: string, html = false): TerminalLine => ({ id: ++lineCounter, text, html });

/**
 * Hidden terminal easter egg. Opens via the Konami code or the footer
 * trigger; supports a small command set and traps focus in its input while
 * open.
 */
export default function HiddenTerminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    makeLine('Type help, sudo hire vic, stack, or try the Konami code.', true),
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
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

  // Keep the log scrolled to the latest line.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  const runCommand = useCallback((raw: string) => {
    const command = raw.trim().toLowerCase();
    if (!command) return;

    setLines((prev) => [...prev, makeLine(`vic@vikram.io:~$ ${raw}`)]);

    if (command === 'clear') {
      setLines([]);
      return;
    }
    if (command === 'exit') {
      setOpen(false);
      return;
    }
    const output = COMMANDS[command];
    if (output) {
      setLines((prev) => [...prev, ...output.map((text) => makeLine(text))]);
    } else {
      setLines((prev) => [
        ...prev,
        makeLine(`command not found: ${command}. Try 'help'.`),
      ]);
    }
  }, []);

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
        id="terminal-overlay"
        className={`terminal-overlay${open ? ' open' : ''}`}
        aria-hidden={!open}
        role="dialog"
        aria-label="Hidden terminal"
      >
        <div className="terminal-window">
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
            />
          </form>
        </div>
      </div>
    </>
  );
}
