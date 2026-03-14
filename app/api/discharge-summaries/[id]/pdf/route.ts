import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { DischargeSummaryDocument } from "@/lib/pdf/discharge-summary-template";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { formatISODateOnly, getTodayArizona } from "@/lib/date-utils";

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

    // Prepare data for PDF
    const pdfData = {
      residentName: dischargeSummary.intake.residentName || "Unknown",
      dateOfBirth: dischargeSummary.intake.dateOfBirth?.toISOString() || "",
      ahcccsId: dischargeSummary.intake.policyNumber || dischargeSummary.intake.ahcccsHealthPlan || "",
      admissionDate: dischargeSummary.intake.admissionDate?.toISOString() || "",
      facilityName: dischargeSummary.facility.name,
      dischargeDate: dischargeSummary.dischargeDate?.toISOString() || "",
      dischargeStartTime: dischargeSummary.dischargeStartTime || undefined,
      dischargeEndTime: dischargeSummary.dischargeEndTime || undefined,
      enrolledProgram: dischargeSummary.enrolledProgram || undefined,
      dischargeType: dischargeSummary.dischargeType || undefined,
      recommendedLevelOfCare: dischargeSummary.recommendedLevelOfCare || undefined,
      contactPhoneAfterDischarge: dischargeSummary.contactPhoneAfterDischarge || undefined,
      contactAddressAfterDischarge: dischargeSummary.contactAddressAfterDischarge || undefined,
      // Clinical Info - Prefilled from Intake/ASAM
      diagnoses: dischargeSummary.diagnoses || undefined,
      allergies: dischargeSummary.allergies || undefined,
      asamLevelOfCare: dischargeSummary.asamLevelOfCare || undefined,
      // Clinical Content
      presentingIssuesAtAdmission: dischargeSummary.presentingIssuesAtAdmission || undefined,
      treatmentSummary: dischargeSummary.treatmentSummary || undefined,
      objectivesAttained: (dischargeSummary.objectivesAttained as Array<{ objective: string; attained: string }>) || [],
      objectiveNarratives: (dischargeSummary.objectiveNarratives as { fullyAttained?: string; partiallyAttained?: string; notAttained?: string }) || {},
      completedServices: dischargeSummary.completedServices || [],
      dischargeSummaryNarrative: dischargeSummary.dischargeSummaryNarrative || undefined,
      dischargingTo: dischargeSummary.dischargingTo || undefined,
      personalItemsReceived: dischargeSummary.personalItemsReceived || false,
      personalItemsStoredDays: dischargeSummary.personalItemsStoredDays || undefined,
      itemsRemainAtFacility: dischargeSummary.itemsRemainAtFacility || false,
      dischargeMedications: (dischargeSummary.dischargeMedications as Array<{ medication: string; dosage?: string; frequency?: string; prescriber?: string }>) || [],
      serviceReferrals: (dischargeSummary.serviceReferrals as Array<{ service: string; provider?: string; phone?: string; address?: string; appointmentDate?: string }>) || [],
      clinicalRecommendations: dischargeSummary.clinicalRecommendations || undefined,
      // Relapse Prevention & Crisis
      relapsePreventionPlan: dischargeSummary.relapsePreventionPlan || undefined,
      crisisResources: dischargeSummary.crisisResources || undefined,
      // Patient Education
      patientEducationProvided: dischargeSummary.patientEducationProvided || undefined,
      specialInstructions: dischargeSummary.specialInstructions || undefined,
      culturalPreferencesConsidered: dischargeSummary.culturalPreferencesConsidered || false,
      suicidePreventionEducation: dischargeSummary.suicidePreventionEducation || undefined,
      // Meeting Participants
      meetingInvitees: (dischargeSummary.meetingInvitees as { bhp?: boolean; caseManager?: boolean; bhtAdmin?: boolean; resident?: boolean; nurse?: boolean }) || {},
      meetingAttendees: (dischargeSummary.meetingAttendees as { bhp?: boolean; caseManager?: boolean; bhtAdmin?: boolean; resident?: boolean; nurse?: boolean }) || {},
      clientSignature: dischargeSummary.clientSignature || undefined,
      clientSignatureDate: dischargeSummary.clientSignatureDate?.toISOString() || undefined,
      staffSignature: dischargeSummary.staffSignature || undefined,
      staffCredentials: dischargeSummary.staffCredentials || undefined,
      staffSignatureDate: dischargeSummary.staffSignatureDate?.toISOString() || undefined,
      reviewerSignature: dischargeSummary.reviewerSignature || undefined,
      reviewerCredentials: dischargeSummary.reviewerCredentials || undefined,
      reviewerSignatureDate: dischargeSummary.reviewerSignatureDate?.toISOString() || undefined,
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      DischargeSummaryDocument({ data: pdfData })
    );

    // Log the download
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.DISCHARGE_SUMMARY_PDF_DOWNLOADED,
      entityType: "DischargeSummary",
      entityId: dischargeSummary.id,
      details: {
        residentName: dischargeSummary.intake.residentName,
      },
    });

    // Create filename
    const residentNameForFile = (dischargeSummary.intake.residentName || "unknown")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    // Use UTC for stored date-only fields, Arizona timezone for current date
    const dateForFile = dischargeSummary.dischargeDate
      ? formatISODateOnly(dischargeSummary.dischargeDate)
      : getTodayArizona();
    const filename = `discharge_summary_${residentNameForFile}_${dateForFile}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate discharge summary PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
