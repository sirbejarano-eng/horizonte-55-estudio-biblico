import ChapterView, { chapterMetadata, chapterStaticParams, type ChapterParams } from "@/components/views/ChapterView";

export const dynamicParams = false;
export const generateStaticParams = () => chapterStaticParams("rv1909");
export const generateMetadata = (props: ChapterParams) => chapterMetadata("rv1909", props);

export default function Page(props: ChapterParams) {
  return <ChapterView edition="rv1909" {...props} />;
}
