const withPWA = require('next-pwa')({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = withPWA({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push('@huggingface/transformers');
    }
    return config;
  },
  env: {
    TRANSFORMERS_OFFLINE: '1',
  },
  images: {
    domains: ['cdn.shopify.com'],
  },
});

module.exports = nextConfig;
