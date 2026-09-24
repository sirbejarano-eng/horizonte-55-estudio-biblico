import TimelineView, { timelineMetadata } from "@/components/views/TimelineView";

export const metadata = timelineMetadata("en");

export default function Page() {
  return <TimelineView lang="en" />;
}
