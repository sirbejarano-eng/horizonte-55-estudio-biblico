import SearchView, { searchMetadata } from "@/components/views/SearchView";

export const metadata = searchMetadata("es");

export default function Page() {
  return <SearchView lang="es" />;
}
