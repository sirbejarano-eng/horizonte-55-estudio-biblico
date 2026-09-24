import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://biblia.horizonte55.com"),
  title: { default: "Horizonte 55", template: "%s · Horizonte 55" },
  description: "Lee la Biblia capítulo a capítulo, toma notas y explora su contexto histórico. Gratis, sin registro y sin recopilar datos personales.",
  icons: { icon: "/assets/icon.svg", apple: "/assets/icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#2e261f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#main">Saltar al contenido</a>
        <SiteHeader />
        <main id="main" className="page-layout" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <p className="site-footer-copyright">
            © {new Date().getFullYear()} Jose A Bejarano V. Código propio: licencia MIT. Material de estudio propio: derechos reservados. Textos bíblicos: licencias independientes.
          </p>
          <p className="site-footer-privacy">No se recopilan datos personales: el progreso y las notas se guardan únicamente en tu dispositivo.</p>
          <p className="site-footer-attribution">
            Biblica® Open Nueva Biblia Viva™ / Copyright © 2006, 2008 by Biblica, Inc. / Usado con permiso. / Licencia Creative Commons Attribution-ShareAlike 4.0 International.
            {" · "}<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">Licencia CC BY-SA 4.0</a>
            {" · "}<a href="https://open.bible/bibles/biblica-open-nueva-biblia-viva" target="_blank" rel="noreferrer">Fuente oficial de Open.Bible</a>
            {" · "}Biblica no respalda ni patrocina Horizonte 55.
          </p>
        </footer>
      </body>
    </html>
  );
}
