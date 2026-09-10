const CACHE_NAME = 'atlan-cache-v4';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/mapaicono.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Eliminando caché obsoleta:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar solicitudes GET de origen HTTP/HTTPS
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  const url = event.request.url;

  // 1. NUNCA interceptar chunks de Next.js — siempre ir a la red para tener JS actualizado
  //    Esto evita servir código viejo cacheado cuando hay hot-reload o nuevos deploys
  if (url.includes('/_next/')) return;

  // 2. NUNCA interceptar consultas a Supabase BD/Auth ni Mapbox Vector Tiles
  const isSupabaseImage = url.includes('supabase.co') && url.includes('/storage/v1/object/public/');
  const isSupabaseData = url.includes('supabase.co') && !isSupabaseImage;

  if (isSupabaseData || url.includes('mapbox.com/v4/') || url.includes('api.mapbox.com/directions/')) {
    return;
  }

  // 3. PÁGINAS HTML Y CÓDIGO DE LA APLICACIÓN: ESTRATEGIA NETWORK-FIRST (Red Primero)
  const isHTMLPage = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isHTMLPage) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 4. IMÁGENES Y RECURSOS MULTIMEDIA: ESTRATEGIA STALE-WHILE-REVALIDATE
  const isImage = isSupabaseImage || event.request.destination === 'image' || url.includes('images.unsplash.com');

  if (isImage) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {});

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. OTROS RECURSOS ESTÁTICOS: NETWORK-FIRST CON CACHÉ DE RESPALDO
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
