"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { INCIDENT_TYPES } from "@/lib/validations";

interface IncidentReport {
  id: string;
  reportNumber: string | null;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentTypes: string[];
  status: "DRAFT" | "PENDING" | "APPROVED";
  residentName: string | null;
  intake: {
    residentName: string;
    dateOfBirth: string;
  } | null;
  createdAt: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>;
    case "PENDING":
      return <Badge variant="default">Pending</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-500">Approved</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getIncidentTypeLabel(code: string): string {
  const type = INCIDENT_TYPES.find((t) => t.code === code);
  return type?.label.split(" ")[0] || code;
}

function isSeriousIncident(types: string[]): boolean {
  return (
    types.includes("DEATH") ||
    types.includes("SUICIDE_ATTEMPT") ||
    types.includes("ABUSE_NEGLECT") ||
    types.includes("MEDICAL_EMERGENCY")
  );
}

export default function IncidentReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  async function fetchReports() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/incident-reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch incident reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadPDF(reportId: string) {
    setDownloadingId(reportId);
    try {
      const response = await fetch(`/api/incident-reports/${reportId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incident-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(reportId: string) {
    setDeletingId(reportId);
    try {
      const response = await fetch(`/api/incident-reports/${reportId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete report");
      }
      toast({
        title: "Report deleted",
        description: "The incident report has been deleted.",
      });
      fetchReports();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete report",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Incident Reports</h1>
          <p className="text-muted-foreground">
            Document and track facility incidents
          </p>
        </div>
        <Button asChild>
          <Link href="/facility/incident-reports/new">
            <Plus className="h-4 w-4 mr-2" />
            New Incident Report
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Incident Reports</CardTitle>
              <CardDescription>
                {reports.length} total reports
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No incident reports</h3>
              <p className="text-muted-foreground mb-4">
                Create your first incident report to get started.
              </p>
              <Button asChild>
                <Link href="/facility/incident-reports/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Incident Report
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isSeriousIncident(report.incidentTypes) && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        {report.reportNumber || report.id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.incidentDate), "MMM d, yyyy")}
                      <div className="text-xs text-muted-foreground">
                        {report.incidentTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.intake?.residentName || report.residentName || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {report.incidentTypes.slice(0, 2).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {getIncidentTypeLabel(type)}
                          </Badge>
                        ))}
                        {report.incidentTypes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{report.incidentTypes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/facility/incident-reports/${report.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/facility/incident-reports/${report.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {report.status !== "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(report.id)}
                            disabled={downloadingId === report.id}
                          >
                            {downloadingId === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {report.status === "DRAFT" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deletingId === report.id}
                              >
                                {deletingId === report.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this draft incident report?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(report.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
