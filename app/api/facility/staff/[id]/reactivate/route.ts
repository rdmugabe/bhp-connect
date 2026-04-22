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

    if (target.isActive) {
      return NextResponse.json(
        { error: "This user is already active" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          deactivatedAt: null,
          deactivatedBy: null,
        },
      });

      if (target.employee) {
        await tx.employee.update({
          where: { id: target.employee.id },
          data: { isActive: true },
        });
      }
    });

    await createAuditLog({
      userId: admin.userId,
      action: AuditActions.STAFF_REACTIVATED,
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
    console.error("Reactivate staff error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate staff member" },
      { status: 500 }
    );
  }
}
