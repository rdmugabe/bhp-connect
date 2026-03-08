import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

// POST /api/intakes/[id]/discharge - Discharge a resident
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF role can discharge residents
    if (session.user.role !== "BHRF") {
      return NextResponse.json(
        { error: "Only facility staff can discharge residents" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify facility ownership
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const intake = await prisma.intake.findUnique({
      where: { id },
      include: {
        dischargeSummary: true,
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    if (intake.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify intake status is APPROVED
    if (intake.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved intakes can be discharged" },
        { status: 400 }
      );
    }

    // Verify resident is not already discharged
    if (intake.dischargedAt) {
      return NextResponse.json(
        { error: "Resident is already discharged" },
        { status: 400 }
      );
    }

    // Verify DischargeSummary exists and is APPROVED
    if (!intake.dischargeSummary) {
      return NextResponse.json(
        { error: "A discharge summary must be created before discharging" },
        { status: 400 }
      );
    }

    if (intake.dischargeSummary.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Discharge summary must be approved before discharging" },
        { status: 400 }
      );
    }

    // Discharge the resident and archive their documents
    const dischargeDate = new Date();

    const [updatedIntake, archivedDocuments] = await prisma.$transaction([
      // Update the intake with discharge date
      prisma.intake.update({
        where: { id },
        data: {
          dischargedAt: dischargeDate,
        },
      }),
      // Archive all documents tied to this intake
      prisma.document.updateMany({
        where: {
          intakeId: id,
          archivedAt: null,
        },
        data: {
          archivedAt: dischargeDate,
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INTAKE_DISCHARGED,
      entityType: "Intake",
      entityId: id,
      details: {
        residentName: intake.residentName,
        dischargedAt: updatedIntake.dischargedAt,
        documentsArchived: archivedDocuments.count,
      },
    });

    return NextResponse.json({
      success: true,
      intake: updatedIntake
    });
  } catch (error) {
    console.error("Discharge intake error:", error);
    return NextResponse.json(
      { error: "Failed to discharge resident" },
      { status: 500 }
    );
  }
}
