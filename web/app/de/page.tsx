import HomeView from "@/components/views/HomeView";

export const metadata = { alternates: { canonical: "/de/", languages: { es: "/", en: "/en/", de: "/de/" } } };

export default function Page() {
  return <HomeView lang="de" />;
}
