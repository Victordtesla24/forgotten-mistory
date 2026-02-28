import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const reportDir = path.join(rootDir, "reports", "phase04");
const outFile = path.join(reportDir, "fps-metrics.json");

fs.mkdirSync(reportDir, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--no-sandbox", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"]
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(4000);
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.35, behavior: "auto" }));
await page.waitForTimeout(500);

const fps = await page.evaluate(async () => {
  return await new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const measure = (ts) => {
      frames += 1;
      const elapsed = ts - start;
      if (elapsed >= 4000) {
        resolve((frames * 1000) / elapsed);
        return;
      }
      requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);
  });
});

await browser.close();

const metrics = { timestamp: new Date().toISOString(), fps };
fs.writeFileSync(outFile, JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(metrics));
