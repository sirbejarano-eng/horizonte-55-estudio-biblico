import TimelineView, { timelineMetadata } from "@/components/views/TimelineView";

export const metadata = timelineMetadata("de");

export default function Page() {
  return <TimelineView lang="de" />;
}
