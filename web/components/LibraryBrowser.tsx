"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { chapterPath, t, type Edition, type Lang } from "@/lib/i18n";
import { getCompleted } from "@/lib/storage";
import { CheckIcon, SearchIcon } from "@/components/Icons";

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

  // Si el libro está empezado, la tarjeta lleva al primer capítulo sin completar.
  const hrefFor = (book: LibraryBook) => {
    const read = new Set(completed?.[book.id] ?? []);
    let next = 1;
    while (read.has(next) && next < book.chapters) next++;
    return chapterPath(edition, book.id, next);
  };
  const percentAll = done !== null ? Math.round((done / totalChapters) * 100) : 0;

  return (
    <>
      <div className="library-toolbar" role="search" aria-label={text.searchBookLabel}>
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">{text.searchBook}</span>
          <input id="bookFilter" type="search" autoComplete="off" placeholder={text.searchBookPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="segmented" role="group" aria-label={text.testament}>
          {([["all", text.allBooks], ["old-testament", text.oldTestament], ["new-testament", text.newTestament]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={testament === value} onClick={() => setTestament(value)}>{label}</button>
          ))}
        </div>
      </div>

      {done !== null && (
        <div className="library-summary">
          <div className="progress" role="progressbar" aria-label={text.chaptersCompleted} aria-valuenow={percentAll} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${done ? Math.max(percentAll, 1) : 0}%` }} />
          </div>
          <p className="muted small">{done.toLocaleString(lang)} {text.of} {totalChapters.toLocaleString(lang)} {text.chaptersCompleted}</p>
        </div>
      )}
      {empty && <p className="empty-state" role="status">{text.noBook}</p>}

      {groups.map((group) =>
        group.books.length === 0 ? null : (
          <section key={group.id} className="library-section" id={group.id} aria-labelledby={`${group.id}-title`}>
            <div className="section-heading section-heading-row">
              <div>
                <p className="eyebrow">{group.description}</p>
                <h2 id={`${group.id}-title`} className="h2">{group.title}</h2>
              </div>
              <p className="muted small">{group.books.length} {text.books}</p>
            </div>
            <div className="book-grid">
              {group.books.map((book) => {
                const read = completed?.[book.id]?.length ?? 0;
                const pct = Math.round((read / book.chapters) * 100);
                return (
                  <Link key={book.id} href={hrefFor(book)} className={`book-card${read === book.chapters ? " is-complete" : ""}`}>
                    <span className="book-card-title">{book.title}</span>
                    <span className="book-card-meta">
                      {completed && read > 0 ? `${read}/${book.chapters}` : book.chapters} {text.chapters}
                      {read === book.chapters && <CheckIcon size={16} />}
                    </span>
                    <span className="book-card-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
                  </Link>
                );
              })}
            </div>
          </section>
        ),
      )}
    </>
  );
}
