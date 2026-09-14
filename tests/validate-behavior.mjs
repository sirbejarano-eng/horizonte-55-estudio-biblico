// Pruebas de comportamiento para el lote de fiabilidad de notas/importación/guardado.
// Se ejecuta como módulo ES (.mjs) para poder importar js/core.js e js/i18n.js tal cual,
// con un localStorage en memoria que simula el navegador.

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

global.localStorage = new MemoryStorage();
global.window = { location: { href: '' } };

const core = await import('../js/core.js?v=31');
const {
  validateProgressImport, applyProgressImport, restoreProgressBackup, summarizeCurrentProgress,
  saveNote, getNotes, toggleCompleted, getCompletedChapters, exportProgress,
  getPersistedImportBackup, MAX_NOTE_LENGTH,
  READING_POSITION_KEY, COMPLETED_CHAPTERS_KEY, CHAPTER_NOTES_KEY, IMPORT_BACKUP_KEY,
  SPANISH_VERSION_KEY, getSpanishVersion, setSpanishVersion, normalizeRv1909Opening, loadBooks
} = core;

const books = [
  { id: 'genesis', title: 'Génesis', chapters: [{ number: 1, verses: [{ number: 1, text: 'a' }] }, { number: 2, verses: [{ number: 1, text: 'b' }] }] },
  { id: 'mateo', title: 'Mateo', chapters: [{ number: 1, verses: [{ number: 1, text: 'c' }] }] }
];

let failures = 0;
function check(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
  } else {
    failures += 1;
    console.error(`❌ ${description}`);
  }
}

function resetStorage() {
  global.localStorage.clear();
}

// 1. Archivo de importación inválido: no es JSON.
resetStorage();
{
  const result = validateProgressImport('esto no es json', books);
  check('Rechaza un archivo que no es JSON válido', !result.valid && result.errors.includes('importErrorInvalidJson'));
}

// 2. Versión no soportada.
resetStorage();
{
  const result = validateProgressImport(JSON.stringify({ version: 2 }), books);
  check('Rechaza una versión de archivo no soportada', !result.valid && result.errors.includes('importErrorVersion'));
}

// 3. Referencia a libro/capítulo inexistente.
resetStorage();
{
  const payload = JSON.stringify({ version: 1, completedChapters: { apocalipsis: [1] } });
  const result = validateProgressImport(payload, books);
  check('Rechaza referencias a libros que no existen en el catálogo actual', !result.valid && result.errors.includes('importErrorReference'));
}
{
  const payload = JSON.stringify({ version: 1, readingPosition: { bookId: 'genesis', chapter: 99 } });
  const result = validateProgressImport(payload, books);
  check('Rechaza una posición de lectura con capítulo inexistente', !result.valid && result.errors.includes('importErrorReference'));
}

// 4. Archivo demasiado grande.
resetStorage();
{
  const hugeNote = 'x'.repeat(3 * 1024 * 1024);
  const result = validateProgressImport(hugeNote, books);
  check('Rechaza archivos que superan el tamaño máximo', !result.valid && result.errors.includes('importErrorTooLarge'));
}

// 5. Campo ausente vs. campo vacío (null) en notas.
resetStorage();
{
  const withoutNotes = validateProgressImport(JSON.stringify({ version: 1, readingScale: 1.1 }), books);
  check('Un campo ausente no se incluye en los campos a aplicar', withoutNotes.valid && !('chapterNotes' in withoutNotes.fields));
  const withEmptyNotes = validateProgressImport(JSON.stringify({ version: 1, chapterNotes: null }), books);
  check('Un campo presente con valor null se interpreta como limpieza explícita', withEmptyNotes.valid && withEmptyNotes.fields.chapterNotes.clear === true);
}

