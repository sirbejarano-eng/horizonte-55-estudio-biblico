import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'web', 'lib', 'studies.ts');
const studiesDirectory = path.join(root, 'web', 'content', 'studies');
const languages = ['es', 'en', 'de'];
const requiredIds = [
  'faith-note-title', 'text-title', 'known-title', 'views-title', 'comparison-title',
  'conclusion-title', 'reflection-title', 'glossary-title', 'editorial-title', 'sources-title'
];
const draftWords = { es: /borrador/i, en: /draft/i, de: /entwurf/i };

const allowedAttributes = new Map(Object.entries({
  a: ['class', 'data-i18n', 'data-nav', 'href', 'rel', 'target'],
  article: ['class'],
  aside: ['aria-labelledby', 'class'],
  body: [],
  button: ['aria-expanded', 'aria-label', 'class', 'data-action', 'data-image-caption', 'data-image-src', 'data-image-title', 'type'],
  dd: [],
  details: ['class'],
  dialog: ['aria-describedby', 'aria-labelledby', 'class', 'id'],
  div: ['aria-label', 'class', 'role', 'tabindex'],
  dl: ['class'],
  dt: [],
  em: [],
  figcaption: [],
  figure: ['class'],
  h1: [],
  h2: ['id'],
  h3: [],
  h4: [],
  head: [],
  header: ['class'],
  html: ['lang'],
  img: ['alt', 'height', 'id', 'loading', 'src', 'width'],
  li: ['id'],
  link: ['href', 'rel', 'type'],
  main: ['class', 'id', 'tabindex'],
  meta: ['charset', 'content', 'http-equiv', 'name'],
  nav: ['aria-label', 'class'],
  ol: [],
  p: ['class', 'id'],
  script: ['src', 'type'],
  section: ['aria-label', 'aria-labelledby', 'class'],
  span: ['class'],
  strong: [],
  summary: [],
  table: ['class'],
  tbody: [],
  td: [],
  th: ['scope'],
  thead: [],
  title: [],
  tr: []
}).map(([tag, attributes]) => [tag, new Set(attributes)]));

