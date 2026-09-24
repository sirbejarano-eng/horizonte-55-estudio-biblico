"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { chapterPath, defaultEdition, EDITIONS, equivalentPath, ROUTES, t, type Edition, type Lang } from "@/lib/i18n";
import OfflineStatus from "@/components/OfflineStatus";
import { getPosition, getSpanishVersion, preferredEdition, saveLanguage, saveSpanishVersion } from "@/lib/storage";

// Mismo marcado y clases que la cabecera actual (css heredado). Añade los selectores de idioma y,
// en español, de versión bíblica: ambos llevan a la página equivalente (mismo capítulo si estás leyendo).
export default function SiteHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const text = t(lang);
  const routes = ROUTES[lang];
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState<"onbv" | "rv1909">("onbv");
  const [readHref, setReadHref] = useState(chapterPath(defaultEdition(lang), "genesis", 1));

  useEffect(() => {
    // La versión que se está mostrando manda; si la página no es de lectura, la preferencia guardada.
    const current = pathname.startsWith("/rv1909/") ? "rv1909" : pathname.startsWith("/leer/") ? "onbv" : getSpanishVersion();
    setVersion(current);
    const position = getPosition();
    setReadHref(chapterPath(preferredEdition(lang), position?.bookId ?? "genesis", position?.chapter ?? 1));
  }, [pathname, lang]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const readBases = (Object.keys(EDITIONS) as Edition[]).filter((e) => EDITIONS[e].lang === lang).map((e) => EDITIONS[e].readBase);
  const links = [
    { href: routes.home, label: text.home, current: pathname === routes.home },
    { href: routes.library, label: text.library, current: pathname.startsWith(routes.library) },
    { href: routes.timeline, label: text.timeline, current: pathname.startsWith(routes.timeline) },
    { href: readHref, label: text.reader, current: readBases.some((base) => pathname.startsWith(base)) || pathname.startsWith(routes.studies) },
    { href: routes.search, label: text.search, current: pathname.startsWith(routes.search) },
  ];

  function changeLanguage(next: Lang) {
    saveLanguage(next);
    const edition = next === "es" ? getSpanishVersion() : next;
    // Cambiar de idioma recarga la página completa: cada idioma tiene su propio documento (lang="…").
    window.location.assign(equivalentPath(pathname, edition));
  }

  function changeVersion(next: "onbv" | "rv1909") {
    saveSpanishVersion(next);
    setVersion(next);
    const isReading = readBases.some((base) => pathname.startsWith(base));
    if (isReading) router.push(equivalentPath(pathname, next));
    else window.location.reload(); // búsqueda y portada vuelven a leer la preferencia
  }

  return (
    <header className="topbar site-header">
      <Link className="brand-wrap brand-link" href={routes.home}>
        <span className="brand-mark">H55</span>
        <span>
          <span className="eyebrow">{text.studyDesk}</span>
          <strong>Horizonte 55</strong>
        </span>
      </Link>
      <nav id="site-nav" className={`site-nav${open ? " is-open" : ""}`} aria-label={text.mainNavigation}>
        {links.map((link) => (
          <Link key={link.label} href={link.href} aria-current={link.current ? "page" : undefined} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <label className="language-control">
          <span>{text.language}</span>
          <select aria-label={text.language} value={lang} onChange={(event) => changeLanguage(event.target.value as Lang)}>
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="de">DE</option>
          </select>
        </label>
        {lang === "es" && (
          <label className="language-control version-control">
            <span>{text.bibleVersion}</span>
            <select aria-label={text.bibleVersion} value={version} onChange={(event) => changeVersion(event.target.value as "onbv" | "rv1909")}>
              <option value="onbv">Open Nueva Biblia Viva — lectura contemporánea</option>
              <option value="rv1909">Reina-Valera 1909 — edición histórica</option>
            </select>
          </label>
        )}
        <OfflineStatus lang={lang} />
      </nav>
      <button
        className="menu-button"
        type="button"
        aria-label={open ? text.closeMenu : text.openMenu}
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((value) => !value)}
      >
        ☰
      </button>
    </header>
  );
}
