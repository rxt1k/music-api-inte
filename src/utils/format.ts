/** Format seconds to mm:ss or hh:mm:ss */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Pick the best audio stream URL: prefer mp4 (itag 140), then any */
export function pickBestStream(urls: Array<{ url: string; type?: string; itag?: string }>): string | null {
  if (!urls || urls.length === 0) return null;
  // Prefer mp4 audio (itag 140, widely supported)
  const mp4 = urls.find((u) => u.itag === "140" || u.type?.includes("audio/mp4"));
  if (mp4) return mp4.url;
  // Fallback to first available
  return urls[0].url;
}

/** Truncate a string with ellipsis */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

/** Safe thumbnail URL – returns undefined if empty */
export function thumbUrl(thumbnails?: Array<{ url: string }>): string | undefined {
  return thumbnails?.[0]?.url || undefined;
}