// 6. Cancelación: validar sin aplicar no debe escribir nada.
resetStorage();
{
  localStorage.setItem(CHAPTER_NOTES_KEY, JSON.stringify({ genesis: { 1: 'nota previa' } }));
  const payload = JSON.stringify({ version: 1, chapterNotes: { genesis: { 1: 'nota nueva' } } });
  const result = validateProgressImport(payload, books);
  check('La validación por sí sola no modifica el almacenamiento (cancelación segura)',
    result.valid && localStorage.getItem(CHAPTER_NOTES_KEY) === JSON.stringify({ genesis: { 1: 'nota previa' } }));
}

// 7. Sobrescritura confirmada: aplica y reemplaza lo existente.
resetStorage();
{
  localStorage.setItem(COMPLETED_CHAPTERS_KEY, JSON.stringify({ genesis: [1] }));
  const summaryBefore = summarizeCurrentProgress();
  check('summarizeCurrentProgress detecta progreso existente antes de importar', summaryBefore.completedChapters === true);
  const payload = JSON.stringify({ version: 1, completedChapters: { genesis: [1, 2] } });
  const result = validateProgressImport(payload, books);
  const applied = applyProgressImport(result.fields);
  check('La importación confirmada aplica y sobrescribe el progreso existente',
    applied.success && localStorage.getItem(COMPLETED_CHAPTERS_KEY) === JSON.stringify({ genesis: [1, 2] }));
  check('applyProgressImport devuelve un respaldo restaurable', applied.backup.completedChapters === JSON.stringify({ genesis: [1] }));
  restoreProgressBackup(applied.backup);
  check('restoreProgressBackup (Deshacer) restaura el estado previo', localStorage.getItem(COMPLETED_CHAPTERS_KEY) === JSON.stringify({ genesis: [1] }));
}

// 8. Fallo de almacenamiento durante la importación: no debe dejar una importación parcial.
resetStorage();
{
  localStorage.setItem(READING_POSITION_KEY, JSON.stringify({ bookId: 'genesis', chapter: 1 }));
  localStorage.setItem(COMPLETED_CHAPTERS_KEY, JSON.stringify({ genesis: [1] }));
  const payload = JSON.stringify({
    version: 1,
    readingPosition: { bookId: 'mateo', chapter: 1 },
    completedChapters: { genesis: [1, 2] }
  });
  const result = validateProgressImport(payload, books);
  const originalSetItem = localStorage.setItem.bind(localStorage);
  let calls = 0;
  localStorage.setItem = (key, value) => {
    calls += 1;
    if (calls === 2) throw new Error('Cuota de almacenamiento simulada llena');
    return originalSetItem(key, value);
  };
  const applied = applyProgressImport(result.fields);
  localStorage.setItem = originalSetItem;
  check('Si falla una escritura, se reporta el fallo real (no un éxito falso)', applied.success === false);
  check('Si falla una escritura, la primera clave ya escrita se revierte (sin importación parcial)',
    localStorage.getItem(READING_POSITION_KEY) === JSON.stringify({ bookId: 'genesis', chapter: 1 }));
  check('El resto de datos no tocados por el intento fallido permanece intacto',
    localStorage.getItem(COMPLETED_CHAPTERS_KEY) === JSON.stringify({ genesis: [1] }));
}

// 9. Notas vacías: se documenta como limpieza del capítulo, no como error.
resetStorage();
{
  const notes = {};
  const okWithText = saveNote(notes, 'genesis', 1, 'Una observación');
  check('saveNote guarda una nota no vacía correctamente', okWithText === true && getNotes(books).genesis?.[1] === 'Una observación');
  const okEmpty = saveNote(notes, 'genesis', 1, '   ');
  check('saveNote trata un valor en blanco como borrar la nota del capítulo (no como error)',
    okEmpty === true && getNotes(books).genesis === undefined);
}

