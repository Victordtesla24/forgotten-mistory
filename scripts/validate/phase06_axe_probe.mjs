import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const reportDir = path.join(rootDir, "reports", "phase06");
const outFile = path.join(reportDir, "axe-results.json");

fs.mkdirSync(reportDir, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle", timeout: 120000 });

const axeResults = await new AxeBuilder({ page }).analyze();
const criticalViolations = axeResults.violations.filter((v) => v.impact === "critical");

const jsonLd = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
  nodes.map((n) => n.textContent || "")
);
const parsedSchemas = jsonLd.map((raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
});
const hasWebsite = parsedSchemas.some((s) => s?.["@type"] === "WebSite");
const hasPerson = parsedSchemas.some((s) => s?.["@type"] === "Person");

await browser.close();

const payload = {
  timestamp: new Date().toISOString(),
  totalViolations: axeResults.violations.length,
  criticalViolations: criticalViolations.length,
  hasWebsiteSchema: hasWebsite,
  hasPersonSchema: hasPerson
};

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
console.log(JSON.stringify(payload, null, 2));
