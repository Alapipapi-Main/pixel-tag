const KEY = "pixeltag-device-id";

/** Random per-device key that links tracked codes to this browser (no account needed). */
export function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}
