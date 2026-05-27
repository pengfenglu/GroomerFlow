"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addMinutes, parseISO } from "date-fns";
import { getGroomerContext } from "@/lib/data/groomer-context";
import {
  fetchActiveAppointments,
  hasAppointmentConflict,
} from "@/lib/booking";

const statusSchema = z.enum(["confirmed", "completed", "cancelled"]);

export async function updateAppointmentStatusAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const id = String(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("groomer_id", groomerId);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath(`/appointments/${id}`);
}

export async function createStaffAppointmentAction(formData: FormData) {
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) throw new Error("Supabase not configured");

  const petId = String(formData.get("pet_id"));
  const serviceId = String(formData.get("service_id"));
  const startsAt = parseISO(String(formData.get("starts_at")));

  const { data: pet } = await supabase
    .from("pets")
    .select("id, client_id")
    .eq("id", petId)
    .eq("groomer_id", groomerId)
    .single();
  if (!pet) throw new Error("Pet not found");

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .eq("groomer_id", groomerId)
    .single();
  if (!service) throw new Error("Service not found");

  const endsAt = addMinutes(startsAt, service.duration_minutes);
  const existing = await fetchActiveAppointments(
    supabase,
    groomerId,
    startsAt,
    endsAt,
  );

  if (hasAppointmentConflict(existing, startsAt, endsAt)) {
    throw new Error("Time slot conflicts with another appointment.");
  }

  const { error } = await supabase.from("appointments").insert({
    groomer_id: groomerId,
    client_id: pet.client_id,
    pet_id: pet.id,
    service_id: serviceId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "confirmed",
    source: "staff",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
