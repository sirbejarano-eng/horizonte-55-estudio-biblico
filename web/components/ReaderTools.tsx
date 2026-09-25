"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATALOG_VERSION, chapterPath, EDITIONS, t, type Edition } from "@/lib/i18n";
import { copyText, getCompleted, getScale, savePosition, saveScale, toggleCompleted } from "@/lib/storage";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CircleIcon, CopyIcon } from "@/components/Icons";

type BookOption = { id: string; title: string; chapters: number };

// El índice de libros (títulos y nº de capítulos) se descarga una vez por edición y queda en caché,
// en vez de repetirse dentro de cada una de las 4.756 páginas.
const indexCache = new Map<Edition, Promise<BookOption[]>>();
function loadIndex(edition: Edition) {
  if (!indexCache.has(edition)) {
    indexCache.set(edition, fetch(`/content/index-${edition}.json?v=${CATALOG_VERSION}`).then((r) => (r.ok ? r.json() : [])).catch(() => []));
  }
  return indexCache.get(edition)!;
}

// Panel "Tu lectura" (escritorio) y barra inferior (móvil). Progreso, tamaño de letra, salto rápido
// y atajos de teclado (← →), con las mismas claves de guardado que la versión anterior.
export default function ReaderTools({
  edition, bookId, bookTitle, chapter, chapterCount, prevHref, nextHref,
}: { edition: Edition; bookId: string; bookTitle: string; chapter: number; chapterCount: number; prevHref: string | null; nextHref: string | null }) {
  const router = useRouter();
  const text = t(EDITIONS[edition].lang);
  const [done, setDone] = useState(false);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState("");
  const [books, setBooks] = useState<BookOption[]>([{ id: bookId, title: bookTitle, chapters: chapterCount }]);

  useEffect(() => {
    savePosition(bookId, chapter);
    setDone(getCompleted()[bookId]?.includes(chapter) ?? false);
    setScale(getScale());
    setStatus("");
  }, [bookId, chapter]);

  useEffect(() => {
    let alive = true;
    loadIndex(edition).then((list) => alive && list.length && setBooks(list));
    return () => {
      alive = false;
    };
  }, [edition]);

  useEffect(() => {
    document.documentElement.style.setProperty("--reading-scale", String(scale));
  }, [scale]);

  // ← y → cambian de capítulo (salvo mientras se escribe en un campo).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.altKey || event.ctrlKey || event.metaKey || target.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft" && prevHref) router.push(prevHref);
      if (event.key === "ArrowRight" && nextHref) router.push(nextHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, router]);

  function changeScale(delta: number) {
    const next = Math.min(1.3, Math.max(0.9, Number((scale + delta).toFixed(1))));
    setScale(next);
    saveScale(next);
  }

  function toggle() {
    const result = toggleCompleted(bookId, chapter);
    if (result) {
      const now = result[bookId]?.includes(chapter) ?? false;
      setDone(now);
      setStatus(now ? text.markedDone : "");
    } else {
      setStatus(text.saveError);
    }
  }

  async function copyReference() {
    try {
      await copyText(`${bookTitle} ${chapter}`);
      setStatus(`${bookTitle} ${chapter} ${text.copied}`);
    } catch {
      setStatus(text.copyError);
    }
  }

  const current = books.find((book) => book.id === bookId) ?? { id: bookId, title: bookTitle, chapters: chapterCount };
  const completeLabel = done ? text.completed : text.complete;

  return (
    <>
      <aside className="reader-aside" aria-label={text.yourReading}>
        <div className="reader-panel">
          <p className="eyebrow">{text.yourReading}</p>
          <div className="picker">
            <label>
              <span className="sr-only">{text.chooseBook}</span>
              <select className="select" value={bookId} onChange={(event) => router.push(chapterPath(edition, event.target.value, 1))}>
                {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">{text.chooseChapter}</span>
              <select className="select select-narrow" value={chapter} onChange={(event) => router.push(chapterPath(edition, bookId, Number(event.target.value)))}>
                {Array.from({ length: current.chapters }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <button type="button" className={`button button-block ${done ? "button-primary" : "button-outline"}`} aria-pressed={done} onClick={toggle}>
            {done ? <CheckIcon size={18} /> : <CircleIcon size={18} />} {completeLabel}
          </button>
          <div className="size-control" role="group" aria-label={text.textSize}>
            <button type="button" className="icon-button" aria-label={text.reduceText} onClick={() => changeScale(-0.1)} disabled={scale <= 0.9}>A−</button>
            <span>{Math.round(scale * 100)} %</span>
            <button type="button" className="icon-button" aria-label={text.increaseText} onClick={() => changeScale(0.1)} disabled={scale >= 1.3}>A+</button>
          </div>
          <button type="button" className="button button-ghost button-block" onClick={copyReference}>
            <CopyIcon size={18} /> {text.copy} {bookTitle} {chapter}
          </button>
          <p className="muted small reader-hint">{text.readerHint}</p>
          <p className="action-status" role="status" aria-live="polite">{status}</p>
        </div>
      </aside>

      <div className="reader-bar" role="toolbar" aria-label={text.yourReading}>
        {prevHref ? <Link className="icon-button" href={prevHref} aria-label={text.previous}><ArrowLeftIcon /></Link> : <span className="icon-button" aria-hidden="true" />}
        <button type="button" className="icon-button" aria-label={text.reduceText} onClick={() => changeScale(-0.1)} disabled={scale <= 0.9}>A−</button>
        <button type="button" className={`reader-bar-main${done ? " is-done" : ""}`} aria-pressed={done} onClick={toggle}>
          {done ? <CheckIcon size={18} /> : <CircleIcon size={18} />} {completeLabel}
        </button>
        <button type="button" className="icon-button" aria-label={text.increaseText} onClick={() => changeScale(0.1)} disabled={scale >= 1.3}>A+</button>
        {nextHref ? <Link className="icon-button" href={nextHref} aria-label={text.next}><ArrowRightIcon /></Link> : <span className="icon-button" aria-hidden="true" />}
      </div>
    </>
  );
}
