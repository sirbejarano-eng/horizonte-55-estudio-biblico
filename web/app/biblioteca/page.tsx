import type { Metadata } from "next";
import Link from "next/link";
import { chapterHref, getTestaments } from "@/lib/bible";

export const metadata: Metadata = {
  title: "Biblioteca",
  description: "Los 66 libros de la Biblia ordenados para leer capítulo a capítulo y seguir tu progreso en este dispositivo.",
  alternates: { canonical: "/biblioteca/" },
};

// Versión estática: cada libro enlaza a su primer capítulo, así Google y los lectores sin JavaScript
// llegan a todo el texto. El filtro por nombre y el progreso por libro se añaden en la siguiente fase.
export default function LibraryPage() {
  const { antiguo, nuevo } = getTestaments();
  const groups = [
    { id: "old-testament", title: "Antiguo Testamento", other: { id: "new-testament", title: "Nuevo Testamento" }, books: antiguo },
    { id: "new-testament", title: "Nuevo Testamento", other: { id: "old-testament", title: "Antiguo Testamento" }, books: nuevo },
  ];
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Biblioteca</p>
        <h1>Los 66 libros</h1>
        <p>Elige un libro y empieza por el primer capítulo.</p>
      </div>
      <div className="library-index" aria-label="Índice de la biblioteca">
        <strong>Índice</strong>
        {groups.map((group) => (
          <a key={group.id} href={`#${group.id}`}>{group.title} <span>{group.books.length} libros</span></a>
        ))}
      </div>
      {groups.map((group) => (
        <section key={group.id} className="library-section" id={group.id} aria-labelledby={`${group.id}-title`}>
          <div className="library-section-heading">
            <div><h2 id={`${group.id}-title`}>{group.title}</h2></div>
            <div className="library-section-actions">
              <span>{group.books.length} libros</span>
              <a href={`#${group.other.id}`}>{group.other.title}</a>
            </div>
          </div>
          <div className="library-grid-inner">
            {group.books.map((book) => (
              <article key={book.id} className="library-card">
                <div>
                  <p className="eyebrow">{book.chapters.length} capítulos</p>
                  <h3>{book.title}</h3>
                </div>
                <Link className="hero-button" href={chapterHref(book.id, 1)} aria-label={`Abrir ${book.title}`}>Abrir libro</Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
