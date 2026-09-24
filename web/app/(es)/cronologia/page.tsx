import TimelineView, { timelineMetadata } from "@/components/views/TimelineView";

export const metadata = timelineMetadata("es");

export default function Page() {
  return <TimelineView lang="es" />;
}
