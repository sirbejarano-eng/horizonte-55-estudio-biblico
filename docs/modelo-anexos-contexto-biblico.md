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

## Contrato técnico reutilizable

- Cada página conserva la misma estructura HTML y los mismos identificadores de sección.
- El contenido traducible vive en un módulo `*-content.js` con español, inglés y alemán.
- Un módulo pequeño `*-study.js` entrega ese contenido al motor compartido `context-study.js`.
- El lector muestra el anexo mediante una configuración por libro y capítulo.
- El constructor público, las pruebas y el Service Worker deben reconocer cada anexo nuevo.

## Puerta de publicación

Un anexo permanece interno hasta completar revisión editorial, traducciones, comprobación visual móvil y de escritorio, pruebas automatizadas y aprobación explícita. El piloto de Babel es el segundo uso de este modelo después del anexo de los cuatro ríos de Edén.
