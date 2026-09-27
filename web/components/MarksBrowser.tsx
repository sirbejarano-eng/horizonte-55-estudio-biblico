"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { chapterPath, ROUTES, t, type Edition, type Lang } from "@/lib/i18n";
import { CHAPTER_NOTES_KEY, getAllNotes, preferredEdition, saveNote } from "@/lib/storage";
import { localGet, localRemove, localSet } from "@/lib/local-storage";
import {
  deleteVerseNote, getMarks, getVerseNotes, MARKS_EVENT, noteId, removeMark, VERSE_MARKS_KEY, VERSE_NOTES_KEY, type MarkColor,
} from "@/lib/marks";
import { BookmarkFilledIcon, CloseIcon, LibraryIcon, NoteIcon, SearchIcon, TrashIcon } from "@/components/Icons";

type Book = { id: string; title: string };
type Item = {
  key: string;
  kind: "mark" | "verseNote" | "chapterNote";
  book: string;
  chapter: number;
  from: number;
  to: number;
  color?: MarkColor;
  bookmark?: boolean;
  snippet?: string;
  note?: string;
};
type Filter = "all" | "highlights" | "bookmarks" | "notes";

const RAW_KEYS = [VERSE_MARKS_KEY, VERSE_NOTES_KEY, CHAPTER_NOTES_KEY];

function snapshot() {
  const values = RAW_KEYS.map((key) => localGet(key));
  return values.every((result) => result.ok)
    ? values.map((result) => result.ok ? result.value : null)
    : null;
}

function restore(values: (string | null)[]) {
  for (let i = 0; i < RAW_KEYS.length; i++) {
    const result = values[i] === null ? localRemove(RAW_KEYS[i]) : localSet(RAW_KEYS[i], values[i] as string);
    if (!result.ok) return false;
  }
  window.dispatchEvent(new Event(MARKS_EVENT));
  return true;
}

function collect(): Item[] {
  const items: Item[] = [];
  for (const [book, chapters] of Object.entries(getMarks())) {
    for (const [chapter, verses] of Object.entries(chapters)) {
      for (const [verse, mark] of Object.entries(verses)) {
        items.push({ key: `m-${book}-${chapter}-${verse}`, kind: "mark", book, chapter: Number(chapter), from: Number(verse), to: Number(verse), color: mark.c, bookmark: Boolean(mark.b), snippet: mark.s });
      }
    }
  }
  for (const note of Object.values(getVerseNotes())) {
    items.push({ key: `n-${noteId(note.book, note.chapter, note.from)}`, kind: "verseNote", book: note.book, chapter: note.chapter, from: note.from, to: note.to, snippet: note.s, note: note.text });
  }
  for (const [book, chapters] of Object.entries(getAllNotes())) {
    for (const [chapter, text] of Object.entries(chapters ?? {})) {
      if (typeof text === "string" && text.trim()) items.push({ key: `c-${book}-${chapter}`, kind: "chapterNote", book, chapter: Number(chapter), from: 0, to: 0, note: text });
    }
  }
  return items;
}

