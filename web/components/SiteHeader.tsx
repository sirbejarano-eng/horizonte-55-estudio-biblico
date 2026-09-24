"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Mismo marcado y clases que la cabecera actual (css heredado); solo el menú móvil necesita JavaScript.
// Línea de tiempo y Buscar aún apuntan a las páginas actuales: se migran en la siguiente fase.
const links = [
  { href: "/", label: "Inicio", match: (p: string) => p === "/" },
  { href: "/biblioteca/", label: "Biblioteca", match: (p: string) => p.startsWith("/biblioteca") },
  { href: "/cronologia.html", label: "Línea de tiempo", match: () => false },
  { href: "/leer/genesis/1/", label: "Lectura", match: (p: string) => p.startsWith("/leer") },
  { href: "/buscar.html", label: "Buscar", match: () => false },
];

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="topbar site-header">
      <Link className="brand-wrap brand-link" href="/">
        <span className="brand-mark">H55</span>
        <span>
          <span className="eyebrow">Tu mesa de estudio</span>
          <strong>Horizonte 55</strong>
        </span>
      </Link>
      <nav id="site-nav" className={`site-nav${open ? " is-open" : ""}`} aria-label="Navegación principal">
        {links.map((link) => {
          const current = link.match(pathname);
          const props = { className: undefined, "aria-current": current ? ("page" as const) : undefined, onClick: () => setOpen(false) };
          return link.href.endsWith(".html") ? (
            <a key={link.href} href={link.href} {...props}>{link.label}</a>
          ) : (
            <Link key={link.href} href={link.href} {...props}>{link.label}</Link>
          );
        })}
      </nav>
      <button
        className="menu-button"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((value) => !value)}
      >
        ☰
      </button>
    </header>
  );
}
