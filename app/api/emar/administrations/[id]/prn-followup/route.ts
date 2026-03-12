import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prnFollowupSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    // Verify the administration belongs to this facility and is PRN
    const existingAdmin = await prisma.medicationAdministration.findFirst({
      where: {
        id,
        medicationOrder: {
          facilityId: bhrfProfile.facilityId,
          isPRN: true,
        },
      },
      include: {
        medicationOrder: {
          include: {
            intake: {
              select: {
                residentName: true,
              },
            },
          },
        },
      },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "PRN administration not found" },
        { status: 404 }
      );
    }

    if (existingAdmin.prnFollowupNotes) {
      return NextResponse.json(
        { error: "Follow-up has already been recorded" },
        { status: 400 }
      );
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const body = parseResult.data as { prnEffectiveness: string; prnFollowupNotes?: string };

    const administration = await prisma.medicationAdministration.update({
      where: { id },
      data: {
        prnEffectiveness: body.prnEffectiveness,
        prnFollowupNotes: body.prnFollowupNotes,
        prnFollowupById: session.user.id,
      },
    });

    // Deactivate any PRN follow-up alerts for this medication
    await prisma.medicationAlert.updateMany({
      where: {
        medicationOrderId: existingAdmin.medicationOrderId,
        alertType: "PRN_FOLLOWUP_DUE",
        isActive: true,
      },
      data: {
        isActive: false,
        acknowledgedAt: new Date(),
        acknowledgedById: session.user.id,
        acknowledgedBy: session.user.name,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMAR_PRN_FOLLOWUP,
      entityType: "MedicationAdministration",
      entityId: administration.id,
      details: {
        medicationName: existingAdmin.medicationOrder.medicationName,
        patientName: existingAdmin.medicationOrder.intake.residentName,
        effectiveness: body.prnEffectiveness,
      },
    });

    return NextResponse.json({ administration });
  } catch (error) {
    console.error("PRN followup error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to record PRN follow-up" },
      { status: 500 }
    );
  }
}
