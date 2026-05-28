import { type Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * Centralized facility-scoping for API routes that read/write facility-owned
 * data (intakes, medication orders, schedules, administrations, etc.).
 *
 * The recurring IDOR in this codebase was: a route only applied the facility
 * filter "when truthy", so a BHP who omitted facilityId — or any ADMIN/unknown
 * role — got an unscoped query that returned every facility's PHI.
 *
 * Always derive the scope from the caller's role/ownership and spread the
 * returned `where` fragment into the query. The fragment works for any Prisma
 * model with a `facilityId` column and a `facility` relation.
 */

export type FacilityScope =
  | { ok: true; where: Record<string, unknown> }
  | { ok: false; status: number; error: string };

/**
 * Returns a Prisma `where` fragment scoping a query to the facilities the
 * caller may access.
 *
 * - BHRF  → their single facility
 * - BHP   → a specific facility (ownership-verified) or ALL their facilities
 * - ADMIN → a specific facility, or all facilities when none requested
 * - other → 403
 */
export async function getFacilityScope(
  session: Session | null,
  requestedFacilityId?: string | null
): Promise<FacilityScope> {
  if (!session?.user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const role = session.user.role;

  if (role === "BHRF") {
    const bhrf = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!bhrf) return { ok: false, status: 403, error: "Forbidden" };
    return { ok: true, where: { facilityId: bhrf.facilityId } };
  }

  if (role === "BHP") {
    const bhp = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!bhp) return { ok: false, status: 403, error: "Forbidden" };

    if (requestedFacilityId) {
      const facility = await prisma.facility.findFirst({
        where: { id: requestedFacilityId, bhpId: bhp.id },
        select: { id: true },
      });
      if (!facility) {
        return { ok: false, status: 404, error: "Facility not found" };
      }
      return { ok: true, where: { facilityId: requestedFacilityId } };
    }

    // No facility requested → all facilities this BHP manages.
    return { ok: true, where: { facility: { bhpId: bhp.id } } };
  }

  if (role === "ADMIN") {
    return {
      ok: true,
      where: requestedFacilityId ? { facilityId: requestedFacilityId } : {},
    };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}

/**
 * Whether the caller may access a specific facility, given the facility's id
 * and its managing BHP id. Use after loading a record to check ownership of
 * that exact record (vs. building a list query with getFacilityScope).
 */
export async function callerCanAccessFacility(
  session: Session | null,
  facilityId: string,
  facilityBhpId: string | null
): Promise<boolean> {
  if (!session?.user) return false;
  const role = session.user.role;

  if (role === "ADMIN") return true;

  if (role === "BHRF") {
    const bhrf = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });
    return !!bhrf && bhrf.facilityId === facilityId;
  }

  if (role === "BHP") {
    const bhp = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });
    return !!bhp && facilityBhpId === bhp.id;
  }

  return false;
}
