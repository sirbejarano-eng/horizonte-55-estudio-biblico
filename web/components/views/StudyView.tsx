import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StudyImageDialog from "@/components/StudyImageDialog";
import { LANGS, type Lang } from "@/lib/i18n";
import { readStudy, studyHref, visibleStudies } from "@/lib/studies";

export type StudyParams = { params: Promise<{ slug: string }> };

export const studyStaticParams = () => visibleStudies.map((study) => ({ slug: study.slug }));

export async function studyMetadata(lang: Lang, { params }: StudyParams): Promise<Metadata> {
  const study = readStudy((await params).slug, lang);
  if (!study) return {};
  return {
    title: study.title,
    description: study.description,
    alternates: { canonical: studyHref(study.slug, lang), languages: Object.fromEntries(LANGS.map((l) => [l, studyHref(study.slug, l)])) },
  };
}

export default async function StudyView({ lang, params }: { lang: Lang } & StudyParams) {
  const study = readStudy((await params).slug, lang);
  if (!study) notFound();
  // Contenido propio del repositorio (no de usuarios), por eso se inserta como HTML.
  // Un solo elemento raíz: Next desplaza la vista hasta el comienzo de la página al navegar;
  // con varios bloques sueltos terminaba en el último (el pie de la página).
  return (
    <div className="page-root">
      <div className="container context-study" dangerouslySetInnerHTML={{ __html: study.html }} />
      <div dangerouslySetInnerHTML={{ __html: study.dialog }} />
      <StudyImageDialog />
    </div>
  );
}
