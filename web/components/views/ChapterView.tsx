import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chapterHref, displayVerseText, getBook, getBooks, neighbours } from "@/lib/bible";
import { chapterPath, EDITIONS, ROUTES, t, type Edition } from "@/lib/i18n";
import { studyForChapter, studyHref } from "@/lib/studies";
import ReaderTools from "@/components/ReaderTools";
import VerseActions from "@/components/VerseActions";
import ReadingProgress from "@/components/ReadingProgress";
import ChapterNotes from "@/components/ChapterNotes";
import { ArrowLeftIcon, ArrowRightIcon, MapIcon } from "@/components/Icons";

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
  const title = `${found.book.title} ${n}${edition === "rv1909" ? " (RV1909)" : ""}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    alternates: {
      canonical: chapterPath(edition, libro, n),
      languages: { es: chapterPath("onbv", libro, n), en: chapterPath("en", libro, n), de: chapterPath("de", libro, n) },
    },
  };
}

// Página de lectura: tipografía de libro (Source Serif), letra capital, números discretos y un
// panel "Tu lectura" que acompaña al bajar (en el móvil, una barra inferior). El HTML contiene
// solo el texto; los botones de compartir y la selección de versículos los añade VerseActions.
export default async function ChapterView({ edition, params }: { edition: Edition } & ChapterParams) {
  const { libro, capitulo } = await params;
  const found = find(edition, libro, capitulo);
  if (!found) notFound();
  const lang = EDITIONS[edition].lang;
  const text = t(lang);
  const { book, chapter } = found;
  const { prev, next } = neighbours(edition, book.id, chapter.number);
  const study = studyForChapter(book.id, chapter.number);
  const words = chapter.verses.reduce((sum, verse) => sum + verse.text.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(words / 200));
  const prevHref = prev ? chapterHref(prev.book.id, prev.chapter, edition) : null;
  const nextHref = next ? chapterHref(next.book.id, next.chapter, edition) : null;

  // Un solo elemento raíz: Next desplaza la vista hasta el comienzo de la página al navegar;
  // con varios bloques sueltos terminaba en el último (el pie de la página).
  return (
    <div className="page-root">
      <ReadingProgress key={`p-${book.id}-${chapter.number}`} />
      <div className="container reader-layout">
        <article className="chapter" aria-labelledby="chapter-title">
          <header className="chapter-head">
            <nav className="breadcrumbs" aria-label={text.breadcrumbs}>
              <Link href={ROUTES[lang].library}>{text.library}</Link>
              <span aria-hidden="true">/</span>
              <span>{book.title}</span>
            </nav>
            <p className="eyebrow chapter-book">{book.title}</p>
            <h1 className="chapter-title" id="chapter-title">
              <span className="sr-only">{book.title} </span>
              {text.chapter} {chapter.number}
            </h1>
            <p className="chapter-meta">
              {EDITIONS[edition].label} · {chapter.verses.length} {text.versesLabel} · {minutes} {text.minRead}
            </p>
          </header>

          {study && (
            <aside className="study-callout" aria-labelledby="study-title">
              <span className="study-callout-icon"><MapIcon /></span>
              <div>
                <p className="eyebrow">{text.contextStudy}</p>
                <p className="study-callout-title" id="study-title">{study.titles[lang]}</p>
              </div>
              <Link className="button button-ghost" href={studyHref(study.slug, lang)}>{text.openStudy}</Link>
            </aside>
          )}

          <div className="scripture" data-book={book.id} data-chapter={chapter.number}>
            {chapter.verses.map((verse) => (
              <p className="v" id={`verse-${verse.number}`} key={verse.number}>
                <sup>{verse.number}</sup>
                {displayVerseText(edition, verse)}
              </p>
            ))}
          </div>

          <nav className="chapter-pager" aria-label={text.chapterNav}>
            {prev && prevHref ? (
              <Link className="pager-link" href={prevHref} rel="prev">
                <span className="pager-label"><ArrowLeftIcon size={16} /> {text.previous}</span>
                <span className="pager-title">{prev.book.title} {prev.chapter}</span>
              </Link>
            ) : <span />}
            {next && nextHref ? (
              <Link className="pager-link pager-next" href={nextHref} rel="next">
                <span className="pager-label">{text.next} <ArrowRightIcon size={16} /></span>
                <span className="pager-title">{next.book.title} {next.chapter}</span>
              </Link>
            ) : <span />}
          </nav>

          <ChapterNotes lang={lang} bookId={book.id} chapter={chapter.number} />
        </article>

        <ReaderTools edition={edition} bookId={book.id} bookTitle={book.title} chapter={chapter.number} chapterCount={book.chapters.length} prevHref={prevHref} nextHref={nextHref} />
      </div>
      <VerseActions key={`v-${book.id}-${chapter.number}`} edition={edition} bookTitle={book.title} bookId={book.id} chapter={chapter.number} />
    </div>
  );
}
