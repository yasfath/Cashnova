import { HandCoins } from "lucide-react";

const RecentTransactions = ({ loading, transactions }) => {
  return (
    <div className="dashboard-recent-card theme-card rounded-[24px] p-4 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(19,52,72,0.1)] active:scale-[0.985] sm:p-5">
      <h3 className="mb-4 text-[16px] font-bold text-[#12303f]">Recent Transactions</h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`transaction-skeleton-${index}`} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-[#e6f0f4]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-full bg-[#e6f0f4]" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-[#edf4f7]" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded-full bg-[#e6f0f4]" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="dashboard-recent-empty theme-panel flex min-h-[280px] flex-col items-center justify-center rounded-[20px] px-4 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1F5F7A]">
            <HandCoins className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[#12303f]">No transactions yet</p>
          <p className="mt-1 max-w-[220px] text-xs text-[#647c8a]">
            Once the client adds entries, recent transactions will appear here.
          </p>
        </div>
      ) : (
        <div className="dashboard-recent-list space-y-4">
          {transactions.map((item) => (
            <div key={item.id} className="theme-panel flex items-start justify-between gap-3 rounded-[20px] px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${item.avatarBg}`}
                >
                  {item.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#12303f]">{item.name}</p>
                  <p className="mt-1 text-xs text-[#647c8a]">{item.desc}</p>
                </div>
              </div>
              <span className={`shrink-0 text-sm font-semibold ${item.amountColor}`}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
