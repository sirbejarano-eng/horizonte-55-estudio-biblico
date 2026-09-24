import fs from "node:fs";
import path from "node:path";

// Se lee en tiempo de compilación: el catálogo NO viaja al navegador; cada capítulo se convierte en
// su propia página HTML. La fuente es la misma que usa la versión actual (content/ en la raíz del repo).
export type Verse = { number: number; text: string };
export type Chapter = { number: number; verses: Verse[] };
export type Book = { id: string; title: string; chapters: Chapter[] };

const CATALOG = path.join(process.cwd(), "..", "content", "books-es-onbv.json");
// Los primeros 39 libros del catálogo forman el Antiguo Testamento (mismo criterio que library.js).
const OLD_TESTAMENT_COUNT = 39;

let cache: Book[] | null = null;

export function getBooks(): Book[] {
  if (!cache) {
    const data = JSON.parse(fs.readFileSync(CATALOG, "utf8")) as { books: Book[] };
    if (!Array.isArray(data.books) || data.books.length !== 66) {
      throw new Error("El catálogo ONBV debe contener 66 libros.");
    }
    cache = data.books;
  }
  return cache;
}

export function getBook(id: string) {
  return getBooks().find((book) => book.id === id);
}

export function getTestaments() {
  const books = getBooks();
  return {
    antiguo: books.slice(0, OLD_TESTAMENT_COUNT),
    nuevo: books.slice(OLD_TESTAMENT_COUNT),
  };
}

export function chapterHref(bookId: string, chapter: number) {
  return `/leer/${bookId}/${chapter}/`;
}

// Capítulo anterior y siguiente a través de toda la Biblia (Malaquías 4 → Mateo 1).
export function neighbours(bookId: string, chapter: number) {
  const flat = getBooks().flatMap((book) => book.chapters.map((c) => ({ book, chapter: c.number })));
  const index = flat.findIndex((item) => item.book.id === bookId && item.chapter === chapter);
  return { prev: index > 0 ? flat[index - 1] : null, next: index < flat.length - 1 ? flat[index + 1] : null };
}

export const totalChapters = () => getBooks().reduce((sum, book) => sum + book.chapters.length, 0);
