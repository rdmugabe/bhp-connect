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
import { Eye, Plus, Edit, FileText, Archive } from "lucide-react";
import { formatDate, formatTimestampDate } from "@/lib/utils";
import { ASAMDraftsTable } from "@/components/asam/asam-drafts-table";

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

  // Fetch drafts, submitted assessments, and archived count
  const [drafts, submittedAssessments, archivedCount] = await Promise.all([
    prisma.aSAMAssessment.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
        status: "DRAFT",
        archivedAt: null,
        intake: {
          dischargedAt: null, // Exclude discharged patients
        },
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
        archivedAt: null,
        intake: {
          dischargedAt: null, // Exclude discharged patients
        },
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
    prisma.aSAMAssessment.count({
      where: {
        facilityId: bhrfProfile.facilityId,
        archivedAt: { not: null },
      },
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
        <div className="flex gap-2">
          {archivedCount > 0 && (
            <Link href="/facility/asam/archived">
              <Button variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Archived ({archivedCount})
              </Button>
            </Link>
          )}
          <Link href="/facility/asam/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New ASAM Assessment
            </Button>
          </Link>
        </div>
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
            <ASAMDraftsTable drafts={drafts} />
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
                  <TableCell>{formatTimestampDate(assessment.createdAt)}</TableCell>
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
