import fs from "node:fs";
import path from "node:path";

// Estudios de contexto. Mientras la versión actual siga publicada, su HTML en español es la
// única fuente: se lee en tiempo de compilación y solo se adaptan las direcciones. Así un cambio
// editorial se hace en un solo sitio y ambas versiones muestran exactamente el mismo texto.
export type Study = { slug: string; file: string; chapterKey: string; title: string };

export const studies: Study[] = [
  { slug: "eden", file: "contexto-eden.html", chapterKey: "genesis-2", title: "Los cuatro ríos del Edén: del texto sagrado al mapa" },
  { slug: "babel", file: "contexto-babel.html", chapterKey: "genesis-11", title: "Babel: ciudad, torre y dispersión" },
];

export const studyHref = (slug: string) => `/estudios/${slug}/`;
export const studyForChapter = (bookId: string, chapter: number) => studies.find((s) => s.chapterKey === `${bookId}-${chapter}`);

const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Direcciones antiguas → nuevas (lectura.html?book=…&chapter=…#verse-… → /leer/…/…/#verse-…).
function rewriteLinks(html: string) {
  return html
    .replace(/\.\/lectura\.html\?book=([a-z0-9-]+)&(?:amp;)?chapter=(\d+)(#verse-\d+)?/g, (_m, book, chapter, hash = "") => `/leer/${book}/${chapter}/${hash}`)
    .replace(/\.\/assets\//g, "/assets/")
    .replace(/\.\/cronologia\.html/g, "/cronologia/")
    .replace(/\.\/index\.html/g, "/")
    .replace(/\.\/contexto-(eden|babel)\.html/g, "/estudios/$1/");
}

export function readStudy(slug: string) {
  const study = studies.find((s) => s.slug === slug);
  if (!study) return null;
  const source = fs.readFileSync(path.join(process.cwd(), "..", study.file), "utf8");
  const main = source.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1];
  const dialog = source.match(/<dialog[\s\S]*?<\/dialog>/)?.[0] ?? "";
  if (!main) throw new Error(`No se encontró <main> en ${study.file}`);
  const description = decode(source.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const title = decode(source.match(/<title>([^<|]*)/)?.[1]?.trim() ?? study.title);
  return { ...study, title, description, html: rewriteLinks(main), dialog: rewriteLinks(dialog) };
}
