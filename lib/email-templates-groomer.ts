export type GroomerEmailTemplateId = "trial_ending_soon" | "trial_ended";

export type GroomerEmailContext = {
  businessName: string;
  trialEndsAtLabel: string;
  daysRemaining?: number;
  billingUrl: string;
};

export function renderGroomerEmailTemplate(
  templateId: GroomerEmailTemplateId,
  ctx: GroomerEmailContext,
): { subject: string; text: string; html: string } {
  if (templateId === "trial_ending_soon") {
    const days = ctx.daysRemaining ?? 0;
    const subject = `Your GroomerFlow trial ends in ${days} day${days === 1 ? "" : "s"}`;
    const text = [
      `Hi ${ctx.businessName},`,
      "",
      `Your 14-day GroomerFlow trial ends on ${ctx.trialEndsAtLabel} (${days} day${days === 1 ? "" : "s"} left).`,
      "Subscribe to keep your booking link, calendar, and client list active.",
      "",
      `Manage billing: ${ctx.billingUrl}`,
      "",
      "— GetGroomerFlow",
    ].join("\n");
    return {
      subject,
      text,
      html: `<p>Hi ${escapeHtml(ctx.businessName)},</p>
<p>Your <strong>14-day trial</strong> ends on <strong>${escapeHtml(ctx.trialEndsAtLabel)}</strong> (${days} day${days === 1 ? "" : "s"} left).</p>
<p>Subscribe to keep your booking link, calendar, and client tools.</p>
<p><a href="${escapeHtml(ctx.billingUrl)}">View billing &amp; subscribe</a></p>
<p>— GetGroomerFlow</p>`,
    };
  }

  const subject = "Your GroomerFlow trial has ended";
  const text = [
    `Hi ${ctx.businessName},`,
    "",
    `Your trial ended on ${ctx.trialEndsAtLabel}. Subscribe to continue using GroomerFlow cloud features.`,
    "",
    `Manage billing: ${ctx.billingUrl}`,
    "",
    "— GetGroomerFlow",
  ].join("\n");
  return {
    subject,
    text,
    html: `<p>Hi ${escapeHtml(ctx.businessName)},</p>
<p>Your trial ended on <strong>${escapeHtml(ctx.trialEndsAtLabel)}</strong>.</p>
<p><a href="${escapeHtml(ctx.billingUrl)}">Subscribe now</a> to keep your account active.</p>
<p>— GetGroomerFlow</p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
