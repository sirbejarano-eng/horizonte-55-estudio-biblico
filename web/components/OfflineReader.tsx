"use client";

import { useEffect, useState } from "react";
import { catalogUrl, chapterPath, EDITIONS, ROUTES, t, type Edition, type Lang } from "@/lib/i18n";
import { savePosition } from "@/lib/storage";
import { displayVerseText, type Verse } from "@/lib/verse";
import ChapterNotes from "@/components/ChapterNotes";

type Book = { id: string; title: string; chapters: { number: number; verses: Verse[] }[] };
type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "chapter"; edition: Edition; book: Book; chapter: number; verses: Verse[]; prev: string | null; next: string | null; prevLabel: string; nextLabel: string };

// El service worker entrega esta página cuando no hay conexión y el capítulo pedido no estaba
// guardado. Lee la dirección real (/leer/juan/3/, /en/read/…) y dibuja el capítulo a partir del
// catálogo guardado en el dispositivo, con el mismo marcado que la página normal.
export default function OfflineReader({ lang }: { lang: Lang }) {
  const text = t(lang);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const path = window.location.pathname;
    const edition = (Object.keys(EDITIONS) as Edition[]).find((e) => new RegExp(`^${EDITIONS[e].readBase}/[a-z0-9-]+/\\d+/?$`).test(path));
    if (!edition) return setState({ kind: "missing" });
    const [, bookId, chapterText] = path.match(/\/([a-z0-9-]+)\/(\d+)\/?$/)!;
    const chapter = Number(chapterText);
    fetch(catalogUrl(edition))
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { books: Book[] }) => {
        const flat = data.books.flatMap((book) => book.chapters.map((c) => ({ book, number: c.number })));
        const index = flat.findIndex((item) => item.book.id === bookId && item.number === chapter);
        if (index < 0) return setState({ kind: "missing" });
        const { book } = flat[index];
        const prev = flat[index - 1];
        const next = flat[index + 1];
        document.title = `${book.title} ${chapter} · Horizonte 55`;
        savePosition(book.id, chapter);
        setState({
          kind: "chapter", edition, book, chapter,
          verses: book.chapters.find((c) => c.number === chapter)!.verses,
          prev: prev ? chapterPath(edition, prev.book.id, prev.number) : null,
          next: next ? chapterPath(edition, next.book.id, next.number) : null,
          prevLabel: prev ? `${prev.book.title} ${prev.number}` : "",
          nextLabel: next ? `${next.book.title} ${next.number}` : "",
        });
      })
      .catch(() => setState({ kind: "missing" }));
  }, []);

  if (state.kind === "loading") return <p className="search-summary">{text.searchLoading}</p>;

  if (state.kind === "missing") {
    return (
      <section className="empty-state">
        <h1>{text.offlineTitle}</h1>
        <p>{text.offlineMissing}</p>
        {/* Enlace normal (no <Link>): sin conexión, la navegación completa pasa por el service worker. */}
        <a className="hero-button" href={ROUTES[lang].home}>{text.offlineBack}</a>
      </section>
    );
  }

  const { edition, book, chapter, verses } = state;
  return (
    <article className="chapter-card" aria-labelledby="chapter-title">
      <header className="chapter-header">
        <div className="chapter-header-main">
          <p className="eyebrow chapter-book-title">{book.title}</p>
          <h1 className="chapter-title" id="chapter-title">
            <span className="sr-only">{book.title} </span>{text.chapter} {chapter}
          </h1>
          <p className="book-progress-label">{text.offlineCopy} · {EDITIONS[edition].label}</p>
        </div>
      </header>
      <div className="verses">
        {verses.map((verse) => (
          <div className="verse" id={`verse-${verse.number}`} key={verse.number}>
            <span className="verse-number">{verse.number}</span>
            <div className="verse-content">
              <p className="verse-text">{displayVerseText(edition, verse)}</p>
            </div>
          </div>
        ))}
      </div>
      <ChapterNotes lang={lang} bookId={book.id} chapter={chapter} />
      <nav className="chapter-nav" aria-label={text.chapterNav}>
        {state.prev ? <a className="secondary-button" href={state.prev} rel="prev">← {state.prevLabel}</a> : <span />}
        {state.next ? <a className="secondary-button" href={state.next} rel="next">{state.nextLabel} →</a> : <span />}
      </nav>
    </article>
  );
}
