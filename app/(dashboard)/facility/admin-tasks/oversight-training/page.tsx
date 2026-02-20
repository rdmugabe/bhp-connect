import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, FileText, CheckCircle2, AlertCircle, ClipboardCheck } from "lucide-react";
import { formatBiWeekLabel, getCurrentBiWeekInfo, getBiWeekDateRange } from "@/lib/utils";

export default async function OversightTrainingPage() {
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

  const { biWeek: currentBiWeek, year: currentYear } = getCurrentBiWeekInfo();

  // Get all reports for the current year
  const reports = await prisma.oversightTrainingReport.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      year: currentYear,
    },
    orderBy: [{ biWeek: "desc" }],
  });

  // Check if current bi-week has a report
  const hasCurrentBiWeekReport = reports.some(
    (r) => r.biWeek === currentBiWeek && r.year === currentYear
  );

  // Calculate completion rate for the year (up to current bi-week)
  const completedBiWeeks = reports.length;
  const completionRate = Math.round((completedBiWeeks / currentBiWeek) * 100);

  // Get date range for current bi-week
  const currentBiWeekRange = getBiWeekDateRange(currentBiWeek, currentYear);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/admin-tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Tasks
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-purple-500" />
            Oversight Training Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            Bi-weekly oversight training documentation for {bhrfProfile.facility.name}
          </p>
        </div>
        <Link href="/facility/admin-tasks/oversight-training/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Current Bi-Week Status Card */}
      <Card className={hasCurrentBiWeekReport ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {hasCurrentBiWeekReport ? (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              ) : (
                <AlertCircle className="h-10 w-10 text-amber-600" />
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  Bi-Week {currentBiWeek} ({currentYear})
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatBiWeekLabel(currentBiWeek, currentYear)}
                </p>
              </div>
            </div>
            <div className="text-right">
              {hasCurrentBiWeekReport ? (
                <Badge className="bg-green-600">Completed</Badge>
              ) : (
                <Badge variant="outline" className="border-amber-600 text-amber-600">
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedBiWeeks}</div>
            <p className="text-xs text-muted-foreground">
              of {currentBiWeek} bi-weeks so far
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Year to date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Bi-Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Week {currentBiWeek}</div>
            <p className="text-xs text-muted-foreground">
              of 26 bi-weeks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Reports</CardTitle>
          <CardDescription>
            All oversight training reports for {currentYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No reports yet</h3>
              <p className="text-muted-foreground mt-2">
                Submit your first oversight training report to get started.
              </p>
              <Link href="/facility/admin-tasks/oversight-training/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Report
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bi-Week</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Training Date</TableHead>
                  <TableHead>Conducted By</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const staffParticipants = report.staffParticipants as { name: string; position?: string }[];
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge variant="outline">Week {report.biWeek}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatBiWeekLabel(report.biWeek, report.year)}
                      </TableCell>
                      <TableCell>
                        {new Date(report.trainingDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </TableCell>
                      <TableCell>{report.conductedBy}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {staffParticipants.length} staff
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/facility/admin-tasks/oversight-training/${report.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
