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
  async rewrites() {
    return [
      // Home - redirigir /home a /dashboard
      {
        source: '/home',
        destination: '/dashboard',
      },
      // Generic rules for all main sections
      // This captures any route that starts with these keywords and any subroute
      // For example, /orders/:path* will capture /orders, /orders/123, /orders/123/edit, etc.
      {
        source: '/orders/:path*',
        destination: '/dashboard/orders/:path*',
      },
      {
        source: '/customers/:path*',
        destination: '/dashboard/customers/:path*',
      },
      {
        source: '/incidences/:path*',
        destination: '/dashboard/incidences/:path*',
      },
      {
        source: '/stock-planning/:path*',
        destination: '/dashboard/stock-planning/:path*',
      },
      {
        source: '/users/:path*',
        destination: '/dashboard/users/:path*',
      },
      {
        source: '/configs/:path*',
        destination: '/dashboard/configs/:path*',
      },
    ];
  },
});
