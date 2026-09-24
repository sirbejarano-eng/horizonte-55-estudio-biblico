import SearchView, { searchMetadata } from "@/components/views/SearchView";

export const metadata = searchMetadata("en");

export default function Page() {
  return <SearchView lang="en" />;
}
