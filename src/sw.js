self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open('sweeper-of-mines').then(function (cache) {
        return cache.addAll([
          "./",
          "./index.html",
          "./css/icons.css",
          "./css/normalize.css",
          "./css/custom.scss",
          "./js/main.js",
          "./fonts/icons.ttf"
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