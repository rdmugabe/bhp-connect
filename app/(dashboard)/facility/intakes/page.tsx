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

export default async function FacilityIntakesPage() {
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

  // Fetch drafts and submitted intakes separately
  const [drafts, submittedIntakes] = await Promise.all([
    prisma.intake.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
        status: "DRAFT",
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.intake.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
        status: { not: "DRAFT" },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intakes</h1>
          <p className="text-muted-foreground">
            Manage intake assessments for your facility
          </p>
        </div>
        <Link href="/facility/intakes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Intake
          </Button>
        </Link>
      </div>

      {/* Draft Intakes Section */}
      {drafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Draft Intakes
              <Badge variant="secondary" className="ml-2">
                {drafts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((intake) => (
                  <TableRow key={intake.id}>
                    <TableCell className="font-medium">
                      {intake.residentName === "Draft Intake"
                        ? "New Draft"
                        : intake.residentName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Step {intake.draftStep || 1} of 17
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(intake.updatedAt)}</TableCell>
                    <TableCell>
                      <Link href={`/facility/intakes/${intake.id}/edit`}>
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

      {/* Submitted Intakes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submitted Intakes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittedIntakes.map((intake) => (
                <TableRow key={intake.id}>
                  <TableCell className="font-medium">
                    {intake.residentName}
                  </TableCell>
                  <TableCell>{formatDate(intake.dateOfBirth)}</TableCell>
                  <TableCell>{formatDate(intake.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/facility/intakes/${intake.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/facility/intakes/${intake.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {submittedIntakes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No submitted intakes found
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
