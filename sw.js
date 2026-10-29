/* Offline support: app shell cached on install; fonts and map tiles cached as you browse. */
const SHELL = 'vawine-shell-v33';
const RUNTIME = 'vawine-runtime-v33';
const FILES = ['./', './index.html', './app.js', './data.js', './events.js', './trip.html', './leaflet.js', './leaflet.css', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function trimRuntime(max = 1500) {
  const c = await caches.open(RUNTIME); const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // network-first for the app itself so updates arrive; cache fallback offline
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then(c => c.put(req, copy)); } return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (/tile\.openstreetmap\.org|fonts\.(googleapis|gstatic)\.com/.test(url.host) || /www\.gstatic\.com\/firebasejs\//.test(url.href)) {
    e.respondWith(caches.open(RUNTIME).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === 'opaque') { c.put(req, r.clone()); trimRuntime(); } return r; } catch (err) { return hit || Response.error(); }
    }));
  }
});
