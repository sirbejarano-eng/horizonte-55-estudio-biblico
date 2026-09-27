import PlansView, { plansMetadata } from "@/components/views/PlansView";

export const metadata = plansMetadata("es");

export default function Page() {
  return <PlansView lang="es" />;
}
