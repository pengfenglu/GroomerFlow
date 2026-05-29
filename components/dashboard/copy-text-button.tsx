"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyTextButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: "default" | "secondary";
  size?: "default" | "sm";
};

export function CopyTextButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  variant = "secondary",
  size = "sm",
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className="gap-2"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      {copied ? copiedLabel : label}
    </Button>
  );
}
