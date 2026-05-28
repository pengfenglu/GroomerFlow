"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Service } from "@/types/database";
import type { BookableSlot } from "@/lib/booking";
import { groupSlotsForSelect } from "@/lib/booking-slot-labels";
import { cn } from "@/lib/utils";

type PublicBookingFormProps = {
  slug: string;
  timezone: string;
  services: Service[];
  initialSlots: BookableSlot[];
};

const STEPS = [
  { id: 1, label: "Select service" },
  { id: 2, label: "Pick a time" },
  { id: 3, label: "Your details" },
] as const;

export function PublicBookingForm({
  slug,
  timezone,
  services,
  initialSlots,
}: PublicBookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slots, setSlots] = useState<BookableSlot[]>(initialSlots);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotIso, setSlotIso] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  const slotGroups = useMemo(
    () => groupSlotsForSelect(slots, timezone),
    [slots, timezone],
  );

  const loadSlots = useCallback(
    async (nextServiceId: string) => {
      setSlotsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/book/slots?slug=${encodeURIComponent(slug)}&service_id=${encodeURIComponent(nextServiceId)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setSlots([]);
          setError(data.error ?? "Could not load times.");
          return;
        }
        setSlots(data.slots ?? []);
      } catch {
        setSlots([]);
        setError("Could not load times. Please try again.");
      } finally {
        setSlotsLoading(false);
      }
    },
    [slug],
  );

  function onServiceChange(nextId: string) {
    setServiceId(nextId);
    setSlotIso("");
    if (nextId !== services[0]?.id) {
      void loadSlots(nextId);
    } else {
      setSlots(initialSlots);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

    if (data.appointment_id) {
      router.push(`/book/${slug}/success?appointment_id=${data.appointment_id}`);
      return;
    }

    setError("Booking succeeded but could not open confirmation page.");
  }

  function goNext() {
    setError(null);
    if (step === 1 && !serviceId) {
      setError("Please select a service.");
      return;
    }
    if (step === 2 && !slotIso) {
      setError("Please select a time.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Booking steps" className="flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex-1 rounded-lg border px-2 py-2 text-center text-xs font-medium sm:text-sm",
              step === s.id
                ? "border-green-800 bg-green-50 text-green-900"
                : step > s.id
                  ? "border-green-200 bg-white text-green-800"
                  : "border-slate-200 bg-white text-slate-500",
            )}
          >
            <span className="hidden sm:inline">
              {s.id}. {s.label}
            </span>
            <span className="sm:hidden">{s.id}</span>
          </div>
        ))}
      </nav>

      <form onSubmit={onSubmit} className="space-y-6">
        {step === 1 ? (
          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <select
              id="service"
              className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-green-800 focus:outline-none focus:ring-1 focus:ring-green-800"
              value={serviceId}
              onChange={(e) => onServiceChange(e.target.value)}
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration_minutes} min
                </option>
              ))}
            </select>
            {selectedService ? (
              <p className="text-sm text-slate-600">
                {selectedService.duration_minutes} minute appointment
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            <Label htmlFor="slot">Available time</Label>
            {slotsLoading ? (
              <p className="text-sm text-slate-600">Loading times…</p>
            ) : !slotGroups.length ? (
              <p className="text-sm text-slate-600">
                No open slots in the next two weeks. Please contact the groomer directly.
              </p>
            ) : (
              <select
                id="slot"
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-green-800 focus:outline-none focus:ring-1 focus:ring-green-800"
                value={slotIso}
                onChange={(e) => setSlotIso(e.target.value)}
                required
              >
                <option value="">Select a time</option>
                {slotGroups.map((group) => (
                  <optgroup key={group.dateKey} label={group.dateLabel}>
                    {group.slots.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.timeLabel}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
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
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          {step > 1 ? (
            <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
              Back
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          {step < 3 ? (
            <Button
              type="button"
              className="flex-1"
              onClick={goNext}
              disabled={step === 2 && (slotsLoading || !slotGroups.length)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !slotIso || !selectedService}
            >
              {loading ? "Booking…" : "Book My Appointment"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
