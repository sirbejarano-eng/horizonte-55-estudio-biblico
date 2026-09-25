"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";
import { chapterPath, defaultEdition, EDITIONS, ROUTES, t, type Lang } from "@/lib/i18n";
import { getCompleted, getPosition, getSavedLanguage, preferredEdition } from "@/lib/storage";
import type { ResolvedVerse } from "@/lib/home";

type Titles = Record<string, string>;

// "Continuar leyendo": dónde te quedaste y cuánto llevas (solo en este dispositivo).
export function ContinueCard({ lang, titles, chapterCounts, total }: { lang: Lang; titles: Titles; chapterCounts: Record<string, number>; total: number }) {
  const text = t(lang);
  const [state, setState] = useState({ bookId: "genesis", chapter: 1, edition: defaultEdition(lang), done: 0, doneInBook: 0, started: false });

  useEffect(() => {
    const saved = getPosition();
    const valid = saved && titles[saved.bookId] && saved.chapter >= 1 && saved.chapter <= (chapterCounts[saved.bookId] ?? 0) ? saved : null;
    const completed = getCompleted();
    const position = valid ?? { bookId: "genesis", chapter: 1 };
    setState({
      ...position,
      edition: preferredEdition(lang),
      done: Object.values(completed).reduce((sum, list) => sum + list.length, 0),
      doneInBook: completed[position.bookId]?.length ?? 0,
      started: Boolean(valid),
    });
  }, [lang, titles, chapterCounts]);

  const bookTotal = chapterCounts[state.bookId] ?? 1;
  const percent = Math.round((Math.max(state.doneInBook, state.chapter - 1) / bookTotal) * 100);
  return (
    <article className="card continue-card">
      <p className="eyebrow">{state.started ? text.continueReading : text.startHere}</p>
      <h2 className="continue-title">{titles[state.bookId]} {state.chapter}</h2>
      <p className="muted small">{EDITIONS[state.edition].label} · {text.chapter} {state.chapter} {text.of} {bookTotal}</p>
      <div className="progress" role="progressbar" aria-label={`${text.progressIn} ${titles[state.bookId]}`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${percent ? Math.max(percent, 3) : 0}%` }} />
      </div>
      <p className="muted small">{state.done} {text.of} {total} {text.chaptersCompleted}</p>
      <Link className="button button-primary" href={chapterPath(state.edition, state.bookId, state.chapter)}>
        {state.started ? text.continueReading : text.startReading} <ArrowRightIcon size={18} />
      </Link>
    </article>
  );
}

// Un versículo distinto cada día (mismo para todos ese día), elegido de una lista preparada.
export function DailyVerse({ lang, verses }: { lang: Lang; verses: ResolvedVerse[] }) {
  const text = t(lang);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const now = new Date();
    const day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    setIndex(day % verses.length);
  }, [verses.length]);
  const verse = verses[index];
  if (!verse) return null;
  return (
    <article className="card daily-card">
      <p className="eyebrow">{text.verseOfDay}</p>
      <blockquote className="daily-text">
        <p>{verse.text}</p>
      </blockquote>
      <Link className="text-link" href={verse.href}>
        {verse.reference} <ArrowRightIcon size={16} />
      </Link>
    </article>
  );
}

// Quien eligió inglés o alemán en la versión anterior llega a la portada en su idioma.
export function LanguageRedirect() {
  useEffect(() => {
    const saved = getSavedLanguage();
    if (saved && saved !== "es") window.location.replace(ROUTES[saved].home);
  }, []);
  return null;
}
