import { renderEmailTemplate, type EmailTemplateId } from "@/lib/email-templates";
import type { AppointmentEmailContext } from "@/lib/email-templates";

export async function sendTransactionalEmail(params: {
  to: string;
  templateId: EmailTemplateId;
  context: AppointmentEmailContext;
}): Promise<{ ok: boolean; error?: string }> {
  const { subject, text, html } = renderEmailTemplate(
    params.templateId,
    params.context,
  );

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email:dev]", { to: params.to, subject, text });
      return { ok: true };
    }
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const from =
    process.env.EMAIL_FROM ?? "GetGroomerFlow <bookings@getgroomerflow.com>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || res.statusText };
  }

  return { ok: true };
}
