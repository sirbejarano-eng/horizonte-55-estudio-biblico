import type { Metadata } from "next";
import { HERO_SLIDES } from "@/lib/home";
import { LANGS, ROUTES, t, type Lang } from "@/lib/i18n";
import { BookIcon, LeafIcon, LockIcon } from "@/components/Icons";

const COPY: Record<Lang, {
  title: string; intro: string; missionTitle: string; mission: string[]; editionsTitle: string;
  editions: [string, string, string][]; privacy: string[]; creditsIntro: string; photosLabel: string; otherCredits: string[]; codeTitle: string; code: string;
}> = {
  es: {
    title: "Acerca de Horizonte 55",
    intro: "Una mesa de estudio bíblico gratuita, sin fines de lucro, sin registro y sin publicidad.",
    missionTitle: "Para qué existe",
    mission: [
      "Horizonte 55 quiere que leer la Biblia capítulo a capítulo sea sencillo y agradable: buen texto, buena tipografía y lo justo para acompañar la lectura (progreso, notas, búsqueda y contexto histórico).",
      "El texto sagrado es el centro. Los mapas, la línea de tiempo y los estudios de contexto son ayudas humanas para comprenderlo y se presentan como tales.",
    ],
    editionsTitle: "Traducciones disponibles",
    editions: [
      ["Open Nueva Biblia Viva", "Español contemporáneo · Biblica, Inc.", "CC BY-SA 4.0"],
      ["Reina-Valera 1909", "Español histórico", "Dominio público"],
      ["World English Bible (British Edition)", "Inglés", "Dominio público"],
      ["Schlachter 1951", "Alemán · Genfer Bibelgesellschaft", "CC BY 4.0"],
    ],
    privacy: [
      "No se recopilan datos personales. No hay cuentas, cookies de seguimiento ni analítica.",
      "Tu progreso, tus notas, el idioma, la versión y el tema (claro u oscuro) se guardan únicamente en este dispositivo (almacenamiento local del navegador). Puedes exportarlos o borrarlos cuando quieras desde la Biblioteca o desde los ajustes del navegador.",
      "Las tipografías se sirven desde este mismo sitio: al visitarlo no se hacen peticiones a terceros.",
    ],
    creditsIntro: "Fotografías de la portada (Pexels, licencia gratuita):",
    photosLabel: "Foto",
    otherCredits: [
      "Mapa de referencia e ilustraciones de los estudios: material propio de Horizonte 55. Las ilustraciones de los estudios son conceptuales, creadas con inteligencia artificial, y no constituyen evidencia histórica.",
      "Tipografías: Source Serif 4 (Adobe) y Atkinson Hyperlegible (Braille Institute), licencia SIL Open Font License.",
    ],
    codeTitle: "Código",
    code: "Código propio con licencia MIT. Material de estudio propio: derechos reservados. Responsable: Jose A Bejarano V.",
  },
  en: {
    title: "About Horizonte 55",
    intro: "A free, non-profit Bible study desk — no sign-up, no advertising.",
    missionTitle: "Why it exists",
    mission: [
      "Horizonte 55 aims to make reading the Bible chapter by chapter simple and pleasant: good text, good typography and just enough to support your reading (progress, notes, search and historical context).",
      "The sacred text is at the centre. Maps, the timeline and context studies are human aids for understanding it and are presented as such.",
    ],
    editionsTitle: "Available translations",
    editions: [
      ["World English Bible (British Edition)", "English", "Public domain"],
      ["Open Nueva Biblia Viva", "Contemporary Spanish · Biblica, Inc.", "CC BY-SA 4.0"],
      ["Reina-Valera 1909", "Historical Spanish", "Public domain"],
      ["Schlachter 1951", "German · Genfer Bibelgesellschaft", "CC BY 4.0"],
    ],
    privacy: [
      "No personal data is collected. There are no accounts, tracking cookies or analytics.",
      "Your progress, notes, language, version and theme (light or dark) are stored only on this device (the browser's local storage). You can export or delete them at any time from the Library or your browser settings.",
      "Fonts are served from this site itself: visiting it makes no requests to third parties.",
    ],
    creditsIntro: "Home page photographs (Pexels, free licence):",
    photosLabel: "Photo",
    otherCredits: [
      "Reference map and study illustrations: Horizonte 55's own material. The study illustrations are conceptual, created with artificial intelligence, and are not historical evidence.",
      "Fonts: Source Serif 4 (Adobe) and Atkinson Hyperlegible (Braille Institute), SIL Open Font License.",
    ],
    codeTitle: "Code",
    code: "Original code under the MIT licence. Original study material: all rights reserved. Maintained by Jose A Bejarano V.",
  },
  de: {
    title: "Über Horizonte 55",
    intro: "Ein kostenloser, gemeinnütziger Studiertisch für die Bibel – ohne Anmeldung, ohne Werbung.",
    missionTitle: "Wozu es Horizonte 55 gibt",
    mission: [
      "Horizonte 55 möchte das Lesen der Bibel Kapitel für Kapitel einfach und angenehm machen: guter Text, gute Typografie und gerade so viel wie nötig, um das Lesen zu begleiten (Fortschritt, Notizen, Suche und historischer Kontext).",
      "Im Mittelpunkt steht die Heilige Schrift. Karten, Zeitleiste und Kontextstudien sind menschliche Hilfen zum Verständnis und werden auch so dargestellt.",
    ],
    editionsTitle: "Verfügbare Übersetzungen",
    editions: [
      ["Schlachter 1951", "Deutsch · Genfer Bibelgesellschaft", "CC BY 4.0"],
      ["World English Bible (British Edition)", "Englisch", "Gemeinfrei"],
      ["Open Nueva Biblia Viva", "Zeitgenössisches Spanisch · Biblica, Inc.", "CC BY-SA 4.0"],
      ["Reina-Valera 1909", "Historisches Spanisch", "Gemeinfrei"],
    ],
    privacy: [
      "Es werden keine personenbezogenen Daten erhoben. Es gibt keine Konten, keine Tracking-Cookies und keine Analyse.",
      "Fortschritt, Notizen, Sprache, Version und Farbmodus (hell oder dunkel) werden nur auf diesem Gerät gespeichert (im lokalen Speicher des Browsers). Du kannst sie jederzeit in der Bibliothek exportieren oder in den Browsereinstellungen löschen.",
      "Die Schriften werden von dieser Website selbst ausgeliefert: Beim Besuch gehen keine Anfragen an Dritte.",
    ],
    creditsIntro: "Fotos der Startseite (Pexels, kostenlose Lizenz):",
    photosLabel: "Foto",
    otherCredits: [
      "Referenzkarte und Illustrationen der Studien: eigenes Material von Horizonte 55. Die Illustrationen der Studien sind konzeptionell, mit künstlicher Intelligenz erstellt, und kein historischer Beleg.",
      "Schriften: Source Serif 4 (Adobe) und Atkinson Hyperlegible (Braille Institute), SIL Open Font License.",
    ],
    codeTitle: "Code",
    code: "Eigener Code unter MIT-Lizenz. Eigenes Studienmaterial: alle Rechte vorbehalten. Verantwortlich: Jose A Bejarano V.",
  },
};

