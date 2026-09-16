# Horizonte 55

Plataforma web estática para explorar contenido de estudio bíblico desde una interfaz móvil y de escritorio.

## Licencia y propiedad

El código propio de Horizonte 55 se distribuye bajo la licencia **MIT** — ver [LICENSE](LICENSE). El material de estudio propio que no sea código conserva los derechos reservados salvo indicación expresa. Los textos bíblicos y sus catálogos derivados quedan excluidos de MIT: mantienen las condiciones descritas en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). El pie de cada página refleja esta separación. El progreso y las notas se guardan localmente en el dispositivo del usuario (`localStorage`).

## Requisitos

- Node.js 18 o posterior
- Dependencias instaladas con `npm install`

## Desarrollo

```bash
npm install
npm run dev
```

La aplicación se sirve en `http://localhost:4173`. Los comandos cargan `serve.json` con `cleanUrls: false`; esta configuración evita que una redirección del servidor elimine los parámetros `book` y `chapter` al abrir una lectura o un resultado de búsqueda. La ruta `/` sirve `index.html` y el listado de directorios está desactivado.

La aplicación también puede instalarse como PWA en móviles, tablets y ordenadores compatibles. La interfaz, el catálogo y la lógica se guardan en caché para poder continuar la lectura sin conexión después de la primera carga.

### Probar desde móviles y tablets

En Windows, ejecuta:

```powershell
npm.cmd run dev:network
```

El lanzador mostrará una dirección como `http://192.168.1.25:4173`. Abre esa dirección en el móvil, tablet u otro equipo conectado a la misma red Wi-Fi. Mantén abierta la terminal mientras haces las pruebas y pulsa `Ctrl+C` para detener el servidor.

Si Windows muestra una solicitud del Firewall, permite el acceso en redes privadas. Las redes invitadas o los routers con aislamiento de clientes pueden impedir que los dispositivos se vean entre sí.

### Abrir el Inicio correctamente

No abras `index.html` directamente desde el Explorador de archivos, porque el navegador lo tratará como `file://` y bloqueará los módulos JavaScript y la carga del catálogo. Usa el lanzador:

```powershell
npm.cmd run open
```

También puedes ejecutar `abrir-horizonte.ps1` con PowerShell. El lanzador inicia el servidor local si no está activo y abre `http://localhost:4173/index.html`.

## Validación

```bash
npm test
```

`npm test` ejecuta tres pruebas en orden: `tests/validate.cjs` (estructura de páginas y catálogos), `tests/validate-bible-sources.cjs` (procedencia, licencias, huellas y correspondencia de las cuatro ediciones bíblicas) y `tests/validate-behavior.mjs` (comportamiento de importar/exportar progreso, notas, guardado y selección de versión, descrito en la sección siguiente). También se pueden ejecutar por separado:

```bash
node tests/validate.cjs
node tests/validate-bible-sources.cjs
node tests/validate-behavior.mjs
```

El contenido se encuentra en `content/books.json` (y `books-en.json`/`books-de.json`), la interfaz en `index.html` y `css/styles.css`, y la lógica en `js/core.js`, `js/shell.js` y los módulos por página.

El catálogo contiene los 66 libros y 1.189 capítulos de la Biblia completa. El contenido procede de una edición pública de Reina-Valera 1909 y se mantiene separado del motor de la aplicación.

La experiencia de Horizonte 55 es propia. Toma como referencia general de usabilidad la facilidad de entrada a la lectura, la búsqueda temática y el hábito diario de otras bibliotecas bíblicas, pero mantiene su identidad visual, su lenguaje de estudio y su modelo local de notas y progreso.

## Estructura de páginas

- `index.html`: inicio y continuidad de lectura.
- `biblioteca.html`: libros, agrupados por colección y progreso.
- `lectura.html`: capítulo, notas, progreso, tamaño de texto y referencia.
- `buscar.html`: búsqueda por palabras y referencias (aún no hay un índice temático).
- `cronologia.html`: línea de tiempo y mapa ilustrado de las regiones relacionadas con el relato bíblico.

La lógica común vive en `js/core.js` y `js/shell.js`. Las páginas cargan módulos pequeños que comparten el mismo catálogo y almacenamiento local.

