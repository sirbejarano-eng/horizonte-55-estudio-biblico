# Horizonte 55 — aplicación Next.js

Esta es la arquitectura pública de Horizonte 55. Next.js genera una exportación estática en `web/out/`: cada capítulo queda como HTML legible sin JavaScript, indexable y apto para GitHub Pages. `npm run build:pages`, ejecutado desde la raíz, prepara la copia publicable en `dist/`.

## Desarrollo y compilación

```powershell
cd web
npm.cmd install
npm.cmd run dev             # revisión local; muestra estudios públicos y futuros borradores
npm.cmd run build           # exportación pública; incluye únicamente estudios aprobados
npm.cmd run build:internal  # exportación interna; incluye borradores para revisión
npm.cmd run serve           # sirve el contenido actual de out/ en http://localhost:4175
```

La compilación pública no depende de que un editor recuerde ocultar enlaces: solo incluye estudios con `published: true` y `draft: false` en `lib/studies.ts`. La compilación interna establece `H55_INCLUDE_DRAFT_STUDIES=1` únicamente durante ese proceso y no modifica el registro.

## Idiomas y ediciones

| Edición | Interfaz | Direcciones |
| --- | --- | --- |
| Open Nueva Biblia Viva (por defecto) | español | `/`, `/biblioteca/`, `/buscar/`, `/cronologia/`, `/leer/genesis/1/` |
| Reina-Valera 1909 | español | `/rv1909/leer/genesis/1/` |
| World English Bible | inglés | `/en/`, `/en/library/`, `/en/search/`, `/en/timeline/`, `/en/read/genesis/1/` |
| Schlachter 1951 | alemán | `/de/`, `/de/bibliothek/`, `/de/suche/`, `/de/zeitleiste/`, `/de/lesen/genesis/1/` |

- Cada idioma tiene su propio layout raíz para que `<html lang>` sea correcto desde el servidor.
- La interfaz está en `lib/i18n.ts`; la línea de tiempo, en `lib/timeline.ts`.
- El selector de idioma y versión conserva las claves existentes de `localStorage`.
- Progreso, marcas y notas se comparten entre ediciones por libro y capítulo.
- La exportación pública actual genera 4.756 capítulos, además de portada, biblioteca, búsqueda, línea de tiempo, planes, marcas, páginas informativas y estudios aprobados.

## Estudios de contexto

El registro canónico está en `lib/studies.ts`. Los 23 estudios trilingües cuentan con aprobación editorial para publicación desde el 27 de septiembre de 2026. Sus estados siguen siendo explícitos para que futuros anexos nazcan como borradores:

- `draft: true` identifica un texto todavía sujeto a revisión.
- `published: true` expresa la aprobación editorial para incluirlo en una salida pública.
- Un estudio público debe cumplir `published: true` y `draft: false`.

Los fragmentos traducidos están en `content/studies/<slug>.<idioma>.html`. Edén y Babel conservan además sus páginas españolas históricas en la raíz, que siguen siendo la fuente española mientras se completa la migración. `components/views/StudyView.tsx` carga el contenido y el visor común de imágenes.

Desde la raíz del repositorio, `npm run test:studies` comprueba el registro, las tres traducciones, la lista explícita de etiquetas y atributos HTML permitidos, estructura editorial, fuentes, imágenes ampliables y paridad entre idiomas. Este comando pertenece al `package.json` raíz y no se ejecuta desde `web/`. Las ilustraciones conceptuales no se consideran evidencia.

## Sin conexión y recursos

- `lib/local-storage.ts` centraliza lectura, escritura y borrado local. Los componentes reciben resultados controlados y muestran un error cuando el navegador bloquea el almacenamiento o se agota la cuota.
- `scripts/sync-content.mjs` copia a `public/` catálogos, índices, mapas e ilustraciones antes de iniciar o compilar Next.
- `public/sw.js` administra la caché y la página sin conexión de cada idioma.
- Un capítulo nunca visitado puede dibujarse desde el catálogo local cuando este ya está disponible.
- `scripts/sync-content.mjs` calcula un hash SHA-256 abreviado por catálogo. Al cambiar el contenido, la URL de caché cambia automáticamente y el Service Worker retira la versión anterior de ese catálogo.
- Las imágenes de los anexos se almacenan como WebP con dimensiones declaradas; las 51 nuevas ilustraciones ocupan aproximadamente 5,6 MB en conjunto, frente a 52,9 MB de los originales de generación.

## Publicación

Desde la raíz del repositorio:

```powershell
npm test
npm run build:pages
npm run test:pages
npm run test:browser
```

`test:browser` sirve `dist/` localmente y ejecuta pruebas Playwright en escritorio y móvil. Comprueba rutas, lector, cambio de idioma, menú móvil, ampliación de imágenes, disponibilidad de estudios aprobados, errores de consola y la apertura sin conexión de un capítulo nunca visitado. En CI se instala Chromium antes de esta prueba.

`build:pages` siempre ejecuta la compilación pública y prepara `dist/`. El flujo de GitHub Pages publica esa carpeta. No debe usarse `build:internal` para desplegar.
