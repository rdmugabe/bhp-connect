import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityScope } from "@/lib/facility-scope";

// Returns residents from the caller's facility scope for the Group Notes wizard.
// Active (not discharged, not archived, APPROVED) by default; pass
// `?includeDischarged=1` to also surface discharged residents for backfills.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const scope = await getFacilityScope(session, null);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const includeDischarged = req.nextUrl.searchParams.get("includeDischarged") === "1";

  const residents = await prisma.intake.findMany({
    where: {
      ...scope.where,
      archivedAt: null,
      status: "APPROVED",
      ...(includeDischarged ? {} : { dischargedAt: null }),
    },
    select: {
      id: true,
      residentName: true,
      dateOfBirth: true,
      admissionDate: true,
      dischargedAt: true,
    },
    orderBy: [{ dischargedAt: "asc" }, { residentName: "asc" }],
  });

  return NextResponse.json({
    residents: residents.map((r) => ({
      intakeId: r.id,
      name: r.residentName,
      dob: r.dateOfBirth?.toISOString().slice(0, 10) ?? "",
      admissionDate: r.admissionDate?.toISOString().slice(0, 10) ?? null,
      dischargedAt: r.dischargedAt?.toISOString().slice(0, 10) ?? null,
      isDischarged: r.dischargedAt !== null,
    })),
  });
}
