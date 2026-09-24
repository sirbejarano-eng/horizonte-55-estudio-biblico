import ChapterView, { chapterMetadata, chapterStaticParams, type ChapterParams } from "@/components/views/ChapterView";

export const dynamicParams = false;
export const generateStaticParams = () => chapterStaticParams("en");
export const generateMetadata = (props: ChapterParams) => chapterMetadata("en", props);

export default function Page(props: ChapterParams) {
  return <ChapterView edition="en" {...props} />;
}