// 10. Texto con etiquetas se conserva literalmente en el almacenamiento (sin escapar ni ejecutar HTML).
resetStorage();
{
  const notes = {};
  const dangerous = '</textarea><script>alert(1)</script>';
  saveNote(notes, 'genesis', 1, dangerous);
  const stored = getNotes(books).genesis[1];
  check('Una nota con etiquetas HTML se guarda como texto literal, sin alterarla', stored === dangerous);
}

// 11. Fallo al guardar una nota: se conserva la nota anterior (no se pierde en el almacenamiento).
resetStorage();
{
  const notes = { genesis: { 1: 'nota original' } };
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = () => { throw new Error('Cuota de almacenamiento simulada llena'); };
  const success = saveNote(notes, 'genesis', 1, 'nota nueva que no se pudo guardar');
  localStorage.setItem = originalSetItem;
  check('saveNote reporta el fallo real de guardado', success === false);
  check('saveNote revierte el objeto en memoria a la nota anterior si falla la escritura', notes.genesis[1] === 'nota original');
}

// 12. toggleCompleted revierte si falla la escritura (no deja el capítulo marcado sin guardar).
resetStorage();
{
  const completed = { genesis: [1] };
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = () => { throw new Error('Cuota de almacenamiento simulada llena'); };
  const success = toggleCompleted(completed, 'genesis', 2);
  localStorage.setItem = originalSetItem;
  check('toggleCompleted reporta el fallo real de guardado', success === false);
  check('toggleCompleted revierte el estado en memoria si falla la escritura', JSON.stringify(completed.genesis) === JSON.stringify([1]));
}

// 13. Toda nota guardable debe ser reimportable: saveNote limita a MAX_NOTE_LENGTH y exportProgress
// produce un archivo que vuelve a pasar la validación de importación sin cambios.
resetStorage();
{
  const notes = {};
  const longNote = 'x'.repeat(MAX_NOTE_LENGTH + 500);
  saveNote(notes, 'genesis', 1, longNote);
  const stored = getNotes(books).genesis[1];
  check('saveNote trunca las notas a MAX_NOTE_LENGTH', stored.length === MAX_NOTE_LENGTH);
  const exported = exportProgress();
  const reimport = validateProgressImport(JSON.stringify(exported), books);
  check('Toda copia exportada correctamente vuelve a ser importable (símetria de límites)', reimport.valid === true);
}

// 14. Claves de capítulo no canónicas ({"01": ...}) se rechazan en vez de guardarse de forma inaccesible.
resetStorage();
{
  const payload = JSON.stringify({ version: 1, chapterNotes: { genesis: { '01': 'nota con clave no canónica' } } });
  const result = validateProgressImport(payload, books);
  check('Rechaza claves de capítulo no canónicas como "01"', !result.valid && result.errors.includes('importErrorReference'));
}

// 15. El respaldo de una importación exitosa queda persistido en localStorage y sobrevive a un "reload"
// (simulado releyendo la clave desde cero, sin depender de ninguna variable de JS en memoria).
resetStorage();
{
  localStorage.setItem(COMPLETED_CHAPTERS_KEY, JSON.stringify({ genesis: [1] }));
  const payload = JSON.stringify({ version: 1, completedChapters: { genesis: [1, 2] } });
  const result = validateProgressImport(payload, books);
  const applied = applyProgressImport(result.fields);
  check('Una importación exitosa persiste su respaldo de forma durable', localStorage.getItem(IMPORT_BACKUP_KEY) !== null);
  const persisted = getPersistedImportBackup();
  check('El respaldo persistido se puede leer tras "recargar" (releerlo desde cero)',
    persisted?.backup.completedChapters === JSON.stringify({ genesis: [1] }));
  const restored = restoreProgressBackup(persisted.backup);
  check('Deshacer usando el respaldo persistido restaura el estado previo',
    restored === true && localStorage.getItem(COMPLETED_CHAPTERS_KEY) === JSON.stringify({ genesis: [1] }));
  check('Deshacer limpia el respaldo persistido tras aplicarse', getPersistedImportBackup() === null);
}

