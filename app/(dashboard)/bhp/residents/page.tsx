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
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Eye, FileText, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function BHPResidentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Admission Date</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map((resident) => {
                const asamCount = resident.asamAssessments.length;

                return (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">
                      {resident.residentName}
                    </TableCell>
                    <TableCell>{resident.facility.name}</TableCell>
                    <TableCell>{formatDate(resident.dateOfBirth)}</TableCell>
                    <TableCell>{formatDate(resident.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          1 Intake
                        </Badge>
                        {asamCount > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {asamCount} ASAM
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/bhp/residents/${resident.id}`}>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {residents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No residents found in your facilities.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
