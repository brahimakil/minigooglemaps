/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable output file tracing to prevent stack overflow
  experimental: {
    outputFileTracingRoot: undefined,
  },
  outputFileTracing: false,
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com'
    ],
    unoptimized: true,
  },
  staticPageGenerationTimeout: 300,
  webpack: (config, { isServer }) => {
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    return config;
  },
};

module.exports = nextConfig; 