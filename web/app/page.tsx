import Link from "next/link";
import { getBooks, totalChapters } from "@/lib/bible";
import { CompletedCount, ContinueReading } from "@/components/HomeProgress";

export default function HomePage() {
  const books = getBooks();
  const titles = Object.fromEntries(books.map((book) => [book.id, book.title]));
  const chapterCounts = Object.fromEntries(books.map((book) => [book.id, book.chapters.length]));
  return (
    <>
      <section className="home-hero">
        <div>
          <p className="eyebrow hero-eyebrow">Tu mesa de estudio</p>
          <h1>Lee. Anota. Vuelve a la fuente.</h1>
          <p>Una biblioteca personal para recorrer las Escrituras capítulo a capítulo, con tus propias preguntas y ritmo.</p>
          <div className="hero-actions">
            <Link className="hero-button" href="/biblioteca/">Biblioteca</Link>
            <Link className="hero-link" href="/buscar/">Buscar en la Biblia</Link>
          </div>
        </div>
        <div className="hero-stats">
          <strong>{books.length} libros · {totalChapters()} capítulos</strong>
          <span><CompletedCount /></span>
        </div>
      </section>
      <section className="home-grid">
        <article className="feature-panel">
          <p className="eyebrow">Lectura</p>
          <ContinueReading titles={titles} chapterCounts={chapterCounts} />
        </article>
        <article className="feature-panel daily-home">
          <p className="eyebrow">Línea de tiempo</p>
          <h2>Una historia en movimiento</h2>
          <p>Sitúa Egipto, Jerusalén, Canaán y Mesopotamia antes de volver al texto.</p>
          <a className="hero-link dark-link" href="/cronologia.html">Línea de tiempo</a>
        </article>
      </section>
    </>
  );
}
