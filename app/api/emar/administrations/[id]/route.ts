import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { z } from "zod";

const updateAdministrationSchema = z.object({
  // Status change fields
  status: z.enum(["GIVEN", "REFUSED", "HELD", "MISSED", "NOT_AVAILABLE", "LOA"]).optional(),
  refusedReason: z.string().optional().nullable(),
  heldReason: z.string().optional().nullable(),
  notGivenReason: z.string().optional().nullable(),
  // Other fields
  notes: z.string().optional().nullable(),
  doseGiven: z.string().optional(),
  // Vitals
  vitalsBP: z.string().optional().nullable(),
  vitalsPulse: z.number().optional().nullable(),
  vitalsTemp: z.string().optional().nullable(),
  vitalsResp: z.number().optional().nullable(),
  vitalsPain: z.number().min(0).max(10).optional().nullable(),
  // Edit reason (required when changing status)
  editReason: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const administration = await prisma.medicationAdministration.findUnique({
      where: { id },
      include: {
        medicationOrder: {
          include: {
            intake: {
              select: {
                id: true,
                residentName: true,
                dateOfBirth: true,
                facilityId: true,
              },
            },
            facility: {
              select: {
                id: true,
                name: true,
                bhpId: true,
              },
            },
          },
        },
        schedule: true,
      },
    });

    if (!administration) {
      return NextResponse.json({ error: "Administration not found" }, { status: 404 });
    }

    // Verify access
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== administration.medicationOrder.facility.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || bhpProfile.id !== administration.medicationOrder.facility.bhpId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ administration });
  } catch (error) {
    console.error("Get administration error:", error);
    return NextResponse.json(
      { error: "Failed to fetch administration" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Verify the administration belongs to this facility
    const existingAdmin = await prisma.medicationAdministration.findFirst({
      where: {
        id,
        medicationOrder: {
          facilityId: bhrfProfile.facilityId,
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
        { error: "Administration not found" },
        { status: 404 }
      );
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = updateAdministrationSchema.parse(parseResult.data);

    // Track what changed for audit log
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Handle status change
    if (validatedData.status !== undefined && validatedData.status !== existingAdmin.status) {
      changes.status = { from: existingAdmin.status, to: validatedData.status };
      updateData.status = validatedData.status;

      // Clear all reason fields first, then set the appropriate one
      updateData.refusedReason = null;
      updateData.heldReason = null;
      updateData.notGivenReason = null;

      // Set the appropriate reason based on new status
      if (validatedData.status === "REFUSED" && validatedData.refusedReason) {
        updateData.refusedReason = validatedData.refusedReason;
      } else if (validatedData.status === "HELD" && validatedData.heldReason) {
        updateData.heldReason = validatedData.heldReason;
      } else if (["MISSED", "NOT_AVAILABLE", "LOA"].includes(validatedData.status) && validatedData.notGivenReason) {
        updateData.notGivenReason = validatedData.notGivenReason;
      }

      // Also update the linked schedule status if there is one
      const linkedSchedule = await prisma.medicationSchedule.findFirst({
        where: { administrationId: id },
      });

      if (linkedSchedule) {
        await prisma.medicationSchedule.update({
          where: { id: linkedSchedule.id },
          data: { status: validatedData.status },
        });
      }
    }

    // Handle other field updates
    if (validatedData.doseGiven !== undefined) {
      updateData.doseGiven = validatedData.doseGiven;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.vitalsBP !== undefined) {
      updateData.vitalsBP = validatedData.vitalsBP;
    }
    if (validatedData.vitalsPulse !== undefined) {
      updateData.vitalsPulse = validatedData.vitalsPulse;
    }
    if (validatedData.vitalsTemp !== undefined) {
      updateData.vitalsTemp = validatedData.vitalsTemp;
    }
    if (validatedData.vitalsResp !== undefined) {
      updateData.vitalsResp = validatedData.vitalsResp;
    }
    if (validatedData.vitalsPain !== undefined) {
      updateData.vitalsPain = validatedData.vitalsPain;
    }

    const administration = await prisma.medicationAdministration.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMAR_ADMINISTRATION_UPDATED,
      entityType: "MedicationAdministration",
      entityId: administration.id,
      details: {
        medicationName: existingAdmin.medicationOrder.medicationName,
        patientName: existingAdmin.medicationOrder.intake.residentName,
        previousStatus: existingAdmin.status,
        newStatus: validatedData.status || existingAdmin.status,
        editReason: validatedData.editReason,
        changes,
      },
    });

    return NextResponse.json({ administration });
  } catch (error) {
    console.error("Update administration error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update administration" },
      { status: 500 }
    );
  }
}
