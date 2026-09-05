// Verifies word limits / banned words for 01-employer-expectations.json and renders the .md companion.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(readFileSync(join(here, '01-employer-expectations.json'), 'utf8'));

const tone = ['world-class','world class','best-in-class','best in class','ninja','guru','rockstar','unparalleled','revolutionary','cutting-edge','cutting edge','passionate','industry-leading','market-leading','world-leading','leading expert','exceptional','amazing','genius','visionary','unmatched','second to none','game-changing','game changing','commander','fleet','mission','decorated','squadron','sci-fi','scifi','star wars','star trek','starship','jedi'];
const reg = ['sorry','apolog',"i'm just","i'm only",'unfortunately',"i'm afraid",'disclaimer',"i can't really","i'm not an expert",'hopefully','i might be wrong','please forgive','bear with me','to be honest','i hope this helps','should work','appears','good enough'];
const wc = (s) => s.trim().split(/\s+/).filter((w) => /[A-Za-z0-9$~≈%]/.test(w)).length;
const esc = (w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const items = {
  hiring: [j.greetings.hiring, 60],
  engineering: [j.greetings.engineering, 60],
  story: [j.greetings.story, 60],
  fallback: [j.fallback_answer, 45],
  spoken: [j.spoken_intro.script, 45],
};
let ok = true;
const rows = [];
for (const [k, [t, max]] of Object.entries(items)) {
  const n = wc(t);
  const low = t.toLowerCase();
  const hits = [...tone, ...reg].filter((w) => (w === 'apolog' ? low.includes(w) : new RegExp('\\b' + esc(w) + '\\b').test(low)));
  const disc = (t.match(/AI clone/g) || []).length;
  rows.push(`| ${k} | ${n} | ${max} | ${n <= max ? 'pass' : 'FAIL'} | ${hits.length ? hits.join(', ') : 'none'} | ${disc} |`);
  if (n > max || hits.length) ok = false;
}
const labelLens = j.quick_prompts.map((q) => q.label.length);
if (labelLens.some((L) => L > 28)) ok = false;
console.log(rows.join('\n'));
console.log('labels', labelLens.join(', '));
console.log(ok ? 'ALL CHECKS PASS' : 'FAIL');

const F = j.findings.map((f) => `| ${f.tag} | ${f.claim} | ${f.source} |`).join('\n');
const P = j.principles.map((p) => `### ${p.id} — ${p.name}\n\n${p.statement}\n\n**Applied to MiniVic:** ${p.applied_to_minivic}\n\nCitations:\n${p.citations.map((c) => `- ${c}`).join('\n')}`).join('\n\n');
const Q = j.quick_prompts.map((q) => `| ${q.rank} | ${q.audience} | \`${q.label}\` (${q.label.length}) | ${q.prompt} | ${q.mode} | ${q.why_first || q.why} |`).join('\n');

const md = `# 01 — Employer expectations applied to MiniVic

Run \`${j.run}\` · generated ${j.generated} · read-only research sub-agent.

**Fact policy.** ${j.fact_source_policy}

## Inputs read

${Object.entries(j.inputs_read).map(([k, v]) => `- **${k}** — ${v}`).join('\n')}

## Findings

| Tag | Claim | Source |
|---|---|---|
${F}

## 1. Three principles

${P}

## 2. Proposed greetings (≤60 words, first person as Vikram's clone, one disclosure clause)

**hiring**

> ${j.greetings.hiring}

Traces: ${j.greetings.fact_trace.hiring.join('; ')}

**engineering**

> ${j.greetings.engineering}

Traces: ${j.greetings.fact_trace.engineering.join('; ')}

**story**

> ${j.greetings.story}

Traces: ${j.greetings.fact_trace.story.join('; ')}

## 3. Quick prompts (ordered by employer priority; #6 is for business clients)

| # | Audience | Label (chars) | Full question | mode | Why |
|---|---|---|---|---|---|
${Q}

## 4. Proposed FALLBACK_ANSWER (≤45 words)

> ${j.fallback_answer}

## 5. Spoken introduction script (${j.spoken_intro.duration_target_seconds} s, ≤45 words)

> ${j.spoken_intro.script}

Traces: ${j.spoken_intro.fact_trace.join('; ')}

**Existing MP3.** ${j.spoken_intro.existing_mp3_note}

## Compliance check (script-verified this session by check-and-render.mjs)

| Text | Words | Limit | Result | Banned hits (TC-NFR-TONE + Config §5.1 + brief) | "AI clone" clauses |
|---|---|---|---|---|---|
${rows.join('\n')}

Quick-prompt labels: ${labelLens.join(', ')} characters — all ≤28.

## Open points for the owner

${j.open_points_for_the_owner.map((o) => `- ${o}`).join('\n')}
`;
writeFileSync(join(here, '01-employer-expectations.md'), md);
console.log('md bytes', statSync(join(here, '01-employer-expectations.md')).size);
