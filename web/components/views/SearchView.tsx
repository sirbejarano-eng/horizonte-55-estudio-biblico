import type { Metadata } from "next";
import BibleSearch from "@/components/BibleSearch";
import { LANGS, ROUTES, t, type Lang } from "@/lib/i18n";

export const searchMetadata = (lang: Lang): Metadata => ({
  title: t(lang).searchBible,
  description: t(lang).searchDescription,
  alternates: { canonical: ROUTES[lang].search, languages: Object.fromEntries(LANGS.map((l) => [l, ROUTES[l].search])) },
});

export default function SearchView({ lang }: { lang: Lang }) {
  const text = t(lang);
  return (
    <div className="container page page-narrow">
      <header className="page-head">
        <p className="eyebrow">{text.localSearch}</p>
        <h1 className="display-sm">{text.searchBible}</h1>
        <p className="lead">{text.searchHint}</p>
      </header>
      <BibleSearch lang={lang} />
    </div>
  );
}
