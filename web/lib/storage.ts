// Mismas claves y formatos que js/core.js de la versión actual: quien ya usa la web conserva
// su posición de lectura, capítulos completados y tamaño de letra al pasar a esta versión.
import { LANGUAGE_KEY, SPANISH_VERSION_KEY, type Edition, type Lang } from "./i18n";

export const READING_POSITION_KEY = "horizonte55-reading-position";
export const COMPLETED_CHAPTERS_KEY = "horizonte55-completed-chapters";
export const READING_SCALE_KEY = "horizonte55-reading-scale";

type Completed = Record<string, number[]>;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    return true;
  } catch {
    return false; // modo privado o almacenamiento lleno: la lectura sigue funcionando
  }
}

export function getPosition(): { bookId: string; chapter: number } | null {
  const saved = read<{ bookId?: unknown; chapter?: unknown }>(READING_POSITION_KEY);
  return typeof saved?.bookId === "string" && Number.isInteger(saved.chapter)
    ? { bookId: saved.bookId, chapter: saved.chapter as number }
    : null;
}

export function savePosition(bookId: string, chapter: number) {
  write(READING_POSITION_KEY, { bookId, chapter });
}

export function getCompleted(): Completed {
  const saved = read<Completed>(COMPLETED_CHAPTERS_KEY);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const clean: Completed = {};
  for (const [bookId, chapters] of Object.entries(saved)) {
    if (Array.isArray(chapters)) clean[bookId] = chapters.filter((n) => Number.isInteger(n));
  }
  return clean;
}

export function toggleCompleted(bookId: string, chapter: number) {
  const completed = getCompleted();
  const set = new Set(completed[bookId] ?? []);
  if (set.has(chapter)) set.delete(chapter);
  else set.add(chapter);
  completed[bookId] = [...set].sort((a, b) => a - b);
  return write(COMPLETED_CHAPTERS_KEY, completed) ? completed : null;
}

export function getScale() {
  try {
    const scale = Number(localStorage.getItem(READING_SCALE_KEY));
    return scale >= 0.9 && scale <= 1.3 ? scale : 1;
  } catch {
    return 1;
  }
}

export function saveScale(scale: number) {
  write(READING_SCALE_KEY, String(scale));
}

// Notas por capítulo: mismo formato que la versión actual ({ libro: { capítulo: texto } }).
export const CHAPTER_NOTES_KEY = "horizonte55-chapter-notes";
export const MAX_NOTE_LENGTH = 20000;

type Notes = Record<string, Record<string, string>>;

function getAllNotes(): Notes {
  const saved = read<Notes>(CHAPTER_NOTES_KEY);
  return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
}

export function getNote(bookId: string, chapter: number) {
  const note = getAllNotes()[bookId]?.[chapter];
  return typeof note === "string" ? note : "";
}

export function saveNote(bookId: string, chapter: number, value: string) {
  const notes = getAllNotes();
  const text = value.slice(0, MAX_NOTE_LENGTH);
  notes[bookId] = { ...(notes[bookId] ?? {}) };
  if (text.trim()) notes[bookId][chapter] = text;
  else delete notes[bookId][chapter];
  return write(CHAPTER_NOTES_KEY, notes);
}

// Idioma y versión preferidos (mismas claves y valores que la versión actual).
export function getSavedLanguage(): Lang | null {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY);
    return value === "es" || value === "en" || value === "de" ? value : null;
  } catch {
    return null;
  }
}

export function saveLanguage(lang: Lang) {
  write(LANGUAGE_KEY, lang);
}

export function getSpanishVersion(): "onbv" | "rv1909" {
  try {
    return localStorage.getItem(SPANISH_VERSION_KEY) === "rv1909" ? "rv1909" : "onbv";
  } catch {
    return "onbv";
  }
}

export function saveSpanishVersion(version: "onbv" | "rv1909") {
  write(SPANISH_VERSION_KEY, version);
}

// Edición que corresponde a un idioma según la preferencia guardada (en español: ONBV o RV1909).
export function preferredEdition(lang: Lang): Edition {
  return lang === "es" ? getSpanishVersion() : lang;
}

// Copia al portapapeles con alternativa para navegadores sin la API moderna.
export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}
