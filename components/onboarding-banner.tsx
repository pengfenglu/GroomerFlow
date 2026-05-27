"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "gf_onboarding_dismissed";

type OnboardingBannerProps = {
  bookingSlug: string;
  hasClient: boolean;
  hasService: boolean;
};

export function OnboardingBanner({
  bookingSlug,
  hasClient,
  hasService,
}: OnboardingBannerProps) {
  const dismissed = useSyncExternalStore(
    (onStoreChange) => {
      const handler = () => onStoreChange();
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    () => localStorage.getItem(STORAGE_KEY) === "1",
    () => true,
  );
  const [, setTick] = useState(0);

  if (dismissed) return null;

  const steps = [
    { done: hasClient, label: "Add your first client & pet", href: "/clients" },
    { done: hasService, label: "Set up a service", href: "/settings" },
    {
      done: Boolean(bookingSlug),
      label: "Copy your booking link",
      href: "/settings",
    },
  ];

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setTick((n) => n + 1);
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardTitle className="text-green-900">Welcome to GetGroomerFlow</CardTitle>
      <CardDescription className="text-green-800">
        Complete these steps to start taking online bookings.
      </CardDescription>
      <CardContent className="mt-4 space-y-2">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-800">
          {steps.map((step) => (
            <li key={step.label} className={step.done ? "text-slate-500 line-through" : ""}>
              <Link href={step.href} className="text-green-800 hover:underline">
                {step.label}
              </Link>
            </li>
          ))}
        </ol>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
