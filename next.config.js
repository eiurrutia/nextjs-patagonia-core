const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // Registraremos el service worker manualmente
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [
    /middleware-manifest\.json$/,
    /_middlewareManifest\.js$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
    /app-build-manifest\.json$/,
  ],
});

module.exports = withPWA({
  // Tu configuración existente de Next.js
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
