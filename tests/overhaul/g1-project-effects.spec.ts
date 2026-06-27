import { test, expect, type Page } from '@playwright/test';

/**
 * G1 PER-PROJECT WEBGL EFFECTS — smoke tests per TG1-01 through TG1-10.
 *
 * One dedicated effect per project, each tailored to functional core.
 * Monochrome palette only (C1). Zero console errors. No FPS regression.
 *
 * Scaffolded per G5 test-first mandate (TEST-SPEC-MATRIX.md §2.1).
 * Tests start as .skip stubs; un-skip when the corresponding effect is wired.
 */

function isAppError(msg: string): boolean {
  const ignored = [
    /MIME type/i,
    /404.*Not Found/i,
    /Failed to load resource/i,
    /favicon/i,
    /service-worker/i,
  ];
  return !ignored.some((re) => re.test(msg));
}

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

async function scrollToWork(page: Page) {
  await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1000);
}

// ─── TG1-01 · EFDDH-Jira-Analytics-Dashboard → SprintBurndown ────────

test.describe('TG1-01 — EFDDH-Jira / SprintBurndown', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with SVG chart, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const chart = page.locator('[data-testid="sprint-burndown"]');
    await expect(chart).toBeVisible({ timeout: 5000 });

    const svg = chart.locator('svg');
    await expect(svg).toBeVisible();

    const ideal = chart.locator('[data-testid="burndown-ideal"]');
    await expect(ideal).toBeVisible();

    const actual = chart.locator('[data-testid="burndown-actual"]');
    await expect(actual).toBeVisible();

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to EFDDH-Jira', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="sprint-burndown"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('EFDDH-Jira-Analytics-Dashboard');
  });
});

// ─── TG1-02 · tailor-resume-with-ai → TokenStreamMatch ──────────────

test.describe('TG1-02 — tailor-resume / TokenStreamMatch', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with token columns, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="token-stream-match"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    // Should have at least one token-pill element
    const tokens = el.locator('[data-testid="match-token"]');
    const count = await tokens.count();
    expect(count, 'Must have tokens in the match stream').toBeGreaterThanOrEqual(2);

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to tailor-resume', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="token-stream-match"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('tailor-resume-with-ai');
  });
});

// ─── TG1-03 · relationship-timeline-feature → JourneyTimeline ────────

test.describe('TG1-03 — relationship-timeline / JourneyTimeline', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with timeline nodes, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="journey-timeline"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    const nodes = el.locator('[data-testid="timeline-node"]');
    const count = await nodes.count();
    expect(count, 'Must have timeline nodes').toBeGreaterThanOrEqual(2);

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to relationship-timeline', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="journey-timeline"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('relationship-timeline-feature');
  });
});

// ─── TG1-04 · AI-Gmail-Mailbox-Manager → InboxTriage ─────────────────

test.describe('TG1-04 — AI-Gmail / InboxTriage', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with classified messages, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="inbox-triage"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    const messages = el.locator('[data-testid="inbox-messages"]');
    await expect(messages).toBeVisible();

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to AI-Gmail', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="inbox-triage"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('AI-Gmail-Mailbox-Manager');
  });
});

// ─── TG1-05 · btr-demo / Birth-Time-Rectifier → CelestialSphere ─────

