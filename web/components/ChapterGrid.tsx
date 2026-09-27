"use client";

import Link from "next/link";
import { chapterPath, type Edition } from "@/lib/i18n";

// Cuadrícula con todos los capítulos de un libro: el actual resaltado y los completados marcados.
export default function ChapterGrid({ edition, bookId, chapters, current, completed, label, onPick }: {
  edition: Edition; bookId: string; chapters: number; current?: number; completed: number[]; label: string; onPick?: () => void;
}) {
  const done = new Set(completed);
  return (
    <nav aria-label={label}>
      <ol className="chapter-grid">
        {Array.from({ length: chapters }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={chapterPath(edition, bookId, n)}
              className={done.has(n) ? "is-done" : undefined}
              aria-current={n === current ? "page" : undefined}
              onClick={onPick}
            >
              {n}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
