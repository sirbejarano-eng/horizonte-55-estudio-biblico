import AboutView, { aboutMetadata } from "@/components/views/AboutView";

export const metadata = aboutMetadata("en");

export default function Page() {
  return <AboutView lang="en" />;
}
