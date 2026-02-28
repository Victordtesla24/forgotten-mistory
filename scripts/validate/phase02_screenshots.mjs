import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const outDir = path.join(rootDir, "reports", "phase02", "screenshots");
const url = "http://127.0.0.1:3000/performance-benchmark";
const viewports = [
  { width: 375, height: 812, name: "375x812" },
  { width: 768, height: 1024, name: "768x1024" },
  { width: 1440, height: 900, name: "1440x900" },
  { width: 2560, height: 1440, name: "2560x1440" }
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({
    path: path.join(outDir, `phase02-${vp.name}.png`),
    fullPage: true
  });
}

await browser.close();
console.log(`Saved screenshots to ${outDir}`);
