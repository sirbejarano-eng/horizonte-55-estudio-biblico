"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { chapterPath, defaultEdition, ROUTES, t, type Lang } from "@/lib/i18n";
import { getCompleted, getPosition, getSavedLanguage, preferredEdition } from "@/lib/storage";

type Titles = Record<string, string>;

// Lo único personal de la portada: cuántos capítulos llevas y dónde te quedaste (solo en este dispositivo).
export function CompletedCount({ lang }: { lang: Lang }) {
  const text = t(lang);
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(Object.values(getCompleted()).reduce((sum, list) => sum + list.length, 0));
  }, []);
  return <>{count === null ? text.catalogPhase : `${text.catalogPhase} · ${count} ${text.chaptersCompleted}`}</>;
}

export function ContinueReading({ lang, titles, chapterCounts }: { lang: Lang; titles: Titles; chapterCounts: Record<string, number> }) {
  const text = t(lang);
  const [position, setPosition] = useState({ bookId: "genesis", chapter: 1 });
  const [href, setHref] = useState(chapterPath(defaultEdition(lang), "genesis", 1));
  useEffect(() => {
    const saved = getPosition();
    const valid = saved && titles[saved.bookId] && saved.chapter >= 1 && saved.chapter <= (chapterCounts[saved.bookId] ?? 0) ? saved : { bookId: "genesis", chapter: 1 };
    setPosition(valid);
    setHref(chapterPath(preferredEdition(lang), valid.bookId, valid.chapter));
  }, [lang, titles, chapterCounts]);
  return (
    <>
      <h2>{titles[position.bookId]} {position.chapter}</h2>
      <p>{text.savedLocally}</p>
      <Link className="hero-button" href={href}>{text.continueReading}</Link>
    </>
  );
}

// Quien eligió inglés o alemán en la versión actual llega a la portada en su idioma.
export function LanguageRedirect() {
  useEffect(() => {
    const saved = getSavedLanguage();
    if (saved && saved !== "es") window.location.replace(ROUTES[saved].home);
  }, []);
  return null;
}