// "Mis marcas": resaltados, marcadores y notas de todos los libros, en el orden de la Biblia.
// Se leen del almacenamiento local al abrir la página; nada sale del dispositivo.
export default function MarksBrowser({ lang, books }: { lang: Lang; books: Book[] }) {
  const text = t(lang);
  const [items, setItems] = useState<Item[] | null>(null);
  const [edition, setEdition] = useState<Edition>(lang === "es" ? "onbv" : lang);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [undo, setUndo] = useState<(string | null)[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setEdition(preferredEdition(lang));
    const load = () => setItems(collect());
    load();
    window.addEventListener(MARKS_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(MARKS_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, [lang]);

  const order = useMemo(() => Object.fromEntries(books.map((book, i) => [book.id, i])), [books]);
  const titles = useMemo(() => Object.fromEntries(books.map((book) => [book.id, book.title])), [books]);

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      highlights: list.filter((item) => item.color).length,
      bookmarks: list.filter((item) => item.bookmark).length,
      notes: list.filter((item) => item.kind !== "mark").length,
    };
  }, [items]);

  const reference = (item: Item) =>
    item.kind === "chapterNote" ? `${titles[item.book] ?? item.book} ${item.chapter}` : `${titles[item.book] ?? item.book} ${item.chapter}:${item.from}${item.to > item.from ? `-${item.to}` : ""}`;

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(lang);
    return (items ?? [])
      .filter((item) => item.book in order)
      .filter((item) =>
        filter === "all" ? true : filter === "highlights" ? Boolean(item.color) : filter === "bookmarks" ? Boolean(item.bookmark) : item.kind !== "mark",
      )
      .filter((item) => !q || [reference(item), item.snippet ?? "", item.note ?? ""].join(" ").toLocaleLowerCase(lang).includes(q))
      .sort((a, b) => order[a.book] - order[b.book] || a.chapter - b.chapter || a.from - b.from || a.kind.localeCompare(b.kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter, query, order, lang]);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of visible) map.set(item.book, [...(map.get(item.book) ?? []), item]);
    return [...map.entries()];
  }, [visible]);

  function remove(item: Item) {
    const before = snapshot();
    const ok =
      item.kind === "mark" ? removeMark(item.book, item.chapter, item.from)
      : item.kind === "verseNote" ? deleteVerseNote(noteId(item.book, item.chapter, item.from))
      : saveNote(item.book, item.chapter, "");
    if (item.kind === "chapterNote") window.dispatchEvent(new Event(MARKS_EVENT));
    setUndo(ok ? before : null);
    setStatus(ok ? `${reference(item)} · ${text.removedMark}` : text.saveError);
  }

  const href = (item: Item) => `${chapterPath(edition, item.book, item.chapter)}${item.kind === "chapterNote" ? "#chapterNotes" : `#verse-${item.from}`}`;
  const colorName = (c: MarkColor) => text[({ gold: "colorGold", green: "colorGreen", blue: "colorBlue", rose: "colorRose" } as const)[c]];

  if (items === null) return <div className="marks-loading" aria-hidden="true" />;

  if (!items.length) {
    return (
      <div className="card marks-empty">
        <p>{text.marksEmpty}</p>
        <Link className="button button-primary" href={ROUTES[lang].library}><LibraryIcon size={18} /> {text.library}</Link>
      </div>
    );
  }

  const filters: [Filter, string, number][] = [
    ["all", text.filterAll, items.length],
    ["highlights", text.filterHighlights, counts.highlights],
    ["bookmarks", text.filterBookmarks, counts.bookmarks],
    ["notes", text.filterNotes, counts.notes],
  ];

  return (
    <div className="marks">
      <div className="library-toolbar marks-toolbar" role="search" aria-label={text.searchMarks}>
        <label className="search-field">
          <SearchIcon size={18} />
          <span className="sr-only">{text.searchMarks}</span>
          <input type="search" value={query} placeholder={text.searchMarks} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="segmented" role="group" aria-label={text.filterAll}>
          {filters.map(([key, label, n]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label} <span className="segmented-count">{n}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {undo && status && (
        <div className="marks-undo" role="status">
          <span>{status}</span>
          <button type="button" className="button button-ghost" onClick={() => { if (restore(undo)) { setStatus(""); setUndo(null); } else setStatus(text.saveError); }}>{text.undo}</button>
          <button type="button" className="icon-button" aria-label={text.cancel} onClick={() => { setUndo(null); setStatus(""); }}><CloseIcon size={16} /></button>
        </div>
      )}

      {!visible.length && <p className="muted marks-none">{text.marksEmptyFilter}</p>}

      {groups.map(([book, list]) => (
        <section key={book} className="marks-group" aria-labelledby={`marks-${book}`}>
          <h2 id={`marks-${book}`} className="h3 marks-book">{titles[book]}</h2>
          <ul className="marks-list">
            {list.map((item) => (
              <li key={item.key} className={`card mark-item${item.color ? ` mark-${item.color}` : ""}`}>
                <div className="mark-head">
                  <Link className="mark-ref" href={href(item)}>{reference(item)}</Link>
                  <span className="mark-badges">
                    {item.color && <span className={`mark-dot swatch-${item.color}`} title={colorName(item.color)}><span className="sr-only">{text.filterHighlights}: {colorName(item.color)}</span></span>}
                    {item.bookmark && <span className="mark-badge" title={text.bookmark}><BookmarkFilledIcon size={16} /><span className="sr-only">{text.bookmark}</span></span>}
                    {item.kind !== "mark" && <span className="mark-badge" title={item.kind === "chapterNote" ? text.chapterNoteLabel : text.verseNote}><NoteIcon size={16} /><span className="sr-only">{item.kind === "chapterNote" ? text.chapterNoteLabel : text.verseNote}</span></span>}
                  </span>
                  <button type="button" className="icon-button mark-remove" aria-label={`${text.remove}: ${reference(item)}`} title={text.remove} onClick={() => remove(item)}><TrashIcon size={17} /></button>
                </div>
                {item.snippet && <blockquote className="mark-snippet">{item.snippet}</blockquote>}
                {item.kind === "chapterNote" && <p className="mark-kind">{text.chapterNoteLabel}</p>}
                {item.note && <p className="mark-note">{item.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
