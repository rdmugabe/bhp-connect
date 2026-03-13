import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { medicationOrderUpdateSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { regenerateSchedules } from "@/lib/emar/schedule-generator";

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

    // Get the order with full details
    const order = await prisma.medicationOrder.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
            dateOfBirth: true,
            allergies: true,
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
        schedules: {
          where: {
            scheduledDateTime: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          orderBy: {
            scheduledDateTime: "asc",
          },
          take: 50,
        },
        administrations: {
          orderBy: {
            administeredAt: "desc",
          },
          take: 20,
        },
        _count: {
          select: {
            schedules: true,
            administrations: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify access
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== order.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || bhpProfile.id !== order.facility.bhpId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get medication order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch medication order" },
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

    // Verify the order belongs to this facility
    const existingOrder = await prisma.medicationOrder.findFirst({
      where: {
        id,
        facilityId: bhrfProfile.facilityId,
        status: { in: ["ACTIVE", "ON_HOLD"] },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found or cannot be modified" },
        { status: 404 }
      );
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = medicationOrderUpdateSchema.parse(parseResult.data);

    // Update the order
    const order = await prisma.medicationOrder.update({
      where: { id },
      data: {
        ...(validatedData.dose && { dose: validatedData.dose }),
        ...(validatedData.instructions !== undefined && {
          instructions: validatedData.instructions,
        }),
        ...(validatedData.administrationNotes !== undefined && {
          administrationNotes: validatedData.administrationNotes,
        }),
        ...(validatedData.scheduleTimes && {
          scheduleTimes: validatedData.scheduleTimes,
        }),
        ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
        ...(validatedData.status && { status: validatedData.status }),
      },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
      },
    });

    // Regenerate schedules if schedule times changed
    if (validatedData.scheduleTimes && !existingOrder.isPRN) {
      await regenerateSchedules(id);
    }

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMAR_ORDER_UPDATED,
      entityType: "MedicationOrder",
      entityId: order.id,
      details: {
        medicationName: order.medicationName,
        patientName: order.intake.residentName,
        changes: validatedData,
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Update medication order error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update medication order" },
      { status: 500 }
    );
  }
}
