import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildWeekDays, getWeekBounds } from "@/lib/calendar-week";
import { dateStringInTimezone, formatInProfileTimezone } from "@/lib/timezone";

export type WeekAppointment = {
  id: string;
  starts_at: string;
  status: string;
  source: string;
  petName: string;
  clientName: string;
  serviceName: string;
};

type WeekCalendarProps = {
  timezone: string;
  weekParam?: string;
  appointments: WeekAppointment[];
};

export function WeekCalendar({
  timezone,
  weekParam,
  appointments,
}: WeekCalendarProps) {
  const { weekStart, prevWeekKey, nextWeekKey, label } = getWeekBounds(
    weekParam,
    timezone,
  );
  const days = buildWeekDays(weekStart, timezone);

  const grouped = new Map<string, WeekAppointment[]>();
  for (const day of days) {
    grouped.set(day.dateKey, []);
  }
  for (const appt of appointments) {
    const key = dateStringInTimezone(new Date(appt.starts_at), timezone);
    const list = grouped.get(key);
    if (list) list.push(appt);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <div className="flex gap-2">
          <Link
            href={`/calendar?week=${prevWeekKey}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            ← Prev
          </Link>
          <Link
            href={`/calendar?week=${nextWeekKey}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const items = grouped.get(day.dateKey) ?? [];
          return (
            <Card
              key={day.dateKey}
              className={
                day.isToday ? "border-green-300 bg-green-50/40 p-3" : "p-3"
              }
            >
              <div className="mb-2 border-b border-slate-100 pb-2">
                <p className="text-xs font-medium uppercase text-slate-500">
                  {day.weekdayLabel}
                </p>
                <p className="text-sm font-semibold text-slate-900">{day.dayLabel}</p>
              </div>
              {!items.length ? (
                <p className="text-xs text-slate-500">—</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((appt) => (
                    <li key={appt.id}>
                      <Link
                        href={`/appointments/${appt.id}`}
                        className="block rounded-md border border-slate-200 bg-white p-2 text-xs hover:border-green-300"
                      >
                        <p className="font-medium text-green-900">
                          {formatInProfileTimezone(appt.starts_at, timezone, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="mt-1 text-slate-600">
                          {appt.petName} · {appt.serviceName}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {appt.status}
                          </Badge>
                          {appt.source === "public_booking" ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Online
                            </Badge>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
