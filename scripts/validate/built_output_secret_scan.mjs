#!/usr/bin/env node
/**
 * built_output_secret_scan.mjs — NFR-SEC gate over the EMITTED bundle.
 *
 * Why this exists (2026-08-09 incident): the static audit's TC-NFR-SEC gate scans
 * *source* and reported "clean" while a live Gemini key shipped in cleartext inside
 * out/_next/static/chunks/app/layout-*.js. Nothing was hardcoded — next.config.js
 * mapped a real secret into `env.NEXT_PUBLIC_GEMINI_API_KEY`, and Next.js
 * substitutes NEXT_PUBLIC_* into the emitted JavaScript at build time. Source-only
 * scanning cannot see that by construction; only the build output can.
 *
 * Two independent checks:
 *   1. SHAPE  — regexes for well-known credential formats.
 *   2. IDENTITY — every sufficiently-long value in the operator's real credential
 *      files is searched for verbatim in the bundle. This catches provider formats
 *      no regex anticipates (the leaked key was "AQ."-prefixed, which no public
 *      Google-API-key regex matches).
 *
 * Secret values are NEVER printed, logged or written. Findings name the variable,
 * the file and a byte offset only.
 *
 * Usage:  node scripts/validate/built_output_secret_scan.mjs [--dir out]
 * Exit:   0 = clean, 1 = leak found, 2 = misuse/nothing to scan.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, isAbsolute, resolve } from 'node:path';
import { homedir } from 'node:os';

const ROOT = process.cwd();
const argDir = process.argv.indexOf('--dir');
const requestedDir = argDir !== -1 ? process.argv[argDir + 1] : 'out';
// Accept both a repo-relative dir (the normal `--dir out` case) and an absolute
// path, so the same gate can be pointed at a downloaded production bundle to
// verify it detects a real leak rather than merely passing by default.
const SCAN_DIR = isAbsolute(requestedDir) ? resolve(requestedDir) : join(ROOT, requestedDir);

/** Files worth scanning — anything the browser can fetch. */
const SCAN_EXT = new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.css', '.map', '.txt', '.webmanifest']);

