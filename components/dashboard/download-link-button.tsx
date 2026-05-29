"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type DownloadLinkButtonProps = {
  href: string;
  label: string;
  variant?: "default" | "secondary";
};

export function DownloadLinkButton({
  href,
  label,
  variant = "secondary",
}: DownloadLinkButtonProps) {
  return (
    <Button asChild variant={variant} size="sm" className="gap-2">
      <a href={href} download>
        <Download className="h-4 w-4" aria-hidden />
        {label}
      </a>
    </Button>
  );
}
