import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";
import {
  DEFAULT_PREFERENCES,
  NOTIFICATIONS_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  createCurrencyFormatter,
  formatSignedCurrencyValue,
  normalizeNotification,
  normalizePreferences,
} from "../utils/userPreferences";

const AppDataContext = createContext(null);

const LOCAL_STORAGE_KEY = "cashnova_entries_v1";
const AUTH_USER_KEY = "cashnovaUser";

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const getSafeNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const cleanedValue = String(value ?? "")
    .replace(/[^0-9.-]/g, "")
    .trim();

  const parsedValue = Number.parseFloat(cleanedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getSafeDate = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
};

const buildEntryId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const normalizeType = (value, amount) => {
  const loweredType = String(value ?? "").trim().toLowerCase();

  if (loweredType === "income") {
    return "income";
  }

  if (loweredType === "expense") {
    return "expense";
  }

  return amount < 0 ? "expense" : "income";
};

const normalizeEntry = (entry, index = 0) => {
  const rawAmount =
    entry?.amount ??
    entry?.value ??
    entry?.total ??
    entry?.transactionAmount ??
    0;
  const numericAmount = getSafeNumber(rawAmount);
  const normalizedDate = getSafeDate(
    entry?.date ?? entry?.transactionDate ?? entry?.createdAt ?? entry?.updatedAt
  );
  const type = normalizeType(entry?.type ?? entry?.entryType ?? entry?.kind, numericAmount);

  return {
    id: entry?.id ?? entry?._id ?? entry?.entryId ?? `${buildEntryId()}-${index}`,
    title: String(
      entry?.title ?? entry?.name ?? entry?.label ?? entry?.description ?? "Untitled entry"
    ).trim(),
    amount: Math.abs(numericAmount),
    type,
    category: String(entry?.category ?? entry?.group ?? "Others").trim() || "Others",
    notes: String(entry?.notes ?? entry?.description ?? entry?.details ?? "").trim(),
    date: normalizedDate.toISOString(),
    status: String(entry?.status ?? "Completed").trim() || "Completed",
    customerLabel: String(
      entry?.customerName ??
        entry?.clientName ??
        entry?.customer ??
        entry?.customerId ??
        entry?.partyName ??
        ""
    ).trim(),
  };
};

const sortEntriesByDate = (entries) =>
  [...entries].sort((left, right) => {
    const rightTime = getSafeDate(right.date).getTime();
    const leftTime = getSafeDate(left.date).getTime();

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return String(right.id).localeCompare(String(left.id));
  });

const getLocalEntriesKey = () => {
  if (typeof window === "undefined") {
    return LOCAL_STORAGE_KEY;
  }

  try {
    const sessionUser = JSON.parse(window.sessionStorage.getItem(AUTH_USER_KEY) || "{}");
    const userKey =
      sessionUser.id ??
      sessionUser.userId ??
      sessionUser.pk ??
      sessionUser.user_id ??
      sessionUser.email ??
      "";

    return userKey ? `${LOCAL_STORAGE_KEY}:${userKey}` : LOCAL_STORAGE_KEY;
  } catch {
    return LOCAL_STORAGE_KEY;
  }
};

const readLocalEntries = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedEntries = window.localStorage.getItem(getLocalEntriesKey());

    if (!savedEntries) {
      return [];
    }

    const parsedEntries = JSON.parse(savedEntries);

    if (!Array.isArray(parsedEntries)) {
      return [];
    }

    return sortEntriesByDate(parsedEntries.map((entry, index) => normalizeEntry(entry, index)));
  } catch {
    return [];
  }
};

const writeLocalEntries = (entries) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getLocalEntriesKey(), JSON.stringify(entries));
};

const readLocalPreferences = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const savedPreferences = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);

    if (!savedPreferences) {
      return DEFAULT_PREFERENCES;
    }

    return normalizePreferences(JSON.parse(savedPreferences));
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const writeLocalPreferences = (preferences) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
};

