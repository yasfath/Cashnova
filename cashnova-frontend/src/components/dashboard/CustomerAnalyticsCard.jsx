import { useMemo, useRef, useState } from "react";
import { CalendarDays, UsersRound } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";

const monthButtonFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const CustomerAnalyticsCard = ({ loading }) => {
  const { getCustomerAnalytics } = useAppData();
  const dateInputRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const analytics = useMemo(
    () => getCustomerAnalytics(selectedMonth),
    [getCustomerAnalytics, selectedMonth]
  );

  const openCalendar = () => {
    const input = dateInputRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="dashboard-analytics-card theme-card h-full min-h-[294px] rounded-[24px] p-4 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(19,52,72,0.1)] active:scale-[0.985] sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-[#12303f]">Customer Analytics</h3>
          <p className="mt-2 text-sm text-[#647c8a]">
            {analytics.hasCustomerData
              ? `${analytics.activeCustomers} active customer records`
              : "No analytics yet"}
          </p>
        </div>

        <div className="relative shrink-0">
          <input
            ref={dateInputRef}
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="pointer-events-none absolute right-0 top-0 h-0 w-0 opacity-0"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={openCalendar}
            className="theme-button-soft flex min-w-[92px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold sm:min-w-[110px] sm:text-sm"
            aria-label="Open customer analytics month picker"
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{monthButtonFormatter.format(new Date(`${selectedMonth}-01`))}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="theme-panel grid h-[190px] gap-3 rounded-[20px] p-4">
          <div className="h-6 w-28 animate-pulse rounded-full bg-[#e6f0f4]" />
          <div className="h-full animate-pulse rounded-[18px] bg-[#edf4f7]" />
        </div>
      ) : analytics.hasCustomerData ? (
        <div className="grid gap-3">
          <div className="theme-panel rounded-[20px] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
              Active Customers
            </p>
            <p className="mt-3 text-[36px] font-extrabold text-[#12303f]">
              {analytics.activeCustomers}
            </p>
            <p className="mt-2 text-sm text-[#647c8a]">
              {analytics.totalRecords} records linked in this month.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="theme-panel rounded-[18px] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f8795]">
                Categories
              </p>
              <p className="mt-2 text-xl font-bold text-[#12303f]">
                {analytics.categoriesTracked}
              </p>
            </div>

            <div className="theme-panel rounded-[18px] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f8795]">
                Last Record
              </p>
              <p className="mt-2 text-sm font-semibold text-[#12303f]">
                {analytics.lastRecordLabel}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="theme-panel mt-4 flex h-[190px] items-center justify-center rounded-[20px] px-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1F5F7A] shadow-[0_14px_28px_rgba(19,52,72,0.1)]">
              <UsersRound className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-[#12303f]">No customer data available</p>
            <p className="mt-1 text-xs text-[#647c8a]">
              Analytics will appear after customer-linked records are added.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAnalyticsCard;
