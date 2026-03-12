"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pill,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Syringe,
  FileText,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { STATUS_COLORS, ALERT_SEVERITY_COLORS } from "@/lib/emar";

interface DashboardData {
  facilityName: string;
  summary: {
    activePatients: number;
    activeOrders: number;
    alerts: {
      critical: number;
      warning: number;
      info: number;
      total: number;
    };
  };
  today: {
    scheduled: number;
    due: number;
    given: number;
    missed: number;
    refused: number;
    prnGiven: number;
    total: number;
    completionRate: number;
  };
  adherenceTrend: {
    date: string;
    total: number;
    given: number;
    rate: number;
  }[];
  patientsWithDueMeds: {
    id: string;
    residentName: string;
    medicationOrders: {
      id: string;
      medicationName: string;
      schedules: {
        id: string;
        scheduledTime: string;
        status: string;
      }[];
    }[];
  }[];
  prnMedicationsAvailable: {
    id: string;
    residentName: string;
    prnMedications: {
      id: string;
      medicationName: string;
      prnReason: string | null;
      canAdminister: boolean;
      reason: string | null;
    }[];
  }[];
}

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  triggeredAt: string;
}

export function EmarDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/emar/dashboard");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  };

  const fetchAlerts = async (refresh = false) => {
    try {
      const response = await fetch(`/api/emar/alerts?refresh=${refresh}`);
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.alerts || []);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchAlerts(true)]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchAlerts(true)]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboard();
      fetchAlerts(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={loadData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL");
  const warningAlerts = alerts.filter((a) => a.severity === "WARNING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">eMAR Dashboard</h1>
            <p className="text-muted-foreground">{data.facilityName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Link href="/facility/emar/patients">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              All Patients
            </Button>
          </Link>
          <Link href="/facility/emar/schedule">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Today&apos;s Schedule
            </Button>
          </Link>
          <Link href="/facility/emar/reports">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </Link>
          <Link href="/facility/emar/administer">
            <Button size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Administer Medications
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 && "s"}
              </h3>
              <ul className="mt-2 space-y-1">
                {criticalAlerts.slice(0, 3).map((alert) => (
                  <li key={alert.id} className="text-sm text-red-700">
                    {alert.message}
                  </li>
                ))}
              </ul>
              {criticalAlerts.length > 3 && (
                <Link
                  href="/facility/emar/alerts"
                  className="text-sm text-red-600 hover:underline mt-2 inline-block"
                >
                  View all alerts
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activePatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With medication orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Orders
            </CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Medication orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Progress
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.today.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.today.given} of {data.today.total} doses given
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.alerts.total}</div>
            <div className="flex gap-2 mt-1">
              {data.summary.alerts.critical > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.summary.alerts.critical} critical
                </Badge>
              )}
              {data.summary.alerts.warning > 0 && (
                <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-400">
                  {data.summary.alerts.warning} warning
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Medication Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{data.today.scheduled}</div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{data.today.due}</div>
                <div className="text-xs text-yellow-700">Due Now</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{data.today.given}</div>
                <div className="text-xs text-green-700">Given</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{data.today.missed}</div>
                <div className="text-xs text-red-700">Missed</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{data.today.refused}</div>
                <div className="text-xs text-orange-700">Refused</div>
              </div>
            </div>

            {/* Patients with Due Meds */}
            <div>
              <h4 className="font-medium mb-3">Medications Due Now</h4>
              {data.patientsWithDueMeds.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No scheduled medications currently due
                </p>
              ) : (
                <div className="space-y-3">
                  {data.patientsWithDueMeds.slice(0, 5).map((patient) => (
                    <Link
                      key={patient.id}
                      href={`/facility/emar/patients/${patient.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{patient.residentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {patient.medicationOrders.length} medication(s) due
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* PRN Medications Available */}
            {data.prnMedicationsAvailable && data.prnMedicationsAvailable.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-purple-600" />
                  PRN Medications Available
                </h4>
                <div className="space-y-3">
                  {data.prnMedicationsAvailable.slice(0, 5).map((patient) => (
                    <Link
                      key={`prn-${patient.id}`}
                      href={`/facility/emar/patients/${patient.id}`}
                      className="block p-3 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{patient.residentName}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient.prnMedications.slice(0, 3).map((med) => (
                              <Badge
                                key={med.id}
                                variant={med.canAdminister ? "outline" : "secondary"}
                                className={cn(
                                  "text-xs",
                                  med.canAdminister
                                    ? "border-purple-400 text-purple-700"
                                    : "bg-gray-200 text-gray-600"
                                )}
                              >
                                {med.medicationName}
                                {!med.canAdminister && med.reason && (
                                  <span className="ml-1 text-xs opacity-70">
                                    ({med.reason})
                                  </span>
                                )}
                              </Badge>
                            ))}
                            {patient.prnMedications.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{patient.prnMedications.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active alerts
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => {
                  const colors = ALERT_SEVERITY_COLORS[alert.severity] || ALERT_SEVERITY_COLORS.INFO;
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        colors.bg,
                        colors.border
                      )}
                    >
                      <div className={cn("font-medium text-sm", colors.text)}>
                        {alert.title}
                      </div>
                      <div className={cn("text-xs mt-1", colors.text)}>
                        {alert.message}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.triggeredAt), "h:mm a")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {alerts.length > 5 && (
              <Link href="/facility/emar/alerts">
                <Button variant="link" className="w-full mt-4">
                  View All Alerts
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