## Idiomas

La interfaz y el contenido están preparados en tres idiomas mediante `js/i18n.js`: español con Reina-Valera 1909 u Open Nueva Biblia Viva, inglés con World English Bible British Edition y alemán con Schlachter 1951. El idioma se guarda localmente por dispositivo. Las cuatro fuentes se mantienen separadas del motor de la aplicación.

### Procedencia y edición de los catálogos

| Idioma | Archivo | Edición verificada | Condición de uso |
|---|---|---|---|
| Español | `content/books.json` | Santa Biblia — Reina Valera 1909 (`spaRV1909`) | Dominio público. |
| Español | `content/books-es-onbv.json` | Biblica® Open Nueva Biblia Viva™ (`spaonbv`) | CC BY-SA 4.0; atribución y compartir igual. |
| Inglés | `content/books-en.json` | World English Bible British Edition (`engwebpb`), edición de 66 libros | Dominio público; “World English Bible” es una marca y el texto no se reformula. |
| Alemán | `content/books-de.json` | Die Schlachter-Bibel 1951 (`deu1951`) | Copyright © 1951 Genfer Bibelgesellschaft; CC BY 4.0. |

Las fuentes, URLs de descarga, fecha de adquisición, archivos originales, SHA-256 y transformaciones están registradas en `vendor/SOURCES.json`. Los avisos que deben acompañar una distribución están reunidos en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). `LICENSE` delimita MIT al código propio y reserva los derechos del material de estudio propio que no sea código; no modifica las licencias de los textos bíblicos. Git conserva los paquetes ZIP originales y excluye las carpetas `vendor/*-source/extracted/`, que son copias de trabajo regenerables y no evidencia adicional.

Los catálogos se regeneran de forma determinista desde los paquetes originales preservados. `npm run convert:ebible` regenera RV1909, Schlachter 1951 y WEB británica; `npm run convert:onbv` regenera ONBV; `npm run convert:all-bibles` ejecuta ambos procesos. La conversión transforma la estructura USFM a JSON y omite metadatos de formato, atributos Strong, notas al pie y referencias cruzadas. No traduce, resume ni reformula el texto. Los marcadores explícitamente vacíos se omiten sin renumerar ni inventar versículos.

### World English Bible British Edition

