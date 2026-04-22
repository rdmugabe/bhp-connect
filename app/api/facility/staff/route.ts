import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireBHRF, FacilityAdminError } from "@/lib/facility-admin";

// GET: list all BHRF staff at the caller's facility + pending invitations.
// Any BHRF at the facility can read this.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    let bhrfProfile;
    try {
      bhrfProfile = await requireBHRF(session);
    } catch (err) {
      if (err instanceof FacilityAdminError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    const staff = await prisma.bHRFProfile.findMany({
      where: { facilityId: bhrfProfile.facilityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            deactivatedAt: true,
            createdAt: true,
            employee: {
              select: {
                id: true,
                position: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { user: { createdAt: "asc" } },
    });

    const invitations = await prisma.facilityInvitation.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
        status: "PENDING",
      },
      include: {
        invitedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      staff: staff.map((s) => ({
        userId: s.user.id,
        bhrfProfileId: s.id,
        name: s.user.name,
        email: s.user.email,
        isActive: s.user.isActive,
        deactivatedAt: s.user.deactivatedAt,
        isFacilityAdmin: s.isFacilityAdmin,
        createdAt: s.user.createdAt,
        employee: s.user.employee,
      })),
      invitations,
      currentUserIsFacilityAdmin: bhrfProfile.isFacilityAdmin,
      currentUserId: bhrfProfile.userId,
    });
  } catch (error) {
    console.error("Get staff error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}
