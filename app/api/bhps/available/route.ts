import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint - returns list of approved BHPs for BHRF registration
export async function GET() {
  try {
    const approvedBHPs = await prisma.user.findMany({
      where: {
        role: "BHP",
        approvalStatus: "APPROVED",
      },
      include: {
        bhpProfile: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Return only necessary fields
    const bhps = approvedBHPs.map((user) => ({
      id: user.bhpProfile?.id,
      name: user.name,
      address: user.bhpProfile?.address,
    }));

    // Filter out any without a BHP profile
    const validBhps = bhps.filter((bhp) => bhp.id);

    return NextResponse.json({ bhps: validBhps });
  } catch (error) {
    console.error("Get available BHPs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch available BHPs" },
      { status: 500 }
    );
  }
}
