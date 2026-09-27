import AboutView, { aboutMetadata } from "@/components/views/AboutView";

export const metadata = aboutMetadata("de");

export default function Page() {
  return <AboutView lang="de" />;
}
