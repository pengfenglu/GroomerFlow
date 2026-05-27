import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

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

/** UTC instant → parts in groomer local calendar. */
export function utcToZonedParts(utc: Date, timezone: string) {
  const zoned = toZonedTime(utc, timezone);
  return {
    dateStr: formatInTimeZone(zoned, timezone, "yyyy-MM-dd"),
    timeStr: formatInTimeZone(zoned, timezone, "HH:mm"),
    weekday: zoned.getDay(),
  };
}

export function formatPriceCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
