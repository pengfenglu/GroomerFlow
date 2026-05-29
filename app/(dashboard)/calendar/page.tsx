import { SetupNotice } from "@/components/setup-notice";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffAppointmentAction } from "@/app/actions/appointments";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { getProfileForGroomer } from "@/lib/data/profile";
import { getWeekBounds } from "@/lib/calendar-week";
import { localDateTimeToUtc } from "@/lib/timezone";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const profile = await getProfileForGroomer();
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase || !profile) return <SetupNotice />;

  const { week } = await searchParams;
  const { weekStartKey } = getWeekBounds(week, profile.timezone);
  const rangeStart = localDateTimeToUtc(weekStartKey, "00:00", profile.timezone);
  const nextWeekKey = formatInTimeZone(
    addDays(fromZonedTime(`${weekStartKey}T12:00:00`, profile.timezone), 7),
    profile.timezone,
    "yyyy-MM-dd",
  );
  const rangeEnd = localDateTimeToUtc(nextWeekKey, "00:00", profile.timezone);

  const [{ data: appointments }, { data: pets }, { data: services }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, starts_at, ends_at, status, source, pets(name), clients(full_name), services(name)",
        )
        .eq("groomer_id", groomerId)
        .gte("starts_at", rangeStart.toISOString())
        .lt("starts_at", rangeEnd.toISOString())
        .order("starts_at", { ascending: true }),
      supabase
        .from("pets")
        .select("id, name, client_id, clients(full_name)")
        .eq("groomer_id", groomerId)
        .order("name"),
      supabase
        .from("services")
        .select("id, name, duration_minutes")
        .eq("groomer_id", groomerId)
        .eq("is_active", true)
        .order("name"),
    ]);

  const weekAppointments =
    appointments?.map((appt) => {
      const pet = one(appt.pets as { name: string } | { name: string }[]);
      const client = one(
        appt.clients as { full_name: string } | { full_name: string }[],
      );
      const service = one(
        appt.services as { name: string } | { name: string }[],
      );
      return {
        id: appt.id,
        starts_at: appt.starts_at,
        status: appt.status,
        source: appt.source,
        petName: pet?.name ?? "Pet",
        clientName: client?.full_name ?? "Client",
        serviceName: service?.name ?? "Service",
      };
    }) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
        <p className="text-sm text-slate-600">Week view · {profile.timezone}</p>
      </div>

      <WeekCalendar
        timezone={profile.timezone}
        weekParam={week}
        appointments={weekAppointments}
      />

      <Card>
        <CardTitle>Add appointment (staff)</CardTitle>
        <CardContent className="mt-4">
          <form action={createStaffAppointmentAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pet_id">Pet</Label>
              <select
                id="pet_id"
                name="pet_id"
                required
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="">Select pet</option>
                {pets?.map((pet) => {
                  const client = one(
                    pet.clients as { full_name: string } | { full_name: string }[],
                  );
                  return (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({client?.full_name})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_id">Service</Label>
              <select
                id="service_id"
                name="service_id"
                required
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="">Select service</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="starts_at">Start (local, your timezone)</Label>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                required
              />
            </div>
            <Button type="submit">Add appointment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
