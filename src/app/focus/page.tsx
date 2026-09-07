import FocusBoardView from "@/components/customer/FocusBoardView";
import IssueFocusBoardView from "@/components/customer/IssueFocusBoardView";

export default function FocusPage({ searchParams }: { searchParams?: { mode?: string } }) {
  if (searchParams?.mode === "issues") {
    return <IssueFocusBoardView />;
  }
  return <FocusBoardView />;
}
