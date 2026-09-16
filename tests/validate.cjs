const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function assertFileExists(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) throw new Error(`Falta el archivo: ${relativePath}`);
}

function assertContentPresent(relativePath, text) {
  const filePath = path.join(root, relativePath);
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(text)) throw new Error(`No se encontró "${text}" en ${relativePath}`);
}

function assertContentCatalog(relativePath) {
  const filePath = path.join(root, relativePath);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const genesis = content.books.find((book) => book.id === 'genesis');
  const matthew = content.books.find((book) => book.id === 'mateo');
  const gospels = ['mateo', 'marcos', 'lucas', 'juan'];
  const totalChapters = content.books.reduce((total, book) => total + book.chapters.length, 0);
  if (content.books.length !== 66) throw new Error(`${relativePath}: el catálogo debe contener 66 libros.`);
  if (totalChapters !== 1189) throw new Error(`${relativePath}: el catálogo debe contener 1189 capítulos.`);
  if (!content.books.every((book) => book.chapters.length && book.chapters.every((chapter) => chapter.verses?.length))) {
    throw new Error(`${relativePath}: todos los libros deben tener capítulos con versículos.`);
  }
  const expectedChapterCounts = {
    genesis: 50, exodo: 40, levitico: 27, numeros: 36, deuteronomio: 34, josue: 24, salmos: 150,
    mateo: 28, marcos: 16, lucas: 24, juan: 21, hechos: 28, romanos: 16,
    '1-corintios': 16, '2-corintios': 13, galatas: 6
  };
  Object.entries(expectedChapterCounts).forEach(([bookId, chapterCount]) => {
    const book = content.books.find((item) => item.id === bookId);
    if (!book || book.chapters.length !== chapterCount) {
      throw new Error(`${relativePath}: ${bookId} debe contener ${chapterCount} capítulos.`);
    }
  });
  if (!matthew || matthew.chapters[0]?.verses.length !== 25) {
    throw new Error(`${relativePath}: Mateo 1 debe contener 25 versículos.`);
  }
  gospels.forEach((bookId) => {
    const gospel = content.books.find((book) => book.id === bookId);
    if (!gospel || !gospel.chapters.every((chapter) => chapter.verses?.length)) {
      throw new Error(`${relativePath}: el evangelio ${bookId} debe contener versículos en todos sus capítulos.`);
    }
  });
  if (!genesis.chapters.every((chapter) => chapter.verses?.length)) {
    throw new Error(`${relativePath}: cada capítulo de Génesis debe contener versículos.`);
  }
}

try {
  assertFileExists('index.html');
  assertFileExists('css/styles.css');
  assertFileExists('js/core.js');
  assertFileExists('js/shell.js');
  assertFileExists('js/home.js');
  assertFileExists('js/library.js');
  assertFileExists('js/reader.js');
  assertFileExists('js/search.js');
  assertFileExists('biblioteca.html');
  assertFileExists('lectura.html');
  assertFileExists('buscar.html');
  assertFileExists('cronologia.html');
  assertFileExists('assets/ancient-map.svg');
  assertFileExists('js/timeline.js');
  assertFileExists('content/books.json');
  assertFileExists('content/books-en.json');
  assertFileExists('content/books-de.json');
  assertFileExists('content/books-es-onbv.json');
  assertFileExists('THIRD_PARTY_NOTICES.md');
  assertFileExists('vendor/SOURCES.json');
  assertFileExists('tools/convert-ebible-usfm.js');
  assertFileExists('serve.json');
  assertFileExists('README.md');

  assertContentPresent('index.html', 'Horizonte 55');
  assertContentPresent('css/styles.css', '@media (min-width: 760px)');
  assertContentPresent('js/core.js', 'loadBooks');
  assertContentPresent('js/reader.js', 'renderReader');
  assertContentPresent('js/shell.js', 'serviceWorker.register');
  assertContentPresent('js/shell.js', "if (!window.isSecureContext)");
  assertContentPresent('js/shell.js', "t('offlineRequiresHttps')");
  assertContentPresent('js/shell.js', "t('offlineUnsupported')");
  assertContentPresent('js/shell.js', "t('offlineUnavailable')");
  assertContentPresent('js/i18n.js', "offlineRequiresHttps: 'El modo sin conexión requiere una conexión HTTPS segura en este dispositivo.'");
  assertContentPresent('cronologia.html', 'Línea de tiempo bíblica');
  const serveConfig = JSON.parse(fs.readFileSync(path.join(root, 'serve.json'), 'utf8'));
  if (serveConfig.cleanUrls !== false) {
    throw new Error('serve.json debe conservar las extensiones .html para no perder los parámetros de lectura en redirecciones.');
  }
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!packageJson.scripts?.dev?.includes('-c serve.json') || !packageJson.scripts?.start?.includes('-c serve.json')) {
    throw new Error('Los comandos de desarrollo deben cargar serve.json.');
  }
  assertContentPresent('content/books.json', 'Génesis');
  assertContentCatalog('content/books.json');
  assertContentCatalog('content/books-en.json');
  assertContentCatalog('content/books-de.json');
  assertContentCatalog('content/books-es-onbv.json');

  console.log('✅ Validación básica exitosa: estructura y contenido básicos presentes.');
} catch (error) {
  console.error('❌ Validación fallida:', error.message);
  process.exit(1);
}
