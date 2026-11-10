/*
 * A self-removing service worker.
 *
 * The previous version of this site registered a worker here that cached the page shell.
 * The site no longer uses a service worker, but browsers that registered the old one keep
 * checking this URL. When they fetch this file it takes over at once, deletes every cache
 * the old worker filled, unregisters itself and reloads the open tabs a single time, so
 * returning visitors are served the current site and nothing is left behind.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.registration.unregister();

      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.allSettled(windows.map((client) => client.navigate(client.url)));
    })(),
  );
});
