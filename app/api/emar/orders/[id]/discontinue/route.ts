import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { discontinueMedicationSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { deleteFutureSchedules } from "@/lib/emar/schedule-generator";

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

    // Verify the order belongs to this facility and is active
    const existingOrder = await prisma.medicationOrder.findFirst({
      where: {
        id,
        facilityId: bhrfProfile.facilityId,
        status: { in: ["ACTIVE", "ON_HOLD"] },
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

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found or already discontinued" },
        { status: 404 }
      );
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = discontinueMedicationSchema.parse(parseResult.data);

    // Delete future schedules
    const deletedSchedules = await deleteFutureSchedules(id);

    // Update the order status
    const order = await prisma.medicationOrder.update({
      where: { id },
      data: {
        status: "DISCONTINUED",
        discontinuedAt: new Date(),
        discontinuedBy: session.user.id,
        discontinueReason: validatedData.discontinueReason,
      },
    });

    // Mark any remaining scheduled/due doses as discontinued
    await prisma.medicationSchedule.updateMany({
      where: {
        medicationOrderId: id,
        status: { in: ["SCHEDULED", "DUE"] },
      },
      data: {
        status: "DISCONTINUED",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMAR_ORDER_DISCONTINUED,
      entityType: "MedicationOrder",
      entityId: order.id,
      details: {
        medicationName: order.medicationName,
        patientName: existingOrder.intake.residentName,
        reason: validatedData.discontinueReason,
        deletedSchedules,
      },
    });

    return NextResponse.json({
      order,
      deletedSchedules,
    });
  } catch (error) {
    console.error("Discontinue medication error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to discontinue medication" },
      { status: 500 }
    );
  }
}
