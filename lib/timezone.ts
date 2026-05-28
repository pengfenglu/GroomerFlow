import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const DEFAULT_LOCALE = "en-US";

export function formatInProfileTimezone(
  isoUtc: string | Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
): string {
  const date = typeof isoUtc === "string" ? new Date(isoUtc) : isoUtc;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    ...options,
    timeZone: timezone,
  }).format(date);
}

/** Display label for public booking header. */
export function timezoneLabel(timezone: string): string {
  return timezone.replaceAll("_", " ");
}

/** Parse local date + time in groomer TZ → UTC Date. */
export function localDateTimeToUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  const localIso = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(localIso, timezone);
}

/** Sunday=0 … Saturday=6 in groomer timezone (matches Settings day picker). */
export function dayOfWeekInTimezone(date: Date, timezone: string): number {
  const iso = parseInt(formatInTimeZone(date, timezone, "i"), 10);
  return iso === 7 ? 0 : iso;
}

export function dateStringInTimezone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

/** UTC instant → parts in groomer local calendar. */
export function utcToZonedParts(utc: Date, timezone: string) {
  return {
    dateStr: dateStringInTimezone(utc, timezone),
    timeStr: formatInTimeZone(utc, timezone, "HH:mm"),
    weekday: dayOfWeekInTimezone(utc, timezone),
  };
}

export function formatPriceCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
