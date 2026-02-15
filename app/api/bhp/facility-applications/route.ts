import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhpProfile) {
      return NextResponse.json({ error: "BHP profile not found" }, { status: 404 });
    }

    const applications = await prisma.facilityApplication.findMany({
      where: {
        bhpId: bhpProfile.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get facility applications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facility applications" },
      { status: 500 }
    );
  }
}
