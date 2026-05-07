import { useMemo } from "react";
import PageContainer from "../components/common/PageContainer";
import { useAppData } from "../context/AppDataContext";

const chartLabels = ["Now", "2w", "4w", "6w", "8w", "10w", "12w", "90d"];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getSignedAmount = (entry) => (entry.type === "income" ? entry.amount : -entry.amount);

const buildLinePath = (points) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

const buildAreaPath = (points, baselineY) => {
  if (points.length === 0) {
    return "";
  }

  return [
    buildLinePath(points),
    `L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)}`,
    `L ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)}`,
    "Z",
  ].join(" ");
};

const RingCard = ({ title, value, sub1, sub2, progress = 0, tint = "purple" }) => {
  const ringStyles = {
    teal: {
      track: "from-[#e8f5f4] to-[#e3eef2]",
      accent: "#0F7C82",
      glow: "shadow-[0_18px_36px_rgba(15,124,130,0.14)]",
    },
    slate: {
      track: "from-[#edf4f7] to-[#e3edf2]",
      accent: "#1F5F7A",
      glow: "shadow-[0_18px_36px_rgba(31,95,122,0.14)]",
    },
    gold: {
      track: "from-[#fbf5e8] to-[#f1ecdf]",
      accent: "#D3A24C",
      glow: "shadow-[0_18px_36px_rgba(211,162,76,0.14)]",
    },
  };

  const palette = ringStyles[tint] ?? ringStyles.slate;
  const safeProgress = clamp(progress, 0, 100);

  return (
    <div className="theme-card rounded-[28px] p-6 text-center transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_20px_46px_rgba(19,52,72,0.1)] active:scale-[0.985]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6f8795]">{title}</p>

      <div
        className={`relative mx-auto mb-5 mt-5 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gradient-to-br ${palette.track} ${palette.glow}`}
        style={{
          backgroundImage: `conic-gradient(${palette.accent} ${safeProgress * 3.6}deg, rgba(224,235,240,0.86) 0deg)`,
        }}
      >
        <div className="absolute inset-[10px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,249,250,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]" />
        <div className="relative">
          <span className="text-[28px] font-extrabold tracking-[-0.04em] text-[#12303f]">
            {value}
          </span>
        </div>
      </div>

      <p className="text-lg font-bold text-[#173847]">{sub1}</p>
      <p className="mt-1 text-sm leading-6 text-[#647c8a]">{sub2}</p>
    </div>
  );
};

