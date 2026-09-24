import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StudyImageDialog from "@/components/StudyImageDialog";
import { LANGS, type Lang } from "@/lib/i18n";
import { readStudy, studies, studyHref } from "@/lib/studies";

export type StudyParams = { params: Promise<{ slug: string }> };

export const studyStaticParams = () => studies.map((study) => ({ slug: study.slug }));

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
  return (
    <>
      <div className="context-study" style={{ marginInline: "auto" }} dangerouslySetInnerHTML={{ __html: study.html }} />
      <div dangerouslySetInnerHTML={{ __html: study.dialog }} />
      <StudyImageDialog />
    </>
  );
}
