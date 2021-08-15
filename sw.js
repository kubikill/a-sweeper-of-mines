self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open('sweeper-of-mines').then(function (cache) {
        return cache.addAll([
          "./",
          "./index.html",
          "./icons.68ee25fb.css",
          "./main.eb9b6f73.css",
          "./normalize.7bac37d8.css",
          "./custom.8f999d02.css",
          "./index.0f5133e8.js",
          "./icons.3d969a31.ttf"
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