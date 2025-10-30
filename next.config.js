/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingIgnores: [
    'node_modules/**',
    '.git/**',
    '.next/**',
  ],
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Add this for Google profile images
      'firebasestorage.googleapis.com'
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  staticPageGenerationTimeout: 300,
  experimental: {
    serverComponentsExternalPackages: ['firebase'],
  },
  webpack: (config) => {
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    return config;
  },
};

module.exports = nextConfig; 