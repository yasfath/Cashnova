import { AlertTriangle } from "lucide-react";

const WarningBanner = () => {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-[#F3E8DD] bg-[#FBF4EF] px-4 py-4 shadow-[0_10px_28px_rgba(34,33,91,0.05)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_14px_34px_rgba(34,33,91,0.08)] active:scale-[0.985] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFE5D4] text-[#FF6C0A]">
          <AlertTriangle size={22} fill="currentColor" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[#243066]">
            AI Monitoring Ready
          </h3>
          <p className="mt-1 text-sm text-[#646B97]">
            Forecasts and alerts will appear here once records are added and backend data is connected.
          </p>
        </div>
      </div>

      <button className="rounded-2xl bg-[#FF7418] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.98]">
        View Forecast
      </button>
    </div>
  );
};

export default WarningBanner;
