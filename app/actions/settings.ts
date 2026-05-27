"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { slugifyBusinessName } from "@/lib/slug";

const profileSchema = z.object({
  business_name: z.string().min(2),
  booking_slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  timezone: z.string().min(3),
  bio: z.string().max(500).optional(),
});

const serviceSchema = z.object({
  name: z.string().min(1),
  duration_minutes: z.coerce.number().int().positive(),
  price_cents: z.coerce.number().int().min(0),
});

const availabilitySchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
});

export async function updateProfileAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const parsed = profileSchema.parse({
    business_name: formData.get("business_name"),
    booking_slug: formData.get("booking_slug"),
    timezone: formData.get("timezone"),
    bio: formData.get("bio") || undefined,
  });

  const { error } = await supabase
    .from("profiles")
    .update({
      business_name: parsed.business_name,
      booking_slug: parsed.booking_slug,
      timezone: parsed.timezone,
      bio: parsed.bio || null,
    })
    .eq("id", groomerId);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/book/${parsed.booking_slug}`);
}

export async function createServiceAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const parsed = serviceSchema.parse({
    name: formData.get("name"),
    duration_minutes: formData.get("duration_minutes"),
    price_cents: Math.round(Number(formData.get("price_dollars")) * 100),
  });

  const { error } = await supabase.from("services").insert({
    groomer_id: groomerId,
    name: parsed.name,
    duration_minutes: parsed.duration_minutes,
    price_cents: parsed.price_cents,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function createAvailabilityAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const parsed = availabilitySchema.parse({
    day_of_week: formData.get("day_of_week"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });

  const { error } = await supabase.from("availability_rules").insert({
    groomer_id: groomerId,
    day_of_week: parsed.day_of_week,
    start_time: parsed.start_time,
    end_time: parsed.end_time,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function suggestSlugAction(formData: FormData) {
  const name = String(formData.get("business_name") ?? "");
  return slugifyBusinessName(name);
}
