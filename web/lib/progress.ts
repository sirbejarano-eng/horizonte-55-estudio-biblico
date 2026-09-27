// Exportar e importar progreso: mismo formato de archivo (version: 1) y mismas reglas que js/core.js,
// así un archivo exportado desde la versión actual se puede importar aquí y al revés.
import { MAX_NOTE_LENGTH } from "./storage";
import { localGetOrThrow, localRemoveOrThrow, localSetOrThrow } from "./local-storage";
import { isValidPlans, PLANS_EVENT, READING_PLANS_KEY } from "./plans";
import { countMarks, isValidMarks, isValidVerseNotes, MARKS_EVENT, VERSE_MARKS_KEY, VERSE_NOTES_KEY, type MarksStore } from "./marks";

const KEYS = {
  readingPosition: "horizonte55-reading-position",
  completedChapters: "horizonte55-completed-chapters",
  chapterNotes: "horizonte55-chapter-notes",
  readingScale: "horizonte55-reading-scale",
  // Fase 4: marcas y notas por versículo (campos opcionales; los archivos antiguos siguen valiendo).
  verseMarks: VERSE_MARKS_KEY,
  verseNotes: VERSE_NOTES_KEY,
  readingPlans: READING_PLANS_KEY,
} as const;
const IMPORT_BACKUP_KEY = "horizonte55-import-backup";
export const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024;

export type Field = keyof typeof KEYS;
export type FieldEntry = { clear: boolean; value?: unknown; count?: number };
export type Fields = Partial<Record<Field, FieldEntry>>;
export type Backup = Partial<Record<Field, string | null>>;
export type ImportError =
  | "importErrorInvalidFile" | "importErrorTooLarge" | "importErrorInvalidJson" | "importErrorVersion"
  | "importErrorShape" | "importErrorReference" | "importNoChanges";

// Número de capítulos por libro (bookId → n). Todas las ediciones tienen los mismos.
export type ChapterCounts = Record<string, number>;

const parse = (value: string | null) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const hasChapter = (counts: ChapterCounts, bookId: string, n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= (counts[bookId] ?? 0);
// "01", "1.0" o " 1" no son claves válidas: deben coincidir con la clave que usa la app al leer.
const isCanonicalKey = (key: string) => Number.isInteger(Number(key)) && String(Number(key)) === key;

export function exportProgress() {
  let scale = Number(localGetOrThrow(KEYS.readingScale));
  if (!(scale >= 0.9 && scale <= 1.3)) scale = 1;
  const marks = parse(localGetOrThrow(KEYS.verseMarks));
  const verseNotes = parse(localGetOrThrow(KEYS.verseNotes));
  const readingPlans = parse(localGetOrThrow(KEYS.readingPlans));
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    readingPosition: parse(localGetOrThrow(KEYS.readingPosition)),
    completedChapters: parse(localGetOrThrow(KEYS.completedChapters)),
    chapterNotes: parse(localGetOrThrow(KEYS.chapterNotes)),
    readingScale: scale,
    // Solo si hay algo: un campo con null borraría las marcas del dispositivo que importe el archivo.
    ...(marks ? { verseMarks: marks } : {}),
    ...(verseNotes ? { verseNotes } : {}),
    ...(readingPlans ? { readingPlans } : {}),
  };
}

