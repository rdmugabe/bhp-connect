import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { EmployeeOnboardingPDF } from "@/lib/pdf/employee-onboarding-template";

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

    // Get the facility name from the BHRF profile
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        facility: {
          select: { name: true },
        },
      },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility profile not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { employeeName, hireDate } = body;

    if (!employeeName || typeof employeeName !== "string") {
      return NextResponse.json(
        { error: "Employee name is required" },
        { status: 400 }
      );
    }

    if (!hireDate || typeof hireDate !== "string") {
      return NextResponse.json(
        { error: "Hire date is required" },
        { status: 400 }
      );
    }

    // Format hire date for display
    const formattedHireDate = new Date(hireDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

    // Generate PDF
    const pdfData = {
      employeeName: employeeName.trim(),
      hireDate: formattedHireDate,
      facilityName: bhrfProfile.facility.name,
    };

    const pdfBuffer = await renderToBuffer(EmployeeOnboardingPDF({ data: pdfData }));

    // Create filename
    const sanitizedName = employeeName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `Employee_Onboarding_${sanitizedName}_${dateStr}.pdf`;

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
    console.error("Generate employee onboarding PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
