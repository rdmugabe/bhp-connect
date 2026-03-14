"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/components/ui/use-toast";
import { ALERT_SEVERITY_COLORS } from "@/lib/emar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Bell,
  AlertCircle,
  Info,
  Clock,
} from "lucide-react";
import { PRNFollowupDialog } from "@/components/emar/prn-followup-dialog";

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  triggeredAt: string;
  intakeId?: string;
  intake?: {
    residentName: string;
  };
  medicationOrderId?: string;
  medicationOrder?: {
    medicationName: string;
    strength: string;
    dose: string;
    intake: {
      residentName: string;
    };
  };
  // For PRN follow-up alerts, we need the administration ID
  relatedAdministrationId?: string;
}

interface PRNAdministration {
  id: string;
  administeredAt: string;
  prnReasonGiven?: string;
  medicationOrder: {
    medicationName: string;
    strength: string;
    dose: string;
    intake: {
      residentName: string;
    };
  };
}

interface AlertCounts {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

export default function AlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [counts, setCounts] = useState<AlertCounts>({
    critical: 0,
    warning: 0,
    info: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [prnFollowupDialogOpen, setPrnFollowupDialogOpen] = useState(false);
  const [selectedPRNAdmin, setSelectedPRNAdmin] = useState<PRNAdministration | null>(null);
  const [loadingPRNAdmin, setLoadingPRNAdmin] = useState(false);

  const fetchAlerts = async (refresh = false) => {
    try {
      const params = new URLSearchParams();
      if (refresh) params.set("refresh", "true");
      if (severityFilter !== "ALL") params.set("severity", severityFilter);

      const response = await fetch(`/api/emar/alerts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setCounts(data.counts || { critical: 0, warning: 0, info: 0, total: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAlerts(true);
  }, [severityFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts(true);
  };

  const handlePRNFollowup = async (alert: Alert) => {
    if (!alert.medicationOrderId) {
      // If no medication order, just acknowledge the alert
      setSelectedAlert(alert);
      setAcknowledgeDialogOpen(true);
      return;
    }

    setLoadingPRNAdmin(true);
    try {
      // Find the PRN administration that needs follow-up for this medication order
      const response = await fetch(
        `/api/emar/administrations?medicationOrderId=${alert.medicationOrderId}&needsPRNFollowup=true`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.administrations && data.administrations.length > 0) {
          setSelectedPRNAdmin(data.administrations[0]);
          setPrnFollowupDialogOpen(true);
        } else {
          // No pending follow-up found, just acknowledge
          setSelectedAlert(alert);
          setAcknowledgeDialogOpen(true);
        }
      } else {
        // If fetch fails, fall back to regular acknowledge
        setSelectedAlert(alert);
        setAcknowledgeDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching PRN administration:", error);
      setSelectedAlert(alert);
      setAcknowledgeDialogOpen(true);
    } finally {
      setLoadingPRNAdmin(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;

    setAcknowledging(true);
    try {
      const response = await fetch(`/api/emar/alerts/${selectedAlert.id}/acknowledge`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to acknowledge alert");
      }

      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged and cleared",
      });

      setAcknowledgeDialogOpen(false);
      setSelectedAlert(null);
      fetchAlerts(false);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    } finally {
      setAcknowledging(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4" />;
      case "WARNING":
        return <AlertCircle className="h-4 w-4" />;
      case "INFO":
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "INFO":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "MEDICATION_DUE":
        return "Medication Due";
      case "MEDICATION_OVERDUE":
        return "Medication Overdue";
      case "MISSED_DOSE":
        return "Missed Dose";
      case "ALLERGY_WARNING":
        return "Allergy Warning";
      case "DUPLICATE_MEDICATION":
        return "Duplicate Medication";
      case "PRN_FOLLOWUP_DUE":
        return "PRN Follow-up Due";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/facility/emar">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              eMAR Alerts
            </h1>
            <p className="text-muted-foreground">
              View and manage medication alerts
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Critical</p>
                <p className="text-2xl font-bold text-red-700">{counts.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Warning</p>
                <p className="text-2xl font-bold text-yellow-700">{counts.warning}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Info</p>
                <p className="text-2xl font-bold text-blue-700">{counts.info}</p>
              </div>
              <Info className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            <div className="w-48">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical Only</SelectItem>
                  <SelectItem value="WARNING">Warning Only</SelectItem>
                  <SelectItem value="INFO">Info Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">No Active Alerts</p>
              <p className="text-muted-foreground">
                All medication alerts have been addressed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Alert</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const colors = ALERT_SEVERITY_COLORS[alert.severity] || ALERT_SEVERITY_COLORS.INFO;
                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge className={cn("gap-1", getSeverityBadgeClass(alert.severity))}>
                          {getSeverityIcon(alert.severity)}
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getAlertTypeLabel(alert.alertType)}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.intake ? (
                          <Link
                            href={`/facility/emar/patients/${alert.intakeId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {alert.intake.residentName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(alert.triggeredAt), "MM/dd h:mm a")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {alert.alertType === "PRN_FOLLOWUP_DUE" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePRNFollowup(alert)}
                            disabled={loadingPRNAdmin}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            {loadingPRNAdmin ? "Loading..." : "Record Follow-up"}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setAcknowledgeDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Acknowledge Dialog */}
      <AlertDialog open={acknowledgeDialogOpen} onOpenChange={setAcknowledgeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acknowledge Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to acknowledge this alert?
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedAlert?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAlert?.message}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acknowledging}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcknowledge} disabled={acknowledging}>
              {acknowledging ? "Acknowledging..." : "Acknowledge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PRN Follow-up Dialog */}
      <PRNFollowupDialog
        administration={selectedPRNAdmin}
        open={prnFollowupDialogOpen}
        onOpenChange={setPrnFollowupDialogOpen}
        onSuccess={() => {
          setSelectedPRNAdmin(null);
          fetchAlerts(false);
        }}
      />
    </div>
  );
}
