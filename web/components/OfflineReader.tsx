"use client";

import { useEffect, useState } from "react";
import { catalogUrl, chapterPath, EDITIONS, ROUTES, t, type Edition, type Lang } from "@/lib/i18n";
import { savePosition } from "@/lib/storage";
import { displayVerseText, type Verse } from "@/lib/verse";
import ChapterNotes from "@/components/ChapterNotes";
import { OfflineIcon } from "@/components/Icons";

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

  if (state.kind === "loading") return <div className="container page"><p className="muted">{text.searchLoading}</p></div>;

  if (state.kind === "missing") {
    return (
      <div className="container page page-narrow">
        <section className="empty-state empty-state-lg">
          <span className="feature-icon"><OfflineIcon /></span>
          <h1 className="h2">{text.offlineTitle}</h1>
          <p className="muted">{text.offlineMissing}</p>
          {/* Enlace normal (no <Link>): sin conexión, la navegación completa pasa por el service worker. */}
          <a className="button button-primary" href={ROUTES[lang].home}>{text.offlineBack}</a>
        </section>
      </div>
    );
  }

  const { edition, book, chapter, verses } = state;
  return (
    <div className="container reader-layout reader-layout-single">
      <article className="chapter" aria-labelledby="chapter-title">
        <header className="chapter-head">
          <p className="eyebrow chapter-book">{book.title}</p>
          <h1 className="chapter-title" id="chapter-title">
            <span className="sr-only">{book.title} </span>{text.chapter} {chapter}
          </h1>
          <p className="chapter-meta"><OfflineIcon size={16} /> {text.offlineCopy} · {EDITIONS[edition].label}</p>
        </header>
        <div className="scripture">
          {verses.map((verse) => (
            <p className="v" id={`verse-${verse.number}`} key={verse.number}>
              <sup>{verse.number}</sup>
              {displayVerseText(edition, verse)}
            </p>
          ))}
        </div>
        <nav className="chapter-pager" aria-label={text.chapterNav}>
          {state.prev ? <a className="pager-link" href={state.prev} rel="prev"><span className="pager-label">{text.previous}</span><span className="pager-title">{state.prevLabel}</span></a> : <span />}
          {state.next ? <a className="pager-link pager-next" href={state.next} rel="next"><span className="pager-label">{text.next}</span><span className="pager-title">{state.nextLabel}</span></a> : <span />}
        </nav>
        <ChapterNotes lang={lang} bookId={book.id} chapter={chapter} />
      </article>
    </div>
  );
}
