import type { Metadata } from "next";
import Link from "next/link";
import { chapterHref } from "@/lib/bible";
import { defaultEdition, LANGS, ROUTES, t, type Lang } from "@/lib/i18n";
import { milestones } from "@/lib/timeline";

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
    <div className="timeline-layout" style={{ marginInline: "auto" }}>
      <header className="page-heading">
        <p className="eyebrow">{text.timelineEyebrow}</p>
        <h1>{text.timelineTitle}</h1>
        <p>{text.timelineIntro}</p>
      </header>
      <section className="map-stage" aria-labelledby="map-title">
        <div className="map-copy">
          <p className="eyebrow">{text.mapReference}</p>
          <h2 id="map-title">{text.mapTitle}</h2>
          <p>{text.mapIntro}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="contextMap" src={`/assets/mapa-${lang}.webp`} width={1536} height={1024} decoding="async" alt={text.mapAlt} />
      </section>
      <section className="timeline-section" aria-labelledby="timeline-title">
        <div className="timeline-heading">
          <div>
            <p className="eyebrow">{text.milestones}</p>
            <h2 id="timeline-title">{text.contextTitle}</h2>
          </div>
          <p>{text.milestonesIntro}</p>
        </div>
        <div id="timelineTrack" className="timeline-track">
          {milestones[lang].map((milestone, index) => (
            <article key={milestone.id} className={`timeline-item${index % 2 ? " timeline-item-offset" : ""}`}>
              <div className="timeline-marker" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
              <div className="timeline-card">
                <p className="eyebrow">{milestone.period}</p>
                <h3>{milestone.title}</h3>
                <p className="timeline-region">{milestone.region}</p>
                <p>{milestone.text}</p>
                <Link className="hero-button" href={chapterHref(milestone.book, milestone.chapter, edition)}>
                  {text.open} {milestone.bookTitle} {milestone.chapter}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
