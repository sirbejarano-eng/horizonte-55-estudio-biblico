import fs from "node:fs";
import path from "node:path";
import { chapterPath, EDITIONS, type Edition } from "./i18n";

// Se lee en tiempo de compilación: el catálogo NO viaja al navegador; cada capítulo se convierte en
// su propia página HTML. La fuente es la misma que usa la versión actual (content/ en la raíz del repo).
export type Verse = { number: number; text: string };
export type Chapter = { number: number; verses: Verse[] };
export type Book = { id: string; title: string; chapters: Chapter[] };

// Los primeros 39 libros del catálogo forman el Antiguo Testamento (mismo criterio que library.js).
const OLD_TESTAMENT_COUNT = 39;

const cache = new Map<Edition, Book[]>();

export function getBooks(edition: Edition = "onbv"): Book[] {
  let books = cache.get(edition);
  if (!books) {
    const file = path.join(process.cwd(), "..", "content", EDITIONS[edition].file);
    const data = JSON.parse(fs.readFileSync(file, "utf8")) as { books: Book[] };
    if (!Array.isArray(data.books) || data.books.length !== 66) {
      throw new Error(`El catálogo ${EDITIONS[edition].file} debe contener 66 libros.`);
    }
    books = data.books;
    cache.set(edition, books);
  }
  return books;
}

export function getBook(edition: Edition, id: string) {
  return getBooks(edition).find((book) => book.id === id);
}

export function getTestaments(edition: Edition = "onbv") {
  const books = getBooks(edition);
  return { antiguo: books.slice(0, OLD_TESTAMENT_COUNT), nuevo: books.slice(OLD_TESTAMENT_COUNT) };
}

export function chapterHref(bookId: string, chapter: number, edition: Edition = "onbv") {
  return chapterPath(edition, bookId, chapter);
}

// Capítulo anterior y siguiente a través de toda la Biblia (Malaquías 4 → Mateo 1).
export function neighbours(edition: Edition, bookId: string, chapter: number) {
  const flat = getBooks(edition).flatMap((book) => book.chapters.map((c) => ({ book, chapter: c.number })));
  const index = flat.findIndex((item) => item.book.id === bookId && item.chapter === chapter);
  return { prev: index > 0 ? flat[index - 1] : null, next: index < flat.length - 1 ? flat[index + 1] : null };
}

export const totalChapters = (edition: Edition = "onbv") => getBooks(edition).reduce((sum, book) => sum + book.chapters.length, 0);

// Sin acceso a disco: también la usa la página sin conexión en el navegador.
export { displayVerseText } from "./verse";
