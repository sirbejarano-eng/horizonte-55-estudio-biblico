import type { Metadata } from "next";
import { getTestaments } from "@/lib/bible";
import { defaultEdition, LANGS, ROUTES, t, type Lang } from "@/lib/i18n";
import LibraryBrowser, { type LibraryBook } from "@/components/LibraryBrowser";
import ProgressManager from "@/components/ProgressManager";

export const libraryMetadata = (lang: Lang): Metadata => ({
  title: t(lang).library,
  description: t(lang).libraryDescription,
  alternates: { canonical: ROUTES[lang].library, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].library])) },
});

export default function LibraryView({ lang }: { lang: Lang }) {
  const text = t(lang);
  const edition = defaultEdition(lang);
  const { antiguo, nuevo } = getTestaments(edition);
  const books: LibraryBook[] = [
    ...antiguo.map((book) => ({ id: book.id, title: book.title, chapters: book.chapters.length, testament: "old-testament" as const })),
    ...nuevo.map((book) => ({ id: book.id, title: book.title, chapters: book.chapters.length, testament: "new-testament" as const })),
  ];
  const counts = Object.fromEntries(books.map((book) => [book.id, book.chapters]));
  return (
    <div className="container page">
      <header className="page-head">
        <p className="eyebrow">{text.library}</p>
        <h1 className="display-sm">{text.libraryTitle}</h1>
        <p className="lead">{text.libraryIntro}</p>
      </header>
      <LibraryBrowser lang={lang} edition={edition} books={books} />
      <ProgressManager lang={lang} counts={counts} />
    </div>
  );
}
