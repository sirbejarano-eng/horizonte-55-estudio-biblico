import PlansView, { plansMetadata } from "@/components/views/PlansView";

export const metadata = plansMetadata("en");

export default function Page() {
  return <PlansView lang="en" />;
}
