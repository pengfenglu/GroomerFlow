"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { getDefaultDepositCents, isStripeConfigured } from "@/lib/stripe/config";

const depositSchema = z.object({
  deposit_enabled: z.coerce.boolean(),
  deposit_cents: z.coerce.number().int().min(0).max(50000),
});

export async function updateDepositSettingsAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const parsed = depositSchema.parse({
    deposit_enabled: formData.get("deposit_enabled") === "on",
    deposit_cents: Math.round(Number(formData.get("deposit_dollars")) * 100),
  });

  if (parsed.deposit_enabled && !isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured on the server. Add STRIPE_SECRET_KEY before enabling deposits.",
    );
  }

  const depositCents =
    parsed.deposit_cents > 0 ? parsed.deposit_cents : getDefaultDepositCents();

  const { error } = await supabase
    .from("profiles")
    .update({
      deposit_enabled: parsed.deposit_enabled,
      deposit_cents: depositCents,
    })
    .eq("id", groomerId);

  if (error) throw new Error(error.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select("booking_slug")
    .eq("id", groomerId)
    .single();

  revalidatePath("/settings");
  if (profile?.booking_slug) {
    revalidatePath(`/book/${profile.booking_slug}`);
  }
}
