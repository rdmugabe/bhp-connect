import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { EvacuationDrillForm } from "@/components/evacuation-drills/evacuation-drill-form";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewEvacuationDrillReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/");
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      facility: true,
    },
  });

  if (!bhrfProfile) {
    redirect("/");
  }

  // Get approved residents from intakes for evacuation drills
  const approvedIntakes = await prisma.intake.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      status: "APPROVED",
    },
    select: {
      residentName: true,
    },
  });

  const approvedResidents = approvedIntakes.map((intake) => ({
    name: intake.residentName,
  }));

  const params = await searchParams;
  const preselectedType = params.type as "EVACUATION" | "DISASTER" | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/admin-tasks/evacuation-drills">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drills
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-500" />
          New Drill Report
        </h1>
        <p className="text-muted-foreground mt-2">
          Submit an evacuation or disaster drill report for {bhrfProfile.facility.name}
        </p>
      </div>

      <EvacuationDrillForm
        preselectedType={preselectedType}
        approvedResidents={approvedResidents}
      />
    </div>
  );
}
