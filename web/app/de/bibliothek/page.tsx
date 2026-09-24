import LibraryView, { libraryMetadata } from "@/components/views/LibraryView";

export const metadata = libraryMetadata("de");

export default function Page() {
  return <LibraryView lang="de" />;
}
