// Marcas de lectura (fase 4): resaltado en colores, marcadores y notas por versículo.
// Todo se guarda solo en este dispositivo (localStorage), sin cuentas. Como las notas por capítulo,
// no dependen del idioma: la numeración de versículos es la misma en las cuatro ediciones, así que
// un resaltado de Juan 3:16 aparece también en John 3:16 y Johannes 3:16.
//
// Cada marca guarda un fragmento corto del versículo ("s") en la edición en que se hizo, para poder
// listarla en "Mis marcas" sin descargar la Biblia entera.

import { localGet, localRemove, localSet } from "./local-storage";

export const VERSE_MARKS_KEY = "horizonte55-verse-marks";
export const VERSE_NOTES_KEY = "horizonte55-verse-notes";
export const MARKS_EVENT = "h55-marks-changed";
export const MAX_VERSE_NOTE_LENGTH = 5000;
export const MAX_SNIPPET_LENGTH = 220;

export const MARK_COLORS = ["gold", "green", "blue", "rose"] as const;
export type MarkColor = (typeof MARK_COLORS)[number];

// { libro: { capítulo: { versículo: marca } } } — claves de capítulo y versículo en texto ("3", "16").
export type VerseMark = { c?: MarkColor; b?: 1; s?: string; at: number };
export type MarksStore = Record<string, Record<string, Record<string, VerseMark>>>;

// Notas: clave "libro.capítulo.desde" (una nota por pasaje que empieza en ese versículo).
export type VerseNote = { book: string; chapter: number; from: number; to: number; text: string; s?: string; at: number };
export type NotesStore = Record<string, VerseNote>;

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

