export async function getDeviceHash(): Promise<string> {
  const raw = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + "x" + screen.height,
    window.devicePixelRatio,
  ].join("|");

  const enc = new TextEncoder().encode(raw);
  const hash = await crypto.subtle.digest("SHA-256", enc);

  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
