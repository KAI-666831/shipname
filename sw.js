const CACHE = 'shipname-v3';
const FILES = ['./', 'index.html', 'dict.js', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// network first (always newest when there is signal), fall back to cache after 3 s or when offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fromCache = () => caches.match(e.request, {ignoreSearch: true})
      .then(r => r || caches.match('index.html'));
    const timer = setTimeout(() => { if (!done) fromCache().then(r => { if (r && !done) { done = true; resolve(r); } }); }, 3000);
    fetch(e.request, {cache: 'no-cache'}).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      if (!done) { done = true; clearTimeout(timer); resolve(r); }
    }).catch(() => fromCache().then(r => { if (!done) { done = true; clearTimeout(timer); resolve(r); } }));
  }));
});
