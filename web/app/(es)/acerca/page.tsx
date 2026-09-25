import AboutView, { aboutMetadata } from "@/components/views/AboutView";

export const metadata = aboutMetadata("es");

export default function Page() {
  return <AboutView lang="es" />;
}
