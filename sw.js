// PWA-UPDATE-SYSTEM v2: auto-update, version banner, Check for updates. Do not remove this line.
// Twin Pane Stereoscope service worker.
// PWA-UPDATE-SYSTEM v2 notes:
// - One cache per release, named pwa::markplaga/twin-pane-stereoscope::<release>.
//   Cache Storage is origin-wide, so only caches under that exact
//   namespace are ever deleted, and only in activate, and only when
//   they are not the current release's cache. The legacy cache
//   (tps-v1) is deliberately RETAINED: it may still serve clients on
//   the old worker. The old worker's activate deleted every other
//   cache; this one never does.
// - Version-consistent shell: a navigation is served from this
//   release's own cache; the network is only a fallback and its
//   response is never written into this cache, so a new index.html
//   can never land in an old release's cache. The old worker was
//   network-first and wrote fresh responses into its cache, which
//   could mix versions.
// - Only the precached shell files are ever served from cache.
//   CDN files (jszip from cdnjs, Google Fonts) are network-only and
//   never cached. version.json is never intercepted. Non-GET requests
//   are never intercepted.
// - localStorage / IndexedDB / saved profiles are never touched.
const RELEASE = '1.0.0-20261126-1';
const DISPLAY_VERSION = '1.0.0';
const NAMESPACE = 'pwa::markplaga/twin-pane-stereoscope::';
const CACHE = NAMESPACE + RELEASE;
const SHELL = [
  './', 'index.html', 'profiles.html', 'receiver.html',
  'app.js', 'help.js', 'audio.js', 'profiles.js', 'cast.js', 'gestures.js',
  'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'
];
// Shell paths relative to the app base (the worker's scope). The
// worker lives at the app base, so a request path is the base path
// plus one of these; at the site root the base path is empty.
const SHELL_PATHS = new Set([
  '/', '/index.html', '/profiles.html', '/receiver.html',
  '/app.js', '/help.js', '/audio.js', '/profiles.js', '/cast.js', '/gestures.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/maskable-192.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png'
]);

self.addEventListener('install', e => {
  // cache:'reload' skips the browser's HTTP cache, so a new version
  // never installs stale files. Install fails if any required shell
  // file is missing or does not belong to this release, so a broken
  // deploy can never replace the working release.
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const u of SHELL) {
      const r = await fetch(new Request(u, { cache: 'reload' }));
      if (!r.ok) throw new Error('precache failed: ' + u + ' ' + r.status);
      if (u === './' || u === 'index.html') {
        const text = await r.clone().text();
        if (!text.includes(RELEASE)) throw new Error('precache mismatch: ' + u + ' is not release ' + RELEASE);
      }
      await cache.put(u, r);
    }
  })());
  // No skipWaiting here: the page asks the user first.
});

self.addEventListener('message', e => {
  const port = e.ports && e.ports[0];
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'GET_VERSION' && port) {
    port.postMessage({ release: RELEASE, displayVersion: DISPLAY_VERSION });
  }
  if (e.data && e.data.type === 'GET_CLIENTS' && port) {
    // includeUncontrolled: a waiting worker controls no clients yet,
    // but the pages it is about to take over are in its scope and
    // must be counted. Without this the count would always be 0.
    self.clients.matchAll({ includeUncontrolled: true })
      .then(cs => port.postMessage({ count: cs.length }));
  }
});

self.addEventListener('activate', e => {
  // Delete ONLY caches under this app's exact namespace that are not
  // the current release. Legacy caches outside the namespace are
  // retained on purpose (see header comment).
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(k => k.startsWith(NAMESPACE) && k !== CACHE)
      .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The version file is always fetched live so update checks are
  // never fooled by a cache.
  if (url.origin === location.origin && url.pathname.endsWith('/version.json')) return;
  // CDN files (jszip, fonts) are network-only: never cached, never
  // intercepted. The old worker cached them; v2 does not.
  if (/^(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.host)) return;
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      // Version-consistent shell: this release's own cached page.
      // A navigation to /?anything still gets this release's page.
      const cached = await caches.match(req, { cacheName: CACHE })
        || await caches.match('./index.html', { cacheName: CACHE });
      if (cached) return cached;
      try {
        // Network is a fallback only; the response is NOT cached,
        // so a newer page can never be written into this cache.
        return await fetch(req);
      } catch (err) {
        return caches.match('./index.html', { cacheName: CACHE });
      }
    })());
    return;
  }

  // Same-origin static files: only the precached shell may be
  // served from cache. Anything else is left to the browser.
  // Accept the shell path with or without the app-base prefix.
  const stripped = url.pathname.replace(/^\/[^/]+(\/.*)$/, '$1');
  const shellPath = SHELL_PATHS.has(url.pathname) ? url.pathname
    : (SHELL_PATHS.has(stripped) ? stripped : null);
  if (!shellPath) return;
  e.respondWith((async () => {
    const cached = await caches.match(req, { cacheName: CACHE });
    if (cached) return cached;
    // Network fallback, never cached: only this release's precache
    // populates the cache, at install time.
    return fetch(req);
  })());
});
