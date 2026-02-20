"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Download,
  Eye,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EvacuationDrillReport {
  id: string;
  drillType: "EVACUATION" | "DISASTER";
  drillDate: string;
  drillTime: string;
  dayOfWeek: string;
  shift: "AM" | "PM";
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  disasterDrillType: string | null;
  drillResult: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY";
  submittedAt: string;
  facility: {
    id: string;
    name: string;
  };
}

const QUARTER_LABELS: Record<string, string> = {
  Q1: "Q1 (Jan-Mar)",
  Q2: "Q2 (Apr-Jun)",
  Q3: "Q3 (Jul-Sep)",
  Q4: "Q4 (Oct-Dec)",
};

function getCurrentQuarter(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
}

export default function EvacuationDrillsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<EvacuationDrillReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedType, setSelectedType] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    fetchReports();
  }, [selectedYear, selectedType]);

  async function fetchReports() {
    try {
      setIsLoading(true);
      let url = `/api/evacuation-drill-reports?year=${selectedYear}`;
      if (selectedType !== "all") {
        url += `&drillType=${selectedType}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load evacuation drill reports",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/evacuation-drill-reports/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Drill report deleted successfully",
        });
        fetchReports();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete report");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete report",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleDownloadPdf(id: string) {
    try {
      const response = await fetch(`/api/evacuation-drill-reports/${id}/pdf`);
      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evacuation-drill-report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download PDF",
      });
    }
  }

  function getResultBadge(result: string) {
    switch (result) {
      case "SATISFACTORY":
        return <Badge className="bg-green-100 text-green-800">Satisfactory</Badge>;
      case "NEEDS_IMPROVEMENT":
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>;
      case "UNSATISFACTORY":
        return <Badge className="bg-red-100 text-red-800">Unsatisfactory</Badge>;
      default:
        return null;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  // Check which drills are missing for current year
  const currentQuarter = getCurrentQuarter();
  const currentYearNum = new Date().getFullYear();
  const currentYearReports = reports.filter((r) => r.year === currentYearNum);

  // Check evacuation drills (every 6 months = Q1/Q2 and Q3/Q4, with AM/PM shifts)
  const hasEvacuationH1AM = currentYearReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "AM"
  );
  const hasEvacuationH1PM = currentYearReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "PM"
  );
  const hasEvacuationH2AM = currentYearReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "AM"
  );
  const hasEvacuationH2PM = currentYearReports.some(
    (r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "PM"
  );

  const hasEvacuationH1 = hasEvacuationH1AM && hasEvacuationH1PM;
  const hasEvacuationH2 = hasEvacuationH2AM && hasEvacuationH2PM;

  // Check disaster drills (every quarter, with AM/PM shifts)
  type QuarterStatus = { am: boolean; pm: boolean };
  const disasterStatus: Record<string, QuarterStatus> = {
    Q1: {
      am: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q1" && r.shift === "AM"),
      pm: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q1" && r.shift === "PM"),
    },
    Q2: {
      am: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q2" && r.shift === "AM"),
      pm: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q2" && r.shift === "PM"),
    },
    Q3: {
      am: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q3" && r.shift === "AM"),
      pm: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q3" && r.shift === "PM"),
    },
    Q4: {
      am: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q4" && r.shift === "AM"),
      pm: currentYearReports.some((r) => r.drillType === "DISASTER" && r.quarter === "Q4" && r.shift === "PM"),
    },
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            Evacuation / Disaster Drills
          </h1>
          <p className="text-muted-foreground mt-2">
            Evacuation drills (every 6 months) and disaster drills (every 3 months)
          </p>
        </div>
        <Link href="/facility/admin-tasks/evacuation-drills/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Status Cards */}
      {selectedYear === currentYearNum.toString() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Evacuation Drills (Every 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-20">H1 (Q1-Q2):</span>
                <div className="flex gap-2">
                  <Badge variant={hasEvacuationH1AM ? "default" : "outline"} className={hasEvacuationH1AM ? "bg-green-600" : ""}>
                    AM {hasEvacuationH1AM ? "Done" : "Pending"}
                  </Badge>
                  <Badge variant={hasEvacuationH1PM ? "default" : "outline"} className={hasEvacuationH1PM ? "bg-green-600" : ""}>
                    PM {hasEvacuationH1PM ? "Done" : "Pending"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-20">H2 (Q3-Q4):</span>
                <div className="flex gap-2">
                  <Badge variant={hasEvacuationH2AM ? "default" : "outline"} className={hasEvacuationH2AM ? "bg-green-600" : ""}>
                    AM {hasEvacuationH2AM ? "Done" : "Pending"}
                  </Badge>
                  <Badge variant={hasEvacuationH2PM ? "default" : "outline"} className={hasEvacuationH2PM ? "bg-green-600" : ""}>
                    PM {hasEvacuationH2PM ? "Done" : "Pending"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Disaster Drills (Every Quarter)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                const status = disasterStatus[q];
                const complete = status.am && status.pm;
                return (
                  <div key={q} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-8">{q}:</span>
                    <div className="flex gap-2">
                      <Badge variant={status.am ? "default" : "outline"} className={status.am ? "bg-green-600" : ""}>
                        AM {status.am ? "Done" : "Pending"}
                      </Badge>
                      <Badge variant={status.pm ? "default" : "outline"} className={status.pm ? "bg-green-600" : ""}>
                        PM {status.pm ? "Done" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            View and manage evacuation and disaster drill reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-32">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Drill Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="EVACUATION">Evacuation</SelectItem>
                  <SelectItem value="DISASTER">Disaster</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No reports found</h3>
              <p className="text-muted-foreground mt-1">
                No drill reports have been submitted for {selectedYear}
              </p>
              <Link href="/facility/admin-tasks/evacuation-drills/new">
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
                  <TableHead>Type</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          report.drillType === "EVACUATION"
                            ? "border-blue-500 text-blue-700"
                            : "border-orange-500 text-orange-700"
                        }
                      >
                        {report.drillType === "EVACUATION" ? "Evacuation" : "Disaster"}
                        {report.disasterDrillType && ` (${report.disasterDrillType})`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {QUARTER_LABELS[report.quarter]} {report.year}
                    </TableCell>
                    <TableCell>{formatDate(report.drillDate)}</TableCell>
                    <TableCell>
                      {report.shift === "AM" ? "AM" : "PM"}
                    </TableCell>
                    <TableCell>{getResultBadge(report.drillResult)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/facility/admin-tasks/evacuation-drills/${report.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPdf(report.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Drill Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this drill report? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
