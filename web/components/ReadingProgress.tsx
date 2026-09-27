"use client";

import { useEffect, useRef } from "react";

// Barra fina bajo la cabecera que avanza al leer el capítulo. Solo decorativa (el avance real
// del libro está en el panel de lectura).
export default function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const text = document.querySelector<HTMLElement>(".scripture");
    if (!text || !bar.current) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = text.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      bar.current!.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div className="reading-progress" aria-hidden="true"><div ref={bar} /></div>;
}
