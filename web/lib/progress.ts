// Exportar e importar progreso: mismo formato de archivo (version: 1) y mismas reglas que js/core.js,
// así un archivo exportado desde la versión actual se puede importar aquí y al revés.
import { MAX_NOTE_LENGTH } from "./storage";

const KEYS = {
  readingPosition: "horizonte55-reading-position",
  completedChapters: "horizonte55-completed-chapters",
  chapterNotes: "horizonte55-chapter-notes",
  readingScale: "horizonte55-reading-scale",
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
  let scale = Number(localStorage.getItem(KEYS.readingScale));
  if (!(scale >= 0.9 && scale <= 1.3)) scale = 1;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    readingPosition: parse(localStorage.getItem(KEYS.readingPosition)),
    completedChapters: parse(localStorage.getItem(KEYS.completedChapters)),
    chapterNotes: parse(localStorage.getItem(KEYS.chapterNotes)),
    readingScale: scale,
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
  const completed = parse(localStorage.getItem(KEYS.completedChapters));
  const notes = parse(localStorage.getItem(KEYS.chapterNotes));
  return {
    readingPosition: localStorage.getItem(KEYS.readingPosition) !== null,
    completedChapters: isObject(completed) && Object.keys(completed).length > 0,
    chapterNotes: isObject(notes) && Object.keys(notes).length > 0,
    readingScale: false,
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

  if (errors.size) return { valid: false, errors: [...errors] };
  if (!Object.keys(fields).length) return { valid: false, errors: ["importNoChanges"] };
  return { valid: true, fields };
}

function writeField(field: Field, entry: FieldEntry) {
  if (entry.clear) localStorage.removeItem(KEYS[field]);
  else localStorage.setItem(KEYS[field], field === "readingScale" ? String(entry.value) : JSON.stringify(entry.value));
}

function restoreRaw(field: Field, previous: string | null | undefined) {
  if (previous == null) localStorage.removeItem(KEYS[field]);
  else localStorage.setItem(KEYS[field], previous);
}

// Todo o nada: si falla una escritura se revierte lo ya escrito. Guarda un respaldo para "Deshacer",
// también tras recargar la página.
export function applyProgressImport(fields: Fields): { success: true; backup: Backup } | { success: false; atomic: boolean } {
  const entries = Object.entries(fields) as [Field, FieldEntry][];
  const backup: Backup = {};
  for (const [field] of entries) backup[field] = localStorage.getItem(KEYS[field]);
  const written: Field[] = [];
  try {
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
    localStorage.setItem(IMPORT_BACKUP_KEY, JSON.stringify({ backup, createdAt: new Date().toISOString() }));
  } catch {
    /* sin respaldo duradero: "Deshacer" solo en esta sesión */
  }
  return { success: true, backup };
}

export function getPersistedImportBackup(): Backup | null {
  const saved = parse(localStorage.getItem(IMPORT_BACKUP_KEY));
  return isObject(saved) && isObject(saved.backup) ? (saved.backup as Backup) : null;
}

export function restoreProgressBackup(backup: Backup) {
  try {
    for (const [field, previous] of Object.entries(backup) as [Field, string | null][]) restoreRaw(field, previous);
    localStorage.removeItem(IMPORT_BACKUP_KEY);
    return true;
  } catch {
    return false;
  }
}
