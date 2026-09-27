import type { Metadata } from "next";
import Link from "next/link";
import { getBook } from "@/lib/bible";
import { defaultEdition, LANGS, ROUTES, t, type Lang } from "@/lib/i18n";
import { readStudy, studyHref, visibleStudies } from "@/lib/studies";
import { ArrowRightIcon, MapIcon } from "@/components/Icons";

export const studiesMetadata = (lang: Lang): Metadata => ({
  title: t(lang).contextStudies,
  description: t(lang).studiesDescription,
  alternates: { canonical: ROUTES[lang].studies, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].studies])) },
});

// Lista de estudios de contexto, en el orden bíblico de sus pasajes.
export default function StudiesView({ lang }: { lang: Lang }) {
  const text = t(lang);
  const edition = defaultEdition(lang);
  const items = visibleStudies.map((study) => {
    const [, bookId, chapter] = study.chapterKey.match(/^(.+)-(\d+)$/) ?? [];
    return { study, description: readStudy(study.slug, lang)?.description ?? "", book: getBook(edition, bookId)?.title ?? bookId, chapter };
  });
  return (
    <div className="container page">
      <header className="page-head">
        <p className="eyebrow">{text.contextStudies}</p>
        <h1 className="display-sm">{text.studiesTitle}</h1>
        <p className="lead">{text.studiesIntro}</p>
      </header>
      <ul className="study-list">
        {items.map(({ study, description, book, chapter }) => (
          <li key={study.slug}>
            <Link className="card study-item" href={studyHref(study.slug, lang)}>
              <span className="study-item-icon"><MapIcon /></span>
              <span className="study-item-meta">
                {book} {chapter}
                {study.draft && <span className="study-draft">{text.draftBadge}</span>}
              </span>
              <span className="study-item-title">{study.titles[lang]}</span>
              <span className="study-item-body">{description}</span>
              <span className="text-link">{text.openStudy} <ArrowRightIcon size={16} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