La KJV fue retirada del catálogo inglés para eliminar su complicación territorial en el Reino Unido. La sustitución es la **World English Bible British Edition**, edición estable de inglés británico/internacional con exactamente 66 libros, obtenida de [eBible.org](https://ebible.org/bible/details.php?id=engwebpb). La fuente declara el texto de dominio público. “World English Bible” es una marca: Horizonte 55 conserva las palabras del texto bíblico y solo realiza la conversión estructural documentada.

El paquete USFM original se conserva en `vendor/engwebpb-source/engwebpb-usfm-original.zip`, con SHA-256 `D719A61B520191FB4861B4996C92DDD9931C06C63F2BFB4E119B952356F4CE15`.

### Reina-Valera 1909 y Schlachter 1951

Para cerrar la procedencia previamente incierta, ambos catálogos también se regeneraron desde las ediciones oficiales identificadas en eBible.org. RV1909 procede de `spaRV1909` (dominio público) y su paquete conserva SHA-256 `B5BFAC87199A561FCBACB5E32BE5D8D280934B1C6830088D9EB8C68FFBFBE711`. Alemán procede de `deu1951`, con copyright y atribución de la Genfer Bibelgesellschaft bajo CC BY 4.0; su paquete conserva SHA-256 `B267C8BCB0C3036DD3C00D106573B884FAFCB471B163A57968EF1033FCDE47DA`.

### Open Nueva Biblia Viva (ONBV)

La interfaz española ofrece dos ediciones deliberadamente distintas: **Reina-Valera 1909**, conservada como edición histórica de referencia, y **Biblica® Open Nueva Biblia Viva™**, una traducción contemporánea para lectura corriente. La aplicación selecciona ONBV por defecto y guarda la elección en `localStorage` bajo `horizonte55-spanish-version`; la selección es independiente del idioma de la interfaz. Inglés y alemán siguen cargando sus catálogos originales sin depender de esta preferencia.

ONBV procede exclusivamente de la ficha oficial de Open.Bible: [Spanish: Biblica® Open Nueva Biblia Viva](https://open.bible/bibles/biblica-open-nueva-biblia-viva). La descarga usada en esta integración fue el paquete **USFM (Paratext)** descargado manualmente el 13 de septiembre de 2026 y conservado sin modificar en `vendor/onbv-source/onbv-usfm-original.zip`. Su SHA-256 es `46B95A1A8D48807246947E6D2F75A62B0C1697924B071C1C1041C7926C73B802`. El catálogo convertido está en `content/books-es-onbv.json`.

El texto ONBV y el catálogo derivado de él se distribuyen bajo **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**, según la ficha oficial. La licencia del corpus ONBV es independiente de la licencia del código de Horizonte 55: el código propio, incluido el de la interfaz y el conversor, se distribuye bajo MIT; el material de estudio propio que no sea código conserva los derechos reservados según [LICENSE](LICENSE). Las notas del usuario, las preguntas de estudio, el resto del código y cualquier contenido editorial de Horizonte 55 no forman parte del corpus ONBV. Biblica no respalda ni patrocina Horizonte 55.

La conversión solo transforma la estructura USFM al formato JSON interno: elimina marcas técnicas, conserva el texto y usa los IDs canónicos ya existentes. No se inventan correspondencias entre versículos. ONBV conserva 66 libros y 1189 capítulos, pero tiene diferencias de versificación en numerosos capítulos frente a RV1909; las referencias deben interpretarse dentro de la edición activa. Las descripciones de salmos, etiquetas de interlocutor y tablas se aplanan según las reglas documentadas en `tools/convert-onbv.js`.

Para actualizar ONBV, descarga primero un nuevo paquete desde la ficha oficial, conserva el ZIP original con fecha y hash nuevo en `vendor/onbv-source/`, sustituye únicamente la extracción de trabajo y ejecuta `npm run convert:onbv`. Después ejecuta `npm test`, revisa las diferencias de versificación y actualiza esta sección con la fecha, URL, edición y SHA-256. No sobrescribas el ZIP original ni edites manualmente `content/books-es-onbv.json`; las notas y personalizaciones de la aplicación permanecen fuera del catálogo.

El plan futuro para que personas autorizadas gestionen eventos, fotos, calendario y recursos sin usar Visual Studio Code está documentado en [docs/plan-panel-editorial.md](docs/plan-panel-editorial.md). No se implementa todavía: se activará cuando el proyecto demuestre que necesita publicación editorial frecuente.

## Progreso

Los capítulos se pueden marcar como completados desde la vista de lectura. El progreso se guarda únicamente en el navegador, bajo la clave `horizonte55-completed-chapters`, junto con la última posición de lectura.

También se pueden guardar notas personales por capítulo. Se almacenan localmente bajo la clave `horizonte55-chapter-notes`.

El tamaño del texto de lectura se puede ajustar desde cada capítulo y se guarda localmente bajo la clave `horizonte55-reading-scale`.

Este almacenamiento local es intencional para la fase de validación. Si el proyecto demuestra que necesita cuentas o sincronización entre dispositivos, la capa de persistencia podrá sustituirse por un backend sin cambiar el formato conceptual del progreso: libro, capítulo y estado completado.

### Exportar e importar progreso

Desde `biblioteca.html`, sección "Progreso y notas":

- **Exportar progreso**: descarga un archivo JSON (`horizonte55-progreso-AAAA-MM-DD.json`) con la posición de lectura, capítulos completados, notas y tamaño de texto guardados en este dispositivo. Si la descarga falla (por ejemplo, por restricciones del navegador), se muestra un aviso en lugar de un éxito falso.
- **Importar progreso**: es un botón real (no una etiqueta asociada a un campo oculto), por lo que es accesible por teclado. El archivo se valida por completo antes de escribir nada: versión, tipos, límite de tamaño y que cada libro/capítulo referenciado exista en el catálogo cargado, con claves de capítulo canónicas (se rechazan claves como `"01"`). Un archivo inválido se rechaza explícitamente con el motivo, sin ignorar campos incorrectos para luego anunciar éxito.
  - Un campo **ausente** en el archivo no modifica lo ya guardado en este dispositivo.
  - Un campo **presente con valor `null`** se interpreta como una limpieza explícita de ese dato (por ejemplo, borrar todas las notas).
  - Un campo presente con cualquier otro valor debe cumplir su forma esperada o el archivo completo se rechaza.
  - Antes de aplicar los cambios se muestra una vista previa de qué se importará y si reemplazará datos ya guardados, con botones de confirmar o cancelar.
  - La escritura intenta ser atómica: si falla a mitad de camino, se intenta revertir automáticamente. **Esto no es una garantía absoluta**: si el propio intento de revertir también falla (por ejemplo, cuota de almacenamiento agotada para ambas operaciones), la app lo reporta como tal (`atomic: false`) en lugar de afirmar que no quedó nada a medias. El respaldo de la última importación se guarda también de forma persistente (no solo en memoria), así que el botón "Deshacer" sigue disponible después de recargar la página; "Deshacer" en sí también puede fallar, y en ese caso se muestra un aviso en vez de asumir que funcionó.
  - Toda nota guardada desde la app respeta el mismo límite de longitud que exige la importación, para que un progreso exportado correctamente siempre pueda volver a importarse sin rechazos por tamaño.

### Guardado y estado offline

El aviso "Guardado localmente en este dispositivo" bajo las notas de cada capítulo solo aparece después de una escritura confirmada en `localStorage`; si el guardado falla (por ejemplo, por cuota llena), el texto escrito permanece visible en el cuadro de notas y aparece un botón "Copiar nota" para no perderlo. Este borrador no guardado se conserva en memoria de forma independiente del almacenamiento: cambiar el tamaño de letra o marcar el capítulo como completado no lo borra, y si intentas cerrar o recargar la pestaña con texto sin guardar, el navegador pide confirmación antes de salir.

El encabezado de cada página muestra un indicador de disponibilidad sin conexión para el idioma activo ("Disponible sin conexión" / "Aún no disponible sin conexión en este idioma"). En dispositivos distintos del equipo servidor, el Service Worker exige que la aplicación se abra mediante HTTPS; una dirección IP local servida por HTTP no puede habilitar el modo offline y la interfaz lo indica expresamente. Antes de comprobar la caché, la app espera a que el Service Worker esté registrado y activo (`navigator.serviceWorker.ready`), para no reportar "no disponible" solo porque la comprobación se ejecutó antes de tiempo. El propio Service Worker espera a que la escritura en caché termine antes de responder al `fetch()`, para que esa comprobación posterior sea fiable. La navegación a `lectura.html?book=...&chapter=...` sin conexión funciona para cualquier capítulo (visitado antes o no), ya que la caché se consulta ignorando la cadena de consulta para ese tipo de petición. El Service Worker (`sw.js`) solo elimina cachés que empiecen por el prefijo `horizonte55-`, nunca cachés de otros orígenes o herramientas.

## Lote de fiabilidad de notas, guardado e importación (2026-09-13)

Este lote cerró tres riesgos de pérdida de datos detectados en las funciones ya añadidas de progreso/importación, sin tocar textos bíblicos, arquitectura ni añadir funciones nuevas fuera de ese alcance:

1. **Notas e importación**: las notas se asignan al `<textarea>` mediante `.value` (nunca interpoladas en HTML), por lo que un texto con etiquetas se conserva literal y no puede romper el DOM ni inyectar código. `importProgress` fue reemplazado por `validateProgressImport` + `applyProgressImport` (validación completa antes de escribir, rechazo explícito, vista previa/confirmación, escritura atómica con respaldo y deshacer, y un botón real accesible por teclado en vez de una etiqueta).
2. **Estado real de guardado**: `saveNote`/`toggleCompleted` devuelven éxito/fracaso real; solo se muestra "Guardado" tras una escritura confirmada, y un fallo conserva el texto visible con opción de copiarlo. La exportación también captura y comunica errores.
3. **Funcionamiento offline**: el catálogo ahora se solicita con una versión de contenido explícita (`CONTENT_VERSION` en `js/core.js`, súbela cuando cambie un catálogo), se añadió una preparación/comprobación explícita de disponibilidad offline por idioma, y la limpieza de cachés del Service Worker se limitó al prefijo del proyecto.

**Pruebas ejecutadas**: `npm test` (`tests/validate.cjs` + `tests/validate-behavior.mjs`, 22 escenarios de comportamiento incluyendo archivos inválidos, referencias inexistentes, notas vacías, cancelación, sobrescritura confirmada, fallo de almacenamiento simulado y recuperación, y preservación literal de texto con etiquetas). Todo en verde en esta máquina.

**Estado histórico al cerrar este lote**: quedaron pendientes mostrar todos los resultados de búsqueda (no solo 12), abrir y resaltar el versículo exacto al llegar desde la búsqueda, completar traducciones de la cronología y mensajes sueltos, corregir el enlace entre testamentos en `biblioteca.html`, ajustar la descripción de búsqueda mientras no existiera un índice temático real y documentar la procedencia y edición de los catálogos bíblicos. Los primeros cinco puntos se cerraron en el lote 2; la procedencia y las licencias quedaron cerradas el 14 de septiembre de 2026 en la sección «Procedencia y edición de los catálogos».

**Procedimiento de restauración**: antes de este lote se generó una copia íntegra de la carpeta del proyecto en `../backups/horizonte55-estudio-biblico-pre-lote1-<fecha-hora>/` y su equivalente `.zip`, sin sobrescribir ningún ZIP anterior. Para revertir todos los cambios de este lote, sustituye el contenido de esta carpeta por el de esa copia (o descomprime ese ZIP en su lugar). El ZIP de cierre de este lote se entrega también con fecha en el nombre, en la carpeta `backups/`.

## Lote 2: búsqueda, versículo destacado y traducciones (2026-09-13)

Cerró los pendientes de uso que quedaron fuera del lote 1, sin tocar textos bíblicos, arquitectura ni añadir funciones nuevas fuera de ese alcance:

1. **Todos los resultados de búsqueda**: `buscar.html` ya no corta en 12 resultados. Se muestran en bloques de 20 con un botón "Mostrar más resultados" hasta agotar las coincidencias, y el resumen indica cuántos se están mostrando del total.
2. **Abrir y destacar el versículo**: al pulsar un resultado de búsqueda, `navigateTo` ahora acepta el número de versículo y lo añade como `#verse-N` en la URL (el mismo formato que ya usaba "Compartir versículo"). `lectura.html` detecta ese hash al cargar, hace scroll hasta el versículo, lo enfoca para lectores de pantalla y lo resalta visualmente unos segundos.
3. **Traducciones completas**: los 8 hitos de `cronologia.html` (período, título, región, texto y título del libro) están ahora en `js/i18n.js` para español, inglés y alemán, en vez de fijos en español dentro de `timeline.js`. También se tradujeron los mensajes sueltos que quedaban en español fijo ("No se pudo copiar la referencia", "No se pudo compartir el versículo") y el separador "de" en el resumen de progreso de la biblioteca.
4. **Enlace entre testamentos corregido**: en `biblioteca.html`, el enlace "ir al otro testamento" comparaba una traducción contra un texto en español fijo, por lo que en inglés/alemán siempre mostraba la etiqueta incorrecta. Ahora se calcula directamente la traducción del testamento contrario.
5. **Descripción de búsqueda ajustada**: se quitó la mención a "temas" en la búsqueda (`wordsTopicsReferences`, `searchHint` y la descripción de `buscar.html` en el README) porque hoy solo existe coincidencia de texto y de referencia, no un índice temático real.

**Pruebas ejecutadas**: `npm test` (`tests/validate.cjs` + `tests/validate-behavior.mjs`) sigue en verde tras estos cambios; no se modificó el comportamiento de importar/exportar/guardar del lote 1.

**Estado histórico al cerrar este lote**: todavía estaba pendiente documentar la procedencia y edición de los catálogos bíblicos. Ese trabajo quedó cerrado el 14 de septiembre de 2026 en la sección «Procedencia y edición de los catálogos».

**Procedimiento de restauración**: antes de este lote se generó `backups/horizonte55-estudio-biblico-pre-lote2-<fecha-hora>.zip`. Para revertir únicamente los cambios del lote 2, sustituye la carpeta del proyecto por el contenido de ese ZIP (el progreso/notas guardados en el navegador de cada usuario no se ven afectados por este lote).

## Lote 3: cierre de pendientes de fiabilidad (2026-09-13)

Cerró huecos concretos que quedaban en el manejo de notas, importación y modo offline. No se tocaron textos bíblicos ni arquitectura, y no se añadió ninguna función fuera de este alcance.

**Implementado**
- Borrador de nota independiente de `localStorage` (`js/reader.js`): cambiar el tamaño de letra o marcar el capítulo como completado ya no borra una nota sin guardar; si el guardado falló, el texto y el aviso de error se restauran tras cada repintado. Se añadió un aviso de salida (`beforeunload`) mientras exista texto sin guardar.
- Los mensajes de error en `#readerStatus` (fallo al copiar, compartir o marcar como completado) ya no desaparecen si una acción posterior repinta la interfaz.
- `saveNote` aplica el mismo límite de longitud (`MAX_NOTE_LENGTH`, exportado desde `js/core.js`) que exige la validación de importación, así que toda nota guardable es siempre reimportable. La validación de importación ahora exige claves de capítulo canónicas (rechaza `"01"`, `"1.0"`, etc.) en vez de aceptarlas y guardarlas de forma luego inaccesible. Se eliminó el chequeo de tamaño por bytes duplicado en `library.js`; queda un único límite, en caracteres, dentro de `validateProgressImport`.
- El respaldo de una importación aplicada se guarda también en `localStorage` (`getPersistedImportBackup`), así que "Deshacer" sigue disponible tras recargar la página. `applyProgressImport` y `restoreProgressBackup` ya no asumen éxito: si el propio rollback o el propio deshacer fallan, se reporta explícitamente (`atomic: false` / retorno `false`) en lugar de afirmar una garantía que no se cumplió.
- El Service Worker espera a que la escritura en caché termine antes de responder (`sw.js`), y la comprobación de disponibilidad offline en `js/shell.js` espera a que el Service Worker esté registrado y activo antes de ejecutarse. La navegación a `lectura.html?book=...&chapter=...` sin conexión ahora funciona para cualquier capítulo, visitado antes o no, porque la búsqueda en caché ignora la cadena de consulta para las peticiones de navegación.

**Probado**
- Automatizado (`npm test`, `tests/validate.cjs` + `tests/validate-behavior.mjs`, 30 escenarios en total): los 3 catálogos siguen validando; más los nuevos casos de este lote (nota truncada a `MAX_NOTE_LENGTH` y reimportable, clave de capítulo no canónica rechazada, respaldo de importación persistido y legible tras "recargar", fallo de escritura con fallo de rollback reportado como `atomic:false`, fallo de "Deshacer" reportado en vez de asumido).
- Manual en navegador real (servidor local + herramientas de navegador de este entorno): primera visita (el indicador pasa a "Disponible sin conexión" tras registrarse el Service Worker), recarga de un capítulo sin conexión, navegación sin conexión a un capítulo nunca visitado (Apocalipsis 22, con solo Génesis/Juan visitados antes), borrador de nota que sobrevive a cambiar el tamaño de letra y a marcar como completado con un fallo de guardado simulado, mensaje de error de "marcar como completado" visible tras su propio repintado, y verificación de que solo existe una caché con el prefijo `horizonte55-`.
- No se probó de forma automatizada ni manual un escenario real de actualización de versión con dos Service Workers distintos coexistiendo (solo se verificó por código que la limpieza de `activate` filtra por prefijo y excluye la caché activa).

**Limitaciones conocidas**
- La atomicidad de `applyProgressImport`/`restoreProgressBackup` es un intento con revertido, no una transacción real: en un fallo simultáneo de escritura y de rollback puede quedar un estado parcial, que ahora se reporta honestamente en vez de ocultarse.
- El respaldo persistido de importación no tiene expiración ni límite de tamaño propio; si nunca se deshace ni se hace una nueva importación, queda en `localStorage` indefinidamente.
- Al cerrar este lote todavía restaba verificar externamente la edición exacta del texto alemán. Esa deuda quedó cerrada el 14 de septiembre de 2026: el catálogo alemán se regeneró desde la fuente identificada como `deu1951`, y su procedencia, licencia y huellas verificables constan en `vendor/SOURCES.json`, `THIRD_PARTY_NOTICES.md` y la sección «Procedencia y edición de los catálogos».

**Procedimiento de restauración**: antes de este lote se generó `backups/horizonte55-estudio-biblico-pre-lote-fiabilidad2-<fecha-hora>.zip`. Para revertir únicamente los cambios de este lote, sustituye la carpeta del proyecto por el contenido de ese ZIP.

## Endurecimiento de seguridad y preparación para publicar (2026-09-13)

- **Content-Security-Policy** restrictiva (`script-src 'self'`, sin scripts ni estilos de terceros salvo `'unsafe-inline'` para un único atributo `style` dinámico) en las 5 páginas.
- **Escapado de contenido del catálogo**: `escapeHtml()` en `js/core.js`, aplicado a `verse.text` y a los títulos de libro en todos los puntos donde se insertan vía `innerHTML` (defensa en profundidad si algún día un catálogo viene de una fuente externa sin revisar).
- **Imagen de portada autoalojada**: la imagen de fondo de `index.html` se descargó a `assets/hero-background.jpg` en vez de cargarse desde un dominio externo (Unsplash); esto la hace compatible con la CSP y con el modo offline, y evita una petición de red a terceros en cada carga.
- **`js/app.js` eliminado** (código muerto que ninguna página cargaba).
- **`npm audit`**: 0 vulnerabilidades (se generó `package-lock.json`).
- **Estado histórico de `LICENSE` en este lote:** derechos reservados. El 17 de septiembre de 2026 se confirmó MIT para el código propio y se actualizaron los metadatos y avisos; los textos bíblicos conservan sus licencias independientes.
- **Pie de página común** (`js/shell.js`, sección `.site-footer`) con el aviso de copyright y la nota de privacidad, visible en las 5 páginas.

**Probado**: verificado en navegador real que no hay violaciones de CSP en ninguna página y que el pie de copyright/privacidad se muestra correctamente. **Limitación de las pruebas de navegador**: en este entorno solo hay disponible un navegador basado en Chromium; no se probó en Safari/iOS ni en Firefox reales. Antes de publicar, se recomienda una prueba manual en esos navegadores, especialmente el comportamiento de instalación como PWA en Safari/iOS, que suele diferir de Chrome.

## Cierre documental y línea base local (2026-09-14)

- Las referencias históricas a trabajos pendientes se conservaron como registro, pero quedaron marcadas como estados ya cerrados para no contradecir la situación vigente.
- La procedencia, licencia, paquete original y SHA-256 de RV1909, ONBV, WEB British Edition y Schlachter 1951 están gobernados por `vendor/SOURCES.json`, `THIRD_PARTY_NOTICES.md` y `tests/validate-bible-sources.cjs`.
- La suite completa pasó después de la migración de catálogos: validación estructural, validación de fuentes y 41 comprobaciones de comportamiento.
- La revisión en Chromium confirmó las cinco páginas principales, los tres idiomas, las dos ediciones españolas, sus atribuciones dinámicas y la búsqueda de una referencia exacta.
- La prueba reveló que la configuración predeterminada de `serve` redirigía las rutas `.html` y eliminaba los parámetros de lectura. `serve.json` fija ahora `cleanUrls: false`, y la validación estructural impide retirar accidentalmente esa protección. Después de la corrección, `Mateo 1:25` abrió el libro y capítulo correctos y destacó el versículo solicitado.
- Con el servidor detenido, un origen nuevo abrió correctamente `Apocalipsis 22`, que no se había visitado en esa prueba, usando el Service Worker y la caché del catálogo español activo.
- La estructura sigue un diseño mobile-first y conserva la regla adaptable de escritorio. Esto no sustituye la comprobación física pendiente en Safari/iOS, Firefox, teléfono y tableta antes de una publicación pública.
