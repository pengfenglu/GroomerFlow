"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getGroomerContext } from "@/lib/data/groomer-context";

const recordSchema = z.object({
  pet_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
  amount_cents: z.coerce.number().int().min(0),
  notes: z.string().optional(),
  performed_at: z.string().optional(),
});

export async function createServiceRecordAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const parsed = recordSchema.parse({
    pet_id: formData.get("pet_id"),
    service_id: formData.get("service_id") || undefined,
    amount_cents: Math.round(Number(formData.get("price_dollars")) * 100),
    notes: formData.get("notes") || undefined,
    performed_at: formData.get("performed_at") || undefined,
  });

  const { error } = await supabase.from("service_records").insert({
    groomer_id: groomerId,
    pet_id: parsed.pet_id,
    service_id: parsed.service_id || null,
    amount_cents: parsed.amount_cents,
    notes: parsed.notes || null,
    performed_at: parsed.performed_at
      ? new Date(parsed.performed_at).toISOString()
      : new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/records");
}
