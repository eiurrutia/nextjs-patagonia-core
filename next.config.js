/** @type {import('next').NextConfig} */
const nextConfig = {
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
  };

module.exports = nextConfig;