function validateUrl(tag, attribute, rawValue, context) {
  const value = rawValue.replaceAll('&amp;', '&').trim();
  if (!value || /[\\\u0000-\u001f\u007f]/.test(value) || value.startsWith('//')) {
    fail(`${context}: ${tag}[${attribute}] contiene una URL no permitida.`);
  }
  if (tag === 'a' && attribute === 'href') {
    if (!/^(?:https:\/\/|\.\/|#|\/(?!\/))/.test(value)) fail(`${context}: enlace no permitido: ${value}.`);
  } else if ((tag === 'img' && attribute === 'src') || (tag === 'button' && attribute === 'data-image-src')) {
    if (!/^(?:\.\/|\/)assets\/[a-z0-9][a-z0-9._/-]*$/i.test(value)) fail(`${context}: recurso de imagen no permitido: ${value}.`);
  } else if (tag === 'link' && attribute === 'href') {
    if (!/^\.\/(?:manifest\.json|assets\/icon\.svg|css\/styles\.css(?:\?v=\d+)?)$/.test(value)) fail(`${context}: recurso de cabecera no permitido: ${value}.`);
  } else if (tag === 'script' && attribute === 'src') {
    if (!/^\.\/js\/[a-z0-9-]+-study\.js(?:\?v=\d+)?$/i.test(value)) fail(`${context}: módulo no permitido: ${value}.`);
  }
}

function validateAllowedHtml(html, context) {
  for (const match of html.matchAll(/<\/([a-z][a-z0-9-]*)\s*>/gi)) {
    const tag = match[1].toLowerCase();
    if (!allowedAttributes.has(tag)) fail(`${context}: la etiqueta de cierre </${tag}> no está permitida.`);
  }
  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)([^<>]*)>/gi)) {
    const tag = match[1].toLowerCase();
    const permitted = allowedAttributes.get(tag);
    if (!permitted) fail(`${context}: la etiqueta <${tag}> no está permitida.`);

    const source = match[2].replace(/\/\s*$/, '');
    const attributePattern = /\s+([^\s=/>]+)\s*=\s*"([^"]*)"/gy;
    const seen = new Set();
    const values = new Map();
    let cursor = 0;
    while (cursor < source.length) {
      attributePattern.lastIndex = cursor;
      const attributeMatch = attributePattern.exec(source);
      if (!attributeMatch || attributeMatch.index !== cursor) {
        if (/^\s*$/.test(source.slice(cursor))) break;
        fail(`${context}: marcado no reconocible en <${tag}>.`);
      }
      cursor = attributePattern.lastIndex;
      const attribute = attributeMatch[1].toLowerCase();
      const value = attributeMatch[2];
      if (!permitted.has(attribute)) fail(`${context}: ${tag}[${attribute}] no está permitido.`);
      if (seen.has(attribute)) fail(`${context}: ${tag}[${attribute}] está duplicado.`);
      seen.add(attribute);
      values.set(attribute, value);

      if (attribute === 'href' || attribute === 'src' || attribute === 'data-image-src') validateUrl(tag, attribute, value, context);
      if ((attribute === 'id' || attribute === 'aria-labelledby' || attribute === 'aria-describedby') && !/^[a-z][a-z0-9_.:-]*$/i.test(value)) {
        fail(`${context}: ${tag}[${attribute}] no es un identificador válido.`);
      }
      if (attribute === 'class' && !/^[a-z0-9_-]+(?:\s+[a-z0-9_-]+)*$/i.test(value)) fail(`${context}: clase HTML no válida.`);
      if ((attribute === 'width' || attribute === 'height') && !/^\d+$/.test(value)) fail(`${context}: dimensión de imagen no válida.`);
      if (attribute === 'target' && value !== '_blank') fail(`${context}: destino de enlace no permitido.`);
      if (attribute === 'tabindex' && !/^(?:-1|0)$/.test(value)) fail(`${context}: tabindex no permitido.`);
      if (attribute === 'loading' && value !== 'lazy') fail(`${context}: modo de carga de imagen no permitido.`);
      if (tag === 'button' && attribute === 'type' && value !== 'button') fail(`${context}: tipo de botón no permitido.`);
      if (tag === 'script' && attribute === 'type' && value !== 'module') fail(`${context}: tipo de script no permitido.`);
      if (attribute === 'data-action' && value !== 'close-image-dialog') fail(`${context}: acción declarativa no permitida.`);
      if (attribute === 'role' && value !== 'region') fail(`${context}: rol ARIA no permitido.`);
      if (attribute === 'scope' && !/^(?:col|row)$/.test(value)) fail(`${context}: alcance de cabecera no permitido.`);
    }

    if (tag === 'a' && values.get('href')?.startsWith('https://')) {
      if (values.get('target') !== '_blank' || !values.get('rel')?.split(/\s+/).includes('noreferrer')) {
        fail(`${context}: cada enlace HTTPS debe abrirse de forma segura.`);
      }
    }
    if (tag === 'link') {
      const expectedHrefByRel = new Map([
        ['manifest', './manifest.json'],
        ['icon', './assets/icon.svg'],
        ['stylesheet', './css/styles.css?v=35']
      ]);
      if (values.get('href') !== expectedHrefByRel.get(values.get('rel'))) fail(`${context}: combinación link[rel/href] no permitida.`);
      if (values.get('rel') === 'icon' && values.get('type') !== 'image/svg+xml') fail(`${context}: el icono debe declarar su tipo SVG.`);
      if (values.get('rel') !== 'icon' && values.has('type')) fail(`${context}: link[type] solo está permitido para el icono.`);
    }
    if (tag === 'meta') {
      const keys = [...values.keys()].sort().join(',');
      const isCharset = keys === 'charset' && values.get('charset') === 'UTF-8';
      const isCsp = keys === 'content,http-equiv' && values.get('http-equiv') === 'Content-Security-Policy';
      const isNamed = keys === 'content,name' && ['description', 'theme-color', 'viewport'].includes(values.get('name'));
      if (!isCharset && !isCsp && !isNamed) fail(`${context}: declaración meta no permitida.`);
    }
  }
}

function validateAllowlistRegressions() {
  const rejected = [
    '<iframe src="https://example.com"></iframe>',
    '<p onclick="alert(1)">texto</p>',
    '<p style="display:none">texto</p>',
    '<a href="javascript:alert(1)">texto</a>',
    '<img src="data:image/svg+xml,malicioso" alt="x" width="1" height="1">'
  ];
  for (const html of rejected) {
    let didReject = false;
    try {
      validateAllowedHtml(html, 'prueba-negativa');
    } catch {
      didReject = true;
    }
    if (!didReject) fail(`La lista permitida aceptó un caso inseguro: ${html}`);
  }
}

function fail(message) {
  throw new Error(message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`Falta el archivo: ${relativePath}`);
  return fs.readFileSync(absolutePath, 'utf8');
}

function extractStudies() {
  const source = fs.readFileSync(registryPath, 'utf8');
  const pattern = /\{\s*slug:\s*"([^"]+)"(?:,\s*file:\s*"([^"]+)")?,\s*chapterKey:\s*"([^"]+)",\s*milestone:\s*"([^"]+)",\s*draft:\s*(true|false),\s*published:\s*(true|false),\s*titles:\s*\{\s*es:\s*"([^"]+)",\s*en:\s*"([^"]+)",\s*de:\s*"([^"]+)"\s*\}\s*,?\s*\}/g;
  const studies = [...source.matchAll(pattern)].map((match) => ({
    slug: match[1], file: match[2] || null, chapterKey: match[3], milestone: match[4],
    draft: match[5] === 'true', published: match[6] === 'true', titles: { es: match[7], en: match[8], de: match[9] }
  }));
  if (!studies.length) fail('No se pudo leer ningún estudio de web/lib/studies.ts.');
  const declaredSlugs = [...source.matchAll(/\bslug:\s*"([^"]+)"/g)].map((match) => match[1]);
  if (declaredSlugs.length !== studies.length) fail('El formato del registro cambió y el validador no pudo interpretar todos los estudios.');
  return studies;
}

