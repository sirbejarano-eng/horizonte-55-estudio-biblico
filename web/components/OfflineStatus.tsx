"use client";

import { useEffect, useState } from "react";
import { catalogUrl, ROUTES, t, type Lang } from "@/lib/i18n";
import { preferredEdition } from "@/lib/storage";

// Registra el service worker y prepara la lectura sin conexión del idioma actual (portada, página
// sin conexión y catálogo de la edición elegida). Igual que la versión actual, avisa del estado en
// la cabecera. En desarrollo no se registra, para no guardar en caché archivos que cambian a cada rato.
export default function OfflineStatus({ lang }: { lang: Lang }) {
  const text = t(lang);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!window.isSecureContext) return setStatus(text.offlineRequiresHttps);
    if (!("serviceWorker" in navigator) || !("caches" in window)) return setStatus(text.offlineUnsupported);

    const catalog = catalogUrl(preferredEdition(lang));
    const required = [ROUTES[lang].home, ROUTES[lang].offline, catalog];
    const isReady = async () => (await Promise.all(required.map((url) => caches.match(url)))).every(Boolean);
    let cancelled = false;

    const onMessage = async (event: MessageEvent) => {
      if (event.data?.type !== "offline-prepared" || event.data.catalog !== catalog || cancelled) return;
      setStatus((await isReady()) ? text.offlineReady : text.offlineNotReady);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    (async () => {
      setStatus(text.offlineChecking);
      try {
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;
        if (await isReady()) return setStatus(text.offlineReady);
        if (!navigator.onLine) return setStatus(text.offlineNotReady);
        setStatus(text.offlinePreparing);
        registration.active?.postMessage({ type: "prepare-offline", lang, catalog });
      } catch {
        if (!cancelled) setStatus(text.offlineUnavailable);
      }
    })();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [lang, text]);

  if (!status) return null;
  return <span className="offline-status" role="status" aria-live="polite">{status}</span>;
}
