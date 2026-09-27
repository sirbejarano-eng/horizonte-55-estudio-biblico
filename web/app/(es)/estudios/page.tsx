import StudiesView, { studiesMetadata } from "@/components/views/StudiesView";

export const metadata = studiesMetadata("es");

export default function Page() {
  return <StudiesView lang="es" />;
}
