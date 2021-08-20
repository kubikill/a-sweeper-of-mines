self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open('sweeper-of-mines').then(function (cache) {
        return cache.addAll([
          "./",
          new URL("./css/custom.scss", import.meta.url),
          new URL("./js/main.js", import.meta.url),
          new URL("./fonts/icons.ttf", import.meta.url)
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