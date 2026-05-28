"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  deactivateServiceAction,
  updateServiceAction,
} from "@/app/actions/settings";
import { SaveButton } from "@/components/settings/save-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Service } from "@/types/database";

type ServiceRowProps = {
  service: Service;
};

function snapshot(service: Service) {
  return {
    name: service.name,
    duration: String(service.duration_minutes),
    price: (service.price_cents / 100).toFixed(2),
    isActive: service.is_active,
  };
}

export function ServiceRow({ service }: ServiceRowProps) {
  const [baseline, setBaseline] = useState(() => snapshot(service));
  const [name, setName] = useState(baseline.name);
  const [duration, setDuration] = useState(baseline.duration);
  const [price, setPrice] = useState(baseline.price);
  const [isActive, setIsActive] = useState(baseline.isActive);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  const dirty =
    name !== baseline.name ||
    duration !== baseline.duration ||
    price !== baseline.price ||
    isActive !== baseline.isActive;

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startSaveTransition(async () => {
      await updateServiceAction(formData);
      const saved = { name, duration, price, isActive };
      setBaseline(saved);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    });
  }

  function handleRemove() {
    if (
      !window.confirm(
        "Remove this service from your booking page? Existing appointments are kept.",
      )
    ) {
      return;
    }
    const formData = new FormData();
    formData.set("id", service.id);
    startRemoveTransition(async () => {
      await deactivateServiceAction(formData);
    });
  }

  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <form onSubmit={handleSave} className="space-y-3">
        <input type="hidden" name="id" value={service.id} />
        <label className="flex items-center justify-end gap-2 text-sm text-slate-700 sm:justify-start">
          <input
            type="checkbox"
            name="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Active on booking page
        </label>
        <div className="space-y-1">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="space-y-1">
            <Label htmlFor={`service-name-${service.id}`}>Name</Label>
            <Input
              id={`service-name-${service.id}`}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`service-duration-${service.id}`}>Duration (min)</Label>
            <Input
              id={`service-duration-${service.id}`}
              name="duration_minutes"
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`service-price-${service.id}`}>Price (USD)</Label>
            <Input
              id={`service-price-${service.id}`}
              name="price_dollars"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <SaveButton dirty={dirty} savedFlash={savedFlash} pending={isSaving} />
          </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="hidden lg:block lg:col-span-3" aria-hidden />
            <div className="sm:col-span-2 lg:col-span-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isRemoving || isSaving}
                onClick={handleRemove}
                className="h-auto px-2 py-0 text-left text-sm text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                {isRemoving ? "Removing…" : "Remove from booking"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </li>
  );
}
