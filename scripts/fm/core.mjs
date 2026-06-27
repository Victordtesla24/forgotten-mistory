// fm/core.mjs — process / port / env / state / http primitives for fmctl.
// Pure parsers (parseLsofListeners, parseEnvFile, fmt*, classifyScore) are
// unit-tested; the side-effecting helpers wrap node:child_process / node:http.

import { spawn } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Repo discovery ───────────────────────────────────────────────────────────
export function repoRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'next.config.js'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: two levels up from scripts/fm/
  return path.resolve(__dirname, '..', '..');
}

export function devPort(root = repoRoot()) {
  // Read the port out of package.json's dev script (default 8080).
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const m = /(?:-p|--port)[ =](\d+)/.exec(pkg.scripts?.dev || '');
    if (m) return Number(m[1]);
  } catch {
    /* ignore */
  }
  return 8080;
}

// ── Formatting ───────────────────────────────────────────────────────────────
export function fmtBytes(n) {
  n = Number(n) || 0;
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  do {
    n /= 1024;
    u++;
  } while (n >= 1024 && u < units.length - 1);
  return `${n.toFixed(n >= 100 || Number.isInteger(n) ? 0 : 1)} ${units[u]}`;
}

export function fmtDuration(ms) {
  ms = Number(ms) || 0;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function classifyScore(score) {
  const s = Number(score) || 0;
  if (s >= 90) return 'good';
  if (s >= 50) return 'avg';
  return 'poor';
}

export function nowStamp() {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

// Visible (never silent) degradation notice — written to stderr so it does not
// pollute --json stdout. Used when a base utility (lsof/ps) can't be spawned.
export function warn(message) {
  process.stderr.write(`\x1b[38;5;221m▲ [fmctl] ${message}\x1b[39m\n`);
}

// Pure: resolve a git branch name from `rev-parse --abbrev-ref HEAD` output.
// '' / non-zero → 'unknown'; the literal 'HEAD' means a detached checkout.
export function normalizeBranch(code, raw) {
  const b = String(raw || '').trim();
  if (code !== 0 || !b) return 'unknown';
  if (b === 'HEAD') return 'detached';
  return b;
}

// ── Env parsing (no secrets ever logged) ─────────────────────────────────────
export function parseEnvFile(text) {
  const out = {};
  for (const raw of String(text).split('\n')) {
    let line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trim();
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function loadEnvKeys(root = repoRoot()) {
  // Returns ONLY the set of present key names (never values) for diagnostics.
  for (const f of ['.env.production', '.env.local', '.env']) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) {
      try {
        return { file: f, keys: Object.keys(parseEnvFile(fs.readFileSync(p, 'utf8'))) };
      } catch {
        /* ignore */
      }
    }
  }
  return { file: null, keys: [] };
}

// ── lsof listener parsing ────────────────────────────────────────────────────
export function parseLsofListeners(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    if (!line || line.startsWith('COMMAND')) continue;
    // node    85000  vic   13u  IPv6 0x...  0t0  TCP *:8080 (LISTEN)
    const m = /^(\S+)\s+(\d+)\s+.*\sTCP\s+\S*?:(\d+)\s+\(LISTEN\)/.exec(line);
    if (m) {
      rows.push({ command: m[1], pid: Number(m[2]), port: Number(m[3]) });
    }
  }
  return rows;
}

// ── Async exec helpers ───────────────────────────────────────────────────────
export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || repoRoot(),
      env: { ...process.env, ...(opts.env || {}) },
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    if (child.stdout) child.stdout.on('data', (d) => (stdout += d));
    if (child.stderr) child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: String(err.message), error: err }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

// Stream a long-running command; onLine(line, stream) per line. Resolves {code}.
export function spawnStream(cmd, args, opts = {}, onLine = () => {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || repoRoot(),
      env: { ...process.env, ...(opts.env || {}) },
      shell: !!opts.shell,
    });
    let bufOut = '';
    let bufErr = '';
    const pump = (chunk, which, bufRef) => {
      bufRef.s += chunk;
      let nl;
      while ((nl = bufRef.s.indexOf('\n')) !== -1) {
        onLine(bufRef.s.slice(0, nl), which);
        bufRef.s = bufRef.s.slice(nl + 1);
      }
    };
    const oRef = { s: bufOut };
    const eRef = { s: bufErr };
    if (child.stdout) child.stdout.on('data', (d) => pump(String(d), 'out', oRef));
    if (child.stderr) child.stderr.on('data', (d) => pump(String(d), 'err', eRef));
    child.on('error', (err) => resolve({ code: -1, error: err }));
    child.on('close', (code) => {
      if (oRef.s) onLine(oRef.s, 'out');
      if (eRef.s) onLine(eRef.s, 'err');
      resolve({ code });
    });
  });
}

