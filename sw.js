const CACHE = 'madr-etna-v2';
const ASSETS = [
  '/madretna-app/',
  '/madretna-app/index.html',
  '/madretna-app/manifest.json',
  '/madretna-app/icon-192x192.png',
  '/madretna-app/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Installa e metti in cache le risorse principali
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Attiva e rimuovi vecchie cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategia: Network first, fallback cache
self.addEventListener('fetch', e => {
  // Non intercettare le chiamate Supabase o Anthropic (sempre online)
  if (e.request.url.includes('supabase.co') || e.request.url.includes('anthropic.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ──────────────────────────────────────
self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data.json(); } catch(e) {
    data = { title: 'MadrEtna', body: 'Nuova segnalazione ricevuta' };
  }
  var options = {
    body: data.body || "Nuova segnalazione nel Parco dell'Etna",
    icon: '/madretna-app/icon-192x192.png',
    badge: '/madretna-app/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'madretna-segnalazione',
    renotify: true,
    data: { url: data.url || '/madretna-app/login.html' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '🌋 MadrEtna — Nuova segnalazione', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/madretna-app/login.html';
  event.waitUntil(clients.openWindow(url));
});
