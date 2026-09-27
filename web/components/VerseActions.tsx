"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chapterPath, EDITIONS, t, type Edition } from "@/lib/i18n";
import { copyText } from "@/lib/storage";
import {
  getChapterMarks, getChapterVerseNotes, MARK_COLORS, MARKS_EVENT, MAX_VERSE_NOTE_LENGTH, noteId, saveVerseNote,
  setBookmark, setHighlight, type MarkColor, type VerseMark, type VerseNote,
} from "@/lib/marks";
import { BookmarkFilledIcon, BookmarkIcon, CloseIcon, CopyIcon, NoteIcon, ShareIcon } from "@/components/Icons";

const COLOR_LABEL = { gold: "colorGold", green: "colorGreen", blue: "colorBlue", rose: "colorRose" } as const;

// Tocar (o Enter sobre) un versículo lo selecciona; se pueden elegir varios. Aparece una barra
// flotante para resaltar en color, poner un marcador, escribir una nota, copiar o compartir la cita
// ("Juan 3:16-17"). También resalta el versículo enlazado (#verse-16). Todo se añade en el
// navegador: el HTML del capítulo lleva solo el texto.
export default function VerseActions({ edition, bookTitle, bookId, chapter }: { edition: Edition; bookTitle: string; bookId: string; chapter: number }) {
  const text = t(EDITIONS[edition].lang);
  const [selected, setSelected] = useState<number[]>([]);
  const [status, setStatus] = useState("");
  const [marks, setMarks] = useState<Record<string, VerseMark>>({});
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [editor, setEditor] = useState<{ from: number; to: number; text: string; exists: boolean } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const verses = useCallback(() => [...document.querySelectorAll<HTMLElement>(".scripture .v")], []);
  const verseText = (n: number) => document.getElementById(`verse-${n}`)?.textContent?.replace(/^\d+/, "").trim() ?? "";

  // Marcas guardadas de este capítulo (y de nuevo si cambian en otra parte, p. ej. "Mis marcas").
  useEffect(() => {
    const load = () => {
      setMarks(getChapterMarks(bookId, chapter));
      setNotes(getChapterVerseNotes(bookId, chapter));
    };
    load();
    window.addEventListener(MARKS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(MARKS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, [bookId, chapter]);

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
      if (event.key === "Escape" && !dialog.current?.open) setSelected([]);
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

  // Selección, colores, marcadores y notas se dibujan como clases sobre los versículos.
  useEffect(() => {
    const noted = new Set<number>();
    notes.forEach((note) => { for (let n = note.from; n <= note.to; n++) noted.add(n); });
    verses().forEach((el) => {
      const n = Number(el.id.replace("verse-", ""));
      const mark = marks[String(n)];
      const on = selected.includes(n);
      el.classList.toggle("is-selected", on);
      el.setAttribute("aria-pressed", String(on));
      for (const color of MARK_COLORS) el.classList.toggle(`hl-${color}`, mark?.c === color);
      el.classList.toggle("is-bookmarked", Boolean(mark?.b));
      el.classList.toggle("has-note", noted.has(n));
    });
  }, [selected, marks, notes, verses]);

  // "3:16-18, 20": rangos consecutivos agrupados.
  function reference(list = selected) {
    const parts: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const start = list[i];
      while (i + 1 < list.length && list[i + 1] === list[i] + 1) i++;
      parts.push(start === list[i] ? `${start}` : `${start}-${list[i]}`);
    }
    return `${bookTitle} ${chapter}:${parts.join(", ")}`;
  }

  function payload() {
    const body = selected.map(verseText).join(" ");
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

  const items = () => selected.map((n) => ({ n, text: verseText(n) }));
  const currentColor = selected.length && selected.every((n) => marks[String(n)]?.c === marks[String(selected[0])]?.c) ? marks[String(selected[0])]?.c : undefined;
  const allBookmarked = selected.length > 0 && selected.every((n) => marks[String(n)]?.b);
  const existingNote = selected.length ? notes.find((note) => note.from === selected[0]) : undefined;

  function color(next: MarkColor) {
    const remove = currentColor === next;
    const ok = setHighlight(bookId, chapter, items(), remove ? null : next);
    setStatus(!ok ? text.saveError : remove ? text.highlightRemoved : `${reference()} ${text.highlighted}`);
  }

  function bookmark() {
    const ok = setBookmark(bookId, chapter, items(), !allBookmarked);
    setStatus(!ok ? text.saveError : allBookmarked ? text.bookmarkRemoved : text.bookmarkAdded);
  }

  function openNote() {
    const from = selected[0];
    const to = existingNote?.to ?? selected[selected.length - 1];
    setEditor({ from, to, text: existingNote?.text ?? "", exists: Boolean(existingNote) });
  }

  function closeNote() {
    setEditor(null);
  }

  // La ventana se abre y se cierra según el estado del editor (nunca queda abierta y vacía).
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (editor && !d.open) {
      d.showModal();
      d.querySelector("textarea")?.focus();
    } else if (!editor && d.open) d.close();
  }, [editor]);

  function saveNote(value: string) {
    if (!editor) return;
    const ok = saveVerseNote({ book: bookId, chapter, from: editor.from, to: editor.to, text: value, s: verseText(editor.from) });
    setStatus(!ok ? text.saveError : value.trim() ? text.noteSaved : text.noteDeleted);
    closeNote();
  }

  const open = selected.length > 0;
  const noteRange = editor ? `${bookTitle} ${chapter}:${editor.from}${editor.to > editor.from ? `-${editor.to}` : ""}` : "";
  return (
    <>
      <div className={`verse-bar${open ? " is-open" : ""}`} role="region" aria-label={text.selectedVerses} aria-hidden={!open}>
        <span className="verse-bar-ref">{open ? reference() : ""}</span>
        <div className="verse-bar-tools">
          <div className="swatches" role="group" aria-label={text.highlight}>
            {MARK_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch swatch-${c}`}
                aria-pressed={currentColor === c}
                aria-label={currentColor === c ? `${text.removeHighlight} (${text[COLOR_LABEL[c]]})` : `${text.highlight}: ${text[COLOR_LABEL[c]]}`}
                title={text[COLOR_LABEL[c]]}
                onClick={() => color(c)}
                tabIndex={open ? 0 : -1}
              />
            ))}
          </div>
          <span className="verse-bar-sep" aria-hidden="true" />
          <button type="button" className="verse-bar-button" aria-pressed={allBookmarked} onClick={bookmark} tabIndex={open ? 0 : -1} title={allBookmarked ? text.removeBookmark : text.addBookmark}>
            {allBookmarked ? <BookmarkFilledIcon size={18} /> : <BookmarkIcon size={18} />} <span className="verse-bar-label">{allBookmarked ? text.removeBookmark : text.bookmark}</span>
          </button>
          <button type="button" className="verse-bar-button" onClick={openNote} tabIndex={open ? 0 : -1} title={existingNote ? text.editNote : text.addNote}>
            <NoteIcon size={18} /> <span className="verse-bar-label">{existingNote ? text.editNote : text.verseNote}</span>
          </button>
          <button type="button" className="verse-bar-button" onClick={copy} tabIndex={open ? 0 : -1} title={text.copy}><CopyIcon size={18} /> <span className="verse-bar-label">{text.copy}</span></button>
          <button type="button" className="verse-bar-button" onClick={share} tabIndex={open ? 0 : -1} title={text.share}><ShareIcon size={18} /> <span className="verse-bar-label">{text.share}</span></button>
        </div>
        <button type="button" className="icon-button verse-bar-close" aria-label={text.clearSelection} onClick={() => setSelected([])} tabIndex={open ? 0 : -1}><CloseIcon size={18} /></button>
        <span className="sr-only" role="status" aria-live="polite">{status}</span>
        {status && <span className="verse-bar-status" aria-hidden="true">{status}</span>}
      </div>

      <dialog ref={dialog} className="note-dialog" aria-labelledby="note-dialog-title" onClose={() => setEditor(null)} onClick={(event) => { if (event.target === dialog.current) closeNote(); }}>
        {editor && (
          <form
            method="dialog"
            className="note-dialog-body"
            onSubmit={(event) => {
              event.preventDefault();
              saveNote(new FormData(event.currentTarget).get("note") as string);
            }}
          >
            <p className="eyebrow">{editor.exists ? text.editNote : text.addNote}</p>
            <h2 id="note-dialog-title" className="h3">{text.noteOn} {noteRange}</h2>
            <blockquote className="note-dialog-verse">{verseText(editor.from)}{editor.to > editor.from ? " …" : ""}</blockquote>
            <textarea name="note" className="notes-field" rows={6} maxLength={MAX_VERSE_NOTE_LENGTH} defaultValue={editor.text} placeholder={text.verseNotePlaceholder} aria-label={`${text.noteOn} ${noteRange}`} />
            <div className="note-dialog-actions">
              {editor.exists && <button type="button" className="button button-ghost note-delete" onClick={() => saveNote("")}>{text.deleteNote}</button>}
              <span className="spacer" />
              <button type="button" className="button button-ghost" onClick={closeNote}>{text.cancel}</button>
              <button type="submit" className="button button-primary">{text.save}</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

// Notas por versículo del capítulo, bajo el texto: cada una enlaza a su versículo y se puede editar
// seleccionándolo. Se actualiza sola cuando cambian las marcas.
export function ChapterVerseNotes({ edition, bookTitle, bookId, chapter }: { edition: Edition; bookTitle: string; bookId: string; chapter: number }) {
  const text = t(EDITIONS[edition].lang);
  const [notes, setNotes] = useState<VerseNote[]>([]);
  useEffect(() => {
    const load = () => setNotes(getChapterVerseNotes(bookId, chapter));
    load();
    window.addEventListener(MARKS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(MARKS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, [bookId, chapter]);
  if (!notes.length) return null;
  return (
    <section className="verse-notes" aria-labelledby="verse-notes-title">
      <h2 id="verse-notes-title" className="h3">{text.filterNotes}</h2>
      <ul>
        {notes.map((note) => (
          <li key={noteId(note.book, note.chapter, note.from)}>
            <a href={`#verse-${note.from}`} className="verse-notes-ref">{bookTitle} {chapter}:{note.from}{note.to > note.from ? `-${note.to}` : ""}</a>
            <p>{note.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
