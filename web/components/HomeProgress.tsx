"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompleted, getPosition } from "@/lib/storage";

type Titles = Record<string, string>;

// Lo único personal de la portada: cuántos capítulos llevas y dónde te quedaste (solo en este dispositivo).
export function CompletedCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(Object.values(getCompleted()).reduce((sum, list) => sum + list.length, 0));
  }, []);
  return <>{count === null ? "Catálogo disponible en esta fase" : `Catálogo disponible en esta fase · ${count} capítulos completados en este dispositivo`}</>;
}

export function ContinueReading({ titles, chapterCounts }: { titles: Titles; chapterCounts: Record<string, number> }) {
  const [position, setPosition] = useState({ bookId: "genesis", chapter: 1 });
  useEffect(() => {
    const saved = getPosition();
    if (saved && titles[saved.bookId] && saved.chapter >= 1 && saved.chapter <= (chapterCounts[saved.bookId] ?? 0)) setPosition(saved);
  }, [titles, chapterCounts]);
  return (
    <>
      <h2>{titles[position.bookId]} {position.chapter}</h2>
      <p>Guardado localmente en este dispositivo</p>
      <Link className="hero-button" href={`/leer/${position.bookId}/${position.chapter}/`}>Continuar leyendo</Link>
    </>
  );
}
