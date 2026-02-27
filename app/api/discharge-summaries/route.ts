import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dischargeSummarySchema, dischargeSummaryDraftSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseOptionalPastDate, parseOptionalSignatureDate } from "@/lib/date-utils";

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

    let dischargeSummaries;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ dischargeSummaries: [] });
      }

      dischargeSummaries = await prisma.dischargeSummary.findMany({
        where: {
          facility: {
            bhpId: bhpProfile.id,
            ...(facilityId && { id: facilityId }),
          },
          ...(intakeId && { intakeId }),
          ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" }),
        },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
              policyNumber: true,
              admissionDate: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ dischargeSummaries: [] });
      }

      dischargeSummaries = await prisma.dischargeSummary.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(intakeId && { intakeId }),
          ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" }),
        },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
              policyNumber: true,
              admissionDate: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ dischargeSummaries });
  } catch (error) {
    console.error("Get discharge summaries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discharge summaries" },
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
    const { intakeId, isDraft, ...summaryData } = body as { intakeId?: string; isDraft?: boolean; [key: string]: unknown };

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

    // Check if a discharge summary already exists for this intake
    const existingSummary = await prisma.dischargeSummary.findUnique({
      where: { intakeId },
    });

    if (existingSummary) {
      return NextResponse.json(
        { error: "A discharge summary already exists for this resident" },
        { status: 400 }
      );
    }

    // Use appropriate schema based on draft status
    const validatedData = isDraft
      ? dischargeSummaryDraftSchema.parse(summaryData)
      : dischargeSummarySchema.parse(summaryData);

    const dischargeSummary = await prisma.dischargeSummary.create({
      data: {
        intakeId,
        facilityId: bhrfProfile.facilityId,
        dischargeDate: parseOptionalPastDate(validatedData.dischargeDate) || new Date(),
        dischargeStartTime: validatedData.dischargeStartTime,
        dischargeEndTime: validatedData.dischargeEndTime,
        enrolledProgram: validatedData.enrolledProgram,
        dischargeType: validatedData.dischargeType,
        recommendedLevelOfCare: validatedData.recommendedLevelOfCare,
        contactPhoneAfterDischarge: validatedData.contactPhoneAfterDischarge,
        contactAddressAfterDischarge: validatedData.contactAddressAfterDischarge,
        presentingIssuesAtAdmission: validatedData.presentingIssuesAtAdmission,
        objectivesAttained: validatedData.objectivesAttained || [],
        objectiveNarratives: validatedData.objectiveNarratives || {},
        completedServices: validatedData.completedServices || [],
        actualDischargeDate: parseOptionalPastDate(validatedData.actualDischargeDate),
        dischargeSummaryNarrative: validatedData.dischargeSummaryNarrative,
        dischargingTo: validatedData.dischargingTo,
        personalItemsReceived: validatedData.personalItemsReceived || false,
        personalItemsStoredDays: validatedData.personalItemsStoredDays,
        itemsRemainAtFacility: validatedData.itemsRemainAtFacility || false,
        dischargeMedications: validatedData.dischargeMedications || [],
        serviceReferrals: validatedData.serviceReferrals || [],
        clinicalRecommendations: validatedData.clinicalRecommendations,
        culturalPreferencesConsidered: validatedData.culturalPreferencesConsidered || false,
        suicidePreventionEducation: validatedData.suicidePreventionEducation,
        clientSignature: validatedData.clientSignature,
        clientSignatureDate: parseOptionalSignatureDate(validatedData.clientSignatureDate),
        staffSignature: validatedData.staffSignature,
        staffCredentials: validatedData.staffCredentials,
        staffSignatureDate: parseOptionalSignatureDate(validatedData.staffSignatureDate),
        reviewerSignature: validatedData.reviewerSignature,
        reviewerCredentials: validatedData.reviewerCredentials,
        reviewerSignatureDate: parseOptionalSignatureDate(validatedData.reviewerSignatureDate),
        status: isDraft ? "DRAFT" : "PENDING",
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
      action: isDraft ? AuditActions.DISCHARGE_SUMMARY_CREATED : AuditActions.DISCHARGE_SUMMARY_SUBMITTED,
      entityType: "DischargeSummary",
      entityId: dischargeSummary.id,
      details: {
        intakeId,
        residentName: dischargeSummary.intake.residentName,
        isDraft,
      },
    });

    return NextResponse.json({ dischargeSummary }, { status: 201 });
  } catch (error) {
    console.error("Create discharge summary error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create discharge summary" },
      { status: 500 }
    );
  }
}
