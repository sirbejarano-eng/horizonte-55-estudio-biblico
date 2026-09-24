"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { chapterPath, EDITIONS, t, type Edition } from "@/lib/i18n";
import { copyText, getCompleted, getScale, savePosition, saveScale, toggleCompleted } from "@/lib/storage";

type BookOption = { id: string; title: string; chapters: number };

// Parte interactiva del capítulo. El texto bíblico ya viene en el HTML; esto solo añade
// progreso, tamaño de letra y salto rápido, con las mismas claves de guardado que la versión actual.
// El progreso es común a todas las ediciones (se guarda por libro y capítulo, igual que antes).
export default function ReaderTools({ edition, bookId, bookTitle, chapter, books }: { edition: Edition; bookId: string; bookTitle: string; chapter: number; books: BookOption[] }) {
  const router = useRouter();
  const text = t(EDITIONS[edition].lang);
  const [done, setDone] = useState(false);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const current = books.find((book) => book.id === bookId)!;

  useEffect(() => {
    savePosition(bookId, chapter);
    setDone(getCompleted()[bookId]?.includes(chapter) ?? false);
    setScale(getScale());
  }, [bookId, chapter]);

  useEffect(() => {
    document.documentElement.style.setProperty("--verse-font-size", `${scale}rem`);
  }, [scale]);

  function changeScale(delta: number) {
    const next = Math.min(1.3, Math.max(0.9, Number((scale + delta).toFixed(1))));
    setScale(next);
    saveScale(next);
  }

  function toggle() {
    const result = toggleCompleted(bookId, chapter);
    if (result) {
      setDone(result[bookId]?.includes(chapter) ?? false);
      setStatus("");
    } else {
      setStatus(text.saveError);
    }
  }

  return (
    <>
      <button
        className="chapter-menu-toggle secondary-button"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="chapterActionMenu"
        onClick={() => setMenuOpen((value) => !value)}
      >
        {text.reader}
      </button>
      <div className={`chapter-actions${menuOpen ? " is-open" : ""}`} id="chapterActionMenu">
        <button className="secondary-button" type="button" data-action="complete" aria-pressed={done} onClick={toggle}>
          {done ? text.completed : text.complete}
        </button>
        <div className="reading-tools">
          <button className="text-size-button" type="button" aria-label={text.reduceText} onClick={() => changeScale(-0.1)}>A-</button>
          <span className="text-size-label">{Math.round(scale * 100)}%</span>
          <button className="text-size-button" type="button" aria-label={text.increaseText} onClick={() => changeScale(0.1)}>A+</button>
        </div>
        <button
          className="secondary-button"
          type="button"
          data-action="copy"
          onClick={async () => {
            try {
              await copyText(`${bookTitle} ${chapter}`);
              setStatus(`${bookTitle} ${chapter} ${text.copied}`);
            } catch {
              setStatus(text.copyError);
            }
          }}
        >
          {text.copy} {bookTitle} {chapter}
        </button>
        <select className="book-select" aria-label={text.chooseBook} value={bookId} onChange={(event) => router.push(chapterPath(edition, event.target.value, 1))}>
          {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
        </select>
        <select className="chapter-select" aria-label={text.chooseChapter} value={chapter} onChange={(event) => router.push(chapterPath(edition, bookId, Number(event.target.value)))}>
          {Array.from({ length: current.chapters }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{text.chapter} {n}</option>)}
        </select>
      </div>
      <p className="action-status" role="status" aria-live="polite">{status}</p>
    </>
  );
}
