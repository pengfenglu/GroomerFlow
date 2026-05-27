"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import type { Service } from "@/types/database";
import type { BookableSlot } from "@/lib/booking";
import { formatInProfileTimezone } from "@/lib/timezone";

type PublicBookingFormProps = {
  slug: string;
  timezone: string;
  services: Service[];
  slots: BookableSlot[];
};

export function PublicBookingForm({
  slug,
  timezone,
  services,
  slots,
}: PublicBookingFormProps) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slotIso, setSlotIso] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        service_id: serviceId,
        starts_at: slotIso,
        full_name: fullName,
        email,
        phone: phone || undefined,
        pet_name: petName,
        pet_breed: petBreed || undefined,
        notes: notes || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Booking failed. Please try another time.");
      return;
    }

    setSuccess(
      data.starts_at_local
        ? `You're booked for ${data.starts_at_local}. A confirmation email is on its way.`
        : "You're booked! A confirmation email is on its way.",
    );
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardTitle className="text-green-900">You&apos;re all set</CardTitle>
        <CardDescription className="text-green-800">{success}</CardDescription>
        <CardContent className="mt-4 text-sm text-slate-700">
          Book online in minutes — thank you for choosing us.
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="service">Service</Label>
        <select
          id="service"
          className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-green-800 focus:ring-1 focus:ring-green-800"
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            setSlotIso("");
          }}
          required
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration_minutes} min)
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slot">Available time</Label>
        {!slots.length ? (
          <p className="text-sm text-slate-600">
            No open slots in the next two weeks. Please contact the groomer directly.
          </p>
        ) : (
          <select
            id="slot"
            className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            value={slotIso}
            onChange={(e) => setSlotIso(e.target.value)}
            required
          >
            <option value="">Select a time</option>
            {slots.map((slot) => (
              <option key={slot.startsAtUtc} value={slot.startsAtUtc}>
                {formatInProfileTimezone(slot.startsAtUtc, timezone)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. +1 555 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pet_name">Pet name *</Label>
        <Input
          id="pet_name"
          required
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pet_breed">Breed (optional)</Label>
        <Input
          id="pet_breed"
          value={petBreed}
          onChange={(e) => setPetBreed(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !slots.length || !selectedService}
      >
        {loading ? "Booking…" : "Book My Appointment"}
      </Button>
    </form>
  );
}
