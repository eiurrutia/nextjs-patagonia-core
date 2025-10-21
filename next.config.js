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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '9m64zfqkzfk3ohy7.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'form-builder-by-hulkapps.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'production-us2.patagonia.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.patagonia.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https://cdn.shopify.com https://9m64zfqkzfk3ohy7.public.blob.vercel-storage.com https://form-builder-by-hulkapps.s3.amazonaws.com https://production-us2.patagonia.com https://images.patagonia.com;
              font-src 'self' data: https://images.patagonia.com;
              connect-src 'self' https://api.openai.com;
              frame-src 'self' https://9m64zfqkzfk3ohy7.public.blob.vercel-storage.com;
              object-src 'self' https://9m64zfqkzfk3ohy7.public.blob.vercel-storage.com;
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim()
          },
        ],
      },
    ];
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
        source: '/ccss/:path*',
        destination: '/dashboard/ccss/:path*',
      },
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
      {
        source: '/security/:path*',
        destination: '/dashboard/security/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ];
  },
});
