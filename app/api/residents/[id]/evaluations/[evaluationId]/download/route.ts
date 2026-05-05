import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string; evaluationId: string }> };

/**
 * GET /api/residents/[id]/evaluations/[evaluationId]/download
 * Issues a short-lived signed S3 URL for the evaluation PDF and writes an
 * audit log entry for HIPAA compliance.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, evaluationId } = await params;

    const evaluation = await prisma.residentEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        facility: { select: { bhpId: true } },
      },
    });

    if (!evaluation || evaluation.intakeId !== id) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    // Authorization: same rules as GET /api/residents/[id]/evaluations
    const role = session.user.role;
    let allowed = role === "ADMIN";
    if (!allowed && role === "BHRF") {
      const bhrf = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      allowed = !!bhrf && bhrf.facilityId === evaluation.facilityId;
    } else if (!allowed && role === "BHP") {
      const bhp = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      allowed = !!bhp && evaluation.facility?.bhpId === bhp.id;
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = await getSignedDownloadUrl(evaluation.fileUrl, 300); // 5 min

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EVALUATION_DOWNLOADED,
      entityType: "ResidentEvaluation",
      entityId: evaluation.id,
      details: {
        intakeId: evaluation.intakeId,
        cycleNumber: evaluation.cycleNumber,
        fileName: evaluation.fileName,
      },
    });

    return NextResponse.json({ url, fileName: evaluation.fileName });
  } catch (error) {
    console.error("Download evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
