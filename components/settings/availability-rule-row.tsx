"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  deleteAvailabilityAction,
  updateAvailabilityAction,
} from "@/app/actions/settings";
import { SaveButton } from "@/components/settings/save-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AvailabilityRule } from "@/types/database";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type AvailabilityRuleRowProps = {
  rule: AvailabilityRule;
};

function snapshot(rule: AvailabilityRule) {
  return {
    day: String(rule.day_of_week),
    start: rule.start_time.slice(0, 5),
    end: rule.end_time.slice(0, 5),
  };
}

export function AvailabilityRuleRow({ rule }: AvailabilityRuleRowProps) {
  const [baseline, setBaseline] = useState(() => snapshot(rule));
  const [day, setDay] = useState(baseline.day);
  const [start, setStart] = useState(baseline.start);
  const [end, setEnd] = useState(baseline.end);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const dirty =
    day !== baseline.day || start !== baseline.start || end !== baseline.end;

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startSaveTransition(async () => {
      await updateAvailabilityAction(formData);
      const saved = { day, start, end };
      setBaseline(saved);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    });
  }

  function handleDelete() {
    if (
      !window.confirm("Delete hours for this day? This cannot be undone.")
    ) {
      return;
    }
    const formData = new FormData();
    formData.set("id", rule.id);
    startDeleteTransition(async () => {
      await deleteAvailabilityAction(formData);
    });
  }

  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <form onSubmit={handleSave} className="space-y-1">
        <input type="hidden" name="id" value={rule.id} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="space-y-1">
            <Label htmlFor={`day-${rule.id}`}>Day</Label>
            <select
              id={`day-${rule.id}`}
              name="day_of_week"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-green-800 focus:outline-none focus:ring-1 focus:ring-green-800"
            >
              {DAYS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`start-${rule.id}`}>Start</Label>
            <Input
              id={`start-${rule.id}`}
              name="start_time"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`end-${rule.id}`}>End</Label>
            <Input
              id={`end-${rule.id}`}
              name="end_time"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
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
              disabled={isDeleting || isSaving}
              onClick={handleDelete}
              className="h-auto px-2 py-0 text-left text-sm text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </form>
    </li>
  );
}
