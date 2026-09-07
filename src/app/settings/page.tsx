import SettingsView from "@/components/customer/SettingsView";
import IssueSettingsView from "@/components/customer/IssueSettingsView";

export default function SettingsPage({ searchParams }: { searchParams?: { mode?: string } }) {
  if (searchParams?.mode === "issues") {
    return <IssueSettingsView />;
  }
  return <SettingsView />;
}
