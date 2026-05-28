import { formatInTimeZone } from "date-fns-tz";
import type { BookableSlot } from "@/lib/booking";

const LOCALE = "en-US";

/** e.g. "12:00 PM" in groomer timezone. */
export function formatSlotTimeOnly(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoUtc));
}

/** e.g. "Wed, May 28, 2026" for optgroup labels. */
export function formatSlotDateGroup(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoUtc));
}

export type SlotOptionGroup = {
  dateKey: string;
  dateLabel: string;
  slots: { value: string; timeLabel: string }[];
};

export function groupSlotsForSelect(
  slots: BookableSlot[],
  timezone: string,
): SlotOptionGroup[] {
  const map = new Map<string, SlotOptionGroup>();

  for (const slot of slots) {
    const dateKey = formatInTimeZone(slot.startsAtUtc, timezone, "yyyy-MM-dd");
    const existing = map.get(dateKey);
    const entry = {
      value: slot.startsAtUtc,
      timeLabel: formatSlotTimeOnly(slot.startsAtUtc, timezone),
    };
    if (existing) {
      existing.slots.push(entry);
    } else {
      map.set(dateKey, {
        dateKey,
        dateLabel: formatSlotDateGroup(slot.startsAtUtc, timezone),
        slots: [entry],
      });
    }
  }

  return [...map.values()];
}
