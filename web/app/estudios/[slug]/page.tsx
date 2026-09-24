import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StudyImageDialog from "@/components/StudyImageDialog";
import { readStudy, studies, studyHref } from "@/lib/studies";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => studies.map((study) => ({ slug: study.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const study = readStudy((await params).slug);
  if (!study) return {};
  return { title: study.title, description: study.description, alternates: { canonical: studyHref(study.slug) } };
}

export default async function StudyPage({ params }: Params) {
  const study = readStudy((await params).slug);
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
