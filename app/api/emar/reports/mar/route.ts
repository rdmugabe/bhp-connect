import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const FACILITY_TIMEZONE = "America/Phoenix";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const includeDiscontinued = searchParams.get("includeDiscontinued") === "true";

    if (!intakeId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "intakeId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    let facilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ error: "Facility not assigned" }, { status: 400 });
      }

      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      // BHP can view any intake under their facilities
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 400 });
      }
    }

    // Verify the intake exists and belongs to the facility
    const intake = await prisma.intake.findFirst({
      where: {
        id: intakeId,
        ...(facilityId && { facilityId }),
        ...(session.user.role === "BHP" && {
          facility: {
            bhp: {
              userId: session.user.id,
            },
          },
        }),
      },
      select: {
        id: true,
        residentName: true,
        dateOfBirth: true,
        allergies: true,
        admissionDate: true,
        ahcccsHealthPlan: true,
        diagnosis: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Parse dates - these are simple date strings like "2026-03-11"
    // We need to interpret them as Arizona timezone dates

    // Create Arizona timezone boundaries and convert to UTC for database queries
    const reportStart = fromZonedTime(`${startDateStr}T00:00:00`, FACILITY_TIMEZONE);
    const reportEnd = fromZonedTime(`${endDateStr}T23:59:59.999`, FACILITY_TIMEZONE);

    // Get all days in the range (using local dates for display)
    const startDateLocal = parseISO(startDateStr);
    const endDateLocal = parseISO(endDateStr);
    const days = eachDayOfInterval({ start: startDateLocal, end: endDateLocal });

    // Get all medication orders for this patient
    const orders = await prisma.medicationOrder.findMany({
      where: {
        intakeId,
        ...(includeDiscontinued
          ? {}
          : { status: { in: ["ACTIVE", "COMPLETED"] } }),
        OR: [
          // Started before or during the report period
          { startDate: { lte: reportEnd } },
          // Ended during or after the report period
          { endDate: { gte: reportStart } },
          // Still active (no end date)
          { endDate: null },
        ],
      },
      include: {
        schedules: {
          where: {
            scheduledDateTime: {
              gte: reportStart,
              lte: reportEnd,
            },
          },
          include: {
            administration: true,
          },
          orderBy: {
            scheduledDateTime: "asc",
          },
        },
        administrations: {
          where: {
            administeredAt: {
              gte: reportStart,
              lte: reportEnd,
            },
          },
          orderBy: {
            administeredAt: "asc",
          },
        },
      },
      orderBy: [
        { isPRN: "asc" },
        { medicationName: "asc" },
      ],
    });

    // Build MAR grid data
    const marData = orders.map((order) => {
      // For each day, find the scheduled/administered doses
      const dailyData = days.map((day) => {
        // Convert day boundaries to UTC for comparison with database timestamps
        const dayStr = format(day, "yyyy-MM-dd");
        const dayStartUTC = fromZonedTime(`${dayStr}T00:00:00`, FACILITY_TIMEZONE);
        const dayEndUTC = fromZonedTime(`${dayStr}T23:59:59.999`, FACILITY_TIMEZONE);

        // Get schedules for this day (comparing UTC timestamps)
        const daySchedules = order.schedules.filter((s) => {
          const scheduleDate = new Date(s.scheduledDateTime);
          return scheduleDate >= dayStartUTC && scheduleDate <= dayEndUTC;
        });

        // Get administrations for this day (PRN meds or extra doses)
        const dayAdministrations = order.administrations.filter((a) => {
          const adminDate = new Date(a.administeredAt);
          return adminDate >= dayStartUTC && adminDate <= dayEndUTC;
        });

        return {
          date: format(day, "yyyy-MM-dd"),
          dayOfMonth: format(day, "d"),
          schedules: daySchedules.map((s) => ({
            id: s.id,
            // Convert UTC time to Arizona time for display
            time: format(toZonedTime(new Date(s.scheduledDateTime), FACILITY_TIMEZONE), "HH:mm"),
            status: s.status,
            administration: s.administration
              ? {
                  id: s.administration.id,
                  time: format(toZonedTime(new Date(s.administration.administeredAt), FACILITY_TIMEZONE), "HH:mm"),
                  status: s.administration.status,
                  administeredBy: s.administration.administeredBy,
                  notes: s.administration.notes,
                }
              : null,
          })),
          prnAdministrations: order.isPRN
            ? dayAdministrations.map((a) => ({
                id: a.id,
                time: format(toZonedTime(new Date(a.administeredAt), FACILITY_TIMEZONE), "HH:mm"),
                status: a.status,
                administeredBy: a.administeredBy,
                prnReason: a.prnReasonGiven,
                effectiveness: a.prnEffectiveness,
                notes: a.notes,
              }))
            : [],
        };
      });

      return {
        order: {
          id: order.id,
          medicationName: order.medicationName,
          genericName: order.genericName,
          strength: order.strength,
          dose: order.dose,
          route: order.route,
          frequency: order.frequency,
          scheduleTimes: order.scheduleTimes,
          isPRN: order.isPRN,
          prnReason: order.prnReason,
          instructions: order.instructions,
          prescriberName: order.prescriberName,
          prescriberNPI: order.prescriberNPI,
          prescriberPhone: order.prescriberPhone,
          pharmacyName: order.pharmacyName,
          pharmacyPhone: order.pharmacyPhone,
          rxNumber: order.rxNumber,
          startDate: order.startDate,
          endDate: order.endDate,
          status: order.status,
          isControlled: order.isControlled,
        },
        dailyData,
      };
    });

    return NextResponse.json({
      patient: intake,
      facility: intake.facility,
      reportPeriod: {
        startDate: startDateStr,
        endDate: endDateStr,
        days: days.map((d) => ({
          date: format(d, "yyyy-MM-dd"),
          dayOfMonth: format(d, "d"),
          dayOfWeek: format(d, "EEE"),
        })),
      },
      medications: marData,
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.name,
    });
  } catch (error) {
    console.error("Get MAR report error:", error);
    return NextResponse.json(
      { error: "Failed to generate MAR report" },
      { status: 500 }
    );
  }
}
