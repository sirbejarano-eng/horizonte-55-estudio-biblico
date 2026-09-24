import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chapterHref, displayVerseText, getBook, getBooks, neighbours } from "@/lib/bible";
import { chapterPath, EDITIONS, t, type Edition } from "@/lib/i18n";
import { studyForChapter, studyHref } from "@/lib/studies";
import ReaderTools from "@/components/ReaderTools";
import VerseShare from "@/components/VerseShare";
import ChapterNotes from "@/components/ChapterNotes";

export type ChapterParams = { params: Promise<{ libro: string; capitulo: string }> };

// Una página HTML por capítulo y edición (1.189 × 4), generadas en la compilación.
export const chapterStaticParams = (edition: Edition) =>
  getBooks(edition).flatMap((book) => book.chapters.map((chapter) => ({ libro: book.id, capitulo: String(chapter.number) })));

function find(edition: Edition, libro: string, capitulo: string) {
  const book = getBook(edition, libro);
  const chapter = book?.chapters.find((item) => item.number === Number(capitulo));
  return book && chapter ? { book, chapter } : null;
}

export async function chapterMetadata(edition: Edition, { params }: ChapterParams): Promise<Metadata> {
  const { libro, capitulo } = await params;
  const found = find(edition, libro, capitulo);
  if (!found) return {};
  const text = found.chapter.verses.map((verse) => displayVerseText(edition, verse)).join(" ");
  const description = text.length > 155 ? `${text.slice(0, 152).replace(/\s+\S*$/, "")}…` : text;
  const n = found.chapter.number;
  return {
    title: `${found.book.title} ${n}${edition === "rv1909" ? " (RV1909)" : ""}`,
    description,
    alternates: {
      canonical: chapterPath(edition, libro, n),
      languages: { es: chapterPath("onbv", libro, n), en: chapterPath("en", libro, n), de: chapterPath("de", libro, n) },
    },
  };
}

export default async function ChapterView({ edition, params }: { edition: Edition } & ChapterParams) {
  const { libro, capitulo } = await params;
  const found = find(edition, libro, capitulo);
  if (!found) notFound();
  const lang = EDITIONS[edition].lang;
  const text = t(lang);
  const { book, chapter } = found;
  const index = book.chapters.findIndex((item) => item.number === chapter.number);
  const percentage = Math.round(((index + 1) / book.chapters.length) * 100);
  const { prev, next } = neighbours(edition, book.id, chapter.number);
  const study = studyForChapter(book.id, chapter.number);
  const options = getBooks(edition).map((item) => ({ id: item.id, title: item.title, chapters: item.chapters.length }));

  return (
    <article className="chapter-card" aria-labelledby="chapter-title">
      <header className="chapter-header">
        <div className="chapter-header-main">
          <p className="eyebrow chapter-book-title">{book.title}</p>
          <h1 className="chapter-title" id="chapter-title">
            <span className="sr-only">{book.title} </span>{text.chapter} {chapter.number}
          </h1>
          <div className="book-progress">
            <div className="book-progress-track" role="progressbar" aria-label={`${text.progressIn} ${book.title}`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
              <span className="book-progress-fill" style={{ width: `${percentage}%` }} />
            </div>
            <span className="book-progress-label">{text.chapter} {index + 1} {text.of} {book.chapters.length} · {EDITIONS[edition].label}</span>
          </div>
        </div>
        <ReaderTools edition={edition} bookId={book.id} bookTitle={book.title} chapter={chapter.number} books={options} />
      </header>

      {study && (
        <aside className="context-study-prompt" aria-labelledby="study-title">
          <p className="eyebrow">{text.contextStudy}</p>
          <h2 id="study-title">{study.titles[lang]}</h2>
          <Link className="secondary-button" href={studyHref(study.slug, lang)}>{text.openStudy}</Link>
        </aside>
      )}

      <VerseShare edition={edition} bookTitle={book.title} bookId={book.id} chapter={chapter.number} />
      <div className="verses">
        {chapter.verses.map((verse) => (
          <div className="verse" id={`verse-${verse.number}`} key={verse.number}>
            <span className="verse-number">{verse.number}</span>
            <div className="verse-content">
              <p className="verse-text">{displayVerseText(edition, verse)}</p>
              <button className="verse-share" type="button" data-verse-number={verse.number} aria-label={`${text.shareVerse} ${book.title} ${chapter.number}:${verse.number}`}>
                {text.shareVerse}
              </button>
            </div>
          </div>
        ))}
      </div>

      <ChapterNotes lang={lang} bookId={book.id} chapter={chapter.number} />

      <nav className="chapter-nav" aria-label={text.chapterNav}>
        {prev ? (
          <Link className="secondary-button" href={chapterHref(prev.book.id, prev.chapter, edition)} rel="prev">← {prev.book.title} {prev.chapter}</Link>
        ) : <span />}
        {next ? (
          <Link className="secondary-button" href={chapterHref(next.book.id, next.chapter, edition)} rel="next">{next.book.title} {next.chapter} →</Link>
        ) : <span />}
      </nav>
    </article>
  );
}
