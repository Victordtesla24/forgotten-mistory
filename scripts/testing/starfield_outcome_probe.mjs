import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const baseUrl = process.argv[2] || "http://127.0.0.1:8080";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const evidenceDir = path.join(rootDir, "reports", "post-prod", "evidence", `starfield-outcomes-${stamp}`);

fs.mkdirSync(evidenceDir, { recursive: true });

const checks = [];

const shot = async (page, file, fullPage = false) => {
  const target = path.join(evidenceDir, file);
  await page.screenshot({ path: target, fullPage });
  return target;
};

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 900 }
});
const desktop = await desktopContext.newPage();
desktop.setDefaultTimeout(20000);

await desktop.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
await desktop.waitForTimeout(4200);

const sceneHealth = await desktop.evaluate(() => {
  const sceneStack = document.querySelector(".scene-stack");
  const layer = document.querySelector(".space-scene-layer");
  const canvas = layer?.querySelector("canvas");
  if (!sceneStack || !layer || !canvas) {
    return {
      ok: false,
      reason: "missing scene stack / layer / canvas"
    };
  }

  const sceneStyle = window.getComputedStyle(sceneStack);
  const layerStyle = window.getComputedStyle(layer);
  const canvasStyle = window.getComputedStyle(canvas);
  const rect = canvas.getBoundingClientRect();

  const fixedScene = sceneStyle.position === "fixed";
  const layerVisible =
    (layerStyle.position === "absolute" || layerStyle.position === "fixed") &&
    layerStyle.visibility !== "hidden" &&
    Number.parseFloat(layerStyle.opacity || "1") > 0;
  const canvasVisible =
    canvasStyle.display !== "none" &&
    canvasStyle.visibility !== "hidden" &&
    Number.parseFloat(canvasStyle.opacity || "1") > 0;
  const fullViewport =
    rect.width >= window.innerWidth * 0.95 && rect.height >= window.innerHeight * 0.95;

  return {
    ok: fixedScene && layerVisible && canvasVisible && fullViewport,
    fixedScene,
    layerVisible,
    canvasVisible,
    fullViewport,
    rect: {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  };
});

checks.push({
  feature: "Scene stack and starfield canvas health",
  status: sceneHealth.ok ? "PASS" : "FAIL",
  details: sceneHealth
});

checks.push({
  feature: "Starfield top viewport evidence",
  status: "PASS",
  evidence: await shot(desktop, "01-starfield-top.png")
});

await desktop.evaluate(() => {
  window.scrollTo({ top: Math.round(document.body.scrollHeight * 0.45), behavior: "instant" });
});
await desktop.waitForTimeout(900);
checks.push({
  feature: "Starfield mid viewport evidence",
  status: "PASS",
  evidence: await shot(desktop, "02-starfield-mid.png")
});

await desktop.evaluate(() => {
  const contact = document.getElementById("contact");
  if (contact) {
    contact.scrollIntoView({ behavior: "instant", block: "start" });
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
  }
});
await desktop.waitForTimeout(900);
checks.push({
  feature: "Starfield lower viewport evidence",
  status: "PASS",
  evidence: await shot(desktop, "03-starfield-lower.png")
});

await desktop.evaluate(() => {
  const outcomes = document.querySelector(".hero-meta");
  outcomes?.scrollIntoView({ behavior: "instant", block: "center" });
});
await desktop.waitForTimeout(1100);

const outcomeStates = await desktop.$$eval("[data-outcome-card]", (cards) =>
  cards.map((card) => ({
    index: card.getAttribute("data-outcome-index"),
    state: card.getAttribute("data-anim-state"),
    opacity: window.getComputedStyle(card).opacity
  }))
);

const allRevealed = outcomeStates.length > 0 && outcomeStates.every((x) => x.state === "revealed");
checks.push({
  feature: "Outcome cards reveal state reached",
  status: allRevealed ? "PASS" : "FAIL",
  details: outcomeStates
});

checks.push({
  feature: "Business outcomes resting-state evidence",
  status: "PASS",
  evidence: await shot(desktop, "04-outcomes-resting.png")
});

const firstOutcome = desktop.locator("[data-outcome-card]").first();
if (await firstOutcome.count()) {
  await firstOutcome.hover();
  await desktop.waitForTimeout(550);
}
checks.push({
  feature: "Business outcomes hover-state evidence",
  status: "PASS",
  evidence: await shot(desktop, "05-outcomes-hover.png")
});

if (await firstOutcome.count()) {
  await firstOutcome.click();
  await desktop.waitForTimeout(900);
}
const detailOpen = await desktop.getByText("View Full Document").count();
checks.push({
  feature: "Business outcomes click/open interaction",
  status: detailOpen > 0 ? "PASS" : "FAIL",
  evidence: await shot(desktop, "06-outcomes-detail-open.png")
});

await desktop.keyboard.press("Escape");
await desktop.waitForTimeout(400);

checks.push({
  feature: "Full-page polish reference evidence",
  status: "PASS",
  evidence: await shot(desktop, "07-polish-fullpage.png", true)
});

await desktopContext.close();

const reducedContext = await browser.newContext({
  ...devices["Desktop Chrome"],
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce"
});
const reducedPage = await reducedContext.newPage();
reducedPage.setDefaultTimeout(20000);

await reducedPage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
await reducedPage.waitForTimeout(3400);

const reducedCheck = await reducedPage.evaluate(() => {
  const firstCard = document.querySelector("[data-outcome-card]");
  if (!firstCard) return { ok: false, reason: "missing first outcome card" };
  const state = firstCard.getAttribute("data-anim-state");
  const opacity = Number.parseFloat(window.getComputedStyle(firstCard).opacity || "0");
  const cursorEnhanced = document.body.classList.contains("cursor-enhanced");
  return {
    ok: state === "revealed" && opacity > 0.95 && !cursorEnhanced,
    state,
    opacity,
    cursorEnhanced
  };
});

checks.push({
  feature: "Reduced-motion guard behavior",
  status: reducedCheck.ok ? "PASS" : "FAIL",
  details: reducedCheck,
  evidence: await shot(reducedPage, "08-reduced-motion.png")
});

await reducedContext.close();
await browser.close();

const summary = {
  timestamp: new Date().toISOString(),
  baseUrl,
  evidenceDir,
  checks
};

const summaryPath = path.join(evidenceDir, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
