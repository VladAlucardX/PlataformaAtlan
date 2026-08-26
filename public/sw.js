const CACHE_NAME = 'atlan-cache-v2';
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
          // Eliminar cualquier versión anterior de la caché (p.ej. v1 con HTML viejo)
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

  // 1. NUNCA interceptar consultas a Supabase BD/Auth ni Mapbox Vector Tiles (dejar pasar directo a red)
  const isSupabaseImage = url.includes('supabase.co') && url.includes('/storage/v1/object/public/');
  const isSupabaseData = url.includes('supabase.co') && !isSupabaseImage;

  if (isSupabaseData || url.includes('mapbox.com/v4/') || url.includes('api.mapbox.com/directions/')) {
    return;
  }

  // 2. PAGINAS HTML Y CÓDIGO DE LA APLICACIÓN: ESTRATEGIA NETWORK-FIRST (Red Primero)
  // Garantiza que la interfaz, páginas y código SIEMPRE carguen la versión más reciente del servidor
  const isHTMLPage = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isHTMLPage) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Guardar una copia fresca en caché para modo offline
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Si NO hay internet, devolver la versión en caché como respaldo offline
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 3. IMÁGENES Y RECURSOS MULTIMEDIA: ESTRATEGIA STALE-WHILE-REVALIDATE (Caché Rápida + Revalidación)
  // Permite que las fotos carguen en 0ms y se actualicen silenciosamente si cambian
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

        // Devolver inmediatamente desde caché si existe, sino esperar a la red
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. OTROS RECURSOS ESTÁTICOS GENERALES: NETWORK-FIRST CON CACHÉ DE RESPALDO
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
