import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/s3";

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

    // Generate signed URL for download
    const signedUrl = await getSignedDownloadUrl(report.documentUrl, 3600);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Download oversight training document error:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}
