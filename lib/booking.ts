import { addDays, addMinutes, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailabilityRule, Appointment } from "@/types/database";
import {
  dateStringInTimezone,
  dayOfWeekInTimezone,
  localDateTimeToUtc,
} from "@/lib/timezone";

export type BookableSlot = {
  startsAtUtc: string;
  endsAtUtc: string;
  label: string;
};

/** Returns true if [start, end) overlaps any non-cancelled appointment. */
export function hasAppointmentConflict(
  existing: Pick<Appointment, "starts_at" | "ends_at" | "status">[],
  startsAt: Date,
  endsAt: Date,
): boolean {
  return existing.some((appt) => {
    if (appt.status === "cancelled") return false;
    const aStart = parseISO(appt.starts_at);
    const aEnd = parseISO(appt.ends_at);
    return startsAt < aEnd && endsAt > aStart;
  });
}

export async function fetchActiveAppointments(
  supabase: SupabaseClient,
  groomerId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, status")
    .eq("groomer_id", groomerId)
    .neq("status", "cancelled")
    .lt("starts_at", rangeEnd.toISOString())
    .gt("ends_at", rangeStart.toISOString());

  if (error) throw error;
  return data ?? [];
}

/** Build bookable slots for the next `daysAhead` days from availability rules. */
export function buildBookableSlots(params: {
  rules: AvailabilityRule[];
  appointments: Pick<Appointment, "starts_at" | "ends_at" | "status">[];
  timezone: string;
  durationMinutes: number;
  daysAhead?: number;
  slotStepMinutes?: number;
}): BookableSlot[] {
  const {
    rules,
    appointments,
    timezone,
    durationMinutes,
    daysAhead = 14,
    slotStepMinutes = 30,
  } = params;

  const slots: BookableSlot[] = [];
  const now = new Date();

  for (let d = 0; d < daysAhead; d += 1) {
    const dayStart = addDays(now, d);
    const dayOfWeek = dayOfWeekInTimezone(dayStart, timezone);
    const dateStr = dateStringInTimezone(dayStart, timezone);

    const dayRules = rules.filter((r) => r.day_of_week === dayOfWeek);
    for (const rule of dayRules) {
      let cursor = localDateTimeToUtc(dateStr, rule.start_time.slice(0, 5), timezone);
      const windowEnd = localDateTimeToUtc(
        dateStr,
        rule.end_time.slice(0, 5),
        timezone,
      );

      while (cursor < windowEnd) {
        const slotEnd = addMinutes(cursor, durationMinutes);
        if (slotEnd > windowEnd) break;
        if (cursor > now && !hasAppointmentConflict(appointments, cursor, slotEnd)) {
          slots.push({
            startsAtUtc: cursor.toISOString(),
            endsAtUtc: slotEnd.toISOString(),
            label: cursor.toISOString(),
          });
        }
        cursor = addMinutes(cursor, slotStepMinutes);
      }
    }
  }

  return slots;
}

export async function findOrCreateClientAndPet(
  supabase: SupabaseClient,
  groomerId: string,
  input: {
    full_name: string;
    phone?: string;
    email: string;
    pet_name: string;
    pet_breed?: string;
  },
) {
  const email = input.email.trim().toLowerCase();
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("groomer_id", groomerId)
    .eq("email", email)
    .maybeSingle();

  let clientId = existingClient?.id;

  if (!clientId) {
    const { data: createdClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        groomer_id: groomerId,
        full_name: input.full_name.trim(),
        phone: input.phone?.trim() || null,
        email,
      })
      .select("id")
      .single();
    if (clientError) throw clientError;
    clientId = createdClient.id;
  }

  const { data: existingPet } = await supabase
    .from("pets")
    .select("id")
    .eq("groomer_id", groomerId)
    .eq("client_id", clientId)
    .ilike("name", input.pet_name.trim())
    .maybeSingle();

  if (existingPet?.id) {
    return { clientId, petId: existingPet.id };
  }

  const { data: createdPet, error: petError } = await supabase
    .from("pets")
    .insert({
      groomer_id: groomerId,
      client_id: clientId,
      name: input.pet_name.trim(),
      breed: input.pet_breed?.trim() || null,
    })
    .select("id")
    .single();
  if (petError) throw petError;

  return { clientId, petId: createdPet.id };
}
