import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List patients for eMAR (matches Residents page logic)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showDischarged = searchParams.get("discharged") === "true";

    let facilityId: string | null = null;

    // Get facility ID based on user role
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhrfProfile) {
        return NextResponse.json({ patients: [] });
      }
      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhpProfile) {
        return NextResponse.json({ patients: [] });
      }
      // BHP can see all facilities under their oversight
      const requestedFacilityId = searchParams.get("facilityId");
      if (requestedFacilityId) {
        facilityId = requestedFacilityId;
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build where clause matching Residents page logic
    const whereClause: any = {
      // Exclude drafts
      status: { not: "DRAFT" },
    };

    if (facilityId) {
      whereClause.facilityId = facilityId;
    }

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
