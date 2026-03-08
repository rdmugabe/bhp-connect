import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

// POST - Restore an archived ASAM assessment draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF role can restore drafts
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify facility ownership
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    const assessment = await prisma.aSAMAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.facilityId !== bhrfProfile?.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow restoring archived assessments
    if (!assessment.archivedAt) {
      return NextResponse.json(
        { error: "Assessment is not archived" },
        { status: 400 }
      );
    }

    // Restore the assessment by clearing archivedAt
    await prisma.aSAMAssessment.update({
      where: { id },
      data: {
        archivedAt: null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ASAM_DRAFT_RESTORED,
      entityType: "ASAMAssessment",
      entityId: id,
      details: {
        patientName: assessment.patientName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore ASAM assessment error:", error);
    return NextResponse.json(
      { error: "Failed to restore ASAM assessment" },
      { status: 500 }
    );
  }
}
