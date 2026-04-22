import { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export class FacilityAdminError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "FacilityAdminError";
  }
}

/**
 * Ensures the session belongs to a BHRF user who is marked as a facility admin.
 * Throws FacilityAdminError on failure (401 unauthenticated, 403 not admin).
 * Returns the BHRFProfile (with facility) on success.
 */
export async function requireFacilityAdmin(session: Session | null) {
  if (!session?.user) {
    throw new FacilityAdminError("Unauthorized", 401);
  }

  if (session.user.role !== "BHRF") {
    throw new FacilityAdminError("Forbidden", 403);
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: { facility: true, user: true },
  });

  if (!bhrfProfile) {
    throw new FacilityAdminError("BHRF profile not found", 404);
  }

  if (!bhrfProfile.isFacilityAdmin) {
    throw new FacilityAdminError(
      "Only facility admins can perform this action",
      403
    );
  }

  return bhrfProfile;
}

/**
 * For endpoints that need the caller's BHRFProfile but don't require admin rights.
 */
export async function requireBHRF(session: Session | null) {
  if (!session?.user) {
    throw new FacilityAdminError("Unauthorized", 401);
  }

  if (session.user.role !== "BHRF") {
    throw new FacilityAdminError("Forbidden", 403);
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: { facility: true, user: true },
  });

  if (!bhrfProfile) {
    throw new FacilityAdminError("BHRF profile not found", 404);
  }

  return bhrfProfile;
}
