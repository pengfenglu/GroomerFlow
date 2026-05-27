import Link from "next/link";
import { SetupNotice } from "@/components/setup-notice";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { getProfileForGroomer } from "@/lib/data/profile";
import { formatInProfileTimezone } from "@/lib/timezone";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";
import { publicBookUrl } from "@/lib/site";

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

  const [
    { count: clientCount },
    { count: serviceCount },
    { data: todayAppointments },
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
  ]);

  const bookingUrl = publicBookUrl(profile.booking_slug);

  return (
    <div className="space-y-6">
      <OnboardingBanner
        bookingSlug={profile.booking_slug}
        hasClient={(clientCount ?? 0) > 0}
        hasService={(serviceCount ?? 0) > 0}
      />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {profile.business_name}
        </h1>
        <p className="text-sm text-slate-600">Today&apos;s schedule</p>
      </div>

      <Card>
        <CardTitle>Booking link</CardTitle>
        <CardDescription>Share on Instagram or text messages.</CardDescription>
        <CardContent className="mt-2 break-all text-sm text-green-800">
          <Link href={`/book/${profile.booking_slug}`} className="hover:underline">
            {bookingUrl}
          </Link>
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
                        <p className="font-medium text-slate-900">
                          {formatInProfileTimezone(appt.starts_at, profile.timezone)}
                        </p>
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
    </div>
  );
}
