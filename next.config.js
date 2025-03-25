/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Exclude undici from being processed by webpack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace undici imports with empty modules in client-side code
      config.resolve.alias = {
        ...config.resolve.alias,
        'undici': false
      };
    }
    
    return config;
  },
  // Use Node.js polyfills for fetch API
  experimental: {
    serverComponentsExternalPackages: ['undici']
  }
};

module.exports = nextConfig; 