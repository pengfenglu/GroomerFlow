import { parseISO } from "date-fns";

/** Build a minimal .ics file for one appointment (UTC timestamps). */
export function buildAppointmentIcs(params: {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startsAtUtc: string;
  endsAtUtc: string;
  organizerName?: string;
}): string {
  const start = formatIcsUtc(params.startsAtUtc);
  const end = formatIcsUtc(params.endsAtUtc);
  const stamp = formatIcsUtc(new Date().toISOString());
  const description = escapeIcsText(params.description ?? "");
  const location = escapeIcsText(params.location ?? "");
  const summary = escapeIcsText(params.title);
  const organizer = escapeIcsText(params.organizerName ?? "GetGroomerFlow");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GetGroomerFlow//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : null,
    location ? `LOCATION:${location}` : null,
    `ORGANIZER;CN=${organizer}:mailto:noreply@getgroomerflow.com`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function formatIcsUtc(iso: string): string {
  const d = parseISO(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}
