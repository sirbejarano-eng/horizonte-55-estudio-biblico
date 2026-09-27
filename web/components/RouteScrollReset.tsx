"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Al abrir otra página con un enlace, empezar siempre arriba del todo.
// (Con el desplazamiento suave activo, la navegación podía quedarse a medio camino o en el pie.)
// Si se vuelve atrás o adelante con el navegador, se respeta la posición que recuerda el navegador,
// y si la dirección lleva un #ancla, se deja que la página baje hasta ella.
export default function RouteScrollReset() {
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => { fromHistory.current = true; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (fromHistory.current) { fromHistory.current = false; return; }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
