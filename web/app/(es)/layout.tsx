import SiteDocument, { siteMetadata, siteViewport } from "@/components/SiteDocument";

// Layout raíz en español: cada idioma tiene su propio documento para que <html lang="es"> salga ya del servidor.
export const metadata = siteMetadata("es");
export const viewport = siteViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="es">{children}</SiteDocument>;
}
