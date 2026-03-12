import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { medicationOrderSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { generateSchedules } from "@/lib/emar/schedule-generator";
import { checkAllergyWarning, checkDuplicateMedication, createAlert } from "@/lib/emar/alerts";
import { MedicationRoute, MedicationFrequency } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status");
    const isPRN = searchParams.get("isPRN");

    let queryFacilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ orders: [] });
      }

      queryFacilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ orders: [] });
      }

      // BHP can view orders for any of their facilities
      if (facilityId) {
        const facility = await prisma.facility.findFirst({
          where: {
            id: facilityId,
            bhpId: bhpProfile.id,
          },
        });

        if (!facility) {
          return NextResponse.json({ error: "Facility not found" }, { status: 404 });
        }

        queryFacilityId = facilityId;
      }
    }

    const orders = await prisma.medicationOrder.findMany({
      where: {
        ...(queryFacilityId && { facilityId: queryFacilityId }),
        ...(intakeId && { intakeId }),
        ...(status && { status: status as "ACTIVE" | "DISCONTINUED" | "COMPLETED" | "ON_HOLD" }),
        ...(isPRN !== null && { isPRN: isPRN === "true" }),
      },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
            dateOfBirth: true,
            allergies: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            administrations: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { medicationName: "asc" },
      ],
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get medication orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch medication orders" },
      { status: 500 }
    );
  }
}

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

    const validatedData = medicationOrderSchema.parse(parseResult.data);

    // Verify the intake belongs to this facility
    const intake = await prisma.intake.findFirst({
      where: {
        id: validatedData.intakeId,
        facilityId: bhrfProfile.facilityId,
        status: "APPROVED",
        dischargedAt: null,
      },
    });

    if (!intake) {
      return NextResponse.json(
        { error: "Patient not found or not active" },
        { status: 404 }
      );
    }

    // Check for allergy warnings
    const allergyCheck = await checkAllergyWarning(
      validatedData.intakeId,
      validatedData.medicationName
    );

    if (allergyCheck.hasWarning) {
      // Create an allergy warning alert
      await createAlert({
        facilityId: bhrfProfile.facilityId,
        intakeId: validatedData.intakeId,
        alertType: "ALLERGY_WARNING",
        severity: "CRITICAL",
        title: "Allergy Warning",
        message: `${validatedData.medicationName}: ${allergyCheck.allergyInfo}`,
      });

      return NextResponse.json(
        {
          error: "Allergy warning",
          warning: allergyCheck.allergyInfo,
          requiresOverride: true,
        },
        { status: 409 }
      );
    }

    // Check for duplicate medications
    const duplicateCheck = await checkDuplicateMedication(
      validatedData.intakeId,
      validatedData.medicationName
    );

    if (duplicateCheck.isDuplicate) {
      await createAlert({
        facilityId: bhrfProfile.facilityId,
        intakeId: validatedData.intakeId,
        alertType: "DUPLICATE_MEDICATION",
        severity: "WARNING",
        title: "Duplicate Medication Warning",
        message: `${validatedData.medicationName} may duplicate existing order: ${duplicateCheck.existingOrders.join(", ")}`,
      });

      return NextResponse.json(
        {
          error: "Duplicate medication warning",
          warning: `Similar medication already exists: ${duplicateCheck.existingOrders.join(", ")}`,
          requiresOverride: true,
        },
        { status: 409 }
      );
    }

    // Create the medication order
    const order = await prisma.medicationOrder.create({
      data: {
        intakeId: validatedData.intakeId,
        facilityId: bhrfProfile.facilityId,
        medicationName: validatedData.medicationName,
        genericName: validatedData.genericName,
        strength: validatedData.strength,
        dosageForm: validatedData.dosageForm,
        dose: validatedData.dose,
        route: validatedData.route as MedicationRoute,
        frequency: validatedData.frequency as MedicationFrequency,
        customFrequency: validatedData.customFrequency,
        scheduleTimes: validatedData.scheduleTimes,
        isPRN: validatedData.isPRN,
        prnReason: validatedData.prnReason,
        prnMinIntervalHours: validatedData.prnMinIntervalHours,
        prnMaxDailyDoses: validatedData.prnMaxDailyDoses,
        prescriberName: validatedData.prescriberName,
        prescriberNPI: validatedData.prescriberNPI,
        prescriberPhone: validatedData.prescriberPhone,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        instructions: validatedData.instructions,
        administrationNotes: validatedData.administrationNotes,
        pharmacyName: validatedData.pharmacyName,
        pharmacyPhone: validatedData.pharmacyPhone,
        rxNumber: validatedData.rxNumber,
        isControlled: validatedData.isControlled,
        controlSchedule: validatedData.controlSchedule,
        orderedBy: session.user.id,
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

    // Generate schedules for non-PRN medications
    if (!validatedData.isPRN) {
      await generateSchedules({
        medicationOrderId: order.id,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        frequency: validatedData.frequency as MedicationFrequency,
        scheduleTimes: validatedData.scheduleTimes,
        daysToGenerate: 7,
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMAR_ORDER_CREATED,
      entityType: "MedicationOrder",
      entityId: order.id,
      details: {
        medicationName: order.medicationName,
        patientName: order.intake.residentName,
        frequency: order.frequency,
        isPRN: order.isPRN,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create medication order error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create medication order" },
      { status: 500 }
    );
  }
}
