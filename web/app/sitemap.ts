import type { MetadataRoute } from "next";
import { getBooks } from "@/lib/bible";
import { chapterPath, EDITIONS, LANGS, ROUTES, type Edition } from "@/lib/i18n";
import { publicStudies, studyHref } from "@/lib/studies";

// sitemap.xml con todas las páginas públicas: portada y secciones en los tres idiomas, estudios
// y los 1.189 capítulos de cada edición. Se genera al compilar (exportación estática).
export const dynamic = "force-static";

const SITE = "https://biblia.horizonte55.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [];
  for (const lang of LANGS) {
    const r = ROUTES[lang];
    pages.push({ url: SITE + r.home, priority: 1 });
    for (const path of [r.library, r.search, r.timeline, r.about, r.plans, r.studies]) pages.push({ url: SITE + path, priority: 0.7 });
    for (const study of publicStudies) pages.push({ url: SITE + studyHref(study.slug, lang), priority: 0.6 });
  }
  for (const edition of Object.keys(EDITIONS) as Edition[]) {
    for (const book of getBooks(edition)) {
      for (const chapter of book.chapters) pages.push({ url: SITE + chapterPath(edition, book.id, chapter.number), priority: edition === "rv1909" ? 0.4 : 0.5 });
    }
  }
  return pages;
}
