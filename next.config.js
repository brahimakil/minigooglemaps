/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracing: false,
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