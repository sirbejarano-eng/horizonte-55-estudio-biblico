"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { chapterPath, t, type Edition, type Lang } from "@/lib/i18n";
import { getCompleted } from "@/lib/storage";

export type LibraryBook = { id: string; title: string; chapters: number; testament: "old-testament" | "new-testament" };

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Tolera una letra de más, de menos o cambiada ("Mateo" ↔ "Mato"), igual que library.js.
function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = a[i - 1] === b[j - 1] ? previous : Math.min(previous + 1, row[j - 1] + 1, current + 1);
      previous = current;
    }
  }
  return row[b.length];
}

function score(title: string, query: string) {
  const name = normalize(title);
  const q = normalize(query);
  if (!q) return 0;
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  if (q.length >= 4 && name.split(/\s+/).some((word) => editDistance(word, q) <= 1)) return 3;
  return 99;
}

// Índice de la biblioteca con filtro por testamento y nombre, y avance por libro. El listado completo
// sale en el HTML del servidor (sin JavaScript se ve igual); el avance se añade al cargar.
export default function LibraryBrowser({ lang, edition, books }: { lang: Lang; edition: Edition; books: LibraryBook[] }) {
  const text = t(lang);
  const [testament, setTestament] = useState<"all" | LibraryBook["testament"]>("all");
  const [query, setQuery] = useState("");
  const [completed, setCompleted] = useState<Record<string, number[]> | null>(null);

  useEffect(() => {
    const refresh = () => setCompleted(getCompleted());
    refresh();
    // El gestor de progreso avisa tras importar o deshacer.
    window.addEventListener("h55-progress-changed", refresh);
    return () => window.removeEventListener("h55-progress-changed", refresh);
  }, []);

  const groups = useMemo(() => {
    const visible = books
      .filter((book) => testament === "all" || book.testament === testament)
      .map((book) => ({ book, score: score(book.title, query) }))
      .filter((item) => item.score < 99)
      .sort((a, b) => a.score - b.score)
      .map((item) => item.book);
    return (["old-testament", "new-testament"] as const).map((id) => ({
      id,
      title: id === "old-testament" ? text.oldTestament : text.newTestament,
      description: id === "old-testament" ? text.oldDescription : text.newDescription,
      other: id === "old-testament" ? { id: "new-testament", title: text.newTestament } : { id: "old-testament", title: text.oldTestament },
      total: books.filter((book) => book.testament === id).length,
      books: visible.filter((book) => book.testament === id),
    }));
  }, [books, testament, query, text]);

  const totalChapters = books.reduce((sum, book) => sum + book.chapters, 0);
  const done = completed ? Object.values(completed).reduce((sum, list) => sum + list.length, 0) : null;
  const empty = groups.every((group) => group.books.length === 0);

  return (
    <>
      <section className="library-filters" aria-label={text.searchBookLabel}>
        <div>
          <label htmlFor="testamentFilter">{text.testament}</label>
          <select id="testamentFilter" value={testament} onChange={(event) => setTestament(event.target.value as typeof testament)}>
            <option value="all">{text.allBooks}</option>
            <option value="old-testament">{text.oldTestament}</option>
            <option value="new-testament">{text.newTestament}</option>
          </select>
        </div>
        <div className="book-filter-field">
          <label htmlFor="bookFilter">{text.searchBook}</label>
          <input id="bookFilter" type="search" autoComplete="off" placeholder={text.searchBookPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </section>

      <div id="libraryGrid" className="library-grid">
        <div className="library-index" aria-label={text.libraryIndexLabel}>
          <strong>{text.index}</strong>
          {groups.map((group) => (
            <a key={group.id} href={`#${group.id}`}>{group.title} <span>{group.total} {text.books}</span></a>
          ))}
        </div>
        {done !== null && <p className="library-summary">{done} {text.of} {totalChapters} {text.chaptersCompleted}</p>}
        {empty && <p className="empty-state" role="status">{text.noBook}</p>}
        {groups.map((group) =>
          group.books.length === 0 ? null : (
            <section key={group.id} className="library-section" id={group.id} aria-labelledby={`${group.id}-title`}>
              <div className="library-section-heading">
                <div>
                  <p className="eyebrow">{group.description}</p>
                  <h2 id={`${group.id}-title`}>{group.title}</h2>
                </div>
                <div className="library-section-actions">
                  <span>{group.books.length} {text.books}</span>
                  <a href={`#${group.other.id}`}>{group.other.title}</a>
                </div>
              </div>
              <div className="library-grid-inner">
                {group.books.map((book) => (
                  <article key={book.id} className="library-card">
                    <div>
                      <p className="eyebrow">
                        {completed ? `${completed[book.id]?.length ?? 0}/${book.chapters}` : book.chapters} {text.chapters}
                      </p>
                      <h3>{book.title}</h3>
                    </div>
                    <Link className="hero-button" href={chapterPath(edition, book.id, 1)} aria-label={`${text.open} ${book.title}`}>{text.openBook}</Link>
                  </article>
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </>
  );
}
