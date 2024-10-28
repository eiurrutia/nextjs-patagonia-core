const withPWA = require('next-pwa')({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    exclude: [
      ({ url }) => {
        // Exclude app-build-manifest.json from being precached
        return url.pathname.includes('app-build-manifest.json') ||
               url.pathname.includes('middleware-manifest.json') ||
               url.pathname.includes('react-loadable-manifest.json') ||
               url.pathname.includes('_buildManifest.js') ||
               url.pathname.includes('_ssgManifest.js');
      },
    ],
  },
});

module.exports = withPWA({
  // Your existing Next.js configuration
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
