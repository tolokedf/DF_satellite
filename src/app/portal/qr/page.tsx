import QrCodesView from "@/components/customer/QrCodesView";
import IssueQrCodesView from "@/components/customer/IssueQrCodesView";

export default function QrPage({ searchParams }: { searchParams?: { mode?: string } }) {
  if (searchParams?.mode === "issues") {
    return <IssueQrCodesView />;
  }
  return <QrCodesView />;
}
