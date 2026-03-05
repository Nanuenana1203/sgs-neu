export function getDeviceToken(): string {
  if (typeof window === "undefined") return "";
  const key = "sgs_device_token";
  let t = localStorage.getItem(key);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(key, t);
  }
  return t;
}
