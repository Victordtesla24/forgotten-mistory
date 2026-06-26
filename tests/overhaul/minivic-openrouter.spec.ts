import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * TC-FR-CHAT-OPENROUTER — the MiniVic brain's primary tier routes GOOGLE GEMINI
 * models THROUGH OpenRouter, server-side.
 *
 * Owner directive (2026-06-27): "use the OpenRouter API key instead of the Gemini
 * key in case it fails, and choose the Gemini AI models using OpenRouter." The
 * referrer-locked browser Gemini key can be restricted / over quota; routing Gemini
 * models through OpenRouter's server-side key (the same-origin `/api/chat` Firebase
 * Function) makes the brain resilient without ever shipping a real secret to the
 * client. An OpenRouter key (`sk-or-…`) is a TRUE secret — it must stay server-side
 * (a client copy would also trip the static-export secret scan in security.spec.ts).
 *
 * This is a CONFIG-CONTRACT test (no paid OpenRouter call): it proves the function
 * wires Gemini-via-OpenRouter with the key server-side and fallback routing on.
 */
const FN_SRC = readFileSync(join(process.cwd(), 'functions', 'index.js'), 'utf8');

function modelLadder(): string[] {
  const block = FN_SRC.match(/MINIVIC_MODEL_LADDER\s*=\s*\[([\s\S]*?)\]/);
  expect(block, 'MINIVIC_MODEL_LADDER must be defined in functions/index.js').not.toBeNull();
  // Quoted entries only; the env-override token (process.env.OPENROUTER_MODEL) is
  // unquoted, so it is naturally excluded. A model id always contains a "/".
  return (block![1].match(/"([^"]+)"/g) || [])
    .map((s) => s.replace(/"/g, ''))
    .filter((s) => s.includes('/'));
}

test.describe('TC-FR-CHAT-OPENROUTER — Gemini models via OpenRouter (server-side)', () => {
  test('the /api/chat brain calls the OpenRouter chat-completions endpoint with a server-side key', () => {
    expect(FN_SRC).toContain('https://openrouter.ai/api/v1/chat/completions');
    expect(FN_SRC, 'OpenRouter key must be a Secret-Manager secret, not client-side').toContain(
      'defineSecret("OPENROUTER_API_KEY")',
    );
    expect(FN_SRC, 'request must authenticate with the server-side OpenRouter key').toContain(
      'Bearer ${OPENROUTER_API_KEY.value()}',
    );
  });

  test('every configured chat model is a Google Gemini model', () => {
    const models = modelLadder();
    expect(models.length, 'at least one Gemini model must be configured').toBeGreaterThan(0);
    for (const id of models) {
      expect(id, `model "${id}" must be a Google Gemini model served via OpenRouter`).toMatch(
        /^google\/gemini/,
      );
    }
  });

  test('OpenRouter fallback routing is enabled (the Gemini ladder is sent as models[])', () => {
    expect(FN_SRC, 'request body must send the OpenRouter models[] fallback list').toMatch(
      /models:\s*MINIVIC_MODEL_LADDER/,
    );
    expect(modelLadder().length, 'fallback routing needs ≥2 Gemini models').toBeGreaterThanOrEqual(2);
  });

  test('no real OpenRouter secret is hardcoded in the function source', () => {
    expect(FN_SRC, 'the OpenRouter key must come from Secret Manager, never inline').not.toMatch(
      /sk-or-[A-Za-z0-9]/,
    );
  });
});
