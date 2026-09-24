import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chapterHref, getBook, getBooks, neighbours } from "@/lib/bible";
import ReaderTools from "@/components/ReaderTools";
import VerseShare from "@/components/VerseShare";
import ChapterNotes from "@/components/ChapterNotes";

type Params = { params: Promise<{ libro: string; capitulo: string }> };

// 1189 páginas generadas en la compilación: cada capítulo tiene su propia dirección e HTML completo.
export function generateStaticParams() {
  return getBooks().flatMap((book) => book.chapters.map((chapter) => ({ libro: book.id, capitulo: String(chapter.number) })));
}

export const dynamicParams = false;

function find(libro: string, capitulo: string) {
  const book = getBook(libro);
  const chapter = book?.chapters.find((item) => item.number === Number(capitulo));
  return book && chapter ? { book, chapter } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { libro, capitulo } = await params;
  const found = find(libro, capitulo);
  if (!found) return {};
  const text = found.chapter.verses.map((verse) => verse.text).join(" ");
  const description = text.length > 155 ? `${text.slice(0, 152).replace(/\s+\S*$/, "")}…` : text;
  return {
    title: `${found.book.title} ${found.chapter.number}`,
    description,
    alternates: { canonical: chapterHref(found.book.id, found.chapter.number) },
  };
}

// Estudios de contexto que ya existen para ciertos capítulos (páginas de la versión actual).
const relatedStudies: Record<string, { href: string; eyebrow: string; title: string }> = {
  "genesis-2": { href: "/contexto-eden.html", eyebrow: "Estudio de contexto", title: "Los cuatro ríos del Edén: del texto sagrado al mapa" },
  "genesis-11": { href: "/contexto-babel.html", eyebrow: "Estudio de contexto", title: "Babel: ciudad, torre y dispersión" },
};

export default async function ChapterPage({ params }: Params) {
  const { libro, capitulo } = await params;
  const found = find(libro, capitulo);
  if (!found) notFound();
  const { book, chapter } = found;
  const index = book.chapters.findIndex((item) => item.number === chapter.number);
  const percentage = Math.round(((index + 1) / book.chapters.length) * 100);
  const { prev, next } = neighbours(book.id, chapter.number);
  const study = relatedStudies[`${book.id}-${chapter.number}`];
  const options = getBooks().map((item) => ({ id: item.id, title: item.title, chapters: item.chapters.length }));

  return (
    <article className="chapter-card" aria-labelledby="chapter-title">
      <header className="chapter-header">
        <div className="chapter-header-main">
          <p className="eyebrow chapter-book-title">{book.title}</p>
          <h1 className="chapter-title" id="chapter-title">
            <span className="sr-only">{book.title} </span>Capítulo {chapter.number}
          </h1>
          <div className="book-progress">
            <div className="book-progress-track" role="progressbar" aria-label={`Avance en ${book.title}`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
              <span className="book-progress-fill" style={{ width: `${percentage}%` }} />
            </div>
            <span className="book-progress-label">Capítulo {index + 1} de {book.chapters.length}</span>
          </div>
        </div>
        <ReaderTools bookId={book.id} bookTitle={book.title} chapter={chapter.number} books={options} />
      </header>

      {study && (
        <aside className="context-study-prompt" aria-labelledby="study-title">
          <p className="eyebrow">{study.eyebrow}</p>
          <h2 id="study-title">{study.title}</h2>
          <a className="secondary-button" href={study.href}>Abrir el estudio</a>
        </aside>
      )}

      <VerseShare bookTitle={book.title} bookId={book.id} chapter={chapter.number} />
      <div className="verses">
        {chapter.verses.map((verse) => (
          <div className="verse" id={`verse-${verse.number}`} key={verse.number}>
            <span className="verse-number">{verse.number}</span>
            <div className="verse-content">
              <p className="verse-text">{verse.text}</p>
              <button className="verse-share" type="button" data-verse-number={verse.number} aria-label={`Compartir versículo ${book.title} ${chapter.number}:${verse.number}`}>
                Compartir versículo
              </button>
            </div>
          </div>
        ))}
      </div>

      <ChapterNotes bookId={book.id} chapter={chapter.number} />

      <nav className="chapter-nav" aria-label="Capítulos">
        {prev ? (
          <Link className="secondary-button" href={chapterHref(prev.book.id, prev.chapter)} rel="prev">← {prev.book.title} {prev.chapter}</Link>
        ) : <span />}
        {next ? (
          <Link className="secondary-button" href={chapterHref(next.book.id, next.chapter)} rel="next">{next.book.title} {next.chapter} →</Link>
        ) : <span />}
      </nav>
    </article>
  );
}
