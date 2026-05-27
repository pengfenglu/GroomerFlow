"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getGroomerContext } from "@/lib/data/groomer-context";

const clientSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const petSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1),
  breed: z.string().optional(),
  temperament: z.string().optional(),
  coat_notes: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClientAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const parsed = clientSchema.parse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const { error } = await supabase.from("clients").insert({
    groomer_id: groomerId,
    full_name: parsed.full_name,
    phone: parsed.phone || null,
    email: parsed.email || null,
    notes: parsed.notes || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function createPetAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const parsed = petSchema.parse({
    client_id: formData.get("client_id"),
    name: formData.get("name"),
    breed: formData.get("breed") || undefined,
    temperament: formData.get("temperament") || undefined,
    coat_notes: formData.get("coat_notes") || undefined,
    allergies: formData.get("allergies") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const { error } = await supabase.from("pets").insert({
    groomer_id: groomerId,
    client_id: parsed.client_id,
    name: parsed.name,
    breed: parsed.breed || null,
    temperament: parsed.temperament || null,
    coat_notes: parsed.coat_notes || null,
    allergies: parsed.allergies || null,
    notes: parsed.notes || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath(`/clients/${parsed.client_id}`);
}
