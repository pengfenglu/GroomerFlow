import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  createPublicAppointment,
  resolvePublicBookContext,
  type PublicBookInput,
} from "@/lib/booking/public-booking";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const bookSchema = z.object({
  slug: z.string().min(2),
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
  pet_name: z.string().min(1),
  pet_breed: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Booking is unavailable. Server configuration missing." },
      { status: 503 },
    );
  }

  const json = await request.json();
  const parsed = bookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data as PublicBookInput;
  const supabase = createSupabaseServiceClient();
  const resolved = await resolvePublicBookContext(supabase, input);

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  if (resolved.ctx.profile.deposit_enabled) {
    return NextResponse.json(
      {
        error: "A booking deposit is required for this groomer.",
        requires_deposit: true,
      },
      { status: 402 },
    );
  }

  try {
    const { appointmentId, startsAtLocal } = await createPublicAppointment(supabase, {
      ctx: resolved.ctx,
      input,
      depositCents: 0,
      depositStatus: "none",
      sendConfirmationEmail: true,
    });

    return NextResponse.json({
      ok: true,
      appointment_id: appointmentId,
      starts_at_local: startsAtLocal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
