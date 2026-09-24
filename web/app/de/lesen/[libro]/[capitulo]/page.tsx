import ChapterView, { chapterMetadata, chapterStaticParams, type ChapterParams } from "@/components/views/ChapterView";

export const dynamicParams = false;
export const generateStaticParams = () => chapterStaticParams("de");
export const generateMetadata = (props: ChapterParams) => chapterMetadata("de", props);

export default function Page(props: ChapterParams) {
  return <ChapterView edition="de" {...props} />;
}
