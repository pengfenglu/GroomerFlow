/** Customer-facing copy for rescheduling (public page + email). */
export function formatRescheduleMessage(params: {
  businessName: string;
  contactEmail?: string | null;
}): string {
  const { businessName, contactEmail } = params;
  if (contactEmail?.trim()) {
    return `Need to reschedule? Contact ${businessName} at ${contactEmail.trim()}.`;
  }
  return `Need to reschedule? Please contact ${businessName} directly.`;
}
