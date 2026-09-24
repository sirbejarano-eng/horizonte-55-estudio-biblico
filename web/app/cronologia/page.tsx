import type { Metadata } from "next";
import Link from "next/link";
import { chapterHref } from "@/lib/bible";
import { milestones } from "@/lib/timeline";

export const metadata: Metadata = {
  title: "Línea de tiempo bíblica",
  description: "Línea de tiempo bíblica y mapa de estudio de Oriente Próximo: de Abraham a la iglesia primitiva.",
  alternates: { canonical: "/cronologia/" },
};

// Ahora es HTML estático: los hitos son enlaces normales al capítulo (antes, botones con JavaScript).
export default function TimelinePage() {
  return (
    <div className="timeline-layout" style={{ marginInline: "auto" }}>
      <header className="page-heading">
        <p className="eyebrow">Orientación histórica</p>
        <h1>Línea de tiempo bíblica</h1>
        <p>Una vista de contexto para situar pueblos, territorios y desplazamientos alrededor de Jerusalén y Egipto.</p>
      </header>
      <section className="map-stage" aria-labelledby="map-title">
        <div className="map-copy">
          <p className="eyebrow">Mapa de referencia</p>
          <h2 id="map-title">Entre el Nilo, Jerusalén y Mesopotamia</h2>
          <p>Las rutas son una guía visual de estudio. Las fechas se presentan como aproximaciones y no sustituyen el análisis histórico especializado.</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="contextMap" src="/assets/mapa-es.webp" width={1536} height={1024} decoding="async" alt="Mapa bíblico de Egipto, Jerusalén, Canaán y Mesopotamia" />
      </section>
      <section className="timeline-section" aria-labelledby="timeline-title">
        <div className="timeline-heading">
          <div>
            <p className="eyebrow">Hitos para recorrer</p>
            <h2 id="timeline-title">Una historia en movimiento</h2>
          </div>
          <p>Selecciona un hito para ver su región y una puerta de entrada al texto bíblico.</p>
        </div>
        <div id="timelineTrack" className="timeline-track">
          {milestones.map((milestone, index) => (
            <article key={milestone.id} className={`timeline-item${index % 2 ? " timeline-item-offset" : ""}`}>
              <div className="timeline-marker" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
              <div className="timeline-card">
                <p className="eyebrow">{milestone.period}</p>
                <h3>{milestone.title}</h3>
                <p className="timeline-region">{milestone.region}</p>
                <p>{milestone.text}</p>
                <Link className="hero-button" href={chapterHref(milestone.book, milestone.chapter)}>
                  Abrir {milestone.bookTitle} {milestone.chapter}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
