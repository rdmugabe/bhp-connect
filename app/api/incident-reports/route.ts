import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { incidentReportSchema, incidentReportDraftSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";

// GET - List incident reports for a facility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const status = searchParams.get("status");

    // Get facility ID based on role
    let facilityId: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhrfProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      // BHP can see reports from all their facilities
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
        include: { facilities: true },
      });
      if (!bhpProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      const facilityIds = bhpProfile.facilities.map((f) => f.id);

      const reports = await prisma.incidentReport.findMany({
        where: {
          facilityId: { in: facilityIds },
          ...(intakeId && { intakeId }),
          ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" }),
        },
        include: {
          facility: {
            select: { name: true },
          },
          intake: {
            select: { residentName: true, dateOfBirth: true },
          },
        },
        orderBy: { incidentDate: "desc" },
      });

      return NextResponse.json(reports);
    }

    if (!facilityId) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const reports = await prisma.incidentReport.findMany({
      where: {
        facilityId,
        ...(intakeId && { intakeId }),
        ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" }),
      },
      include: {
        facility: {
          select: { name: true },
        },
        intake: {
          select: { residentName: true, dateOfBirth: true },
        },
      },
      orderBy: { incidentDate: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("List incident reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident reports" },
      { status: 500 }
    );
  }
}

// POST - Create a new incident report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF can create incident reports
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const body = parseResult.data as Record<string, unknown>;
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

    // Generate report number
    const reportCount = await prisma.incidentReport.count({
      where: { facilityId: bhrfProfile.facilityId },
    });
    const reportNumber = `IR-${new Date().getFullYear()}-${String(reportCount + 1).padStart(4, "0")}`;

    // Create the incident report
    const report = await prisma.incidentReport.create({
      data: {
        facilityId: bhrfProfile.facilityId,
        intakeId: data.intakeId || null,
        reportNumber,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : new Date(),
        incidentTime: data.incidentTime || "",
        incidentLocation: data.incidentLocation || "",
        reportCompletedBy: data.reportCompletedBy || session.user.name || "",
        reporterTitle: data.reporterTitle,
        residentName: data.residentName,
        residentDOB: data.residentDOB ? new Date(data.residentDOB) : null,
        residentAdmissionDate: data.residentAdmissionDate ? new Date(data.residentAdmissionDate) : null,
        residentAhcccsId: data.residentAhcccsId,
        incidentTypes: data.incidentTypes || [],
        otherIncidentType: data.otherIncidentType,
        incidentDescription: data.incidentDescription || "",
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
      action: isDraft ? AuditActions.INCIDENT_REPORT_CREATED : AuditActions.INCIDENT_REPORT_SUBMITTED,
      entityType: "IncidentReport",
      entityId: report.id,
      details: {
        reportNumber,
        facilityId: bhrfProfile.facilityId,
        incidentDate: data.incidentDate,
        incidentTypes: data.incidentTypes,
        isDraft,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Create incident report error:", error);
    return NextResponse.json(
      { error: "Failed to create incident report" },
      { status: 500 }
    );
  }
}
