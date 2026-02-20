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
import { Flame, Users, AlertTriangle } from "lucide-react";

export default async function AdminTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/");
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      facility: true,
    },
  });

  if (!bhrfProfile) {
    redirect("/");
  }

  // Get current month's fire drill reports
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fireDrillReports = await prisma.fireDrillReport.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      reportMonth: currentMonth,
      reportYear: currentYear,
    },
  });

  const hasAMReport = fireDrillReports.some((r) => r.shift === "AM");
  const hasPMReport = fireDrillReports.some((r) => r.shift === "PM");
  const missingReports = !hasAMReport || !hasPMReport;

  // Get total reports this year
  const yearlyReports = await prisma.fireDrillReport.count({
    where: {
      facilityId: bhrfProfile.facilityId,
      reportYear: currentYear,
    },
  });

  // Get evacuation/disaster drill reports for the current year
  const evacuationDrillReports = await prisma.evacuationDrillReport.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      year: currentYear,
    },
  });

  // Calculate current quarter
  const month = now.getMonth();
  const currentQuarter = month < 3 ? "Q1" : month < 6 ? "Q2" : month < 9 ? "Q3" : "Q4";

  // Check evacuation drills (every 6 months = H1 and H2, with AM and PM shifts)
  const hasEvacuationH1AM = evacuationDrillReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "AM"
  );
  const hasEvacuationH1PM = evacuationDrillReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "PM"
  );
  const hasEvacuationH2AM = evacuationDrillReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "AM"
  );
  const hasEvacuationH2PM = evacuationDrillReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "PM"
  );

  const hasEvacuationH1 = hasEvacuationH1AM && hasEvacuationH1PM;
  const hasEvacuationH2 = hasEvacuationH2AM && hasEvacuationH2PM;

  // Check disaster drills (every quarter, with AM and PM shifts)
  const allQuarters = ["Q1", "Q2", "Q3", "Q4"] as const;
  const disasterDrillStatus: Record<string, { am: boolean; pm: boolean }> = {};
  allQuarters.forEach((q) => {
    disasterDrillStatus[q] = {
      am: evacuationDrillReports.some((r) => r.drillType === "DISASTER" && r.quarter === q && r.shift === "AM"),
      pm: evacuationDrillReports.some((r) => r.drillType === "DISASTER" && r.quarter === q && r.shift === "PM"),
    };
  });

  const disasterQuartersComplete = allQuarters.filter(
    (q) => disasterDrillStatus[q].am && disasterDrillStatus[q].pm
  ).length;

  // Determine if evacuation drills are needed based on current period
  const inH1 = currentQuarter === "Q1" || currentQuarter === "Q2";
  const inH2 = currentQuarter === "Q3" || currentQuarter === "Q4";
  const evacuationDrillMissing = (inH1 && !hasEvacuationH1) || (inH2 && !hasEvacuationH2);

  // Determine if current quarter disaster drill is missing (both AM and PM needed)
  const currentQuarterDisasterMissing = !disasterDrillStatus[currentQuarter]?.am || !disasterDrillStatus[currentQuarter]?.pm;

  const evacuationDrillsNeedAttention = evacuationDrillMissing || currentQuarterDisasterMissing;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Manage administrative tasks and compliance reports for {bhrfProfile.facility.name}
        </p>
      </div>

      {(missingReports || evacuationDrillsNeedAttention) && (
        <div className="space-y-3">
          {missingReports && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">
                  Fire Drill Reports Missing for {monthNames[currentMonth - 1]}
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  {!hasAMReport && !hasPMReport
                    ? "Both AM and PM shift reports are required."
                    : !hasAMReport
                    ? "AM shift report is required."
                    : "PM shift report is required."}
                </p>
              </div>
            </div>
          )}
          {evacuationDrillsNeedAttention && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">
                  Evacuation/Disaster Drills Need Attention
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {evacuationDrillMissing && currentQuarterDisasterMissing
                    ? `Evacuation drill shifts for ${inH1 ? "H1" : "H2"} and ${currentQuarter} disaster drill shifts are pending.`
                    : evacuationDrillMissing
                    ? `Evacuation drill shifts for ${inH1 ? "H1 (Q1-Q2)" : "H2 (Q3-Q4)"} are pending (${inH1 ? (!hasEvacuationH1AM && !hasEvacuationH1PM ? "AM & PM" : !hasEvacuationH1AM ? "AM" : "PM") : (!hasEvacuationH2AM && !hasEvacuationH2PM ? "AM & PM" : !hasEvacuationH2AM ? "AM" : "PM")}).`
                    : `${currentQuarter} disaster drill shifts are pending (${!disasterDrillStatus[currentQuarter]?.am && !disasterDrillStatus[currentQuarter]?.pm ? "AM & PM" : !disasterDrillStatus[currentQuarter]?.am ? "AM" : "PM"}).`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/facility/admin-tasks/fire-drills">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Flame className="h-6 w-6 text-orange-600" />
                </div>
                {missingReports && (
                  <Badge variant="destructive">Action Required</Badge>
                )}
              </div>
              <CardTitle className="mt-4">Fire Drill Reports</CardTitle>
              <CardDescription>
                Monthly fire drill safety reports for AM and PM shifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This month:</span>
                  <span className="font-medium">
                    {fireDrillReports.length} of 2 completed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This year:</span>
                  <span className="font-medium">{yearlyReports} reports</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant={hasAMReport ? "default" : "outline"}>
                    AM {hasAMReport ? "Done" : "Pending"}
                  </Badge>
                  <Badge variant={hasPMReport ? "default" : "outline"}>
                    PM {hasPMReport ? "Done" : "Pending"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/facility/admin-tasks/evacuation-drills">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                {evacuationDrillsNeedAttention && (
                  <Badge variant="destructive">Action Required</Badge>
                )}
              </div>
              <CardTitle className="mt-4">Evacuation / Disaster Drills</CardTitle>
              <CardDescription>
                Evacuation drills (every 6 months) and disaster drills (every quarter)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Evacuation (H1):</span>
                  <span className="font-medium">
                    {(hasEvacuationH1AM ? 1 : 0) + (hasEvacuationH1PM ? 1 : 0)} of 2 shifts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Evacuation (H2):</span>
                  <span className="font-medium">
                    {(hasEvacuationH2AM ? 1 : 0) + (hasEvacuationH2PM ? 1 : 0)} of 2 shifts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disaster Drills:</span>
                  <span className="font-medium">
                    {disasterQuartersComplete} of 4 quarters
                  </span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge variant={hasEvacuationH1 ? "default" : "outline"} className="text-xs">
                    H1 {hasEvacuationH1 ? "Done" : `${hasEvacuationH1AM ? "PM" : hasEvacuationH1PM ? "AM" : "AM/PM"}`}
                  </Badge>
                  <Badge variant={hasEvacuationH2 ? "default" : "outline"} className="text-xs">
                    H2 {hasEvacuationH2 ? "Done" : `${hasEvacuationH2AM ? "PM" : hasEvacuationH2PM ? "AM" : "AM/PM"}`}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
