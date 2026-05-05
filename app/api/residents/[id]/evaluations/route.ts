import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3, generateFileKey } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseOptionalPastDate } from "@/lib/date-utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Verify the caller can act on this resident.
 */
async function authorize(
  session: Awaited<ReturnType<typeof getServerSession>>,
  intakeId: string,
  requireWrite: boolean
) {
  if (!session) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    select: {
      id: true,
      facilityId: true,
      admissionDate: true,
      residentName: true,
      nextReEvaluationDueDate: true,
      facility: { select: { bhpId: true } },
    },
  });

  if (!intake) {
    throw NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  const role = session.user.role;
  let canWrite = false;
  let canRead = false;

  if (role === "ADMIN") {
    canWrite = true;
    canRead = true;
  } else if (role === "BHRF") {
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (bhrfProfile && bhrfProfile.facilityId === intake.facilityId) {
      canWrite = true;
      canRead = true;
    }
  } else if (role === "BHP") {
    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (bhpProfile && intake.facility?.bhpId === bhpProfile.id) {
      canRead = true;
    }
  }

  if (requireWrite && !canWrite) {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canRead) {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return intake;
}

/** GET /api/residents/[id]/evaluations — list re-evaluation history */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const intake = await authorize(session, id, false);

    const evaluations = await prisma.residentEvaluation.findMany({
      where: { intakeId: id },
      orderBy: { completedDate: "desc" },
    });

    return NextResponse.json({
      evaluations,
      admissionDate: intake.admissionDate,
      residentName: intake.residentName,
      nextReEvaluationDueDate: intake.nextReEvaluationDueDate,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("List evaluations error:", error);
    return NextResponse.json({ error: "Failed to load evaluations" }, { status: 500 });
  }
}

/**
 * POST /api/residents/[id]/evaluations — upload a re-evaluation PDF.
 *
 * Body (multipart):
 *   - file: PDF
 *   - completedDate: ISO date — when the evaluation was signed (defaults today)
 *   - nextDueDate: ISO date — required, sets the next Re-Evaluation Countdown
 *   - notes: optional
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const intake = await authorize(session, id, true);

    const formData = await request.formData();
    const file = formData.get("file");
    const completedDateRaw = formData.get("completedDate") as string | null;
    const nextDueDateRaw = formData.get("nextDueDate") as string | null;
    const notes = (formData.get("notes") as string) || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds max size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF files only" }, { status: 415 });
    }

    // Evaluation date (when signed) — defaults to today
    let completedDate: Date;
    try {
      const parsed = parseOptionalPastDate(completedDateRaw || undefined);
      completedDate = parsed ?? new Date();
    } catch (err) {
      return NextResponse.json(
        {
          error: `Evaluation date invalid: ${
            err instanceof Error ? err.message : "unknown"
          }`,
        },
        { status: 400 }
      );
    }

    // Next due date — required
    if (!nextDueDateRaw) {
      return NextResponse.json(
        { error: "Next re-evaluation due date is required" },
        { status: 400 }
      );
    }
    const nextDueDate = new Date(nextDueDateRaw + "T00:00:00.000Z");
    if (isNaN(nextDueDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid next due date" },
        { status: 400 }
      );
    }

    // Auto-increment cycleNumber per resident (history pointer only)
    const lastEval = await prisma.residentEvaluation.findFirst({
      where: { intakeId: id },
      orderBy: { cycleNumber: "desc" },
      select: { cycleNumber: true },
    });
    const cycleNumber = (lastEval?.cycleNumber ?? 0) + 1;

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateFileKey(
      intake.facilityId,
      `evaluations/${id}/cycle-${cycleNumber}`,
      file.name
    );
    const s3Key = await uploadToS3({
      key,
      body: buffer,
      contentType: file.type,
    });

    // Create the history row + update the resident's next due date in one
    // transaction so the countdown stays in lockstep with what was uploaded.
    const evaluation = await prisma.$transaction(async (tx) => {
      const created = await tx.residentEvaluation.create({
        data: {
          intakeId: id,
          facilityId: intake.facilityId,
          cycleNumber,
          // cycleStart/End preserved from old schema; now just record what
          // the upload was filed against (completedDate to nextDueDate).
          cycleStartDate: completedDate,
          cycleEndDate: nextDueDate,
          completedDate,
          fileUrl: s3Key,
          fileName: file.name,
          fileSize: file.size,
          uploadedBy: session!.user.id,
          notes,
        },
      });
      await tx.intake.update({
        where: { id },
        data: { nextReEvaluationDueDate: nextDueDate },
      });
      return created;
    });

    await createAuditLog({
      userId: session!.user.id,
      action: AuditActions.EVALUATION_UPLOADED,
      entityType: "ResidentEvaluation",
      entityId: evaluation.id,
      details: {
        intakeId: id,
        cycleNumber,
        fileName: file.name,
        completedDate: completedDate.toISOString(),
        nextDueDate: nextDueDate.toISOString(),
      },
    });

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Upload evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to upload evaluation" },
      { status: 500 }
    );
  }
}
