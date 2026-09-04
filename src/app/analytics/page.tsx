import CustomerAnalytics from "@/components/customer/CustomerAnalytics";

export default function GlobalAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fleet Telemetry Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Aggregated monthly error statistics and short stop metrics across all field deployments.
        </p>
      </div>
      <CustomerAnalytics />
    </div>
  );
}
