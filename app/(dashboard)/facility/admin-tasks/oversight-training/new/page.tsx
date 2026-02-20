import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { OversightTrainingForm } from "@/components/admin-tasks/oversight-training-form";

export default async function NewOversightTrainingReportPage() {
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

  // Get active employees for the facility
  const employees = await prisma.employee.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/admin-tasks/oversight-training">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Oversight Training
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-purple-500" />
          New Oversight Training Report
        </h1>
        <p className="text-muted-foreground mt-2">
          Submit an oversight training report for {bhrfProfile.facility.name}
        </p>
      </div>

      <OversightTrainingForm employees={employees} />
    </div>
  );
}
