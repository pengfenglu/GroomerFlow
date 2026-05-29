import { addMonths, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { localDateTimeToUtc } from "@/lib/timezone";

export type MonthlyRevenueSnapshot = {
  monthLabel: string;
  recordedCents: number;
  recordCount: number;
  completedAppointments: number;
  priorMonthRecordedCents: number;
};

export function getMonthRangeUtc(
  timezone: string,
  ref: Date = new Date(),
): { start: Date; end: Date; label: string } {
  const yearMonth = formatInTimeZone(ref, timezone, "yyyy-MM");
  const start = localDateTimeToUtc(`${yearMonth}-01`, "00:00", timezone);
  const nextMonthKey = formatInTimeZone(addMonths(ref, 1), timezone, "yyyy-MM");
  const end = localDateTimeToUtc(`${nextMonthKey}-01`, "00:00", timezone);
  const label = formatInTimeZone(ref, timezone, "MMMM yyyy");
  return { start, end, label };
}

export function getPriorMonthRangeUtc(
  timezone: string,
  ref: Date = new Date(),
): { start: Date; end: Date } {
  const prior = addMonths(ref, -1);
  const yearMonth = formatInTimeZone(prior, timezone, "yyyy-MM");
  const start = localDateTimeToUtc(`${yearMonth}-01`, "00:00", timezone);
  const nextMonthKey = formatInTimeZone(addMonths(prior, 1), timezone, "yyyy-MM");
  const end = localDateTimeToUtc(`${nextMonthKey}-01`, "00:00", timezone);
  return { start, end };
}

export function sumRecordAmounts(
  records: { amount_cents: number; performed_at: string }[],
  rangeStart: Date,
  rangeEnd: Date,
): { totalCents: number; count: number } {
  let totalCents = 0;
  let count = 0;
  for (const rec of records) {
    const at = parseISO(rec.performed_at);
    if (at >= rangeStart && at < rangeEnd) {
      totalCents += rec.amount_cents;
      count += 1;
    }
  }
  return { totalCents, count };
}

export function countCompletedAppointments(
  appointments: { status: string; starts_at: string }[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  return appointments.filter((appt) => {
    if (appt.status !== "completed") return false;
    const at = parseISO(appt.starts_at);
    return at >= rangeStart && at < rangeEnd;
  }).length;
}