export async function which(cmd) {
  const r = await run('command', ['-v', cmd], {});
  if (r.code === 0 && r.stdout.trim()) return r.stdout.trim();
  // `command` may not be spawnable directly; fall back to PATH scan.
  const dirs = (process.env.PATH || '').split(path.delimiter);
  for (const d of dirs) {
    const p = path.join(d, cmd);
    try {
      fs.accessSync(p, fs.constants.X_OK);
      return p;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

// ── Ports & processes ────────────────────────────────────────────────────────
export async function listenersOnPort(port) {
  const r = await run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN']);
  // lsof exits 1 when nothing is listening (normal); only a spawn error (binary
  // missing/unspawnable) means we genuinely could not check — surface it.
  if (r.error) warn(`lsof unavailable (${r.error.code || r.error.message}) — port checks are degraded`);
  return parseLsofListeners(r.stdout);
}

export async function allNodeServers() {
  // Enumerate every Next.js dev / next-server process on the machine, capturing
  // pgid so a launcher's child next-server can be grouped under it.
  const r = await run('ps', ['-axo', 'pid=,pgid=,command=']);
  if (r.error) warn(`ps unavailable (${r.error.code || r.error.message}) — stray-process detection is degraded`);
  const out = [];
  for (const line of r.stdout.split('\n')) {
    const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const cmd = m[3];
    if (/next(-server| dev)/.test(cmd) || /\.bin\/next/.test(cmd)) {
      const portM = /(?:-p|--port)[ =](\d+)/.exec(cmd);
      out.push({ pid: Number(m[1]), pgid: Number(m[2]), command: cmd, port: portM ? Number(portM[1]) : null });
    }
  }
  return out;
}

export async function pgidOf(pid) {
  const r = await run('ps', ['-o', 'pgid=', '-p', String(pid)]);
  const n = Number(r.stdout.trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

// True when a process (by pid or its process-group leader) belongs to a managed
// server — used to avoid flagging a managed server's own next-server child as a stray.
export function isManagedProc(proc, managedPids) {
  return managedPids.has(proc.pid) || (proc.pgid != null && managedPids.has(proc.pgid));
}

export function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

export async function pidInfo(pid) {
  if (!isAlive(pid)) return null;
  const r = await run('ps', ['-p', String(pid), '-o', 'rss=,etime=,%cpu=']);
  const parts = r.stdout.trim().split(/\s+/);
  if (parts.length < 3) return { rssKb: null, etime: null, cpu: null };
  return { rssKb: Number(parts[0]) || null, etime: parts[1], cpu: Number(parts[2]) || null };
}

export async function killPid(pid, { signal = 'SIGTERM', wait = 4000 } = {}) {
  if (!isAlive(pid)) return true;
  try {
    process.kill(pid, signal);
  } catch {
    return !isAlive(pid);
  }
  const deadline = Date.now() + wait;
  while (Date.now() < deadline) {
    if (!isAlive(pid)) return true;
    await sleep(120);
  }
  // Escalate.
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    /* ignore */
  }
  await sleep(200);
  return !isAlive(pid);
}

export async function freePort(port) {
  const listeners = await listenersOnPort(port);
  const killed = [];
  for (const l of listeners) {
    const ok = await killPid(l.pid);
    if (ok) killed.push(l);
  }
  return killed;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── HTTP probe (no curl dependency) ──────────────────────────────────────────
export function httpProbe(url, { timeout = 8000 } = {}) {
  return new Promise((resolve) => {
    let lib;
    try {
      lib = new URL(url).protocol === 'https:' ? https : http;
    } catch {
      resolve({ ok: false, error: 'bad-url' });
      return;
    }
    const start = Date.now();
    const req = lib.get(url, { timeout }, (res) => {
      let bytes = 0;
      res.on('data', (d) => (bytes += d.length));
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          ms: Date.now() - start,
          bytes,
        });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout', ms: Date.now() - start });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.code || err.message, ms: Date.now() - start }));
  });
}

export async function waitForHttp(url, { timeout = 60000, interval = 400 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const p = await httpProbe(url, { timeout: 3000 });
    if (p.ok) return p;
    await sleep(interval);
  }
  return { ok: false, error: 'wait-timeout' };
}

// ── State registry (.fmctl/) ─────────────────────────────────────────────────
export function stateDir(root = repoRoot()) {
  const d = path.join(root, '.fmctl');
  fs.mkdirSync(d, { recursive: true });
  fs.mkdirSync(path.join(d, 'logs'), { recursive: true });
  return d;
}

function registryPath(root) {
  return path.join(stateDir(root), 'servers.json');
}

export function readRegistry(root = repoRoot()) {
  try {
    return JSON.parse(fs.readFileSync(registryPath(root), 'utf8'));
  } catch {
    return {};
  }
}

export function writeRegistry(reg, root = repoRoot()) {
  fs.writeFileSync(registryPath(root), JSON.stringify(reg, null, 2));
}

export function registerServer(name, info, root = repoRoot()) {
  const reg = readRegistry(root);
  reg[name] = { ...info, name };
  writeRegistry(reg, root);
}

export function unregisterServer(name, root = repoRoot()) {
  const reg = readRegistry(root);
  delete reg[name];
  writeRegistry(reg, root);
}

export function listServers(root = repoRoot()) {
  const reg = readRegistry(root);
  return Object.values(reg);
}

export function logFileFor(name, root = repoRoot()) {
  return path.join(stateDir(root), 'logs', `${name}.log`);
}

// ── Git helpers ──────────────────────────────────────────────────────────────
export async function gitInfo(root = repoRoot()) {
  const brR = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
  const branch = normalizeBranch(brR.code, brR.stdout);
  const statusR = await run('git', ['status', '--porcelain'], { cwd: root });
  const dirty = statusR.stdout.split('\n').filter(Boolean);
  let ahead = 0;
  let behind = 0;
  const counts = await run('git', ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'], { cwd: root });
  if (counts.code === 0) {
    const m = /(\d+)\s+(\d+)/.exec(counts.stdout.trim());
    if (m) {
      behind = Number(m[1]);
      ahead = Number(m[2]);
    }
  }
  const last = (await run('git', ['log', '-1', '--pretty=%h %s'], { cwd: root })).stdout.trim();
  return { branch, dirtyCount: dirty.length, dirty, ahead, behind, lastCommit: last, hasUpstream: counts.code === 0 };
}

export const HOME = os.homedir();
export const PROD_URL = 'https://forgotten-mistory.web.app';
