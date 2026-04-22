import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { requireFacilityAdmin, FacilityAdminError } from "@/lib/facility-admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    let admin;
    try {
      admin = await requireFacilityAdmin(session);
    } catch (err) {
      if (err instanceof FacilityAdminError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    const { id: userId } = await params;

    if (userId === admin.userId) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { bhrfProfile: true, employee: true },
    });

    if (!target || !target.bhrfProfile) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (target.bhrfProfile.facilityId !== admin.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't deactivate the last remaining facility admin
    if (target.bhrfProfile.isFacilityAdmin) {
      const adminCount = await prisma.bHRFProfile.count({
        where: {
          facilityId: admin.facilityId,
          isFacilityAdmin: true,
          user: { isActive: true },
        },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot deactivate the last active facility admin. Promote another admin first." },
          { status: 400 }
        );
      }
    }

    if (!target.isActive) {
      return NextResponse.json(
        { error: "This user is already deactivated" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: admin.userId,
        },
      });

      if (target.employee) {
        await tx.employee.update({
          where: { id: target.employee.id },
          data: { isActive: false },
        });
      }
    });

    await createAuditLog({
      userId: admin.userId,
      action: AuditActions.STAFF_DEACTIVATED,
      entityType: "User",
      entityId: userId,
      details: {
        targetName: target.name,
        targetEmail: target.email,
        facilityName: admin.facility.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deactivate staff error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate staff member" },
      { status: 500 }
    );
  }
}
