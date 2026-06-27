// fm/ui.mjs — zero-dependency terminal UI engine for fmctl.
//
// Everything here is raw ANSI + Unicode box-drawing. No npm deps (the repo keeps
// tooling install-free). Pure renderers (bar/gauge/sparkline/barChart/box/table)
// return strings and are unit-tested; the animated widgets (Spinner/Steps/menu)
// are thin TTY wrappers around them and degrade gracefully when stdout is not a
// terminal or NO_COLOR is set.

const ESC = '\x1b[';
const ANSI_RE = /\x1b\[[0-9;]*m/g;

// ── Capability detection ─────────────────────────────────────────────────────
const COLOR_ENABLED =
  !process.env.NO_COLOR &&
  process.env.TERM !== 'dumb' &&
  (process.stdout.isTTY || process.env.FMCTL_FORCE_COLOR === '1');

export const isTTY = !!process.stdout.isTTY && process.env.FMCTL_NONINTERACTIVE !== '1';

function useColor(opts) {
  if (opts && typeof opts.color === 'boolean') return opts.color;
  return COLOR_ENABLED;
}

// ── Low-level colour ─────────────────────────────────────────────────────────
const CODES = {
  reset: 0,
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  inverse: 7,
};

function wrap(open, close, s, on) {
  if (!on) return s;
  return `${ESC}${open}m${s}${ESC}${close}m`;
}

// 256-colour foreground
function fg256(n, s, on) {
  return on ? `${ESC}38;5;${n}m${s}${ESC}39m` : s;
}

// Tasteful monochrome-leaning palette with semantic accents. The site is strict
// monochrome; a *dev tool* uses restrained colour for legibility (pass/warn/fail).
export const C = {
  reset: (s) => wrap(0, 0, s, COLOR_ENABLED),
  bold: (s) => wrap(CODES.bold, 22, s, COLOR_ENABLED),
  dim: (s) => wrap(CODES.dim, 22, s, COLOR_ENABLED),
  italic: (s) => wrap(CODES.italic, 23, s, COLOR_ENABLED),
  underline: (s) => wrap(CODES.underline, 24, s, COLOR_ENABLED),
  inverse: (s) => wrap(CODES.inverse, 27, s, COLOR_ENABLED),
  white: (s) => fg256(255, s, COLOR_ENABLED),
  grey: (s) => fg256(245, s, COLOR_ENABLED),
  faint: (s) => fg256(240, s, COLOR_ENABLED),
  good: (s) => fg256(78, s, COLOR_ENABLED), // green
  avg: (s) => fg256(221, s, COLOR_ENABLED), // amber
  poor: (s) => fg256(203, s, COLOR_ENABLED), // red
  accent: (s) => fg256(117, s, COLOR_ENABLED), // cool cyan-white
  info: (s) => fg256(111, s, COLOR_ENABLED),
};

const SCORE_COLOR = { good: C.good, avg: C.avg, poor: C.poor };

// ── Symbols (unicode, with an ASCII fallback via FMCTL_ASCII=1) ───────────────
const ASCII = process.env.FMCTL_ASCII === '1';
export const sym = ASCII
  ? {
      ok: '[ok]', fail: '[x]', warn: '[!]', info: '[i]', dot: '*', arrow: '>',
      box: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|', ml: '+', mr: '+' },
      barFull: '#', barEmpty: '.', spark: '.:-=+*#%@'.split(''),
      gaugeFull: '#', gaugeEmpty: '-', radio: '( )', radioOn: '(*)',
    }
  : {
      ok: '✓', fail: '✗', warn: '▲', info: 'ℹ', dot: '•', arrow: '❯',
      box: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│', ml: '├', mr: '┤' },
      barFull: '█', barEmpty: '░', spark: '▁▂▃▄▅▆▇█'.split(''),
      gaugeFull: '█', gaugeEmpty: '░', radio: '○', radioOn: '◉',
    };

export const SPINNER_FRAMES = ASCII
  ? ['-', '\\', '|', '/']
  : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// ── String helpers (ANSI-aware) ──────────────────────────────────────────────
export function stripAnsi(s) {
  return String(s).replace(ANSI_RE, '');
}

export function visibleLength(s) {
  return [...stripAnsi(s)].length;
}

export function pad(s, width, align = 'left') {
  const len = visibleLength(s);
  if (len >= width) return s;
  const gap = width - len;
  if (align === 'right') return ' '.repeat(gap) + s;
  if (align === 'center') {
    const l = Math.floor(gap / 2);
    return ' '.repeat(l) + s + ' '.repeat(gap - l);
  }
  return s + ' '.repeat(gap);
}

export function truncate(s, width) {
  const chars = [...stripAnsi(s)];
  if (chars.length <= width) return s;
  if (width <= 1) return '…'.slice(0, width);
  return chars.slice(0, width - 1).join('') + '…';
}

// ── Bars / meters ────────────────────────────────────────────────────────────
export function bar(value, max, width, opts = {}) {
  const on = useColor(opts);
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const f = sym.barFull.repeat(filled);
  const e = sym.barEmpty.repeat(empty);
  if (!on) return f + e;
  const colorFn = opts.colorFn || C.accent;
  return colorFn(f) + C.faint(e);
}

export function progressLine(label, value, max, width = 28, opts = {}) {
  const pct = max <= 0 ? 0 : Math.round((value / max) * 100);
  const b = bar(value, max, width, opts);
  return `${pad(label, opts.labelWidth || 0)} ${b} ${pad(`${pct}%`, 4, 'right')}`;
}

export function classifyScoreLocal(score) {
  if (score >= 90) return 'good';
  if (score >= 50) return 'avg';
  return 'poor';
}

// gauge(label, score0to100, opts) → "Perf  ┃███████░░┃  99  good"
export function gauge(label, score, opts = {}) {
  const on = useColor(opts);
  const width = opts.width || 24;
  const s = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const cls = classifyScoreLocal(s);
  const filled = Math.round((s / 100) * width);
  const meter = sym.gaugeFull.repeat(filled) + sym.gaugeEmpty.repeat(width - filled);
  const labelTxt = pad(label, opts.labelWidth || 0);
  if (!on) return `${labelTxt} ${meter}  ${pad(String(s), 3, 'right')}  ${cls}`;
  const cf = SCORE_COLOR[cls];
  const coloredMeter = cf(sym.gaugeFull.repeat(filled)) + C.faint(sym.gaugeEmpty.repeat(width - filled));
  return `${C.grey(labelTxt)} ${coloredMeter}  ${cf(C.bold(pad(String(s), 3, 'right')))}  ${cf(cls)}`;
}

// ── Sparkline ────────────────────────────────────────────────────────────────
export function sparkline(values, opts = {}) {
  if (!values || values.length === 0) return '';
  const on = useColor(opts);
  const glyphs = sym.spark;
  const nums = values.map((v) => Number(v) || 0);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min;
  const out = nums
    .map((v) => {
      if (range === 0) return glyphs[0];
      const idx = Math.round(((v - min) / range) * (glyphs.length - 1));
      return glyphs[Math.max(0, Math.min(glyphs.length - 1, idx))];
    })
    .join('');
  return on ? C.accent(out) : out;
}

// ── Horizontal bar chart ─────────────────────────────────────────────────────
// rows: [{ label, value, suffix? , colorFn? }]
export function barChart(rows, opts = {}) {
  if (!rows.length) return '';
  const width = opts.width || 30;
  const max = opts.max ?? Math.max(...rows.map((r) => r.value), 0);
  const labelW = Math.max(...rows.map((r) => visibleLength(r.label)));
  const suffixW = Math.max(0, ...rows.map((r) => visibleLength(r.suffix ?? formatNum(r.value))));
  return rows
    .map((r) => {
      const b = bar(r.value, max, width, { color: useColor(opts), colorFn: r.colorFn });
      const suffix = r.suffix ?? formatNum(r.value);
      return `${pad(r.label, labelW)} ${b} ${pad(suffix, suffixW, 'right')}`;
    })
    .join('\n');
}

function formatNum(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

// ── Box panel ────────────────────────────────────────────────────────────────
export function box(lines, opts = {}) {
  const on = useColor(opts);
  const b = sym.box;
  const pads = opts.pad ?? 1;
  const bodyLines = Array.isArray(lines) ? lines : String(lines).split('\n');
  const contentW = Math.max(
    visibleLength(opts.title || ''),
    ...bodyLines.map((l) => visibleLength(l)),
    opts.minWidth || 0,
  );
  const inner = contentW + pads * 2;
  const border = (s) => (on ? C.faint(s) : s);

  const title = opts.title ? ` ${opts.title} ` : '';
  const titleLen = visibleLength(title);
  const topFill = inner - titleLen;
  const lead = opts.title ? 1 : 0;
  const top =
    border(b.tl) +
    border(b.h.repeat(lead)) +
    (on ? C.bold(C.white(title)) : title) +
    border(b.h.repeat(Math.max(0, topFill - lead))) +
    border(b.tr);

  const bottom = border(b.bl + b.h.repeat(inner) + b.br);
  const padStr = ' '.repeat(pads);
  const body = bodyLines.map(
    (l) => border(b.v) + padStr + pad(l, contentW) + padStr + border(b.v),
  );
  return [top, ...body, bottom].join('\n');
}

export function hr(width, opts = {}) {
  const w = width || (process.stdout.columns ? process.stdout.columns - 2 : 60);
  const line = sym.box.h.repeat(w);
  return useColor(opts) ? C.faint(line) : line;
}

// ── Table ────────────────────────────────────────────────────────────────────
// headers: [str]; rows: [[cell,...]]; opts.align: ['left','right',...]
export function table(headers, rows, opts = {}) {
  const on = useColor(opts);
  const cols = headers.length;
  const align = opts.align || [];
  const widths = headers.map((h, i) =>
    Math.max(visibleLength(h), ...rows.map((r) => visibleLength(String(r[i] ?? '')))),
  );
  const sep = on ? C.faint(' │ ') : ' │ ';
  const head = headers
    .map((h, i) => (on ? C.bold(C.grey(pad(h, widths[i], align[i]))) : pad(h, widths[i], align[i])))
    .join(sep);
  const ruleParts = widths.map((w) => sym.box.h.repeat(w));
  const rule = on ? C.faint(ruleParts.join('─┼─')) : ruleParts.join('─┼─');
  const body = rows.map((r) =>
    r.map((cell, i) => pad(String(cell ?? ''), widths[i], align[i])).join(sep),
  );
  return [head, rule, ...body].join('\n');
}

export function badge(text, kind = 'info') {
  const map = { good: C.good, avg: C.avg, poor: C.poor, info: C.info, warn: C.avg, accent: C.accent };
  const fn = map[kind] || C.info;
  return COLOR_ENABLED ? fn(C.bold(` ${text} `)) : `[${text}]`;
}

// ── Banner / wordmark ────────────────────────────────────────────────────────
export function banner(subtitle = '') {
  const title = 'F M C T L';
  const lines = [
    C.bold(C.white(title)) + '   ' + C.faint('forgotten-mistory control'),
  ];
  if (subtitle) lines.push(C.grey(subtitle));
  return box(lines, { title: 'server & deploy console', pad: 1 });
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export class Spinner {
  constructor(text = '', opts = {}) {
    this.text = text;
    this.stream = opts.stream || process.stdout;
    this.frames = SPINNER_FRAMES;
    this.i = 0;
    this.timer = null;
    this.start_ = 0;
    this.enabled = isTTY && this.stream.isTTY;
  }

  start(text) {
    if (text) this.text = text;
    this.start_ = Date.now();
    if (!this.enabled) {
      this.stream.write(`${C.faint('•')} ${this.text}\n`);
      return this;
    }
    this.stream.write('\x1b[?25l'); // hide cursor
    this.timer = setInterval(() => this.render(), 80);
    this.render();
    return this;
  }

  render() {
    if (!this.enabled) return;
    const frame = this.frames[(this.i = (this.i + 1) % this.frames.length)];
    const elapsed = C.faint(`(${((Date.now() - this.start_) / 1000).toFixed(1)}s)`);
    this.stream.write(`\r\x1b[2K${C.accent(frame)} ${this.text} ${elapsed}`);
  }

  update(text) {
    this.text = text;
    if (!this.enabled) this.stream.write(`  ${C.faint('…')} ${text}\n`);
    return this;
  }

  stopWith(symbol, colorFn, text) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const msg = text || this.text;
    const elapsed = this.start_ ? C.faint(` (${((Date.now() - this.start_) / 1000).toFixed(1)}s)`) : '';
    if (this.enabled) {
      this.stream.write(`\r\x1b[2K${colorFn(symbol)} ${msg}${elapsed}\n`);
      this.stream.write('\x1b[?25h'); // show cursor
    } else {
      this.stream.write(`${colorFn(symbol)} ${msg}${elapsed}\n`);
    }
    return this;
  }

  succeed(text) { return this.stopWith(sym.ok, C.good, text); }
  fail(text) { return this.stopWith(sym.fail, C.poor, text); }
  warn(text) { return this.stopWith(sym.warn, C.avg, text); }
  info(text) { return this.stopWith(sym.info, C.info, text); }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.enabled) this.stream.write('\r\x1b[2K\x1b[?25h');
    return this;
  }
}

