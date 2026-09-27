import StudyView, { studyMetadata, studyStaticParams, type StudyParams } from "@/components/views/StudyView";

export const generateStaticParams = studyStaticParams;
export const dynamicParams = false;
export const generateMetadata = (props: StudyParams) => studyMetadata("es", props);

export default function Page(props: StudyParams) {
  return <StudyView lang="es" {...props} />;
}
