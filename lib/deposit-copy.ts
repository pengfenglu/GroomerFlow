import { formatPriceCents } from "@/lib/timezone";
import type { DepositStatus } from "@/types/database";

/** Customer-facing deposit explanation for emails and success page. */
export function formatDepositCustomerNote(
  depositCents: number,
  depositStatus: DepositStatus,
): string | null {
  if (depositCents <= 0 || depositStatus === "none") return null;
  if (depositStatus === "authorized" || depositStatus === "paid") {
    return `A ${formatPriceCents(depositCents)} card hold is on file for this appointment. It is not a full service charge — contact your groomer to reschedule or ask about their no-show policy.`;
  }
  if (depositStatus === "pending") {
    return `A ${formatPriceCents(depositCents)} deposit is required to confirm this appointment.`;
  }
  return null;
}
