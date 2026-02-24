import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { IncidentReportPDF } from "@/lib/pdf/incident-report-template";

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

    // Fetch the incident report with authorization check
    const report = await prisma.incidentReport.findUnique({
      where: { id },
      include: {
        facility: {
          include: {
            bhp: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        intake: {
          select: {
            residentName: true,
            dateOfBirth: true,
            admissionDate: true,
            policyNumber: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Authorization check based on role
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (report.facility.bhpId !== bhpProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (report.facilityId !== bhrfProfile?.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Helper to truncate long text for PDF safety
    const safeText = (text: string | null | undefined, maxLength = 5000): string | null => {
      if (!text) return null;
      if (text.length > maxLength) {
        return text.slice(0, maxLength) + '... [Content truncated for PDF]';
      }
      return text;
    };

    // Prepare PDF data
    const pdfData = {
      id: report.id,
      reportNumber: report.reportNumber,
      incidentDate: report.incidentDate.toISOString(),
      incidentTime: report.incidentTime,
      incidentLocation: report.incidentLocation,
      reportDate: report.reportDate.toISOString(),
      reportCompletedBy: report.reportCompletedBy,
      reporterTitle: report.reporterTitle,
      residentName: report.intake?.residentName || report.residentName,
      residentDOB: report.intake?.dateOfBirth?.toISOString() || report.residentDOB?.toISOString() || null,
      residentAdmissionDate: report.intake?.admissionDate?.toISOString() || report.residentAdmissionDate?.toISOString() || null,
      residentAhcccsId: report.intake?.policyNumber || report.residentAhcccsId,
      incidentTypes: report.incidentTypes,
      otherIncidentType: report.otherIncidentType,
      incidentDescription: safeText(report.incidentDescription) || "",
      residentsInvolved: report.residentsInvolved as { name: string; dob?: string; roleInIncident?: string }[] | null,
      staffInvolved: report.staffInvolved as { name: string; title?: string; roleInIncident?: string }[] | null,
      witnesses: report.witnesses as { name: string; titleOrRelationship?: string; contactInfo?: string }[] | null,
      anyInjuries: report.anyInjuries,
      injuryDescription: safeText(report.injuryDescription),
      medicalAttentionRequired: report.medicalAttentionRequired,
      treatmentProvided: safeText(report.treatmentProvided),
      was911Called: report.was911Called,
      wasTransportedToHospital: report.wasTransportedToHospital,
      hospitalName: report.hospitalName,
      interventionsUsed: report.interventionsUsed,
      otherIntervention: report.otherIntervention,
      actionsDescription: safeText(report.actionsDescription),
      notifications: report.notifications as { personEntity: string; name?: string; dateTime?: string; method?: string; notifiedBy?: string }[] | null,
      residentCurrentCondition: safeText(report.residentCurrentCondition),
      residentStatement: safeText(report.residentStatement),
      currentSupervisionLevel: report.currentSupervisionLevel,
      otherSupervisionLevel: report.otherSupervisionLevel,
      followUpRequired: report.followUpRequired,
      otherFollowUp: report.otherFollowUp,
      followUpActionsTimeline: safeText(report.followUpActionsTimeline),
      // Signatures
      staffSignatureName: report.staffSignatureName,
      staffSignatureDate: report.staffSignatureDate?.toISOString() || null,
      adminSignatureName: report.adminSignatureName,
      adminSignatureDate: report.adminSignatureDate?.toISOString() || null,
      bhpSignatureName: report.bhpSignatureName,
      bhpSignatureDate: report.bhpSignatureDate?.toISOString() || null,
      facility: {
        name: report.facility.name,
        address: report.facility.address,
        phone: report.facility.phone,
      },
      bhpName: report.facility.bhp?.user?.name || "Unknown BHP",
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      IncidentReportPDF({ data: pdfData })
    );

    // Log the PDF download for HIPAA compliance
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INCIDENT_REPORT_PDF_DOWNLOADED,
      entityType: "IncidentReport",
      entityId: report.id,
      details: {
        reportNumber: report.reportNumber,
        facilityName: report.facility.name,
        downloadedBy: session.user.name,
        downloadedByRole: session.user.role,
      },
    });

    // Create filename
    const dateStr = new Date(report.incidentDate).toISOString().split("T")[0];
    const reportNum = report.reportNumber || report.id.slice(0, 8);
    const filename = `incident_report_${reportNum}_${dateStr}.pdf`;

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate Incident Report PDF error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
