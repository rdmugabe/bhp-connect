import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleGenerationSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";
import { regenerateSchedules, generateSchedules } from "@/lib/emar/schedule-generator";
import { MedicationFrequency } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = scheduleGenerationSchema.parse(parseResult.data);

    // Verify the order belongs to this facility
    const order = await prisma.medicationOrder.findFirst({
      where: {
        id: validatedData.medicationOrderId,
        facilityId: bhrfProfile.facilityId,
        status: "ACTIVE",
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not active" },
        { status: 404 }
      );
    }

    if (order.isPRN) {
      return NextResponse.json(
        { error: "PRN medications do not have scheduled doses" },
        { status: 400 }
      );
    }

    // Regenerate schedules for the order
    const result = await regenerateSchedules(
      validatedData.medicationOrderId,
      validatedData.daysToGenerate
    );

    return NextResponse.json({
      message: "Schedules generated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Generate schedules error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to generate schedules" },
      { status: 500 }
    );
  }
}
