// ─────────────────────────────────────────────
//  FinanzasIA — Service Worker
//  ⚠️  Cambia CACHE_VERSION en cada deploy para
//      que la app instalada detecte la actualización
//  Ejemplo: 'finanzas-v4', 'finanzas-v5', o la fecha '2026-05-13'
// ─────────────────────────────────────────────
const CACHE_VERSION = 'finanzas-v4'; // ← cambia esto en cada deploy

// Archivos que se cachean al instalar.
// El navegador compara su contenido para detectar cambios reales.
const ASSETS = [
  '/',
  '/index.html',
  '/sw.js',
  '/manifest.json',
];

// ── INSTALL ──────────────────────────────────
// Precachea los assets. NO llama skipWaiting —
// esperamos que el usuario pulse "Actualizar".
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
  );
});

// ── ACTIVATE ─────────────────────────────────
// Elimina cachés de versiones anteriores.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ────────────────────────────────────
// Estrategia diferenciada:
// • index.html → Network first: siempre intenta la versión más nueva.
//   Si falla la red, sirve desde caché (modo offline).
// • Resto → Cache first: rápido, sin necesidad de red.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname === '/' || url.pathname.endsWith('.html');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request)
          .catch(() => caches.match('/index.html'))
        )
    );
  }
});

// ── MESSAGE ──────────────────────────────────
// El botón "Actualizar" del banner envía este mensaje
// para activar el nuevo SW inmediatamente.
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
