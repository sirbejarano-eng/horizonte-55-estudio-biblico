# Horizonte 55 – versión Next.js (fase 2, en construcción)

Nueva base del sitio: cada capítulo se genera como página HTML propia (`/leer/genesis/1/`),
legible sin JavaScript e indexable por buscadores. **Todavía no se publica**: el sitio actual
de la raíz sigue siendo el que despliega GitHub Pages.

## Probar en local

```powershell
cd web
npm.cmd install
npm.cmd run dev        # http://localhost:4174
npm.cmd run build      # genera out/ con ~1.190 páginas
npm.cmd run serve      # sirve out/ en http://localhost:4175
```

## Qué incluye ya

- Portada, Biblioteca y los 1.189 capítulos (Open Nueva Biblia Viva).
- Progreso, capítulo actual y tamaño de letra con las **mismas claves de `localStorage`**
  que la versión actual: nadie pierde su avance al cambiar.
- Mismo diseño (`app/globals.css` es una copia de `css/styles.css`).
- Notas por capítulo, copiar capítulo y compartir versículo.
- Búsqueda local en `/buscar/` (palabras o referencias como `Juan 3:16`).
- Línea de tiempo en `/cronologia/` y estudios de contexto en `/estudios/eden/` y
  `/estudios/babel/`. Los estudios se leen del HTML de la raíz (`contexto-*.html`) al compilar:
  una sola fuente de texto para ambas versiones.
- Redirecciones desde las direcciones antiguas: `lectura.html?book=…&chapter=…`,
  `biblioteca.html`, `buscar.html`, `cronologia.html` y `contexto-*.html` (en `public/`).
- `scripts/sync-content.mjs` copia a `public/` el catálogo, los mapas y las ilustraciones
  (no se versionan dos veces). Lo ejecuta `next.config.ts` cada vez que arranca Next.

## Pendiente (siguientes pasos de la fase 2)

- Inglés, alemán y Reina-Valera 1909.
- Modo sin conexión (service worker) y manifiesto.
- Integración en el flujo de publicación de GitHub Pages.
