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
import { ResidentsTable } from "@/components/residents/residents-table";

export default async function BHPResidentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  // Fetch all residents from facilities managed by this BHP
  const residents = await prisma.intake.findMany({
    where: {
      facility: {
        bhpId: bhpProfile.id,
      },
      status: { not: "DRAFT" },
    },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
        },
      },
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Residents</h1>
        <p className="text-muted-foreground">
          View all residents across your facilities and their documents
        </p>
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
          <ResidentsTable
            residents={residents}
            bhpEmail={bhpProfile.user.email}
          />
        </CardContent>
      </Card>
    </div>
  );
}