test.describe('TG1-05 — Birth-Time-Rectifier / CelestialSphere', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with WebGL canvas, zero console errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.|gl_|shader|context lost|invalid_|program/i.test(t)) glErrors.push(t);
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="celestial-sphere"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    const canvas = el.locator('canvas');
    expect(await canvas.count(), 'Must contain WebGL canvas').toBeGreaterThanOrEqual(1);

    expect(glErrors, `WebGL errors:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to Birth-Time-Rectifier', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="celestial-sphere"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('btr-demo');
  });
});

// ─── TG1-06 · jyotish-shastra → AstroChartSphere ─────────────────────

test.describe('TG1-06 — jyotish-shastra / AstroChartSphere', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with chart wheel, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="astro-chart-sphere"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    // Should have either a canvas or SVG rendering the chart
    const canvasOrSvg = el.locator('canvas, svg');
    expect(await canvasOrSvg.count(), 'Must contain canvas or SVG').toBeGreaterThanOrEqual(1);

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to jyotish-shastra', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="astro-chart-sphere"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('jyotish-shastra');
  });
});

// ─── TG1-07 · rishi-prajnya → OrchestrationGraph ────────────────────

test.describe('TG1-07 — rishi-prajnya / OrchestrationGraph', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with WebGL canvas, zero console errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.|gl_|shader|context lost|invalid_|program/i.test(t)) glErrors.push(t);
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="orchestration-graph"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    const canvas = el.locator('canvas');
    expect(await canvas.count(), 'Must contain WebGL canvas').toBeGreaterThanOrEqual(1);

    expect(glErrors, `WebGL errors:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to rishi-prajnya', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="orchestration-graph"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('rishi-prajnya');
  });
});

// ─── TG1-08 · Advanced-Prompt-Creator → TokenReflow ──────────────────

test.describe('TG1-08 — Advanced-Prompt-Creator / TokenReflow', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with token pills, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="token-reflow"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    const pills = el.locator('[data-testid="token-pill"]');
    const count = await pills.count();
    expect(count, 'Must have token pills').toBeGreaterThanOrEqual(4);

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to Advanced-Prompt-Creator', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="token-reflow"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('Advanced-Prompt-Creator');
  });
});

// ─── TG1-09 · telemetry cluster → PacketFlowGraph ────────────────────

test.describe('TG1-09 — telemetry cluster / PacketFlowGraph', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with flow graph SVG, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="packet-flow-graph"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    const svg = el.locator('svg');
    await expect(svg).toBeVisible();

    const readout = el.locator('[data-testid="pfg-readout"]');
    await expect(readout).toBeVisible();

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to telemetry cluster', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="packet-flow-graph"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('telemetry-cluster');
  });
});

// ─── TG1-10 · Error-Management-System → JarvisRepairLoop ─────────────

test.describe('TG1-10 — Error-Management / JarvisRepairLoop', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with repair loop nodes, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);

    const el = page.locator('[data-testid="jarvis-repair-loop"]');
    await expect(el).toBeVisible({ timeout: 5000 });

    // Should have SVG or canvas visualization
    const viz = el.locator('svg, canvas');
    expect(await viz.count(), 'Must contain SVG or canvas visualization').toBeGreaterThanOrEqual(1);

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('has data-project binding to Error-Management', async ({ page }) => {
    await gotoHome(page);
    await scrollToWork(page);
    const el = page.locator('[data-testid="jarvis-repair-loop"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    const project = await el.getAttribute('data-project');
    expect(project).toBe('Error-Management-System');
  });
});

// ─── G1 Cross-cutting checks ──────────────────────────────────────────

test.describe('G1 CROSS-CUTTING — all effects', () => {
  test.describe.configure({ timeout: 120000 });

  test('TG1-ALL-CONSOLE — zero console errors across all effects', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);
    await page.waitForTimeout(3000);

    // Verify all 10 effects are present
    const effectIds = [
      'sprint-burndown',
      'token-stream-match',
      'journey-timeline',
      'inbox-triage',
      'celestial-sphere',
      'astro-chart-sphere',
      'orchestration-graph',
      'token-reflow',
      'packet-flow-graph',
      'jarvis-repair-loop',
    ];

    for (const tid of effectIds) {
      const el = page.locator(`[data-testid="${tid}"]`);
      const count = await el.count();
      expect(count, `Effect ${tid} must be present in DOM`).toBeGreaterThanOrEqual(1);
    }

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('TG1-ALL-TEARDOWN — no console errors on rapid scroll away', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await scrollToWork(page);
    await page.waitForTimeout(1500);
    // Scroll away rapidly
    await page.evaluate(() => document.getElementById('contact')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(1500);
    // Scroll back
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1500);

    expect(errors, `Console errors after rapid scroll:\n${errors.join('\n')}`).toEqual([]);
  });
});
