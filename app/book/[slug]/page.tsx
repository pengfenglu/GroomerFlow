import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/components/book/public-booking-form";
import { BookingFooter } from "@/components/book/booking-footer";
import { BookingHeader } from "@/components/book/booking-header";
import { buildBookableSlots, fetchActiveAppointments } from "@/lib/booking";
import { fetchPendingSlotBlockers } from "@/lib/booking/public-booking";
import { isStripeConfigured, resolveDepositCents } from "@/lib/stripe/config";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Service } from "@/types/database";
import { RescheduleNotice } from "@/components/book/reschedule-notice";
import { getGroomerContactEmail } from "@/lib/groomer-contact";
import { formatRescheduleMessage } from "@/lib/reschedule-message";

export const dynamic = "force-dynamic";

export default async function PublicBookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-600">
        Online booking is not available right now.
      </div>
    );
  }

  const supabase = createSupabaseServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, business_name, bio, avatar_url, timezone, booking_slug, deposit_enabled, deposit_cents",
    )
    .eq("booking_slug", slug)
    .single();

  if (!profile) notFound();

  const groomerEmail = await getGroomerContactEmail(supabase, profile.id);
  const rescheduleMessage = formatRescheduleMessage({
    businessName: profile.business_name,
    contactEmail: groomerEmail,
  });

  const [{ data: services }, { data: rules }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("groomer_id", profile.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("availability_rules")
      .select("*")
      .eq("groomer_id", profile.id),
  ]);

  const activeServices = (services ?? []) as Service[];
  const defaultService = activeServices[0];
  const rangeStart = new Date();
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  const [appointments, pending] = defaultService
    ? await Promise.all([
        fetchActiveAppointments(supabase, profile.id, rangeStart, rangeEnd),
        fetchPendingSlotBlockers(supabase, profile.id, rangeStart, rangeEnd),
      ])
    : [[], []];

  const depositRequired =
    profile.deposit_enabled && isStripeConfigured();
  const depositCents = resolveDepositCents(profile.deposit_cents);

  const slots = defaultService
    ? buildBookableSlots({
        rules: rules ?? [],
        appointments: [...appointments, ...pending],
        timezone: profile.timezone,
        durationMinutes: defaultService.duration_minutes,
      })
    : [];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-8">
        <BookingHeader
          businessName={profile.business_name}
          bio={profile.bio}
          avatarUrl={profile.avatar_url}
          timezone={profile.timezone}
        />

        {!activeServices.length ? (
          <p className="text-center text-sm text-slate-600">
            Online booking is not open yet. Please contact the groomer.
          </p>
        ) : (
          <PublicBookingForm
            slug={slug}
            timezone={profile.timezone}
            services={activeServices}
            initialSlots={slots}
            rescheduleMessage={rescheduleMessage}
            depositRequired={depositRequired}
            depositCents={depositCents}
          />
        )}

        <RescheduleNotice message={rescheduleMessage} />

        <BookingFooter />
      </div>
    </div>
  );
}
