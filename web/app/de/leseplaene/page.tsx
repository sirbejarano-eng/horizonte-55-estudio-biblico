import PlansView, { plansMetadata } from "@/components/views/PlansView";

export const metadata = plansMetadata("de");

export default function Page() {
  return <PlansView lang="de" />;
}