function studyPath(study, language) {
  if (language === 'es' && study.file) return study.file;
  return path.join('web', 'content', 'studies', `${study.slug}.${language}.html`);
}

function count(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

function inspectHtml(study, language) {
  const relativePath = studyPath(study, language);
  const html = read(relativePath);
  const context = `${study.slug}/${language}`;

  validateAllowedHtml(html, context);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  if (study.file && language === 'es') {
    const expectedSource = `./js/${study.slug}-study.js`;
    if (scripts.length !== 1 || scripts[0][2].trim() || !scripts[0][1].includes('type="module"') || !scripts[0][1].includes(`src="${expectedSource}`)) {
      fail(`${context}: la página completa solo puede cargar su módulo local esperado.`);
    }
  } else if (scripts.length) {
    fail(`${context}: los fragmentos no pueden contener scripts.`);
  }
  for (const id of requiredIds) {
    if (!html.includes(`id="${id}"`)) fail(`${context}: falta la sección obligatoria #${id}.`);
  }
  if (!html.includes('context-study-outcome')) fail(`${context}: falta el resultado de aprendizaje.`);
  if (!html.includes('context-faith-note')) fail(`${context}: falta el criterio de fe.`);
  if (!html.includes('context-takeaway')) fail(`${context}: falta la utilidad final del recorrido.`);
  if (!html.includes('context-ai-note')) fail(`${context}: falta la declaración editorial sobre imágenes.`);
  if (count(html, /context-guided-answer/g) < 3) fail(`${context}: debe incluir observación guiada y al menos dos respuestas orientativas.`);

  const sourceIds = [...html.matchAll(/id="source-(\d+)"/g)].map((match) => Number(match[1]));
  if (sourceIds.length < 5) fail(`${context}: solo declara ${sourceIds.length} fuentes; se requieren al menos cinco.`);
  const expectedIds = Array.from({ length: sourceIds.length }, (_, index) => index + 1);
  if (sourceIds.some((value, index) => value !== expectedIds[index])) fail(`${context}: los identificadores de fuentes no son consecutivos.`);
  const sourceUrls = [...html.matchAll(/<li id="source-\d+">\s*<a href="([^"]+)"/g)].map((match) => match[1].replaceAll('&amp;', '&'));
  if (sourceUrls.length !== sourceIds.length) fail(`${context}: alguna fuente no tiene un enlace reconocible.`);
  if (sourceUrls.some((url) => !url.startsWith('https://'))) fail(`${context}: todas las fuentes deben usar HTTPS.`);
  if (new Set(sourceUrls).size !== sourceUrls.length) fail(`${context}: contiene enlaces de fuente duplicados.`);
  const sourceLinks = [...html.matchAll(/<li id="source-\d+">\s*<a\b([^>]+)>/g)].map((match) => match[1]);
  if (sourceLinks.some((attributes) => !/\btarget="_blank"/.test(attributes) || !/\brel="[^"]*noreferrer[^"]*"/.test(attributes))) {
    fail(`${context}: cada fuente externa debe abrirse de forma segura.`);
  }

  const idValues = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const ids = new Set(idValues);
  if (ids.size !== idValues.length) fail(`${context}: contiene identificadores HTML duplicados.`);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(match[1])) fail(`${context}: la referencia #${match[1]} no existe.`);
  }

  const figures = [...html.matchAll(/<figure class="context-theory-figure">([\s\S]*?)<\/figure>/g)].map((match) => match[1]);
  for (const figure of figures) {
    const source = figure.match(/data-image-src="([^"]+)"/)?.[1];
    const image = figure.match(/<img\b([^>]+)>/)?.[1];
    if (!source || !image) fail(`${context}: una figura no tiene botón e imagen completos.`);
    if (!/\balt="[^"]+"/.test(image) || !/\bwidth="\d+"/.test(image) || !/\bheight="\d+"/.test(image)) {
      fail(`${context}: una imagen carece de texto alternativo o dimensiones.`);
    }
    if (!/aria-label="[^"]+"/.test(figure)) fail(`${context}: una imagen ampliable carece de nombre accesible.`);
    const imageSource = image.match(/\bsrc="([^"]+)"/)?.[1];
    if (imageSource !== source) fail(`${context}: la miniatura y la imagen ampliada no usan el mismo recurso.`);
    const normalized = source.replace(/^\.\//, '');
    if (!fs.existsSync(path.join(root, normalized))) fail(`${context}: falta el recurso ${source}.`);
  }

  if (study.draft && !draftWords[language].test(html)) fail(`${context}: está registrado como borrador, pero el contenido no lo declara.`);
  if (!study.draft && draftWords[language].test(html)) fail(`${context}: está aprobado, pero el contenido todavía lo presenta como borrador.`);
  if (!html.includes(study.titles[language])) fail(`${context}: el título no coincide con el registro.`);

  return {
    relativePath, sources: sourceIds.length, figures: figures.length,
    sections: count(html, /<section\b/g), answers: count(html, /context-guided-answer/g)
  };
}

