import type { Metadata } from "next";
import { getBooks } from "@/lib/bible";
import { defaultEdition, LANGS, ROUTES, t, type Lang } from "@/lib/i18n";
import { buildPlans } from "@/lib/plans";
import PlansBrowser from "@/components/PlansBrowser";

export const plansMetadata = (lang: Lang): Metadata => ({
  title: t(lang).plansEyebrow,
  description: t(lang).plansDescription,
  alternates: { canonical: ROUTES[lang].plans, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].plans])) },
});

export default function PlansView({ lang }: { lang: Lang }) {
  const text = t(lang);
  // La estructura de los planes sale siempre del catálogo ONBV (igual en los tres idiomas);
  // solo los nombres de los libros cambian con el idioma.
  const plans = buildPlans(getBooks("onbv").map((book) => ({ id: book.id, verses: book.chapters.map((c) => c.verses.length) })));
  const titles = Object.fromEntries(getBooks(defaultEdition(lang)).map((book) => [book.id, book.title]));
  return (
    <div className="container page">
      <header className="page-head">
        <p className="eyebrow">{text.plansEyebrow}</p>
        <h1 className="display-sm">{text.plansTitle}</h1>
        <p className="lead">{text.plansIntro}</p>
      </header>
      <PlansBrowser lang={lang} plans={plans} titles={titles} />
    </div>
  );
}
