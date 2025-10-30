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
    if (isServer) {
      // Externalize firebase to reduce bundle size
      config.externals = config.externals || [];
      config.externals.push({
        'firebase/app': 'commonjs firebase/app',
        'firebase/auth': 'commonjs firebase/auth',
        'firebase/firestore': 'commonjs firebase/firestore',
        'firebase/storage': 'commonjs firebase/storage',
      });
    }
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    return config;
  },
};

module.exports = nextConfig; 