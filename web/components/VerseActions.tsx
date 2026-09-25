"use client";

import { useCallback, useEffect, useState } from "react";
import { chapterPath, EDITIONS, t, type Edition } from "@/lib/i18n";
import { copyText } from "@/lib/storage";
import { CloseIcon, CopyIcon, ShareIcon } from "@/components/Icons";

// Tocar (o Enter sobre) un versículo lo selecciona; se pueden elegir varios. Aparece una barra
// flotante para copiar o compartir la cita ("Juan 3:16-17"). También resalta el versículo enlazado
// (#verse-16). Todo se añade en el navegador: el HTML del capítulo lleva solo el texto.
export default function VerseActions({ edition, bookTitle, bookId, chapter }: { edition: Edition; bookTitle: string; bookId: string; chapter: number }) {
  const text = t(EDITIONS[edition].lang);
  const [selected, setSelected] = useState<number[]>([]);
  const [status, setStatus] = useState("");

  const verses = useCallback(() => [...document.querySelectorAll<HTMLElement>(".scripture .v")], []);

  useEffect(() => {
    const list = verses();
    list.forEach((el) => {
      el.tabIndex = 0;
      el.setAttribute("aria-pressed", "false");
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", `${text.selectVerse} ${bookTitle} ${chapter}:${el.id.replace("verse-", "")}`);
    });
    const toggle = (el: HTMLElement) => {
      const n = Number(el.id.replace("verse-", ""));
      setSelected((current) => (current.includes(n) ? current.filter((x) => x !== n) : [...current, n].sort((a, b) => a - b)));
      setStatus("");
    };
    const onClick = (event: MouseEvent) => {
      if (window.getSelection()?.toString()) return; // no molestar a quien selecciona texto para copiarlo
      const el = (event.target as HTMLElement).closest<HTMLElement>(".scripture .v");
      if (el) toggle(el);
    };
    const onKey = (event: KeyboardEvent) => {
      const el = (event.target as HTMLElement).closest<HTMLElement>(".scripture .v");
      if (el && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        toggle(el);
      }
      if (event.key === "Escape") setSelected([]);
    };
    const container = document.querySelector(".scripture");
    container?.addEventListener("click", onClick as EventListener);
    document.addEventListener("keydown", onKey);

    // Versículo enlazado: se centra y se resalta unos segundos.
    const hash = window.location.hash;
    let timer = 0;
    if (/^#verse-\d+$/.test(hash)) {
      const target = document.querySelector<HTMLElement>(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("is-linked");
        target.focus({ preventScroll: true });
        timer = window.setTimeout(() => target.classList.remove("is-linked"), 4000);
      }
    }
    return () => {
      container?.removeEventListener("click", onClick as EventListener);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [verses, text.selectVerse, bookTitle, chapter]);

  useEffect(() => {
    verses().forEach((el) => {
      const on = selected.includes(Number(el.id.replace("verse-", "")));
      el.classList.toggle("is-selected", on);
      el.setAttribute("aria-pressed", String(on));
    });
  }, [selected, verses]);

  // "3:16-18, 20": rangos consecutivos agrupados.
  function reference() {
    const parts: string[] = [];
    for (let i = 0; i < selected.length; i++) {
      const start = selected[i];
      while (i + 1 < selected.length && selected[i + 1] === selected[i] + 1) i++;
      parts.push(start === selected[i] ? `${start}` : `${start}-${selected[i]}`);
    }
    return `${bookTitle} ${chapter}:${parts.join(", ")}`;
  }

  function payload() {
    const body = selected
      .map((n) => document.getElementById(`verse-${n}`)?.textContent?.replace(/^\d+/, "").trim() ?? "")
      .join(" ");
    const url = new URL(`${chapterPath(edition, bookId, chapter)}#verse-${selected[0]}`, window.location.origin).href;
    return { ref: reference(), body, url };
  }

  async function copy() {
    const { ref, body, url } = payload();
    try {
      await copyText(`«${body}» — ${ref}\n${url}`);
      setStatus(`${ref} ${text.copied}`);
    } catch {
      setStatus(text.copyError);
    }
  }

  async function share() {
    const { ref, body, url } = payload();
    try {
      if (navigator.share) {
        await navigator.share({ title: ref, text: `«${body}» — ${ref}`, url });
        setStatus(text.shared);
      } else {
        await copyText(`«${body}» — ${ref}\n${url}`);
        setStatus(`${ref} ${text.copied}`);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") setStatus(text.shareError);
    }
  }

  const open = selected.length > 0;
  return (
    <div className={`verse-bar${open ? " is-open" : ""}`} role="region" aria-label={text.selectedVerses} aria-hidden={!open}>
      <span className="verse-bar-ref">{open ? reference() : ""}</span>
      <button type="button" className="verse-bar-button" onClick={copy} tabIndex={open ? 0 : -1}><CopyIcon size={18} /> {text.copy}</button>
      <button type="button" className="verse-bar-button" onClick={share} tabIndex={open ? 0 : -1}><ShareIcon size={18} /> {text.share}</button>
      <button type="button" className="icon-button" aria-label={text.clearSelection} onClick={() => setSelected([])} tabIndex={open ? 0 : -1}><CloseIcon size={18} /></button>
      <span className="sr-only" role="status" aria-live="polite">{status}</span>
      {status && <span className="verse-bar-status" aria-hidden="true">{status}</span>}
    </div>
  );
}
