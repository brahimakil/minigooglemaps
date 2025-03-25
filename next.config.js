/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Disable experimental features that might cause issues
  experimental: {
    serverComponentsExternalPackages: [],
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
  }
};

module.exports = nextConfig; 