import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/residents/[id]/re-evaluation-due-date
 * Sets (or clears) a resident's next re-evaluation due date. Decoupled from
 * uploading a PDF — admins can set the date directly.
 *
 * Body: { dueDate: "YYYY-MM-DD" | null }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const intake = await prisma.intake.findUnique({
      where: { id },
      select: {
        id: true,
        facilityId: true,
        residentName: true,
        nextReEvaluationDueDate: true,
        facility: { select: { bhpId: true } },
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    // Authorization
    const role = session.user.role;
    let canWrite = false;
    if (role === "ADMIN") canWrite = true;
    else if (role === "BHRF") {
      const bhrf = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      canWrite = !!bhrf && bhrf.facilityId === intake.facilityId;
    }
    if (!canWrite) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as { dueDate?: string | null } | null;
    if (!body || (body.dueDate !== null && typeof body.dueDate !== "string")) {
      return NextResponse.json(
        { error: "Body must be { dueDate: 'YYYY-MM-DD' | null }" },
        { status: 400 }
      );
    }

    let newDueDate: Date | null = null;
    if (body.dueDate) {
      const parsed = new Date(body.dueDate + "T00:00:00.000Z");
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
      }
      newDueDate = parsed;
    }

    const previous = intake.nextReEvaluationDueDate;
    await prisma.intake.update({
      where: { id },
      data: { nextReEvaluationDueDate: newDueDate },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.REEVALUATION_DUE_DATE_SET,
      entityType: "Intake",
      entityId: id,
      details: {
        residentName: intake.residentName,
        previousDueDate: previous?.toISOString() ?? null,
        newDueDate: newDueDate?.toISOString() ?? null,
      },
    });

    return NextResponse.json({
      intakeId: id,
      nextReEvaluationDueDate: newDueDate,
    });
  } catch (error) {
    console.error("Set re-evaluation due date error:", error);
    return NextResponse.json(
      { error: "Failed to set due date" },
      { status: 500 }
    );
  }
}
