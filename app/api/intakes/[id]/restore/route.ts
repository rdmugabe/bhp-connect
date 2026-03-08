import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

// POST - Restore an archived intake draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF role can restore drafts
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify facility ownership
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    const intake = await prisma.intake.findUnique({
      where: { id },
    });

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    if (intake.facilityId !== bhrfProfile?.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow restoring archived intakes
    if (!intake.archivedAt) {
      return NextResponse.json(
        { error: "Intake is not archived" },
        { status: 400 }
      );
    }

    // Restore the intake by clearing archivedAt
    await prisma.intake.update({
      where: { id },
      data: {
        archivedAt: null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INTAKE_DRAFT_RESTORED,
      entityType: "Intake",
      entityId: id,
      details: {
        residentName: intake.residentName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore intake error:", error);
    return NextResponse.json(
      { error: "Failed to restore intake" },
      { status: 500 }
    );
  }
}
