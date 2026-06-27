/**
 * Playwright globalSetup — local dev runs use next dev which builds on demand.
 * For CI, the deploy.yml pre-build step provides out/ before Playwright starts.
 * This file is a no-op in local dev; the ensureStaticBuild helper was part of the
 * overhaul test suite which was never committed to git.
 */
async function globalSetup(): Promise<void> {
  // No-op: next dev handles its own compilation.
}

export default globalSetup;
