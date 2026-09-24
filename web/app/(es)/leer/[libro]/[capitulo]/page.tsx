import ChapterView, { chapterMetadata, chapterStaticParams, type ChapterParams } from "@/components/views/ChapterView";

export const dynamicParams = false;
export const generateStaticParams = () => chapterStaticParams("onbv");
export const generateMetadata = (props: ChapterParams) => chapterMetadata("onbv", props);

export default function Page(props: ChapterParams) {
  return <ChapterView edition="onbv" {...props} />;
}
