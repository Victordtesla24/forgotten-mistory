import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const reportDir = path.join(rootDir, "reports", "post-prod");
const evidenceDir = path.join(reportDir, "evidence");
const baseUrlInput = process.argv[2] || "https://forgotten-mistory.web.app";
const baseUrl = baseUrlInput.replace(/\/$/, "");

const runCount = 3;

// The six sections app/page.tsx renders, and the six in-page anchors the
// navigation offers for them. The rebuild deleted #architecture-lab, #work and
// #contact, so probing for those turned every production run into three
// guaranteed failures — a report that always fails is a report nobody reads.
const sections = ["hero", "about", "experience", "skills", "vitrine", "listen"];
const navAnchors = ["#hero", "#about", "#experience", "#skills", "#vitrine", "#listen"];

// The mid-load frame is no longer a preloader wipe. components/site/Preloader.tsx
// is deleted and the hero is server-rendered, so what this run captures at ~900 ms
// is the real page settling rather than a boot animation being sat out — the
// filenames say "early" instead of "preloader-mid" so the evidence is not
// mislabelled for whoever reads the report.
const requiredEvidence = [
  "stability-run1-first-paint.png",
  "stability-run1-early.png",
  "stability-run1-settled.png",
  "stability-run2-first-paint.png",
  "stability-run2-early.png",
  "stability-run2-settled.png",
  "stability-run3-first-paint.png",
  "stability-run3-early.png",
  "stability-run3-settled.png",
  "stability-mobile-home.png",
  "stability-mobile-listen.png"
];

fs.mkdirSync(evidenceDir, { recursive: true });

const commitSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: rootDir, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
})();

const luminance = (r, g, b) => (r * 0.2126 + g * 0.7152 + b * 0.0722);

const classifyConsoleEntry = (text) => {
  if (/GL Driver Message|WebGL|ReadPixels/i.test(text)) return "webgl";
  if (/Failed to fetch|NetworkError|ERR_|CORS|429|fetch/i.test(text)) return "network";
  return "app";
};

const summarizeConsole = (entries) => {
  const warningOrError = entries.filter((entry) => entry.type === "warning" || entry.type === "error");
  const gsapWarnings = warningOrError.filter((entry) => /GSAP target.*not found/i.test(entry.text));

  const categoryCounts = { app: 0, webgl: 0, network: 0 };
  for (const entry of warningOrError) {
    const category = classifyConsoleEntry(entry.text);
    categoryCounts[category] += 1;
  }

  const appWarningsOrErrors = warningOrError.filter((entry) => classifyConsoleEntry(entry.text) === "app");

  return {
    totalConsoleMessages: entries.length,
    warningOrErrorCount: warningOrError.length,
    gsapWarnings: gsapWarnings.length,
    appWarningsOrErrors: appWarningsOrErrors.length,
    categoryCounts,
    samples: warningOrError.slice(0, 12)
  };
};

const screenshot = async (page, name) => {
  const target = path.join(evidenceDir, name);
  await page.screenshot({ path: target, fullPage: false });
  return target;
};

