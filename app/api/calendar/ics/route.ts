import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAppointmentIcs } from "@/lib/ics";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";

const querySchema = z.object({
  appointment_id: z.string().uuid(),
});

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    appointment_id: searchParams.get("appointment_id"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid appointment" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, pets(name), services(name), profiles(business_name)",
    )
    .eq("id", parsed.data.appointment_id)
    .neq("status", "cancelled")
    .single();

  if (!appt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pet = one(appt.pets as { name: string } | { name: string }[]);
  const service = one(appt.services as { name: string } | { name: string }[]);
  const profile = one(
    appt.profiles as { business_name: string } | { business_name: string }[],
  );

  const title = `${service?.name ?? "Grooming"} — ${pet?.name ?? "Pet"}`;
  const ics = buildAppointmentIcs({
    uid: `${appt.id}@getgroomerflow.com`,
    title,
    description: `Appointment at ${profile?.business_name ?? "Groomer"}`,
    startsAtUtc: appt.starts_at,
    endsAtUtc: appt.ends_at,
    organizerName: profile?.business_name,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="appointment-${appt.id}.ics"`,
    },
  });
}
