/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  staticPageGenerationTimeout: 300,
  exclude: [/\/api\/update-doc/],
  experimental: {
    serverComponentsExternalPackages: ['firebase'],
    esmExternals: false,
    optimizePackageImports: [
      '@firebase/firestore',
      '@firebase/auth',
      '@firebase/storage',
      'chart.js'
    ],
    serverActions: true,
    logging: 'verbose',
    modularizeImports: {
      'chart.js/auto': {
        transform: 'chart.js/auto'
      }
    }
  },
  logLevel: 'DEBUG',
  webpack: (config) => {
    config.infrastructureLogging = { 
      level: 'verbose', 
      debug: /micromatch/ 
    };
    config.optimization.moduleIds = 'named';
    config.optimization.chunkIds = 'named';
    return config;
  },
}; 