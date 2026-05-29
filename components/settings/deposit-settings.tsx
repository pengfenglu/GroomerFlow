"use client";

import { useState } from "react";
import { updateDepositSettingsAction } from "@/app/actions/billing";
import { SaveButton } from "@/components/settings/save-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DepositSettingsProps = {
  depositEnabled: boolean;
  depositCents: number;
  stripeConfigured: boolean;
  defaultDepositCents: number;
};

export function DepositSettings({
  depositEnabled,
  depositCents,
  stripeConfigured,
  defaultDepositCents,
}: DepositSettingsProps) {
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const dollars = (depositCents > 0 ? depositCents : defaultDepositCents) / 100;

  return (
    <form
      action={updateDepositSettingsAction}
      className="space-y-4"
      onChange={() => {
        setDirty(true);
        setSavedFlash(false);
      }}
      onSubmit={() => {
        setDirty(false);
        setSavedFlash(true);
      }}
    >
      {!stripeConfigured ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Stripe is not configured yet. Deposits can be enabled after{" "}
          <code className="text-xs">STRIPE_SECRET_KEY</code> is set on the server.
        </p>
      ) : null}

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="deposit_enabled"
          defaultChecked={depositEnabled}
          disabled={!stripeConfigured}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          <span className="font-medium text-slate-900">
            Require a booking deposit (Stripe)
          </span>
          <span className="mt-1 block text-slate-600">
            Pet owners pay online before the appointment is confirmed. Funds are
            authorized as a hold (manual capture) to reduce no-shows.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="deposit_dollars">Deposit amount (USD)</Label>
        <Input
          id="deposit_dollars"
          name="deposit_dollars"
          type="number"
          min={1}
          max={500}
          step={1}
          defaultValue={dollars}
          disabled={!stripeConfigured}
        />
        <p className="text-xs text-slate-500">
          Default platform amount is ${(defaultDepositCents / 100).toFixed(0)} if left
          blank.
        </p>
      </div>

      <SaveButton dirty={dirty} savedFlash={savedFlash} />
    </form>
  );
}
