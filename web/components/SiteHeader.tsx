"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { chapterPath, defaultEdition, EDITIONS, equivalentPath, ROUTES, t, type Edition, type Lang } from "@/lib/i18n";
import OfflineStatus from "@/components/OfflineStatus";
import ThemeToggle from "@/components/ThemeToggle";
import { CloseIcon, GlobeIcon, MenuIcon } from "@/components/Icons";
import { getPosition, getSpanishVersion, preferredEdition, saveLanguage, saveSpanishVersion } from "@/lib/storage";

const LANG_NAMES: Record<Lang, string> = { es: "Español", en: "English", de: "Deutsch" };

// Cabecera fija y translúcida. En escritorio: navegación, tema y un panel de "idioma y versión".
// En el móvil: todo dentro de un panel que se abre con el botón de menú.
export default function SiteHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const text = t(lang);
  const routes = ROUTES[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [version, setVersion] = useState<"onbv" | "rv1909">("onbv");
  const [readHref, setReadHref] = useState(chapterPath(defaultEdition(lang), "genesis", 1));
  const [settingsStatus, setSettingsStatus] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // La versión que se está mostrando manda; si la página no es de lectura, la preferencia guardada.
    setVersion(pathname.startsWith("/rv1909/") ? "rv1909" : pathname.startsWith("/leer/") ? "onbv" : getSpanishVersion());
    const position = getPosition();
    setReadHref(chapterPath(preferredEdition(lang), position?.bookId ?? "genesis", position?.chapter ?? 1));
    setMenuOpen(false);
    setPanelOpen(false);
  }, [pathname, lang]);

  useEffect(() => {
    if (!menuOpen && !panelOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setPanelOpen(false);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (panelOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    document.body.classList.toggle("menu-open", menuOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen, panelOpen]);

  const readBases = (Object.keys(EDITIONS) as Edition[]).filter((e) => EDITIONS[e].lang === lang).map((e) => EDITIONS[e].readBase);
  const isReading = readBases.some((base) => pathname.startsWith(base));
  // "Inicio" solo en el menú del móvil: en escritorio el logotipo ya lleva a la portada y así
  // caben los seis apartados en una línea.
  const links = [
    { href: routes.home, label: text.home, current: pathname === routes.home, mobileOnly: true },
    { href: routes.library, label: text.library, current: pathname.startsWith(routes.library) },
    { href: readHref, label: text.reader, current: isReading || pathname.startsWith(routes.studies) },
    { href: routes.plans, label: text.plans, current: pathname.startsWith(routes.plans) },
    { href: routes.timeline, label: text.timeline, current: pathname.startsWith(routes.timeline) },
    { href: routes.search, label: text.search, current: pathname.startsWith(routes.search) },
    { href: routes.marks, label: text.marks, current: pathname.startsWith(routes.marks) },
  ];

  function changeLanguage(next: Lang) {
    if (next === lang) return;
    if (!saveLanguage(next)) {
      setSettingsStatus(text.saveError);
      return;
    }
    setSettingsStatus("");
    const edition = next === "es" ? getSpanishVersion() : next;
    // Cambiar de idioma recarga la página completa: cada idioma tiene su propio documento (lang="…").
    window.location.assign(equivalentPath(pathname, edition));
  }

  function changeVersion(next: "onbv" | "rv1909") {
    if (!saveSpanishVersion(next)) {
      setSettingsStatus(text.saveError);
      return;
    }
    setSettingsStatus("");
    setVersion(next);
    if (isReading) router.push(equivalentPath(pathname, next));
    else window.location.reload(); // búsqueda y portada vuelven a leer la preferencia
  }

  const settings = (
    <div className="settings">
      <fieldset className="settings-group">
        <legend>{text.language}</legend>
        <div className="segmented" role="group">
          {(["es", "en", "de"] as Lang[]).map((code) => (
            <button key={code} type="button" lang={code} aria-pressed={code === lang} onClick={() => changeLanguage(code)}>
              {LANG_NAMES[code]}
            </button>
          ))}
        </div>
      </fieldset>
      {lang === "es" && (
        <fieldset className="settings-group">
          <legend>{text.bibleVersion}</legend>
          <div className="version-options">
            {([
              ["onbv", "Open Nueva Biblia Viva", "Lectura contemporánea"],
              ["rv1909", "Reina-Valera 1909", "Edición histórica"],
            ] as const).map(([value, name, hint]) => (
              <button key={value} type="button" className="version-option" aria-pressed={version === value} onClick={() => changeVersion(value)}>
                <strong>{name}</strong>
                <span>{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <p className="action-status" role="status" aria-live="polite">{settingsStatus}</p>
      <OfflineStatus lang={lang} />
    </div>
  );

  return (
    <header className="site-header">
      <div className="container header-bar">
        <Link className="brand" href={routes.home} aria-label={`Horizonte 55 – ${text.home}`}>
          <span className="brand-mark" aria-hidden="true">H55</span>
          <span className="brand-text">
            <span className="brand-eyebrow">{text.studyDesk}</span>
            <span className="brand-name">Horizonte 55</span>
          </span>
        </Link>

        <nav className="main-nav" aria-label={text.mainNavigation}>
          {links.filter((link) => !link.mobileOnly).map((link) => (
            <Link key={link.label} href={link.href} aria-current={link.current ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <ThemeToggle lang={lang} />
          <div className="settings-anchor" ref={panelRef}>
            <button
              type="button"
              className="icon-button settings-button"
              aria-expanded={panelOpen}
              aria-controls="settings-panel"
              aria-label={text.settingsLabel}
              onClick={() => setPanelOpen((value) => !value)}
            >
              <GlobeIcon />
              <span className="settings-code">{lang.toUpperCase()}</span>
            </button>
            {panelOpen && (
              <div className="popover" id="settings-panel" role="dialog" aria-label={text.settingsLabel}>
                {settings}
              </div>
            )}
          </div>
          <button
            type="button"
            className="icon-button menu-button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? text.closeMenu : text.openMenu}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu${menuOpen ? " is-open" : ""}`} id="mobile-menu" hidden={!menuOpen}>
        <nav className="mobile-nav" aria-label={text.mainNavigation}>
          {links.map((link) => (
            <Link key={link.label} href={link.href} aria-current={link.current ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        {settings}
      </div>
    </header>
  );
}
