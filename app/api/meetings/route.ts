import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { meetingSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    let meetings;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ meetings: [] });
      }

      meetings = await prisma.meeting.findMany({
        where: {
          facility: {
            bhpId: bhpProfile.id,
            ...(facilityId && { id: facilityId }),
          },
          ...(status && { status: status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }),
          ...(upcoming && {
            scheduledAt: { gte: new Date() },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ meetings: [] });
      }

      meetings = await prisma.meeting.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(status && { status: status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }),
          ...(upcoming && {
            scheduledAt: { gte: new Date() },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
      });
    }

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Get meetings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhpProfile) {
      return NextResponse.json(
        { error: "BHP profile not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = meetingSchema.parse(body);

    // Verify the facility belongs to this BHP
    const facility = await prisma.facility.findFirst({
      where: {
        id: validatedData.facilityId,
        bhpId: bhpProfile.id,
      },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found or not authorized" },
        { status: 403 }
      );
    }

    const meeting = await prisma.meeting.create({
      data: {
        facilityId: validatedData.facilityId,
        title: validatedData.title,
        description: validatedData.description,
        scheduledAt: new Date(validatedData.scheduledAt),
        duration: validatedData.duration,
        meetingUrl: validatedData.meetingUrl || null,
        createdBy: session.user.id,
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
      action: AuditActions.MEETING_CREATED,
      entityType: "Meeting",
      entityId: meeting.id,
      details: {
        title: meeting.title,
        facilityName: meeting.facility.name,
        scheduledAt: meeting.scheduledAt,
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error("Create meeting error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
