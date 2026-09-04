import CurrentStatusView from "@/components/engineer/CurrentStatusView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Current Satus | DF satellite",
  description: "Field Application Dashboard & Engineer Workload",
};

export default function CurrentStatusPage() {
  return <CurrentStatusView />;
}
