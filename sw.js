// ─────────────────────────────────────────────
//  FinanzasIA — Service Worker
//  ⚠️  Cambia CACHE_VERSION en cada deploy para
//      que la app instalada detecte la actualización.
// ─────────────────────────────────────────────
const CACHE_VERSION = 'finanzas-v1.2'; // ← bump al desplegar

// Archivos que se precachean al instalar.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './icons/favicon.svg',
];

// ── INSTALL ──────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      // Si algún asset falla (404), no rompemos la instalación entera.
      Promise.allSettled(ASSETS.map(a => cache.add(a)))
    )
  );
});

// ── ACTIVATE ─────────────────────────────────
// Elimina cachés antiguas y reclama clientes.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────
// • Navegación / HTML → Network first (con fallback a caché).
// • Resto              → Cache first.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // no interceptes terceros (CDNs, API)

  const isHTML =
    e.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached))
    );
  }
});

// ── MESSAGE ──────────────────────────────────
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
