import LibraryView, { libraryMetadata } from "@/components/views/LibraryView";

export const metadata = libraryMetadata("en");

export default function Page() {
  return <LibraryView lang="en" />;
}
