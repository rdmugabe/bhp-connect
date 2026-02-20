import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.oversightTrainingReport.findUnique({
      where: { id },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Verify access
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== report.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const facility = await prisma.facility.findUnique({
        where: { id: report.facilityId },
      });

      if (!facility || facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Get oversight training report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch oversight training report" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = await prisma.oversightTrainingReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from S3
    try {
      await deleteFromS3(report.documentUrl);
    } catch (s3Error) {
      console.error("Failed to delete S3 file:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete both the OversightTrainingReport and linked Document in a transaction
    await prisma.$transaction(async (tx) => {
      // First delete the oversight training report
      await tx.oversightTrainingReport.delete({
        where: { id },
      });

      // Then delete the linked document if it exists
      if (report.documentId) {
        await tx.document.delete({
          where: { id: report.documentId },
        });
      }
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.OVERSIGHT_TRAINING_DELETED,
      entityType: "OversightTrainingReport",
      entityId: id,
      details: {
        biWeek: report.biWeek,
        year: report.year,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete oversight training report error:", error);
    return NextResponse.json(
      { error: "Failed to delete oversight training report" },
      { status: 500 }
    );
  }
}
