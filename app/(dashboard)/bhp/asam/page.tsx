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
import { Eye, Edit, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function BHPASAMPage() {
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

  // Fetch all assessments
  const assessments = await prisma.aSAMAssessment.findMany({
    where: {
      facility: {
        bhpId: bhpProfile.id,
      },
    },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
        },
      },
      intake: {
        select: {
          id: true,
          residentName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ASAM Assessments</h1>
        <p className="text-muted-foreground">
          View and manage ASAM substance abuse assessments from your facilities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All ASAM Assessments
          </CardTitle>
          <CardDescription>
            ASAM assessments submitted by your facilities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Linked Intake</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Rec. Level of Care</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    {assessment.patientName}
                  </TableCell>
                  <TableCell>{assessment.facility.name}</TableCell>
                  <TableCell>
                    <Link
                      href={`/bhp/intakes/${assessment.intake.id}`}
                      className="text-primary hover:underline text-sm"
                    >
                      View Intake
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(assessment.dateOfBirth)}</TableCell>
                  <TableCell>{formatDate(assessment.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {assessment.recommendedLevelOfCare || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/bhp/asam/${assessment.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/bhp/asam/${assessment.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {assessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No ASAM assessments found
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
