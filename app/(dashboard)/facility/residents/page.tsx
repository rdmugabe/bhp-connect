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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserX } from "lucide-react";
import { FacilityResidentsTable } from "@/components/residents/facility-residents-table";
import { DischargedResidentsTable } from "@/components/residents/discharged-residents-table";

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

  // Fetch active residents (not discharged, not drafts)
  const activeResidents = await prisma.intake.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      status: { not: "DRAFT" },
      dischargedAt: null,
      archivedAt: null,
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

  // Fetch discharged residents
  const dischargedResidents = await prisma.intake.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      dischargedAt: { not: null },
    },
    include: {
      asamAssessments: {
        select: {
          id: true,
          status: true,
        },
      },
      dischargeSummary: {
        select: {
          dischargeDate: true,
        },
      },
    },
    orderBy: { dischargedAt: "desc" },
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Residents
            <Badge variant="secondary" className="ml-1">
              {activeResidents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="discharged" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Discharged
            <Badge variant="outline" className="ml-1">
              {dischargedResidents.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Residents
              </CardTitle>
              <CardDescription>
                Click on a resident to view all their documents
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <FacilityResidentsTable
                residents={activeResidents}
                bhpEmail={bhpEmail}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discharged">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Discharged Residents
              </CardTitle>
              <CardDescription>
                View records for discharged residents or re-admit them
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DischargedResidentsTable residents={dischargedResidents} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
