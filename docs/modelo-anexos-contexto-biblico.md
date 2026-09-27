# Modelo de anexos de contexto bíblico

## Propósito

Los anexos amplían un pasaje dentro de Horizonte 55 sin desplazar la lectura bíblica. Cada anexo debe ayudar al lector a volver al texto sagrado con una comprensión más clara y con límites explícitos entre Escritura, contexto e interpretación.

## Estructura editorial obligatoria

1. Enlace de entrada y regreso al pasaje relacionado.
2. Resultado de aprendizaje concreto.
3. Observación guiada del texto sagrado antes de presentar mapas, teorías o reconstrucciones.
4. Criterio de fe que declare la Escritura como fundamento.
5. Grados de certeza claramente rotulados.
6. Tres lentes o enfoques solo cuando respondan preguntas distintas y tengan apoyo suficiente. No se debe forzar una cantidad de teorías.
7. Comparación que indique aporte, evidencia y límite de cada enfoque.
8. Conclusión que explique para qué sirvió el recorrido.
9. Preguntas de reflexión con respuestas orientativas desplegables.
10. Glosario, ficha editorial y fuentes consultadas.

## Jerarquía de afirmaciones

- **Texto sagrado:** lo que el pasaje afirma explícitamente.
- **Contexto ampliamente reconocido:** datos geográficos, históricos o arqueológicos respaldados por fuentes institucionales o académicas.
- **Interpretación:** lectura teológica o propuesta explicativa que debe identificarse como tal.
- **Hipótesis abierta:** reconstrucción que no puede presentarse como hecho demostrado.

La redacción nunca debe convertir una asociación cultural o una ilustración en evidencia del acontecimiento bíblico.

## Fuentes e imágenes

- Cada anexo debe incluir al menos cinco fuentes distintas, directamente verificables y relacionadas con sus afirmaciones principales.
- Se prefieren instituciones patrimoniales, museos, corpus de inscripciones y publicaciones académicas.
- Las imágenes generadas con inteligencia artificial deben identificarse como ilustraciones conceptuales.
- Las imágenes no deben contener rótulos cartográficos inventados ni controles que cubran la ilustración.
- Cada imagen debe poder ampliarse y conservar un texto alternativo útil en español, inglés y alemán.
- La versión de distribución debe usar recursos WebP optimizados y declarar ancho y alto para evitar saltos de diseño.

## Contrato técnico Next.js

- `web/lib/studies.ts` registra cada estudio, capítulo relacionado, hito cronológico, títulos y estado editorial.
- Cada estudio declara `draft` y `published`; no se infiere la autorización por la existencia de archivos o por superar pruebas.
- El contenido vive en `web/content/studies/<slug>.<idioma>.html`. Las fuentes españolas históricas de Edén y Babel permanecen temporalmente en `contexto-*.html`.
- `web/components/views/StudyView.tsx` entrega el fragmento al diseño común y activa el visor de imágenes.
- `visibleStudies` muestra todos los estudios durante el desarrollo interno, pero solo `publicStudies` entra en una compilación pública.
- `web/scripts/sync-content.mjs` sincroniza los recursos; `npm run build` produce la salida pública y `npm run build:internal` produce una salida local de revisión.
- `tests/validate-studies.mjs` comprueba registro, idiomas, estructura, fuentes, imágenes y coherencia editorial.

## Puerta de publicación

Un anexo permanece interno hasta completar revisión editorial, traducciones, comprobación visual móvil y de escritorio, pruebas automatizadas y aprobación explícita. Para publicarlo deben cambiarse juntos y de forma consciente `draft: false` y `published: true`; después se ejecutan las pruebas y una compilación pública. La aprobación editorial no la sustituyen el validador, la compilación ni la existencia de ilustraciones.

Edén y Babel son los dos estudios aprobados actuales. Los 21 anexos restantes continúan internos hasta una aprobación individual posterior.
