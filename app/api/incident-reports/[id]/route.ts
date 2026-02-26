import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { incidentReportSchema, incidentReportDraftSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";

// GET - Get a single incident report
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

    const report = await prisma.incidentReport.findUnique({
      where: { id },
      include: {
        facility: {
          include: {
            bhp: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
        intake: {
          select: {
            id: true,
            residentName: true,
            dateOfBirth: true,
            admissionDate: true,
            policyNumber: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
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

    return NextResponse.json(report);
  } catch (error) {
    console.error("Get incident report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident report" },
      { status: 500 }
    );
  }
}

// PATCH - Update an incident report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF can update incident reports
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the existing report
    const existingReport = await prisma.incidentReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (existingReport.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // All reports can be edited by BHRF

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const body = parseResult.data;
    const isDraft = body.status === "DRAFT";

    // Validate based on whether it's a draft or submission
    const validationSchema = isDraft ? incidentReportDraftSchema : incidentReportSchema;
    const validationResult = validationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If intakeId is provided, verify the intake belongs to this facility
    if (data.intakeId) {
      const intake = await prisma.intake.findUnique({
        where: { id: data.intakeId },
      });

      if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json(
          { error: "Invalid resident selected" },
          { status: 400 }
        );
      }
    }

    // Update the incident report
    const report = await prisma.incidentReport.update({
      where: { id },
      data: {
        intakeId: data.intakeId || null,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : existingReport.incidentDate,
        incidentTime: data.incidentTime ?? existingReport.incidentTime,
        incidentLocation: data.incidentLocation ?? existingReport.incidentLocation,
        reportCompletedBy: data.reportCompletedBy ?? existingReport.reportCompletedBy,
        reporterTitle: data.reporterTitle,
        residentName: data.residentName,
        residentDOB: data.residentDOB ? new Date(data.residentDOB) : null,
        residentAdmissionDate: data.residentAdmissionDate ? new Date(data.residentAdmissionDate) : null,
        residentAhcccsId: data.residentAhcccsId,
        incidentTypes: data.incidentTypes || [],
        otherIncidentType: data.otherIncidentType,
        incidentDescription: data.incidentDescription ?? existingReport.incidentDescription,
        residentsInvolved: data.residentsInvolved || undefined,
        staffInvolved: data.staffInvolved || undefined,
        witnesses: data.witnesses || undefined,
        anyInjuries: data.anyInjuries ?? false,
        injuryDescription: data.injuryDescription,
        medicalAttentionRequired: data.medicalAttentionRequired ?? false,
        treatmentProvided: data.treatmentProvided,
        was911Called: data.was911Called ?? false,
        wasTransportedToHospital: data.wasTransportedToHospital ?? false,
        hospitalName: data.hospitalName,
        interventionsUsed: data.interventionsUsed || [],
        otherIntervention: data.otherIntervention,
        actionsDescription: data.actionsDescription,
        notifications: data.notifications || undefined,
        residentCurrentCondition: data.residentCurrentCondition,
        residentStatement: data.residentStatement,
        currentSupervisionLevel: data.currentSupervisionLevel,
        otherSupervisionLevel: data.otherSupervisionLevel,
        followUpRequired: data.followUpRequired || [],
        otherFollowUp: data.otherFollowUp,
        followUpActionsTimeline: data.followUpActionsTimeline,
        // Signatures
        staffSignatureName: data.staffSignatureName,
        staffSignatureDate: data.staffSignatureDate ? new Date(data.staffSignatureDate) : null,
        adminSignatureName: data.adminSignatureName,
        adminSignatureDate: data.adminSignatureDate ? new Date(data.adminSignatureDate) : null,
        bhpSignatureName: data.bhpSignatureName,
        bhpSignatureDate: data.bhpSignatureDate ? new Date(data.bhpSignatureDate) : null,
        status: isDraft ? "DRAFT" : "PENDING",
        submittedAt: isDraft ? null : new Date(),
        submittedBy: isDraft ? null : session.user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INCIDENT_REPORT_UPDATED,
      entityType: "IncidentReport",
      entityId: report.id,
      details: {
        reportNumber: report.reportNumber,
        facilityId: bhrfProfile.facilityId,
        incidentDate: data.incidentDate,
        isDraft,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Update incident report error:", error);
    return NextResponse.json(
      { error: "Failed to update incident report" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an incident report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF can delete incident reports
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the existing report
    const existingReport = await prisma.incidentReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (existingReport.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only delete draft reports
    if (existingReport.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only delete draft reports" },
        { status: 400 }
      );
    }

    await prisma.incidentReport.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INCIDENT_REPORT_DELETED,
      entityType: "IncidentReport",
      entityId: id,
      details: {
        reportNumber: existingReport.reportNumber,
        facilityId: bhrfProfile.facilityId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete incident report error:", error);
    return NextResponse.json(
      { error: "Failed to delete incident report" },
      { status: 500 }
    );
  }
}
