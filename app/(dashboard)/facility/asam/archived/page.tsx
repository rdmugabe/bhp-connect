import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Archive } from "lucide-react";
import { ArchivedASAMTable } from "@/components/asam/archived-asam-table";

export default async function ArchivedASAMPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhrfProfile) {
    redirect("/login");
  }

  // Fetch archived ASAM assessments
  const archivedAssessments = await prisma.aSAMAssessment.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      archivedAt: { not: null },
    },
    include: {
      intake: {
        select: {
          id: true,
          residentName: true,
        },
      },
    },
    orderBy: { archivedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/asam">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to ASAM Assessments
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archived ASAM Assessments</h1>
        <p className="text-muted-foreground">
          View and restore archived ASAM assessment drafts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Drafts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {archivedAssessments.length > 0 ? (
            <ArchivedASAMTable assessments={archivedAssessments} />
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No archived ASAM assessments found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
