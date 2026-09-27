import type { Metadata } from "next";
import { getBooks } from "@/lib/bible";
import { defaultEdition, LANGS, ROUTES, t, type Lang } from "@/lib/i18n";
import MarksBrowser from "@/components/MarksBrowser";

export const marksMetadata = (lang: Lang): Metadata => ({
  title: t(lang).marks,
  description: t(lang).marksDescription,
  // Página personal (lo que muestra está solo en el dispositivo): no se indexa.
  robots: { index: false, follow: true },
  alternates: { canonical: ROUTES[lang].marks, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].marks])) },
});

export default function MarksView({ lang }: { lang: Lang }) {
  const text = t(lang);
  const books = getBooks(defaultEdition(lang)).map((book) => ({ id: book.id, title: book.title }));
  return (
    <div className="container page">
      <header className="page-head">
        <p className="eyebrow">{text.marks}</p>
        <h1 className="display-sm">{text.marksTitle}</h1>
        <p className="lead">{text.marksIntro}</p>
      </header>
      <MarksBrowser lang={lang} books={books} />
    </div>
  );
}
