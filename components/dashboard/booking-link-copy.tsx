"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type BookingLinkCopyProps = {
  url: string;
  /** When set, the URL is a clickable preview link. */
  previewHref?: string;
};

export function BookingLinkCopy({ url, previewHref }: BookingLinkCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
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
    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <p className="min-w-0 flex-1 break-all text-sm text-green-800">
        {previewHref ? (
          <Link href={previewHref} className="hover:underline" target="_blank" rel="noreferrer">
            {url}
          </Link>
        ) : (
          url
        )}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0 gap-2"
        onClick={handleCopy}
        aria-label={copied ? "Link copied" : "Copy booking link"}
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
