import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FolderOpen,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList,
} from "lucide-react";
import { formatDate, getExpirationStatus, getCurrentBiWeekInfo } from "@/lib/utils";

export default async function FacilityDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      facility: {
        include: {
          bhp: {
            include: {
              user: true,
            },
          },
          intakes: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          documents: true,
        },
      },
    },
  });

  if (!bhrfProfile) {
    // BHRF not yet assigned to a facility
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Facility Not Assigned</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Your account has not been assigned to a facility yet. Please contact
          your BHP administrator to complete your registration.
        </p>
      </div>
    );
  }

  const { facility } = bhrfProfile;

  // Calculate stats
  const pendingIntakes = facility.intakes.filter(
    (i) => i.status === "PENDING"
  ).length;
  const approvedIntakes = facility.intakes.filter(
    (i) => i.status === "APPROVED"
  ).length;
  const conditionalIntakes = facility.intakes.filter(
    (i) => i.status === "CONDITIONAL"
  ).length;
  const deniedIntakes = facility.intakes.filter(
    (i) => i.status === "DENIED"
  ).length;

  // Get document stats
  const requestedDocuments = facility.documents.filter(
    (d) => d.status === "REQUESTED"
  ).length;
  const expiringDocuments = facility.documents.filter((d) => {
    const status = getExpirationStatus(d.expiresAt);
    return status === "expiring" || status === "expired";
  }).length;

  // Get admin task compliance stats
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const month = now.getMonth();
  const currentQuarter = month < 3 ? "Q1" : month < 6 ? "Q2" : month < 9 ? "Q3" : "Q4";
  const inH1 = currentQuarter === "Q1" || currentQuarter === "Q2";

  // Fire drill check (monthly AM + PM)
  const fireDrillReports = await prisma.fireDrillReport.findMany({
    where: {
      facilityId: facility.id,
      reportMonth: currentMonth,
      reportYear: currentYear,
    },
  });
  const hasAMFireDrill = fireDrillReports.some((r) => r.shift === "AM");
  const hasPMFireDrill = fireDrillReports.some((r) => r.shift === "PM");
  const fireDrillsMissing = !hasAMFireDrill || !hasPMFireDrill;

  // Evacuation/Disaster drill check
  const evacuationDrillReports = await prisma.evacuationDrillReport.findMany({
    where: {
      facilityId: facility.id,
      year: currentYear,
    },
  });

  // Evacuation drills (every 6 months with AM/PM shifts)
  const hasEvacuationH1 =
    evacuationDrillReports.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "AM") &&
    evacuationDrillReports.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "PM");
  const hasEvacuationH2 =
    evacuationDrillReports.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "AM") &&
    evacuationDrillReports.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "PM");
  const evacuationMissing = (inH1 && !hasEvacuationH1) || (!inH1 && !hasEvacuationH2);

  // Disaster drills (quarterly with AM/PM shifts)
  const hasCurrentQuarterDisaster =
    evacuationDrillReports.some((r) => r.drillType === "DISASTER" && r.quarter === currentQuarter && r.shift === "AM") &&
    evacuationDrillReports.some((r) => r.drillType === "DISASTER" && r.quarter === currentQuarter && r.shift === "PM");
  const disasterMissing = !hasCurrentQuarterDisaster;

  // Oversight training check (bi-weekly)
  const { biWeek: currentBiWeek, year: biWeekYear } = getCurrentBiWeekInfo();
  const hasOversightTraining = await prisma.oversightTrainingReport.findFirst({
    where: {
      facilityId: facility.id,
      biWeek: currentBiWeek,
      year: biWeekYear,
    },
  });
  const oversightMissing = !hasOversightTraining;

  // Calculate total admin task issues
  const adminTaskIssues = [
    fireDrillsMissing,
    evacuationMissing,
    disasterMissing,
    oversightMissing,
  ].filter(Boolean).length;

  // Calculate compliance health (documents + admin tasks)
  const totalDocIssues = requestedDocuments + expiringDocuments;
  const totalIssues = totalDocIssues + adminTaskIssues;
  const complianceStatus =
    totalIssues === 0 ? "good" : totalIssues <= 2 ? "warning" : "danger";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{facility.name}</h1>
        <p className="text-muted-foreground">
          Managed by {facility.bhp.user.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Intakes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingIntakes}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting BHP review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedIntakes}</div>
            <p className="text-xs text-muted-foreground">
              Approved intakes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deniedIntakes}</div>
            <p className="text-xs text-muted-foreground">Denied intakes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Health
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  complianceStatus === "good"
                    ? "success"
                    : complianceStatus === "warning"
                    ? "warning"
                    : "danger"
                }
              >
                {complianceStatus === "good"
                  ? "Good"
                  : complianceStatus === "warning"
                  ? "Needs Attention"
                  : "Critical"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDocIssues > 0 && `${totalDocIssues} document issue(s)`}
              {totalDocIssues > 0 && adminTaskIssues > 0 && ", "}
              {adminTaskIssues > 0 && `${adminTaskIssues} admin task(s) pending`}
              {totalIssues === 0 && "All compliant"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tasks Alert */}
      {adminTaskIssues > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <ClipboardList className="h-5 w-5" />
              Admin Tasks Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {fireDrillsMissing && (
                <Link href="/facility/admin-tasks/fire-drills">
                  <div className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition-colors">
                    <p className="font-medium text-sm">Fire Drills</p>
                    <p className="text-xs text-muted-foreground">
                      {!hasAMFireDrill && !hasPMFireDrill ? "AM & PM" : !hasAMFireDrill ? "AM" : "PM"} shift missing
                    </p>
                  </div>
                </Link>
              )}
              {evacuationMissing && (
                <Link href="/facility/admin-tasks/evacuation-drills">
                  <div className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition-colors">
                    <p className="font-medium text-sm">Evacuation Drill</p>
                    <p className="text-xs text-muted-foreground">
                      {inH1 ? "H1" : "H2"} period incomplete
                    </p>
                  </div>
                </Link>
              )}
              {disasterMissing && (
                <Link href="/facility/admin-tasks/evacuation-drills">
                  <div className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition-colors">
                    <p className="font-medium text-sm">Disaster Drill</p>
                    <p className="text-xs text-muted-foreground">
                      {currentQuarter} incomplete
                    </p>
                  </div>
                </Link>
              )}
              {oversightMissing && (
                <Link href="/facility/admin-tasks/oversight-training">
                  <div className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition-colors">
                    <p className="font-medium text-sm">Oversight Training</p>
                    <p className="text-xs text-muted-foreground">
                      Bi-week {currentBiWeek} pending
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Intakes
              <Link href="/facility/intakes">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Your recent intake submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {facility.intakes.length > 0 ? (
              <div className="space-y-4">
                {facility.intakes.map((intake) => (
                  <div
                    key={intake.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{intake.residentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(intake.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        intake.status === "APPROVED"
                          ? "success"
                          : intake.status === "CONDITIONAL"
                          ? "warning"
                          : intake.status === "DENIED"
                          ? "danger"
                          : "secondary"
                      }
                    >
                      {intake.status === "CONDITIONAL" ? "Conditional" : intake.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No intakes submitted yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Document Requests
              <Link href="/facility/documents">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Documents requested by your BHP
            </CardDescription>
          </CardHeader>
          <CardContent>
            {facility.documents.filter((d) => d.status === "REQUESTED").length >
            0 ? (
              <div className="space-y-4">
                {facility.documents
                  .filter((d) => d.status === "REQUESTED")
                  .slice(0, 5)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type}
                        </p>
                      </div>
                      <Badge variant="warning">Requested</Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending document requests
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/facility/intakes/new">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Submit Intake
              </Button>
            </Link>
            <Link href="/facility/documents">
              <Button variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </Link>
            <Link href="/facility/messages">
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact BHP
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
