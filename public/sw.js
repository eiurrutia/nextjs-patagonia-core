if (!self.define) {
  let registry = {};
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      new Promise((resolve) => {
        if ("document" in self) {
          const script = document.createElement("script");
          script.src = uri;
          script.onload = resolve;
          document.head.appendChild(script);
        } else {
          nextDefineUri = uri;
          importScripts(uri);
          resolve();
        }
      }).then(() => {
        const promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) return;

    let exports = {};
    const require = (depUri) => singleRequire(depUri, uri);
    const specialDeps = { module: { uri }, exports, require };

    registry[uri] = Promise.all(depsNames.map((dep) => specialDeps[dep] || require(dep)))
      .then((deps) => {
        factory(...deps);
        return exports;
      });
  };
}

define(['./workbox-e43f5367'], function (workbox) {
  'use strict';

  importScripts();
  self.skipWaiting();
  workbox.clientsClaim();

  // Cache the home page with NetworkFirst strategy
  workbox.registerRoute(
    "/",
    new workbox.NetworkFirst({
      cacheName: "start-url",
      plugins: [
        {
          cacheWillUpdate: async ({ response }) => {
            if (response && response.type === "opaqueredirect") {
              return new Response(response.body, {
                status: 200,
                statusText: "OK",
                headers: response.headers,
              });
            }
            return response;
          },
        },
      ],
    }),
    'GET'
  );

  // Avoid caching problematic files, like 'app-build-manifest.json'
  workbox.registerRoute(
    ({ url }) => !url.pathname.includes('app-build-manifest.json') && !url.pathname.includes('_next/static/'),
    new workbox.NetworkOnly({ cacheName: 'network-only' }),
    'GET'
  );

  // Cache static assets such as images
  workbox.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    }),
    'GET'
  );

  // Cache CSS and JS files
  workbox.registerRoute(
    ({ request }) =>
      request.destination === 'script' || request.destination === 'style',
    new workbox.StaleWhileRevalidate({
      cacheName: 'assets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
        }),
      ],
    }),
    'GET'
  );
});
