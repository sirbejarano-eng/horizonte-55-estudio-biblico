// Service worker de la versión Next.js. Sustituye al de la versión actual (misma dirección /sw.js)
// y al activarse borra sus cachés antiguas (prefijo horizonte55-).
//
// Estrategia:
// - Páginas: primero la red (siempre lo último publicado); si no hay conexión, la copia guardada.
//   Un capítulo que nunca se abrió se muestra igualmente con la página "sin conexión", que lo
//   dibuja a partir del catálogo guardado: basta con tener el catálogo del idioma (≈6,5 MB), no
//   las 1.189 páginas.
// - /_next/static/: archivos con huella en el nombre, nunca cambian → primero la caché.
// - Catálogos (/content/…?v=N): primero la caché; al cambiar el texto se sube N (CATALOG_VERSION).
// - Imágenes y manifiestos: la copia guardada al instante y se actualiza por detrás.
const CACHE_NAME = 'horizonte55-web-v2';
const CACHE_PREFIX = 'horizonte55-';

const OFFLINE_PAGES = { es: '/sin-conexion/', en: '/en/offline/', de: '/de/offline/' };
const PRECACHE = [
  ...Object.values(OFFLINE_PAGES),
  '/manifest-es.json', '/manifest-en.json', '/manifest-de.json',
  '/assets/icon.svg', '/assets/icon-192.png',
];

const langOf = (path) => (path.startsWith('/en/') ? 'en' : path.startsWith('/de/') ? 'de' : 'es');
const HOME = { es: '/', en: '/en/', de: '/de/' };

// Guarda una página junto con los archivos /_next/static que necesita para funcionar.
async function cachePageWithAssets(cache, url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) return;
  const html = await response.clone().text();
  await cache.put(url, response);
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
  await Promise.all(assets.map((asset) => cache.match(asset).then((hit) => hit || cache.add(asset).catch(() => null))));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE.map((url) => (url.endsWith('/') ? cachePageWithAssets(cache, url) : cache.add(url)).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

// La página pide "prepara este idioma": su portada, su página sin conexión y su catálogo.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'prepare-offline') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    let ok = true;
    for (const page of [HOME[data.lang], OFFLINE_PAGES[data.lang]]) {
      try { await cachePageWithAssets(cache, page); } catch (error) { ok = false; }
    }
    try {
      const catalog = await fetch(data.catalog);
      if (catalog.ok) await cache.put(data.catalog, catalog); else ok = false;
    } catch (error) { ok = false; }
    event.source?.postMessage({ type: 'offline-prepared', ok, catalog: data.catalog });
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(url.pathname, response.clone());
        return response;
      } catch (error) {
        const lang = langOf(url.pathname);
        return (await cache.match(url.pathname, { ignoreSearch: true }))
          || (await cache.match(OFFLINE_PAGES[lang]))
          || (await cache.match(HOME[lang]))
          || Response.error();
      }
    })());
    return;
  }

  // Datos de navegación interna de Next (RSC): sin conexión fallan y Next recarga la página
  // completa, que entonces pasa por la rama de navegación de arriba.
  if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }

  // Catálogos bíblicos: grandes y versionados en la dirección (?v=N) → primero la caché.
  if (url.pathname.startsWith('/content/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/') || /^\/manifest-(es|en|de)\.json$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(request, { ignoreSearch: true });
      const update = fetch(request).then(async (response) => {
        if (response.ok) await cache.put(url.pathname, response.clone());
        return response;
      });
      if (hit) {
        event.waitUntil(update.catch(() => null));
        return hit;
      }
      return update;
    })());
  }
});