export const aboutMetadata = (lang: Lang): Metadata => ({
  title: COPY[lang].title,
  description: COPY[lang].intro,
  alternates: { canonical: ROUTES[lang].about, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].about])) },
});

export default function AboutView({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const text = t(lang);
  return (
    <div className="container page page-narrow prose-page">
      <header className="page-head">
        <p className="eyebrow">Horizonte 55</p>
        <h1 className="display-sm">{copy.title}</h1>
        <p className="lead">{copy.intro}</p>
      </header>

      <section className="prose-section" aria-labelledby="mission">
        <h2 id="mission" className="h2"><BookIcon /> {copy.missionTitle}</h2>
        {copy.mission.map((p) => <p key={p}>{p}</p>)}
      </section>

      <section className="prose-section" aria-labelledby="editions">
        <h2 id="editions" className="h2">{copy.editionsTitle}</h2>
        <ul className="edition-list">
          {copy.editions.map(([name, detail, licence]) => (
            <li key={name} className="card">
              <strong>{name}</strong>
              <span className="muted small">{detail}</span>
              <span className="chip">{licence}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="prose-section" id="privacidad" aria-labelledby="privacy-title">
        <h2 id="privacy-title" className="h2"><LockIcon /> {text.privacyTitle}</h2>
        {copy.privacy.map((p) => <p key={p}>{p}</p>)}
      </section>

      <section className="prose-section" id="creditos" aria-labelledby="credits-title">
        <h2 id="credits-title" className="h2"><LeafIcon /> {text.creditsTitle}</h2>
        <p>{copy.creditsIntro}</p>
        <ul className="credit-list">
          {HERO_SLIDES.map((slide) => (
            <li key={slide.image}>
              {copy.photosLabel} «{slide.place[lang]}»: <a href={slide.credit.url} target="_blank" rel="noreferrer">{slide.credit.author} · Pexels</a>
            </li>
          ))}
        </ul>
        {copy.otherCredits.map((p) => <p key={p}>{p}</p>)}
      </section>

      <section className="prose-section" aria-labelledby="code-title">
        <h2 id="code-title" className="h2">{copy.codeTitle}</h2>
        <p>{copy.code}</p>
      </section>
    </div>
  );
}
