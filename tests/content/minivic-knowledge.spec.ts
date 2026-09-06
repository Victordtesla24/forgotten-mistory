import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { knowledgeBase, matchKnowledge } from '../../app/data/miniVicKnowledge';

/**
 * MiniVic offline-brain contract.
 *
 * Two things are locked down here:
 *
 *  1. The direct-Gemini tier is gone for good. `NEXT_PUBLIC_GEMINI_API_KEY` was
 *     inlined into the browser bundle (a live-key leak) and the Google project is
 *     now denied `generateContent` anyway, so the tier was both unsafe and
 *     unreachable. The answer ladder is exactly two rungs: the server-side
 *     /api/chat Function, then the deterministic local knowledge base.
 *
 *  2. That second rung can, on its own, answer the questions a recruiter actually
 *     asks. Every expectation below is a question the live bot previously fell
 *     back to the generic "I don't have that on file" answer for.
 *
 * These are pure-logic assertions — no page fixture, so no browser or dev server
 * is required to run this file.
 */

/**
 * Repo root. Deliberately `process.cwd()` (Playwright resolves it to the directory
 * holding playwright.config.ts) and NOT `import.meta.url`: package.json has no
 * `"type": "module"`, so Playwright transpiles specs to CommonJS. A single
 * `import.meta` reference forces Babel to keep the file in ESM scope, the emitted
 * `require()` calls then throw `ReferenceError: require is not defined in ES module
 * scope` at load time, and because that is a collection-phase error it aborts the
 * ENTIRE suite, not just this file. `tests/e2e/github-feed-fallback.spec.ts` uses
 * the same `process.cwd()` convention.
 */
const ROOT = process.cwd();

/** Every .ts/.tsx/.js file under lib/, recursively. */
function libSources(dir: string = join(ROOT, 'lib'), acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) libSources(p, acc);
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

test.describe('MiniVic brain — direct-Gemini tier removed', () => {
  test('KB-01: no lib/ source calls generativelanguage.googleapis.com', () => {
    const offenders = libSources().filter((p) =>
      readFileSync(p, 'utf8').includes('generativelanguage.googleapis.com'),
    );
    expect(offenders.map((p) => relative(ROOT, p))).toEqual([]);
  });

  test('KB-02: no lib/ source reads a NEXT_PUBLIC_GEMINI_* env var', () => {
    const offenders = libSources().filter((p) =>
      /NEXT_PUBLIC_GEMINI_[A-Z_]+/.test(readFileSync(p, 'utf8')),
    );
    expect(offenders.map((p) => relative(ROOT, p))).toEqual([]);
  });

  test('KB-03: the removed Gemini machinery is absent from miniVicBrain', () => {
    const src = readFileSync(join(ROOT, 'lib', 'miniVicBrain.ts'), 'utf8');
    for (const symbol of [
      'GEMINI_KEY',
      'GEMINI_KEY_VALID',
      'GEMINI_ENDPOINT',
      'MODEL_LADDER',
      'workingModel',
      'callGemini',
      'GeminiHttpError',
      'GeminiResponse',
    ]) {
      expect(src, `orphaned Gemini symbol "${symbol}" still present`).not.toContain(symbol);
    }
  });

  test('KB-04: BrainSource is exactly the four server rungs plus knowledge and fallback', () => {
    const src = readFileSync(join(ROOT, 'lib', 'miniVicBrain.ts'), 'utf8');
    const match = src.match(/export type BrainSource\s*=\s*([^;]+);/);
    expect(match, 'BrainSource union not found').not.toBeNull();
    const members = (match as RegExpMatchArray)[1]
      .split('|')
      .map((m) => m.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);
    expect(members.sort()).toEqual(['deepseek', 'fallback', 'knowledge', 'openai', 'openrouter', 'zai']);
  });
});

