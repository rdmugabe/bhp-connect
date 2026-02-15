import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
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
import { ArrowLeft, FileText, Activity, Download, Eye, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>;
    case "PENDING":
      return <Badge variant="outline">Pending</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-500">Approved</Badge>;
    case "CONDITIONAL":
      return <Badge className="bg-yellow-500">Conditional</Badge>;
    case "DENIED":
      return <Badge variant="destructive">Denied</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default async function BHPResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const { id } = await params;

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  // Fetch the resident (intake) with all related documents
  const resident = await prisma.intake.findUnique({
    where: { id },
    include: {
      asamAssessments: {
        orderBy: { createdAt: "desc" },
      },
      facility: {
        select: {
          id: true,
          name: true,
          bhpId: true,
        },
      },
    },
  });

  if (!resident || resident.facility.bhpId !== bhpProfile.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bhp/residents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {resident.residentName}
          </h1>
          <p className="text-muted-foreground">
            {resident.facility.name} | DOB: {formatDate(resident.dateOfBirth)} | Admitted: {formatDate(resident.createdAt)}
          </p>
        </div>
      </div>

      {/* Resident Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{resident.residentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(resident.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SSN (Last 4)</p>
              <p className="font-medium">{resident.ssn || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sex</p>
              <p className="font-medium">{resident.sex || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Insurance</p>
              <p className="font-medium">{resident.insuranceProvider || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Policy Number</p>
              <p className="font-medium">{resident.policyNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{resident.patientPhone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Facility</p>
              <p className="font-medium">{resident.facility.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intake Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Intake Assessment
          </CardTitle>
          <CardDescription>
            Initial intake assessment for this resident
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  Full Intake Assessment
                </TableCell>
                <TableCell>{getStatusBadge(resident.status)}</TableCell>
                <TableCell>{formatDate(resident.createdAt)}</TableCell>
                <TableCell>{formatDate(resident.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/bhp/intakes/${resident.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/bhp/intakes/${resident.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/api/intakes/${resident.id}/pdf`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ASAM Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            ASAM Assessments
            {resident.asamAssessments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {resident.asamAssessments.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Substance abuse assessments for this resident
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Level of Care</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resident.asamAssessments.map((asam) => (
                <TableRow key={asam.id}>
                  <TableCell className="font-medium">
                    ASAM Assessment
                  </TableCell>
                  <TableCell>{getStatusBadge(asam.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {asam.recommendedLevelOfCare || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(asam.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/bhp/asam/${asam.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/bhp/asam/${asam.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/api/asam/${asam.id}/pdf`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {resident.asamAssessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No ASAM assessments for this resident.
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
