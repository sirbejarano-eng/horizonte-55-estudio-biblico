"use client";

import { useEffect, useState } from "react";
import { chapterPath, EDITIONS, t, type Edition } from "@/lib/i18n";

// Un solo componente escucha los botones "Compartir versículo" que ya vienen en el HTML
// (delegación de eventos): así el texto bíblico no necesita JavaScript para mostrarse.
export default function VerseShare({ edition, bookTitle, bookId, chapter }: { edition: Edition; bookTitle: string; bookId: string; chapter: number }) {
  const text = t(EDITIONS[edition].lang);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const container = document.querySelector(".verses");
    if (!container) return;

    async function onClick(event: Event) {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".verse-share");
      if (!button) return;
      const number = Number(button.dataset.verseNumber);
      const verseText = button.closest(".verse")?.querySelector(".verse-text")?.textContent ?? "";
      const reference = `${bookTitle} ${chapter}:${number}`;
      const shareText = `${reference}\n${verseText}`;
      const url = new URL(`${chapterPath(edition, bookId, chapter)}#verse-${number}`, window.location.origin).href;
      try {
        if (navigator.share) {
          await navigator.share({ title: reference, text: shareText, url });
          setStatus(text.shared);
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${shareText}\n${url}`);
          setStatus(`${reference} ${text.copied}`);
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`, "_blank", "noopener");
          setStatus(text.shared);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus(text.shareError);
      }
    }

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [edition, bookTitle, bookId, chapter, text]);

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
