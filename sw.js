self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open('sweeper-of-mines').then(function (cache) {
        return cache.addAll([
          "./",
          "./index.html",
          "./icons.1894e4dd.css",
          "./icons.3d969a31.ttf",
          "./normalize.50fa89bf.css",
          "./custom.c2b56dca.css",
          "./index.b829ac74.js",
        ]);
      }),
    );
  });

  // Stale while revalidate
  // https://web.dev/offline-cookbook/

  self.addEventListener('fetch', function (event) {
    event.respondWith(
      caches.open('sweeper-of-mines').then(function (cache) {
        return cache.match(event.request).then(function (response) {
          var fetchPromise = fetch(event.request).then(function (networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      }),
    );
  });