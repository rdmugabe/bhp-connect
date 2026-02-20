import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Flame, Download, Edit, CheckCircle2, XCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function ViewFireDrillReportPage({ params }: PageProps) {
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

  const report = await prisma.fireDrillReport.findUnique({
    where: { id },
    include: {
      facility: true,
    },
  });

  if (!report || report.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  const safetyChecklist = report.safetyChecklist as Record<string, boolean>;
  const residentsPresent = (report.residentsPresent || []) as { name: string; evacuated: boolean }[];
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

  const checklistItems = [
    { key: "fireAlarmFunctioned", label: "Fire alarm functioned properly" },
    { key: "allResidentsAccountedFor", label: "All residents accounted for" },
    { key: "staffFollowedProcedures", label: "Staff followed evacuation procedures" },
    { key: "exitRoutesClear", label: "Exit routes clear and accessible" },
    { key: "emergencyExitsOpenedProperly", label: "Emergency exits opened properly" },
    { key: "fireExtinguishersAccessible", label: "Fire extinguishers accessible" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/admin-tasks/fire-drills">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fire Drills
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/fire-drill-reports/${report.id}/pdf`} target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            Fire Drill Report
          </h1>
          <p className="text-muted-foreground mt-2">
            {MONTHS[report.reportMonth - 1]} {report.reportYear} - {report.shift} Shift
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
              <p className="text-sm text-muted-foreground">Drill Date</p>
              <p className="font-medium">{formatDate(report.drillDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drill Time</p>
              <p className="font-medium">{report.drillTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{report.location || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shift</p>
              <Badge variant="outline">{report.shift}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drill Type</p>
              <p className="font-medium capitalize">{report.drillType.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conducted By</p>
              <p className="font-medium">{report.conductedBy}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evacuation Times */}
      <Card>
        <CardHeader>
          <CardTitle>Evacuation Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Alarm Activated</p>
              <p className="font-medium">{report.alarmActivatedTime || "Not recorded"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Building Clear</p>
              <p className="font-medium">{report.buildingClearTime || "Not recorded"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Evacuation Time</p>
              <p className="font-medium">{report.totalEvacuationTime || "Not recorded"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Number Evacuated</p>
              <p className="font-medium">{report.numberEvacuated ?? "Not recorded"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklistItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  safetyChecklist[item.key]
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {safetyChecklist[item.key] ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={safetyChecklist[item.key] ? "text-green-800" : "text-red-800"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Residents Present */}
      {residentsPresent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Residents Present ({residentsPresent.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {residentsPresent.map((resident, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    resident.evacuated
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <span className="font-medium">{resident.name}</span>
                  <Badge
                    variant={resident.evacuated ? "default" : "destructive"}
                    className={resident.evacuated ? "bg-green-600" : ""}
                  >
                    {resident.evacuated ? "Evacuated" : "Not Evacuated"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observations & Corrective Actions */}
      {(report.observations || report.correctiveActions) && (
        <Card>
          <CardHeader>
            <CardTitle>Observations & Corrective Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.observations && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Observations</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{report.observations}</p>
                </div>
              </div>
            )}
            {report.correctiveActions && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Corrective Actions Needed</p>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="whitespace-pre-wrap">{report.correctiveActions}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Signatures */}
      {(signatures.staffSignature || signatures.supervisorSignature) && (
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {signatures.staffSignature && (
                <div className="border-b pb-4">
                  <p className="font-medium text-lg">{signatures.staffSignature}</p>
                  <p className="text-sm text-muted-foreground">Staff Member</p>
                  {signatures.staffSignatureDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(signatures.staffSignatureDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
              {signatures.supervisorSignature && (
                <div className="border-b pb-4">
                  <p className="font-medium text-lg">{signatures.supervisorSignature}</p>
                  <p className="text-sm text-muted-foreground">Supervisor</p>
                  {signatures.supervisorSignatureDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(signatures.supervisorSignatureDate).toLocaleDateString()}
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