const TopLineChart = ({ points, summaryLabel, currentBalance, forecastNet }) => {
  const baselineY = 186;

  return (
    <div className="theme-card rounded-[28px] p-5 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_22px_48px_rgba(19,52,72,0.1)] active:scale-[0.985] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
            Forecast View
          </p>
          <h3 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-[#12303f]">
            Balance Forecast - Next 90 Days
          </h3>
          <p className="mt-2 max-w-[420px] text-sm leading-6 text-[#647c8a]">{summaryLabel}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="theme-panel rounded-[20px] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
              Current balance
            </p>
            <p className="mt-2 text-xl font-bold text-[#12303f]">{currentBalance}</p>
          </div>
          <div className="theme-panel rounded-[20px] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
              Forecast net
            </p>
            <p className="mt-2 text-xl font-bold text-[#1F5F7A]">{forecastNet}</p>
          </div>
        </div>
      </div>

      <div className="theme-panel rounded-[24px] p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-[#647c8a]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1F5F7A]" />
            Forecast balance
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0F7C82]" />
            Trend glow
          </span>
        </div>

        <svg viewBox="0 0 520 220" className="h-[240px] w-full overflow-visible">
          <defs>
            <linearGradient id="predictionArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1F5F7A" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#0F7C82" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="predictionLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0F7C82" />
              <stop offset="100%" stopColor="#1F5F7A" />
            </linearGradient>
            <filter id="predictionGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#1F5F7A" floodOpacity="0.18" />
            </filter>
          </defs>

          {[36, 76, 116, 156, 196].map((y) => (
            <line
              key={y}
              x1="20"
              y1={y}
              x2="500"
              y2={y}
              stroke="rgba(117,149,165,0.24)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          ))}

          {points.map((point) => (
            <line
              key={`grid-${point.label}`}
              x1={point.x}
              y1="24"
              x2={point.x}
              y2="186"
              stroke="rgba(198,214,222,0.28)"
              strokeWidth="1"
            />
          ))}

          <path d={buildAreaPath(points, baselineY)} fill="url(#predictionArea)" />
          <path
            d={buildLinePath(points)}
            fill="none"
            stroke="url(#predictionLine)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#predictionGlow)"
          />

          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="8" fill="rgba(255,255,255,0.62)" />
              <circle cx={point.x} cy={point.y} r="4.5" fill="#1F5F7A" />
            </g>
          ))}
        </svg>

        <div className="mt-3 grid grid-cols-8 text-center text-xs font-semibold text-[#647c8a]">
          {points.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const SpendingVelocity = ({ bars, formatCurrency, maxExpense }) => {
  return (
    <div className="theme-card rounded-[28px] p-5 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_22px_48px_rgba(19,52,72,0.1)] active:scale-[0.985] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
            Weekly Motion
          </p>
          <h3 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-[#12303f]">
            Spending Velocity
          </h3>
        </div>
        <div className="theme-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#647c8a]">
          Max {formatCurrency(maxExpense)}
        </div>
      </div>

      <div className="theme-panel rounded-[24px] p-4 sm:p-5">
        <div className="flex h-[270px] items-end justify-between gap-4">
          {bars.map((bar, index) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-[220px] w-full items-end rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(229,238,242,0.7))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <div
                  className="relative w-full overflow-hidden rounded-[16px] shadow-[0_14px_28px_rgba(19,52,72,0.12)]"
                  style={{
                    height: `${bar.height}%`,
                    minHeight: bar.height > 0 ? "22px" : "12px",
                    background:
                      index % 2 === 0
                        ? "linear-gradient(180deg, #0F7C82 0%, #1F5F7A 100%)"
                        : "linear-gradient(180deg, #D3A24C 0%, #1F5F7A 100%)",
                  }}
                >
                  <div className="absolute inset-x-2 top-2 h-7 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0))]" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#12303f]">{bar.label}</p>
                <p className="mt-1 text-xs font-medium text-[#647c8a]">
                  {formatCurrency(bar.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AIPredictions = () => {
  const { entries, formatCurrency } = useAppData();

  const predictionState = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const ninetyDaysAgo = addDays(now, -89);
    const twentyEightDaysAgo = addDays(now, -27);

    const currentBalanceValue = entries.reduce(
      (total, entry) => total + getSignedAmount(entry),
      0
    );
    const recentEntries = entries.filter((entry) => new Date(entry.date) >= ninetyDaysAgo);
    const recentNetValue = recentEntries.reduce(
      (total, entry) => total + getSignedAmount(entry),
      0
    );
    const dailyNet = recentNetValue / 90;
    const forecastValues = [0, 14, 28, 42, 56, 70, 84, 90].map(
      (offset) => currentBalanceValue + dailyNet * offset
    );
    const forecastMin = Math.min(...forecastValues, 0);
    const forecastMax = Math.max(...forecastValues, 0);
    const forecastRange = Math.max(forecastMax - forecastMin, 1);
    const xStart = 28;
    const xGap = 464 / (chartLabels.length - 1);
    const yTop = 28;
    const yBottom = 178;
    const yRange = yBottom - yTop;

    const forecastPoints = forecastValues.map((value, index) => ({
      label: chartLabels[index],
      x: xStart + xGap * index,
      y: yBottom - ((value - forecastMin) / forecastRange) * yRange,
      value,
    }));

    const weeklyVelocityRaw = Array.from({ length: 4 }, (_, index) => {
      const weekStart = addDays(twentyEightDaysAgo, index * 7);
      const weekEnd = addDays(weekStart, 7);
      const weeklyExpense = entries
        .filter((entry) => {
          const entryDate = new Date(entry.date);
          return entry.type === "expense" && entryDate >= weekStart && entryDate < weekEnd;
        })
        .reduce((total, entry) => total + entry.amount, 0);

      return {
        label: `Wk ${index + 1}`,
        value: weeklyExpense,
      };
    });

    const maxExpense = Math.max(...weeklyVelocityRaw.map((item) => item.value), 0);
    const weeklyVelocity = weeklyVelocityRaw.map((item) => ({
      ...item,
      height: maxExpense > 0 ? clamp((item.value / maxExpense) * 100, 12, 100) : 0,
    }));

    const currentMonthEntries = entries.filter((entry) => new Date(entry.date) >= currentMonthStart);
    const currentMonthIncome = currentMonthEntries
      .filter((entry) => entry.type === "income")
      .reduce((total, entry) => total + entry.amount, 0);
    const currentMonthExpense = currentMonthEntries
      .filter((entry) => entry.type === "expense")
      .reduce((total, entry) => total + entry.amount, 0);

    const recentExpense = recentEntries
      .filter((entry) => entry.type === "expense")
      .reduce((total, entry) => total + entry.amount, 0);
    const averageDailySpend = recentExpense / 90;
    const runwayDays =
      averageDailySpend > 0 ? Math.max(0, Math.round(currentBalanceValue / averageDailySpend)) : 0;
    const savingsRate =
      currentMonthIncome > 0
        ? clamp(((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100, 0, 100)
        : 0;
    const monthsWithRecords = new Set(
      entries.map((entry) => {
        const date = new Date(entry.date);
        return `${date.getFullYear()}-${date.getMonth()}`;
      })
    ).size;
    const aiConfidence = clamp(Math.round(entries.length * 6 + monthsWithRecords * 10), 0, 96);

    return {
      forecastPoints,
      currentBalance: formatCurrency(currentBalanceValue),
      forecastNet: formatCurrency(forecastValues[forecastValues.length - 1] - forecastValues[0]),
      summaryLabel:
        entries.length > 0
          ? "This curve recalculates from your recent entry flow, so forecasts move automatically as new records are added."
          : "Forecasts will light up as soon as the client starts adding entries from the app or the backend sync begins.",
      weeklyVelocity,
      maxExpense,
      runwayDays,
      averageDailySpend,
      savingsRate,
      aiConfidence,
    };
  }, [entries, formatCurrency]);

  return (
    <PageContainer>
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <TopLineChart
            points={predictionState.forecastPoints}
            summaryLabel={predictionState.summaryLabel}
            currentBalance={predictionState.currentBalance}
            forecastNet={predictionState.forecastNet}
          />
          <SpendingVelocity
            bars={predictionState.weeklyVelocity}
            formatCurrency={formatCurrency}
            maxExpense={predictionState.maxExpense}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <RingCard
            title="Runway Estimate"
            value={
              predictionState.runwayDays > 365
                ? "365+d"
                : `${predictionState.runwayDays || 0}d`
            }
            sub1={
              predictionState.averageDailySpend > 0
                ? `${formatCurrency(predictionState.averageDailySpend)} daily burn`
                : "No active burn yet"
            }
            sub2="Updates automatically from your live balance and spending pace."
            progress={Math.min((predictionState.runwayDays / 180) * 100, 100)}
            tint="teal"
          />
          <RingCard
            title="Savings Rate"
            value={`${Math.round(predictionState.savingsRate)}%`}
            sub1="Current month savings signal"
            sub2="Income versus spending is mapped into this live monthly ratio."
            progress={predictionState.savingsRate}
            tint="slate"
          />
          <RingCard
            title="AI Confidence"
            value={`${predictionState.aiConfidence}%`}
            sub1="Data confidence score"
            sub2="The more clean entry history you collect, the stronger this forecast gets."
            progress={predictionState.aiConfidence}
            tint="gold"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default AIPredictions;