/** Credential shapes. `label` is what we report; the match itself is never shown. */
const SHAPE_RULES = [
  { label: 'Google API key (AIza…)', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { label: 'Google OAuth/opaque key (AQ.…)', re: /\bAQ\.[A-Za-z0-9_-]{20,}/g },
  { label: 'OpenAI key (sk-…)', re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { label: 'OpenRouter key (sk-or-v1-…)', re: /\bsk-or-v1-[A-Za-z0-9]{32,}\b/g },
  { label: 'Anthropic key (sk-ant-…)', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { label: 'GitHub token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{50,}\b/g },
  { label: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'Slack token', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g },
  { label: 'ElevenLabs key (sk_…)', re: /\bsk_[a-f0-9]{40,}\b/g },
  { label: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { label: 'Firebase/Google service-account JSON', re: /"type"\s*:\s*"service_account"/g },
];

/**
 * A non-empty NEXT_PUBLIC_*(KEY|SECRET|TOKEN|PASSWORD) assignment in emitted JS.
 * Next.js inlines these literally, so any non-empty value here is shipped to the
 * browser. Empty strings are fine — that is the intended "no credential" state.
 */
const PUBLIC_ENV_RULE = {
  label: 'NEXT_PUBLIC_* credential inlined with a non-empty value',
  re: /NEXT_PUBLIC_[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD)\s*[:=]\s*["'`]([^"'`]{8,})["'`]/g,
};

/** Credential files whose real values must never appear in the bundle. */
const CREDENTIAL_FILES = [
  join(homedir(), '.claude', '.env.production'),
  join(ROOT, '.env.production'),
  join(ROOT, '.env.production.aside-during-build'),
  join(ROOT, '.env.local'),
];

/** Values this short, or this generic, would produce meaningless matches. */
const MIN_SECRET_LEN = 16;
const IDENTITY_IGNORE_NAMES = /^(NEXT_PUBLIC_SITE_URL|PROJECT_ROOT_DIR|SUBAGENT_ARCHTECTURE_DIR|.*_URL|.*_HOST|.*_PORT|.*_DIRECTORY|.*_COMMAND|.*_MODEL|.*_VOICE_ID|.*_ID)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (SCAN_EXT.has(extname(name))) out.push(p);
  }
  return out;
}

/** Parse KEY=VALUE files without evaluating or echoing anything. */
function loadCredentialValues() {
  const found = [];
  for (const file of CREDENTIAL_FILES) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, 'utf8').split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const name = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (value.length < MIN_SECRET_LEN) continue;
      if (IDENTITY_IGNORE_NAMES.test(name)) continue;
      if (/^\$\{.*\}$/.test(value)) continue; // un-expanded placeholder
      found.push({ name, value, source: file.replace(homedir(), '~') });
    }
  }
  return found;
}

function main() {
  if (!existsSync(SCAN_DIR)) {
    console.error(`[secret-scan] FAIL — nothing to scan: ${relative(ROOT, SCAN_DIR)} does not exist.`);
    console.error('[secret-scan] Run `npm run build:static` first (this gate must run on the emitted bundle).');
    process.exit(2);
  }

  const files = walk(SCAN_DIR);
  if (files.length === 0) {
    console.error(`[secret-scan] FAIL — ${relative(ROOT, SCAN_DIR)} contains no scannable files.`);
    process.exit(2);
  }

  const credentials = loadCredentialValues();
  const findings = [];

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);

    for (const { label, re } of SHAPE_RULES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        findings.push({ kind: 'SHAPE', label, file: rel, offset: m.index });
      }
    }

    PUBLIC_ENV_RULE.re.lastIndex = 0;
    let pm;
    while ((pm = PUBLIC_ENV_RULE.re.exec(text)) !== null) {
      findings.push({
        kind: 'SHAPE',
        label: `${PUBLIC_ENV_RULE.label} (${pm[0].split(/[:=]/)[0].trim()})`,
        file: rel,
        offset: pm.index,
      });
    }

    // IDENTITY: exact match against real operator credentials.
    for (const cred of credentials) {
      const at = text.indexOf(cred.value);
      if (at !== -1) {
        findings.push({
          kind: 'IDENTITY',
          label: `real value of ${cred.name} (from ${cred.source}) is present verbatim`,
          file: rel,
          offset: at,
        });
      }
    }
  }

  console.log('  BUILT-OUTPUT SECRET SCAN (NFR-SEC)');
  console.log('  ' + '-'.repeat(58));
  console.log(`  scanned : ${files.length} files under ${relative(ROOT, SCAN_DIR)}/`);
  console.log(`  shapes  : ${SHAPE_RULES.length + 1} credential patterns`);
  console.log(
    `  identity: ${credentials.length} real credential value(s) from ${
      new Set(credentials.map((c) => c.source)).size
    } file(s)`,
  );
  if (credentials.length === 0) {
    console.log('  NOTE    : no credential file readable here — IDENTITY check inactive (shape check still ran).');
  }
  console.log('  ' + '-'.repeat(58));

  if (findings.length === 0) {
    console.log('  RESULT: PASS — no credential material in the emitted bundle.\n');
    process.exit(0);
  }

  console.error(`  RESULT: FAIL — ${findings.length} credential leak(s) in the emitted bundle:\n`);
  for (const f of findings) {
    console.error(`   [${f.kind}] ${f.label}`);
    console.error(`            ${f.file} @ byte ${f.offset}`);
  }
  console.error('\n  The secret value itself is deliberately not printed.');
  console.error('  Fix: remove the credential from next.config.js `env`/NEXT_PUBLIC_*, move the');
  console.error('  call server-side (e.g. the /api/chat Function with Secret Manager), rebuild,');
  console.error('  and REVOKE the exposed credential — it must be assumed compromised.\n');
  process.exit(1);
}

main();
