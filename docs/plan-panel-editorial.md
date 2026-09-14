# Plan del panel editorial

## Objetivo

Permitir que personas autorizadas publiquen información de la iglesia sin usar Visual Studio Code:

- Eventos.
- Calendario de reuniones.
- Fotografías y galerías.
- Noticias.
- Recursos de la iglesia.
- Contenido en español, inglés y alemán.

La Biblia y el motor de lectura seguirán separados del contenido editorial de la iglesia.

## Decisión de producto

Horizonte 55 tendrá dos áreas distintas:

```text
Estudio bíblico
Información y vida de la iglesia
```

La Biblioteca seguirá siendo local, estática y basada en catálogos versionados. El contenido de la iglesia podrá gestionarse desde un panel privado conectado a un backend cuando el proyecto lo necesite.

No se implementa todavía. Este documento conserva la propuesta para una fase posterior.

## Experiencia para un editor

La persona autorizada entrará en una ruta privada como `/admin` y verá un panel con:

```text
Resumen
Eventos
Calendario
Galerías
Noticias
Recursos
Borradores
```

### Crear un evento

1. Pulsar `Nuevo evento`.
2. Completar título, descripción, fecha, hora y lugar.
3. Añadir una imagen opcional.
4. Elegir idioma o crear traducciones.
5. Guardar como borrador.
6. Revisar la vista previa.
7. Publicar.

Al publicar, el evento aparecerá en la página pública sin modificar archivos de código.

### Gestionar una galería

1. Pulsar `Nueva galería`.
2. Escribir título y descripción.
3. Seleccionar varias imágenes desde móvil u ordenador.
4. Añadir texto alternativo para accesibilidad.
5. Reordenar las imágenes.
6. Guardar como borrador o publicar.

Las imágenes deben almacenarse en un servicio de archivos, no dentro de `content/` ni en `localStorage`.

### Gestionar el calendario

El editor podrá crear, editar, cancelar y repetir reuniones. Cada entrada debe incluir:

- Título.
- Tipo de actividad.
- Fecha y hora de inicio.
- Fecha y hora de finalización opcional.
- Zona horaria.
- Lugar o enlace online.
- Estado: borrador, publicado, cancelado o archivado.
- Idioma.

## Roles

```text
Administrador
Gestiona usuarios, roles, configuración y todo el contenido.

Editor
Crea, edita y publica eventos, galerías, noticias y recursos.

Colaborador
Propone contenido y sube borradores, pero necesita aprobación.

Visitante
Solo consulta el contenido público.
```

La publicación debe requerir permisos explícitos. No se debe confiar en ocultar botones en el navegador como mecanismo de seguridad.

## Arquitectura recomendada

### Primera opción

Supabase:

- Auth para inicio de sesión.
- Postgres para eventos, calendarios y metadatos.
- Storage para fotografías.
- Row Level Security para roles y permisos.
- API para conectar el panel y la web pública.

La aplicación pública puede seguir siendo principalmente estática y cargar el contenido editorial publicado desde la API.

### Alternativas

- Directus o Strapi si se necesita un CMS editorial más completo.
- Sanity si se desea un CMS gestionado y una experiencia editorial avanzada.
- Decap CMS si se acepta un flujo basado en Git y el contenido no necesita usuarios complejos ni carga de archivos frecuente.

Recomendación actual: Supabase con un panel propio pequeño, porque permite empezar con eventos y fotos sin construir un CMS enorme.

## Modelo de datos inicial

### profiles

- `id`.
- `display_name`.
- `role`.
- `created_at`.

### events

- `id`.
- `status`.
- `starts_at`.
- `ends_at`.
- `location`.
- `online_url`.
- `cover_image_url`.
- `created_by`.
- `created_at`.
- `updated_at`.

### event_translations

- `event_id`.
- `language`: `es`, `en` o `de`.
- `title`.
- `description`.

### galleries

- `id`.
- `status`.
- `cover_image_url`.
- `created_by`.
- `created_at`.
- `updated_at`.

### gallery_items

- `id`.
- `gallery_id`.
- `file_url`.
- `alt_text`.
- `sort_order`.

### resources

- `id`.
- `status`.
- `type`.
- `url`.
- `image_url`.
- `created_by`.
- `created_at`.
- `updated_at`.

### resource_translations

- `resource_id`.
- `language`.
- `title`.
- `description`.

## Flujo editorial

```text
Borrador -> Revisión -> Publicado -> Archivado
                     \-> Rechazado -> Borrador
```

El rol colaborador no debe publicar directamente. El administrador o editor autorizado revisa y publica.

## Reglas de imágenes

- Validar tipo MIME.
- Limitar tamaño máximo.
- Generar versiones optimizadas para móvil y escritorio.
- Conservar texto alternativo obligatorio.
- Evitar publicar datos personales sin consentimiento.
- Usar nombres internos seguros, no nombres originales de archivos.
- Eliminar metadatos EXIF cuando puedan revelar ubicación.

## Multilingüismo editorial

Cada contenido nuevo debe poder tener traducciones separadas:

```text
es
 en
 de
```

Si falta una traducción, se debe mostrar el idioma principal definido por el editor y marcar la traducción como pendiente. No se debe traducir automáticamente contenido sensible sin revisión humana.

## Seguridad mínima

- No guardar contraseñas en el frontend.
- Usar Auth gestionado.
- Activar reglas de acceso en base de datos y storage.
- Separar contenido público de borradores.
- Registrar quién creó, editó y publicó cada elemento.
- Permitir revocar usuarios.
- Crear copias de seguridad.
- Limitar tipos y tamaños de archivos.
- No permitir que el cliente decida por sí solo si un usuario es administrador.

## Plan de implementación cuando se apruebe

1. Confirmar proveedor: Supabase, Directus, Strapi o alternativa.
2. Confirmar dominio y alojamiento.
3. Crear proyecto backend separado del catálogo bíblico.
4. Crear Auth y roles.
5. Crear tablas y políticas de acceso.
6. Crear Storage para imágenes.
7. Crear panel `/admin`.
8. Crear vista pública de eventos.
9. Crear calendario público.
10. Crear galerías y recursos.
11. Añadir traducciones editoriales.
12. Probar con una cuenta administradora y una colaboradora.
13. Publicar una primera actividad real.
14. Revisar seguridad, copias y permisos antes de abrirlo a más personas.

## Qué no hacer todavía

- No mezclar eventos con `content/books.json`.
- No guardar fotografías en `localStorage`.
- No crear usuarios sin autenticación real.
- No poner claves secretas en JavaScript público.
- No construir un CMS completo antes de probar la necesidad.
- No cambiar la persistencia local de progreso bíblico sin una decisión separada.

## Criterio para iniciar esta fase

La implementación del panel merece comenzar cuando exista una necesidad real de que otra persona publique contenido con frecuencia y el flujo manual mediante código empiece a generar errores o dependencia técnica.
