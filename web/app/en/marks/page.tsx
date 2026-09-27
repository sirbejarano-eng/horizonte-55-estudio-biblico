import MarksView, { marksMetadata } from "@/components/views/MarksView";

export const metadata = marksMetadata("en");

export default function Page() {
  return <MarksView lang="en" />;
}
