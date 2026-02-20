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
import { ArrowLeft, Users, Download, CheckCircle2, XCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const QUARTER_LABELS: Record<string, string> = {
  Q1: "Q1 (Jan, Feb, Mar)",
  Q2: "Q2 (Apr, May, Jun)",
  Q3: "Q3 (Jul, Aug, Sep)",
  Q4: "Q4 (Oct, Nov, Dec)",
};

export default async function ViewEvacuationDrillReportPage({ params }: PageProps) {
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

  const report = await prisma.evacuationDrillReport.findUnique({
    where: { id },
    include: {
      facility: true,
    },
  });

  if (!report || report.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  const staffInvolved = (report.staffInvolved || []) as { name: string }[];
  const residentsInvolved = (report.residentsInvolved || []) as { name: string; assistanceRequired?: string }[];
  const signatures = (report.signatures || {}) as Record<string, string>;

  function formatDate(date: Date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  function formatDuration(minutes: number | null): string {
    if (!minutes) return "N/A";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
    if (hrs > 0) return `${hrs} hr`;
    return `${mins} min`;
  }

  function getResultBadge(result: string) {
    switch (result) {
      case "SATISFACTORY":
        return <Badge className="bg-green-100 text-green-800 text-lg px-4 py-1">Satisfactory</Badge>;
      case "NEEDS_IMPROVEMENT":
        return <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-1">Needs Improvement</Badge>;
      case "UNSATISFACTORY":
        return <Badge className="bg-red-100 text-red-800 text-lg px-4 py-1">Unsatisfactory</Badge>;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/admin-tasks/evacuation-drills">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Drills
            </Button>
          </Link>
        </div>
        <Link href={`/api/evacuation-drill-reports/${report.id}/pdf`} target="_blank">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            {report.drillType === "EVACUATION" ? "Evacuation" : "Disaster"} Drill Report
          </h1>
          <p className="text-muted-foreground mt-2">
            {QUARTER_LABELS[report.quarter]} {report.year}
            {report.drillType === "DISASTER" && report.disasterDrillType && (
              <span> - {report.disasterDrillType}</span>
            )}
          </p>
        </div>
        <div>{getResultBadge(report.drillResult)}</div>
      </div>

      {/* Drill Information */}
      <Card>
        <CardHeader>
          <CardTitle>Drill Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Drill Type</p>
              <Badge
                variant="outline"
                className={
                  report.drillType === "EVACUATION"
                    ? "border-blue-500 text-blue-700 mt-1"
                    : "border-orange-500 text-orange-700 mt-1"
                }
              >
                {report.drillType === "EVACUATION" ? "Evacuation Drill" : "Disaster Drill"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(report.drillDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">{report.drillTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Day of Week</p>
              <p className="font-medium">{report.dayOfWeek}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Length</p>
              <p className="font-medium">{formatDuration(report.totalLengthMinutes)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shift</p>
              <p className="font-medium">
                {report.shift === "AM" ? "AM (7:00AM - 7:00PM)" : "PM (7:00PM - 7:00AM)"}
              </p>
            </div>
            {report.drillType === "DISASTER" && report.disasterDrillType && (
              <div>
                <p className="text-sm text-muted-foreground">Disaster Type</p>
                <p className="font-medium">{report.disasterDrillType}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staff Involved */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Involved ({staffInvolved.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {staffInvolved.map((staff, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border bg-muted/30"
              >
                <span className="text-sm text-muted-foreground mr-2">{idx + 1}.</span>
                <span className="font-medium">{staff.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Residents Involved - Only for Evacuation Drills */}
      {report.drillType === "EVACUATION" && residentsInvolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clients/Residents Involved ({residentsInvolved.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {residentsInvolved.map((resident, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border bg-muted/30 flex justify-between items-start"
                >
                  <div>
                    <span className="text-sm text-muted-foreground mr-2">{idx + 1}.</span>
                    <span className="font-medium">{resident.name}</span>
                  </div>
                  {resident.assistanceRequired && (
                    <Badge variant="outline" className="text-xs">
                      {resident.assistanceRequired}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evacuation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Evacuation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Exit Blocked (Scenario)</p>
                <p className="font-medium">{report.exitBlocked || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exit Used</p>
                <p className="font-medium">{report.exitUsed || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assembly Point</p>
                <p className="font-medium">{report.assemblyPoint || "N/A"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  report.correctLocation
                    ? "bg-green-50 border-green-200"
                    : "bg-muted/30"
                }`}
              >
                {report.correctLocation ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span>Correct Location</span>
              </div>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  report.allAccountedFor
                    ? "bg-green-50 border-green-200"
                    : "bg-muted/30"
                }`}
              >
                {report.allAccountedFor ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span>All Accounted For</span>
              </div>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  report.issuesIdentified
                    ? "bg-amber-50 border-amber-200"
                    : "bg-muted/30"
                }`}
              >
                {report.issuesIdentified ? (
                  <CheckCircle2 className="h-5 w-5 text-amber-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span>Issues Identified</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      {report.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observations / Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{report.observations}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signatures */}
      {(signatures.conductedBy || signatures.supervisor) && (
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {signatures.conductedBy && (
                <div className="border-b pb-4">
                  <p className="font-medium text-lg">{signatures.conductedBy}</p>
                  <p className="text-sm text-muted-foreground">Conducted By</p>
                  {signatures.conductedByDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(signatures.conductedByDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
              {signatures.supervisor && (
                <div className="border-b pb-4">
                  <p className="font-medium text-lg">{signatures.supervisor}</p>
                  <p className="text-sm text-muted-foreground">Administrator/Supervisor</p>
                  {signatures.supervisorDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(signatures.supervisorDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
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
              Submitted: {new Date(report.submittedAt).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
