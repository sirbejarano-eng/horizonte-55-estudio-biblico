import type { Metadata } from "next";
import BibleSearch from "@/components/BibleSearch";

export const metadata: Metadata = {
  title: "Buscar en la Biblia",
  description: "Busca palabras o referencias en toda la Biblia directamente en tu navegador, sin enviar datos a ningún servidor.",
  alternates: { canonical: "/buscar/" },
};

export default function SearchPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Búsqueda local</p>
        <h1>Buscar en la Biblia</h1>
        <p>Busca palabras, temas o referencias como Mateo 1:25.</p>
      </header>
      <BibleSearch />
    </>
  );
}
