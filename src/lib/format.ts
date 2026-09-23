export function formatMoney(value: string): string {
  const [whole = "0", cents = "00"] = value.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `Q${formattedWhole}.${cents.padEnd(2, "0").slice(0, 2)}`;
}

export function formatLongDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatShortDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const parts = new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const dayPart = parts.find((part) => part.type === "day")?.value ?? "";
  const monthPart = parts.find((part) => part.type === "month")?.value ?? "";
  const yearPart = parts.find((part) => part.type === "year")?.value ?? "";

  return `${dayPart} ${monthPart.replace(".", "").toUpperCase()} ${yearPart}`;
}
