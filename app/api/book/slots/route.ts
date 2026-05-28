import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBookableSlots, fetchActiveAppointments } from "@/lib/booking";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const querySchema = z.object({
  slug: z.string().min(2),
  service_id: z.string().uuid(),
});

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    slug: searchParams.get("slug"),
    service_id: searchParams.get("service_id"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { slug, service_id } = parsed.data;
  const supabase = createSupabaseServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, timezone")
    .eq("booking_slug", slug)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Groomer not found" }, { status: 404 });
  }

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes, is_active")
    .eq("id", service_id)
    .eq("groomer_id", profile.id)
    .single();

  if (!service?.is_active) {
    return NextResponse.json({ error: "Service not available" }, { status: 400 });
  }

  const [{ data: rules }, rangeStart, rangeEnd] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("groomer_id", profile.id),
    Promise.resolve(new Date()),
    Promise.resolve((() => {
      const end = new Date();
      end.setDate(end.getDate() + 14);
      return end;
    })()),
  ]);

  const appointments = await fetchActiveAppointments(
    supabase,
    profile.id,
    rangeStart,
    rangeEnd,
  );

  const slots = buildBookableSlots({
    rules: rules ?? [],
    appointments,
    timezone: profile.timezone,
    durationMinutes: service.duration_minutes,
  });

  return NextResponse.json({ slots, timezone: profile.timezone });
}
