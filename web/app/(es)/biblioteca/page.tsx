import LibraryView, { libraryMetadata } from "@/components/views/LibraryView";

export const metadata = libraryMetadata("es");

export default function Page() {
  return <LibraryView lang="es" />;
}
