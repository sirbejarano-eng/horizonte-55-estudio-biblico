"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { catalogUrl, chapterPath, EDITIONS, t, type Edition, type Lang } from "@/lib/i18n";
import { preferredEdition } from "@/lib/storage";

type Verse = { number: number; text: string };
type Book = { id: string; title: string; chapters: { number: number; verses: Verse[] }[] };
type Match = { book: Book; chapter: number; verse: Verse };

const PAGE_SIZE = 20;
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// La búsqueda ocurre en el navegador: el catálogo se descarga una vez (y el navegador lo guarda en caché)
// y ninguna consulta sale del dispositivo. Mismo comportamiento que buscar.html.
export default function BibleSearch({ lang }: { lang: Lang }) {
  const text = t(lang);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  // En español se busca en la versión elegida (ONBV o RV1909).
  useEffect(() => setEdition(preferredEdition(lang)), [lang]);

  useEffect(() => {
    if (!edition) return;
    fetch(catalogUrl(edition))
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { books: Book[] }) => setBooks(data.books))
      .catch(() => setError(true));
  }, [edition]);

  // Pequeña espera para no recalcular en cada tecla sobre 31.000 versículos.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(normalize(query.trim()));
      setShown(PAGE_SIZE);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Índice normalizado una sola vez tras la descarga: cada búsqueda solo compara textos ya preparados.
  const index = useMemo(() => {
    if (!books) return [];
    return books.flatMap((book) => {
      const title = normalize(book.title);
      return book.chapters.flatMap((chapter) =>
        chapter.verses.map((verse) => ({ book, title, chapter: chapter.number, verse, text: normalize(verse.text) })),
      );
    });
  }, [books]);

  const matches = useMemo<Match[]>(() => {
    if (!books || term.length < 2) return [];
    const reference = term.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
    const refTitle = reference?.[1].trim();
    const refBook = refTitle ? books.find((book) => normalize(book.title) === refTitle) : undefined;
    if (refBook && reference) {
      return index.filter(
        (item) => item.book.id === refBook.id && item.chapter === Number(reference[2]) && (!reference[3] || item.verse.number === Number(reference[3])),
      );
    }
    return index.filter((item) => item.text.includes(term) || item.title.includes(term));
  }, [books, index, term]);

  return (
    <section className="search-page-panel">
      <label className="search-label" htmlFor="pageSearchInput">{text.searchLabel}</label>
      <input
        id="pageSearchInput"
        type="search"
        placeholder={text.searchPlaceholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={!books && !error}
      />
      {edition && <p className="search-summary">{EDITIONS[edition].label}</p>}
      <div id="pageSearchResults" className="search-results" aria-live="polite">
        {error && <div className="empty-state">{text.searchLoadError}</div>}
        {!books && !error && <p className="search-summary">{text.searchLoading}</p>}
        {books && term.length >= 2 && matches.length === 0 && <div className="empty-state">{text.noResults}</div>}
        {edition && matches.length > 0 && (
          <>
            <p className="search-summary">
              {shown >= matches.length
                ? `${matches.length} ${matches.length === 1 ? text.result : text.results}`
                : `${text.showing} ${shown} ${text.of} ${matches.length} ${text.results}`}
            </p>
            <div className="search-results-list">
              {matches.slice(0, shown).map(({ book, chapter, verse }) => (
                <Link key={`${book.id}-${chapter}-${verse.number}`} className="result-item" href={`${chapterPath(edition, book.id, chapter)}#verse-${verse.number}`}>
                  <span className="result-book">{book.title} {chapter}:{verse.number}</span>
                  <p className="result-text">{verse.text}</p>
                </Link>
              ))}
            </div>
            {shown < matches.length && (
              <button type="button" className="secondary-button" onClick={() => setShown((value) => value + PAGE_SIZE)}>
                {text.showMore}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
