import Link from "next/link";
import { getBooks, totalChapters } from "@/lib/bible";
import { defaultEdition, ROUTES, t, type Lang } from "@/lib/i18n";
import { CompletedCount, ContinueReading, LanguageRedirect } from "@/components/HomeProgress";

export default function HomeView({ lang }: { lang: Lang }) {
  const text = t(lang);
  const edition = defaultEdition(lang);
  const books = getBooks(edition);
  const titles = Object.fromEntries(books.map((book) => [book.id, book.title]));
  const chapterCounts = Object.fromEntries(books.map((book) => [book.id, book.chapters.length]));
  return (
    <>
      {lang === "es" && <LanguageRedirect />}
      <section className="home-hero">
        <div>
          <p className="eyebrow hero-eyebrow">{text.studyDesk}</p>
          <h1>{text.heroTitle}</h1>
          <p>{text.heroIntro}</p>
          <div className="hero-actions">
            <Link className="hero-button" href={ROUTES[lang].library}>{text.library}</Link>
            <Link className="hero-link" href={ROUTES[lang].search}>{text.searchBible}</Link>
          </div>
        </div>
        <div className="hero-stats">
          <strong>{books.length} {text.books} · {totalChapters(edition)} {text.chapters}</strong>
          <span><CompletedCount lang={lang} /></span>
        </div>
      </section>
      <section className="home-grid">
        <article className="feature-panel">
          <p className="eyebrow">{text.reader}</p>
          <ContinueReading lang={lang} titles={titles} chapterCounts={chapterCounts} />
        </article>
        <article className="feature-panel daily-home">
          <p className="eyebrow">{text.timeline}</p>
          <h2>{text.contextTitle}</h2>
          <p>{text.contextIntro}</p>
          <Link className="hero-link dark-link" href={ROUTES[lang].timeline}>{text.timeline}</Link>
        </article>
      </section>
    </>
  );
}
