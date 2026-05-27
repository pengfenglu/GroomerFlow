import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { slugifyBusinessName, appendSlugSuffix } from "@/lib/slug";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  business_name: z.string().min(2).max(120),
  timezone: z.string().min(3).default("America/Los_Angeles"),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. See .env.example." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, business_name, timezone } = parsed.data;
  const supabase = createSupabaseServiceClient();

  const { data: signUpData, error: signUpError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (signUpError || !signUpData.user) {
    return NextResponse.json(
      { error: signUpError?.message ?? "Registration failed" },
      { status: 400 },
    );
  }

  const groomerId = signUpData.user.id;
  let bookingSlug = slugifyBusinessName(business_name);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const { error: profileError } = await supabase.from("profiles").insert({
    id: groomerId,
    business_name,
    booking_slug: bookingSlug,
    timezone,
    subscription_plan: "trial",
    subscription_status: "trialing",
    trial_ends_at: trialEnds.toISOString(),
  });

  if (profileError) {
    if (profileError.code === "23505") {
      bookingSlug = appendSlugSuffix(bookingSlug, groomerId);
      const { error: retryError } = await supabase.from("profiles").insert({
        id: groomerId,
        business_name,
        booking_slug: bookingSlug,
        timezone,
        subscription_plan: "trial",
        subscription_status: "trialing",
        trial_ends_at: trialEnds.toISOString(),
      });
      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, booking_slug: bookingSlug });
}