// 16. Si tanto la escritura como su intento de rollback fallan, se reporta atomic:false en vez de mentir.
// Necesita que al menos un campo se escriba con éxito antes del fallo, para que exista algo que revertir.
resetStorage();
{
  localStorage.setItem(READING_POSITION_KEY, JSON.stringify({ bookId: 'genesis', chapter: 1 }));
  const payload = JSON.stringify({
    version: 1,
    readingPosition: { bookId: 'mateo', chapter: 1 },
    completedChapters: { genesis: [1, 2] }
  });
  const result = validateProgressImport(payload, books);
  const originalSetItem = localStorage.setItem.bind(localStorage);
  let calls = 0;
  localStorage.setItem = (key, value) => {
    calls += 1;
    if (calls === 1) return originalSetItem(key, value); // primer campo se escribe con éxito
    throw new Error('Cuota de almacenamiento simulada llena, también para el rollback');
  };
  const applied = applyProgressImport(result.fields);
  localStorage.setItem = originalSetItem;
  check('Si el rollback también falla, no se declara atómico', applied.success === false && applied.atomic === false);
}

// 17. Si "Deshacer" falla al escribir, se reporta el fallo en vez de asumir éxito.
resetStorage();
{
  const backup = { completedChapters: JSON.stringify({ genesis: [1] }) };
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = () => { throw new Error('Cuota de almacenamiento simulada llena'); };
  const restored = restoreProgressBackup(backup);
  localStorage.setItem = originalSetItem;
  check('restoreProgressBackup reporta el fallo real en vez de asumir éxito', restored === false);
}

// 18. La normalización de RV1909 solo toca el primer token del versículo 1.
resetStorage();
{
  check('Normaliza el primer token completamente mayúsculo del versículo 1',
    normalizeRv1909Opening('EN el principio crió Dios.', 1) === 'en el principio crió Dios.');
  check('No modifica otros versículos', normalizeRv1909Opening('EN un versículo posterior.', 2) === 'EN un versículo posterior.');
  check('No modifica un segundo token mayúsculo', normalizeRv1909Opening('EN DIOS creó.', 1) === 'en DIOS creó.');
  check('No modifica números ni abreviaturas', normalizeRv1909Opening('1 JUAN.', 1) === '1 JUAN.' && normalizeRv1909Opening('JER. fue.', 1) === 'JER. fue.');
  check('No modifica texto ya normalizado', normalizeRv1909Opening('En el principio.', 1) === 'En el principio.');
}

// 19. La versión española persiste y no altera los catálogos en inglés o alemán.
resetStorage();
{
  setSpanishVersion('rv1909');
  check('La versión española se persiste como RV1909', getSpanishVersion() === 'rv1909' && localStorage.getItem(SPANISH_VERSION_KEY) === 'rv1909');
  const requested = [];
  const originalFetch = global.fetch;
  global.fetch = async (url) => { requested.push(url); return { ok: true, json: async () => ({ books }) }; };
  localStorage.setItem('horizonte55-language', 'es');
  await loadBooks();
  localStorage.setItem('horizonte55-language', 'en');
  await loadBooks();
  localStorage.setItem('horizonte55-language', 'de');
  await loadBooks();
  global.fetch = originalFetch;
  check('RV1909 se carga solo para español', requested[0].includes('content/books.json'));
  check('El catálogo inglés sigue sin depender de la versión española', requested[1].includes('content/books-en.json'));
  check('El catálogo alemán sigue sin depender de la versión española', requested[2].includes('content/books-de.json'));
  setSpanishVersion('onbv');
  check('ONBV queda como versión española por defecto', getSpanishVersion() === 'onbv');
}

if (failures > 0) {
  console.error(`\n${failures} prueba(s) de comportamiento fallaron.`);
  process.exit(1);
}
console.log('\n✅ Todas las pruebas de comportamiento pasaron.');
