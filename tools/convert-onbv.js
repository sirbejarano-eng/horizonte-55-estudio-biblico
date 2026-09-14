// Conversor de USFM (Biblica® Open Nueva Biblia Viva, CC BY-SA 4.0) al formato JSON
// interno de Horizonte 55: { books: [{ id, title, chapters: [{ number, verses: [{ number, text }] }] }] }.
//
// Reglas seguidas (ver README.md, sección "Open Nueva Biblia Viva (ONBV)"):
// - Fuente única: vendor/onbv-source/onbv-usfm-original.zip (sin modificar), descargado manualmente
//   desde https://open.bible/bibles/biblica-open-nueva-biblia-viva.
// - Solo se hace una conversión estructural (USFM -> JSON). No se corrige, resume ni reformula texto.
// - Los rangos de versículos del original (p. ej. "\v 2-15") se conservan como un único versículo
//   numerado con el primer número del rango; no se inventan versículos intermedios.
// - Marcado de formato en línea (\nd, \wj, \it, \sc) se aplana a texto plano.
// - Notas al pie (\f ... \f*) y referencias cruzadas (\xt, \ref) se eliminan del texto de lectura.
// - Encabezados de sección (\s1, \s2), encabezados de libro (\h, \mt1, \toc*, \ms1) y líneas de
//   metadatos (\id, \rem) se descartan: no forman parte del texto bíblico versificado.
// - Descripciones de salmos (\d) se anteponen al versículo 1 del capítulo correspondiente.
// - Etiquetas de interlocutor (\sp, p. ej. en Cantares) se anteponen al siguiente versículo.
// - Tablas (\tr/\th*/\tc*, p. ej. el censo de Números 1) se aplanan a texto corrido dentro del
//   versículo donde aparecen; se pierde el formato tabular pero no el contenido textual.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourceDir = path.join(root, 'vendor', 'onbv-source', 'extracted', 'release', 'USX_1');
const referenceCatalogPath = path.join(root, 'content', 'books.json');
const outputPath = path.join(root, 'content', 'books-es-onbv.json');

// Mapa de código USFM (3 letras) -> id canónico usado en content/books.json.
const BOOK_CODE_TO_ID = {
  GEN: 'genesis', EXO: 'exodo', LEV: 'levitico', NUM: 'numeros', DEU: 'deuteronomio',
  JOS: 'josue', JDG: 'jueces', RUT: 'rut', '1SA': '1-samuel', '2SA': '2-samuel',
  '1KI': '1-reyes', '2KI': '2-reyes', '1CH': '1-cronicas', '2CH': '2-cronicas',
  EZR: 'esdras', NEH: 'nehemias', EST: 'ester', JOB: 'job', PSA: 'salmos',
  PRO: 'proverbios', ECC: 'eclesiastes', SNG: 'cantares', ISA: 'isaias', JER: 'jeremias',
  LAM: 'lamentaciones', EZK: 'ezequiel', DAN: 'daniel', HOS: 'oseas', JOL: 'joel',
  AMO: 'amos', OBA: 'abdias', JON: 'jonas', MIC: 'miqueas', NAM: 'nahum', HAB: 'habacuc',
  ZEP: 'sofonias', HAG: 'hageo', ZEC: 'zacarias', MAL: 'malaquias', MAT: 'mateo',
  MRK: 'marcos', LUK: 'lucas', JHN: 'juan', ACT: 'hechos', ROM: 'romanos',
  '1CO': '1-corintios', '2CO': '2-corintios', GAL: 'galatas', EPH: 'efesios',
  PHP: 'filipenses', COL: 'colosenses', '1TH': '1-tesalonicenses', '2TH': '2-tesalonicenses',
  '1TI': '1-timoteo', '2TI': '2-timoteo', TIT: 'tito', PHM: 'filemon', HEB: 'hebreos',
  JAS: 'santiago', '1PE': '1-pedro', '2PE': '2-pedro', '1JN': '1-juan', '2JN': '2-juan',
  '3JN': '3-juan', JUD: 'judas', REV: 'apocalipsis'
};

// Marcadores cuyo texto siguiente se descarta por completo (metadatos o encabezados, no versículos).
const IGNORED_MARKERS = new Set(['id', 'rem', 'h', 'toc1', 'toc2', 'toc3', 'mt1', 'ms1', 's1', 's2', 'cl']);
// Marcadores de formato en línea: su texto siguiente se trata como texto normal del versículo.
const PASSTHROUGH_MARKERS = new Set(['nd', 'nd*', 'wj', 'wj*', 'it', 'it*', 'sc', 'sc*', 'p', 'pm', 'm', 'b', 'tr', 'th1', 'th2', 'th3', 'th4', 'th5', 'tc1', 'tc2', 'tc3', 'tc4', 'tc5']);
const FOOTNOTE_START = new Set(['f']);
const FOOTNOTE_END = new Set(['f*']);
const FOOTNOTE_INNER = new Set(['fr', 'ft', 'xt', 'ref', 'ref*']);

function collapseWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function parseUsfmFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').replace(/\n/g, ' ');
  const tokenPattern = /\\([a-zA-Z0-9]+\*?)([^\\]*)/g;
  const chapters = [];
  let currentChapter = null;
  let currentVerse = null;
  let pendingPrefix = '';
  let inFootnote = false;
  let match;

  function appendToCurrentVerse(text) {
    if (inFootnote) return;
    const cleaned = collapseWhitespace(text);
    if (!cleaned) return;
    if (!currentVerse) return; // texto fuera de cualquier versículo (encabezados ya filtrados): se descarta
    currentVerse.text = currentVerse.text ? `${currentVerse.text} ${cleaned}` : cleaned;
  }

  while ((match = tokenPattern.exec(raw)) !== null) {
    const marker = match[1];
    const following = match[2];

    if (FOOTNOTE_START.has(marker)) { inFootnote = true; continue; }
    if (FOOTNOTE_END.has(marker)) { inFootnote = false; appendToCurrentVerse(following); continue; }
    if (inFootnote || FOOTNOTE_INNER.has(marker)) continue;

    if (marker === 'c') {
      const chapterNumber = parseInt(following.trim(), 10);
      currentChapter = { number: chapterNumber, verses: [] };
      chapters.push(currentChapter);
      currentVerse = null;
      continue;
    }

    if (marker === 'd') {
      // Descripción/superscripción de salmo: se antepone al versículo 1 cuando este se cree.
      const description = collapseWhitespace(following);
      if (description) pendingPrefix = pendingPrefix ? `${pendingPrefix} ${description}` : description;
      continue;
    }

    if (marker === 'sp') {
      const speaker = collapseWhitespace(following);
      if (speaker) pendingPrefix = pendingPrefix ? `${pendingPrefix} ${speaker}:` : `${speaker}:`;
      continue;
    }

    if (IGNORED_MARKERS.has(marker)) continue;

    if (marker === 'v') {
      const verseMatch = following.trim().match(/^(\d+)[a-z]?(?:-\d+[a-z]?)?\s*(.*)$/s);
      if (!verseMatch) throw new Error(`No se pudo interpretar el marcador \\v en ${filePath}: "${following.slice(0, 40)}"`);
      const verseNumber = parseInt(verseMatch[1], 10);
      const rest = verseMatch[2] || '';
      if (!currentChapter) throw new Error(`Versículo ${verseNumber} fuera de cualquier capítulo en ${filePath}`);
      currentVerse = { number: verseNumber, text: '' };
      currentChapter.verses.push(currentVerse);
      if (pendingPrefix) { currentVerse.text = pendingPrefix; pendingPrefix = ''; }
      appendToCurrentVerse(rest);
      continue;
    }

    if (PASSTHROUGH_MARKERS.has(marker)) { appendToCurrentVerse(following); continue; }

    // Marcador desconocido: se trata como texto normal para no perder contenido por error.
    appendToCurrentVerse(following);
  }

  chapters.forEach((chapter) => {
    chapter.verses.forEach((verse) => { verse.text = collapseWhitespace(verse.text); });
  });
  return chapters;
}

function main() {
  if (!fs.existsSync(sourceDir)) throw new Error(`No se encontró la carpeta USFM extraída: ${sourceDir}`);
  const referenceCatalog = JSON.parse(fs.readFileSync(referenceCatalogPath, 'utf8'));

  const parsedByCode = {};
  const files = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.usfm'));
  files.forEach((fileName) => {
    const code = path.basename(fileName, '.usfm');
    const id = BOOK_CODE_TO_ID[code];
    if (!id) throw new Error(`Código USFM sin mapeo a id canónico: ${code}`);
    parsedByCode[id] = parseUsfmFile(path.join(sourceDir, fileName));
  });

  const missing = referenceCatalog.books.map((book) => book.id).filter((id) => !parsedByCode[id]);
  if (missing.length) throw new Error(`Faltan libros en la fuente ONBV: ${missing.join(', ')}`);

  const books = referenceCatalog.books.map((refBook) => ({
    id: refBook.id,
    title: refBook.title,
    chapters: parsedByCode[refBook.id]
  }));

  fs.writeFileSync(outputPath, JSON.stringify({ books }, null, 2), 'utf8');
  console.log(`✅ Generado ${path.relative(root, outputPath)} con ${books.length} libros.`);
}

main();
