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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Plus, Edit, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function FacilityASAMPage() {
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

  // Fetch drafts and submitted assessments separately
  const [drafts, submittedAssessments] = await Promise.all([
    prisma.aSAMAssessment.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
        status: "DRAFT",
      },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.aSAMAssessment.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
        status: { not: "DRAFT" },
      },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ASAM Assessments</h1>
          <p className="text-muted-foreground">
            Manage ASAM substance abuse assessments for your facility
          </p>
        </div>
        <Link href="/facility/asam/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New ASAM Assessment
          </Button>
        </Link>
      </div>

      {/* Draft Assessments Section */}
      {drafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Draft Assessments
              <Badge variant="secondary" className="ml-2">
                {drafts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Linked Intake</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">
                      {assessment.patientName === "Draft Assessment"
                        ? "New Draft"
                        : assessment.patientName}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/facility/intakes/${assessment.intake.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View Intake
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Step {assessment.draftStep || 1} of 8
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(assessment.updatedAt)}</TableCell>
                    <TableCell>
                      <Link href={`/facility/asam/${assessment.id}/edit`}>
                        <Button variant="default" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Continue
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Submitted Assessments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submitted Assessments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Linked Intake</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittedAssessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    {assessment.patientName}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/facility/intakes/${assessment.intake.id}`}
                      className="text-primary hover:underline text-sm"
                    >
                      View Intake
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(assessment.dateOfBirth)}</TableCell>
                  <TableCell>{formatDate(assessment.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/facility/asam/${assessment.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/facility/asam/${assessment.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {submittedAssessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No submitted ASAM assessments found
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
