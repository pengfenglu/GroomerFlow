/** Platform Stripe + default booking deposit (USD cents). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getDefaultDepositCents(): number {
  const raw = process.env.BOOKING_DEPOSIT_CENTS;
  const parsed = raw ? Number.parseInt(raw, 10) : 2000;
  if (!Number.isFinite(parsed) || parsed < 100) return 2000;
  return parsed;
}

export function resolveDepositCents(profileDepositCents: number): number {
  if (profileDepositCents > 0) return profileDepositCents;
  return getDefaultDepositCents();
}
