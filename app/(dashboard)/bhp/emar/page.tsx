"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Pill,
  Search,
  RefreshCw,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Facility {
  id: string;
  name: string;
  patientCount: number;
  medicationStats: {
    totalActive: number;
    dueToday: number;
    givenToday: number;
    missedToday: number;
  };
}

interface Patient {
  id: string;
  residentName: string;
  facilityName: string;
  facilityId: string;
  allergies: string | null;
  activeMedications: number;
  dueNow: number;
  status: string;
}

export default function BhpEmarPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [view, setView] = useState<"facilities" | "patients">("facilities");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch facilities with eMAR stats
      const facilitiesResponse = await fetch("/api/facilities?includeEmarStats=true");
      if (facilitiesResponse.ok) {
        const data = await facilitiesResponse.json();
        setFacilities(data.facilities || []);
      }

      // Fetch active patients
      const patientsResponse = await fetch("/api/intakes?status=ACTIVE&includeEmarInfo=true");
      if (patientsResponse.ok) {
        const data = await patientsResponse.json();
        setPatients(data.intakes || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.residentName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFacility =
      selectedFacility === "ALL" || patient.facilityId === selectedFacility;
    return matchesSearch && matchesFacility;
  });

  // Calculate overall stats
  const totalPatients = patients.length;
  const totalMedications = facilities.reduce(
    (acc, f) => acc + (f.medicationStats?.totalActive || 0),
    0
  );
  const totalDue = facilities.reduce(
    (acc, f) => acc + (f.medicationStats?.dueToday || 0),
    0
  );
  const totalGiven = facilities.reduce(
    (acc, f) => acc + (f.medicationStats?.givenToday || 0),
    0
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6" />
            eMAR Overview
          </h1>
          <p className="text-muted-foreground">
            View medication administration records across facilities
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{facilities.length}</p>
                <p className="text-sm text-muted-foreground">Facilities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPatients}</p>
                <p className="text-sm text-muted-foreground">Active Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalGiven}</p>
                <p className="text-sm text-muted-foreground">Given Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDue}</p>
                <p className="text-sm text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={view === "facilities" ? "default" : "outline"}
          onClick={() => setView("facilities")}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Facilities View
        </Button>
        <Button
          variant={view === "patients" ? "default" : "outline"}
          onClick={() => setView("patients")}
        >
          <Users className="h-4 w-4 mr-2" />
          Patients View
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : view === "facilities" ? (
        /* Facilities View */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {facility.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Patients</span>
                    <span className="font-medium">{facility.patientCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Medications</span>
                    <span className="font-medium">
                      {facility.medicationStats?.totalActive || 0}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {facility.medicationStats?.givenToday || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Given</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">
                        {facility.medicationStats?.dueToday || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Due</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">
                        {facility.medicationStats?.missedToday || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Missed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Patients View */
        <>
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Facilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Facilities</SelectItem>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Allergies</TableHead>
                    <TableHead>Active Meds</TableHead>
                    <TableHead>Due Now</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.residentName}
                      </TableCell>
                      <TableCell>{patient.facilityName}</TableCell>
                      <TableCell>
                        {patient.allergies ? (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">{patient.allergies}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">NKDA</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {patient.activeMedications || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {patient.dueNow > 0 ? (
                          <Badge variant="destructive">{patient.dueNow}</Badge>
                        ) : (
                          <Badge variant="outline">0</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/bhp/emar/patients/${patient.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No patients found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
