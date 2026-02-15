import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let facilities;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ facilities: [] });
      }

      facilities = await prisma.facility.findMany({
        where: { bhpId: bhpProfile.id },
        include: {
          owner: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              intakes: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          facility: {
            include: {
              bhp: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      facilities = bhrfProfile?.facility ? [bhrfProfile.facility] : [];
    }

    return NextResponse.json({ facilities });
  } catch (error) {
    console.error("Get facilities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facilities" },
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
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = facilitySchema.parse(body);

    const facility = await prisma.facility.create({
      data: {
        ...validatedData,
        bhpId: bhpProfile.id,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.FACILITY_CREATED,
      entityType: "Facility",
      entityId: facility.id,
      details: { name: facility.name },
    });

    return NextResponse.json({ facility }, { status: 201 });
  } catch (error) {
    console.error("Create facility error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create facility" },
      { status: 500 }
    );
  }
}
