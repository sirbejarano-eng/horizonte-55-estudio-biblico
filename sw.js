const CACHE_NAME = 'horizonte55-v67';
const CACHE_PREFIX = 'horizonte55-';
// Solo el shell esencial se precachea; los catálogos, mapas e íconos por idioma
// se cachean bajo demanda en el evento fetch, para no descargar los 3 idiomas de una vez.
const APP_SHELL = [
  './',
  './index.html',
  './biblioteca.html',
  './cronologia.html',
  './lectura.html',
  './buscar.html',
  './css/styles.css',
  './js/core.js',
  './js/i18n.js',
  './js/shell.js',
  './js/home.js',
  './js/library.js',
  './js/reader.js',
  './js/search.js',
  './js/timeline.js',
  './manifest.json',
  './assets/icon.svg',
  './assets/hero-background.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Solo se borran cachés de este proyecto (prefijo horizonte55-); no se tocan cachés de otros orígenes/apps.
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Las navegaciones a lectura.html?book=...&chapter=... deben poder resolverse sin conexión aunque el
  // shell se precacheó sin query string: se ignora la búsqueda al buscar en caché para este tipo de petición.
  const matchOptions = event.request.mode === 'navigate' ? { ignoreSearch: true } : undefined;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      // Se espera a que la escritura en caché termine antes de responder, para que cualquier comprobación
      // de disponibilidad offline hecha justo después de este fetch() vea el recurso ya guardado.
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await caches.match(event.request, matchOptions);
      if (cached) return cached;
      throw error;
    }
  })());
});
