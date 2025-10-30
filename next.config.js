/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    optimizePackageImports: [
      '@firebase/firestore',
      '@firebase/auth',
      '@firebase/storage',
      'chart.js'
    ],
    serverActions: true
  },
  webpack: (config) => {
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    return config;
  },
};

module.exports = nextConfig; 