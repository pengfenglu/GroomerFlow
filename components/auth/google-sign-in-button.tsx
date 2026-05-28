"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  callbackUrl?: string;
  label?: string;
};

export function GoogleSignInButton({
  callbackUrl = "/dashboard",
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      onClick={() => signIn("google", { callbackUrl })}
    >
      {label}
    </Button>
  );
}
