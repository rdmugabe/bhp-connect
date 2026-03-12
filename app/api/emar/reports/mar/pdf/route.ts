import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { EmarReportTemplate } from "@/lib/pdf/emar-report-template";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const FACILITY_TIMEZONE = "America/Phoenix";

// POST - Generate eMAR PDF with populated data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { intakeId, startDate, endDate } = body;

    if (!intakeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: intakeId, startDate, endDate" },
        { status: 400 }
      );
    }

    // Get patient information
    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
      include: {
        facility: true,
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Convert Arizona timezone dates to UTC for database queries
    const reportStartUTC = fromZonedTime(`${startDate}T00:00:00`, FACILITY_TIMEZONE);
    const reportEndUTC = fromZonedTime(`${endDate}T23:59:59.999`, FACILITY_TIMEZONE);

    // Get medication orders with administrations
    const medicationOrders = await prisma.medicationOrder.findMany({
      where: {
        intakeId,
        AND: [
          {
            OR: [
              { status: "ACTIVE" },
              {
                status: "DISCONTINUED",
                discontinuedAt: { gte: reportStartUTC },
              },
            ],
          },
          {
            startDate: { lte: reportEndUTC },
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: reportStartUTC } },
            ],
          },
        ],
      },
      include: {
        administrations: {
          where: {
            administeredAt: {
              gte: reportStartUTC,
              lte: reportEndUTC,
            },
          },
          orderBy: { administeredAt: "asc" },
        },
        schedules: {
          where: {
            scheduledDateTime: {
              gte: reportStartUTC,
              lte: reportEndUTC,
            },
          },
          orderBy: { scheduledDateTime: "asc" },
        },
      },
      orderBy: [
        { isPRN: "asc" },
        { medicationName: "asc" },
      ],
    });

    // Process medications into the format needed for the template
    const medications = medicationOrders.map((order) => {
      // Group administrations by date (using Arizona timezone)
      const dailyAdministrations: Record<string, { status: string; time?: string; by?: string }[]> = {};

      order.administrations.forEach((admin) => {
        // Convert UTC time to Arizona time for proper date grouping
        const arizonaTime = toZonedTime(new Date(admin.administeredAt), FACILITY_TIMEZONE);
        const dateKey = format(arizonaTime, "yyyy-MM-dd");
        if (!dailyAdministrations[dateKey]) {
          dailyAdministrations[dateKey] = [];
        }
        dailyAdministrations[dateKey].push({
          status: admin.status,
          time: format(arizonaTime, "HH:mm"),
          by: admin.administeredBy,
        });
      });

      // Derive schedule times from actual schedule records if order.scheduleTimes is empty
      let scheduleTimes = order.scheduleTimes;
      if (scheduleTimes.length === 0 && !order.isPRN) {
        // Extract unique times from the schedule records
        const timesSet = new Set<string>();
        order.schedules.forEach((s: { scheduledDateTime: Date }) => {
          const arizonaTime = toZonedTime(new Date(s.scheduledDateTime), FACILITY_TIMEZONE);
          timesSet.add(format(arizonaTime, "HH:mm"));
        });
        scheduleTimes = Array.from(timesSet).sort();
      }
      if (scheduleTimes.length === 0) {
        scheduleTimes = order.isPRN ? ["PRN"] : ["--"];
      }

      return {
        id: order.id,
        medicationName: order.medicationName,
        strength: order.strength,
        dose: order.dose,
        route: order.route,
        frequency: order.frequency,
        isPRN: order.isPRN,
        isControlled: order.isControlled,
        scheduleTimes,
        dailyAdministrations,
        prescriberName: order.prescriberName,
        prescriberNPI: order.prescriberNPI,
        prescriberPhone: order.prescriberPhone,
        pharmacyName: order.pharmacyName,
        pharmacyPhone: order.pharmacyPhone,
      };
    });

    // Collect unique prescribers and pharmacies
    const prescribersMap = new Map<string, { name: string; npi?: string; phone?: string }>();
    const pharmaciesMap = new Map<string, { name: string; phone?: string }>();

    medicationOrders.forEach((order) => {
      if (order.prescriberName) {
        prescribersMap.set(order.prescriberName, {
          name: order.prescriberName,
          npi: order.prescriberNPI || undefined,
          phone: order.prescriberPhone || undefined,
        });
      }
      if (order.pharmacyName) {
        pharmaciesMap.set(order.pharmacyName, {
          name: order.pharmacyName,
          phone: order.pharmacyPhone || undefined,
        });
      }
    });

    const prescribers = Array.from(prescribersMap.values());
    const pharmacies = Array.from(pharmaciesMap.values());

    // Calculate summary statistics
    // Parse dates as local dates (not UTC) for proper day iteration
    const startDateLocal = parseISO(startDate);
    const endDateLocal = parseISO(endDate);
    const days = eachDayOfInterval({
      start: startDateLocal,
      end: endDateLocal,
    });

    let totalScheduled = 0;
    let given = 0;
    let refused = 0;
    let held = 0;
    let missed = 0;
    let notAvailable = 0;

    medicationOrders.forEach((order) => {
      if (!order.isPRN) {
        totalScheduled += order.scheduleTimes.length * days.length;
      }
      order.administrations.forEach((admin) => {
        switch (admin.status) {
          case "GIVEN":
            given++;
            break;
          case "REFUSED":
            refused++;
            break;
          case "HELD":
            held++;
            break;
          case "MISSED":
            missed++;
            break;
          case "NOT_AVAILABLE":
          case "LOA":
            notAvailable++;
            break;
        }
      });
    });

    const completionRate = totalScheduled > 0
      ? Math.round((given / totalScheduled) * 100)
      : 0;

    // Get PRN administrations with follow-up data
    const prnAdministrations = await prisma.medicationAdministration.findMany({
      where: {
        medicationOrder: {
          intakeId,
          isPRN: true,
        },
        administeredAt: {
          gte: reportStartUTC,
          lte: reportEndUTC,
        },
        status: "GIVEN",
      },
      include: {
        medicationOrder: {
          select: {
            medicationName: true,
            strength: true,
            dose: true,
          },
        },
      },
      orderBy: { administeredAt: "desc" },
    });

    // Format PRN follow-ups for the template
    const prnFollowups = prnAdministrations.map((admin) => {
      const arizonaTime = toZonedTime(new Date(admin.administeredAt), FACILITY_TIMEZONE);
      return {
        id: admin.id,
        medicationName: admin.medicationOrder.medicationName,
        strength: admin.medicationOrder.strength,
        dose: admin.medicationOrder.dose,
        administeredAt: format(arizonaTime, "MM/dd/yyyy h:mm a"),
        administeredBy: admin.administeredBy,
        reasonGiven: admin.prnReasonGiven || "Not documented",
        effectiveness: admin.prnEffectiveness || "Not documented",
        followupNotes: admin.prnFollowupNotes || "No follow-up notes",
        followupAt: admin.prnFollowupAt
          ? format(toZonedTime(new Date(admin.prnFollowupAt), FACILITY_TIMEZONE), "MM/dd/yyyy h:mm a")
          : null,
      };
    });

    // Prepare PDF data
    const pdfData = {
      patient: {
        residentName: intake.residentName,
        dateOfBirth: intake.dateOfBirth.toISOString(),
        allergies: intake.allergies || null,
      },
      facility: {
        name: intake.facility.name,
      },
      prescribers,
      pharmacies,
      medications,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalScheduled,
        given,
        refused,
        held,
        missed,
        notAvailable,
        completionRate,
      },
      prnFollowups,
      generatedAt: format(new Date(), "MM/dd/yyyy h:mm a"),
      generatedBy: session.user.name || session.user.email || "Unknown",
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(EmarReportTemplate({ data: pdfData }));

    // Return PDF response
    const fileName = `eMAR-${intake.residentName.replace(/\s+/g, "-")}-${format(new Date(startDate), "yyyy-MM")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Generate eMAR PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate eMAR PDF" },
      { status: 500 }
    );
  }
}
