import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { FacilityResidentsTable } from "@/components/residents/facility-residents-table";

export default async function FacilityResidentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      facility: {
        include: {
          bhp: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!bhrfProfile) {
    redirect("/login");
  }

  const bhpEmail = bhrfProfile.facility.bhp.user.email;

  // Fetch all residents (from intakes) with their document counts
  const residents = await prisma.intake.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      status: { not: "DRAFT" }, // Only show submitted intakes as residents
    },
    include: {
      asamAssessments: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Residents</h1>
          <p className="text-muted-foreground">
            View all residents and their related documents
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Residents
            <Badge variant="secondary" className="ml-2">
              {residents.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Click on a resident to view all their documents
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <FacilityResidentsTable
            residents={residents}
            bhpEmail={bhpEmail}
          />
        </CardContent>
      </Card>
    </div>
  );
}
