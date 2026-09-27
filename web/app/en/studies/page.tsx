import StudiesView, { studiesMetadata } from "@/components/views/StudiesView";

export const metadata = studiesMetadata("en");

export default function Page() {
  return <StudiesView lang="en" />;
}
