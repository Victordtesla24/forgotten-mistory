/** @type {import('next').NextConfig} */
const isStaticExport = process.env.FIREBASE_STATIC_EXPORT === '1';

const nextConfig = {
  ...(isStaticExport
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
