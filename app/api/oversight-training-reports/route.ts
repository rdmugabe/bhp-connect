import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { oversightTrainingReportSchema } from "@/lib/validations";
import { uploadToS3, generateFileKey } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { getBiWeekNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ reports: [] });
      }

      // Get all facilities for this BHP
      const facilities = await prisma.facility.findMany({
        where: { bhpId: bhpProfile.id },
        select: { id: true },
      });

      const reports = await prisma.oversightTrainingReport.findMany({
        where: {
          facilityId: { in: facilities.map((f) => f.id) },
          ...(year && { year: parseInt(year) }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { biWeek: "desc" }],
      });

      return NextResponse.json({ reports });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ reports: [] });
      }

      const reports = await prisma.oversightTrainingReport.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(year && { year: parseInt(year) }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { biWeek: "desc" }],
      });

      return NextResponse.json({ reports });
    }

    return NextResponse.json({ reports: [] });
  } catch (error) {
    console.error("Get oversight training reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch oversight training reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const dataString = formData.get("data") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Document file is required" },
        { status: 400 }
      );
    }

    if (!dataString) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and images are allowed." },
        { status: 400 }
      );
    }

    const data = JSON.parse(dataString);
    const validatedData = oversightTrainingReportSchema.parse(data);

    // Parse the training date to get bi-week and year
    const trainingDate = new Date(validatedData.trainingDate);
    const biWeek = getBiWeekNumber(trainingDate);
    // Use ISO week year for consistency
    const d = new Date(Date.UTC(trainingDate.getFullYear(), trainingDate.getMonth(), trainingDate.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const year = d.getUTCFullYear();

    // Check for duplicate (same facility, biWeek, year)
    const existing = await prisma.oversightTrainingReport.findUnique({
      where: {
        facilityId_biWeek_year: {
          facilityId: bhrfProfile.facilityId,
          biWeek,
          year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `An oversight training report already exists for bi-week ${biWeek} of ${year}`,
        },
        { status: 400 }
      );
    }

    // Upload file to S3
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileKey = generateFileKey(
      "oversight-training",
      session.user.id,
      file.name
    );

    await uploadToS3({
      key: fileKey,
      body: buffer,
      contentType: file.type,
    });

    const report = await prisma.oversightTrainingReport.create({
      data: {
        facilityId: bhrfProfile.facilityId,
        biWeek,
        year,
        trainingDate,
        conductedBy: validatedData.conductedBy,
        staffParticipants: validatedData.staffParticipants,
        documentUrl: fileKey,
        documentName: file.name,
        notes: validatedData.notes,
        submittedBy: session.user.id,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.OVERSIGHT_TRAINING_SUBMITTED,
      entityType: "OversightTrainingReport",
      entityId: report.id,
      details: {
        biWeek,
        year,
        trainingDate: validatedData.trainingDate,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Create oversight training report error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create oversight training report" },
      { status: 500 }
    );
  }
}
