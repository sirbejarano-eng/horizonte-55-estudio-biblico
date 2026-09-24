import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/SiteHeader";
import { t, type Lang } from "@/lib/i18n";
import "@/app/globals.css";

// Documento común a los tres idiomas. Cada idioma tiene su propio layout raíz (para que el HTML
// lleve el atributo lang correcto desde el servidor); todos usan este mismo marco.
export const siteMetadata = (lang: Lang): Metadata => ({
  metadataBase: new URL("https://biblia.horizonte55.com"),
  title: { default: "Horizonte 55", template: "%s · Horizonte 55" },
  description: t(lang).siteDescription,
  icons: { icon: "/assets/icon.svg", apple: "/assets/icon-192.png" },
});

export const siteViewport: Viewport = { themeColor: "#2e261f" };

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

// Atribución obligatoria de cada texto bíblico, con las mismas fórmulas que la versión actual.
function Attribution({ lang }: { lang: Lang }) {
  if (lang === "en") {
    return (
      <p className="site-footer-attribution">
        World English Bible British Edition — British/International English, 66 books. Public Domain. “World English Bible” is a trademark; Horizonte 55 does not modify the biblical text.
        {" · "}<Ext href="https://ebible.org/bible/details.php?id=engwebpb">Official source at eBible.org</Ext>
      </p>
    );
  }
  if (lang === "de") {
    return (
      <p className="site-footer-attribution">
        Die Schlachter-Bibel 1951 / Copyright © 1951 Genfer Bibelgesellschaft / Übersetzung von Franz-Eugen Schlachter / Creative Commons Namensnennung 4.0 International.
        {" · "}<Ext href="https://creativecommons.org/licenses/by/4.0/">CC-BY-4.0-Lizenz</Ext>
        {" · "}<Ext href="https://ebible.org/Bible/details.php?id=deu1951">Offizielle Quelle bei eBible.org</Ext>
      </p>
    );
  }
  return (
    <>
      <p className="site-footer-attribution">
        Biblica® Open Nueva Biblia Viva™ / Copyright © 2006, 2008 by Biblica, Inc. / Usado con permiso. / Licencia Creative Commons Attribution-ShareAlike 4.0 International.
        {" · "}<Ext href="https://creativecommons.org/licenses/by-sa/4.0/">Licencia CC BY-SA 4.0</Ext>
        {" · "}<Ext href="https://open.bible/bibles/biblica-open-nueva-biblia-viva">Fuente oficial de Open.Bible</Ext>
        {" · "}Biblica no respalda ni patrocina Horizonte 55.
      </p>
      <p className="site-footer-attribution">
        Santa Biblia — Reina Valera 1909. Dominio público.
        {" · "}<Ext href="https://ebible.org/Bible/details.php?id=spaRV1909">Fuente oficial de eBible.org</Ext>
      </p>
    </>
  );
}

export default function SiteDocument({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const text = t(lang);
  return (
    <html lang={lang}>
      <body>
        <a className="skip-link" href="#main">{text.skipToContent}</a>
        <SiteHeader lang={lang} />
        <main id="main" className="page-layout" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <p className="site-footer-copyright">{text.copyright.replace("{year}", String(new Date().getFullYear()))}</p>
          <p className="site-footer-privacy">{text.privacy}</p>
          <Attribution lang={lang} />
        </footer>
      </body>
    </html>
  );
}
