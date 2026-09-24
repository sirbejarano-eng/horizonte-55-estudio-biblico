"use client";

import { useEffect, useState } from "react";

// Un solo componente escucha los botones "Compartir versículo" que ya vienen en el HTML
// (delegación de eventos): así el texto bíblico no necesita JavaScript para mostrarse.
export default function VerseShare({ bookTitle, bookId, chapter }: { bookTitle: string; bookId: string; chapter: number }) {
  const [status, setStatus] = useState("");

  useEffect(() => {
    const container = document.querySelector(".verses");
    if (!container) return;

    async function onClick(event: Event) {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".verse-share");
      if (!button) return;
      const number = Number(button.dataset.verseNumber);
      const text = button.closest(".verse")?.querySelector(".verse-text")?.textContent ?? "";
      const reference = `${bookTitle} ${chapter}:${number}`;
      const shareText = `${reference}\n${text}`;
      const url = new URL(`/leer/${bookId}/${chapter}/#verse-${number}`, window.location.origin).href;
      try {
        if (navigator.share) {
          await navigator.share({ title: reference, text: shareText, url });
          setStatus("Versículo preparado para compartir");
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${shareText}\n${url}`);
          setStatus(`${reference} copiado al portapapeles`);
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`, "_blank", "noopener");
          setStatus("Versículo preparado para compartir");
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("No se pudo compartir el versículo.");
      }
    }

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [bookTitle, bookId, chapter]);

  // Resalta el versículo enlazado (#verse-7) igual que la versión actual.
  useEffect(() => {
    const hash = window.location.hash;
    if (!/^#verse-\d+$/.test(hash)) return;
    const target = document.querySelector<HTMLElement>(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("verse-highlight");
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    const timer = window.setTimeout(() => target.classList.remove("verse-highlight"), 4000);
    return () => window.clearTimeout(timer);
  }, [bookId, chapter]);

  return <p className="action-status" role="status" aria-live="polite">{status}</p>;
}
