import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { medicationAdministrationSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { deactivateScheduleAlerts } from "@/lib/emar/alerts";
import { MedicationRoute, AdministrationStatus } from "@prisma/client";
import { addMinutes, subHours, startOfDay, endOfDay } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        facility: true,
      },
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

    const validatedData = medicationAdministrationSchema.parse(parseResult.data);

    // Verify the medication order belongs to this facility
    const order = await prisma.medicationOrder.findFirst({
      where: {
        id: validatedData.medicationOrderId,
        facilityId: bhrfProfile.facilityId,
        status: "ACTIVE",
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

    if (!order) {
      return NextResponse.json(
        { error: "Medication order not found or not active" },
        { status: 404 }
      );
    }

    // For PRN medications, check min interval and max daily doses
    if (order.isPRN) {
      const now = new Date();

      // Check minimum interval
      if (order.prnMinIntervalHours) {
        const minTime = subHours(now, order.prnMinIntervalHours);

        const recentAdmin = await prisma.medicationAdministration.findFirst({
          where: {
            medicationOrderId: order.id,
            status: "GIVEN",
            administeredAt: { gte: minTime },
          },
        });

        if (recentAdmin) {
          return NextResponse.json(
            {
              error: `Minimum interval of ${order.prnMinIntervalHours} hours has not passed since last dose`,
            },
            { status: 400 }
          );
        }
      }

      // Check max daily doses
      if (order.prnMaxDailyDoses) {
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        const todayCount = await prisma.medicationAdministration.count({
          where: {
            medicationOrderId: order.id,
            status: "GIVEN",
            administeredAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });

        if (todayCount >= order.prnMaxDailyDoses) {
          return NextResponse.json(
            {
              error: `Maximum daily doses (${order.prnMaxDailyDoses}) has been reached`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Verify witness for controlled substances if required
    if (order.isControlled && validatedData.status === "GIVEN") {
      if (!validatedData.witnessId || !validatedData.witnessName) {
        return NextResponse.json(
          { error: "Witness is required for controlled substances" },
          { status: 400 }
        );
      }
    }

    // Create the administration record
    const administration = await prisma.medicationAdministration.create({
      data: {
        medicationOrderId: order.id,
        scheduledDateTime: validatedData.scheduleId
          ? (await prisma.medicationSchedule.findUnique({
              where: { id: validatedData.scheduleId },
            }))?.scheduledDateTime
          : null,
        administeredAt: new Date(validatedData.administeredAt),
        administeredById: session.user.id,
        administeredBy: session.user.name,
        doseGiven: validatedData.doseGiven,
        route: validatedData.route as MedicationRoute,
        status: validatedData.status as AdministrationStatus,
        refusedReason: validatedData.refusedReason,
        heldReason: validatedData.heldReason,
        notGivenReason: validatedData.notGivenReason,
        prnReasonGiven: validatedData.prnReasonGiven,
        prnFollowupAt: order.isPRN && validatedData.status === "GIVEN"
          ? addMinutes(new Date(), 60) // Default 60 minutes for PRN follow-up
          : null,
        vitalsBP: validatedData.vitalsBP,
        vitalsPulse: validatedData.vitalsPulse,
        vitalsTemp: validatedData.vitalsTemp,
        vitalsResp: validatedData.vitalsResp,
        vitalsPain: validatedData.vitalsPain,
        witnessRequired: order.isControlled,
        witnessId: validatedData.witnessId,
        witnessName: validatedData.witnessName,
        notes: validatedData.notes,
      },
    });

    // Update the schedule if one was provided
    if (validatedData.scheduleId) {
      await prisma.medicationSchedule.update({
        where: { id: validatedData.scheduleId },
        data: {
          status: validatedData.status as AdministrationStatus,
          administrationId: administration.id,
        },
      });

      // Deactivate any alerts for this schedule
      await deactivateScheduleAlerts(validatedData.scheduleId);
    }

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMAR_ADMINISTERED,
      entityType: "MedicationAdministration",
      entityId: administration.id,
      details: {
        medicationName: order.medicationName,
        patientName: order.intake.residentName,
        status: validatedData.status,
        doseGiven: validatedData.doseGiven,
        isPRN: order.isPRN,
        isControlled: order.isControlled,
        witnessName: validatedData.witnessName,
      },
    });

    return NextResponse.json({ administration }, { status: 201 });
  } catch (error) {
    console.error("Administer medication error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to record administration" },
      { status: 500 }
    );
  }
}
