/** Dates are shown in Bangladesh time regardless of the server's timezone. */
const TIME_ZONE = "Asia/Dhaka";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: TIME_ZONE });
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

export const formatDate = (date: Date) => dateFormat.format(date);
export const formatDateTime = (date: Date) => dateTimeFormat.format(date);

/** Midnight today in Dhaka, as a UTC instant (Dhaka is UTC+6, no DST). */
export function startOfDhakaDay(now = new Date()) {
  const offsetMs = 6 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs);
}
