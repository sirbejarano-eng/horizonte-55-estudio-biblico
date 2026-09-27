import type { Metadata, Viewport } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import RouteScrollReset from "@/components/RouteScrollReset";
import SiteHeader from "@/components/SiteHeader";
import { ROUTES, t, type Lang } from "@/lib/i18n";
import "@/app/globals.css";

// Copias locales de Source Serif 4 y Atkinson Hyperlegible: la compilación es reproducible sin
// depender de Google Fonts y el navegador tampoco realiza peticiones externas.
const serif = localFont({
  src: [
    { path: "../fonts/source-serif-normal-latin.woff2", style: "normal", weight: "200 900" },
    { path: "../fonts/source-serif-normal-latin-ext.woff2", style: "normal", weight: "200 900" },
    { path: "../fonts/source-serif-italic-latin.woff2", style: "italic", weight: "200 900" },
    { path: "../fonts/source-serif-italic-latin-ext.woff2", style: "italic", weight: "200 900" },
  ],
  variable: "--font-serif",
  display: "swap",
});
const sans = localFont({
  src: [
    { path: "../fonts/atkinson-400-latin.woff2", style: "normal", weight: "400" },
    { path: "../fonts/atkinson-400-latin-ext.woff2", style: "normal", weight: "400" },
    { path: "../fonts/atkinson-700-latin.woff2", style: "normal", weight: "700" },
    { path: "../fonts/atkinson-700-latin-ext.woff2", style: "normal", weight: "700" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const OG_IMAGE = "/media/hero-galilea.webp";

// Documento común a los tres idiomas. Cada idioma tiene su propio layout raíz (para que el HTML
// lleve el atributo lang correcto desde el servidor); todos usan este mismo marco.
export const siteMetadata = (lang: Lang): Metadata => ({
  metadataBase: new URL("https://biblia.horizonte55.com"),
  title: { default: "Horizonte 55", template: "%s · Horizonte 55" },
  description: t(lang).siteDescription,
  applicationName: "Horizonte 55",
  icons: { icon: "/assets/icon.svg", apple: "/assets/icon-192.png" },
  manifest: `/manifest-${lang}.json`,
  openGraph: {
    type: "website",
    siteName: "Horizonte 55",
    locale: { es: "es_ES", en: "en_GB", de: "de_DE" }[lang],
    images: [{ url: OG_IMAGE, width: 1920, height: 1080, alt: t(lang).ogAlt }],
  },
  twitter: { card: "summary_large_image" },
});

export const siteViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1814" },
  ],
  colorScheme: "light dark",
};

// Se ejecuta antes de pintar: aplica el tema guardado (o el del sistema) sin parpadeo.
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('horizonte55-theme');var d=s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()`;

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">{children}</a>
);

// Atribución obligatoria de cada texto bíblico, con las mismas fórmulas que la versión anterior.
function Attribution({ lang }: { lang: Lang }) {
  if (lang === "en") {
    return (
      <p>
        World English Bible British Edition — British/International English, 66 books. Public Domain. “World English Bible” is a trademark; Horizonte 55 does not modify the biblical text.
        {" · "}<Ext href="https://ebible.org/bible/details.php?id=engwebpb">eBible.org</Ext>
      </p>
    );
  }
  if (lang === "de") {
    return (
      <p>
        Die Schlachter-Bibel 1951 / Copyright © 1951 Genfer Bibelgesellschaft / Übersetzung von Franz-Eugen Schlachter / Creative Commons Namensnennung 4.0 International.
        {" · "}<Ext href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</Ext>
        {" · "}<Ext href="https://ebible.org/Bible/details.php?id=deu1951">eBible.org</Ext>
      </p>
    );
  }
  return (
    <>
      <p>
        Biblica® Open Nueva Biblia Viva™ / Copyright © 2006, 2008 by Biblica, Inc. / Usado con permiso. / Licencia Creative Commons Attribution-ShareAlike 4.0 International.
        {" · "}<Ext href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</Ext>
        {" · "}<Ext href="https://open.bible/bibles/biblica-open-nueva-biblia-viva">Open.Bible</Ext>
        {" · "}Biblica no respalda ni patrocina Horizonte 55.
      </p>
      <p>
        Santa Biblia — Reina Valera 1909. Dominio público. {" · "}<Ext href="https://ebible.org/Bible/details.php?id=spaRV1909">eBible.org</Ext>
      </p>
    </>
  );
}

function SiteFooter({ lang }: { lang: Lang }) {
  const text = t(lang);
  const routes = ROUTES[lang];
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true">H55</span>
          <p className="footer-title">Horizonte 55</p>
          <p className="footer-tagline">{text.footerTagline}</p>
        </div>
        <nav className="footer-col" aria-label={text.footerRead}>
          <p className="footer-heading">{text.footerRead}</p>
          <Link href={routes.library}>{text.library}</Link>
          <Link href={routes.search}>{text.search}</Link>
          <Link href={routes.timeline}>{text.timeline}</Link>
          <Link href={routes.studies}>{text.contextStudies}</Link>
          <Link href={routes.plans}>{text.plansEyebrow}</Link>
          <Link href={routes.marks}>{text.marks}</Link>
        </nav>
        <nav className="footer-col" aria-label={text.footerProject}>
          <p className="footer-heading">{text.footerProject}</p>
          <Link href={routes.about}>{text.about}</Link>
          <Link href={`${routes.about}#privacidad`}>{text.privacyTitle}</Link>
          <Link href={`${routes.about}#creditos`}>{text.creditsTitle}</Link>
        </nav>
        <nav className="footer-col" aria-label={text.language}>
          <p className="footer-heading">{text.language}</p>
          <a href="/" hrefLang="es" lang="es">Español</a>
          <a href="/en/" hrefLang="en" lang="en">English</a>
          <a href="/de/" hrefLang="de" lang="de">Deutsch</a>
        </nav>
      </div>
      <div className="container footer-legal">
        <p className="footer-privacy">{text.privacy}</p>
        <Attribution lang={lang} />
        <p>{text.copyright.replace("{year}", String(new Date().getFullYear()))}</p>
      </div>
    </footer>
  );
}

export default function SiteDocument({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const text = t(lang);
  return (
    // data-scroll-behavior: Next desactiva el desplazamiento suave mientras cambia de página.
    <html lang={lang} className={`${serif.variable} ${sans.variable}`} data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">{text.skipToContent}</a>
        <SiteHeader lang={lang} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter lang={lang} />
        <RouteScrollReset />
      </body>
    </html>
  );
}
