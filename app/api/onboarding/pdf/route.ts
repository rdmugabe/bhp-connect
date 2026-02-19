import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { OnboardingPDF } from "@/lib/pdf/onboarding-template";

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

    const body = await request.json();
    const { residentName } = body;

    if (!residentName || typeof residentName !== "string") {
      return NextResponse.json(
        { error: "Resident name is required" },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfData = {
      residentName: residentName.trim(),
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    const pdfBuffer = await renderToBuffer(OnboardingPDF({ data: pdfData }));

    // Create filename
    const sanitizedName = residentName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const dateStr = new Date().toISOString().split("T")[0];
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
