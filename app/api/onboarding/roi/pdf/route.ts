import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReleaseOfInformationDocument } from "@/lib/pdf/release-of-information-template";
import { parseJsonBody } from "@/lib/api-utils";
import { getTodayArizona } from "@/lib/date-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF users can generate onboarding forms
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get facility info for the BHRF user
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        facility: true,
      },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "BHRF profile not found" }, { status: 404 });
    }

    const parseResult = await parseJsonBody<{ patientName?: string; dateOfBirth?: string; phone?: string; discloseFromName?: string; discloseFromContact?: string }>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const { patientName, dateOfBirth, phone, discloseFromName, discloseFromContact } = parseResult.data;

    if (!patientName || !dateOfBirth || !phone) {
      return NextResponse.json(
        { error: "Patient name, date of birth, and phone are required" },
        { status: 400 }
      );
    }

    // Prepare data for PDF with facility info for DISCLOSE TO
    const pdfData = {
      patientName,
      dateOfBirth,
      phone,
      address: bhrfProfile.facility.address || "",
      currentDate: new Date().toISOString(),
      discloseFromName: discloseFromName || "",
      discloseFromContact: discloseFromContact || "",
      discloseToName: bhrfProfile.facility.name,
      discloseToContact: [bhrfProfile.facility.address, bhrfProfile.facility.phone]
        .filter(Boolean)
        .join(" | "),
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ReleaseOfInformationDocument({ data: pdfData })
    );

    // Create filename
    const patientNameForFile = patientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    const dateForFile = getTodayArizona();
    const filename = `release_of_information_${patientNameForFile}_${dateForFile}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate ROI PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
