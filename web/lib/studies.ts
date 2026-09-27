import fs from "node:fs";
import path from "node:path";
import { chapterPath, defaultEdition, ROUTES, type Lang } from "./i18n";

// Estudios de contexto, en los tres idiomas.
// - Edén y Babel en español: mientras la versión actual siga publicada, su HTML (contexto-*.html en la
//   raíz) es la única fuente; se lee al compilar y solo se adaptan las direcciones.
// - Todo lo demás: content/studies/<slug>.<idioma>.html. Los de Edén y Babel en inglés y alemán se
//   generaron a partir de la versión actual; Éxodo, Jerusalén y Pablo (fase 4) nacieron aquí.
// draft: borrador pendiente de la revisión del responsable (se indica solo en la vista interna).
// published: autorización editorial explícita para formar parte de la exportación pública.
// milestone: hito de la línea de tiempo en el que aparece el estudio.
export type Study = { slug: string; file?: string; chapterKey: string; milestone: string; draft: boolean; published: boolean; titles: Record<Lang, string> };

// Orden cronológico: es el orden de la lista de estudios y de cada hito de la línea de tiempo.
export const studies: Study[] = [
  {
    slug: "eden", file: "contexto-eden.html", chapterKey: "genesis-2", milestone: "origins", draft: false, published: true,
    titles: { es: "Los cuatro ríos del Edén: del texto sagrado al mapa", en: "The four rivers of Eden: from sacred text to map", de: "Die vier Flüsse Edens: von der Heiligen Schrift zur Karte" },
  },
  {
    slug: "diluvio", chapterKey: "genesis-7", milestone: "origins", draft: false, published: true,
    titles: { es: "El diluvio: Noé y los relatos de Mesopotamia", en: "The Flood: Noah and the Mesopotamian accounts", de: "Die Sintflut: Noah und die Berichte aus Mesopotamien" },
  },
  {
    slug: "babel", file: "contexto-babel.html", chapterKey: "genesis-11", milestone: "origins", draft: false, published: true,
    titles: { es: "Babel: ciudad, torre y dispersión", en: "Babel: city, tower and scattering", de: "Babel: Stadt, Turm und Zerstreuung" },
  },
  {
    slug: "abraham", chapterKey: "genesis-12", milestone: "patriarchs", draft: false, published: true,
    titles: { es: "Abraham: de Ur a Canaán", en: "Abraham: from Ur to Canaan", de: "Abraham: von Ur nach Kanaan" },
  },
  {
    slug: "jose", chapterKey: "genesis-37", milestone: "patriarchs", draft: false, published: true,
    titles: { es: "José en Egipto: de la cisterna al palacio", en: "Joseph in Egypt: from the pit to the palace", de: "Josef in Ägypten: von der Zisterne in den Palast" },
  },
  {
    slug: "exodo", chapterKey: "exodo-14", milestone: "exodus", draft: false, published: true,
    titles: { es: "El Éxodo: del mar al monte Sinaí", en: "The Exodus: from the sea to Mount Sinai", de: "Der Exodus: vom Meer zum Berg Sinai" },
  },
  {
    slug: "tabernaculo", chapterKey: "exodo-25", milestone: "exodus", draft: false, published: true,
    titles: { es: "El tabernáculo en el desierto: Dios habita en medio de su pueblo", en: "The tabernacle in the wilderness: God dwells among his people", de: "Die Stiftshütte in der Wüste: Gott wohnt inmitten seines Volkes" },
  },
  {
    slug: "jerico", chapterKey: "josue-6", milestone: "conquest", draft: false, published: true,
    titles: { es: "Jericó: el relato y la arqueología", en: "Jericho: the account and the archaeology", de: "Jericho: Bericht und Archäologie" },
  },
  {
    slug: "silo", chapterKey: "1-samuel-1", milestone: "conquest", draft: false, published: true,
    titles: { es: "Silo y el arca en tiempos de los jueces", en: "Shiloh and the ark in the days of the judges", de: "Silo und die Lade in der Zeit der Richter" },
  },
  {
    slug: "ciudad-david", chapterKey: "2-samuel-5", milestone: "monarchy", draft: false, published: true,
    titles: { es: "La ciudad de David: Sion y la colina del rey", en: "The City of David: Zion and the king’s hill", de: "Die Stadt Davids: Zion und der Hügel des Königs" },
  },
  {
    slug: "templo-salomon", chapterKey: "1-reyes-6", milestone: "monarchy", draft: false, published: true,
    titles: { es: "El templo de Salomón: una casa para el nombre de Dios", en: "Solomon’s temple: a house for the name of God", de: "Der Tempel Salomos: ein Haus für den Namen Gottes" },
  },
  {
    slug: "ezequias", chapterKey: "2-reyes-20", milestone: "monarchy", draft: false, published: true,
    titles: { es: "Ezequías y el túnel de Siloé", en: "Hezekiah and the Siloam Tunnel", de: "Hiskia und der Siloah-Tunnel" },
  },
  {
    slug: "caida-jerusalen", chapterKey: "2-reyes-25", milestone: "exile", draft: false, published: true,
    titles: { es: "La caída de Jerusalén y el destierro", en: "The fall of Jerusalem and the exile", de: "Der Fall Jerusalems und das Exil" },
  },
  {
    slug: "daniel", chapterKey: "daniel-1", milestone: "exile", draft: false, published: true,
    titles: { es: "Daniel en la corte de Babilonia", en: "Daniel at the court of Babylon", de: "Daniel am Hof von Babylon" },
  },
  {
    slug: "ciro", chapterKey: "esdras-1", milestone: "return", draft: false, published: true,
    titles: { es: "Ciro y el regreso: Esdras y Nehemías", en: "Cyrus and the return: Ezra and Nehemiah", de: "Kyrus und die Heimkehr: Esra und Nehemia" },
  },
  {
    slug: "ester", chapterKey: "ester-1", milestone: "return", draft: false, published: true,
    titles: { es: "Ester en Susa: para un tiempo como este", en: "Esther in Susa: for such a time as this", de: "Ester in Susa: für eine Zeit wie diese" },
  },
  {
    slug: "belen", chapterKey: "lucas-2", milestone: "gospels", draft: false, published: true,
    titles: { es: "Belén y el nacimiento de Jesús", en: "Bethlehem and the birth of Jesus", de: "Bethlehem und die Geburt Jesu" },
  },
  {
    slug: "galilea", chapterKey: "marcos-1", milestone: "gospels", draft: false, published: true,
    titles: { es: "Galilea: Cafarnaúm y el mar", en: "Galilee: Capernaum and the sea", de: "Galiläa: Kapernaum und der See" },
  },
  {
    slug: "jerusalen", chapterKey: "mateo-21", milestone: "gospels", draft: false, published: true,
    titles: { es: "Jerusalén en tiempos de Jesús: el templo y la última semana", en: "Jerusalem in the time of Jesus: the temple and the final week", de: "Jerusalem zur Zeit Jesu: der Tempel und die letzte Woche" },
  },
  {
    slug: "pentecostes", chapterKey: "hechos-2", milestone: "early-church", draft: false, published: true,
    titles: { es: "Pentecostés y la iglesia de Jerusalén", en: "Pentecost and the church in Jerusalem", de: "Pfingsten und die Gemeinde in Jerusalem" },
  },
  {
    slug: "pablo", chapterKey: "hechos-13", milestone: "early-church", draft: false, published: true,
    titles: { es: "Los viajes de Pablo: rutas, ciudades y cartas", en: "Paul’s journeys: routes, cities and letters", de: "Die Reisen des Paulus: Wege, Städte und Briefe" },
  },
  {
    slug: "atenas", chapterKey: "hechos-17", milestone: "early-church", draft: false, published: true,
    titles: { es: "Pablo en Atenas: el Areópago", en: "Paul in Athens: the Areopagus", de: "Paulus in Athen: der Areopag" },
  },
  {
    slug: "siete-iglesias", chapterKey: "apocalipsis-2", milestone: "early-church", draft: false, published: true,
    titles: { es: "Las siete iglesias del Apocalipsis", en: "The seven churches of Revelation", de: "Die sieben Gemeinden der Offenbarung" },
  },
];

