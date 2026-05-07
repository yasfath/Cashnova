import { useMemo } from "react";
import { Lightbulb, Shield, Sparkles, Wallet } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import PageContainer from "../components/common/PageContainer";
import { useAppData } from "../context/AppDataContext";

const categoryRules = [
  { key: "Housing", benchmark: 30, aliases: ["housing", "rent", "home"] },
  { key: "Food", benchmark: 15, aliases: ["food", "dining", "grocery", "groceries", "restaurant"] },
  { key: "Transport", benchmark: 10, aliases: ["transport", "travel", "fuel", "cab", "metro"] },
  { key: "Entertain", benchmark: 8, aliases: ["entertain", "shopping", "subscription", "lifestyle"] },
  { key: "Health", benchmark: 10, aliases: ["health", "healthcare", "medical", "fitness"] },
  { key: "Savings", benchmark: 20, aliases: [] },
];

const toneMap = {
  Housing: {
    iconWrap: "bg-[linear-gradient(135deg,rgba(233,246,245,0.96),rgba(230,239,243,0.92))] text-[#0F7C82]",
    badgeStyle: "bg-[rgba(15,124,130,0.12)] text-[#0f6f75]",
    bar: "linear-gradient(90deg, #0F7C82 0%, #1F5F7A 100%)",
    text: "text-[#0F7C82]",
  },
  Food: {
    iconWrap: "bg-[linear-gradient(135deg,rgba(252,246,234,0.96),rgba(244,237,220,0.92))] text-[#D3A24C]",
    badgeStyle: "bg-[rgba(211,162,76,0.14)] text-[#9a7430]",
    bar: "linear-gradient(90deg, #D3A24C 0%, #0F7C82 100%)",
    text: "text-[#9a7430]",
  },
  Transport: {
    iconWrap: "bg-[linear-gradient(135deg,rgba(236,244,247,0.96),rgba(226,236,241,0.92))] text-[#1F5F7A]",
    badgeStyle: "bg-[rgba(31,95,122,0.12)] text-[#1F5F7A]",
    bar: "linear-gradient(90deg, #1F5F7A 0%, #6E9DB0 100%)",
    text: "text-[#1F5F7A]",
  },
  Entertain: {
    iconWrap: "bg-[linear-gradient(135deg,rgba(231,242,244,0.96),rgba(223,236,241,0.92))] text-[#163B56]",
    badgeStyle: "bg-[rgba(22,59,86,0.12)] text-[#163B56]",
    bar: "linear-gradient(90deg, #163B56 0%, #0F7C82 100%)",
    text: "text-[#163B56]",
  },
  Health: {
    iconWrap: "bg-[linear-gradient(135deg,rgba(251,245,236,0.96),rgba(244,235,220,0.92))] text-[#B85C38]",
    badgeStyle: "bg-[rgba(184,92,56,0.12)] text-[#9a4f31]",
    bar: "linear-gradient(90deg, #B85C38 0%, #D3A24C 100%)",
    text: "text-[#9a4f31]",
  },
  Savings: {
    iconWrap: "bg-[linear-gradient(135deg,rgba(232,245,243,0.96),rgba(225,236,231,0.92))] text-[#5E8B7E]",
    badgeStyle: "bg-[rgba(94,139,126,0.14)] text-[#4f786c]",
    bar: "linear-gradient(90deg, #0F7C82 0%, #5E8B7E 100%)",
    text: "text-[#4f786c]",
  },
};

const sectionCardClass =
  "theme-card rounded-[28px] p-5 shadow-[0_20px_48px_rgba(19,52,72,0.08)] sm:p-6";

const getCategoryAmount = (entries, aliases) =>
  entries.reduce((total, entry) => {
    const categoryLabel = String(entry.category ?? "").trim().toLowerCase();
    return aliases.some((alias) => categoryLabel.includes(alias)) ? total + entry.amount : total;
  }, 0);

