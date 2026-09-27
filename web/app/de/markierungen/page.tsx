import MarksView, { marksMetadata } from "@/components/views/MarksView";

export const metadata = marksMetadata("de");

export default function Page() {
  return <MarksView lang="de" />;
}
