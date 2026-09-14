// Conversor determinista de paquetes USFM oficiales de eBible.org al catálogo
// interno de Horizonte 55. No traduce, resume ni reformula el texto bíblico.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const SOURCES = {
  spaRV1909: {
    sourceDir: path.join(root, 'vendor', 'spaRV1909-source', 'extracted'),
    outputPath: path.join(root, 'content', 'books.json')
  },
  deu1951: {
    sourceDir: path.join(root, 'vendor', 'deu1951-source', 'extracted'),
    outputPath: path.join(root, 'content', 'books-de.json')
  },
  engwebpb: {
    sourceDir: path.join(root, 'vendor', 'engwebpb-source', 'extracted'),
    outputPath: path.join(root, 'content', 'books-en.json')
  }
};

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

const CANONICAL_IDS = Object.values(BOOK_CODE_TO_ID);
const DISCARD_LINE_MARKERS = /^(?:id|ide|h|toc\d?|mt\d?|mte\d?|ms\d?|s\d?|sr|r|cl|rem)\b/;
const SPANISH_TITLES = {
  genesis: 'Génesis', exodo: 'Éxodo', levitico: 'Levítico', numeros: 'Números', deuteronomio: 'Deuteronomio',
  josue: 'Josué', jueces: 'Jueces', rut: 'Rut', '1-samuel': '1 Samuel', '2-samuel': '2 Samuel',
  '1-reyes': '1 Reyes', '2-reyes': '2 Reyes', '1-cronicas': '1 Crónicas', '2-cronicas': '2 Crónicas',
  esdras: 'Esdras', nehemias: 'Nehemías', ester: 'Ester', job: 'Job', salmos: 'Salmos',
  proverbios: 'Proverbios', eclesiastes: 'Eclesiastés', cantares: 'Cantares', isaias: 'Isaías',
  jeremias: 'Jeremías', lamentaciones: 'Lamentaciones', ezequiel: 'Ezequiel', daniel: 'Daniel',
  oseas: 'Oseas', joel: 'Joel', amos: 'Amós', abdias: 'Abdías', jonas: 'Jonás', miqueas: 'Miqueas',
  nahum: 'Nahúm', habacuc: 'Habacuc', sofonias: 'Sofonías', hageo: 'Hageo', zacarias: 'Zacarías',
  malaquias: 'Malaquías', mateo: 'Mateo', marcos: 'Marcos', lucas: 'Lucas', juan: 'Juan',
  hechos: 'Hechos', romanos: 'Romanos', '1-corintios': '1 Corintios', '2-corintios': '2 Corintios',
  galatas: 'Gálatas', efesios: 'Efesios', filipenses: 'Filipenses', colosenses: 'Colosenses',
  '1-tesalonicenses': '1 Tesalonicenses', '2-tesalonicenses': '2 Tesalonicenses',
  '1-timoteo': '1 Timoteo', '2-timoteo': '2 Timoteo', tito: 'Tito', filemon: 'Filemón',
  hebreos: 'Hebreos', santiago: 'Santiago', '1-pedro': '1 Pedro', '2-pedro': '2 Pedro',
  '1-juan': '1 Juan', '2-juan': '2 Juan', '3-juan': '3 Juan', judas: 'Judas', apocalipsis: 'Apocalipsis'
};

function collapseWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function stripNonReadingBlocks(text) {
  return text
    .replace(/\\f\s[\s\S]*?\\f\*/g, ' ')
    .replace(/\\x\s[\s\S]*?\\x\*/g, ' ')
    .replace(/\\fig\s[\s\S]*?\\fig\*/g, ' ');
}

function cleanInlineUsfm(text) {
  let clean = stripNonReadingBlocks(text);
  // Conserva la palabra visible y elimina atributos Strong/lemma.
  clean = clean.replace(/\\\+?w\s+([^|\\]+?)(?:\|[^\\]*?)?\\\+?w\*/g, '$1');
  // Conserva el texto de los marcadores editoriales y tipográficos.
  clean = clean.replace(/\\(?:add|nd|wj|it|bd|sc|em|qt)\*?/g, '');
  // Elimina cualquier marcador restante, sin eliminar su texto visible.
  clean = clean.replace(/\\\+?[A-Za-z0-9]+\*?/g, '');
  return collapseWhitespace(clean);
}

function parseUsfmFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const idMatch = raw.match(/^\\id\s+([A-Z0-9]{3})\b/m);
  if (!idMatch) return null;
  const code = idMatch[1];
  const id = BOOK_CODE_TO_ID[code];
  if (!id) return null; // portada, glosario u otro material no canónico
  const titleMatch = raw.match(/^\\toc2\s+(.+)$/m) || raw.match(/^\\h\s+(.+)$/m);
  const title = collapseWhitespace(titleMatch?.[1] || code);
  const chapters = [];
  let currentChapter = null;
  let currentVerse = null;
  let pendingPrefix = '';
  const withoutBlocks = stripNonReadingBlocks(raw);

  for (const originalLine of withoutBlocks.split('\n')) {
    const line = originalLine.trim();
    if (!line) continue;
    const chapterMatch = line.match(/^\\c\s+(\d+)\b/);
    if (chapterMatch) {
      currentChapter = { number: Number(chapterMatch[1]), verses: [] };
      chapters.push(currentChapter);
      currentVerse = null;
      continue;
    }
    const descriptionMatch = line.match(/^\\d\s+(.+)$/);
    if (descriptionMatch) {
      const description = cleanInlineUsfm(descriptionMatch[1]);
      if (description) pendingPrefix = pendingPrefix ? `${pendingPrefix} ${description}` : description;
      continue;
    }
    const verseMatch = line.match(/^\\v\s+(\d+)[a-z]?(?:-\d+[a-z]?)?\s*(.*)$/);
    if (verseMatch) {
      if (!currentChapter) throw new Error(`Versículo fuera de capítulo en ${filePath}`);
      const number = Number(verseMatch[1]);
      const verseText = cleanInlineUsfm(verseMatch[2]);
      currentVerse = { number, text: collapseWhitespace(`${pendingPrefix} ${verseText}`) };
      pendingPrefix = '';
      currentChapter.verses.push(currentVerse);
      continue;
    }
    const markerMatch = line.match(/^\\([A-Za-z0-9]+\*?)\s*(.*)$/);
    if (markerMatch) {
      if (DISCARD_LINE_MARKERS.test(markerMatch[1])) continue;
      if (currentVerse) {
        const continuation = cleanInlineUsfm(markerMatch[2]);
        if (continuation) currentVerse.text = collapseWhitespace(`${currentVerse.text} ${continuation}`);
      }
      continue;
    }
    if (currentVerse) currentVerse.text = collapseWhitespace(`${currentVerse.text} ${cleanInlineUsfm(line)}`);
  }

  // Algunas fuentes incluyen marcadores de versículo vacíos para documentar una
  // diferencia de versificación. No se inventa texto ni se desplaza el versículo:
  // el marcador vacío se omite y la numeración textual de la fuente se conserva.
  chapters.forEach((chapter) => {
    chapter.verses = chapter.verses.filter((verse) => verse.text);
  });

  return { id, title, chapters };
}

function validateCatalog(books, sourceId) {
  if (books.length !== 66) throw new Error(`${sourceId}: se esperaban 66 libros y se obtuvieron ${books.length}`);
  const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
  if (totalChapters !== 1189) throw new Error(`${sourceId}: se esperaban 1189 capítulos y se obtuvieron ${totalChapters}`);
  for (const book of books) {
    if (!book.chapters.length) throw new Error(`${sourceId}: ${book.id} no tiene capítulos`);
    for (const chapter of book.chapters) {
      if (!chapter.verses.length || chapter.verses.some((verse) => !verse.text)) {
        throw new Error(`${sourceId}: ${book.id} ${chapter.number} contiene un versículo vacío`);
      }
    }
  }
}

function convert(sourceId) {
  const config = SOURCES[sourceId];
  if (!config) throw new Error(`Fuente desconocida: ${sourceId}`);
  const parsed = new Map();
  for (const fileName of fs.readdirSync(config.sourceDir).filter((name) => name.endsWith('.usfm'))) {
    const book = parseUsfmFile(path.join(config.sourceDir, fileName));
    if (book) parsed.set(book.id, book);
  }
  const missing = CANONICAL_IDS.filter((id) => !parsed.has(id));
  if (missing.length) throw new Error(`${sourceId}: faltan libros: ${missing.join(', ')}`);
  const books = CANONICAL_IDS.map((id) => parsed.get(id));
  if (sourceId === 'spaRV1909') books.forEach((book) => { book.title = SPANISH_TITLES[book.id]; });
  validateCatalog(books, sourceId);
  const temporaryPath = `${config.outputPath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify({ books }, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, config.outputPath);
  console.log(`Generado ${path.relative(root, config.outputPath)} desde ${sourceId}: 66 libros, 1189 capítulos.`);
}

const requested = process.argv.slice(2);
if (!requested.length) throw new Error('Uso: node tools/convert-ebible-usfm.js <spaRV1909|deu1951|engwebpb|all>');
const sourceIds = requested.includes('all') ? Object.keys(SOURCES) : requested;
sourceIds.forEach(convert);
