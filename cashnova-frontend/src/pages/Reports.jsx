import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Briefcase, FileText, LineChart } from "lucide-react";
import { jsPDF } from "jspdf";
import PageContainer from "../components/common/PageContainer";
import { useAppData } from "../context/AppDataContext";

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

const longMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const reportCards = [
  {
    key: "monthly",
    title: "Monthly Report",
    desc: "Weekly and monthly income/expense breakdown from the client entries.",
    button: "Download PDF",
    icon: FileText,
  },
  {
    key: "prediction",
    title: "Prediction Report",
    desc: "6-month forecast based on the latest spending and income pattern.",
    button: "Download PDF",
    icon: LineChart,
  },
  {
    key: "tax",
    title: "Tax Summary",
    desc: "Financial-year income export grouped by category for tax filing.",
    button: "Download CSV",
    icon: Briefcase,
  },
];

const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const roundCurrency = (value) => Number(value.toFixed(2));

const getCurrencyLabel = (value, formatCurrency) => formatCurrency(Number(value) || 0);

const getEntriesInRange = (entries, start, end) =>
  entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= start && entryDate < end;
  });

const sumByType = (entries, type) =>
  entries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);

const buildLastTwelveMonthsData = (entries) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(currentYear, index, 1);
    const monthEnd = addMonths(monthStart, 1);
    const monthEntries = getEntriesInRange(entries, monthStart, monthEnd);
    const income = sumByType(monthEntries, "income");
    const expense = sumByType(monthEntries, "expense");

    return {
      label: shortMonthFormatter.format(monthStart),
      longLabel: longMonthFormatter.format(monthStart),
      income: roundCurrency(income),
      expense: roundCurrency(expense),
      net: roundCurrency(income - expense),
      records: monthEntries.length,
    };
  });
};

const buildWeeklyData = (entries) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEntries = getEntriesInRange(entries, currentMonthStart, nextMonthStart);
  const weeklyBuckets = Array.from({ length: 5 }, (_, index) => ({
    label: `Week ${index + 1}`,
    income: 0,
    expense: 0,
    net: 0,
    records: 0,
  }));

  monthEntries.forEach((entry) => {
    const entryDate = new Date(entry.date);
    const weekIndex = Math.min(4, Math.floor((entryDate.getDate() - 1) / 7));
    const bucket = weeklyBuckets[weekIndex];
    const amount = Number(entry.amount || 0);

    if (entry.type === "income") {
      bucket.income += amount;
      bucket.net += amount;
    } else {
      bucket.expense += amount;
      bucket.net -= amount;
    }

    bucket.records += 1;
  });

  return weeklyBuckets.map((item) => ({
    ...item,
    income: roundCurrency(item.income),
    expense: roundCurrency(item.expense),
    net: roundCurrency(item.net),
  }));
};

const buildForecastData = (monthData) => {
  const seededMonths = monthData.filter((month) => month.records > 0);
  const baselineMonths = (seededMonths.length > 0 ? seededMonths : monthData).slice(-3);
  const incomeAverage =
    baselineMonths.reduce((total, month) => total + month.income, 0) /
    Math.max(baselineMonths.length, 1);
  const expenseAverage =
    baselineMonths.reduce((total, month) => total + month.expense, 0) /
    Math.max(baselineMonths.length, 1);
  const incomeTrend =
    baselineMonths.length > 1
      ? (baselineMonths[baselineMonths.length - 1].income - baselineMonths[0].income) /
        (baselineMonths.length - 1)
      : 0;
  const expenseTrend =
    baselineMonths.length > 1
      ? (baselineMonths[baselineMonths.length - 1].expense - baselineMonths[0].expense) /
        (baselineMonths.length - 1)
      : 0;
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), index + 1);
    const projectedIncome = Math.max(0, incomeAverage + incomeTrend * (index + 1));
    const projectedExpense = Math.max(0, expenseAverage + expenseTrend * (index + 1));
    const projectedNet = projectedIncome - projectedExpense;
    const risk =
      projectedNet < 0 ? "High" : projectedExpense > projectedIncome * 0.85 ? "Medium" : "Low";

    return {
      label: longMonthFormatter.format(monthDate),
      projectedIncome: roundCurrency(projectedIncome),
      projectedExpense: roundCurrency(projectedExpense),
      projectedNet: roundCurrency(projectedNet),
      risk,
    };
  });
};

const escapeCsvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadBlob = (content, type, fileName) => {
  const file = new Blob([content], { type });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};

const ensurePdfSpace = (doc, cursor, requiredHeight = 8) => {
  if (cursor.current + requiredHeight <= 280) {
    return;
  }

  doc.addPage();
  cursor.current = 18;
};

const addPdfTitle = (doc, cursor, text) => {
  ensurePdfSpace(doc, cursor, 10);
  doc.setFontSize(13);
  doc.setTextColor(18, 48, 63);
  doc.text(text, 14, cursor.current);
  cursor.current += 8;
};

const addPdfLine = (doc, cursor, text, color = [100, 124, 138]) => {
  ensurePdfSpace(doc, cursor, 7);
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(text, 14, cursor.current);
  cursor.current += 6;
};

const buildMonthlyReportPdf = ({
  dataSource,
  entries,
  formatCurrency,
  monthData,
  weeklyData,
}) => {
  const doc = new jsPDF();
  const cursor = { current: 18 };
  const totalIncome = monthData.reduce((total, month) => total + month.income, 0);
  const totalExpense = monthData.reduce((total, month) => total + month.expense, 0);
  const totalNet = totalIncome - totalExpense;

  doc.setFontSize(20);
  doc.setTextColor(18, 48, 63);
  doc.text("Cashnova Monthly Report", 14, cursor.current);
  cursor.current += 10;

  addPdfLine(doc, cursor, `Generated: ${fullDateFormatter.format(new Date())}`);
  addPdfLine(
    doc,
    cursor,
    `Source: ${dataSource === "backend" ? "Backend synced entries" : "Local entry data"}`
  );
  addPdfLine(doc, cursor, `Records included: ${entries.length}`, [100, 124, 138]);
  cursor.current += 4;

  addPdfTitle(doc, cursor, "12-Month Summary");
  addPdfLine(doc, cursor, `Total income: ${getCurrencyLabel(totalIncome, formatCurrency)}`);
  addPdfLine(doc, cursor, `Total spending: ${getCurrencyLabel(totalExpense, formatCurrency)}`);
  addPdfLine(doc, cursor, `Net result: ${getCurrencyLabel(totalNet, formatCurrency)}`);
  cursor.current += 4;

  addPdfTitle(doc, cursor, "Current Month Weekly Breakdown");
  weeklyData.forEach((week) => {
    addPdfLine(
      doc,
      cursor,
      `${week.label}: income ${getCurrencyLabel(
        week.income,
        formatCurrency
      )}, spending ${getCurrencyLabel(week.expense, formatCurrency)}, net ${getCurrencyLabel(
        week.net,
        formatCurrency
      )}, records ${week.records}`
    );
  });
  cursor.current += 4;

  addPdfTitle(doc, cursor, "Year-at-a-Glance");
  monthData.forEach((month) => {
    addPdfLine(
      doc,
      cursor,
      `${month.longLabel}: income ${getCurrencyLabel(
        month.income,
        formatCurrency
      )}, spending ${getCurrencyLabel(month.expense, formatCurrency)}, net ${getCurrencyLabel(
        month.net,
        formatCurrency
      )}, entries ${month.records}`
    );
  });

  doc.save(`cashnova-monthly-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const buildPredictionReportPdf = ({ dataSource, forecastData, formatCurrency, monthData }) => {
  const doc = new jsPDF();
  const cursor = { current: 18 };
  const latestMonth = monthData[monthData.length - 1];

  doc.setFontSize(20);
  doc.setTextColor(18, 48, 63);
  doc.text("Cashnova Prediction Report", 14, cursor.current);
  cursor.current += 10;

  addPdfLine(doc, cursor, `Generated: ${fullDateFormatter.format(new Date())}`);
  addPdfLine(
    doc,
    cursor,
    `Source: ${dataSource === "backend" ? "Backend synced entries" : "Local entry data"}`
  );
  addPdfLine(
    doc,
    cursor,
    `Latest tracked month: ${latestMonth?.longLabel || "No recent month available"}`
  );
  cursor.current += 4;

  addPdfTitle(doc, cursor, "Forecast Notes");
  addPdfLine(
    doc,
    cursor,
    "Forecast values are estimated from the latest three months of income and spending."
  );
  addPdfLine(
    doc,
    cursor,
    "As the client adds more weekly and monthly entries, these numbers will adjust automatically."
  );
  cursor.current += 4;

  addPdfTitle(doc, cursor, "Next 6 Months Projection");
  forecastData.forEach((item) => {
    addPdfLine(
      doc,
      cursor,
      `${item.label}: income ${getCurrencyLabel(
        item.projectedIncome,
        formatCurrency
      )}, spending ${getCurrencyLabel(
        item.projectedExpense,
        formatCurrency
      )}, net ${getCurrencyLabel(item.projectedNet, formatCurrency)}, risk ${item.risk}`
    );
  });

  doc.save(`cashnova-prediction-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const buildTaxSummaryCsv = (entries, currencyCode, formatCurrency) => {
  const now = new Date();
  const fiscalYearStart =
    now.getMonth() >= 3 ? new Date(now.getFullYear(), 3, 1) : new Date(now.getFullYear() - 1, 3, 1);
  const fiscalYearEnd = new Date(fiscalYearStart.getFullYear() + 1, 3, 1);
  const fiscalYearLabel = `${fiscalYearStart.getFullYear()}-${fiscalYearEnd.getFullYear()}`;
  const incomeEntries = getEntriesInRange(entries, fiscalYearStart, fiscalYearEnd).filter(
    (entry) => entry.type === "income"
  );
  const categoryTotals = new Map();

  incomeEntries.forEach((entry) => {
    const currentTotal = categoryTotals.get(entry.category) || 0;
    categoryTotals.set(entry.category, currentTotal + Number(entry.amount || 0));
  });

  const rows = [
    ["Cashnova Tax Summary", "", "", "", ""],
    ["Financial Year", fiscalYearLabel, "", "", ""],
    ["Generated", fullDateFormatter.format(new Date()), "", "", ""],
    ["Currency", currencyCode, "", "", ""],
    [],
    ["Category", "Total Income", "", "", ""],
    ...Array.from(categoryTotals.entries()).map(([category, total]) => [
      category,
      formatCurrency(roundCurrency(total)),
      "",
      "",
      "",
    ]),
    [],
    ["Title", "Category", "Date", "Amount", "Status"],
    ...incomeEntries.map((entry) => [
      entry.title,
      entry.category,
      fullDateFormatter.format(new Date(entry.date)),
      formatCurrency(roundCurrency(Number(entry.amount || 0))),
      entry.status || "Completed",
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
};

const ChartTooltip = ({ active, formatCurrency, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
      <div className="theme-card rounded-2xl px-3 py-2 shadow-[0_18px_28px_rgba(19,52,72,0.1)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f8795]">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-5 text-[12px]">
            <span className="font-medium text-[#647c8a]">{item.name}</span>
            <span className="font-semibold text-[#12303f]">
              {getCurrencyLabel(item.value, formatCurrency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopCard = ({ busy, button, desc, icon: Icon, onClick, title }) => {
  return (
    <div className="reports-top-card theme-card rounded-[18px] p-3.5 transition duration-200 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(19,52,72,0.09)] active:scale-[0.985]">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1F5F7A] shadow-[0_10px_20px_rgba(19,52,72,0.09)]">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="text-[13px] font-bold text-[#12303f]">{title}</h3>
      <p className="mt-1.5 min-h-[32px] text-[11px] leading-4 text-[#647c8a]">{desc}</p>

      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="theme-button-primary mt-3 w-full rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Preparing..." : button}
      </button>
    </div>
  );
};

const Reports = () => {
  const { currencyCode, dataSource, entries, formatCurrency } = useAppData();
  const [activeDownload, setActiveDownload] = useState("");
  const currentMonthIndex = new Date().getMonth();
  const monthData = useMemo(() => buildLastTwelveMonthsData(entries), [entries]);
  const weeklyData = useMemo(() => buildWeeklyData(entries), [entries]);
  const forecastData = useMemo(() => buildForecastData(monthData), [monthData]);
  const yearIncome = monthData.reduce((total, month) => total + month.income, 0);
  const yearExpense = monthData.reduce((total, month) => total + month.expense, 0);
  const yearNet = yearIncome - yearExpense;
  const totalRecords = monthData.reduce((total, month) => total + month.records, 0);
  const recentMonthCards = useMemo(
    () => monthData.slice(Math.max(0, currentMonthIndex - 2), currentMonthIndex + 1),
    [currentMonthIndex, monthData]
  );

  const runDownload = async (key, action) => {
    setActiveDownload(key);

    try {
      await action();
    } finally {
      setActiveDownload("");
    }
  };

  const handleMonthlyPdf = () =>
    runDownload("monthly", () =>
      buildMonthlyReportPdf({
        dataSource,
        entries,
        formatCurrency,
        monthData,
        weeklyData,
      })
    );

  const handlePredictionPdf = () =>
    runDownload("prediction", () =>
      buildPredictionReportPdf({
        dataSource,
        forecastData,
        formatCurrency,
        monthData,
      })
    );

  const handleTaxCsv = () =>
    runDownload("tax", () =>
      downloadBlob(
        buildTaxSummaryCsv(entries, currencyCode, formatCurrency),
        "text/csv;charset=utf-8;",
        `cashnova-tax-summary-${new Date().toISOString().slice(0, 10)}.csv`
      )
    );

  const handlers = {
    monthly: handleMonthlyPdf,
    prediction: handlePredictionPdf,
    tax: handleTaxCsv,
  };

  return (
    <PageContainer>
      <div className="reports-page grid h-[calc(100vh-104px)] grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden px-4 pb-3 pt-3 sm:px-5 xl:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          {reportCards.map((item) => (
            <TopCard
              key={item.key}
              {...item}
              busy={activeDownload === item.key}
              onClick={handlers[item.key]}
            />
          ))}
        </div>

        <div className="reports-chart-card theme-card min-h-0 overflow-hidden rounded-[18px] p-3.5 transition duration-200 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(19,52,72,0.09)] active:scale-[0.985]">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#12303f]">Year-at-a-Glance</h3>
              <p className="mt-1 text-[11px] leading-4 text-[#647c8a]">
                The chart recalculates automatically from January to December using the client
                entries for the current year.
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-[#7a94a3]">
                Source: {dataSource === "backend" ? "Backend synced data" : "Local entry data"}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="theme-panel rounded-xl px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f8795]">
                  12-Month Income
                </p>
                <p className="mt-1 text-[14px] font-bold text-[#0F7C82]">
                  {getCurrencyLabel(yearIncome, formatCurrency)}
                </p>
              </div>
              <div className="theme-panel rounded-xl px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c6a38]">
                  12-Month Spending
                </p>
                <p className="mt-1 text-[14px] font-bold text-[#D3A24C]">
                  {getCurrencyLabel(yearExpense, formatCurrency)}
                </p>
              </div>
              <div className="theme-panel rounded-xl px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1F5F7A]">
                  Net / Entries
                </p>
                <p className="mt-1 text-[14px] font-bold text-[#1F5F7A]">
                  {getCurrencyLabel(yearNet, formatCurrency)} / {totalRecords}
                </p>
              </div>
            </div>
          </div>

          <div className="theme-panel mt-3 rounded-[16px] p-3">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData} barGap={10} margin={{ top: 12, right: 8, left: -10, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(116,149,165,0.18)" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#647c8a", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `${currencyCode} ${(value / 1000).toFixed(1)}k`
                        : `${currencyCode} ${value.toFixed(0)}`
                    }
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tick={{ fill: "#7a94a3", fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    content={<ChartTooltip formatCurrency={formatCurrency} />}
                    cursor={{ fill: "rgba(231,239,243,0.75)" }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: "8px", fontSize: "12px" }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#1F5F7A"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="expense"
                    name="Spending"
                    fill="#0F7C82"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {recentMonthCards.map((month) => (
                <div key={month.longLabel} className="theme-panel rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold text-[#12303f]">{month.longLabel}</p>
                  <p className="mt-1 text-[10px] text-[#647c8a]">
                    Income {getCurrencyLabel(month.income, formatCurrency)} | Spending{" "}
                    {getCurrencyLabel(month.expense, formatCurrency)}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-[#496474]">
                    Net {getCurrencyLabel(month.net, formatCurrency)} | Records {month.records}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Reports;
