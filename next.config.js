const { execSync } = require('node:child_process');

/** The short commit the bytes are built from, surfaced as <meta name="build-commit">. */
function buildCommit() {
  try {
    return execSync('git rev-parse --short=8 HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: buildCommit(),
  },
};

module.exports = nextConfig;
