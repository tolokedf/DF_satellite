import CustomerAnalytics from "@/components/customer/CustomerAnalytics";

export default function CustomerAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Site Robot Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monthly error breakdown, stoppage frequency, and MTBF telemetry for your site equipment.
        </p>
      </div>
      <CustomerAnalytics />
    </div>
  );
}