const sortNotificationsByDate = (notifications) =>
  [...notifications].sort((left, right) => {
    const rightTime = getSafeDate(right.createdAt).getTime();
    const leftTime = getSafeDate(left.createdAt).getTime();

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return String(right.id).localeCompare(String(left.id));
  });

const readLocalNotifications = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedNotifications = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

    if (!savedNotifications) {
      return [];
    }

    const parsedNotifications = JSON.parse(savedNotifications);

    if (!Array.isArray(parsedNotifications)) {
      return [];
    }

    return sortNotificationsByDate(
      parsedNotifications.map((notification, index) => normalizeNotification(notification, index))
    );
  } catch {
    return [];
  }
};

const writeLocalNotifications = (notifications) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
};

const formatShortDate = (value) => fullDateFormatter.format(getSafeDate(value));

const formatMonthKey = (date) => {
  const safeDate = getSafeDate(date);

  return `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthRange = (value) => {
  const date = value ? new Date(`${value}-01`) : new Date();
  const safeDate = getSafeDate(date);
  const start = new Date(safeDate.getFullYear(), safeDate.getMonth(), 1);
  const end = new Date(safeDate.getFullYear(), safeDate.getMonth() + 1, 1);

  return { start, end };
};

const filterEntriesInRange = (entries, start, end) =>
  entries.filter((entry) => {
    const entryDate = getSafeDate(entry.date);
    return entryDate >= start && entryDate < end;
  });

const sumEntries = (entries, type) =>
  entries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + entry.amount, 0);

const getCustomerCount = (entries) => {
  const explicitCustomerKeys = new Set(
    entries
      .map((entry) => entry.customerLabel.trim().toLowerCase())
      .filter(Boolean)
  );

  if (explicitCustomerKeys.size > 0) {
    return explicitCustomerKeys.size;
  }

  return new Set(
    entries
      .filter((entry) => entry.type === "income")
      .map((entry) => String(entry.title ?? entry.category ?? "").trim().toLowerCase())
      .filter(Boolean)
  ).size;
};

const getMonthSummary = (entries, date) => {
  const { start, end } = getMonthRange(formatMonthKey(date));
  const monthEntries = filterEntriesInRange(entries, start, end);
  const revenue = sumEntries(monthEntries, "income");
  const spending = sumEntries(monthEntries, "expense");

  return {
    entries: monthEntries,
    revenue,
    spending,
    netProfit: revenue - spending,
    activeCustomers: getCustomerCount(monthEntries),
  };
};

const getBalanceBeforeDate = (entries, endDateExclusive) =>
  entries.reduce((total, entry) => {
    const entryDate = getSafeDate(entry.date);

    if (entryDate >= endDateExclusive) {
      return total;
    }

    return total + (entry.type === "income" ? entry.amount : -entry.amount);
  }, 0);

const calculatePercentChange = (currentValue, previousValue) => {
  if (currentValue === 0 && previousValue === 0) {
    return 0;
  }

  if (previousValue === 0) {
    return currentValue > 0 ? 100 : -100;
  }

  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
};

const formatPercentChange = (value) => `${value.toFixed(2)}%`;

const buildDashboardCards = (entries, formatCurrency) => {
  const now = new Date();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthSummary = getMonthSummary(entries, now);
  const previousMonthSummary = getMonthSummary(entries, previousMonthDate);

  const totalRevenue = sumEntries(entries, "income");
  const totalExpenses = sumEntries(entries, "expense");
  const totalBalance = totalRevenue - totalExpenses;
  const previousBalance = getBalanceBeforeDate(
    entries,
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const customerCount = getCustomerCount(entries);
  const cardNote = entries.length > 0 ? "vs last month" : "No records yet";

  return [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      change: formatPercentChange(
        calculatePercentChange(currentMonthSummary.revenue, previousMonthSummary.revenue)
      ),
      note: cardNote,
      color: "blue",
      type: "donutUp",
    },
    {
      title: "Net Profit",
      value: formatCurrency(totalBalance),
      change: formatPercentChange(
        calculatePercentChange(currentMonthSummary.netProfit, previousMonthSummary.netProfit)
      ),
      note: cardNote,
      color: "orange",
      type: "lineUp",
    },
    {
      title: "Active Customers",
      value: customerCount.toString(),
      change: formatPercentChange(
        calculatePercentChange(
          currentMonthSummary.activeCustomers,
          previousMonthSummary.activeCustomers
        )
      ),
      note: cardNote,
      color: "green",
      type: "areaDown",
    },
    {
      title: "Cash Reserves",
      value: formatCurrency(totalBalance),
      change: formatPercentChange(calculatePercentChange(totalBalance, previousBalance)),
      note: cardNote,
      color: "red",
      type: "donutDown",
    },
  ];
};

const buildRecentTransactions = (entries, formatSignedCurrency) =>
  entries.slice(0, 5).map((entry) => ({
    id: entry.id,
    name: entry.title,
    desc: entry.notes || `${entry.category} • ${formatShortDate(entry.date)}`,
    amount: formatSignedCurrency(entry.type === "income" ? entry.amount : -entry.amount),
    amountColor: entry.type === "income" ? "text-[#1DA874]" : "text-[#E95B67]",
    avatar: entry.title.charAt(0).toUpperCase() || "C",
    avatarBg: entry.type === "income" ? "bg-[#4A8DFF]" : "bg-[#F97066]",
  }));

const filterEntriesBySearch = (entries, searchQuery, formatSignedCurrency) => {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  if (!normalizedSearch) {
    return entries;
  }

  return entries.filter((entry) => {
    const signedAmount = entry.type === "income" ? entry.amount : -entry.amount;
    const searchableText = [
      entry.title,
      entry.category,
      entry.notes,
      entry.status,
      entry.type,
      entry.customerLabel,
      String(entry.amount),
      formatSignedCurrency(signedAmount),
      formatShortDate(entry.date),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });
};

const buildCategoryOptions = (entries) => {
  const uniqueCategories = new Set(["All Categories"]);

  entries.forEach((entry) => {
    if (entry.category) {
      uniqueCategories.add(entry.category);
    }
  });

  return Array.from(uniqueCategories);
};

const getLocalMutationNotice = (action) =>
  ({
    create: "Entry saved locally. It will switch to backend sync once the API is connected.",
    update: "Entry updated locally. It will sync with the backend when the API is connected.",
    delete: "Entry deleted locally. It will sync with the backend when the API is connected.",
  })[action];

const buildEntryPayload = (entry) => ({
  title: entry.title,
  amount: entry.amount,
  type: entry.type,
  category: entry.category,
  notes: entry.notes,
  date: entry.date,
  status: entry.status,
});

const buildTrendData = (entries, selectedMonth) => {
  const endDate = selectedMonth ? new Date(`${selectedMonth}-01`) : new Date();
  const safeEndDate = getSafeDate(endDate);

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      safeEndDate.getFullYear(),
      safeEndDate.getMonth() - (5 - index),
      1
    );
    const summary = getMonthSummary(entries, monthDate);

    return {
      monthKey: formatMonthKey(monthDate),
      label: monthLabelFormatter.format(monthDate),
      salesVolume: Number(summary.revenue.toFixed(2)),
      operationalSpending: Number(summary.spending.toFixed(2)),
    };
  });
};

const buildCustomerAnalytics = (entries, selectedMonth) => {
  const { start, end } = getMonthRange(selectedMonth);
  const monthEntries = filterEntriesInRange(entries, start, end);
  const activeCustomers = getCustomerCount(monthEntries);
  const revenue = sumEntries(monthEntries, "income");
  const spending = sumEntries(monthEntries, "expense");

  return {
    activeCustomers,
    totalRecords: monthEntries.length,
    revenue,
    spending,
    categoriesTracked: new Set(monthEntries.map((entry) => entry.category).filter(Boolean)).size,
    lastRecordLabel:
      monthEntries.length > 0 ? formatShortDate(monthEntries[0].date) : "No records yet",
    hasCustomerData: activeCustomers > 0,
  };
};

export const AppDataProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState("local");
  const [notice, setNotice] = useState("");
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [notifications, setNotifications] = useState([]);
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");

  const backendConfigured = api.hasBackend();
  const currencyFormatter = useMemo(
    () => createCurrencyFormatter(preferences.currency),
    [preferences.currency]
  );
  const formatCurrency = useCallback(
    (amount) => currencyFormatter.format(Number(amount) || 0),
    [currencyFormatter]
  );
  const formatSignedCurrency = useCallback(
    (amount) => formatSignedCurrencyValue(amount, preferences.currency),
    [preferences.currency]
  );

  const updateNotifications = useCallback((updater) => {
    setNotifications((currentNotifications) => {
      const nextNotifications =
        typeof updater === "function" ? updater(currentNotifications) : updater;
      const normalizedNotifications = sortNotificationsByDate(nextNotifications).slice(0, 30);

      writeLocalNotifications(normalizedNotifications);
      return normalizedNotifications;
    });
  }, []);

  const pushNotification = useCallback(
    ({ title, message, type = "info" }) => {
      updateNotifications((currentNotifications) => [
        normalizeNotification({
          title,
          message,
          type,
          createdAt: new Date().toISOString(),
          isRead: false,
        }),
        ...currentNotifications,
      ]);
    },
    [updateNotifications]
  );

  const loadEntries = useCallback(async () => {
    setLoading(true);

    if (backendConfigured) {
      try {
        const remoteEntries = await api.getEntries();
        const normalizedEntries = sortEntriesByDate(
          remoteEntries.map((entry, index) => normalizeEntry(entry, index))
        );

        setEntries(normalizedEntries);
        setDataSource("backend");
        setNotice("");
        setLoading(false);
        return;
      } catch {
        setNotice("Backend is not reachable right now. Showing local data for now.");
      }
    }

    setEntries(readLocalEntries());
    setDataSource("local");
    setLoading(false);
  }, [backendConfigured]);

  useEffect(() => {
    setNotifications(readLocalNotifications());
  }, []);

  const loadPreferences = useCallback(async () => {
    if (backendConfigured) {
      try {
        const remotePreferences = await api.getPreferences();

        if (remotePreferences) {
          const normalizedPreferences = normalizePreferences(remotePreferences);

          setPreferences(normalizedPreferences);
          writeLocalPreferences(normalizedPreferences);
          return;
        }
      } catch {
        setNotice("Backend settings are not reachable right now. Using saved local preferences.");
      }
    }

    setPreferences(readLocalPreferences());
  }, [backendConfigured]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreferences = useCallback(
    async (updates) => {
      const nextPreferences = normalizePreferences({
        ...preferences,
        ...updates,
      });
      const changedKeys = Object.keys(nextPreferences).filter(
        (key) => preferences[key] !== nextPreferences[key]
      );

      if (changedKeys.length === 0) {
        return { ok: true, source: backendConfigured ? "backend" : "local" };
      }

      setPreferences(nextPreferences);
      writeLocalPreferences(nextPreferences);

      let source = "local";

      if (backendConfigured) {
        try {
          const remotePreferences = await api.updatePreferences(nextPreferences);
          const normalizedPreferences = normalizePreferences(remotePreferences ?? nextPreferences);

          setPreferences(normalizedPreferences);
          writeLocalPreferences(normalizedPreferences);
          setNotice("Preferences updated and synced with the backend.");
          source = "backend";
        } catch {
          setNotice(
            "Preferences were updated locally. They will sync after the backend settings endpoint is available."
          );
        }
      } else {
        setNotice("Preferences updated locally.");
      }

      changedKeys.forEach((key) => {
        if (key === "currency") {
          pushNotification({
            title: "Currency updated",
            message: `Currency switched to ${nextPreferences.currency}. Money values now use the new format across the app.`,
            type: "success",
          });
          return;
        }

        if (key === "emailNotifications") {
          pushNotification({
            title: "Email notifications updated",
            message: nextPreferences.emailNotifications
              ? "Email notifications are enabled."
              : "Email notifications are disabled.",
            type: "info",
          });
          return;
        }

        if (key === "aiPredictionAlerts") {
          pushNotification({
            title: "AI alerts updated",
            message: nextPreferences.aiPredictionAlerts
              ? "AI prediction alerts are enabled."
              : "AI prediction alerts are disabled.",
            type: "info",
          });
          return;
        }

        if (key === "monthlyReportReminder") {
          pushNotification({
            title: "Monthly report reminder updated",
            message: nextPreferences.monthlyReportReminder
              ? "Monthly report reminders are enabled."
              : "Monthly report reminders are disabled.",
            type: "info",
          });
          return;
        }

        if (key === "timezone" || key === "language") {
          pushNotification({
            title: "Regional preferences updated",
            message: `${key === "timezone" ? "Timezone" : "Language"} changed to ${
              nextPreferences[key]
            }.`,
            type: "info",
          });
        }
      });

      return { ok: true, source };
    },
    [backendConfigured, preferences, pushNotification]
  );

  const markNotificationRead = useCallback(
    (notificationId) => {
      updateNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          String(notification.id) === String(notificationId)
            ? { ...notification, isRead: true }
            : notification
        )
      );
    },
    [updateNotifications]
  );

  const markAllNotificationsRead = useCallback(() => {
    updateNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isRead: true }))
    );
  }, [updateNotifications]);

  const addEntry = useCallback(
    async (entryData) => {
      const normalizedEntry = normalizeEntry(entryData);

      setSaving(true);

      if (backendConfigured) {
        try {
          await api.createEntry(buildEntryPayload(normalizedEntry));

          await loadEntries();
          setNotice("Entry saved and synced with the backend.");
          pushNotification({
            title: "Entry saved",
            message: `"${normalizedEntry.title}" was saved and synced with the backend.`,
            type: "success",
          });
          setSaving(false);

          return { ok: true, source: "backend" };
        } catch {
          setNotice("Backend is unavailable right now, so the entry was saved locally.");
        }
      } else {
        setNotice(getLocalMutationNotice("create"));
      }

      const nextEntries = sortEntriesByDate([normalizedEntry, ...entries]);
      writeLocalEntries(nextEntries);
      setEntries(nextEntries);
      setDataSource("local");
      pushNotification({
        title: "Entry saved locally",
        message: `"${normalizedEntry.title}" was saved locally and will sync once the backend is available.`,
        type: "info",
      });
      setSaving(false);

      return { ok: true, source: "local" };
    },
    [backendConfigured, entries, loadEntries, pushNotification]
  );

  const updateEntry = useCallback(
    async (entryId, entryData) => {
      const currentEntry = entries.find((entry) => String(entry.id) === String(entryId));

      if (!currentEntry) {
        setNotice("That entry could not be found.");
        return { ok: false };
      }

      const normalizedEntry = normalizeEntry({
        ...currentEntry,
        ...entryData,
        id: currentEntry.id,
      });

      setSaving(true);

      if (backendConfigured) {
        try {
          await api.updateEntry(entryId, buildEntryPayload(normalizedEntry));

          await loadEntries();
          setNotice("Entry updated and synced with the backend.");
          pushNotification({
            title: "Entry updated",
            message: `"${normalizedEntry.title}" was updated and synced with the backend.`,
            type: "success",
          });
          setSaving(false);

          return { ok: true, source: "backend" };
        } catch {
          setNotice("Backend is unavailable right now, so the entry was updated locally.");
        }
      } else {
        setNotice(getLocalMutationNotice("update"));
      }

      const nextEntries = sortEntriesByDate(
        entries.map((entry) => (String(entry.id) === String(entryId) ? normalizedEntry : entry))
      );

      writeLocalEntries(nextEntries);
      setEntries(nextEntries);
      setDataSource("local");
      pushNotification({
        title: "Entry updated locally",
        message: `"${normalizedEntry.title}" was updated locally and will sync when the backend is available.`,
        type: "info",
      });
      setSaving(false);

      return { ok: true, source: "local" };
    },
    [backendConfigured, entries, loadEntries, pushNotification]
  );

  const deleteEntry = useCallback(
    async (entryId) => {
      const currentEntry = entries.find((entry) => String(entry.id) === String(entryId));

      if (!currentEntry) {
        setNotice("That entry could not be found.");
        return { ok: false };
      }

      setSaving(true);

      if (backendConfigured) {
        try {
          await api.deleteEntry(entryId);

          await loadEntries();
          setNotice("Entry deleted from the backend.");
          pushNotification({
            title: "Entry deleted",
            message: `"${currentEntry.title}" was removed from the backend records.`,
            type: "warning",
          });
          setSaving(false);

          return { ok: true, source: "backend" };
        } catch {
          setNotice("Backend is unavailable right now, so the entry was deleted locally.");
        }
      } else {
        setNotice(getLocalMutationNotice("delete"));
      }

      const nextEntries = entries.filter((entry) => String(entry.id) !== String(entryId));
      writeLocalEntries(nextEntries);
      setEntries(nextEntries);
      setDataSource("local");
      pushNotification({
        title: "Entry deleted locally",
        message: `"${currentEntry.title}" was removed locally and will stay deleted when sync resumes.`,
        type: "warning",
      });
      setSaving(false);

      return { ok: true, source: "local" };
    },
    [backendConfigured, entries, loadEntries, pushNotification]
  );

  const dashboardCards = useMemo(
    () => buildDashboardCards(entries, formatCurrency),
    [entries, formatCurrency]
  );
  const recentTransactions = useMemo(
    () =>
      buildRecentTransactions(
        filterEntriesBySearch(entries, dashboardSearchQuery, formatSignedCurrency),
        formatSignedCurrency
      ),
    [dashboardSearchQuery, entries, formatSignedCurrency]
  );
  const categories = useMemo(() => buildCategoryOptions(entries), [entries]);
  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );
  const getCustomerAnalytics = useCallback(
    (selectedMonth) => buildCustomerAnalytics(entries, selectedMonth),
    [entries]
  );
  const getTrendData = useCallback(
    (selectedMonth) => buildTrendData(entries, selectedMonth),
    [entries]
  );

  const value = useMemo(
    () => ({
      activityEntries: entries,
      addEntry,
      backendConfigured,
      categories,
      currencyCode: preferences.currency,
      dashboardCards,
      dashboardSearchQuery,
      dataSource,
      deleteEntry,
      entries,
      formatCurrency,
      formatSignedCurrency,
      getCustomerAnalytics,
      getTrendData,
      loading,
      markAllNotificationsRead,
      markNotificationRead,
      notice,
      notifications,
      preferences,
      recentTransactions,
      refreshData: loadEntries,
      saving,
      setDashboardSearchQuery,
      unreadNotificationCount,
      updatePreferences,
      updateEntry,
    }),
    [
      addEntry,
      backendConfigured,
      categories,
      dashboardSearchQuery,
      formatCurrency,
      formatSignedCurrency,
      dashboardCards,
      dataSource,
      deleteEntry,
      entries,
      getCustomerAnalytics,
      getTrendData,
      loadEntries,
      loading,
      markAllNotificationsRead,
      markNotificationRead,
      notice,
      notifications,
      preferences,
      recentTransactions,
      saving,
      unreadNotificationCount,
      updatePreferences,
      updateEntry,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider.");
  }

  return context;
};
