#!/usr/bin/env node
/**
 * CI-CD-7: Screenshot Capture Script
 * Captures full-page screenshots of key sections for visual regression diffing.
 * Runs a local dev server, navigates to each section, and saves PNGs.
 *
 * Usage:
 *   node scripts/ci/capture_screenshots.mjs [--output <dir>] [--base-url <url>]
 *
 * Output: PNG files in the specified directory (default: tests/overhaul/__screenshots__/)
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// Parse CLI args
const args = process.argv.slice(2);
let outDir = resolve(ROOT, 'tests', 'overhaul', '__screenshots__');
let baseUrl = 'http://127.0.0.1:3000';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) { outDir = resolve(args[++i]); }
  else if (args[i] === '--base-url' && args[i + 1]) { baseUrl = args[++i]; }
}

mkdirSync(outDir, { recursive: true });

// Screenshot definitions: each captures a key section at a specific viewport
const captures = [
  { name: 'hero', selector: '#hero', viewport: { width: 1440, height: 900 }, fullPage: false },
  { name: 'about', selector: '#about', viewport: { width: 1440, height: 900 }, fullPage: false },
  { name: 'work', selector: '#work', viewport: { width: 1440, height: 900 }, fullPage: false },
  { name: 'contact', selector: '#contact', viewport: { width: 1440, height: 900 }, fullPage: false },
  { name: 'viewport-top', selector: null, viewport: { width: 1440, height: 900 }, fullPage: false },
  { name: 'nav-open', selector: '.menu-toggle', clickFirst: true, captureSelector: '.nav-overlay', viewport: { width: 1440, height: 900 }, fullPage: false },
];

async function main() {
  // Start Next.js dev server if no server is already running at baseUrl
  let serverProcess = null;
  try {
    await fetch(baseUrl);
    console.log(`Dev server already running at ${baseUrl}`);
  } catch {
    console.log(`Starting dev server at ${baseUrl}...`);
    serverProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' },
    });
    // Wait for server to be ready
    for (let i = 0; i < 60; i++) {
      try {
        await fetch(baseUrl);
        console.log('Dev server ready');
        break;
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const cap of captures) {
    const page = await context.newPage();
    try {
      await page.setViewportSize(cap.viewport);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for preloader to disappear
      const preloader = page.locator('.preloader');
      if (await preloader.isVisible().catch(() => false)) {
        await preloader.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
      }

      // If we need to click something first (e.g., menu toggle)
      if (cap.clickFirst) {
        const trigger = page.locator(cap.selector);
        await trigger.click().catch(() => {});
        await page.waitForTimeout(800);
      }

      // Scroll to target element if specified
      const target = cap.captureSelector || cap.selector;
      if (target) {
        const el = page.locator(target);
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(500);
      }

      const filename = `${cap.name}.png`;
      const filepath = resolve(outDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: cap.fullPage || false,
      });
      console.log(`  Captured: ${filename}`);
    } catch (err) {
      console.error(`  FAILED ${cap.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  if (serverProcess) {
    serverProcess.kill();
  }
  console.log(`\nScreenshots saved to ${outDir}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
