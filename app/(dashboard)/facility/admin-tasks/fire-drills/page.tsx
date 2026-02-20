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
  Flame,
  ArrowLeft,
  Loader2,
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

interface FireDrillReport {
  id: string;
  reportMonth: number;
  reportYear: number;
  drillDate: string;
  drillTime: string;
  shift: "AM" | "PM";
  drillType: "ANNOUNCED" | "UNANNOUNCED";
  conductedBy: string;
  drillResult: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY";
  submittedAt: string;
  facility: {
    id: string;
    name: string;
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FireDrillsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<FireDrillReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    fetchReports();
  }, [selectedYear]);

  async function fetchReports() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/fire-drill-reports?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load fire drill reports",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/fire-drill-reports/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Fire drill report deleted successfully",
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
      const response = await fetch(`/api/fire-drill-reports/${id}/pdf`);
      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fire-drill-report-${id}.pdf`;
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

  // Check which reports are missing for current month
  const currentMonth = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();
  const currentMonthReports = reports.filter(
    (r) => r.reportMonth === currentMonth && r.reportYear === currentYearNum
  );
  const hasAM = currentMonthReports.some((r) => r.shift === "AM");
  const hasPM = currentMonthReports.some((r) => r.shift === "PM");

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
            <Flame className="h-8 w-8 text-orange-500" />
            Fire Drill Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            Monthly fire drill safety reports for AM and PM shifts
          </p>
        </div>
        <Link href="/facility/admin-tasks/fire-drills/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Current Month Status */}
      {selectedYear === currentYearNum.toString() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {MONTHS[currentMonth - 1]} {currentYearNum} Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    hasAM ? "bg-green-500" : "bg-amber-500"
                  }`}
                />
                <span className="text-sm">
                  AM Shift: {hasAM ? "Completed" : "Pending"}
                </span>
                {!hasAM && (
                  <Link href="/facility/admin-tasks/fire-drills/new?shift=AM">
                    <Button size="sm" variant="outline">
                      Submit
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    hasPM ? "bg-green-500" : "bg-amber-500"
                  }`}
                />
                <span className="text-sm">
                  PM Shift: {hasPM ? "Completed" : "Pending"}
                </span>
                {!hasPM && (
                  <Link href="/facility/admin-tasks/fire-drills/new?shift=PM">
                    <Button size="sm" variant="outline">
                      Submit
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            View and manage fire drill reports by year
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
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No reports found</h3>
              <p className="text-muted-foreground mt-1">
                No fire drill reports have been submitted for {selectedYear}
              </p>
              <Link href="/facility/admin-tasks/fire-drills/new">
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
                  <TableHead>Month</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Drill Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Conducted By</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {MONTHS[report.reportMonth - 1]} {report.reportYear}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.shift}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(report.drillDate)}</TableCell>
                    <TableCell className="capitalize">
                      {report.drillType.toLowerCase()}
                    </TableCell>
                    <TableCell>{report.conductedBy}</TableCell>
                    <TableCell>{getResultBadge(report.drillResult)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/facility/admin-tasks/fire-drills/${report.id}`}
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
            <AlertDialogTitle>Delete Fire Drill Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fire drill report? This action
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
