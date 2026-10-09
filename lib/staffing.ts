/**
 * Shift staffing lookup helpers.
 *
 * The facility maintains a dated roster of who covers each shift. A new
 * entry with the same (facility, shift) and a later effectiveFrom supersedes
 * the previous one from that date forward.
 */

import { prisma } from "./prisma";

export interface StaffingInfo {
  name: string;
  credentials: string | null;
  signatureKey: string | null;
}

/**
 * Return the staff member assigned to the given (facility, shift) on the
 * given date — the entry with the latest `effectiveFrom` that is not after
 * `date`. Returns `null` if no entry has taken effect yet.
 */
export async function getStaffingForDate(
  facilityId: string,
  shift: string,
  date: Date
): Promise<StaffingInfo | null> {
  const entry = await prisma.shiftStaffing.findFirst({
    where: {
      facilityId,
      shift,
      effectiveFrom: { lte: date },
    },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!entry) return null;
  return { name: entry.name, credentials: entry.credentials, signatureKey: entry.signatureKey };
}
