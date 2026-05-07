import { useMemo, useState } from "react";
import { Download, FolderClock } from "lucide-react";
import PageContainer from "../components/common/PageContainer";
import { useAppData } from "../context/AppDataContext";

const defaultCategories = [
  "All Categories",
  "Income",
  "Housing",
  "Food",
  "Transport",
  "Shopping",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Others",
];

const dateRanges = [
  "This Week",
  "Last Week",
  "Last 2 Weeks",
  "Last 3 Weeks",
  "This Month",
  "Last Month",
  "Last 3 Months",
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const normalizeCategoryLabel = (value) => {
  const trimmedValue = String(value ?? "").trim();
  return trimmedValue || "Others";
};

const startOfDay = (value) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const addDays = (value, amount) => {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
};

const getWeekStart = (value) => {
  const date = startOfDay(value);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  return addDays(date, offset);
};

const isEntryInDateRange = (entryDateValue, selectedRange) => {
  const entryDate = startOfDay(entryDateValue);
  const now = startOfDay(new Date());
  const currentWeekStart = getWeekStart(now);
  const nextWeekStart = addDays(currentWeekStart, 7);
  const lastWeekStart = addDays(currentWeekStart, -7);
  const lastTwoWeeksStart = addDays(currentWeekStart, -7);
  const lastThreeWeeksStart = addDays(currentWeekStart, -14);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastThreeMonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  if (selectedRange === "This Week") {
    return entryDate >= currentWeekStart && entryDate < nextWeekStart;
  }

  if (selectedRange === "Last Week") {
    return entryDate >= lastWeekStart && entryDate < currentWeekStart;
  }

  if (selectedRange === "Last 2 Weeks") {
    return entryDate >= lastTwoWeeksStart && entryDate < nextWeekStart;
  }

  if (selectedRange === "Last 3 Weeks") {
    return entryDate >= lastThreeWeeksStart && entryDate < nextWeekStart;
  }

  if (selectedRange === "Last Month") {
    return entryDate >= lastMonthStart && entryDate < currentMonthStart;
  }

  if (selectedRange === "Last 3 Months") {
    return entryDate >= lastThreeMonthsStart && entryDate < nextMonthStart;
  }

  return entryDate >= currentMonthStart && entryDate < nextMonthStart;
};

const escapeCsvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const getTypePillClass = (type) =>
  type === "income"
    ? "bg-[rgba(31,95,122,0.12)] text-[#1F5F7A]"
    : "bg-[rgba(15,124,130,0.12)] text-[#0F7C82]";

const ActivityLog = () => {
  const {
    activityEntries,
    categories,
    currencyCode,
    dataSource,
    formatCurrency,
    formatSignedCurrency,
    loading,
    notice,
  } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedRange, setSelectedRange] = useState("This Month");
  const [exportMessage, setExportMessage] = useState("");

  const categoryOptions = useMemo(
    () => Array.from(new Set([...defaultCategories, ...categories])),
    [categories]
  );

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return activityEntries.filter((entry) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        entry.title.toLowerCase().includes(normalizedSearch) ||
        entry.category.toLowerCase().includes(normalizedSearch) ||
        entry.notes.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === "All Categories" || entry.category === selectedCategory;

      return matchesSearch && matchesCategory && isEntryInDateRange(entry.date, selectedRange);
    });
  }, [activityEntries, searchTerm, selectedCategory, selectedRange]);

  const summary = useMemo(() => {
    return filteredEntries.reduce(
      (totals, entry) => {
        if (entry.type === "income") {
          totals.income += entry.amount;
        } else {
          totals.expense += entry.amount;
        }

        return totals;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredEntries]);

  const handleExportClick = () => {
    if (filteredEntries.length === 0) {
      setExportMessage("There are no filtered records to export yet.");
      return;
    }

    const header = ["Date", "Title", "Type", "Category", "Notes", "Currency", "Amount"];
    const rows = filteredEntries.map((entry) => [
      dateFormatter.format(new Date(entry.date)),
      entry.title,
      entry.type,
      entry.category,
      entry.notes,
      currencyCode,
      formatSignedCurrency(entry.type === "income" ? entry.amount : -entry.amount),
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = `cashnova-activity-${selectedRange.toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileUrl);

    setExportMessage(`Exported ${filteredEntries.length} record(s) successfully.`);
  };

  return (
    <PageContainer>
      <div className="flex justify-center">
        <div className="theme-card w-full max-w-[1480px] rounded-[28px] p-4 shadow-[0_20px_48px_rgba(19,52,72,0.08)] sm:p-6">
          <div className="flex shrink-0 flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f8795]">
                  Activity Feed
                </p>
                <h2 className="mt-2 text-[26px] font-bold tracking-[-0.03em] text-[#12303f]">
                  Transaction Activity Log
                </h2>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto">
                <div className="theme-panel rounded-[18px] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
                    Filtered income
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#1F5F7A]">
                    {formatCurrency(summary.income)}
                  </p>
                </div>
                <div className="theme-panel rounded-[18px] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
                    Filtered spending
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#0F7C82]">
                    {formatCurrency(summary.expense)}
                  </p>
                </div>
                <div className="theme-panel rounded-[18px] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
                    Net flow
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#12303f]">
                    {formatCurrency(summary.income - summary.expense)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.88fr)_minmax(0,0.78fr)_minmax(220px,0.9fr)]">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search activity..."
                className="theme-input rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none placeholder:text-[#7a94a3]"
              />

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="theme-input rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none"
            >
              {categoryOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={selectedRange}
              onChange={(event) => setSelectedRange(event.target.value)}
              className="theme-input rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none"
            >
              {dateRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportClick}
              className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white transition duration-200 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[#647c8a]">
              {loading
                ? "Loading entries..."
                : `${filteredEntries.length} record(s) showing | data source: ${dataSource}`}
            </p>

            {(notice || exportMessage) && (
              <p className="text-sm font-medium text-[#647c8a]">{exportMessage || notice}</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={`activity-skeleton-${index}`}
                className="theme-panel h-20 animate-pulse rounded-[20px]"
              />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="theme-panel mt-5 flex min-h-[280px] flex-col items-center justify-center rounded-[24px] px-4 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1F5F7A] shadow-[0_14px_28px_rgba(19,52,72,0.1)]">
              <FolderClock className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-[#12303f]">No activity records yet</p>
            <p className="mt-1 max-w-[320px] text-xs leading-6 text-[#647c8a]">
              This page will show activity records after the client starts adding entries.
            </p>
          </div>
        ) : (
          <div>
            <div className="mt-5 space-y-3 md:hidden">
              {filteredEntries.map((entry) => {
                const signedAmount =
                  formatSignedCurrency(entry.type === "income" ? entry.amount : -entry.amount);
                const amountTone = entry.type === "income" ? "text-[#1F5F7A]" : "text-[#0F7C82]";

                return (
                  <div key={entry.id} className="theme-panel rounded-[22px] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#12303f]">{entry.title}</p>
                        <p className="mt-1 text-xs text-[#647c8a]">
                          {dateFormatter.format(new Date(entry.date))}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${amountTone}`}>
                        {signedAmount}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className={`rounded-full px-3 py-1 ${getTypePillClass(entry.type)}`}>
                        {entry.type}
                      </span>
                      <span className="rounded-full bg-[rgba(211,162,76,0.14)] px-3 py-1 text-[#9a7430]">
                        {normalizeCategoryLabel(entry.category)}
                      </span>
                    </div>

                    {entry.notes && (
                      <p className="mt-3 text-xs leading-6 text-[#647c8a]">{entry.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-sm text-[#647c8a]">
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Title</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Notes</th>
                    <th className="px-3 py-2 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const signedAmount =
                      formatSignedCurrency(
                        entry.type === "income" ? entry.amount : -entry.amount
                      );
                    const amountTone = entry.type === "income" ? "text-[#1F5F7A]" : "text-[#0F7C82]";

                    return (
                      <tr key={entry.id} className="theme-panel align-top">
                        <td className="rounded-l-[18px] px-3 py-4 text-sm text-[#647c8a]">
                          {dateFormatter.format(new Date(entry.date))}
                        </td>
                        <td className="px-3 py-4 font-semibold text-[#12303f]">{entry.title}</td>
                        <td className="px-3 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypePillClass(entry.type)}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-[#647c8a]">
                          {normalizeCategoryLabel(entry.category)}
                        </td>
                        <td className="max-w-[280px] px-3 py-4 text-[#647c8a]">
                          {entry.notes || "No notes"}
                        </td>
                        <td className={`rounded-r-[18px] px-3 py-4 font-semibold ${amountTone}`}>
                          {signedAmount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </div>
    </PageContainer>
  );
};

export default ActivityLog;
