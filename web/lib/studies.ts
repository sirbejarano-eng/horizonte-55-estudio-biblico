import fs from "node:fs";
import path from "node:path";
import { chapterPath, defaultEdition, ROUTES, type Lang } from "./i18n";

// Estudios de contexto, en los tres idiomas.
// - Español: mientras la versión actual siga publicada, su HTML (contexto-*.html en la raíz) es la
//   única fuente; se lee al compilar y solo se adaptan las direcciones.
// - Inglés y alemán: content/studies/<slug>.<idioma>.html, generados una vez a partir de ese HTML y
//   de las traducciones de js/<slug>-content.js (lo que la versión actual aplicaba con JavaScript).
export type Study = { slug: string; file: string; chapterKey: string; titles: Record<Lang, string> };

export const studies: Study[] = [
  {
    slug: "eden", file: "contexto-eden.html", chapterKey: "genesis-2",
    titles: { es: "Los cuatro ríos del Edén: del texto sagrado al mapa", en: "The four rivers of Eden: from sacred text to map", de: "Die vier Flüsse Edens: von der Heiligen Schrift zur Karte" },
  },
  {
    slug: "babel", file: "contexto-babel.html", chapterKey: "genesis-11",
    titles: { es: "Babel: ciudad, torre y dispersión", en: "Babel: city, tower and scattering", de: "Babel: Stadt, Turm und Zerstreuung" },
  },
];

export const studyHref = (slug: string, lang: Lang = "es") => `${ROUTES[lang].studies}${slug}/`;
export const studyForChapter = (bookId: string, chapter: number) => studies.find((s) => s.chapterKey === `${bookId}-${chapter}`);

const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Direcciones de la versión actual → nuevas, en el idioma del estudio
// (lectura.html?book=genesis&chapter=2#verse-10 → /en/read/genesis/2/#verse-10).
function rewriteLinks(html: string, lang: Lang) {
  const edition = defaultEdition(lang);
  return html
    .replace(/\.\/lectura\.html\?book=([a-z0-9-]+)&(?:amp;)?chapter=(\d+)(#verse-\d+)?/g, (_m, book, chapter, hash = "") => chapterPath(edition, book, Number(chapter)) + hash)
    .replace(/\.\/assets\//g, "/assets/")
    .replace(/\.\/cronologia\.html/g, ROUTES[lang].timeline)
    .replace(/\.\/index\.html/g, ROUTES[lang].home)
    .replace(/\.\/contexto-(eden|babel)\.html/g, (_m, slug) => studyHref(slug, lang));
}

export function readStudy(slug: string, lang: Lang = "es") {
  const study = studies.find((s) => s.slug === slug);
  if (!study) return null;
  const file = lang === "es" ? path.join(process.cwd(), "..", study.file) : path.join(process.cwd(), "content", "studies", `${slug}.${lang}.html`);
  const source = fs.readFileSync(file, "utf8");
  const main = source.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1];
  const dialog = source.match(/<dialog[\s\S]*?<\/dialog>/)?.[0] ?? "";
  if (!main) throw new Error(`No se encontró <main> en ${file}`);
  const description = decode(
    (lang === "es" ? source.match(/<meta name="description" content="([^"]*)"/)?.[1] : source.match(/description: ([^\n]*?) -->/)?.[1]) ?? "",
  );
  return { ...study, title: study.titles[lang], description, html: rewriteLinks(main, lang), dialog: rewriteLinks(dialog, lang) };
}
