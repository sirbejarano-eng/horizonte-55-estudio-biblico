import SiteDocument, { siteMetadata, siteViewport } from "@/components/SiteDocument";

// Layout raíz en alemán: cada idioma tiene su propio documento para que <html lang="de"> salga ya del servidor.
export const metadata = siteMetadata("de");
export const viewport = siteViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="de">{children}</SiteDocument>;
}