export function downloadProgress() {
  const blob = new Blob([JSON.stringify(exportProgress(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `horizonte55-progreso-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Qué hay ya guardado, para avisar antes de sobrescribir.
export function summarizeCurrentProgress() {
  const completed = parse(localGetOrThrow(KEYS.completedChapters));
  const notes = parse(localGetOrThrow(KEYS.chapterNotes));
  return {
    readingPosition: localGetOrThrow(KEYS.readingPosition) !== null,
    completedChapters: isObject(completed) && Object.keys(completed).length > 0,
    chapterNotes: isObject(notes) && Object.keys(notes).length > 0,
    readingScale: false,
    verseMarks: isObject(parse(localGetOrThrow(KEYS.verseMarks))),
    verseNotes: isObject(parse(localGetOrThrow(KEYS.verseNotes))),
    readingPlans: isObject(parse(localGetOrThrow(KEYS.readingPlans))),
  };
}

// Valida el archivo completo antes de escribir nada. Campo ausente: no se toca. Campo con null:
// se borra ese dato. Cualquier otro valor debe tener la forma esperada o se rechaza el archivo entero.
export function validateProgressImport(raw: string, counts: ChapterCounts): { valid: true; fields: Fields } | { valid: false; errors: ImportError[] } {
  if (!raw.trim()) return { valid: false, errors: ["importErrorInvalidFile"] };
  if (raw.length > MAX_IMPORT_FILE_SIZE) return { valid: false, errors: ["importErrorTooLarge"] };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ["importErrorInvalidJson"] };
  }
  if (!isObject(data)) return { valid: false, errors: ["importErrorInvalidFile"] };
  if (data.version !== 1) return { valid: false, errors: ["importErrorVersion"] };

  const errors = new Set<ImportError>();
  const fields: Fields = {};

  if ("readingPosition" in data) {
    const value = data.readingPosition;
    if (value === null) fields.readingPosition = { clear: true };
    else if (isObject(value) && typeof value.bookId === "string" && Number.isInteger(value.chapter)) {
      if (hasChapter(counts, value.bookId, value.chapter)) fields.readingPosition = { clear: false, value: { bookId: value.bookId, chapter: value.chapter } };
      else errors.add("importErrorReference");
    } else errors.add("importErrorShape");
  }

  if ("completedChapters" in data) {
    const value = data.completedChapters;
    if (value === null) fields.completedChapters = { clear: true, count: 0 };
    else if (isObject(value) && Object.entries(value).every(([bookId, list]) => Array.isArray(list) && list.every((n) => hasChapter(counts, bookId, n)))) {
      fields.completedChapters = { clear: false, value, count: Object.values(value).reduce((sum: number, list) => sum + (list as number[]).length, 0) };
    } else errors.add("importErrorReference");
  }

  if ("chapterNotes" in data) {
    const value = data.chapterNotes;
    if (value === null) fields.chapterNotes = { clear: true, count: 0 };
    else if (
      isObject(value) &&
      Object.entries(value).every(([bookId, chapters]) =>
        isObject(chapters) &&
        Object.entries(chapters).every(([key, note]) => isCanonicalKey(key) && hasChapter(counts, bookId, Number(key)) && typeof note === "string" && note.length <= MAX_NOTE_LENGTH),
      )
    ) {
      fields.chapterNotes = { clear: false, value, count: Object.values(value).reduce((sum: number, chapters) => sum + Object.keys(chapters as object).length, 0) };
    } else errors.add("importErrorReference");
  }

  if ("readingScale" in data) {
    const value = data.readingScale;
    if (value === null) fields.readingScale = { clear: true };
    else if (typeof value === "number" && value >= 0.9 && value <= 1.3) fields.readingScale = { clear: false, value };
    else errors.add("importErrorShape");
  }

  const exists = (bookId: string, chapter: number) => hasChapter(counts, bookId, chapter);

  if ("verseMarks" in data) {
    const value = data.verseMarks;
    if (value === null) fields.verseMarks = { clear: true, count: 0 };
    else if (isValidMarks(value, exists)) fields.verseMarks = { clear: false, value, count: countMarks(value as MarksStore).total };
    else errors.add("importErrorReference");
  }

  if ("verseNotes" in data) {
    const value = data.verseNotes;
    if (value === null) fields.verseNotes = { clear: true, count: 0 };
    else if (isValidVerseNotes(value, exists)) fields.verseNotes = { clear: false, value, count: Object.keys(value).length };
    else errors.add("importErrorReference");
  }

  if ("readingPlans" in data) {
    const value = data.readingPlans;
    if (value === null) fields.readingPlans = { clear: true, count: 0 };
    else if (isValidPlans(value)) fields.readingPlans = { clear: false, value, count: Object.keys(value).length };
    else errors.add("importErrorShape");
  }

  if (errors.size) return { valid: false, errors: [...errors] };
  if (!Object.keys(fields).length) return { valid: false, errors: ["importNoChanges"] };
  return { valid: true, fields };
}

function writeField(field: Field, entry: FieldEntry) {
  if (entry.clear) localRemoveOrThrow(KEYS[field]);
  else localSetOrThrow(KEYS[field], field === "readingScale" ? String(entry.value) : JSON.stringify(entry.value));
}

function restoreRaw(field: Field, previous: string | null | undefined) {
  if (previous == null) localRemoveOrThrow(KEYS[field]);
  else localSetOrThrow(KEYS[field], previous);
}

// Todo o nada: si falla una escritura se revierte lo ya escrito. Guarda un respaldo para "Deshacer",
// también tras recargar la página.
export function applyProgressImport(fields: Fields): { success: true; backup: Backup } | { success: false; atomic: boolean } {
  const entries = Object.entries(fields) as [Field, FieldEntry][];
  const backup: Backup = {};
  const written: Field[] = [];
  try {
    for (const [field] of entries) backup[field] = localGetOrThrow(KEYS[field]);
    for (const [field, entry] of entries) {
      writeField(field, entry);
      written.push(field);
    }
  } catch {
    let atomic = true;
    for (const field of written) {
      try {
        restoreRaw(field, backup[field]);
      } catch {
        atomic = false;
      }
    }
    return { success: false, atomic };
  }
  try {
    localSetOrThrow(IMPORT_BACKUP_KEY, JSON.stringify({ backup, createdAt: new Date().toISOString() }));
  } catch {
    /* sin respaldo duradero: "Deshacer" solo en esta sesión */
  }
  window.dispatchEvent(new Event(MARKS_EVENT));
  window.dispatchEvent(new Event(PLANS_EVENT));
  return { success: true, backup };
}

export function getPersistedImportBackup(): Backup | null {
  try {
    const saved = parse(localGetOrThrow(IMPORT_BACKUP_KEY));
    return isObject(saved) && isObject(saved.backup) ? (saved.backup as Backup) : null;
  } catch {
    return null;
  }
}

export function restoreProgressBackup(backup: Backup) {
  try {
    for (const [field, previous] of Object.entries(backup) as [Field, string | null][]) restoreRaw(field, previous);
    localRemoveOrThrow(IMPORT_BACKUP_KEY);
    window.dispatchEvent(new Event(MARKS_EVENT));
    window.dispatchEvent(new Event(PLANS_EVENT));
    return true;
  } catch {
    return false;
  }
}
