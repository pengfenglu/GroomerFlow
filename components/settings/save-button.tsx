"use client";

import { Button } from "@/components/ui/button";

type SaveButtonProps = {
  dirty: boolean;
  savedFlash: boolean;
  pending?: boolean;
};

export function SaveButton({
  dirty,
  savedFlash,
  pending = false,
}: SaveButtonProps) {
  let label = "Save";
  if (pending) label = "Saving…";
  else if (savedFlash) label = "Saved";

  const variant = dirty || pending ? "default" : "secondary";

  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending}>
      {label}
    </Button>
  );
}
