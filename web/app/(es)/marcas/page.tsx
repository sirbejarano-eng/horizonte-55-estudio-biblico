import MarksView, { marksMetadata } from "@/components/views/MarksView";

export const metadata = marksMetadata("es");

export default function Page() {
  return <MarksView lang="es" />;
}
