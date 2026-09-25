import type { Metadata } from "next";
import Link from "next/link";
import { chapterHref } from "@/lib/bible";
import { defaultEdition, LANGS, ROUTES, t, type Lang } from "@/lib/i18n";
import { milestones } from "@/lib/timeline";
import { ArrowRightIcon } from "@/components/Icons";

export const timelineMetadata = (lang: Lang): Metadata => ({
  title: t(lang).timelineTitle,
  description: t(lang).timelineDescription,
  alternates: { canonical: ROUTES[lang].timeline, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].timeline])) },
});

// HTML estático: los hitos son enlaces normales al capítulo (antes, botones con JavaScript).
export default function TimelineView({ lang }: { lang: Lang }) {
  const text = t(lang);
  const edition = defaultEdition(lang);
  return (
    <div className="container page">
      <header className="page-head">
        <p className="eyebrow">{text.timelineEyebrow}</p>
        <h1 className="display-sm">{text.timelineTitle}</h1>
        <p className="lead">{text.timelineIntro}</p>
      </header>
      <figure className="map-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/assets/mapa-${lang}.webp`} width={1536} height={1024} decoding="async" alt={text.mapAlt} />
        <figcaption>
          <p className="eyebrow">{text.mapReference}</p>
          <p className="map-title">{text.mapTitle}</p>
          <p className="muted small">{text.mapIntro}</p>
        </figcaption>
      </figure>
      <section className="section" aria-labelledby="timeline-title">
        <div className="section-heading">
          <p className="eyebrow">{text.milestones}</p>
          <h2 id="timeline-title" className="h2">{text.contextTitle}</h2>
          <p className="muted">{text.milestonesIntro}</p>
        </div>
        <ol className="timeline">
          {milestones[lang].map((milestone, index) => (
            <li key={milestone.id} className="timeline-item">
              <span className="timeline-dot" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <article className="card timeline-card">
                <p className="eyebrow">{milestone.period}</p>
                <h3 className="h3">{milestone.title}</h3>
                <p className="timeline-region">{milestone.region}</p>
                <p className="muted">{milestone.text}</p>
                <Link className="text-link" href={chapterHref(milestone.book, milestone.chapter, edition)}>
                  {text.open} {milestone.bookTitle} {milestone.chapter} <ArrowRightIcon size={16} />
                </Link>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
