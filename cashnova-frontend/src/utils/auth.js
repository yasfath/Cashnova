const AUTH_STATUS_KEY = "cashnova_authenticated";
const AUTH_USER_KEY = "cashnovaUser";
const AUTH_TOKEN_KEY = "cashnova_auth_token";
const LEGACY_AUTH_KEYS = [
  AUTH_STATUS_KEY,
  AUTH_TOKEN_KEY,
  "cashnovaToken",
  "token",
  "cashnovaUser",
  "cashnova_user",
  "currentUser",
  "current_user",
  "authUser",
  "auth_user",
  "loggedInUser",
  "logged_in_user",
  "clientUser",
  "client_user",
  "user",
];

const getStorage = (storageName) => {
  if (typeof window === "undefined") {
    return null;
  }

  return window[storageName] ?? null;
};

const readBoolean = (value) => value === "true";

const clearKeysFromStorage = (storage, keys) => {
  if (!storage) {
    return;
  }

  keys.forEach((key) => storage.removeItem(key));
};

export const hasAuthenticatedSession = () => {
  const storages = [getStorage("sessionStorage"), getStorage("localStorage")].filter(Boolean);

  if (storages.length === 0) {
    return false;
  }

  return storages.some((storage) => {
    const storedStatus = storage.getItem(AUTH_STATUS_KEY);
    const storedUser = storage.getItem(AUTH_USER_KEY);
    const storedToken = storage.getItem(AUTH_TOKEN_KEY);

    return readBoolean(storedStatus) || Boolean(storedUser) || Boolean(storedToken);
  });
};

const getDisplayNameFromEmail = (email) => {
  const emailName = String(email ?? "").split("@")[0];

  return emailName
    .split(/[._-]+|\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const unwrapUserPayload = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  if (value.user && typeof value.user === "object") {
    return value.user;
  }

  if (value.data?.user && typeof value.data.user === "object") {
    return value.data.user;
  }

  return value;
};

export const saveSessionUser = ({ email, fullName, token = "", user = null }) => {
  const storage = getStorage("sessionStorage");
  const legacyStorage = getStorage("localStorage");

  if (!storage) {
    return;
  }

  clearKeysFromStorage(legacyStorage, LEGACY_AUTH_KEYS);

  const sessionUser = unwrapUserPayload(user);
  const normalizedEmail = String(
    sessionUser.email ??
      sessionUser.mail ??
      sessionUser.preferred_username ??
      sessionUser.userPrincipalName ??
      email ??
      ""
  ).trim();
  const normalizedFullName = String(
    sessionUser.fullName ??
      sessionUser.name ??
      sessionUser.userName ??
      sessionUser.username ??
      fullName ??
      ""
  ).trim();
  const normalizedToken = String(token ?? "").trim();

  storage.setItem(AUTH_STATUS_KEY, "true");

  if (normalizedToken) {
    storage.setItem(AUTH_TOKEN_KEY, normalizedToken);
  }

  storage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      id: sessionUser.id ?? sessionUser.userId ?? sessionUser.pk ?? sessionUser.user_id ?? "",
      email: normalizedEmail,
      fullName: normalizedFullName || getDisplayNameFromEmail(normalizedEmail) || "Cashnova Client",
      name: normalizedFullName || getDisplayNameFromEmail(normalizedEmail) || "Cashnova Client",
      username: sessionUser.username ?? sessionUser.userName ?? "",
      avatarUrl:
        sessionUser.avatarUrl ??
        sessionUser.avatarURL ??
        sessionUser.profileImage ??
        sessionUser.photoURL ??
        "",
      contactNumber: sessionUser.contactNumber ?? sessionUser.phone ?? "",
      phone: sessionUser.phone ?? sessionUser.contactNumber ?? "",
    })
  );

  if (legacyStorage) {
    legacyStorage.setItem(AUTH_STATUS_KEY, "true");

    if (normalizedToken) {
      legacyStorage.setItem(AUTH_TOKEN_KEY, normalizedToken);
    }

    legacyStorage.setItem(AUTH_USER_KEY, storage.getItem(AUTH_USER_KEY));
  }
};

export const updateSessionUser = (updates) => {
  const storage = getStorage("sessionStorage");

  if (!storage) {
    return;
  }

  let currentUser = {};

  try {
    currentUser = JSON.parse(storage.getItem(AUTH_USER_KEY) || "{}");
  } catch {
    currentUser = {};
  }

  const normalizedUpdates = {
    ...updates,
  };

  if (updates?.displayName && !updates.name && !updates.fullName) {
    normalizedUpdates.name = updates.displayName;
    normalizedUpdates.fullName = updates.displayName;
  }

  storage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      ...currentUser,
      ...normalizedUpdates,
    })
  );
  storage.setItem(AUTH_STATUS_KEY, "true");
  window.dispatchEvent(new Event("cashnova:user-updated"));
};

export const clearSessionUser = () => {
  if (typeof window === "undefined") {
    return;
  }

  const storages = [getStorage("localStorage"), getStorage("sessionStorage")].filter(Boolean);

  storages.forEach((storage) => {
    clearKeysFromStorage(storage, LEGACY_AUTH_KEYS);
  });
};
