import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { MARTemplate } from "@/lib/pdf/mar-template";
import { marHeaderSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";

// POST - Generate MAR PDF
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const body = parseResult.data;

    // Validate the input
    const validationResult = marHeaderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Format date of birth for display
    let formattedDOB = data.dateOfBirth;
    try {
      const dobDate = new Date(data.dateOfBirth);
      formattedDOB = dobDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      // Keep original format if parsing fails
    }

    // Format admit date for display
    let formattedAdmitDate = data.admitDate || "";
    if (data.admitDate) {
      try {
        const admitDate = new Date(data.admitDate);
        formattedAdmitDate = admitDate.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
      } catch {
        // Keep original format if parsing fails
      }
    }

    // Prepare PDF data
    const pdfData = {
      facilityName: data.facilityName,
      monthYear: data.monthYear,
      residentName: data.residentName,
      dateOfBirth: formattedDOB,
      admitDate: formattedAdmitDate,
      allergies: data.allergies,
      ahcccsId: data.ahcccsId,
      diagnosis: data.diagnosis,
      emergencyContact: data.emergencyContact,
      prescriberName: data.prescriberName,
      prescriberPhone: data.prescriberPhone,
      pharmacyName: data.pharmacyName,
      pharmacyPhone: data.pharmacyPhone,
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(MARTemplate({ data: pdfData }));

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="MAR-${data.residentName.replace(/\s+/g, "-")}-${data.monthYear.replace("/", "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate MAR PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate MAR PDF" },
      { status: 500 }
    );
  }
}
