#!/usr/bin/env node
/**
 * scripts/fm/dev.mjs — Forgotten Mistory dev server launcher.
 *
 * Thin wrapper that mirrors `npm run dev:raw` but adds the required env
 * for a consistent development experience.  Created 2026-06-27 to restore
 * the `npm run dev` path that Playwright's webServer depended on.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const CWD = resolve(import.meta.dirname ?? process.cwd(), '../..');
const args = process.argv.slice(2);

// Forward the full command to `next dev` with the canonical port.
const child = spawn(
  'npx',
  ['next', 'dev', '-p', args.includes('-p') ? '' : '8080', ...args.filter(a => a !== '-p' && !a.startsWith('808'))].filter(Boolean),
  {
    cwd: CWD,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  },
);

child.on('exit', (code) => process.exit(code ?? 1));
