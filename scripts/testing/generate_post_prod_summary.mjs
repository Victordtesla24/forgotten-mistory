import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const reportDir = path.join(rootDir, "reports", "post-prod");

const renderingResultsPath = path.join(reportDir, "rendering-stability-results.json");
const lighthousePath = path.join(reportDir, "lighthouse-production.json");
const outputPath = path.join(reportDir, "post-prod-test-summary.md");

if (!fs.existsSync(renderingResultsPath)) {
  throw new Error(`Missing rendering results: ${renderingResultsPath}`);
}

const rendering = JSON.parse(fs.readFileSync(renderingResultsPath, "utf8"));

let lighthouse = null;
if (fs.existsSync(lighthousePath)) {
  try {
    lighthouse = JSON.parse(fs.readFileSync(lighthousePath, "utf8"));
  } catch {
    lighthouse = null;
  }
}

const perfScore = lighthouse?.categories?.performance?.score ?? null;
const accScore = lighthouse?.categories?.accessibility?.score ?? null;
const bpScore = lighthouse?.categories?.["best-practices"]?.score ?? null;
const seoScore = lighthouse?.categories?.seo?.score ?? null;
const clsValue = lighthouse?.audits?.["cumulative-layout-shift"]?.numericValue ?? null;

const gateRows = [
  ["Background Gate", rendering.gates.backgroundGate.pass],
  ["Preloader Gate", rendering.gates.preloaderGate.pass],
  ["Layering Gate", rendering.gates.layeringGate.pass],
  ["Console Gate", rendering.gates.consoleGate.pass],
  ["Stability Gate (3 reloads)", rendering.gates.stabilityGate.pass],
  ["Evidence Gate", rendering.gates.evidenceGate.pass],
  ["Axe Critical Violations == 0", rendering.axe.criticalViolations === 0]
];

const runRows = rendering.runs.flatMap((run) => {
  return [
    {
      check: `Run ${run.run}: first paint is dark/cosmic`,
      pass: run.gates.backgroundPass,
      evidence: run.firstPaintEvidence
    },
    {
      check: `Run ${run.run}: preloader visible mid-load`,
      pass: run.preloaderState.preloaderVisible,
      evidence: run.preloaderEvidence
    },
    {
      check: `Run ${run.run}: settled render after preloader`,
      pass: run.gates.preloaderPass,
      evidence: run.settledEvidence
    }
  ];
});

const functionalRows = [...runRows, ...rendering.functionalChecks].map((check) => {
  const evidencePath = check.evidence ? check.evidence.replace(`${rootDir}/`, "") : "n/a";
  return `| ${check.check} | ${check.pass ? "PASS" : "FAIL"} | ${evidencePath} |`;
});

const consoleAggregation = rendering.runs.reduce(
  (acc, run) => {
    acc.app += run.consoleSummary.categoryCounts.app;
    acc.webgl += run.consoleSummary.categoryCounts.webgl;
    acc.network += run.consoleSummary.categoryCounts.network;
    acc.gsap += run.consoleSummary.gsapWarnings;
    return acc;
  },
  { app: 0, webgl: 0, network: 0, gsap: 0 }
);

const verdict = gateRows.every((row) => row[1]) ? "FULLY FUNCTIONAL FOR RENDERING STABILITY" : "ACTION REQUIRED";

const gateTableRows = gateRows.map(([name, pass]) => `| ${name} | ${pass ? "PASS" : "FAIL"} |`).join("\n");

const summary = `# Post-Production Rendering Stability Summary

## Deployment Metadata
- Timestamp (UTC): ${new Date().toISOString()}
- Project: forgotten-mistory
- URL: ${rendering.baseUrl}
- Commit: ${rendering.commitSha}
- Deploy mode: Static Firebase Hosting (no-store cache policy)

## Gate Status
| Gate | Status |
|---|---|
${gateTableRows}

## Functional Verification Matrix
| Feature/Flow | Status | Evidence |
|---|---|---|
${functionalRows.join("\n")}

## Console Signal Summary
- App-origin warnings/errors: ${consoleAggregation.app}
- WebGL driver warnings: ${consoleAggregation.webgl}
- Network/third-party warnings: ${consoleAggregation.network}
- GSAP missing-target warnings: ${consoleAggregation.gsap}

## Performance & Quality Metrics
- Lighthouse Performance: ${perfScore !== null ? `${Math.round(perfScore * 100)}/100` : "n/a"}
- Lighthouse Accessibility: ${accScore !== null ? `${Math.round(accScore * 100)}/100` : "n/a"}
- Lighthouse Best Practices: ${bpScore !== null ? `${Math.round(bpScore * 100)}/100` : "n/a"}
- Lighthouse SEO: ${seoScore !== null ? `${Math.round(seoScore * 100)}/100` : "n/a"}
- CLS: ${clsValue !== null ? clsValue : "n/a"}
- Axe total violations: ${rendering.axe.totalViolations ?? "n/a"}
- Axe critical violations: ${rendering.axe.criticalViolations ?? "n/a"}

## Known Residual Risks and Mitigations
- WebGL driver warnings ("ReadPixels") may appear in GPU tooling contexts and screenshots.
  - Mitigation: conservative scene profile (lower star density, reduced postprocessing, fallback cosmic backdrop).
- Network dependency noise can occur when external APIs are unavailable.
  - Mitigation: non-blocking fallbacks for GitHub hydration and UI remains functional.

## Final Operational Verdict
**${verdict}**
`;

fs.writeFileSync(outputPath, summary);
console.log(`Post-prod summary generated: ${outputPath}`);
