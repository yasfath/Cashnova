import { saveSessionUser } from "./auth";

export const decodeSocialPayload = (value) => {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return null;
  }

  try {
    const paddedValue = normalizedValue.padEnd(
      normalizedValue.length + ((4 - (normalizedValue.length % 4)) % 4),
      "="
    );
    const binaryPayload = atob(paddedValue.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binaryPayload, (character) => character.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const unwrapSocialUser = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const user =
    payload.user ??
    payload.account ??
    payload.profile ??
    payload.client ??
    payload.customer ??
    payload.data?.user ??
    payload.data?.account ??
    payload.data?.profile ??
    payload.data;

  if (user && typeof user === "object" && !Array.isArray(user)) {
    return user;
  }

  return payload;
};

const hasUsableUserDetails = (user) =>
  Boolean(
    user?.id ??
      user?.userId ??
      user?.pk ??
      user?.user_id ??
      user?.email ??
      user?.mail ??
      user?.username ??
      user?.name ??
      user?.fullName
  );

const buildQueryUser = (params) => ({
  id: params.get("user_id") || "",
  email: params.get("email") || "",
  fullName: params.get("name") || "",
  name: params.get("name") || "",
  username: params.get("username") || "",
});

export const completeSocialAuthFromParams = (params) => {
  const payload = decodeSocialPayload(params.get("payload"));
  const payloadUser = unwrapSocialUser(payload);
  const queryUser = buildQueryUser(params);
  const user = hasUsableUserDetails(payloadUser) ? payloadUser : queryUser;

  if (!hasUsableUserDetails(user)) {
    return false;
  }

  saveSessionUser({
    email:
      user.email ??
      user.mail ??
      user.preferred_username ??
      user.userPrincipalName ??
      user.username,
    fullName: user.fullName ?? user.name,
    token: payload?.token,
    user,
  });

  return true;
};
