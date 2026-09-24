import type { Metadata } from "next";
import Link from "next/link";
import { chapterHref, getTestaments } from "@/lib/bible";
import { defaultEdition, LANGS, ROUTES, t, type Lang } from "@/lib/i18n";

export const libraryMetadata = (lang: Lang): Metadata => ({
  title: t(lang).library,
  description: t(lang).libraryDescription,
  alternates: { canonical: ROUTES[lang].library, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].library])) },
});

// Versión estática: cada libro enlaza a su primer capítulo, así Google y los lectores sin JavaScript
// llegan a todo el texto.
export default function LibraryView({ lang }: { lang: Lang }) {
  const text = t(lang);
  const edition = defaultEdition(lang);
  const { antiguo, nuevo } = getTestaments(edition);
  const groups = [
    { id: "old-testament", title: text.oldTestament, other: { id: "new-testament", title: text.newTestament }, books: antiguo },
    { id: "new-testament", title: text.newTestament, other: { id: "old-testament", title: text.oldTestament }, books: nuevo },
  ];
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">{text.library}</p>
        <h1>{text.libraryTitle}</h1>
        <p>{text.libraryIntro}</p>
      </div>
      <div className="library-index" aria-label={text.libraryIndexLabel}>
        <strong>{text.index}</strong>
        {groups.map((group) => (
          <a key={group.id} href={`#${group.id}`}>{group.title} <span>{group.books.length} {text.books}</span></a>
        ))}
      </div>
      {groups.map((group) => (
        <section key={group.id} className="library-section" id={group.id} aria-labelledby={`${group.id}-title`}>
          <div className="library-section-heading">
            <div><h2 id={`${group.id}-title`}>{group.title}</h2></div>
            <div className="library-section-actions">
              <span>{group.books.length} {text.books}</span>
              <a href={`#${group.other.id}`}>{group.other.title}</a>
            </div>
          </div>
          <div className="library-grid-inner">
            {group.books.map((book) => (
              <article key={book.id} className="library-card">
                <div>
                  <p className="eyebrow">{book.chapters.length} {text.chapters}</p>
                  <h3>{book.title}</h3>
                </div>
                <Link className="hero-button" href={chapterHref(book.id, 1, edition)} aria-label={`${text.open} ${book.title}`}>{text.openBook}</Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
