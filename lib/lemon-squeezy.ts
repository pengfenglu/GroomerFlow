/** Lemon Squeezy MoR subscription — checkout URL + webhook placeholder. */

export function isLemonSqueezyCheckoutConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL?.trim());
}

export function getLemonSqueezyCheckoutUrl(groomerId: string): string | null {
  const base = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL?.trim();
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set("checkout[custom][groomer_id]", groomerId);
  return url.toString();
}

export function isLemonSqueezyWebhookConfigured(): boolean {
  return Boolean(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim());
}
