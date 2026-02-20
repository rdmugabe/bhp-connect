import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, ClipboardCheck, Users, FileText, Trash2 } from "lucide-react";
import { formatBiWeekLabel } from "@/lib/utils";
import { DeleteReportButton } from "./delete-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewOversightTrainingReportPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/");
  }

  const { id } = await params;

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhrfProfile) {
    redirect("/");
  }

  const report = await prisma.oversightTrainingReport.findUnique({
    where: { id },
    include: {
      facility: true,
    },
  });

  if (!report || report.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  const staffParticipants = report.staffParticipants as { name: string; position?: string }[];

  function formatDate(date: Date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/admin-tasks/oversight-training">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Oversight Training
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/api/oversight-training-reports/${report.id}/download`}
            target="_blank"
          >
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          </Link>
          <DeleteReportButton reportId={report.id} />
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-purple-500" />
            Oversight Training Report
          </h1>
          <p className="text-muted-foreground mt-2">
            Bi-Week {report.biWeek}, {report.year} - {formatBiWeekLabel(report.biWeek, report.year)}
          </p>
        </div>
        <Badge className="text-lg px-4 py-1 bg-purple-100 text-purple-800">
          Week {report.biWeek}
        </Badge>
      </div>

      {/* Training Information */}
      <Card>
        <CardHeader>
          <CardTitle>Training Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Training Date</p>
              <p className="font-medium">{formatDate(report.trainingDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conducted By</p>
              <p className="font-medium">{report.conductedBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Facility</p>
              <p className="font-medium">{report.facility.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Participants ({staffParticipants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffParticipants.map((participant, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
              >
                <div>
                  <p className="font-medium">{participant.name}</p>
                  {participant.position && (
                    <p className="text-sm text-muted-foreground">
                      {participant.position}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-medium">{report.documentName}</p>
                <p className="text-sm text-muted-foreground">
                  Uploaded on {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Link
              href={`/api/oversight-training-reports/${report.id}/download`}
              target="_blank"
            >
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{report.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Report ID: {report.id}</span>
            <span>
              Submitted: {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
