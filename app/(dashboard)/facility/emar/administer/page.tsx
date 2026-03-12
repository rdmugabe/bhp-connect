"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MedicationScheduleTable, AlertBanner, PRNFollowupDialog } from "@/components/emar";
import { format } from "date-fns";
import {
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Schedule {
  id: string;
  scheduledTime: string;
  scheduledDateTime: string;
  status: string;
  windowStartTime: string;
  windowEndTime: string;
  medicationOrder: {
    id: string;
    medicationName: string;
    strength: string;
    dose: string;
    route: string;
    isPRN: boolean;
    isControlled: boolean;
    instructions?: string;
    intake: {
      id: string;
      residentName: string;
      dateOfBirth: string;
      allergies?: string;
    };
  };
  administration?: {
    id: string;
    administeredAt: string;
    administeredBy: string;
    status: string;
  };
}

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  triggeredAt: string;
  intake?: {
    residentName: string;
  };
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

export default function AdministerPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prnFollowups, setPrnFollowups] = useState<PRNAdministration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedPRN, setSelectedPRN] = useState<PRNAdministration | null>(null);
  const [prnDialogOpen, setPrnDialogOpen] = useState(false);

  const fetchSchedules = async () => {
    try {
      const params = new URLSearchParams();
      params.set("date", selectedDate);
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/emar/schedules/due?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/emar/alerts?refresh=true");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  const fetchPRNFollowups = async () => {
    try {
      const response = await fetch(
        `/api/emar/administrations?status=GIVEN&needsPRNFollowup=true`
      );
      if (response.ok) {
        const data = await response.json();
        setPrnFollowups(data.administrations || []);
      }
    } catch (error) {
      console.error("Failed to fetch PRN followups:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSchedules(), fetchAlerts(), fetchPRNFollowups()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchSchedules();
      fetchAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedDate, statusFilter]);

  const handleAlertAcknowledge = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const filteredSchedules = schedules.filter((schedule) =>
    schedule.medicationOrder.intake.residentName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    schedule.medicationOrder.medicationName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Group by status
  const dueSchedules = filteredSchedules.filter((s) => s.status === "DUE");
  const scheduledSchedules = filteredSchedules.filter((s) => s.status === "SCHEDULED");
  const completedSchedules = filteredSchedules.filter((s) =>
    ["GIVEN", "REFUSED", "HELD", "NOT_AVAILABLE", "LOA"].includes(s.status)
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Medication Administration</h1>
          <p className="text-muted-foreground">
            {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          />
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <AlertBanner
            alerts={alerts}
            onAcknowledge={handleAlertAcknowledge}
            onRefresh={fetchAlerts}
          />
        </div>
      )}

      {/* PRN Followups Needed */}
      {prnFollowups.length > 0 && (
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              PRN Follow-ups Needed ({prnFollowups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prnFollowups.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {admin.medicationOrder.intake.residentName} -{" "}
                      {admin.medicationOrder.medicationName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Given at {format(new Date(admin.administeredAt), "h:mm a")}
                      {admin.prnReasonGiven && ` for ${admin.prnReasonGiven}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPRN(admin);
                      setPrnDialogOpen(true);
                    }}
                  >
                    Record Follow-up
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient or medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DUE">Due Now</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="GIVEN">Given</SelectItem>
                <SelectItem value="MISSED">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Due Now */}
          {dueSchedules.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Due Now ({dueSchedules.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedicationScheduleTable
                  schedules={dueSchedules}
                  onRefresh={loadData}
                  showPatientColumn={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Upcoming */}
          {scheduledSchedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming ({scheduledSchedules.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedicationScheduleTable
                  schedules={scheduledSchedules}
                  onRefresh={loadData}
                  showPatientColumn={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Completed */}
          {completedSchedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Completed ({completedSchedules.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <MedicationScheduleTable
                  schedules={completedSchedules}
                  onRefresh={loadData}
                  showPatientColumn={true}
                  readOnly={true}
                />
              </CardContent>
            </Card>
          )}

          {filteredSchedules.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No medications found for the selected criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PRN Followup Dialog */}
      <PRNFollowupDialog
        administration={selectedPRN}
        open={prnDialogOpen}
        onOpenChange={setPrnDialogOpen}
        onSuccess={() => {
          fetchPRNFollowups();
          setSelectedPRN(null);
        }}
      />
    </div>
  );
}