function validateRegistry(studies) {
  const slugs = new Set();
  const chapterKeys = new Set();
  const catalog = JSON.parse(read(path.join('content', 'books.json')));
  const chaptersByBook = new Map(catalog.books.map((book) => [book.id, book.chapters.length]));
  const milestones = new Set([...read(path.join('web', 'lib', 'timeline.ts')).matchAll(/(?:\bid|"id")\s*:\s*"([^"]+)"/g)].map((match) => match[1]));

  for (const study of studies) {
    if (slugs.has(study.slug)) fail(`Slug duplicado: ${study.slug}.`);
    slugs.add(study.slug);
    if (chapterKeys.has(study.chapterKey)) fail(`Capítulo relacionado duplicado: ${study.chapterKey}.`);
    chapterKeys.add(study.chapterKey);
    const chapterMatch = study.chapterKey.match(/^(.+)-(\d+)$/);
    if (!chapterMatch) fail(`${study.slug}: chapterKey no válido.`);
    const chapterCount = chaptersByBook.get(chapterMatch[1]);
    if (!chapterCount || Number(chapterMatch[2]) > chapterCount) fail(`${study.slug}: ${study.chapterKey} no existe en el catálogo.`);
    if (!milestones.has(study.milestone)) fail(`${study.slug}: hito desconocido ${study.milestone}.`);
    if (study.draft && study.published) fail(`${study.slug}: un borrador no puede estar autorizado para publicación.`);
    for (const language of languages) if (!study.titles[language]?.trim()) fail(`${study.slug}: falta el título ${language}.`);
  }

  const expectedFragments = new Set(studies.flatMap((study) => languages
    .filter((language) => !(language === 'es' && study.file))
    .map((language) => `${study.slug}.${language}.html`)));
  const actualFragments = new Set(fs.readdirSync(studiesDirectory).filter((name) => name.endsWith('.html')));
  for (const expected of expectedFragments) if (!actualFragments.has(expected)) fail(`Falta el fragmento ${expected}.`);
  for (const actual of actualFragments) if (!expectedFragments.has(actual)) fail(`Fragmento sin registrar: ${actual}.`);
}

try {
  validateAllowlistRegressions();
  const studies = extractStudies();
  validateRegistry(studies);
  let translations = 0;
  let sources = 0;
  for (const study of studies) {
    const inspections = languages.map((language) => inspectHtml(study, language));
    translations += inspections.length;
    sources += inspections.reduce((total, item) => total + item.sources, 0);
    for (const field of ['sources', 'figures', 'sections', 'answers']) {
      if (new Set(inspections.map((item) => item[field])).size !== 1) fail(`${study.slug}: las traducciones difieren en ${field}.`);
    }
  }
  const drafts = studies.filter((study) => study.draft).length;
  const published = studies.filter((study) => study.published && !study.draft).length;
  const panelImages = fs.readdirSync(path.join(root, 'assets')).filter((name) => /^contexto-.+-panel-[123]-v1\.webp$/.test(name));
  const panelBytes = panelImages.reduce((total, name) => total + fs.statSync(path.join(root, 'assets', name)).size, 0);
  if (panelImages.length !== 51) fail(`Se esperaban 51 ilustraciones nuevas y se encontraron ${panelImages.length}.`);
  if (panelImages.some((name) => fs.statSync(path.join(root, 'assets', name)).size > 160_000)) fail('Una ilustración nueva supera el límite de 160 KB.');
  if (panelBytes > 6_000_000) fail(`Las ilustraciones nuevas superan el presupuesto de 6 MB (${panelBytes} bytes).`);
  console.log(`✅ Estudios verificados: ${studies.length} estudios, ${translations} versiones, ${sources} referencias; ${published} públicos y ${drafts} borradores internos.`);
  console.log(`✅ Imágenes optimizadas: ${panelImages.length} WebP, ${(panelBytes / 1_000_000).toFixed(2)} MB en total.`);
} catch (error) {
  console.error(`❌ Validación de estudios fallida: ${error.message}`);
  process.exit(1);
}