test.describe('MiniVic offline knowledge base — recruiter coverage', () => {
  /**
   * question → the entry id that must answer it. Each of these resolved to the
   * generic fallback before the knowledge base was strengthened.
   */
  const EXPECTED: ReadonlyArray<readonly [string, string]> = [
    // Years of experience (siteContent.hero.subtitle, proof[0], resume header)
    ['how many years of experience do you have', 'years-of-experience'],
    ['years of experience', 'years-of-experience'],
    ['how long have you been working', 'years-of-experience'],
    ['what is your seniority level', 'years-of-experience'],
    // Certifications with dates (skillGroups certifications + education)
    ['what certifications do you hold', 'certifications'],
    ['list your certifications with dates', 'certifications'],
    ['when did you get your CSM', 'certifications'],
    ['what accreditations do you have', 'certifications'],
    // AI / tech stack (skillGroups ai-ml + engineering)
    ['what technologies do you use for AI', 'tech-stack'],
    ['what is your tech stack', 'tech-stack'],
    ['do you know python', 'tech-stack'],
    ['do you know kubernetes', 'tech-stack'],
    // Availability + location (siteContent.hero.availability, contact, experience)
    ['what is your availability', 'availability'],
    ['can you start immediately', 'availability'],
    ['where are you located', 'location-remote'],
    ['do you work remotely', 'location-remote'],
    ['are you open to relocating', 'location-remote'],
    // Contact channels (siteContent.contact)
    ['what is your linkedin', 'contact'],
    ['linkedin profile', 'contact'],
    ['what is your github', 'contact'],
    ['send me your resume', 'resume-cv'],
    ['can I download your CV', 'resume-cv'],
    // Quantified outcomes (resumeContent + siteContent.proof)
    ['give me three quantified outcomes', 'delivery-metrics'],
    ['what results have you delivered', 'delivery-metrics'],
    ['what are your top achievements with numbers', 'delivery-metrics'],
    // Openers and screening questions
    ['tell me about yourself', 'profile-summary'],
    ['who are you', 'profile-summary'],
    ['summarise your experience', 'profile-summary'],
    ['what industries have you worked in', 'industries-sectors'],
    ['have you worked in government', 'industries-sectors'],
    ['have you managed budgets', 'leadership'],
    ['how big were the teams you led', 'leadership'],
    ['do you have a visa', 'work-rights'],
    ['are you an australian citizen', 'work-rights'],
    ['tell me about ANZ', 'anz-experience'],
    ['do you have banking experience', 'banking-financial-services'],
    ['did you work at microsoft', 'early-career'],
  ];

  for (const [question, id] of EXPECTED) {
    test(`KB-Q: "${question}" is answered offline by "${id}"`, () => {
      const entry = matchKnowledge(question);
      expect(entry, `no offline answer for "${question}"`).not.toBeNull();
      expect(entry?.id).toBe(id);
    });
  }

  test('KB-05: the offline corpus carries the load-bearing recruiter facts', () => {
    const corpus = knowledgeBase
      .map((e) => [e.answer, ...Object.values(e.personaVariants ?? {})].join('\n'))
      .join('\n');
    const FACTS = [
      '15+ years',
      'Certified Scrum Master',
      'Scrum Alliance',
      'Monash University',
      'University of Melbourne',
      '2010',
      '2007',
      'sarkar.vikram@gmail.com',
      '+61 433 224 556',
      'linkedin.com/in/vikramd-profile',
      'github.com/Victordtesla24',
      'Melbourne',
      '$5M+',
      '92%',
      'P95',
      '200 ms',
      '10,000+',
      '38%',
      'LangChain',
      'Langfuse',
      'Phoenix',
      'Kubernetes',
      'Terraform',
      'TypeScript',
      'Python',
      '/docs/Vik_Resume_Final.pdf',
    ];
    expect(FACTS.filter((f) => !corpus.includes(f))).toEqual([]);
  });

  test('KB-06: no knowledge-base answer still claims a Gemini-powered brain', () => {
    const offenders = knowledgeBase
      .filter((e) =>
        [e.answer, ...Object.values(e.personaVariants ?? {})].some((t) => /gemini/i.test(t)),
      )
      .map((e) => e.id);
    expect(offenders).toEqual([]);
  });

  test('KB-07: entry ids are unique', () => {
    const ids = knowledgeBase.map((e) => e.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
});
