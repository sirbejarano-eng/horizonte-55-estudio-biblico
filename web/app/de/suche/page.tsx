import SearchView, { searchMetadata } from "@/components/views/SearchView";

export const metadata = searchMetadata("de");

export default function Page() {
  return <SearchView lang="de" />;
}
