import { useMemo } from "react";
import PageContainer from "../components/common/PageContainer";
import { useAppData } from "../context/AppDataContext";

const budgetConfig = [
  {
    label: "Housing & Rent",
    allocation: 30,
    aliases: ["housing", "rent", "home"],
    bar: "linear-gradient(90deg, #0F7C82 0%, #1F5F7A 100%)",
  },
  {
    label: "Food & Dining",
    allocation: 15,
    aliases: ["food", "dining", "grocery", "groceries", "restaurant"],
    bar: "linear-gradient(90deg, #D3A24C 0%, #0F7C82 100%)",
  },
  {
    label: "Transport",
    allocation: 10,
    aliases: ["transport", "travel", "fuel", "metro", "cab"],
    bar: "linear-gradient(90deg, #1F5F7A 0%, #6E9DB0 100%)",
  },
  {
    label: "Entertainment",
    allocation: 10,
    aliases: ["entertain", "shopping", "subscription", "lifestyle"],
    bar: "linear-gradient(90deg, #163B56 0%, #0F7C82 100%)",
  },
  {
    label: "Healthcare",
    allocation: 10,
    aliases: ["health", "healthcare", "medical", "fitness"],
    bar: "linear-gradient(90deg, #B85C38 0%, #D3A24C 100%)",
  },
  {
    label: "Savings Target",
    allocation: 20,
    aliases: [],
    bar: "linear-gradient(90deg, #0F7C82 0%, #5E8B7E 100%)",
  },
];

const ruleLegend = [
  { label: "Needs (50%)", key: "needs", dot: "bg-[#0F7C82]" },
  { label: "Wants (30%)", key: "wants", dot: "bg-[#1F5F7A]" },
  { label: "Savings (20%)", key: "savings", dot: "bg-[#D3A24C]" },
];

const BudgetBarRow = ({ formatCurrency, label, value, limit, progress, bar }) => {
  const ratioLabel =
    limit > 0 ? `${Math.round(progress)}% of target` : value > 0 ? "Tracking" : "Waiting";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-[#12303f]">{label}</span>
        <span className="text-sm font-semibold text-[#647c8a]">
          {formatCurrency(value)} / {formatCurrency(limit)}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[rgba(207,221,228,0.65)]">
        <div
          className="h-3 rounded-full shadow-[0_10px_20px_rgba(19,52,72,0.12)] transition-all duration-300"
          style={{
            width: `${Math.min(Math.max(progress, value > 0 ? 12 : 0), 100)}%`,
            background: bar,
          }}
        />
      </div>

      <p className="text-xs font-medium text-[#647c8a]">{ratioLabel}</p>
    </div>
  );
};

const LeftBudgetCard = ({ budgetRows, formatCurrency }) => {
  return (
    <div className="theme-card rounded-[28px] p-6 shadow-[0_20px_48px_rgba(19,52,72,0.08)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_24px_52px_rgba(19,52,72,0.1)] active:scale-[0.985]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
        Budget Limits
      </p>
      <h3 className="mb-6 mt-2 text-[24px] font-bold tracking-[-0.03em] text-[#12303f]">
        Monthly Budget Limits
      </h3>

      <div className="space-y-5">
        {budgetRows.map((item) => (
          <BudgetBarRow key={item.label} {...item} formatCurrency={formatCurrency} />
        ))}
      </div>
    </div>
  );
};

const RightBudgetCard = ({
  allocations,
  formatCurrency,
  monthlyBalance,
  monthlyExpense,
  monthlyIncome,
}) => {
  return (
    <div className="theme-card rounded-[28px] p-6 shadow-[0_20px_48px_rgba(19,52,72,0.08)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_24px_52px_rgba(19,52,72,0.1)] active:scale-[0.985]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
            AI Allocation
          </p>
          <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-[#12303f]">
            AI Budget Suggestion (50-30-20 Rule)
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="theme-panel rounded-[18px] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
              Income
            </p>
            <p className="mt-2 text-lg font-bold text-[#12303f]">{formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="theme-panel rounded-[18px] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
              Spent
            </p>
            <p className="mt-2 text-lg font-bold text-[#12303f]">{formatCurrency(monthlyExpense)}</p>
          </div>
          <div className="theme-panel rounded-[18px] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
              Net
            </p>
            <p className="mt-2 text-lg font-bold text-[#1F5F7A]">{formatCurrency(monthlyBalance)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative mb-6 h-56 w-56 rounded-full p-6 shadow-[0_22px_40px_rgba(19,52,72,0.12)]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(#0F7C82 0deg 180deg, #1F5F7A 180deg 288deg, #D3A24C 288deg 360deg)",
            }}
          />
          <div className="absolute inset-[18px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,249,250,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]" />
          <div className="absolute inset-[32px] rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(232,240,244,0.9))]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[#647c8a]">Monthly plan</p>
              <p className="text-3xl font-extrabold tracking-[-0.04em] text-[#12303f]">
                {formatCurrency(monthlyIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          {ruleLegend.map((item) => (
            <div
              key={item.label}
              className="theme-panel flex items-center justify-between rounded-[20px] px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full shadow-[0_6px_14px_rgba(19,52,72,0.14)] ${item.dot}`} />
                <span className="font-semibold text-[#12303f]">{item.label}</span>
              </div>
              <span className="font-semibold text-[#647c8a]">
                {formatCurrency(allocations[item.key])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BudgetPlanner = () => {
  const { entries, formatCurrency } = useAppData();

  const budgetState = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= currentMonthStart && entryDate < nextMonthStart;
    });
    const monthlyIncome = currentMonthEntries
      .filter((entry) => entry.type === "income")
      .reduce((total, entry) => total + entry.amount, 0);
    const monthlyExpense = currentMonthEntries
      .filter((entry) => entry.type === "expense")
      .reduce((total, entry) => total + entry.amount, 0);
    const monthlyBalance = monthlyIncome - monthlyExpense;

    const expenseEntries = currentMonthEntries.filter((entry) => entry.type === "expense");

    const budgetRows = budgetConfig.map((item) => {
      const value =
        item.label === "Savings Target"
          ? Math.max(monthlyBalance, 0)
          : expenseEntries.reduce((total, entry) => {
              const categoryLabel = String(entry.category ?? "").trim().toLowerCase();
              return item.aliases.some((alias) => categoryLabel.includes(alias))
                ? total + entry.amount
                : total;
            }, 0);
      const limit = monthlyIncome * (item.allocation / 100);
      const progress = limit > 0 ? (value / limit) * 100 : 0;

      return {
        ...item,
        value,
        limit,
        progress,
      };
    });

    return {
      monthlyIncome,
      monthlyExpense,
      monthlyBalance,
      budgetRows,
      allocations: {
        needs: monthlyIncome * 0.5,
        wants: monthlyIncome * 0.3,
        savings: monthlyIncome * 0.2,
      },
    };
  }, [entries]);

  return (
    <PageContainer>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.98fr]">
        <LeftBudgetCard budgetRows={budgetState.budgetRows} formatCurrency={formatCurrency} />
        <RightBudgetCard
          formatCurrency={formatCurrency}
          monthlyIncome={budgetState.monthlyIncome}
          monthlyExpense={budgetState.monthlyExpense}
          monthlyBalance={budgetState.monthlyBalance}
          allocations={budgetState.allocations}
        />
      </div>
    </PageContainer>
  );
};

export default BudgetPlanner;
