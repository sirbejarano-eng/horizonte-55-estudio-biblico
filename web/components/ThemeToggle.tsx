"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/Icons";
import { t, type Lang } from "@/lib/i18n";
import { localGet, localSet } from "@/lib/local-storage";

const THEME_KEY = "horizonte55-theme";
type Theme = "light" | "dark";

// Claro u oscuro. Sin elección guardada sigue al sistema (y cambia si el sistema cambia);
// al pulsar se guarda la elección en este dispositivo.
export default function ThemeToggle({ lang }: { lang: Lang }) {
  const text = t(lang);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const result = localGet(THEME_KEY);
      if (result.ok && result.value) return;
      const next: Theme = media.matches ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.dataset.theme = next;
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
    setStorageError(!localSet(THEME_KEY, next).ok);
    setTheme(next);
  }

  const dark = theme === "dark";
  return (
    <>
      <button type="button" className="icon-button" onClick={toggle} aria-label={dark ? text.themeLight : text.themeDark} title={dark ? text.themeLight : text.themeDark}>
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
      <span className="sr-only" role="status" aria-live="polite">{storageError ? text.saveError : ""}</span>
    </>
  );
}
