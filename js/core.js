import { getLanguage } from './i18n.js?v=34';

export const READING_POSITION_KEY = 'horizonte55-reading-position';
export const COMPLETED_CHAPTERS_KEY = 'horizonte55-completed-chapters';
export const CHAPTER_NOTES_KEY = 'horizonte55-chapter-notes';
export const READING_SCALE_KEY = 'horizonte55-reading-scale';
// Versión bíblica en español elegida por el usuario, independiente del idioma de la interfaz.
export const SPANISH_VERSION_KEY = 'horizonte55-spanish-version';
// Respaldo persistente de la última importación aplicada, para poder deshacerla incluso tras recargar la página.
export const IMPORT_BACKUP_KEY = 'horizonte55-import-backup';
// Límite compartido por saveNote (al guardar) y validateProgressImport (al importar), para que toda
// nota guardable sea siempre reimportable: nunca se puede crear con la app un dato que luego se rechace.
export const MAX_NOTE_LENGTH = 20000;

// Súbelo cada vez que cambie el contenido de content/books*.json para invalidar la caché offline de ese catálogo.
export const CONTENT_VERSION = 1;

// "onbv" (Open Nueva Biblia Viva, contemporánea, CC BY-SA 4.0) es el valor por defecto para español;
// "rv1909" (Reina-Valera 1909, dominio público) es la alternativa histórica.
export function getSpanishVersion() {
  const version = localStorage.getItem(SPANISH_VERSION_KEY);
  return version === 'rv1909' ? 'rv1909' : 'onbv';
}
export function setSpanishVersion(version) {
  try { localStorage.setItem(SPANISH_VERSION_KEY, version === 'rv1909' ? 'rv1909' : 'onbv'); } catch (error) { /* local-only fallback */ }
}

function catalogFileFor(language) {
  if (language === 'en') return 'books-en.json';
  if (language === 'de') return 'books-de.json';
  return getSpanishVersion() === 'rv1909' ? 'books.json' : 'books-es-onbv.json';
}

// Recursos necesarios para que un idioma funcione sin conexión (catálogo, ícono, mapa y manifiesto).
export function getLanguageOfflineAssets(language) {
  return [
    `./content/${catalogFileFor(language)}?v=${CONTENT_VERSION}`,
    `./manifest-${language}.json`,
    `./assets/icon-${language}.png`,
    `./assets/mapa-${language}.png`
  ];
}

// Comprueba, sin usar la red, si los recursos de un idioma ya están guardados por el Service Worker.
export async function isLanguageOfflineReady(language) {
  if (!('caches' in window)) return false;
  const assets = getLanguageOfflineAssets(language);
  const results = await Promise.all(assets.map(async (url) => !!(await caches.match(url))));
  return results.every(Boolean);
}

// Pide explícitamente los recursos del idioma para que el Service Worker los guarde, y confirma el resultado real.
export async function ensureLanguageOfflineReady(language) {
  const assets = getLanguageOfflineAssets(language);
  await Promise.all(assets.map((url) => fetch(url).catch(() => null)));
  return isLanguageOfflineReady(language);
}

export async function loadBooks() {
  const language = getLanguage();
  const catalog = catalogFileFor(language);
  let response;
  try {
    response = await fetch(`./content/${catalog}?v=${CONTENT_VERSION}`);
  } catch (error) {
    throw new Error('loadErrorNetwork');
  }
  if (!response.ok) throw new Error('loadErrorNetwork');
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('loadErrorContent');
  }
  if (!Array.isArray(data.books) || !data.books.length) throw new Error('loadErrorContent');
  return data.books;
}

export function getReadingPosition(books) {
  try {
    const saved = JSON.parse(localStorage.getItem(READING_POSITION_KEY));
    const book = books.find((item) => item.id === saved?.bookId);
    const chapter = book?.chapters.find((item) => item.number === saved?.chapter);
    return book && chapter ? { bookId: book.id, chapter: chapter.number } : null;
  } catch (error) {
    return null;
  }
}

export function saveReadingPosition(bookId, chapter) {
  try { localStorage.setItem(READING_POSITION_KEY, JSON.stringify({ bookId, chapter })); } catch (error) { /* local-only fallback */ }
}

