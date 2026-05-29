import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingFooter } from "@/components/book/booking-footer";
import { BookingHeader } from "@/components/book/booking-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatInProfileTimezone } from "@/lib/timezone";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";
import { getPublicAppOrigin } from "@/lib/site";
import { RescheduleNotice } from "@/components/book/reschedule-notice";
import { getGroomerContactEmail } from "@/lib/groomer-contact";
import { formatRescheduleMessage } from "@/lib/reschedule-message";
import { formatDepositCustomerNote } from "@/lib/deposit-copy";
import { resolveAppointmentFromStripeSession } from "@/lib/booking/confirm-stripe-session";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ appointment_id?: string; session_id?: string }>;
}) {
  const { slug } = await params;
  const { appointment_id: appointmentIdParam, session_id: sessionId } =
    await searchParams;

  if (!isSupabaseConfigured() || (!appointmentIdParam && !sessionId)) {
    notFound();
  }

  const supabase = createSupabaseServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, business_name, bio, avatar_url, timezone, booking_slug")
    .eq("booking_slug", slug)
    .single();

  if (!profile) notFound();

  let appointmentId = appointmentIdParam ?? null;

  if (!appointmentId && sessionId) {
    appointmentId = await resolveAppointmentFromStripeSession(
      supabase,
      sessionId,
      slug,
    );
  }

  if (!appointmentId) {
    return (
      <div className="min-h-full bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Processing payment…</h1>
          <p className="text-sm text-slate-600">
            Your payment was received. Refresh this page in a moment, or check your
            email for confirmation.
          </p>
          <Button asChild variant="secondary">
            <Link href={`/book/${slug}`}>Back to booking</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, deposit_cents, deposit_status, pets(name), services(name)",
    )
    .eq("id", appointmentId)
    .eq("groomer_id", profile.id)
    .eq("source", "public_booking")
    .neq("status", "cancelled")
    .single();

  if (!appt) notFound();

  const pet = one(appt.pets as { name: string } | { name: string }[]);
  const service = one(appt.services as { name: string } | { name: string }[]);
  const when = formatInProfileTimezone(appt.starts_at, profile.timezone);
  const calendarUrl = `${getPublicAppOrigin()}/api/calendar/ics?appointment_id=${appt.id}`;
  const groomerEmail = await getGroomerContactEmail(supabase, profile.id);
  const rescheduleMessage = formatRescheduleMessage({
    businessName: profile.business_name,
    contactEmail: groomerEmail,
  });

  const depositNote = formatDepositCustomerNote(
    appt.deposit_cents ?? 0,
    appt.deposit_status ?? "none",
  );

  return (
    <div className="min-h-full bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-8">
        <BookingHeader
          businessName={profile.business_name}
          bio={profile.bio}
          avatarUrl={profile.avatar_url}
          timezone={profile.timezone}
        />

        <Card className="border-green-200 bg-green-50">
          <CardTitle className="text-green-900">You&apos;re all set!</CardTitle>
          <CardDescription className="text-green-800">
            Your appointment is confirmed. We sent a confirmation email — check your inbox
            (and spam folder).
          </CardDescription>
          <CardContent className="mt-4 space-y-2 text-sm text-slate-800">
            <p>
              <span className="font-medium">Service:</span> {service?.name}
            </p>
            <p>
              <span className="font-medium">Pet:</span> {pet?.name}
            </p>
            <p>
              <span className="font-medium">When:</span> {when}
            </p>
            {depositNote ? <p className="text-green-800">{depositNote}</p> : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <a href={calendarUrl}>Add to calendar</a>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link href={`/book/${slug}`}>Book another</Link>
          </Button>
        </div>

        <RescheduleNotice message={rescheduleMessage} />

        <BookingFooter />
      </div>
    </div>
  );
}