function read(key: string): unknown {
  const result = localGet(key);
  if (!result.ok || !result.value) return null;
  try {
    return JSON.parse(result.value);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  const result = isObject(value) && !Object.keys(value).length
    ? localRemove(key)
    : localSet(key, JSON.stringify(value));
  if (!result.ok) return false;
  window.dispatchEvent(new Event(MARKS_EVENT));
  return true;
}

export const snippet = (text: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > MAX_SNIPPET_LENGTH ? `${clean.slice(0, MAX_SNIPPET_LENGTH - 1).trimEnd()}…` : clean;
};

export const noteId = (book: string, chapter: number, from: number) => `${book}.${chapter}.${from}`;

// ---------- Resaltado y marcadores ----------

export function getMarks(): MarksStore {
  const saved = read(VERSE_MARKS_KEY);
  return isObject(saved) ? (saved as MarksStore) : {};
}

export function getChapterMarks(book: string, chapter: number): Record<string, VerseMark> {
  const chapterMarks = getMarks()[book]?.[String(chapter)];
  return isObject(chapterMarks) ? chapterMarks : {};
}

type Change = (mark: VerseMark) => VerseMark;

function updateVerses(book: string, chapter: number, verses: { n: number; text: string }[], change: Change) {
  const store = getMarks();
  const bookMarks = { ...(store[book] ?? {}) };
  const chapterMarks = { ...(bookMarks[String(chapter)] ?? {}) };
  for (const { n, text } of verses) {
    const next = change({ ...(chapterMarks[String(n)] ?? { at: 0 }) });
    if (!next.c && !next.b) delete chapterMarks[String(n)];
    else chapterMarks[String(n)] = { ...next, s: snippet(text), at: Date.now() };
  }
  if (Object.keys(chapterMarks).length) bookMarks[String(chapter)] = chapterMarks;
  else delete bookMarks[String(chapter)];
  if (Object.keys(bookMarks).length) store[book] = bookMarks;
  else delete store[book];
  return write(VERSE_MARKS_KEY, store);
}

// color null = quitar el resaltado.
export function setHighlight(book: string, chapter: number, verses: { n: number; text: string }[], color: MarkColor | null) {
  return updateVerses(book, chapter, verses, (mark) => {
    if (color) mark.c = color;
    else delete mark.c;
    return mark;
  });
}

export function setBookmark(book: string, chapter: number, verses: { n: number; text: string }[], on: boolean) {
  return updateVerses(book, chapter, verses, (mark) => {
    if (on) mark.b = 1;
    else delete mark.b;
    return mark;
  });
}

export function removeMark(book: string, chapter: number, verse: number) {
  return updateVerses(book, chapter, [{ n: verse, text: "" }], () => ({ at: 0 }));
}

// ---------- Notas por versículo ----------

export function getVerseNotes(): NotesStore {
  const saved = read(VERSE_NOTES_KEY);
  return isObject(saved) ? (saved as NotesStore) : {};
}

export function getChapterVerseNotes(book: string, chapter: number): VerseNote[] {
  return Object.values(getVerseNotes())
    .filter((note) => note.book === book && note.chapter === chapter)
    .sort((a, b) => a.from - b.from);
}

// Texto vacío = borrar la nota.
export function saveVerseNote(note: Omit<VerseNote, "at">) {
  const store = getVerseNotes();
  const id = noteId(note.book, note.chapter, note.from);
  const text = note.text.slice(0, MAX_VERSE_NOTE_LENGTH);
  if (text.trim()) store[id] = { ...note, text, s: note.s ? snippet(note.s) : undefined, at: Date.now() };
  else delete store[id];
  return write(VERSE_NOTES_KEY, store);
}

export function deleteVerseNote(id: string) {
  const store = getVerseNotes();
  delete store[id];
  return write(VERSE_NOTES_KEY, store);
}

// ---------- Recuentos y validación (copia de seguridad) ----------

export function countMarks(store: MarksStore = getMarks()) {
  let highlights = 0;
  let bookmarks = 0;
  for (const chapters of Object.values(store)) {
    for (const verses of Object.values(chapters)) {
      for (const mark of Object.values(verses)) {
        if (mark.c) highlights++;
        if (mark.b) bookmarks++;
      }
    }
  }
  return { highlights, bookmarks, total: highlights + bookmarks };
}

const canonical = (key: string) => Number.isInteger(Number(key)) && Number(key) >= 1 && String(Number(key)) === key;

// Comprueba la forma de un archivo importado. hasChapter decide si el libro/capítulo existe.
export function isValidMarks(value: unknown, hasChapter: (book: string, chapter: number) => boolean): value is MarksStore {
  if (!isObject(value)) return false;
  return Object.entries(value).every(([book, chapters]) =>
    isObject(chapters) &&
    Object.entries(chapters).every(([chapter, verses]) =>
      canonical(chapter) && hasChapter(book, Number(chapter)) && isObject(verses) &&
      Object.entries(verses).every(([verse, mark]) =>
        canonical(verse) && Number(verse) <= 200 && isObject(mark) &&
        (mark.c === undefined || MARK_COLORS.includes(mark.c as MarkColor)) &&
        (mark.b === undefined || mark.b === 1) &&
        (mark.s === undefined || (typeof mark.s === "string" && mark.s.length <= MAX_SNIPPET_LENGTH)) &&
        (typeof mark.at === "number") && (mark.c !== undefined || mark.b !== undefined),
      ),
    ),
  );
}

export function isValidVerseNotes(value: unknown, hasChapter: (book: string, chapter: number) => boolean): value is NotesStore {
  if (!isObject(value)) return false;
  return Object.entries(value).every(([id, note]) =>
    isObject(note) &&
    typeof note.book === "string" && Number.isInteger(note.chapter) && hasChapter(note.book, note.chapter as number) &&
    Number.isInteger(note.from) && Number.isInteger(note.to) && (note.from as number) >= 1 && (note.to as number) >= (note.from as number) && (note.to as number) <= 200 &&
    id === noteId(note.book, note.chapter as number, note.from as number) &&
    typeof note.text === "string" && note.text.trim().length > 0 && note.text.length <= MAX_VERSE_NOTE_LENGTH &&
    (note.s === undefined || (typeof note.s === "string" && note.s.length <= MAX_SNIPPET_LENGTH)) &&
    typeof note.at === "number",
  );
}
