export function getDeviceToken(): string {
  if (typeof window === "undefined") return "";
  const KEY = "sgs_device_token";
  let t = localStorage.getItem(KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(KEY, t);
  }
  return t;
}
