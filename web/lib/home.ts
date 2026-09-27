import { getBook } from "./bible";
import { chapterPath, type Edition, type Lang } from "./i18n";
import { displayVerseText } from "./verse";

// Portada: fotos del hero (Pexels, licencia libre; créditos en la página "Acerca de") y versículos
// para el "versículo del día". Los textos salen del catálogo de cada edición al compilar.
type Ref = { book: string; chapter: number; verse: number };

export const HERO_SLIDES: { image: string; place: Record<Lang, string>; ref: Ref; credit: { author: string; url: string } }[] = [
  {
    image: "/media/hero-neguev.webp",
    place: { es: "Desierto del Néguev", en: "Negev Desert", de: "Wüste Negev" },
    ref: { book: "genesis", chapter: 12, verse: 9 },
    credit: { author: "Ann Perkas", url: "https://www.pexels.com/photo/brown-and-gray-mountains-under-gray-sky-13761590/" },
  },
  {
    image: "/media/hero-galilea.webp",
    place: { es: "Mar de Galilea", en: "Sea of Galilee", de: "See Genezareth" },
    ref: { book: "mateo", chapter: 4, verse: 18 },
    credit: { author: "Mark Direen", url: "https://www.pexels.com/photo/scenic-view-of-galilee-hills-and-sea-33924951/" },
  },
  {
    image: "/media/hero-biblia.webp",
    place: { es: "La Palabra", en: "The Word", de: "Das Wort" },
    ref: { book: "salmos", chapter: 119, verse: 105 },
    credit: { author: "Nothing Ahead", url: "https://www.pexels.com/photo/open-bible-on-the-floor-4567409/" },
  },
];

const DAILY: Ref[] = [
  ["salmos", 23, 1], ["juan", 3, 16], ["filipenses", 4, 13], ["isaias", 40, 31], ["jeremias", 29, 11], ["romanos", 8, 28],
  ["proverbios", 3, 5], ["mateo", 11, 28], ["salmos", 46, 1], ["josue", 1, 9], ["1-corintios", 13, 4], ["genesis", 1, 1],
  ["salmos", 119, 105], ["mateo", 5, 9], ["juan", 14, 27], ["romanos", 12, 2], ["galatas", 5, 22], ["efesios", 2, 8],
  ["hebreos", 11, 1], ["santiago", 1, 5], ["1-juan", 4, 8], ["lamentaciones", 3, 22], ["miqueas", 6, 8], ["isaias", 41, 10],
  ["salmos", 27, 1], ["mateo", 6, 33], ["juan", 8, 12], ["2-timoteo", 1, 7], ["colosenses", 3, 23], ["1-pedro", 5, 7], ["apocalipsis", 21, 4],
].map(([book, chapter, verse]) => ({ book: book as string, chapter: chapter as number, verse: verse as number }));

export type ResolvedVerse = { reference: string; text: string; href: string };

export function resolveVerse(edition: Edition, ref: Ref): ResolvedVerse | null {
  const book = getBook(edition, ref.book);
  const verse = book?.chapters[ref.chapter - 1]?.verses.find((v) => v.number === ref.verse);
  if (!book || !verse) return null;
  return {
    reference: `${book.title} ${ref.chapter}:${ref.verse}`,
    text: displayVerseText(edition, verse),
    href: `${chapterPath(edition, ref.book, ref.chapter)}#verse-${ref.verse}`,
  };
}

export const dailyVerses = (edition: Edition) => DAILY.map((ref) => resolveVerse(edition, ref)).filter((v): v is ResolvedVerse => v !== null);
