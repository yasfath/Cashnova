import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, PencilLine, Trash2 } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";

const monthButtonFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const tableDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const selectedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const statusThemeMap = {
  completed: "bg-[rgba(15,124,130,0.12)] text-[#0F7C82]",
  pending: "bg-[rgba(211,162,76,0.14)] text-[#9a7430]",
  failed: "bg-[rgba(184,92,56,0.14)] text-[#9a4f31]",
};

const getAmountLabel = (entry, formatCurrency) => {
  const prefix = entry.type === "income" ? "+" : "-";
  return `${prefix}${formatCurrency(Number(entry.amount) || 0)}`;
};

const getAmountColor = (entry) =>
  entry.type === "income" ? "text-[#1F5F7A]" : "text-[#0F7C82]";

const getStatusClasses = (status) =>
  statusThemeMap[String(status).trim().toLowerCase()] || "bg-[rgba(15,124,130,0.12)] text-[#0F7C82]";

const buildEditValues = (entry) => ({
  title: entry.title,
  type: entry.type,
  category: entry.category,
  date: String(entry.date).slice(0, 10),
  amount: String(entry.amount),
  status: entry.status || "Completed",
});

const getDateKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const getSearchableEntryText = (entry, formatCurrency) =>
  [
    entry.title,
    entry.category,
    entry.notes,
    entry.status,
    entry.type,
    tableDateFormatter.format(new Date(entry.date)),
    selectedDateFormatter.format(new Date(entry.date)),
    String(entry.amount),
    getAmountLabel(entry, formatCurrency),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const SalesTrendChart = ({ loading }) => {
  const {
    dashboardSearchQuery,
    deleteEntry,
    entries,
    formatCurrency,
    saving,
    updateEntry,
  } = useAppData();
  const dateInputRef = useRef(null);
  const todayKey = getDateKey(new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [filterMode, setFilterMode] = useState("month");
  const [showAll, setShowAll] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [editError, setEditError] = useState("");
  const [busyEntryId, setBusyEntryId] = useState("");

  const selectedMonthLabel = monthButtonFormatter.format(new Date(`${selectedMonth}-01`));
  const selectedDateLabel = selectedDateFormatter.format(
    new Date(`${selectedDate || todayKey}T00:00:00`)
  );
  const filteredEntries = useMemo(() => {
    const normalizedSearch = dashboardSearchQuery.trim().toLowerCase();
    const entriesMatchingSearch =
      normalizedSearch.length === 0
        ? entries
        : entries.filter((entry) =>
            getSearchableEntryText(entry, formatCurrency).includes(normalizedSearch)
          );

    if (filterMode === "date") {
      return entriesMatchingSearch.filter((entry) => getDateKey(entry.date) === selectedDate);
    }

    const selectedDate = new Date(`${selectedMonth}-01`);

    return entriesMatchingSearch.filter((entry) => {
      const entryDate = new Date(entry.date);

      return (
        entryDate.getFullYear() === selectedDate.getFullYear() &&
        entryDate.getMonth() === selectedDate.getMonth()
      );
    });
  }, [dashboardSearchQuery, entries, filterMode, formatCurrency, selectedDate, selectedMonth]);
  const visibleEntries = useMemo(
    () => (showAll ? filteredEntries : filteredEntries.slice(0, 5)),
    [filteredEntries, showAll]
  );

  useEffect(() => {
    setShowAll(false);
  }, [dashboardSearchQuery, filterMode, selectedDate, selectedMonth]);

  const hasSearchQuery = dashboardSearchQuery.trim().length > 0;

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

  const startEditing = (entry) => {
    setEditingEntryId(entry.id);
    setEditValues(buildEditValues(entry));
    setEditError("");
  };

  const stopEditing = () => {
    setEditingEntryId(null);
    setEditValues(null);
    setEditError("");
  };

  const handleEditFieldChange = (field) => (event) => {
    const nextValue = event.target.value;

    setEditValues((currentValues) => ({
      ...currentValues,
      [field]: nextValue,
    }));
    setEditError("");
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingEntryId || !editValues) {
      return;
    }

    if (!editValues.title.trim()) {
      setEditError("Title is required.");
      return;
    }

    if (!editValues.amount || Number(editValues.amount) <= 0) {
      setEditError("Enter a valid amount greater than 0.");
      return;
    }

    if (!editValues.date) {
      setEditError("Choose a valid date.");
      return;
    }

    const entryToUpdate = entries.find((entry) => String(entry.id) === String(editingEntryId));

    if (!entryToUpdate) {
      setEditError("That entry is no longer available.");
      return;
    }

    setBusyEntryId(String(editingEntryId));

    const result = await updateEntry(editingEntryId, {
      ...entryToUpdate,
      title: editValues.title.trim(),
      type: editValues.type,
      category: editValues.category.trim() || "Others",
      date: editValues.date,
      amount: Number(editValues.amount),
      status: editValues.status,
    });

    setBusyEntryId("");

    if (result?.ok) {
      stopEditing();
    }
  };

  const handleDelete = async (entryId) => {
    const entryToDelete = entries.find((entry) => String(entry.id) === String(entryId));

    if (!entryToDelete) {
      return;
    }

    const shouldDelete = window.confirm(`Delete "${entryToDelete.title}" from the dashboard?`);

    if (!shouldDelete) {
      return;
    }

    setBusyEntryId(String(entryId));
    await deleteEntry(entryId);
    setBusyEntryId("");

    if (String(editingEntryId) === String(entryId)) {
      stopEditing();
    }
  };

  return (
    <div className="dashboard-sales-card theme-card rounded-[24px] p-4 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(19,52,72,0.1)] active:scale-[0.985] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-col gap-2">
          <h3 className="text-[16px] font-bold text-[#12303f]">Spending & Sales Trend</h3>
          <p className="text-sm text-[#647c8a]">
            Entries added from Add Entry will appear here automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAll((currentValue) => !currentValue)}
            className="theme-button-soft inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition"
          >
            {showAll ? "Show Less" : "View All"}
          </button>

          <div className="theme-input inline-flex rounded-xl p-1 text-xs font-semibold">
            {["month", "date"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-3 py-1.5 capitalize transition ${
                  filterMode === mode
                    ? "bg-[linear-gradient(90deg,#0f7c82,#1f5f7a)] text-white shadow-[0_10px_18px_rgba(31,95,122,0.14)]"
                    : "text-[#355465] hover:bg-white/60"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="relative self-start xl:ml-1">
            <input
              ref={dateInputRef}
              type={filterMode === "month" ? "month" : "date"}
              value={filterMode === "month" ? selectedMonth : selectedDate}
              onChange={(event) => {
                if (filterMode === "month") {
                  setSelectedMonth(event.target.value);
                  return;
                }

                setSelectedDate(event.target.value || todayKey);
              }}
              className="pointer-events-none absolute right-0 top-0 h-0 w-0 opacity-0"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={openCalendar}
              className="theme-input inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#355465] transition sm:w-auto"
              aria-label={`Open spending and sales trend ${filterMode} picker`}
            >
              <CalendarDays className="h-4 w-4 shrink-0" />
              {filterMode === "month" ? selectedMonthLabel : selectedDateLabel}
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-sales-table theme-panel rounded-[20px] p-5">
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={`trend-table-skeleton-${index}`}
                className="grid grid-cols-[2fr_1.1fr_1fr_1fr_1fr_1.2fr] gap-3"
              >
                {Array.from({ length: 6 }, (_, columnIndex) => (
                  <div
                    key={`trend-table-skeleton-${index}-${columnIndex}`}
                    className="h-10 animate-pulse rounded-xl bg-[#e6f0f4]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="dashboard-sales-table theme-panel rounded-[20px] p-4 sm:p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="border-b border-[rgba(116,149,165,0.2)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8795]">
                    Title
                  </th>
                  <th className="border-b border-[rgba(116,149,165,0.2)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8795]">
                    Category
                  </th>
                  <th className="border-b border-[rgba(116,149,165,0.2)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8795]">
                    Date
                  </th>
                  <th className="border-b border-[rgba(116,149,165,0.2)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8795]">
                    Amount
                  </th>
                  <th className="border-b border-[rgba(116,149,165,0.2)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8795]">
                    Status
                  </th>
                  <th className="border-b border-[rgba(116,149,165,0.2)] px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8795]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleEntries.length > 0 ? (
                  visibleEntries.map((entry) => {
                    const isBusy = saving && busyEntryId === String(entry.id);

                    return (
                      <tr key={entry.id} className="align-middle">
                        <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm font-semibold text-[#12303f]">
                          {entry.title}
                        </td>
                        <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              entry.type === "income"
                                ? "bg-[rgba(31,95,122,0.12)] text-[#1F5F7A]"
                                : "bg-[rgba(15,124,130,0.12)] text-[#0F7C82]"
                            }`}
                          >
                            {entry.category}
                          </span>
                        </td>
                        <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm font-medium text-[#647c8a]">
                          {tableDateFormatter.format(new Date(entry.date))}
                        </td>
                        <td
                          className={`border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm font-semibold ${getAmountColor(
                            entry
                          )}`}
                        >
                          {getAmountLabel(entry, formatCurrency)}
                        </td>
                        <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              entry.status
                            )}`}
                          >
                            {entry.status || "Completed"}
                          </span>
                        </td>
                        <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(entry)}
                              disabled={isBusy}
                              className="theme-button-primary inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 rounded-lg bg-[linear-gradient(90deg,#B85C38_0%,#D3A24C_100%)] px-3 py-2 text-xs font-semibold text-white shadow-[0_16px_28px_rgba(184,92,56,0.16)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm font-semibold text-[#12303f]">
                      {hasSearchQuery ? "No matching entries" : "No entries yet"}
                    </td>
                    <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm text-[#647c8a]">
                      --
                    </td>
                    <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm text-[#647c8a]">
                      --
                    </td>
                    <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm text-[#647c8a]">
                      --
                    </td>
                    <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4 text-sm text-[#647c8a]">
                      --
                    </td>
                    <td className="border-b border-[rgba(116,149,165,0.14)] px-3 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled
                          className="theme-button-primary inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white opacity-60"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          Update
                        </button>
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1 rounded-lg bg-[linear-gradient(90deg,#B85C38_0%,#D3A24C_100%)] px-3 py-2 text-xs font-semibold text-white opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <p className="mt-4 text-sm text-[#647c8a]">
              {hasSearchQuery
                ? `No entries match "${dashboardSearchQuery.trim()}" in the selected ${filterMode}.`
                : filterMode === "date"
                ? "No entries were found for the selected date."
                : "Add an entry from the Add Entry page and it will appear here automatically."}
            </p>
          )}
        </div>
      )}

      {editingEntryId && editValues && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#120A1E]/52 px-4 py-6 backdrop-blur-[3px]">
          <div className="theme-card w-full max-w-[560px] rounded-[26px] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-[#12303f]">Update entry</h4>
                <p className="mt-1 text-sm text-[#647c8a]">
                  Edit this row and save the changes back to the dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={stopEditing}
                className="theme-button-soft rounded-full px-3 py-1.5 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={editValues.title}
                  onChange={handleEditFieldChange("title")}
                  className="theme-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none transition"
                  placeholder="Title"
                />
                <select
                  value={editValues.type}
                  onChange={handleEditFieldChange("type")}
                  className="theme-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none transition"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <input
                  value={editValues.category}
                  onChange={handleEditFieldChange("category")}
                  className="theme-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none transition"
                  placeholder="Category"
                />
                <input
                  type="date"
                  value={editValues.date}
                  onChange={handleEditFieldChange("date")}
                  className="theme-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none transition"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editValues.amount}
                  onChange={handleEditFieldChange("amount")}
                  className="theme-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none transition"
                  placeholder="Amount"
                />
              </div>

              <select
                value={editValues.status}
                onChange={handleEditFieldChange("status")}
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm font-medium text-[#12303f] outline-none transition"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-h-[20px] text-sm font-medium text-[#9a4f31]">{editError}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={stopEditing}
                    className="theme-button-soft rounded-xl px-4 py-2.5 text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="theme-button-primary rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTrendChart;
