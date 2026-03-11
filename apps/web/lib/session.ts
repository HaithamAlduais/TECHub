const USER_ID_KEY = "techub_user_id";
const DEVELOPER_ID_KEY = "techub_developer_id";

export function setSession(userId: string, developerId?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_ID_KEY, userId);
  if (developerId) localStorage.setItem(DEVELOPER_ID_KEY, developerId);
}

export function getUserId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_ID_KEY) ?? "";
}

export function getDeveloperId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DEVELOPER_ID_KEY) ?? "";
}

export function authHeaders() {
  const userId = getUserId();
  return userId ? { "X-User-Id": userId } : {};
}
