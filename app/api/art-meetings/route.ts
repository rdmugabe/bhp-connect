import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { artMeetingSchema, artMeetingDraftSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseOptionalDate, getCurrentArizonaMonthAndYear } from "@/lib/date-utils";

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
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let artMeetings;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ artMeetings: [] });
      }

      artMeetings = await prisma.aRTMeeting.findMany({
        where: {
          facility: {
            bhpId: bhpProfile.id,
            ...(facilityId && { id: facilityId }),
          },
          ...(intakeId && { intakeId }),
          ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" }),
          ...(month && { meetingMonth: parseInt(month) }),
          ...(year && { meetingYear: parseInt(year) }),
        },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
              policyNumber: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { meetingYear: "desc" },
          { meetingMonth: "desc" },
          { createdAt: "desc" },
        ],
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ artMeetings: [] });
      }

      artMeetings = await prisma.aRTMeeting.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(intakeId && { intakeId }),
          ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" }),
          ...(month && { meetingMonth: parseInt(month) }),
          ...(year && { meetingYear: parseInt(year) }),
        },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
              policyNumber: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { meetingYear: "desc" },
          { meetingMonth: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    return NextResponse.json({ artMeetings });
  } catch (error) {
    console.error("Get ART meetings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ART meetings" },
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

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const body = parseResult.data;
    const { intakeId, meetingMonth, meetingYear, isDraft, ...meetingData } = body as { intakeId?: string; meetingMonth?: number; meetingYear?: number; isDraft?: boolean; [key: string]: unknown };

    if (!intakeId) {
      return NextResponse.json(
        { error: "Intake ID is required" },
        { status: 400 }
      );
    }

    // Verify the intake exists and belongs to the facility
    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
    });

    if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Intake not found or unauthorized" },
        { status: 404 }
      );
    }

    // Determine month/year for the meeting (use Arizona timezone for defaults)
    const arizonaDate = getCurrentArizonaMonthAndYear();
    const month = meetingMonth || arizonaDate.month;
    const year = meetingYear || arizonaDate.year;

    // Check if a meeting already exists for this intake/month/year
    const existingMeeting = await prisma.aRTMeeting.findUnique({
      where: {
        intakeId_meetingMonth_meetingYear: {
          intakeId,
          meetingMonth: month,
          meetingYear: year,
        },
      },
    });

    if (existingMeeting) {
      return NextResponse.json(
        { error: "An ART meeting already exists for this resident for the specified month" },
        { status: 400 }
      );
    }

    // Use appropriate schema based on draft status
    const validatedData = isDraft
      ? artMeetingDraftSchema.parse(meetingData)
      : artMeetingSchema.parse(meetingData);

    const artMeeting = await prisma.aRTMeeting.create({
      data: {
        intakeId,
        facilityId: bhrfProfile.facilityId,
        meetingMonth: month,
        meetingYear: year,
        meetingDate: parseOptionalDate(validatedData.meetingDate),
        dxCodes: validatedData.dxCodes,
        presentDuringMeeting: validatedData.presentDuringMeeting || [],
        absentDuringMeeting: validatedData.absentDuringMeeting || [],
        focusOfMeeting: validatedData.focusOfMeeting,
        resolutions: validatedData.resolutions,
        strengths: validatedData.strengths,
        barriers: validatedData.barriers,
        whatHasWorked: validatedData.whatHasWorked,
        whatHasNotWorked: validatedData.whatHasNotWorked,
        goals: validatedData.goals,
        concreteSteps: validatedData.concreteSteps,
        progressIndicators: validatedData.progressIndicators,
        medicalIssues: validatedData.medicalIssues,
        plan: validatedData.plan,
        notesTakenBy: validatedData.notesTakenBy,
        meetingStartTime: validatedData.meetingStartTime,
        meetingEndTime: validatedData.meetingEndTime,
        status: isDraft ? "DRAFT" : "APPROVED",
        submittedBy: session.user.id,
        submittedAt: isDraft ? null : new Date(),
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

    await createAuditLog({
      userId: session.user.id,
      action: isDraft ? AuditActions.ART_MEETING_CREATED : AuditActions.ART_MEETING_SUBMITTED,
      entityType: "ARTMeeting",
      entityId: artMeeting.id,
      details: {
        intakeId,
        residentName: artMeeting.intake.residentName,
        meetingMonth: month,
        meetingYear: year,
        isDraft,
      },
    });

    return NextResponse.json({ artMeeting }, { status: 201 });
  } catch (error) {
    console.error("Create ART meeting error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create ART meeting" },
      { status: 500 }
    );
  }
}
