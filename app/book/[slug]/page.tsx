import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/components/book/public-booking-form";
import { BookingFooter } from "@/components/book/booking-footer";
import { BookingHeader } from "@/components/book/booking-header";
import { buildBookableSlots, fetchActiveAppointments } from "@/lib/booking";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Service } from "@/types/database";

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
    .select("id, business_name, bio, avatar_url, timezone, booking_slug")
    .eq("booking_slug", slug)
    .single();

  if (!profile) notFound();

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

  const appointments = defaultService
    ? await fetchActiveAppointments(supabase, profile.id, rangeStart, rangeEnd)
    : [];

  const slots = defaultService
    ? buildBookableSlots({
        rules: rules ?? [],
        appointments,
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
          />
        )}

        <BookingFooter />
      </div>
    </div>
  );
}