export function getCompletedChapters(books) {
  try {
    const saved = JSON.parse(localStorage.getItem(COMPLETED_CHAPTERS_KEY));
    const valid = {};
    books.forEach((book) => {
      const chapters = Array.isArray(saved?.[book.id]) ? saved[book.id].filter((number) => (
        Number.isInteger(number) && book.chapters.some((chapter) => chapter.number === number)
      )) : [];
      if (chapters.length) valid[book.id] = [...new Set(chapters)].sort((a, b) => a - b);
    });
    return valid;
  } catch (error) {
    return {};
  }
}

export function toggleCompleted(completed, bookId, chapter) {
  const previous = completed[bookId];
  const chapters = new Set(previous || []);
  if (chapters.has(chapter)) chapters.delete(chapter); else chapters.add(chapter);
  completed[bookId] = [...chapters].sort((a, b) => a - b);
  try {
    localStorage.setItem(COMPLETED_CHAPTERS_KEY, JSON.stringify(completed));
    return true;
  } catch (error) {
    completed[bookId] = previous;
    return false;
  }
}

export function getNotes(books) {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAPTER_NOTES_KEY));
    const notes = {};
    books.forEach((book) => book.chapters.forEach((chapter) => {
      const note = saved?.[book.id]?.[chapter.number];
      if (typeof note === 'string' && note) {
        if (!notes[book.id]) notes[book.id] = {};
        notes[book.id][chapter.number] = note;
      }
    }));
    return notes;
  } catch (error) {
    return {};
  }
}

export function saveNote(notes, bookId, chapter, value) {
  if (!notes[bookId]) notes[bookId] = {};
  const hadPrevious = Object.prototype.hasOwnProperty.call(notes[bookId], chapter);
  const previous = notes[bookId][chapter];
  const trimmedValue = value.length > MAX_NOTE_LENGTH ? value.slice(0, MAX_NOTE_LENGTH) : value;
  if (trimmedValue.trim()) notes[bookId][chapter] = trimmedValue; else delete notes[bookId][chapter];
  try {
    localStorage.setItem(CHAPTER_NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    if (hadPrevious) notes[bookId][chapter] = previous; else delete notes[bookId][chapter];
    return false;
  }
}

export function getReadingScale() {
  try {
    const scale = Number(localStorage.getItem(READING_SCALE_KEY));
    return scale >= 0.9 && scale <= 1.3 ? scale : 1;
  } catch (error) { return 1; }
}

export function saveReadingScale(scale) {
  try { localStorage.setItem(READING_SCALE_KEY, String(scale)); } catch (error) { /* local-only fallback */ }
}

export async function copyReference(reference) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(reference);
    return;
  }
  const input = document.createElement('textarea');
  input.value = reference;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

export function normalizeText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function normalizeRv1909Opening(text, verseNumber) {
  if (verseNumber !== 1) return text;
  return text.replace(/^(\S+)/u, (token) => {
    const letters = token.replace(/[^\p{L}]/gu, '');
    if (!letters || token.includes('.') || letters !== letters.toUpperCase() || letters === letters.toLowerCase()) return token;
    return token.toLocaleLowerCase('es-ES');
  });
}

// Escapa texto proveniente de los catálogos (verse.text, book.title) antes de insertarlo en innerHTML.
// Defensa en profundidad: hoy los catálogos son de confianza, pero si algún día se reemplazan por un
// archivo externo sin revisar, esto evita que una etiqueta incrustada en un versículo se ejecute.
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function navigateTo(bookId, chapter = 1, verse = null) {
  const hash = verse ? `#verse-${verse}` : '';
  window.location.href = `./lectura.html?book=${encodeURIComponent(bookId)}&chapter=${chapter}${hash}`;
}

export function findBook(books, bookId) { return books.find((book) => book.id === bookId) || books[0]; }
export function totalChapters(books) { return books.reduce((total, book) => total + book.chapters.length, 0); }
export function totalCompleted(books, completed) { return books.reduce((total, book) => total + (completed[book.id]?.length || 0), 0); }

function safeParseJson(value) {
  try { return value ? JSON.parse(value) : null; } catch (error) { return null; }
}

