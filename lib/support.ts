/** Public contact for privacy / data requests (no secrets). */
export function getPrivacyContactEmail(): string {
  return (
    process.env.PRIVACY_CONTACT_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
    "privacy@getgroomerflow.com"
  );
}
