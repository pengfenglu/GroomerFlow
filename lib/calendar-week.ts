import { addDays, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { dateStringInTimezone } from "@/lib/timezone";

const LOCALE = "en-US";

/** Sunday-start week in groomer timezone. */
export function getWeekBounds(
  weekParam: string | undefined,
  timezone: string,
): {
  weekStart: Date;
  weekStartKey: string;
  weekEnd: Date;
  prevWeekKey: string;
  nextWeekKey: string;
  label: string;
} {
  const now = new Date();
  const anchor = weekParam
    ? fromZonedTime(`${weekParam}T12:00:00`, timezone)
    : toZonedTime(now, timezone);

  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const weekStartKey = formatInTimeZone(weekStart, timezone, "yyyy-MM-dd");
  const weekEnd = addDays(weekStart, 7);
  const prevWeekKey = formatInTimeZone(addDays(weekStart, -7), timezone, "yyyy-MM-dd");
  const nextWeekKey = formatInTimeZone(addDays(weekStart, 7), timezone, "yyyy-MM-dd");

  const endLabel = formatInTimeZone(addDays(weekStart, 6), timezone, "MMM d, yyyy");
  const startLabel = formatInTimeZone(weekStart, timezone, "MMM d");
  const label = `${startLabel} – ${endLabel}`;

  return { weekStart, weekStartKey, weekEnd, prevWeekKey, nextWeekKey, label };
}

export type WeekDayColumn = {
  dateKey: string;
  weekdayLabel: string;
  dayLabel: string;
  isToday: boolean;
};

export function buildWeekDays(weekStart: Date, timezone: string): WeekDayColumn[] {
  const todayKey = dateStringInTimezone(new Date(), timezone);
  const days: WeekDayColumn[] = [];

  for (let i = 0; i < 7; i += 1) {
    const day = addDays(weekStart, i);
    const dateKey = formatInTimeZone(day, timezone, "yyyy-MM-dd");
    days.push({
      dateKey,
      weekdayLabel: new Intl.DateTimeFormat(LOCALE, {
        timeZone: timezone,
        weekday: "short",
      }).format(day),
      dayLabel: new Intl.DateTimeFormat(LOCALE, {
        timeZone: timezone,
        month: "short",
        day: "numeric",
      }).format(day),
      isToday: dateKey === todayKey,
    });
  }

  return days;
}