export function exportProgress() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    readingPosition: safeParseJson(localStorage.getItem(READING_POSITION_KEY)),
    completedChapters: safeParseJson(localStorage.getItem(COMPLETED_CHAPTERS_KEY)),
    chapterNotes: safeParseJson(localStorage.getItem(CHAPTER_NOTES_KEY)),
    readingScale: getReadingScale()
  };
}

function isValidCompletedChapters(value, books) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value).every(([bookId, chapters]) => {
      const book = books.find((item) => item.id === bookId);
      return book && Array.isArray(chapters)
        && chapters.every((number) => Number.isInteger(number) && book.chapters.some((chapter) => chapter.number === number));
    });
}

function isValidChapterNotes(value, books) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value).every(([bookId, chapters]) => {
      const book = books.find((item) => item.id === bookId);
      return book && chapters !== null && typeof chapters === 'object' && !Array.isArray(chapters)
        && Object.entries(chapters).every(([chapterNumber, note]) => (
          isCanonicalIntegerKey(chapterNumber)
          && book.chapters.some((chapter) => chapter.number === Number(chapterNumber))
          && typeof note === 'string' && note.length <= MAX_NOTE_LENGTH
        ));
    });
}

// Rechaza claves de capítulo no canónicas ("01", "1.0", " 1"): deben ser exactamente el número entero como texto,
// para que luego coincidan con la clave real que usa getNotes()/getCompletedChapters() al leer.
function isCanonicalIntegerKey(key) {
  const number = Number(key);
  return Number.isInteger(number) && String(number) === key;
}

// Tamaño máximo aceptado para un archivo de progreso importado (protege contra archivos absurdos o corruptos).
export const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024;

const PROGRESS_KEYS_BY_FIELD = {
  readingPosition: READING_POSITION_KEY,
  completedChapters: COMPLETED_CHAPTERS_KEY,
  chapterNotes: CHAPTER_NOTES_KEY,
  readingScale: READING_SCALE_KEY
};

// Devuelve qué tipos de progreso ya existen guardados en este dispositivo, para poder avisar antes de sobrescribir.
export function summarizeCurrentProgress() {
  const completed = safeParseJson(localStorage.getItem(COMPLETED_CHAPTERS_KEY));
  const notes = safeParseJson(localStorage.getItem(CHAPTER_NOTES_KEY));
  return {
    readingPosition: localStorage.getItem(READING_POSITION_KEY) !== null,
    completedChapters: !!completed && Object.keys(completed).length > 0,
    chapterNotes: !!notes && Object.keys(notes).length > 0
  };
}

// Valida un archivo de progreso completo antes de escribir nada.
// Un campo AUSENTE del JSON no se toca al importar. Un campo presente con valor `null` se interpreta
// como una limpieza explícita de ese dato. Un campo presente con cualquier otro valor debe cumplir su forma
// esperada o el archivo entero se rechaza (nunca se ignoran campos incorrectos en silencio).
export function validateProgressImport(raw, books) {
  const errors = [];
  if (typeof raw !== 'string' || !raw.trim()) { errors.push('importErrorInvalidFile'); return { valid: false, errors }; }
  if (raw.length > MAX_IMPORT_FILE_SIZE) { errors.push('importErrorTooLarge'); return { valid: false, errors }; }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    errors.push('importErrorInvalidJson');
    return { valid: false, errors };
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('importErrorInvalidFile');
    return { valid: false, errors };
  }
  if (data.version !== 1) { errors.push('importErrorVersion'); return { valid: false, errors }; }

  const fields = {};

  if ('readingPosition' in data) {
    const value = data.readingPosition;
    if (value === null) {
      fields.readingPosition = { clear: true };
    } else if (value && typeof value === 'object' && typeof value.bookId === 'string' && Number.isInteger(value.chapter)) {
      const book = books.find((item) => item.id === value.bookId);
      if (!book || !book.chapters.some((chapter) => chapter.number === value.chapter)) errors.push('importErrorReference');
      else fields.readingPosition = { clear: false, value: { bookId: value.bookId, chapter: value.chapter } };
    } else {
      errors.push('importErrorShape');
    }
  }

  if ('completedChapters' in data) {
    const value = data.completedChapters;
    if (value === null) {
      fields.completedChapters = { clear: true, count: 0 };
    } else if (isValidCompletedChapters(value, books)) {
      fields.completedChapters = { clear: false, value, count: Object.values(value).reduce((total, chapters) => total + chapters.length, 0) };
    } else {
      errors.push('importErrorReference');
    }
  }

  if ('chapterNotes' in data) {
    const value = data.chapterNotes;
    if (value === null) {
      fields.chapterNotes = { clear: true, count: 0 };
    } else if (isValidChapterNotes(value, books)) {
      fields.chapterNotes = { clear: false, value, count: Object.values(value).reduce((total, chapters) => total + Object.keys(chapters).length, 0) };
    } else {
      errors.push('importErrorReference');
    }
  }

  if ('readingScale' in data) {
    const value = data.readingScale;
    if (value === null) fields.readingScale = { clear: true };
    else if (typeof value === 'number' && value >= 0.9 && value <= 1.3) fields.readingScale = { clear: false, value };
    else errors.push('importErrorShape');
  }

  if (errors.length) return { valid: false, errors: [...new Set(errors)] };
  if (!Object.keys(fields).length) return { valid: false, errors: ['importNoChanges'] };
  return { valid: true, errors: [], fields };
}

