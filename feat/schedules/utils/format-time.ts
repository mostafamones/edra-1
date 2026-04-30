export function formatTime(time: string) {
  if (!time) return "";

  const [h, m] = time.split(":");
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${display}:${m} ${ampm}`;
}

export function formatTimeShort(time: string) {
  if (!time) return "";

  const [h, m] = time.split(":");
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return m === "00" ? `${display} ${ampm}` : `${display}:${m} ${ampm}`;
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "";

  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function timeToMinutes(time: string) {
  if (!time) return 0;

  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}
