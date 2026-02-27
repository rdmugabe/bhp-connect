import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dischargeSummarySchema, dischargeSummaryDraftSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseOptionalPastDate, parseOptionalSignatureDate } from "@/lib/date-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const dischargeSummary = await prisma.dischargeSummary.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
            dateOfBirth: true,
            policyNumber: true,
            ahcccsHealthPlan: true,
            admissionDate: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            bhpId: true,
          },
        },
      },
    });

    if (!dischargeSummary) {
      return NextResponse.json({ error: "Discharge summary not found" }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || dischargeSummary.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || dischargeSummary.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ dischargeSummary });
  } catch (error) {
    console.error("Get discharge summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discharge summary" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const existingSummary = await prisma.dischargeSummary.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingSummary) {
      return NextResponse.json({ error: "Discharge summary not found" }, { status: 404 });
    }

    if (existingSummary.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const { isDraft, ...summaryData } = parseResult.data as { isDraft?: boolean; [key: string]: unknown };

    // Use appropriate schema based on draft status
    const validatedData = isDraft
      ? dischargeSummaryDraftSchema.parse(summaryData)
      : dischargeSummarySchema.parse(summaryData);

    const dischargeSummary = await prisma.dischargeSummary.update({
      where: { id },
      data: {
        dischargeDate: parseOptionalPastDate(validatedData.dischargeDate) || existingSummary.dischargeDate,
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
        submittedAt: isDraft ? existingSummary.submittedAt : new Date(),
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
      action: isDraft ? AuditActions.DISCHARGE_SUMMARY_UPDATED : AuditActions.DISCHARGE_SUMMARY_SUBMITTED,
      entityType: "DischargeSummary",
      entityId: dischargeSummary.id,
      details: {
        residentName: dischargeSummary.intake.residentName,
        isDraft,
      },
    });

    return NextResponse.json({ dischargeSummary });
  } catch (error) {
    console.error("Update discharge summary error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update discharge summary" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const existingSummary = await prisma.dischargeSummary.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingSummary) {
      return NextResponse.json({ error: "Discharge summary not found" }, { status: 404 });
    }

    if (existingSummary.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.dischargeSummary.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.DISCHARGE_SUMMARY_DELETED,
      entityType: "DischargeSummary",
      entityId: id,
      details: {
        residentName: existingSummary.intake.residentName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete discharge summary error:", error);
    return NextResponse.json(
      { error: "Failed to delete discharge summary" },
      { status: 500 }
    );
  }
}
