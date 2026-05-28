/** Canonical production origin (custom domain). */
export const PRODUCTION_APP_ORIGIN = "https://www.getgroomerflow.com";

/**
 * Public site URL for booking links, emails, and metadata.
 * Prefer NEXT_PUBLIC_APP_URL; falls back to NEXTAUTH_URL, then production origin.
 */
export function getPublicAppOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");

  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return PRODUCTION_APP_ORIGIN;
}

export function publicBookUrl(bookingSlug: string): string {
  return `${getPublicAppOrigin()}/book/${bookingSlug}`;
}
