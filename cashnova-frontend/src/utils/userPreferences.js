export const PREFERENCES_STORAGE_KEY = "cashnova_preferences_v1";
export const NOTIFICATIONS_STORAGE_KEY = "cashnova_notifications_v1";

export const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR - Rs", locale: "en-IN" },
  { value: "USD", label: "USD - $", locale: "en-US" },
  { value: "EUR", label: "EUR - EUR", locale: "de-DE" },
];

export const LANGUAGE_OPTIONS = ["English", "Tamil", "Hindi"];
export const TIMEZONE_OPTIONS = ["Asia/Kolkata", "UTC"];

export const DEFAULT_PREFERENCES = {
  language: "English",
  currency: "USD",
  timezone: "Asia/Kolkata",
  emailNotifications: true,
  aiPredictionAlerts: true,
  monthlyReportReminder: false,
};

export const getCurrencyOption = (currencyCode) =>
  CURRENCY_OPTIONS.find((option) => option.value === currencyCode) || CURRENCY_OPTIONS[1];

export const createCurrencyFormatter = (currencyCode = DEFAULT_PREFERENCES.currency) => {
  const currencyOption = getCurrencyOption(currencyCode);

  return new Intl.NumberFormat(currencyOption.locale, {
    style: "currency",
    currency: currencyOption.value,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCurrencyValue = (value, currencyCode) =>
  createCurrencyFormatter(currencyCode).format(Number(value) || 0);

export const formatSignedCurrencyValue = (value, currencyCode) => {
  const numericValue = Number(value) || 0;
  const prefix = numericValue >= 0 ? "+" : "-";

  return `${prefix}${formatCurrencyValue(Math.abs(numericValue), currencyCode)}`;
};

export const normalizePreferences = (preferences) => {
  const incomingPreferences =
    preferences && typeof preferences === "object" ? preferences : DEFAULT_PREFERENCES;
  const language = LANGUAGE_OPTIONS.includes(incomingPreferences.language)
    ? incomingPreferences.language
    : DEFAULT_PREFERENCES.language;
  const timezone = TIMEZONE_OPTIONS.includes(incomingPreferences.timezone)
    ? incomingPreferences.timezone
    : DEFAULT_PREFERENCES.timezone;
  const currency = getCurrencyOption(incomingPreferences.currency).value;

  return {
    language,
    currency,
    timezone,
    emailNotifications:
      typeof incomingPreferences.emailNotifications === "boolean"
        ? incomingPreferences.emailNotifications
        : DEFAULT_PREFERENCES.emailNotifications,
    aiPredictionAlerts:
      typeof incomingPreferences.aiPredictionAlerts === "boolean"
        ? incomingPreferences.aiPredictionAlerts
        : DEFAULT_PREFERENCES.aiPredictionAlerts,
    monthlyReportReminder:
      typeof incomingPreferences.monthlyReportReminder === "boolean"
        ? incomingPreferences.monthlyReportReminder
        : DEFAULT_PREFERENCES.monthlyReportReminder,
  };
};

export const normalizeNotification = (notification, index = 0) => ({
  id:
    notification?.id ??
    notification?._id ??
    notification?.notificationId ??
    `notification-${Date.now()}-${index}`,
  title: String(notification?.title ?? "Cashnova update").trim() || "Cashnova update",
  message:
    String(notification?.message ?? notification?.description ?? notification?.body ?? "").trim() ||
    "A new update is available.",
  type: String(notification?.type ?? "info").trim() || "info",
  createdAt: new Date(notification?.createdAt ?? notification?.date ?? Date.now()).toISOString(),
  isRead: Boolean(notification?.isRead ?? notification?.read),
});
