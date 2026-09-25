"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { catalogUrl, chapterPath, EDITIONS, t, type Edition, type Lang } from "@/lib/i18n";
import { preferredEdition } from "@/lib/storage";
import { SearchIcon } from "@/components/Icons";

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

  // Resalta la palabra buscada dentro del versículo (sin tener en cuenta tildes ni mayúsculas).
  function highlight(value: string) {
    if (!term || term.length < 2 || /\d/.test(term)) return value;
    const plain = normalize(value);
    const parts: ReactNode[] = [];
    let from = 0;
    let at = plain.indexOf(term);
    while (at !== -1 && parts.length < 20) {
      parts.push(value.slice(from, at), <mark key={at}>{value.slice(at, at + term.length)}</mark>);
      from = at + term.length;
      at = plain.indexOf(term, from);
    }
    parts.push(value.slice(from));
    return parts;
  }

  return (
    <section className="search-panel">
      <label className="search-field search-field-lg">
        <SearchIcon size={22} />
        <span className="sr-only">{text.searchLabel}</span>
        <input
          id="pageSearchInput"
          type="search"
          placeholder={text.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={!books && !error}
          autoFocus
        />
      </label>
      <p className="muted small search-edition">{edition ? `${text.searchingIn} ${EDITIONS[edition].label}` : ""}</p>
      <div id="pageSearchResults" className="search-results" aria-live="polite">
        {error && <div className="empty-state">{text.searchLoadError}</div>}
        {!books && !error && <p className="muted">{text.searchLoading}</p>}
        {books && term.length >= 2 && matches.length === 0 && <div className="empty-state">{text.noResults}</div>}
        {books && term.length < 2 && (
          <div className="search-suggestions">
            <p className="muted small">{text.searchTry}</p>
            <div className="chip-row">
              {text.searchExamples.split("|").map((example) => (
                <button key={example} type="button" className="chip" onClick={() => setQuery(example)}>{example}</button>
              ))}
            </div>
          </div>
        )}
        {edition && matches.length > 0 && (
          <>
            <p className="muted small">
              {shown >= matches.length
                ? `${matches.length} ${matches.length === 1 ? text.result : text.results}`
                : `${text.showing} ${shown} ${text.of} ${matches.length} ${text.results}`}
            </p>
            <ol className="result-list">
              {matches.slice(0, shown).map(({ book, chapter, verse }) => (
                <li key={`${book.id}-${chapter}-${verse.number}`}>
                  <Link className="result" href={`${chapterPath(edition, book.id, chapter)}#verse-${verse.number}`}>
                    <span className="result-ref">{book.title} {chapter}:{verse.number}</span>
                    <span className="result-text">{highlight(verse.text)}</span>
                  </Link>
                </li>
              ))}
            </ol>
            {shown < matches.length && (
              <button type="button" className="button button-outline" onClick={() => setShown((value) => value + PAGE_SIZE)}>
                {text.showMore}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
