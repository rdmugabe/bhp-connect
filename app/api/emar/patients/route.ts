import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityScope } from "@/lib/facility-scope";

// GET - List patients for eMAR (matches Residents page logic)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showDischarged = searchParams.get("discharged") === "true";

    // Always derive facility scope from the caller — never leave it unset.
    const scope = await getFacilityScope(
      session,
      searchParams.get("facilityId")
    );
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    // Build where clause matching Residents page logic
    const whereClause: any = {
      ...scope.where,
      // Exclude drafts
      status: { not: "DRAFT" },
    };

    if (showDischarged) {
      // Show only discharged residents
      whereClause.dischargedAt = { not: null };
    } else {
      // Show active residents (not discharged, not archived)
      whereClause.dischargedAt = null;
      whereClause.archivedAt = null;
    }

    const patients = await prisma.intake.findMany({
      where: whereClause,
      select: {
        id: true,
        residentName: true,
        dateOfBirth: true,
        allergies: true,
        status: true,
        dischargedAt: true,
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            medicationOrders: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: { residentName: "asc" },
    });

    // Transform data for the frontend
    const transformedPatients = patients.map((patient) => ({
      id: patient.id,
      residentName: patient.residentName,
      dateOfBirth: patient.dateOfBirth.toISOString(),
      allergies: patient.allergies,
      status: patient.dischargedAt ? "DISCHARGED" : "ACTIVE",
      facilityId: patient.facility.id,
      facilityName: patient.facility.name,
      activeMedications: patient._count.medicationOrders,
    }));

    return NextResponse.json({ patients: transformedPatients });
  } catch (error) {
    console.error("Get eMAR patients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
