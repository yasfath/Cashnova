import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:8001/api";

const client = axios.create({
  baseURL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_USER_KEY = "cashnovaUser";
const authTokenKeys = ["cashnova_auth_token", "cashnovaToken", "token"];
const socialCallbackPath = "/auth";
const loginPaths = ["/accounts/login/"];
const signupPaths = ["/accounts/register/"];
const otpPaths = [
  "/accounts/send-otp/",
  "/auth/send-otp",
  "/api/auth/send-otp",
  "/auth/signup/send-otp",
  "/api/auth/signup/send-otp",
  "/send-otp",
  "/api/send-otp",
];
const forgotPasswordPaths = [
  "/accounts/forgot-password/",
  "/auth/forgot-password",
  "/api/auth/forgot-password",
  "/forgot-password",
  "/api/forgot-password",
  "/password/forgot",
  "/api/password/forgot",
];
const entryPaths = ["/transactions/"];
const categoryPaths = ["/categories/"];
const notificationPaths = ["/notifications/"];
const userPaths = ["/users/"];
const dashboardPaths = ["/analytics/summary/"];
const aiAssistantPaths = ["/ai/assistant/"];
const aiInsightPaths = ["/ai/insight/"];
const aiPredictionPaths = ["/ai/predict/"];
const preferencePaths = ["/preferences/", "/settings/", "/accounts/preferences/"];
const profilePaths = ["/profile/", "/accounts/profile/"];
const passwordPaths = [
  "/change-password/",
  "/accounts/change-password/",
  "/auth/change-password",
  "/api/auth/change-password",
  "/change-password",
  "/api/change-password",
  "/user/change-password",
  "/api/user/change-password",
];
const entryDetailPaths = (entryId) => [
  `/transactions/${entryId}/`,
  `/entries/${entryId}`,
  `/api/entries/${entryId}`,
];
const categoryDetailPaths = (categoryId) => [`/categories/${categoryId}/`];
const notificationDetailPaths = (notificationId) => [`/notifications/${notificationId}/`];
const userDetailPaths = (userId) => [`/users/${userId}/`];

const getStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  for (const storage of [window.sessionStorage, window.localStorage]) {
    for (const key of authTokenKeys) {
      const token = storage.getItem(key);

      if (token) {
        return token;
      }
    }
  }

  return "";
};

const getStoredSessionUser = () => {
  if (typeof window === "undefined") {
    return {};
  }

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const storedUser = JSON.parse(storage.getItem(AUTH_USER_KEY) || "{}");

      if (storedUser && Object.keys(storedUser).length > 0) {
        return storedUser;
      }
    } catch {
      continue;
    }
  }

  return {};
};

const getStoredUserId = () => {
  const user = getStoredSessionUser();
  return user.id ?? user.userId ?? user.pk ?? user.user_id ?? "";
};

client.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const unwrapList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const collectionKeys = ["entries", "items", "records", "data"];

  for (const key of collectionKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  if (payload.data && typeof payload.data === "object") {
    for (const key of collectionKeys) {
      if (Array.isArray(payload.data[key])) {
        return payload.data[key];
      }
    }
  }

  return [];
};

const unwrapItem = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  if (payload.entry && typeof payload.entry === "object") {
    return payload.entry;
  }

  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload;
};

const unwrapAuthPayload = (payload) => {
  const item = unwrapItem(payload);

  if (!item || typeof item !== "object") {
    return { user: null, token: "" };
  }

  const user =
    item.user ??
    item.account ??
    item.profile ??
    item.client ??
    item.customer ??
    item;
  const token =
    item.token ??
    item.accessToken ??
    item.access_token ??
    item.authToken ??
    item.jwt ??
    "";

  return { user, token };
};

const toDateOnly = (value) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const normalizeBackendEntry = (entry) => ({
  ...entry,
  type: entry?.transaction_type ?? entry?.type,
  notes: entry?.note ?? entry?.notes,
  date: entry?.transaction_date ?? entry?.date,
  category: entry?.category_name ?? entry?.category ?? "Others",
});

const buildBackendEntryPayload = async (entry) => {
  const userId = entry.user ?? entry.userId ?? getStoredUserId();
  const categoryId = await resolveCategoryId(entry.category, entry.type, userId);
  const payload = {
    title: entry.title,
    amount: entry.amount,
    transaction_type: entry.type,
    note: entry.notes ?? "",
    transaction_date: toDateOnly(entry.date),
  };

  if (userId) {
    payload.user = userId;
  }

  if (categoryId) {
    payload.category = categoryId;
  }

  return payload;
};