// ── Steps (multi-step pipeline view) ─────────────────────────────────────────
export class Steps {
  constructor(labels, opts = {}) {
    this.steps = labels.map((label) => ({ label, state: 'pending', note: '' }));
    this.stream = opts.stream || process.stdout;
    this.enabled = isTTY && this.stream.isTTY;
    this.rendered = 0;
    this.frame = 0;
    this.timer = null;
  }

  glyph(state) {
    switch (state) {
      case 'done': return C.good(sym.ok);
      case 'failed': return C.poor(sym.fail);
      case 'running': return C.accent(SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length]);
      case 'skipped': return C.faint(sym.dot);
      default: return C.faint(sym.dot);
    }
  }

  lines() {
    return this.steps.map((s) => {
      const note = s.note ? '  ' + C.faint(s.note) : '';
      const label = s.state === 'pending' ? C.faint(s.label) : s.label;
      return `  ${this.glyph(s.state)} ${label}${note}`;
    });
  }

  draw() {
    if (!this.enabled) return;
    if (this.rendered) this.stream.write(`\x1b[${this.rendered}A`);
    const ls = this.lines();
    for (const l of ls) this.stream.write(`\r\x1b[2K${l}\n`);
    this.rendered = ls.length;
  }

  start() {
    if (this.enabled) {
      this.stream.write('\x1b[?25l');
      this.timer = setInterval(() => {
        this.frame++;
        this.draw();
      }, 90);
      this.draw();
    }
    return this;
  }

  set(index, state, note = '') {
    if (!this.steps[index]) return this;
    this.steps[index].state = state;
    if (note) this.steps[index].note = note;
    if (!this.enabled) {
      const g = state === 'done' ? sym.ok : state === 'failed' ? sym.fail : sym.dot;
      this.stream.write(`  ${g} ${this.steps[index].label}${note ? '  ' + note : ''}\n`);
    } else {
      this.draw();
    }
    return this;
  }

  done() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.enabled) {
      this.draw();
      this.stream.write('\x1b[?25h');
    }
    return this;
  }
}