function readField(field) {
  return localStorage.getItem(PROGRESS_KEYS_BY_FIELD[field]);
}

function writeField(field, entry) {
  const key = PROGRESS_KEYS_BY_FIELD[field];
  if (entry.clear) { localStorage.removeItem(key); return; }
  localStorage.setItem(key, field === 'readingScale' ? String(entry.value) : JSON.stringify(entry.value));
}

// Aplica una importación ya validada de forma atómica: si falla cualquier escritura, revierte todo
// lo ya escrito en este intento y no deja una importación parcial. Devuelve una copia de respaldo
// del estado previo para permitir deshacer manualmente incluso tras un éxito.
// El respaldo también se guarda de forma durable (IMPORT_BACKUP_KEY) para poder deshacer tras recargar la página.
// Si la escritura falla, se intenta revertir; si el propio rollback también falla, se reporta atomic:false
// en vez de afirmar una garantía que no se cumplió.
export function applyProgressImport(fields) {
  const backup = {};
  Object.keys(fields).forEach((field) => { backup[field] = readField(field); });
  const written = [];
  try {
    Object.entries(fields).forEach(([field, entry]) => {
      writeField(field, entry);
      written.push(field);
    });
  } catch (error) {
    let atomic = true;
    written.forEach((field) => {
      try {
        const previous = backup[field];
        const key = PROGRESS_KEYS_BY_FIELD[field];
        if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
      } catch (rollbackError) {
        atomic = false;
      }
    });
    return { success: false, atomic, backup: null };
  }
  persistImportBackup(backup);
  return { success: true, atomic: true, backup };
}

// Guarda una copia del respaldo en localStorage para que sobreviva a un reload. Best-effort: si falla,
// el "Deshacer" solo estará disponible en memoria durante la misma sesión de página.
function persistImportBackup(backup) {
  try {
    localStorage.setItem(IMPORT_BACKUP_KEY, JSON.stringify({ backup, createdAt: new Date().toISOString() }));
    return true;
  } catch (error) {
    return false;
  }
}

// Lee el respaldo persistido de la última importación, si existe (para mostrar "Deshacer" tras un reload).
export function getPersistedImportBackup() {
  const saved = safeParseJson(localStorage.getItem(IMPORT_BACKUP_KEY));
  return saved && typeof saved === 'object' && saved.backup ? saved : null;
}

export function clearPersistedImportBackup() {
  try { localStorage.removeItem(IMPORT_BACKUP_KEY); } catch (error) { /* best effort */ }
}

// Restaura manualmente un respaldo devuelto por applyProgressImport (botón "Deshacer").
// Devuelve si la restauración se completó; no asume éxito.
export function restoreProgressBackup(backup) {
  try {
    Object.entries(backup).forEach(([field, previous]) => {
      const key = PROGRESS_KEYS_BY_FIELD[field];
      if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    });
    clearPersistedImportBackup();
    return true;
  } catch (error) {
    return false;
  }
}

