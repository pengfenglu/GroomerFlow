import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateAppointmentStatusAction } from "@/app/actions/appointments";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { getProfileForGroomer } from "@/lib/data/profile";
import { formatInProfileTimezone } from "@/lib/timezone";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { id } = await params;
  const profile = await getProfileForGroomer();
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase || !profile) return <SetupNotice />;

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      "*, pets(name), clients(full_name, phone, email), services(name, price_cents)",
    )
    .eq("id", id)
    .eq("groomer_id", groomerId)
    .single();

  if (!appt) notFound();

  const pet = one(appt.pets as { name: string } | { name: string }[]);
  const client = one(
    appt.clients as
      | { full_name: string; phone: string | null; email: string | null }
      | { full_name: string; phone: string | null; email: string | null }[],
  );
  const service = one(
    appt.services as
      | { name: string; price_cents: number }
      | { name: string; price_cents: number }[],
  );

  return (
    <div className="space-y-6">
      <Link href="/calendar" className="text-sm text-green-800 hover:underline">
        ← Back to calendar
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Appointment</h1>
        <Badge>{appt.status}</Badge>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <p>
            <span className="font-medium">When:</span>{" "}
            {formatInProfileTimezone(appt.starts_at, profile.timezone)} –{" "}
            {formatInProfileTimezone(appt.ends_at, profile.timezone, {
              timeStyle: "short",
              dateStyle: undefined,
            })}
          </p>
          <p>
            <span className="font-medium">Client:</span> {client?.full_name}
          </p>
          <p>
            <span className="font-medium">Pet:</span> {pet?.name}
          </p>
          <p>
            <span className="font-medium">Service:</span> {service?.name}
          </p>
          <p>
            <span className="font-medium">Source:</span> {appt.source}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Update status</CardTitle>
        <CardContent className="mt-4 flex flex-wrap gap-2">
          {(["confirmed", "completed", "cancelled"] as const).map((status) => (
            <form key={status} action={updateAppointmentStatusAction}>
              <input type="hidden" name="id" value={appt.id} />
              <input type="hidden" name="status" value={status} />
              <Button
                type="submit"
                variant={appt.status === status ? "default" : "secondary"}
                size="sm"
              >
                {status}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