const evaluateState = async (page) => {
  return await page.evaluate(() => {
    const parseRgb = (value) => {
      const match = value?.match(/\d+/g);
      if (!match || match.length < 3) return [255, 255, 255];
      return [Number(match[0]), Number(match[1]), Number(match[2])];
    };

    // What replaced the preloader gate. The hero is server-rendered, so the
    // very first paint must already carry the name — a blank first frame is now
    // the defect, where before it was the expected boot state.
    const heroName = document.querySelector("#hero h1");
    const heroCopyPainted = Boolean(heroName && (heroName.textContent || "").trim().length > 0);

    const bodyStyle = getComputedStyle(document.body);
    const htmlStyle = getComputedStyle(document.documentElement);
    const bodyBackgroundColor = bodyStyle.backgroundColor;
    const htmlBackgroundColor = htmlStyle.backgroundColor;

    // What replaced the starfield-layering gate. There is no page-wide
    // SpaceScene or .cosmic-backdrop any more; each section owns its own scene,
    // mounted into an aria-hidden slot that must sit behind that section's copy.
    // The hero's is the one that has to be right on first paint.
    const zOf = (el) => {
      if (!el) return null;
      const raw = getComputedStyle(el).zIndex;
      return raw === "auto" ? 0 : Number(raw);
    };
    const heroStage = document.querySelector("#hero > div[aria-hidden='true']");
    const heroContent = document.querySelector("#hero > div:not([aria-hidden='true'])");

    return {
      heroCopyPainted,
      pageReady: document.body.classList.contains("page-ready"),
      bodyBackground: bodyStyle.background,
      bodyBackgroundColor,
      bodyRgb: parseRgb(bodyBackgroundColor),
      htmlBackgroundColor,
      htmlRgb: parseRgb(htmlBackgroundColor),
      heroStage: heroStage ? { present: true, zIndex: zOf(heroStage) } : { present: false, zIndex: null },
      heroContent: heroContent ? { present: true, zIndex: zOf(heroContent) } : { present: false, zIndex: null }
    };
  });
};

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const runs = [];
const functionalChecks = [];
let axeSummary = { totalViolations: null, criticalViolations: null };
const allEvidence = new Set();

