/** @type {import('next').NextConfig} */
const nextConfig = {
  // Für Vercel: KEIN 'output: "export"', KEIN basePath/assetPrefix
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
