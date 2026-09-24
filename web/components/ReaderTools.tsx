"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { copyText, getCompleted, getScale, savePosition, saveScale, toggleCompleted } from "@/lib/storage";

type BookOption = { id: string; title: string; chapters: number };

// Parte interactiva del capítulo. El texto bíblico ya viene en el HTML; esto solo añade
// progreso, tamaño de letra y salto rápido, con las mismas claves de guardado que la versión actual.
export default function ReaderTools({ bookId, bookTitle, chapter, books }: { bookId: string; bookTitle: string; chapter: number; books: BookOption[] }) {
  const router = useRouter();
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
      setStatus("No se pudo guardar en este dispositivo.");
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
        Lectura
      </button>
      <div className={`chapter-actions${menuOpen ? " is-open" : ""}`} id="chapterActionMenu">
        <button className="secondary-button" type="button" data-action="complete" aria-pressed={done} onClick={toggle}>
          {done ? "Completado" : "Marcar como completado"}
        </button>
        <div className="reading-tools">
          <button className="text-size-button" type="button" aria-label="Reducir texto" onClick={() => changeScale(-0.1)}>A-</button>
          <span className="text-size-label">{Math.round(scale * 100)}%</span>
          <button className="text-size-button" type="button" aria-label="Aumentar texto" onClick={() => changeScale(0.1)}>A+</button>
        </div>
        <button
          className="secondary-button"
          type="button"
          data-action="copy"
          onClick={async () => {
            try {
              await copyText(`${bookTitle} ${chapter}`);
              setStatus(`${bookTitle} ${chapter} copiado al portapapeles`);
            } catch {
              setStatus("No se pudo copiar la referencia.");
            }
          }}
        >
          Copiar {bookTitle} {chapter}
        </button>
        <select className="book-select" aria-label="Seleccionar libro" value={bookId} onChange={(event) => router.push(`/leer/${event.target.value}/1/`)}>
          {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
        </select>
        <select className="chapter-select" aria-label="Seleccionar capítulo" value={chapter} onChange={(event) => router.push(`/leer/${bookId}/${event.target.value}/`)}>
          {Array.from({ length: current.chapters }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Capítulo {n}</option>)}
        </select>
      </div>
      <p className="action-status" role="status" aria-live="polite">{status}</p>
    </>
  );
}
