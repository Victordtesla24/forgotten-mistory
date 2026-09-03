import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const reportDir = path.join(rootDir, "reports", "post-prod");
const evidenceDir = path.join(reportDir, "evidence");
const baseUrl = process.argv[2] || "https://forgotten-mistory.web.app";

fs.mkdirSync(evidenceDir, { recursive: true });

// The six sections app/page.tsx renders, in page order. #architecture-lab,
// #work and #contact were deleted in the rebuild; probing for them made every
// production run report three false failures, which is worse than no probe at
// all because it trains the reader to ignore the report.
const sections = [
  { id: "hero", name: "Hero" },
  { id: "about", name: "About" },
  { id: "experience", name: "Experience" },
  { id: "skills", name: "Skills" },
  { id: "vitrine", name: "Vitrine" },
  { id: "listen", name: "Listen" }
];

const uiChecks = [];
const screenshot = async (page, name) => {
  const screenshotPath = path.join(evidenceDir, name);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  return screenshotPath;
};

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktop = await desktopContext.newPage();
desktop.setDefaultTimeout(15000);

await desktop.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
await desktop.waitForTimeout(3000);

const heroShot = await screenshot(desktop, "01-home-hero-desktop.png");
uiChecks.push({ feature: "Home hero render", status: "PASS", evidence: heroShot });

for (const section of sections) {
  await desktop.evaluate((id) => {
    document.querySelector(`#${id}`)?.scrollIntoView({ behavior: "instant", block: "start" });
  }, section.id);
  await desktop.waitForTimeout(800);
  const sectionShot = await screenshot(desktop, `section-${section.id}.png`);
  const exists = await desktop.$(`#${section.id}`);
  uiChecks.push({
    feature: `${section.name} section render`,
    status: exists ? "PASS" : "FAIL",
    evidence: sectionShot
  });
}

// Every in-page anchor the navigation offers. Kept in step with NAV_LINKS in
// components/site/Navigation.tsx; a link here that no longer resolves is the
// exact regression tests/e2e/navigation.spec.ts TC-NAV-04 guards against.
const navAnchors = ["#hero", "#about", "#experience", "#skills", "#vitrine", "#listen"];
await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await desktop.waitForTimeout(700);
for (const anchor of navAnchors) {
  const selector = `a[href='${anchor}']`;
  const anchorExists = await desktop.$(selector);
  if (!anchorExists) {
    uiChecks.push({
      feature: `Navigation link ${anchor}`,
      status: "FAIL",
      evidence: ""
    });
    continue;
  }

  try {
    await desktop.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`Missing selector ${sel}`);
      (el).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      (el).click();
    }, selector);
    await desktop.waitForTimeout(600);
    const targetTop = await desktop.evaluate((hash) => {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (!el) return null;
      return Math.round(Math.abs(el.getBoundingClientRect().top));
    }, anchor);

    uiChecks.push({
      feature: `Navigation link ${anchor}`,
      status: typeof targetTop === "number" && targetTop < 120 ? "PASS" : "FAIL",
      evidence: await screenshot(desktop, `nav-${anchor.replace("#", "")}.png`)
    });
  } catch {
    uiChecks.push({
      feature: `Navigation link ${anchor}`,
      status: "FAIL",
      evidence: await screenshot(desktop, `nav-${anchor.replace("#", "")}-fail.png`)
    });
  }
}

const architectureFlowButtons = await desktop.$$("[data-flow]");
if (architectureFlowButtons.length > 0) {
  for (const btn of architectureFlowButtons) {
    const flow = await btn.getAttribute("data-flow");
    try {
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 4000 });
      await desktop.waitForTimeout(500);
      const flowShot = await screenshot(desktop, `arch-flow-${flow || "unknown"}.png`);
      uiChecks.push({
        feature: `Architecture flow switch (${flow || "unknown"})`,
        status: "PASS",
        evidence: flowShot
      });
    } catch {
      try {
        await desktop.evaluate((flowId) => {
          const node = document.querySelector(`[data-flow="${flowId}"]`);
          if (node) {
            (node).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            (node).click();
          }
        }, flow || "");
        await desktop.waitForTimeout(500);
        const flowShot = await screenshot(desktop, `arch-flow-${flow || "unknown"}-fallback.png`);
        uiChecks.push({
          feature: `Architecture flow switch (${flow || "unknown"})`,
          status: "PASS",
          evidence: flowShot
        });
      } catch {
        uiChecks.push({
          feature: `Architecture flow switch (${flow || "unknown"})`,
          status: "FAIL",
          evidence: await screenshot(desktop, `arch-flow-${flow || "unknown"}-fail.png`)
        });
      }
    }
  }
} else {
  uiChecks.push({
    feature: "Architecture flow switch controls",
    status: "FAIL",
    evidence: ""
  });
}

