export type EmailTemplateId = "confirmation" | "day_before";

export type AppointmentEmailContext = {
  businessName: string;
  petName: string;
  startsAtLocal: string;
  clientName: string;
  contactEmail?: string;
  notes?: string;
  calendarUrl?: string;
  rescheduleMessage?: string;
  depositNote?: string;
};

export function renderEmailTemplate(
  templateId: EmailTemplateId,
  ctx: AppointmentEmailContext,
): { subject: string; text: string; html: string } {
  const when = ctx.startsAtLocal;

  if (templateId === "confirmation") {
    const subject = `Appointment confirmed — ${ctx.businessName}`;
    const calendarLine = ctx.calendarUrl
      ? `\nAdd to your calendar: ${ctx.calendarUrl}\n`
      : "";
    const calendarHtml = ctx.calendarUrl
      ? `<p><a href="${escapeHtml(ctx.calendarUrl)}">Add to calendar</a></p>`
      : "";
    const rescheduleLine = ctx.rescheduleMessage
      ? `\n${ctx.rescheduleMessage}\n`
      : "";
    const rescheduleHtml = ctx.rescheduleMessage
      ? `<p>${escapeHtml(ctx.rescheduleMessage)}</p>`
      : "";
    const depositLine = ctx.depositNote ? `\n${ctx.depositNote}\n` : "";
    const depositHtml = ctx.depositNote
      ? `<p><em>${escapeHtml(ctx.depositNote)}</em></p>`
      : "";
    const text = [
      `Hi ${ctx.clientName},`,
      "",
      `Your grooming appointment for ${ctx.petName} is confirmed.`,
      `When: ${when}`,
      calendarLine,
      depositLine,
      rescheduleLine,
      "",
      `— ${ctx.businessName}`,
    ].join("\n");
    return {
      subject,
      text,
      html: `<p>Hi ${escapeHtml(ctx.clientName)},</p>
<p>Your grooming appointment for <strong>${escapeHtml(ctx.petName)}</strong> is confirmed.</p>
<p><strong>When:</strong> ${escapeHtml(when)}</p>
${calendarHtml}
${depositHtml}
${rescheduleHtml}
<p>— ${escapeHtml(ctx.businessName)}</p>`,
    };
  }

  const subject = `Reminder: appointment tomorrow — ${ctx.businessName}`;
  const rescheduleLine = ctx.rescheduleMessage ?? `Need to reschedule? Please contact ${ctx.businessName}.`;
  const text = [
    `Hi ${ctx.clientName},`,
    "",
    `This is a friendly reminder about ${ctx.petName}'s grooming appointment.`,
    `When: ${when}`,
    "",
    rescheduleLine,
    "",
    `— ${ctx.businessName}`,
  ].join("\n");
  return {
    subject,
    text,
    html: `<p>Hi ${escapeHtml(ctx.clientName)},</p>
<p>Reminder: <strong>${escapeHtml(ctx.petName)}</strong> has a grooming appointment coming up.</p>
<p><strong>When:</strong> ${escapeHtml(when)}</p>
<p>${escapeHtml(rescheduleLine)}</p>
<p>— ${escapeHtml(ctx.businessName)}</p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
