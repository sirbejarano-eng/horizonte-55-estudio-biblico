// Comprueba dist/ antes de publicar: páginas clave de los tres idiomas, las cuatro ediciones
// completas, redirecciones de las direcciones antiguas, modo sin conexión y nada interno.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const CHAPTERS = 1189;

const exists = (relativePath) => fs.existsSync(path.join(output, relativePath));
function assertExists(relativePath) {
  if (!exists(relativePath)) throw new Error(`Falta en la publicación: ${relativePath}`);
}

function collectFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(prefix, entry.name);
    return entry.isDirectory()
      ? collectFiles(path.join(directory, entry.name), relativePath)
      : [relativePath.replaceAll('\\', '/')];
  });
}

try {
  const pages = [
    'index.html', 'biblioteca/index.html', 'buscar/index.html', 'cronologia/index.html', 'sin-conexion/index.html',
    'estudios/eden/index.html', 'estudios/babel/index.html',
    'en/index.html', 'en/library/index.html', 'en/search/index.html', 'en/timeline/index.html', 'en/offline/index.html', 'en/studies/eden/index.html',
    'de/index.html', 'de/bibliothek/index.html', 'de/suche/index.html', 'de/zeitleiste/index.html', 'de/offline/index.html', 'de/studien/babel/index.html',
  ];
  pages.forEach(assertExists);

  // Los 23 estudios con aprobación editorial deben aparecer en cada idioma y en el sitemap.
  const approvedStudies = [
    'eden',
    'diluvio', 'abraham', 'jose', 'exodo', 'tabernaculo', 'jerico', 'silo', 'ciudad-david',
    'templo-salomon', 'ezequias', 'caida-jerusalen', 'daniel', 'ciro', 'ester', 'belen',
    'galilea', 'jerusalen', 'pentecostes', 'pablo', 'atenas', 'siete-iglesias', 'babel',
  ];
  const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
  for (const slug of approvedStudies) {
    for (const base of ['estudios', 'en/studies', 'de/studien']) {
      assertExists(`${base}/${slug}/index.html`);
    }
    for (const base of ['/estudios/', '/en/studies/', '/de/studien/']) {
      if (!sitemap.includes(`${base}${slug}/`)) throw new Error(`El estudio aprobado ${slug} falta en sitemap.xml (${base}).`);
    }
  }

  // Redirecciones de la versión anterior (enlaces compartidos y marcadores).
  ['lectura.html', 'biblioteca.html', 'buscar.html', 'cronologia.html', 'contexto-eden.html', 'contexto-babel.html'].forEach(assertExists);

  // Cada edición con todos sus capítulos.
  const editions = { 'leer': 'ONBV', 'rv1909/leer': 'RV1909', 'en/read': 'inglés', 'de/lesen': 'alemán' };
  for (const [base, name] of Object.entries(editions)) {
    const dir = path.join(output, base);
    if (!fs.existsSync(dir)) throw new Error(`Falta la edición ${name} (${base}/)`);
    const count = collectFiles(dir).filter((file) => /^[a-z0-9-]+\/\d+\/index\.html$/.test(file)).length;
    if (count !== CHAPTERS) throw new Error(`La edición ${name} tiene ${count} capítulos (se esperaban ${CHAPTERS}).`);
  }

  ['books.json', 'books-es-onbv.json', 'books-en.json', 'books-de.json'].forEach((file) => assertExists(`content/${file}`));
  ['hero-background.jpg', 'icon.svg', 'icon-192.png', 'icon-es.png', 'icon-en.png', 'icon-de.png', 'mapa-es.webp', 'mapa-en.webp', 'mapa-de.webp', 'contexto-eden-simbolica-v2.webp', 'contexto-babel-teologica-v1.webp']
    .forEach((file) => assertExists(`assets/${file}`));
  ['sw.js', 'manifest.json', 'manifest-es.json', 'manifest-en.json', 'manifest-de.json', '.nojekyll', 'LICENSE', '_next'].forEach(assertExists);

  // Las páginas que el service worker guarda para leer sin conexión deben existir.
  const serviceWorker = fs.readFileSync(path.join(output, 'sw.js'), 'utf8');
  const offlineBlock = serviceWorker.match(/const OFFLINE_PAGES = \{([^}]*)\}/);
  if (!offlineBlock) throw new Error('No se pudo leer OFFLINE_PAGES de sw.js.');
  const offlinePages = [...offlineBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  if (offlinePages.length !== 3) throw new Error('sw.js debe declarar una página sin conexión por idioma.');
  for (const page of offlinePages) assertExists(path.join(page, 'index.html'));

  const forbidden = ['vendor', 'tests', 'tools', 'docs', 'node_modules', '.git', 'web', 'js', 'css'];
  for (const relativePath of forbidden) {
    if (exists(relativePath)) throw new Error(`La publicación no debe incluir: ${relativePath}`);
  }

  const files = collectFiles(output);
  console.log(`✅ Publicación verificada: ${files.length} archivos, ${CHAPTERS} capítulos × 4 ediciones, sin fuentes ni herramientas internas.`);
} catch (error) {
  console.error('❌ Validación de publicación fallida:', error.message);
  process.exit(1);
}