// ── Interactive arrow-key menu ───────────────────────────────────────────────
// items: [{ label, value, hint? }] → resolves to chosen item, or null if cancelled.
// Non-TTY: prints the list and resolves null immediately (no hang).
export function menu(title, items, opts = {}) {
  return new Promise((resolve) => {
    const out = process.stdout;
    if (!isTTY || !out.isTTY || !process.stdin.isTTY) {
      // Non-interactive: surface the options so the output is still useful.
      out.write(`${C.bold(title)}\n`);
      items.forEach((it, i) => {
        const hint = it.hint ? '  ' + C.faint(it.hint) : '';
        out.write(`  ${C.faint(String(i + 1) + ')')} ${it.label}${hint}\n`);
      });
      out.write(C.faint('  (run in an interactive terminal to select)\n'));
      resolve(null);
      return;
    }

    let idx = Math.max(0, items.findIndex((it) => it.value === opts.selected));
    if (idx < 0) idx = 0;
    const stdin = process.stdin;
    const header = `${C.bold(C.white(title))}  ${C.faint('↑/↓ move · enter select · q quit')}`;
    let drawn = 0;

    const render = () => {
      if (drawn) out.write(`\x1b[${drawn}A`);
      const rows = [header, ''];
      items.forEach((it, i) => {
        const active = i === idx;
        const marker = active ? C.accent(sym.arrow) : ' ';
        const label = active ? C.bold(C.white(it.label)) : C.grey(it.label);
        const hint = it.hint ? '  ' + C.faint(it.hint) : '';
        rows.push(`${marker} ${label}${hint}`);
      });
      for (const r of rows) out.write(`\r\x1b[2K${r}\n`);
      drawn = rows.length;
    };

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      out.write('\x1b[?25h');
    };

    const onData = (buf) => {
      const key = buf.toString();
      if (key === '' || key === 'q' || key === '') {
        // Ctrl-C / q / Esc
        cleanup();
        if (key === '') {
          out.write('\n');
          process.exit(130);
        }
        resolve(null);
        return;
      }
      if (key === '\r' || key === '\n') {
        cleanup();
        resolve(items[idx]);
        return;
      }
      if (key === '[A' || key === 'k') idx = (idx - 1 + items.length) % items.length;
      else if (key === '[B' || key === 'j') idx = (idx + 1) % items.length;
      else {
        const n = parseInt(key, 10);
        if (!Number.isNaN(n) && n >= 1 && n <= items.length) {
          cleanup();
          resolve(items[n - 1]);
          return;
        }
      }
      render();
    };

    out.write('\x1b[?25l');
    render();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

// Prompt a single line of text (TTY); resolves '' in non-interactive mode.
export function prompt(question, opts = {}) {
  return new Promise((resolve) => {
    if (!isTTY || !process.stdin.isTTY) {
      resolve(opts.default ?? '');
      return;
    }
    const rl = createInterfaceLazy();
    rl.question(`${C.accent('?')} ${question}${opts.default ? C.faint(` (${opts.default})`) : ''} `, (ans) => {
      rl.close();
      resolve(ans.trim() || opts.default || '');
    });
  });
}

export function confirm(question, def = false) {
  return new Promise((resolve) => {
    if (!isTTY || !process.stdin.isTTY) {
      resolve(def);
      return;
    }
    const rl = createInterfaceLazy();
    const hint = def ? 'Y/n' : 'y/N';
    rl.question(`${C.accent('?')} ${question} ${C.faint(`[${hint}]`)} `, (ans) => {
      rl.close();
      const a = ans.trim().toLowerCase();
      if (a === '') resolve(def);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

let _rl = null;
function createInterfaceLazy() {
  // Lazy import to avoid pulling readline into non-interactive paths.
  const { createInterface } = require_('node:readline');
  _rl = createInterface({ input: process.stdin, output: process.stdout });
  return _rl;
}

// ESM has no require; provide a tiny shim using createRequire.
import { createRequire } from 'node:module';
const require_ = createRequire(import.meta.url);
