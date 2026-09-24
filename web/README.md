# Horizonte 55 – versión Next.js (fase 2, en construcción)

Nueva base del sitio: cada capítulo se genera como página HTML propia (`/leer/genesis/1/`),
legible sin JavaScript e indexable por buscadores. **Todavía no se publica**: el sitio actual
de la raíz sigue siendo el que despliega GitHub Pages.

## Probar en local

```powershell
cd web
npm.cmd install
npm.cmd run dev        # http://localhost:4174
npm.cmd run build      # genera out/ con ~4.780 páginas
npm.cmd run serve      # sirve out/ en http://localhost:4175
```

## Idiomas y ediciones

| Edición | Interfaz | Direcciones |
| --- | --- | --- |
| Open Nueva Biblia Viva (por defecto) | español | `/`, `/biblioteca/`, `/buscar/`, `/cronologia/`, `/leer/genesis/1/` |
| Reina-Valera 1909 | español | `/rv1909/leer/genesis/1/` |
| World English Bible | inglés | `/en/`, `/en/library/`, `/en/search/`, `/en/timeline/`, `/en/read/genesis/1/` |
| Schlachter 1951 | alemán | `/de/`, `/de/bibliothek/`, `/de/suche/`, `/de/zeitleiste/`, `/de/lesen/genesis/1/` |

- Cada idioma tiene su propio layout raíz (`app/(es)`, `app/en`, `app/de`) para que `<html lang>`
  sea correcto desde el servidor. Las páginas son envoltorios de las vistas de `components/views/`.
- Los textos de la interfaz están en `lib/i18n.ts`; los de la línea de tiempo en `lib/timeline.ts`.
- El selector de idioma y el de versión llevan a la página equivalente (mismo capítulo) y guardan
  la preferencia con las mismas claves que la versión actual (`horizonte55-language`,
  `horizonte55-spanish-version`). Quien tenía inglés o alemán llega a su idioma desde la portada.
- Progreso y notas son comunes a todas las ediciones (se guardan por libro y capítulo).
- Estudios de contexto en los tres idiomas: `/estudios/eden/`, `/en/studies/eden/`, `/de/studien/eden/`
  (y `babel`). Inglés y alemán están en `content/studies/`, generados a partir del HTML en español
  y de las traducciones de `js/eden-content.js` y `js/babel-content.js` de la versión actual.

## Qué incluye ya

- Portada, Biblioteca y los 1.189 capítulos en cada edición.
- Progreso, capítulo actual y tamaño de letra con las **mismas claves de `localStorage`**
  que la versión actual: nadie pierde su avance al cambiar.
- Mismo diseño (`app/globals.css` es una copia de `css/styles.css`).
- Notas por capítulo, copiar capítulo y compartir versículo.
- Búsqueda local (palabras o referencias como `Juan 3:16`) en la edición activa.
- Línea de tiempo y estudios de contexto en `/estudios/eden/` y `/estudios/babel/`. Los estudios
  se leen del HTML de la raíz (`contexto-*.html`) al compilar: una sola fuente de texto para ambas versiones.
- Redirecciones desde las direcciones antiguas: `lectura.html?book=…&chapter=…` (respeta idioma
  y versión guardados), `biblioteca.html`, `buscar.html`, `cronologia.html` y `contexto-*.html`.
- `scripts/sync-content.mjs` copia a `public/` los catálogos, los mapas y las ilustraciones
  (no se versionan dos veces). Lo ejecuta `next.config.ts` cada vez que arranca Next.

- Exportar e importar progreso (mismo archivo JSON que la versión actual), con vista previa y deshacer.
- Filtro de la biblioteca por testamento y nombre, y avance por libro.

## Sin conexión

- `public/sw.js` sustituye al service worker actual (misma dirección) y borra sus cachés al activarse.
- Páginas: primero la red; sin conexión, la copia guardada. Un capítulo nunca abierto se muestra con
  la página sin conexión (`/sin-conexion/`, `/en/offline/`, `/de/offline/`), que lo dibuja desde el
  catálogo guardado: basta el catálogo del idioma, no las 1.189 páginas.
- La cabecera prepara el idioma actual (portada, página sin conexión y catálogo) y muestra el estado.
- Solo se activa en la versión compilada (`npm run build` + `npm run serve`), no en `npm run dev`.
- Al cambiar el texto de `content/books*.json`, sube `CATALOG_VERSION` en `lib/i18n.ts`.
- Manifiestos por idioma: `public/manifest-es.json`, `-en`, `-de`.

## Pendiente (siguientes pasos de la fase 2)

- Integración en el flujo de publicación de GitHub Pages.
