import { useEffect, useState } from "react";

const STORAGE_KEYS = [
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

const NAME_KEYS = ["fullName", "name", "userName", "username", "clientName"];
const EMAIL_KEYS = ["email", "mail"];
const AVATAR_KEYS = [
  "avatar",
  "avatarUrl",
  "avatarURL",
  "profilePicture",
  "profileImage",
  "photoURL",
  "image",
];

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const parseStoredValue = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value.trim();
  }
};

const getFirstString = (source, keys) => {
  if (!isObject(source)) {
    return "";
  }

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const formatFallbackName = (value) =>
  value
    .split(/[._-]+|\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const unwrapUserPayload = (value) => {
  if (!isObject(value)) {
    return value;
  }

  if (isObject(value.user)) {
    return value.user;
  }

  if (isObject(value.data?.user)) {
    return value.data.user;
  }

  if (isObject(value.profile)) {
    return value.profile;
  }

  if (isObject(value.account)) {
    return value.account;
  }

  return value;
};

const normalizeSessionUser = (value) => {
  const candidate = unwrapUserPayload(value);

  if (typeof candidate === "string") {
    const rawValue = candidate.trim();

    if (!rawValue) {
      return null;
    }

    const isEmail = rawValue.includes("@");

    return {
      displayName: isEmail ? formatFallbackName(rawValue.split("@")[0]) : rawValue,
      email: isEmail ? rawValue : "",
      avatarUrl: "",
    };
  }

  if (!isObject(candidate)) {
    return null;
  }

  const email = getFirstString(candidate, EMAIL_KEYS);
  const displayName =
    getFirstString(candidate, NAME_KEYS) ||
    (email ? formatFallbackName(email.split("@")[0]) : "");
  const avatarUrl = getFirstString(candidate, AVATAR_KEYS);

  if (!displayName && !email && !avatarUrl) {
    return null;
  }

  return {
    displayName: displayName || "Cashnova Client",
    email,
    avatarUrl,
  };
};

const readStoredSessionUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const stores = [window.sessionStorage, window.localStorage];

  for (const store of stores) {
    for (const key of STORAGE_KEYS) {
      const rawValue = store.getItem(key);
      const sessionUser = normalizeSessionUser(parseStoredValue(rawValue));

      if (sessionUser) {
        return sessionUser;
      }
    }
  }

  return null;
};

export const getSessionUserInitials = (sessionUser) => {
  const displayName = sessionUser?.displayName?.trim();

  if (!displayName) {
    return "C";
  }

  const words = displayName.split(/\s+/).filter(Boolean);

  return (words[0]?.charAt(0) || "C").toUpperCase();
};

export const useSessionUser = (refreshKey) => {
  const [sessionUser, setSessionUser] = useState(() => readStoredSessionUser());

  useEffect(() => {
    setSessionUser(readStoredSessionUser());
  }, [refreshKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncUser = () => {
      setSessionUser(readStoredSessionUser());
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);
    window.addEventListener("cashnova:user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
      window.removeEventListener("cashnova:user-updated", syncUser);
    };
  }, []);

  return sessionUser;
};
