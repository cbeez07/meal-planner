/** Coerce any YYYY-MM-DD to that week's Sunday. Weeks always start Sunday. */
export function sundayOf(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new Error("invalid_date");
  }
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(d.getTime())) {
    throw new Error("invalid_date");
  }
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

export function upcomingSunday(from = new Date()): string {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const day = d.getUTCDay();
  if (day !== 0) {
    d.setUTCDate(d.getUTCDate() + (7 - day));
  }
  return d.toISOString().slice(0, 10);
}

export function currentOrUpcomingSunday(from = new Date()): string {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
