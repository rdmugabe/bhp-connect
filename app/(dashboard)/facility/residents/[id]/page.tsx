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
import { ArrowLeft, FileText, Activity, Download, Eye, Edit, Plus, ClipboardList, LogOut } from "lucide-react";
import { ARTMeetingBadge } from "@/components/art-meetings/art-meeting-badge";
import { formatDate } from "@/lib/utils";

export default async function FacilityResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const { id } = await params;

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhrfProfile) {
    redirect("/login");
  }

  // Fetch the resident (intake) with all related documents
  const resident = await prisma.intake.findUnique({
    where: { id },
    include: {
      asamAssessments: {
        orderBy: { createdAt: "desc" },
      },
      artMeetings: {
        orderBy: [
          { meetingYear: "desc" },
          { meetingMonth: "desc" },
        ],
        take: 3, // Show only last 3 meetings
      },
      dischargeSummary: true,
      facility: {
        select: {
          name: true,
        },
      },
    },
  });

  // Check if current month needs an ART meeting
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const hasCurrentMonthART = resident?.artMeetings.some(
    (m) => m.meetingMonth === currentMonth && m.meetingYear === currentYear && (m.status === "APPROVED" || m.isSkipped)
  );

  if (!resident || resident.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  // Check if there's already an ASAM assessment for this intake
  const hasAsam = resident.asamAssessments.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/residents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {resident.residentName}
            </h1>
            <p className="text-muted-foreground">
              DOB: {formatDate(resident.dateOfBirth)} | Admitted: {formatDate(resident.createdAt)}
            </p>
          </div>
        </div>
        {!hasAsam && (
          <Link href={`/facility/asam/new?intakeId=${resident.id}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New ASAM Assessment
            </Button>
          </Link>
        )}
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
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{resident.patientEmail || "N/A"}</p>
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
                <TableCell>{formatDate(resident.createdAt)}</TableCell>
                <TableCell>{formatDate(resident.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/facility/intakes/${resident.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/facility/intakes/${resident.id}/edit`}>
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
                  <TableCell>
                    <Badge variant="outline">
                      {asam.recommendedLevelOfCare || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(asam.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/facility/asam/${asam.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/facility/asam/${asam.id}/edit`}>
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No ASAM assessments yet.{" "}
                    <Link href={`/facility/asam/new?intakeId=${resident.id}`} className="text-primary hover:underline">
                      Create one
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ART Meetings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                ART Meetings
                {resident.artMeetings.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {resident.artMeetings.length}
                  </Badge>
                )}
                {!hasCurrentMonthART && resident.status === "APPROVED" && (
                  <Badge variant="destructive" className="ml-2">
                    Due
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Monthly Assessment and Recovery Team meetings
              </CardDescription>
            </div>
            <Link href={`/facility/residents/${resident.id}/art-meetings`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month/Year</TableHead>
                <TableHead>Meeting Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resident.artMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][meeting.meetingMonth - 1]} {meeting.meetingYear}
                  </TableCell>
                  <TableCell>
                    {meeting.meetingDate
                      ? formatDate(meeting.meetingDate)
                      : meeting.isSkipped
                      ? "Skipped"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <ARTMeetingBadge status={meeting.status} isSkipped={meeting.isSkipped} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/facility/residents/${resident.id}/art-meetings/${meeting.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {resident.artMeetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No ART meetings yet.{" "}
                    {resident.status === "APPROVED" && (
                      <Link href={`/facility/residents/${resident.id}/art-meetings/new`} className="text-primary hover:underline">
                        Create one
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discharge Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Discharge Summary
            {resident.dischargeSummary && (
              <Badge
                variant={
                  resident.dischargeSummary.status === "APPROVED"
                    ? "default"
                    : resident.dischargeSummary.status === "PENDING"
                    ? "secondary"
                    : "outline"
                }
                className="ml-2"
              >
                {resident.dischargeSummary.status}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Discharge documentation for this resident
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Discharge Date</TableHead>
                <TableHead>Discharge Type</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resident.dischargeSummary ? (
                <TableRow>
                  <TableCell className="font-medium">
                    Discharge Summary
                  </TableCell>
                  <TableCell>
                    {formatDate(resident.dischargeSummary.dischargeDate)}
                  </TableCell>
                  <TableCell>
                    {resident.dischargeSummary.dischargeType || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/facility/residents/${resident.id}/discharge-summary`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/facility/residents/${resident.id}/discharge-summary?edit=true`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/api/discharge-summaries/${resident.dischargeSummary.id}/pdf`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No discharge summary yet.{" "}
                    {resident.status === "APPROVED" ? (
                      <Link href={`/facility/residents/${resident.id}/discharge-summary`} className="text-primary hover:underline">
                        Create one
                      </Link>
                    ) : (
                      "Resident must be approved first."
                    )}
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
