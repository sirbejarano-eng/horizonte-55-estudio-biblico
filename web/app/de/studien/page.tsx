import StudiesView, { studiesMetadata } from "@/components/views/StudiesView";

export const metadata = studiesMetadata("de");

export default function Page() {
  return <StudiesView lang="de" />;
}
