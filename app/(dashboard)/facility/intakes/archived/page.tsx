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
import { ArchivedIntakesTable } from "@/components/intakes/archived-intakes-table";

export default async function ArchivedIntakesPage() {
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

  // Fetch archived intakes
  const archivedIntakes = await prisma.intake.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      archivedAt: { not: null },
    },
    orderBy: { archivedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/intakes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Intakes
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archived Intakes</h1>
        <p className="text-muted-foreground">
          View and restore archived intake drafts
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
          {archivedIntakes.length > 0 ? (
            <ArchivedIntakesTable intakes={archivedIntakes} />
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No archived intakes found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