const RecommendationCard = ({ title, description, badge, icon: Icon, iconWrap, badgeStyle }) => {
  return (
    <div className="theme-panel rounded-[24px] p-5 shadow-[0_12px_30px_rgba(19,52,72,0.06)] transition duration-200 hover:-translate-y-[2px] hover:shadow-[0_18px_34px_rgba(19,52,72,0.1)]">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${iconWrap}`}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#12303f]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#647c8a]">{description}</p>
          <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
            {badge}
          </span>
        </div>
      </div>
    </div>
  );
};

const CategoryBar = ({ label, value, status, bar, text }) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[17px] font-semibold text-[#12303f]">{label}</span>
        <span className={`text-sm font-semibold ${text}`}>
          {status} - {Math.round(value)}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[rgba(207,221,228,0.65)]">
        <div
          className="h-3 rounded-full shadow-[0_8px_18px_rgba(19,52,72,0.12)] transition-all duration-300"
          style={{
            width: `${Math.max(value, value > 0 ? 10 : 0)}%`,
            background: bar,
          }}
        />
      </div>
    </div>
  );
};

const AIInsights = () => {
  const { entries, formatCurrency } = useAppData();

  const insightState = useMemo(() => {
    const incomeEntries = entries.filter((entry) => entry.type === "income");
    const expenseEntries = entries.filter((entry) => entry.type === "expense");
    const totalIncome = incomeEntries.reduce((total, entry) => total + entry.amount, 0);
    const totalExpense = expenseEntries.reduce((total, entry) => total + entry.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    const monthsWithRecords = new Set(
      entries.map((entry) => {
        const date = new Date(entry.date);
        return `${date.getFullYear()}-${date.getMonth()}`;
      })
    ).size;
    const monthlyExpenseAverage =
      monthsWithRecords > 0 ? totalExpense / Math.max(monthsWithRecords, 1) : 0;
    const biggestCategoryRule =
      categoryRules
        .filter((rule) => rule.key !== "Savings")
        .map((rule) => ({
          ...rule,
          amount: getCategoryAmount(expenseEntries, rule.aliases),
        }))
        .sort((left, right) => right.amount - left.amount)[0] ?? categoryRules[0];
    const biggestCategoryShare =
      totalExpense > 0 ? (biggestCategoryRule.amount / totalExpense) * 100 : 0;
    const expenseLoad = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
    const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;
    const emergencyTarget = monthlyExpenseAverage * 3;
    const emergencyGap = Math.max(emergencyTarget - Math.max(currentBalance, 0), 0);

    const recommendationCards = [
      {
        title: `Watch ${biggestCategoryRule.key} spend`,
        description:
          entries.length > 0
            ? `${biggestCategoryRule.key} is currently your largest expense bucket at ${formatCurrency(biggestCategoryRule.amount)}. This card updates automatically as new records are added.`
            : "Once entries start coming in, AI will highlight the category placing the most pressure on cash flow.",
        badge: `Spend share: ${Math.round(biggestCategoryShare)}%`,
        icon: Lightbulb,
        ...toneMap.Housing,
      },
      {
        title: `Expense load at ${Math.round(expenseLoad)}%`,
        description:
          totalIncome > 0
            ? `Your total expenses are tracking at ${Math.round(expenseLoad)}% of recorded income. Lowering this ratio usually improves cash stability and runway.`
            : "Expense load will be measured against income as soon as the client records income entries.",
        badge: `Net balance: ${formatCurrency(currentBalance)}`,
        icon: Sparkles,
        ...toneMap.Entertain,
      },
      {
        title: `Savings pace at ${Math.round(savingsRate)}%`,
        description:
          totalIncome > 0
            ? `The app is reading live savings potential from current income and expenses. That makes this recommendation adapt every time a record changes.`
            : "Savings guidance appears once there is enough income and expense activity to compare.",
        badge: `Potential retained: ${formatCurrency(Math.max(currentBalance, 0))}`,
        icon: Wallet,
        ...toneMap.Savings,
      },
      {
        title: `Emergency buffer gap ${formatCurrency(emergencyGap)}`,
        description:
          entries.length > 0
            ? "This compares available balance with a simple three-month safety target based on your expense history."
            : "Emergency fund guidance will be calculated once expense history becomes available.",
        badge: `3-month target: ${formatCurrency(emergencyTarget)}`,
        icon: Shield,
        ...toneMap.Health,
      },
    ];

    const spendingPatternData = categoryRules.map((rule) => {
      if (rule.key === "Savings") {
        return {
          category: rule.key,
          current: Number(savingsRate.toFixed(1)),
          benchmark: rule.benchmark,
        };
      }

      const amount = getCategoryAmount(expenseEntries, rule.aliases);
      const current = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;

      return {
        category: rule.key,
        current: Number(current.toFixed(1)),
        benchmark: rule.benchmark,
      };
    });

    const categoryHealth = spendingPatternData.map((item) => {
      const tone = toneMap[item.category] ?? toneMap.Housing;
      let status = "Awaiting data";

      if (entries.length > 0) {
        if (item.category === "Savings") {
          status =
            item.current >= item.benchmark
              ? "Strong"
              : item.current >= item.benchmark * 0.6
                ? "Building"
                : "Low";
        } else {
          status =
            item.current <= item.benchmark
              ? "On track"
              : item.current <= item.benchmark * 1.25
                ? "Watch"
                : "High";
        }
      }

      return {
        label: item.category === "Entertain" ? "Entertainment" : item.category,
        value: item.current,
        status,
        bar: tone.bar,
        text: tone.text,
      };
    });

    const healthyCount = categoryHealth.filter(
      (item) => item.status === "On track" || item.status === "Strong"
    ).length;

    return {
      recommendationCards,
      spendingPatternData,
      categoryHealth,
      recordCount: entries.length,
      currentSpend: Math.round(expenseLoad),
      budgetSignal: entries.length > 0 ? `${healthyCount}/${categoryHealth.length} aligned` : "No signal yet",
    };
  }, [entries, formatCurrency]);

  return (
    <PageContainer>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <section className="space-y-5">
          <div className={sectionCardClass}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
                Smart Layer
              </p>
              <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-[#12303f]">
                AI Recommendations
              </h3>
            </div>

            <div className="space-y-4">
              {insightState.recommendationCards.map((item) => (
                <RecommendationCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className={sectionCardClass}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
                  Pattern Radar
                </p>
                <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-[#12303f]">
                  Spending Pattern Analysis
                </h3>
                <p className="mt-1 text-sm text-[#647c8a]">
                  Live category signals refresh as soon as entries are added or updated.
                </p>
              </div>
              <span className="theme-panel inline-flex rounded-full px-3 py-1 text-xs font-semibold text-[#647c8a]">
                {insightState.recordCount} Records
              </span>
            </div>

            <div className="theme-panel relative h-[320px] rounded-[24px] p-4 sm:p-5">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={insightState.spendingPatternData} outerRadius="68%">
                  <PolarGrid stroke="rgba(116,149,165,0.24)" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: "#647c8a", fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="#0F7C82"
                    fill="#0F7C82"
                    fillOpacity={0.16}
                    strokeWidth={2.5}
                  />
                  <Radar
                    name="Target"
                    dataKey="benchmark"
                    stroke="#1F5F7A"
                    fill="#1F5F7A"
                    fillOpacity={0.08}
                    strokeWidth={2.5}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {insightState.recordCount === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="theme-card rounded-2xl px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-[#12303f]">0 records connected</p>
                    <p className="mt-1 text-xs text-[#647c8a]">
                      Add entries to activate the radar.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="theme-panel rounded-[20px] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
                  Current Spend
                </p>
                <p className="mt-2 text-2xl font-bold text-[#12303f]">
                  {insightState.currentSpend}%
                </p>
              </div>
              <div className="theme-panel rounded-[20px] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
                  Budget Signal
                </p>
                <p className="mt-2 text-2xl font-bold text-[#12303f]">
                  {insightState.budgetSignal}
                </p>
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
                Health Check
              </p>
              <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-[#12303f]">
                Category Health Check
              </h3>
              <p className="mt-1 text-sm text-[#647c8a]">
                These bars stay synced with the same entry data powering your dashboard and reports.
              </p>
            </div>

            <div className="space-y-5">
              {insightState.categoryHealth.map((item) => (
                <CategoryBar key={item.label} {...item} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

export default AIInsights;
