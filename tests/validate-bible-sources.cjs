const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const expectedCatalogHashes = {
  'content/books.json': '684D17B7980C254A4408969E5753042361531E8255DD6B6107EB12630F4857E0',
  'content/books-es-onbv.json': 'E4FEE69C712EA4C5FE097C49786BB7084B12EF0426EAC7B74634E7A821D2D55B',
  'content/books-de.json': '16936ABF81646384BDA288FAA82082ABDB71572DF2AA1EF96F3A8960EEE4DC87',
  'content/books-en.json': 'FCABC1D8A1B365050FD1D2B1D86CC4A0078C27BB5010199401C7A626902F6966'
};

function fail(message) {
  throw new Error(message);
}

function sha256(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex').toUpperCase();
}

function readCatalog(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function verse(catalog, bookId, chapterNumber, verseNumber) {
  return catalog.books.find((book) => book.id === bookId)
    ?.chapters.find((chapter) => chapter.number === chapterNumber)
    ?.verses.find((item) => item.number === verseNumber)?.text;
}

const registry = JSON.parse(fs.readFileSync(path.join(root, 'vendor', 'SOURCES.json'), 'utf8'));
if (registry.schema_version !== 1 || registry.sources.length !== 4) fail('El registro debe describir exactamente cuatro fuentes bíblicas.');
if (new Set(registry.sources.map((source) => source.id)).size !== 4) fail('Los identificadores de fuente deben ser únicos.');

for (const source of registry.sources) {
  if (!source.source_url || !source.original_package || !source.original_sha256 || !source.catalog || !source.catalog_sha256 || !source.license || !source.transformation) {
    fail(`Registro incompleto para ${source.id}.`);
  }
  const actual = sha256(source.original_package);
  if (actual !== source.original_sha256) fail(`${source.id}: la huella del paquete original no coincide.`);
  if (sha256(source.catalog) !== source.catalog_sha256) fail(`${source.id}: la huella del catálogo derivado no coincide con el registro.`);
}

for (const [relativePath, expected] of Object.entries(expectedCatalogHashes)) {
  if (sha256(relativePath) !== expected) fail(`${relativePath}: el catálogo no coincide con la conversión aprobada.`);
}

const rv1909 = readCatalog('content/books.json');
const onbv = readCatalog('content/books-es-onbv.json');
const schlachter = readCatalog('content/books-de.json');
const webpb = readCatalog('content/books-en.json');
for (const [name, catalog] of Object.entries({ rv1909, onbv, schlachter, webpb })) {
  if (catalog.books.length !== 66) fail(`${name}: se requieren 66 libros.`);
  if (catalog.books.reduce((sum, book) => sum + book.chapters.length, 0) !== 1189) fail(`${name}: se requieren 1189 capítulos.`);
  const serialized = JSON.stringify(catalog);
  if (/\\(?:w|f|x)\*?|strong=/.test(serialized)) fail(`${name}: quedaron marcadores técnicos USFM en el catálogo.`);
}

if (verse(rv1909, 'genesis', 1, 1) !== 'EN el principio crió Dios los cielos y la tierra.') fail('RV1909 Génesis 1:1 no coincide con la fuente identificada.');
if (verse(schlachter, 'juan', 3, 16) !== 'Denn Gott hat die Welt so geliebt, daß er seinen eingeborenen Sohn gab, damit jeder, der an ihn glaubt, nicht verloren gehe, sondern ewiges Leben habe.') fail('Schlachter 1951 Juan 3:16 no coincide.');
if (verse(webpb, 'genesis', 1, 1) !== 'In the beginning, God created the heavens and the earth.') fail('WEB British Génesis 1:1 no coincide.');
if (verse(webpb, 'juan', 3, 16) !== 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.') fail('WEB British Juan 3:16 no coincide.');
if (webpb.books[0].title !== 'Genesis' || schlachter.books[0].title !== '1. Mose' || rv1909.books[0].title !== 'Génesis') fail('Los títulos localizados no coinciden.');

const shell = fs.readFileSync(path.join(root, 'js', 'shell.js'), 'utf8');
for (const required of ['webpbAttribution', 'schlachterAttribution', 'rv1909Attribution', 'onbvAttribution']) {
  if (!shell.includes(required)) fail(`Falta la selección dinámica ${required}.`);
}
const notices = fs.readFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
for (const required of ['Creative Commons Attribution-ShareAlike 4.0 International', 'Creative Commons Attribution 4.0 International', 'World English Bible British Edition', 'Reina Valera 1909']) {
  if (!notices.includes(required)) fail(`Falta el aviso de terceros: ${required}.`);
}

console.log('✅ Procedencia, huellas, licencias y catálogos bíblicos verificados.');
