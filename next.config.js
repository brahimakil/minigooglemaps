/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com'
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  staticPageGenerationTimeout: 300,
  experimental: {
    serverComponentsExternalPackages: ['firebase'],
    outputFileTracingIncludes: {
      '/': ['./src/**/*'],
    },
  },
  // Exclude problematic paths from tracing
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild',
      'node_modules/webpack',
      'node_modules/rollup',
      'node_modules/terser',
    ],
  },
  webpack: (config) => {
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    return config;
  },
};

module.exports = nextConfig; 