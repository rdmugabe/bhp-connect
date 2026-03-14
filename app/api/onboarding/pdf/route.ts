import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { OnboardingPDF } from "@/lib/pdf/onboarding-template";
import { parseJsonBody } from "@/lib/api-utils";
import { getTodayArizona, formatDateOnly } from "@/lib/date-utils";
import { getFileFromS3 } from "@/lib/s3";

interface OnboardingRequest {
  residentName?: string;
  admissionDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF users can generate onboarding packets
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the BHRF profile and facility
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        facility: {
          select: {
            name: true,
            defaultAdminName: true,
            defaultAdminSignature: true,
          },
        },
      },
    });

    const parseResult = await parseJsonBody<OnboardingRequest>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const { residentName, admissionDate } = parseResult.data;

    if (!residentName || typeof residentName !== "string") {
      return NextResponse.json(
        { error: "Resident name is required" },
        { status: 400 }
      );
    }

    // Format admission date if provided
    const formattedAdmissionDate = admissionDate
      ? formatDateOnly(new Date(admissionDate))
      : undefined;

    // Fetch signature image from S3 if it exists
    let adminSignatureDataUri: string | undefined;
    if (bhrfProfile?.facility.defaultAdminSignature) {
      try {
        const { buffer, contentType } = await getFileFromS3(
          bhrfProfile.facility.defaultAdminSignature
        );
        const base64 = buffer.toString("base64");
        adminSignatureDataUri = `data:${contentType};base64,${base64}`;
      } catch (error) {
        console.error("Failed to fetch signature image:", error);
        // Continue without signature if fetch fails
      }
    }

    // Generate PDF (use Arizona timezone for timestamp display)
    const pdfData = {
      residentName: residentName.trim(),
      facilityName: bhrfProfile?.facility.name,
      admissionDate: formattedAdmissionDate,
      adminName: bhrfProfile?.facility.defaultAdminName || undefined,
      adminSignature: adminSignatureDataUri,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Phoenix",
      }),
    };

    const pdfBuffer = await renderToBuffer(OnboardingPDF({ data: pdfData }));

    // Create filename
    const sanitizedName = residentName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const dateStr = getTodayArizona();
    const filename = `Onboarding_${sanitizedName}_${dateStr}.pdf`;

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
    console.error("Generate onboarding PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