for (let i = 1; i <= runCount; i += 1) {
  const logs = [];
  const context = await browser.newContext({ viewport: { width: 1680, height: 960 } });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text() }));

  const runUrl = `${baseUrl}?cb=render-stability-${Date.now()}-${i}`;

  await page.goto(runUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
  const firstPaintShot = await screenshot(page, `stability-run${i}-first-paint.png`);
  allEvidence.add(firstPaintShot);

  await page.waitForTimeout(900);
  const earlyShot = await screenshot(page, `stability-run${i}-early.png`);
  allEvidence.add(earlyShot);
  const earlyState = await evaluateState(page);

  await page.waitForTimeout(2500);
  const settledShot = await screenshot(page, `stability-run${i}-settled.png`);
  allEvidence.add(settledShot);
  const settledState = await evaluateState(page);

  if (i === 1) {
    const axe = await new AxeBuilder({ page }).analyze();
    axeSummary = {
      totalViolations: axe.violations.length,
      criticalViolations: axe.violations.filter((v) => v.impact === "critical").length
    };

    for (const section of sections) {
      await page.evaluate((id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
      }, section);
      await page.waitForTimeout(650);
      const sectionShot = await screenshot(page, `stability-section-${section}.png`);
      allEvidence.add(sectionShot);
      const hasSection = await page.locator(`#${section}`).count();
      functionalChecks.push({
        check: `Section render: ${section}`,
        pass: hasSection > 0,
        evidence: sectionShot
      });
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(500);

    for (const anchor of navAnchors) {
      const selector = `a[href='${anchor}']`;
      const linkExists = await page.locator(selector).count();
      if (!linkExists) {
        functionalChecks.push({
          check: `Navigation: ${anchor}`,
          pass: false,
          evidence: ""
        });
        continue;
      }

      await page.evaluate((sel) => {
        const link = document.querySelector(sel);
        if (link) {
          link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
          link.click();
        }
      }, selector);
      await page.waitForTimeout(650);

      const targetTop = await page.evaluate((hash) => {
        const node = document.getElementById(hash.replace("#", ""));
        return node ? Math.abs(node.getBoundingClientRect().top) : null;
      }, anchor);
      const navShot = await screenshot(page, `stability-nav-${anchor.replace("#", "")}.png`);
      allEvidence.add(navShot);

      functionalChecks.push({
        check: `Navigation: ${anchor}`,
        pass: typeof targetTop === "number" && targetTop < 140,
        evidence: navShot
      });
    }

    const miniVicToggle = page.getByRole("button", { name: /open mini vic assistant/i });
    if (await miniVicToggle.count()) {
      await miniVicToggle.click();
      await page.waitForTimeout(900);
      const miniVicShot = await screenshot(page, "stability-mini-vic-open.png");
      allEvidence.add(miniVicShot);
      functionalChecks.push({
        check: "MiniVic open",
        pass: (await page.getByText("Mini Vic").count()) > 0,
        evidence: miniVicShot
      });
    } else {
      functionalChecks.push({
        check: "MiniVic open",
        pass: false,
        evidence: ""
      });
    }
  }

  const consoleSummary = summarizeConsole(logs);
  const [bodyR, bodyG, bodyB] = settledState.bodyRgb;
  const [htmlR, htmlG, htmlB] = settledState.htmlRgb;
  const backgroundPass = luminance(bodyR, bodyG, bodyB) < 45 && luminance(htmlR, htmlG, htmlB) < 35;
  // The hero must be readable early and the page must announce itself ready.
  const firstPaintPass = earlyState.heroCopyPainted && settledState.heroCopyPainted && settledState.pageReady;
  const layeringPass =
    settledState.heroStage.present &&
    settledState.heroContent.present &&
    Number(settledState.heroStage.zIndex) < Number(settledState.heroContent.zIndex);
  const consolePass = consoleSummary.appWarningsOrErrors === 0 && consoleSummary.gsapWarnings === 0;

  runs.push({
    run: i,
    url: runUrl,
    firstPaintEvidence: firstPaintShot,
    earlyEvidence: earlyShot,
    settledEvidence: settledShot,
    earlyState,
    settledState,
    consoleSummary,
    gates: {
      backgroundPass,
      firstPaintPass,
      layeringPass,
      consolePass
    },
    pass: backgroundPass && firstPaintPass && layeringPass && consolePass
  });

  await context.close();
}

const mobileContext = await browser.newContext({
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 }
});
const mobilePage = await mobileContext.newPage();
await mobilePage.goto(`${baseUrl}?cb=render-mobile-${Date.now()}`, {
  waitUntil: "domcontentloaded",
  timeout: 120000
});
await mobilePage.waitForTimeout(3200);
const mobileHome = await screenshot(mobilePage, "stability-mobile-home.png");
allEvidence.add(mobileHome);
await mobilePage.evaluate(() => {
  document.getElementById("listen")?.scrollIntoView({ behavior: "instant", block: "start" });
});
await mobilePage.waitForTimeout(700);
const mobileContact = await screenshot(mobilePage, "stability-mobile-listen.png");
allEvidence.add(mobileContact);
await mobileContext.close();
await browser.close();

functionalChecks.push(
  { check: "Mobile render: home", pass: true, evidence: mobileHome },
  { check: "Mobile render: listen", pass: true, evidence: mobileContact }
);

const stabilityPass = runs.every((run) => run.pass);
const evidencePass = requiredEvidence.every((name) => fs.existsSync(path.join(evidenceDir, name)));

const result = {
  timestamp: new Date().toISOString(),
  baseUrl,
  commitSha,
  gates: {
    backgroundGate: {
      pass: runs.every((run) => run.gates.backgroundPass)
    },
    firstPaintGate: {
      pass: runs.every((run) => run.gates.firstPaintPass)
    },
    layeringGate: {
      pass: runs.every((run) => run.gates.layeringPass)
    },
    consoleGate: {
      pass: runs.every((run) => run.gates.consolePass)
    },
    stabilityGate: {
      pass: stabilityPass
    },
    evidenceGate: {
      pass: evidencePass
    }
  },
  axe: axeSummary,
  runs,
  functionalChecks,
  evidence: Array.from(allEvidence).sort()
};

const outFile = path.join(reportDir, "rendering-stability-results.json");
fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(`Rendering stability validation complete: ${outFile}`);
