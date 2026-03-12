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
import { MedicationTimeline } from "@/components/emar";
import { format } from "date-fns";
import { RefreshCw, Search, Calendar, Sun, Moon, Clock } from "lucide-react";

interface TimelineEntry {
  id: string;
  time: string;
  type: "scheduled" | "administered";
  status: string;
  medicationOrder: {
    medicationName: string;
    strength: string;
    dose: string;
    route: string;
    isPRN: boolean;
    isControlled: boolean;
    intake: {
      residentName: string;
    };
  };
  administeredBy?: string;
  administeredAt?: string;
}

interface Stats {
  total: number;
  given: number;
  pending: number;
  missed: number;
}

export default function SchedulePage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, given: 0, pending: 0, missed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [shift, setShift] = useState("ALL");

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("date", selectedDate);
      params.set("shift", shift);

      const response = await fetch(`/api/emar/dashboard/timeline?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.timeline || []);

        // Calculate stats
        const given = data.timeline?.filter((e: TimelineEntry) => e.status === "GIVEN").length || 0;
        const missed = data.timeline?.filter((e: TimelineEntry) => e.status === "MISSED").length || 0;
        const pending = data.timeline?.filter((e: TimelineEntry) =>
          ["SCHEDULED", "DUE"].includes(e.status)
        ).length || 0;

        setStats({
          total: data.timeline?.length || 0,
          given,
          pending,
          missed,
        });
      }
    } catch (error) {
      console.error("Failed to fetch timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedDate, shift]);

  const filteredEntries = entries.filter((entry) =>
    entry.medicationOrder.intake.residentName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    entry.medicationOrder.medicationName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const completionRate = stats.total > 0
    ? Math.round((stats.given / stats.total) * 100)
    : 0;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Medication Schedule
          </h1>
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
          <Button variant="outline" onClick={fetchTimeline}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-700">{stats.given}</p>
              <p className="text-sm text-green-600">Given</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-700">{stats.missed}</p>
              <p className="text-sm text-red-600">Missed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completion Rate</span>
            <span className="text-sm font-medium">{completionRate}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

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
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    All Day
                  </div>
                </SelectItem>
                <SelectItem value="DAY">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Day Shift (7a-7p)
                  </div>
                </SelectItem>
                <SelectItem value="NIGHT">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Night Shift (7p-7a)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <MedicationTimeline
          entries={filteredEntries}
          title={`${shift === "ALL" ? "Full Day" : shift === "DAY" ? "Day Shift" : "Night Shift"} Schedule`}
          showPatient={true}
        />
      )}
    </div>
  );
}
