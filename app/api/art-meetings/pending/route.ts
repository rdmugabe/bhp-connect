import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseMonthQueryParam,
  parseYearQueryParam,
  validateQueryParams,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Validate query parameters
    const monthResult = parseMonthQueryParam(monthParam);
    const yearResult = parseYearQueryParam(yearParam);

    const validationError = validateQueryParams([monthResult, yearResult]);
    if (validationError) {
      return validationError;
    }

    const currentMonth = (monthResult.success && monthResult.value) || new Date().getMonth() + 1;
    const currentYear = (yearResult.success && yearResult.value) || new Date().getFullYear();

    let facilityId: string | null = null;
    let bhpId: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ pendingResidents: [], count: 0 });
      }

      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ pendingResidents: [], count: 0 });
      }

      bhpId = bhpProfile.id;
    } else {
      return NextResponse.json({ pendingResidents: [], count: 0 });
    }

    // Get all approved intakes (residents) for the facility/BHP
    const residents = await prisma.intake.findMany({
      where: {
        status: "APPROVED",
        ...(facilityId && { facilityId }),
        ...(bhpId && { facility: { bhpId } }),
      },
      select: {
        id: true,
        residentName: true,
        dateOfBirth: true,
        policyNumber: true,
        facilityId: true,
        facility: {
          select: {
            name: true,
          },
        },
        artMeetings: {
          where: {
            meetingMonth: currentMonth,
            meetingYear: currentYear,
          },
          select: {
            id: true,
            status: true,
            isSkipped: true,
          },
        },
      },
    });

    // Filter to find residents who need an ART meeting this month
    // A resident needs a meeting if they don't have one for this month OR have a DRAFT
    const pendingResidents = residents.filter((resident) => {
      const meeting = resident.artMeetings[0];
      // Needs meeting if no meeting exists or meeting is DRAFT
      return !meeting || meeting.status === "DRAFT";
    }).map((resident) => ({
      id: resident.id,
      residentName: resident.residentName,
      dateOfBirth: resident.dateOfBirth,
      policyNumber: resident.policyNumber,
      facilityId: resident.facilityId,
      facilityName: resident.facility.name,
      artMeetingStatus: resident.artMeetings[0]?.status || null,
      artMeetingId: resident.artMeetings[0]?.id || null,
    }));

    return NextResponse.json({
      pendingResidents,
      count: pendingResidents.length,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    console.error("Get pending ART meetings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending ART meetings" },
      { status: 500 }
    );
  }
}
