#!/usr/bin/env node
/**
 * Adversarial evidence harness — captures HONEST, reproducible runtime evidence
 * of the live (or local) portfolio for a 3rd-party UI/UX review.
 *
 * For each viewport it records: every console message, every uncaught page error,
 * every failed network request, per-section screenshots, a runtime monochrome
 * probe, broken-image detection, and hero nav/H1 collision geometry. It then
 * drives the MiniVic chatbot through several real questions and records the
 * replies + latency. Everything lands under reports/adversarial/<label>/.
 *
 * Usage:
 *   node scripts/testing/adversarial_evidence.mjs                 # live site
 *   BASE_URL=http://127.0.0.1:8080 RUN_LABEL=local node scripts/testing/adversarial_evidence.mjs
 *
 * This is a verification tool, not a pass/fail gate: it always exits 0 unless it
 * cannot reach the target at all. The captured JSON + PNGs are the deliverable.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "https://forgotten-mistory.web.app";
const RUN_LABEL = process.env.RUN_LABEL || "live";
const OUT_ROOT = path.resolve("reports/adversarial", RUN_LABEL);

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const SECTIONS = [
  "hero",
  "proof",
  "about",
  "experience",
  "skills",
  "architecture-lab",
  "arch-explainer",
  "work",
  "projects-carousel",
  "github-projects",
  "mindset",
  "synthesis",
  "dossier",
  "contact",
];

const CHAT_QUESTIONS = [
  "What is your current role and are you available for a new full-time position?",
  "Give me three concrete, measurable outcomes you have delivered.",
  "What are your rates and engagement models for AI consulting?",
  "asdkjf qwerty??",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureViewport(browser, vp) {
  const dir = path.join(OUT_ROOT, vp.name);
  await mkdir(dir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    userAgent:
      vp.name === "mobile"
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
  });
  const page = await context.newPage();

  const consoleMsgs = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    consoleMsgs.push({ type: msg.type(), text: msg.text().slice(0, 500) });
  });
  page.on("pageerror", (err) => {
    pageErrors.push({ message: String(err.message || err).slice(0, 500), stack: String(err.stack || "").slice(0, 800) });
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    // Third-party YouTube/ads chatter is itself a finding, but tag it so the
    // reviewer can separate first-party failures from the embed's own churn.
    failedRequests.push({
      url: url.slice(0, 200),
      method: req.method(),
      failure: req.failure()?.errorText || "unknown",
      thirdParty: !url.includes("forgotten-mistory.web.app"),
    });
  });

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Let the preloader clear and hero animations settle.
  await sleep(6000);

  // Scroll through the whole page in steps to trigger scroll-driven animations,
  // lazy mounts, and IntersectionObservers, collecting console noise as we go.
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const step = Math.round(vp.height * 0.75);
  for (let y = 0; y < scrollHeight; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(450);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);

  // Runtime probes.
  const probes = await page.evaluate(() => {
    const inGray = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return true;
      const [r, g, b, a] = m[1].split(",").map((s) => parseFloat(s));
      if (a === 0) return true;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      return mx - mn <= 6; // near-gray tolerance
    };
    const chromatic = [];
    const els = document.querySelectorAll("*");
    for (const el of els) {
      const cs = getComputedStyle(el);
      for (const prop of ["color", "backgroundColor", "borderColor"]) {
        const v = cs[prop];
        if (v && v !== "rgba(0, 0, 0, 0)" && !inGray(v)) {
          chromatic.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 60), prop, value: v });
          break;
        }
      }
      if (chromatic.length > 25) break;
    }
    const brokenImgs = Array.from(document.images)
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src)
      .slice(0, 20);
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const overlaps = (a, b) => a && b && !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
    const h1 = document.querySelector("#hero h1") || document.querySelector("h1");
    const brand = document.querySelector("nav a, header a");
    const h1r = rect(h1), br = rect(brand);
    // horizontal-scroll / overflow probe
    const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return {
      chromaticSample: chromatic,
      chromaticCount: chromatic.length,
      brokenImages: brokenImgs,
      heroBrandH1Overlap: overlaps(h1r, br),
      h1Rect: h1r,
      brandRect: br,
      overflowXpx: overflowX,
    };
  });

  // Per-section screenshots. We scroll via evaluate() (instant, no actionability
  // wait — perpetual scene animations make scrollIntoViewIfNeeded time out) and
  // take a reliable full-viewport screenshot after letting the section settle.
  const shots = [];
  for (let i = 0; i < SECTIONS.length; i++) {
    const id = SECTIONS[i];
    const file = path.join(dir, `${String(i + 1).padStart(2, "0")}-${id}.png`);
    try {
      const found = await page.evaluate((sid) => {
        const el = document.getElementById(sid);
        if (!el) return false;
        const y = el.getBoundingClientRect().top + window.scrollY - 72; // clear fixed nav
        window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
        return true;
      }, id);
      if (!found) {
        shots.push({ id, ok: false, reason: "not found" });
        continue;
      }
      await sleep(1200); // let scroll-triggered reveals/animations settle
      await page.screenshot({ path: file });
      shots.push({ id, file, ok: true });
    } catch (e) {
      shots.push({ id, ok: false, reason: String(e.message || e).slice(0, 140) });
    }
  }

  // Chatbot exercise (desktop only, where the panel has room). We drive the
  // widget through evaluate() — the toggle's ping-animation overlay intercepts
  // Playwright's actionability click, so we call .click() in-page directly.
  let chat = null;
  if (vp.name === "desktop") {
    chat = { questions: [] };
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(700);
      const opened = await page.evaluate(() => {
        const t = document.querySelector('[data-testid="minivic-toggle"]');
        if (!t) return false;
        t.click();
        return true;
      });
      if (!opened) throw new Error("minivic toggle not found");
      await sleep(3800);
      const greeting = await page.$$eval("[data-minivic-message]", (ns) =>
        ns.map((n) => n.innerText.replace(/\s+/g, " ").trim().slice(0, 300))
      );
      chat.greeting = greeting[0] || null;
      await page.screenshot({ path: path.join(dir, "90-chat-open.png") });

      for (const q of CHAT_QUESTIONS) {
        const res = await page.evaluate(async (question) => {
          const input = document.querySelector('[data-testid="minivic-input"]');
          const form = input && input.closest("form");
          if (!input || !form) return { error: "no input/form" };
          const before = document.querySelectorAll("[data-minivic-message]").length;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(input, question);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          const t0 = performance.now();
          if (form.requestSubmit) form.requestSubmit();
          else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          let reply = "(no reply in 25s)";
          for (let i = 0; i < 50; i++) {
            await new Promise((r) => setTimeout(r, 500));
            const nodes = document.querySelectorAll("[data-minivic-message]");
            if (nodes.length >= before + 2) {
              reply = nodes[nodes.length - 1].innerText.replace(/\s+/g, " ").trim();
              break;
            }
          }
          return { latencyMs: Math.round(performance.now() - t0), reply: reply.slice(0, 800) };
        }, q);
        chat.questions.push({ q, ...res });
      }
      await page.screenshot({ path: path.join(dir, "91-chat-conversation.png") });
    } catch (e) {
      chat.error = String(e.message || e).slice(0, 200);
    }
  }

  await context.close();

  const summary = {
    viewport: vp,
    baseUrl: BASE_URL,
    scrollHeight,
    consoleMsgs,
    consoleErrorCount: consoleMsgs.filter((m) => m.type === "error").length,
    consoleWarnCount: consoleMsgs.filter((m) => m.type === "warning").length,
    pageErrors,
    failedRequests,
    firstPartyFailedRequests: failedRequests.filter((r) => !r.thirdParty),
    probes,
    shots,
    chat,
  };
  await writeFile(path.join(dir, "summary.json"), JSON.stringify(summary, null, 2));
  return summary;
}

async function main() {
  await mkdir(OUT_ROOT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = {};
  for (const vp of VIEWPORTS) {
    console.log(`\n▶ Capturing ${vp.name} (${vp.width}×${vp.height}) against ${BASE_URL} …`);
    results[vp.name] = await captureViewport(browser, vp);
    const s = results[vp.name];
    console.log(
      `  console errors: ${s.consoleErrorCount} · warnings: ${s.consoleWarnCount} · page errors: ${s.pageErrors.length} · 1st-party failed reqs: ${s.firstPartyFailedRequests.length} · chromatic: ${s.probes.chromaticCount} · overflowX: ${s.probes.overflowXpx}px · hero collision: ${s.probes.heroBrandH1Overlap}`
    );
  }
  await browser.close();
  await writeFile(path.join(OUT_ROOT, "index.json"), JSON.stringify({ baseUrl: BASE_URL, label: RUN_LABEL, viewports: Object.keys(results) }, null, 2));
  console.log(`\n✅ Evidence written to ${OUT_ROOT}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
