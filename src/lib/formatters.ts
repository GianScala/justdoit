export function fullDateHeader(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function daysLabel(days: number): { text: string; cls: string } {
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: "overdue" };
  if (days === 0) return { text: "Today", cls: "soon" };
  if (days === 1) return { text: "Tomorrow", cls: "soon" };
  return { text: `${days} days`, cls: "" };
}

export function getDayName(): string {
  return new Date().toLocaleDateString(undefined, { weekday: "long" });
}

export function getDateStr(): string {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