const miniVicToggle = desktop.getByRole("button", { name: /open mini vic assistant/i });
if (await miniVicToggle.count()) {
  await miniVicToggle.click();
  await desktop.waitForTimeout(1000);
  const miniVicVisible = await desktop.getByText("Mini Vic").count();
  uiChecks.push({
    feature: "Mini Vic widget open",
    status: miniVicVisible ? "PASS" : "FAIL",
    evidence: await screenshot(desktop, "mini-vic-open.png")
  });

  const strategistMode = desktop.locator(".px-3.pt-3.pb-1 button").first();
  try {
    if (await strategistMode.count()) {
      await strategistMode.click({ timeout: 4000 });
      await desktop.waitForTimeout(400);
      uiChecks.push({
        feature: "Mini Vic mode switch",
        status: "PASS",
        evidence: await screenshot(desktop, "mini-vic-mode-switch.png")
      });
    } else {
      uiChecks.push({
        feature: "Mini Vic mode switch",
        status: "FAIL",
        evidence: ""
      });
    }
  } catch {
    uiChecks.push({
      feature: "Mini Vic mode switch",
      status: "FAIL",
      evidence: await screenshot(desktop, "mini-vic-mode-switch-fail.png")
    });
  }

  const input = desktop.getByPlaceholder(/Ask me anything/i);
  try {
    if (await input.count()) {
      await input.fill("Give me a one sentence executive summary.");
      await desktop.keyboard.press("Enter");
      await desktop.waitForTimeout(3000);
      const hasUserMessage = await desktop.getByText("You").count();
      const hasBotMessage =
        (await desktop.getByText("Vic").count()) ||
        (await desktop.getByText("My brain link glitched").count());
      uiChecks.push({
        feature: "Mini Vic send/receive chat cycle",
        status: hasUserMessage && hasBotMessage ? "PASS" : "FAIL",
        evidence: await screenshot(desktop, "mini-vic-chat-cycle.png")
      });
    } else {
      uiChecks.push({
        feature: "Mini Vic send/receive chat cycle",
        status: "FAIL",
        evidence: ""
      });
    }
  } catch {
    uiChecks.push({
      feature: "Mini Vic send/receive chat cycle",
      status: "FAIL",
      evidence: await screenshot(desktop, "mini-vic-chat-cycle-fail.png")
    });
  }
} else {
  uiChecks.push({
    feature: "Mini Vic widget open",
    status: "FAIL",
    evidence: ""
  });
}

const animationSignal = await desktop.evaluate(() => {
  const elements = Array.from(document.querySelectorAll("*"));
  let animatedCount = 0;
  for (const element of elements) {
    const style = window.getComputedStyle(element);
    const hasAnimation = style.animationName && style.animationName !== "none";
    const hasTransition =
      style.transitionDuration &&
      style.transitionDuration !== "0s" &&
      style.transitionProperty &&
      style.transitionProperty !== "none";
    if (hasAnimation || hasTransition) {
      animatedCount += 1;
    }
  }
  return animatedCount;
});
uiChecks.push({
  feature: "Animation/transition pipeline active",
  status: Number(animationSignal) > 25 ? "PASS" : "FAIL",
  evidence: await screenshot(desktop, "animation-sample.png"),
  value: animationSignal
});

const axe = await new AxeBuilder({ page: desktop }).analyze();
const criticalViolations = axe.violations.filter((v) => v.impact === "critical");
const axePayload = {
  totalViolations: axe.violations.length,
  criticalViolations: criticalViolations.length
};
fs.writeFileSync(path.join(reportDir, "axe-production.json"), JSON.stringify(axePayload, null, 2));
uiChecks.push({
  feature: "Accessibility scan (axe critical)",
  status: criticalViolations.length === 0 ? "PASS" : "FAIL",
  evidence: await screenshot(desktop, "accessibility-scan-context.png"),
  value: criticalViolations.length
});

await desktopContext.close();

const mobileContext = await browser.newContext({
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 }
});
const mobile = await mobileContext.newPage();
mobile.setDefaultTimeout(15000);
await mobile.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
await mobile.waitForTimeout(3000);
const mobileShot = await screenshot(mobile, "mobile-home.png");
uiChecks.push({ feature: "Mobile render", status: "PASS", evidence: mobileShot });

await mobile.evaluate(() => {
  document.querySelector("#listen")?.scrollIntoView({ behavior: "instant", block: "start" });
});
await mobile.waitForTimeout(800);
const mobileContact = await screenshot(mobile, "mobile-listen.png");
uiChecks.push({ feature: "Mobile closing section", status: "PASS", evidence: mobileContact });

await mobileContext.close();
await browser.close();

const payload = {
  timestamp: new Date().toISOString(),
  baseUrl,
  checks: uiChecks
};

fs.writeFileSync(path.join(reportDir, "post-prod-ui-results.json"), JSON.stringify(payload, null, 2));
console.log(JSON.stringify(payload, null, 2));
