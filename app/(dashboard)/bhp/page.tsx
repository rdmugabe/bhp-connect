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
  Building2,
  FileText,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { formatDate, getExpirationStatus, getCurrentBiWeekInfo } from "@/lib/utils";

export default async function BHPDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      facilities: {
        include: {
          intakes: {
            where: { status: "PENDING" },
          },
          documents: true,
        },
      },
      credentials: true,
    },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  // Calculate stats
  const totalFacilities = bhpProfile.facilities.length;
  const pendingIntakes = bhpProfile.facilities.reduce(
    (acc, f) => acc + f.intakes.length,
    0
  );

  // Get expiring credentials
  const expiringCredentials = bhpProfile.credentials.filter((c) => {
    const status = getExpirationStatus(c.expiresAt);
    return status === "expiring" || status === "expired";
  });

  // Get out-of-compliance facilities (documents)
  const outOfComplianceFacilities = bhpProfile.facilities.filter((f) =>
    f.documents.some((d) => {
      const status = getExpirationStatus(d.expiresAt);
      return status === "expired" || d.status === "REQUESTED";
    })
  );

  // Get admin task compliance status for all facilities
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const month = now.getMonth();
  const currentQuarter = month < 3 ? "Q1" : month < 6 ? "Q2" : month < 9 ? "Q3" : "Q4";
  const inH1 = currentQuarter === "Q1" || currentQuarter === "Q2";
  const { biWeek: currentBiWeek, year: biWeekYear } = getCurrentBiWeekInfo();

  const facilityIds = bhpProfile.facilities.map((f) => f.id);

  // Get all fire drill reports for current month
  const allFireDrills = await prisma.fireDrillReport.findMany({
    where: {
      facilityId: { in: facilityIds },
      reportMonth: currentMonth,
      reportYear: currentYear,
    },
  });

  // Get all evacuation/disaster drill reports for current year
  const allEvacuationDrills = await prisma.evacuationDrillReport.findMany({
    where: {
      facilityId: { in: facilityIds },
      year: currentYear,
    },
  });

  // Get all oversight training reports for current bi-week
  const allOversightTraining = await prisma.oversightTrainingReport.findMany({
    where: {
      facilityId: { in: facilityIds },
      biWeek: currentBiWeek,
      year: biWeekYear,
    },
  });

  // Calculate facilities with missing admin tasks
  const facilitiesWithAdminTaskIssues = bhpProfile.facilities.filter((f) => {
    const facilityFireDrills = allFireDrills.filter((fd) => fd.facilityId === f.id);
    const hasAM = facilityFireDrills.some((fd) => fd.shift === "AM");
    const hasPM = facilityFireDrills.some((fd) => fd.shift === "PM");
    const fireDrillsMissing = !hasAM || !hasPM;

    const facilityEvacDrills = allEvacuationDrills.filter((ed) => ed.facilityId === f.id);
    const hasEvacH1 =
      facilityEvacDrills.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "AM") &&
      facilityEvacDrills.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "PM");
    const hasEvacH2 =
      facilityEvacDrills.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "AM") &&
      facilityEvacDrills.some((r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "PM");
    const evacuationMissing = (inH1 && !hasEvacH1) || (!inH1 && !hasEvacH2);

    const hasDisaster =
      facilityEvacDrills.some((r) => r.drillType === "DISASTER" && r.quarter === currentQuarter && r.shift === "AM") &&
      facilityEvacDrills.some((r) => r.drillType === "DISASTER" && r.quarter === currentQuarter && r.shift === "PM");
    const disasterMissing = !hasDisaster;

    const hasOversight = allOversightTraining.some((ot) => ot.facilityId === f.id);
    const oversightMissing = !hasOversight;

    return fireDrillsMissing || evacuationMissing || disasterMissing || oversightMissing;
  });

  // Combine document and admin task issues for total compliance count
  const allOutOfComplianceFacilities = Array.from(new Set([
    ...outOfComplianceFacilities.map((f) => f.id),
    ...facilitiesWithAdminTaskIssues.map((f) => f.id),
  ]));

  // Get recent intakes
  const recentIntakes = await prisma.intake.findMany({
    where: {
      facility: {
        bhpId: bhpProfile.id,
      },
      status: "PENDING",
    },
    include: {
      facility: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get pending facility applications
  const pendingApplications = await prisma.facilityApplication.count({
    where: {
      bhpId: bhpProfile.id,
      status: "PENDING",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Applications
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/bhp/applications" className="text-primary hover:underline">
                Review facility applications
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Facilities
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFacilities}</div>
            <p className="text-xs text-muted-foreground">
              Active facilities under your care
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Intakes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingIntakes}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Issues
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allOutOfComplianceFacilities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Facilities need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expiring Credentials
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringCredentials.length}</div>
            <p className="text-xs text-muted-foreground">
              Need renewal soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Intakes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Intakes
              <Link href="/bhp/intakes">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Intakes awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentIntakes.length > 0 ? (
              <div className="space-y-4">
                {recentIntakes.map((intake) => (
                  <div
                    key={intake.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{intake.residentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {intake.facility.name} -{" "}
                        {formatDate(intake.createdAt)}
                      </p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending intakes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Compliance Alerts
              <Link href="/bhp/facilities">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Facilities with compliance issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allOutOfComplianceFacilities.length > 0 ? (
              <div className="space-y-4">
                {bhpProfile.facilities
                  .filter((f) => allOutOfComplianceFacilities.includes(f.id))
                  .slice(0, 5)
                  .map((facility) => {
                    const docIssues = facility.documents.filter(
                      (d) =>
                        getExpirationStatus(d.expiresAt) === "expired" ||
                        d.status === "REQUESTED"
                    ).length;
                    const hasAdminTaskIssues = facilitiesWithAdminTaskIssues.some(
                      (f) => f.id === facility.id
                    );
                    return (
                      <div
                        key={facility.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{facility.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {docIssues > 0 && `${docIssues} document(s)`}
                            {docIssues > 0 && hasAdminTaskIssues && ", "}
                            {hasAdminTaskIssues && "admin tasks pending"}
                          </p>
                        </div>
                        <Badge variant="danger">Action Required</Badge>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All facilities are in compliance
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
            {pendingApplications > 0 && (
              <Link href="/bhp/applications">
                <Button variant="default" className="bg-yellow-600 hover:bg-yellow-700">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Review Applications ({pendingApplications})
                </Button>
              </Link>
            )}
            <Link href="/bhp/facilities/new">
              <Button>
                <Building2 className="mr-2 h-4 w-4" />
                Add Facility
              </Button>
            </Link>
            <Link href="/bhp/credentials">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Upload Credential
              </Button>
            </Link>
            <Link href="/bhp/messages">
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Messages
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
