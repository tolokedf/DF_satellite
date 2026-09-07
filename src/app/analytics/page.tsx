import AnalyticsView from "@/components/customer/AnalyticsView";
import IssueAnalyticsView from "@/components/customer/IssueAnalyticsView";

export default function AnalyticsPage({ searchParams }: { searchParams?: { mode?: string } }) {
  if (searchParams?.mode === "issues") {
    return <IssueAnalyticsView />;
  }
  return <AnalyticsView />;
}
