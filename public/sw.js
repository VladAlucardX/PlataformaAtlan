const CACHE_NAME = 'atlan-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/next.svg',
  '/vercel.svg',
  '/window.svg'
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
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return;

  // Evitar interceptar consultas RPC/REST directas de Supabase o Mapbox API (excepto imágenes de Supabase Storage)
  const isSupabaseImage = event.request.url.includes('supabase.co') && event.request.url.includes('/storage/v1/object/public/');
  const isSupabaseData = event.request.url.includes('supabase.co') && !isSupabaseImage;

  if (isSupabaseData || event.request.url.includes('mapbox.com')) {
    return;
  }

  // Tampoco cachear peticiones de chrome-extension o internas del navegador
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si está en caché, devolver de inmediato (0ms delay) e intentar actualizar en segundo plano
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cachear respuestas exitosas (incluyendo imágenes CORS como Supabase o Unsplash)
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Fallback a caché si no hay internet
      return caches.match(event.request).then((fallback) => {
        if (fallback) return fallback;
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});
