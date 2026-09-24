// Mismas claves y formatos que js/core.js de la versión actual: quien ya usa la web conserva
// su posición de lectura, capítulos completados y tamaño de letra al pasar a esta versión.
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
