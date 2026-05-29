import Link from "next/link";
import { SetupNotice } from "@/components/setup-notice";
import { BookingLinkCopy } from "@/components/dashboard/booking-link-copy";
import { InstagramBioCopy } from "@/components/dashboard/instagram-bio-copy";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { getProfileForGroomer } from "@/lib/data/profile";
import { formatInProfileTimezone, formatPriceCents } from "@/lib/timezone";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";
import { publicBookUrl } from "@/lib/site";
import {
  countCompletedAppointments,
  getMonthRangeUtc,
  getPriorMonthRangeUtc,
  sumRecordAmounts,
} from "@/lib/revenue";
import { findStaleClients } from "@/lib/stale-clients";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const profile = await getProfileForGroomer();
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase || !profile) {
    return <SetupNotice />;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthRange = getMonthRangeUtc(profile.timezone);
  const priorMonthRange = getPriorMonthRangeUtc(profile.timezone);

  const [
    { count: clientCount },
    { count: serviceCount },
    { data: todayAppointments },
    { count: publicBookingsTotal },
    { count: publicBookingsWeek },
    { data: confirmationLogs },
    { data: monthRecords },
    { data: monthAppointments },
    { data: priorRecords },
    { data: allClients },
    { data: allPets },
    { data: completedForStale },
    { data: recordsForStale },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("groomer_id", groomerId),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("groomer_id", groomerId)
      .eq("is_active", true),
    supabase
      .from("appointments")
      .select(
        "id, starts_at, status, pets(name), clients(full_name), services(name)",
      )
      .eq("groomer_id", groomerId)
      .neq("status", "cancelled")
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("groomer_id", groomerId)
      .eq("source", "public_booking")
      .neq("status", "cancelled"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("groomer_id", groomerId)
      .eq("source", "public_booking")
      .neq("status", "cancelled")
      .gte("created_at", weekAgo.toISOString()),
    supabase
      .from("reminder_logs")
      .select("status")
      .eq("groomer_id", groomerId)
      .eq("kind", "confirmation"),
    supabase
      .from("service_records")
      .select("amount_cents, performed_at")
      .eq("groomer_id", groomerId)
      .gte("performed_at", monthRange.start.toISOString())
      .lt("performed_at", monthRange.end.toISOString()),
    supabase
      .from("appointments")
      .select("status, starts_at")
      .eq("groomer_id", groomerId)
      .gte("starts_at", monthRange.start.toISOString())
      .lt("starts_at", monthRange.end.toISOString()),
    supabase
      .from("service_records")
      .select("amount_cents, performed_at")
      .eq("groomer_id", groomerId)
      .gte("performed_at", priorMonthRange.start.toISOString())
      .lt("performed_at", priorMonthRange.end.toISOString()),
    supabase
      .from("clients")
      .select("id, full_name, created_at")
      .eq("groomer_id", groomerId),
    supabase.from("pets").select("client_id, name").eq("groomer_id", groomerId),
    supabase
      .from("appointments")
      .select("client_id, starts_at, status")
      .eq("groomer_id", groomerId)
      .eq("status", "completed"),
    supabase
      .from("service_records")
      .select("pet_id, performed_at, pets(client_id)")
      .eq("groomer_id", groomerId),
  ]);

  const { totalCents: recordedCents, count: recordCount } = sumRecordAmounts(
    monthRecords ?? [],
    monthRange.start,
    monthRange.end,
  );
  const { totalCents: priorMonthRecordedCents } = sumRecordAmounts(
    priorRecords ?? [],
    priorMonthRange.start,
    priorMonthRange.end,
  );
  const completedThisMonth = countCompletedAppointments(
    monthAppointments ?? [],
    monthRange.start,
    monthRange.end,
  );

  const revenueDelta =
    priorMonthRecordedCents > 0
      ? Math.round(
          ((recordedCents - priorMonthRecordedCents) / priorMonthRecordedCents) * 100,
        )
      : null;

  const petsByClient = new Map<string, { name: string }[]>();
  for (const pet of allPets ?? []) {
    const list = petsByClient.get(pet.client_id) ?? [];
    list.push({ name: pet.name });
    petsByClient.set(pet.client_id, list);
  }

  const lastVisitByClient = new Map<string, string | null>();
  for (const appt of completedForStale ?? []) {
    const prev = lastVisitByClient.get(appt.client_id);
    if (!prev || appt.starts_at > prev) {
      lastVisitByClient.set(appt.client_id, appt.starts_at);
    }
  }
  for (const rec of recordsForStale ?? []) {
    const pet = one(
      rec.pets as { client_id: string } | { client_id: string }[] | null,
    );
    if (!pet?.client_id) continue;
    const prev = lastVisitByClient.get(pet.client_id);
    if (!prev || rec.performed_at > prev) {
      lastVisitByClient.set(pet.client_id, rec.performed_at);
    }
  }

  const staleClients = findStaleClients({
    clients: allClients ?? [],
    petsByClient,
    lastVisitByClient,
  });

  const confirmationsSent =
    confirmationLogs?.filter((r) => r.status === "sent").length ?? 0;
  const confirmationsTotal = confirmationLogs?.length ?? 0;
  const emailDeliveryRate =
    confirmationsTotal > 0
      ? Math.round((confirmationsSent / confirmationsTotal) * 100)
      : null;

  const bookingUrl = publicBookUrl(profile.booking_slug);

  return (
    <div className="space-y-6">
      <OnboardingBanner
        bookingSlug={profile.booking_slug}
        hasClient={(clientCount ?? 0) > 0}
        hasService={(serviceCount ?? 0) > 0}
      />

      <TrialBanner profile={profile} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {profile.business_name}
          </h1>
          <p className="text-sm text-slate-600">Today&apos;s schedule</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/calendar">Week calendar →</Link>
        </Button>
      </div>

      <Card>
        <CardTitle>Share your booking link</CardTitle>
        <CardDescription>Paste in Instagram bio, TikTok, or text messages.</CardDescription>
        <CardContent className="mt-4 space-y-4">
          <BookingLinkCopy
            url={bookingUrl}
            previewHref={`/book/${profile.booking_slug}`}
          />
          <InstagramBioCopy businessName={profile.business_name} bookingUrl={bookingUrl} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-900">Appointments today</h2>
        {!todayAppointments?.length ? (
          <p className="text-sm text-slate-600">No appointments scheduled for today.</p>
        ) : (
          <ul className="space-y-2">
            {todayAppointments.map((appt) => {
              const pet = one(appt.pets as { name: string } | { name: string }[]);
              const client = one(
                appt.clients as { full_name: string } | { full_name: string }[],
              );
              const service = one(
                appt.services as { name: string } | { name: string }[],
              );

              return (
                <li key={appt.id}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/appointments/${appt.id}`}
                          className="font-medium text-green-800 hover:underline"
                        >
                          {formatInProfileTimezone(appt.starts_at, profile.timezone)}
                        </Link>
                        <p className="text-sm text-slate-600">
                          {pet?.name} · {client?.full_name} · {service?.name}
                        </p>
                      </div>
                      <Badge variant="secondary">{appt.status}</Badge>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card>
        <CardTitle>This month</CardTitle>
        <CardDescription>{monthRange.label} · from service records</CardDescription>
        <CardContent className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {formatPriceCents(recordedCents)}
            </p>
            <p className="text-xs text-slate-600">
              Recorded revenue ({recordCount} record{recordCount === 1 ? "" : "s"})
            </p>
            {revenueDelta !== null ? (
              <p className="mt-1 text-xs text-slate-500">
                {revenueDelta >= 0 ? "+" : ""}
                {revenueDelta}% vs last month
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{completedThisMonth}</p>
            <p className="text-xs text-slate-600">Completed appointments</p>
          </div>
          <div className="flex items-end">
            <Button asChild variant="secondary" size="sm">
              <Link href="/records">Log a service →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {staleClients.length > 0 ? (
        <Card>
          <CardTitle>Haven&apos;t visited in 90+ days</CardTitle>
          <CardDescription>
            Reach out with a friendly reminder — no AI, just your client list.
          </CardDescription>
          <CardContent className="mt-4">
            <ul className="space-y-2">
              {staleClients.map((row) => (
                <li key={row.clientId}>
                  <Link
                    href={`/clients/${row.clientId}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-green-300"
                  >
                    <span>
                      <span className="font-medium text-slate-900">{row.clientName}</span>
                      {row.petNames.length ? (
                        <span className="text-slate-600">
                          {" "}
                          · {row.petNames.join(", ")}
                        </span>
                      ) : null}
                    </span>
                    <Badge variant="secondary">{row.daysSinceVisit}d idle</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Online booking</CardTitle>
        <CardDescription>Lightweight stats — details in Settings.</CardDescription>
        <CardContent className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {publicBookingsTotal ?? 0}
            </p>
            <p className="text-xs text-slate-600">All-time online bookings</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {publicBookingsWeek ?? 0}
            </p>
            <p className="text-xs text-slate-600">Last 7 days</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {emailDeliveryRate !== null ? `${emailDeliveryRate}%` : "—"}
            </p>
            <p className="text-xs text-slate-600">Confirmation emails sent</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
