import SiteDocument, { siteMetadata, siteViewport } from "@/components/SiteDocument";

// Layout raíz en inglés: cada idioma tiene su propio documento para que <html lang="en"> salga ya del servidor.
export const metadata = siteMetadata("en");
export const viewport = siteViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="en">{children}</SiteDocument>;
}