const getUserScopedParams = () => {
  const userId = getStoredUserId();
  return userId ? { user: userId } : {};
};

const requestFirstAvailable = async (method, paths, payload, options = {}) => {
  let lastError;

  for (const path of paths) {
    try {
      return await client.request({
        method,
        url: path,
        data: payload,
        ...options,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Backend request failed.");
};

const getCategories = async () => {
  const response = await requestFirstAvailable("get", categoryPaths, undefined, {
    params: getUserScopedParams(),
  });
  return unwrapList(response.data);
};

const createCategory = async ({ name, type, userId }) => {
  const response = await requestFirstAvailable("post", categoryPaths, {
    name,
    category_type: type || "income",
    user: userId,
  });

  return unwrapItem(response.data);
};

const resolveCategoryId = async (category, type, userId) => {
  if (!category || String(category).trim().toLowerCase() === "others") {
    return "";
  }

  if (Number.isFinite(Number(category))) {
    return Number(category);
  }

  if (!userId) {
    return "";
  }

  const categoryName = String(category).trim();
  const categories = await getCategories();
  const existingCategory = categories.find(
    (item) =>
      String(item.name ?? "").trim().toLowerCase() === categoryName.toLowerCase() &&
      String(item.category_type ?? item.type ?? type).toLowerCase() === String(type).toLowerCase()
  );

  if (existingCategory?.id) {
    return existingCategory.id;
  }

  const createdCategory = await createCategory({ name: categoryName, type, userId });
  return createdCategory?.id ?? "";
};

const api = {
  hasBackend: () => Boolean(baseURL),

  login: async ({ email, password }) => {
    const response = await requestFirstAvailable("post", loginPaths, {
      email,
      identifier: email,
      phone: email,
      username: email,
      password,
    });
    return unwrapAuthPayload(response.data);
  },

  signup: async ({ fullName, contactNumber, email, password, otp }) => {
    const response = await requestFirstAvailable("post", signupPaths, {
      fullName,
      name: fullName,
      contactNumber,
      phone: contactNumber,
      email,
      username: email,
      password,
      otp,
    });
    return unwrapAuthPayload(response.data);
  },

  requestSignupOtp: async ({ fullName, contactNumber, email }) => {
    if (!baseURL) {
      return null;
    }

    const response = await requestFirstAvailable("post", otpPaths, {
      fullName,
      name: fullName,
      contactNumber,
      phone: contactNumber,
      email,
    });
    return unwrapItem(response.data);
  },

  forgotPassword: async ({ email }) => {
    if (!baseURL) {
      return null;
    }

    const response = await requestFirstAvailable("post", forgotPasswordPaths, {
      email,
      identifier: email,
      phone: email,
    });
    return unwrapItem(response.data);
  },

  getSocialAuthUrl: (provider) => {
    if (!baseURL) {
      return "";
    }

    const normalizedProvider = String(provider ?? "").toLowerCase();
    const authUrl = new URL(`${baseURL.replace(/\/$/, "")}/auth/${normalizedProvider}/`);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("cashnova_authenticated");
      window.sessionStorage.removeItem(AUTH_USER_KEY);
      window.sessionStorage.removeItem("cashnova_auth_token");
      window.sessionStorage.setItem("cashnova_social_provider", normalizedProvider);

      if (normalizedProvider === "microsoft") {
        const storedUser = window.sessionStorage.getItem(AUTH_USER_KEY) || "";

        if (storedUser.includes("cashnova.local")) {
          window.sessionStorage.removeItem(AUTH_USER_KEY);
          window.sessionStorage.removeItem("cashnova_authenticated");
          window.sessionStorage.removeItem("cashnova_auth_token");
        }
      }

      authUrl.searchParams.set(
        "frontend_callback",
        `${window.location.origin}${socialCallbackPath}`
      );
    }

    return authUrl.toString();
  },

  getEntries: async () => {
    const userId = getStoredUserId();

    if (!userId) {
      return [];
    }

    const response = await requestFirstAvailable("get", entryPaths, undefined, {
      params: { user: userId },
    });
    return unwrapList(response.data).map(normalizeBackendEntry);
  },

  createEntry: async (entry) => {
    const response = await requestFirstAvailable(
      "post",
      entryPaths,
      await buildBackendEntryPayload(entry)
    );
    return normalizeBackendEntry(unwrapItem(response.data));
  },

  updateEntry: async (entryId, entry) => {
    const response = await requestFirstAvailable(
      "put",
      entryDetailPaths(entryId),
      await buildBackendEntryPayload(entry)
    );
    return normalizeBackendEntry(unwrapItem(response.data));
  },

  deleteEntry: async (entryId) => {
    const response = await requestFirstAvailable("delete", entryDetailPaths(entryId));
    return unwrapItem(response.data);
  },

  getDashboardData: async () => {
    const response = await requestFirstAvailable("get", dashboardPaths, undefined, {
      params: getUserScopedParams(),
    });
    return unwrapItem(response.data);
  },

  getAIInsight: async () => {
    const response = await requestFirstAvailable("get", aiInsightPaths, undefined, {
      params: getUserScopedParams(),
    });
    return unwrapItem(response.data);
  },

  predictCashflow: async ({ totalIncome }) => {
    const response = await requestFirstAvailable("post", aiPredictionPaths, {
      total_income: totalIncome,
      user: getStoredUserId(),
    });
    return unwrapItem(response.data);
  },

  askAssistant: async ({ message }) => {
    const response = await requestFirstAvailable("post", aiAssistantPaths, {
      message,
      user: getStoredUserId(),
    });
    return unwrapItem(response.data);
  },

  getCategories: async () => getCategories(),

  createCategory: async (category) => {
    const response = await requestFirstAvailable("post", categoryPaths, {
      user: category.user ?? category.userId ?? getStoredUserId(),
      name: category.name,
      category_type: category.category_type ?? category.type ?? "income",
    });
    return unwrapItem(response.data);
  },

  updateCategory: async (categoryId, category) => {
    const response = await requestFirstAvailable("patch", categoryDetailPaths(categoryId), {
      ...category,
      user: category.user ?? category.userId ?? getStoredUserId(),
      category_type: category.category_type ?? category.type,
    });
    return unwrapItem(response.data);
  },

  deleteCategory: async (categoryId) => {
    const response = await requestFirstAvailable("delete", categoryDetailPaths(categoryId));
    return unwrapItem(response.data);
  },

  getNotifications: async () => {
    const response = await requestFirstAvailable("get", notificationPaths, undefined, {
      params: getUserScopedParams(),
    });
    return unwrapList(response.data);
  },

  createNotification: async (notification) => {
    const response = await requestFirstAvailable("post", notificationPaths, {
      user: notification.user ?? notification.userId ?? getStoredUserId(),
      title: notification.title,
      message: notification.message,
      is_read: notification.isRead ?? notification.is_read ?? false,
    });
    return unwrapItem(response.data);
  },

  updateNotification: async (notificationId, notification) => {
    const response = await requestFirstAvailable(
      "patch",
      notificationDetailPaths(notificationId),
      {
        ...notification,
        is_read: notification.isRead ?? notification.is_read,
      }
    );
    return unwrapItem(response.data);
  },

  deleteNotification: async (notificationId) => {
    const response = await requestFirstAvailable(
      "delete",
      notificationDetailPaths(notificationId)
    );
    return unwrapItem(response.data);
  },

  getUsers: async () => {
    const response = await requestFirstAvailable("get", userPaths);
    return unwrapList(response.data);
  },

  getUser: async (userId) => {
    const response = await requestFirstAvailable("get", userDetailPaths(userId));
    return unwrapItem(response.data);
  },

  updateUser: async (userId, user) => {
    const response = await requestFirstAvailable("patch", userDetailPaths(userId), user);
    return unwrapItem(response.data);
  },

  deleteUser: async (userId) => {
    const response = await requestFirstAvailable("delete", userDetailPaths(userId));
    return unwrapItem(response.data);
  },

  getPreferences: async () => {
    if (!baseURL) {
      return null;
    }

    const response = await requestFirstAvailable("get", preferencePaths, undefined, {
      params: getUserScopedParams(),
    });
    return unwrapItem(response.data);
  },

  updatePreferences: async (preferences) => {
    if (!baseURL) {
      return null;
    }

    const response = await requestFirstAvailable("put", preferencePaths, {
      ...preferences,
      user: getStoredUserId(),
    });
    return unwrapItem(response.data);
  },

  updateProfile: async (profile) => {
    if (!baseURL) {
      return null;
    }

    const response = await requestFirstAvailable("put", profilePaths, {
      ...profile,
      user: profile.user ?? profile.userId ?? getStoredUserId(),
    });
    return unwrapItem(response.data);
  },

  changePassword: async ({ oldPassword, newPassword, confirmPassword }) => {
    if (!baseURL) {
      return null;
    }

    const response = await requestFirstAvailable("post", passwordPaths, {
      user: getStoredUserId(),
      oldPassword,
      currentPassword: oldPassword,
      newPassword,
      confirmPassword,
    });
    return unwrapItem(response.data);
  },
};

export default api;