// En desarrollo se ven todos los borradores. Una compilación de producción solo admite estudios
// aprobados; H55_INCLUDE_DRAFT_STUDIES=1 crea deliberadamente una exportación interna para revisión.
export const publicStudies = studies.filter((study) => study.published && !study.draft);
export const includesInternalStudies = process.env.NODE_ENV !== "production" || process.env.H55_INCLUDE_DRAFT_STUDIES === "1";
export const visibleStudies = includesInternalStudies ? studies : publicStudies;

export const studyHref = (slug: string, lang: Lang = "es") => `${ROUTES[lang].studies}${slug}/`;
export const studyForChapter = (bookId: string, chapter: number) => visibleStudies.find((s) => s.chapterKey === `${bookId}-${chapter}`);

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
    .replace(/\.\/contexto-([a-z]+)\.html/g, (_m, slug) => studyHref(slug, lang));
}

export function readStudy(slug: string, lang: Lang = "es") {
  const study = visibleStudies.find((s) => s.slug === slug);
  if (!study) return null;
  const legacy = lang === "es" && study.file;
  const file = legacy ? path.join(process.cwd(), "..", study.file!) : path.join(process.cwd(), "content", "studies", `${slug}.${lang}.html`);
  const source = fs.readFileSync(file, "utf8");
  const main = source.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1];
  const dialog = source.match(/<dialog[\s\S]*?<\/dialog>/)?.[0] ?? "";
  if (!main) throw new Error(`No se encontró <main> en ${file}`);
  const description = decode(
    (legacy ? source.match(/<meta name="description" content="([^"]*)"/)?.[1] : source.match(/description: ([^\n]*?) -->/)?.[1]) ?? "",
  );
  return { ...study, title: study.titles[lang], description, html: rewriteLinks(main, lang), dialog: rewriteLinks(dialog, lang) };
}
