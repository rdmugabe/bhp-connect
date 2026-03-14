"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, FileText, Activity, Mail, Plus, AlertTriangle, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EnrollmentEmailDialog } from "./enrollment-email-dialog";

interface Resident {
  id: string;
  residentName: string;
  dateOfBirth: Date;
  createdAt: Date;
  asamAssessments: {
    id: string;
    status: string;
  }[];
  progressNotes: {
    id: string;
    shift: string | null;
    status: string;
  }[];
}

interface FacilityResidentsTableProps {
  residents: Resident[];
  bhpEmail: string;
}

export function FacilityResidentsTable({ residents, bhpEmail }: FacilityResidentsTableProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleOpenEmailDialog = (residentId: string, residentName: string) => {
    setSelectedResident({ id: residentId, name: residentName });
    setEmailDialogOpen(true);
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {residents.map((resident) => {
          const todayNotes = resident.progressNotes || [];
          const hasAM = todayNotes.some((n) => n.shift === "AM");
          const hasPM = todayNotes.some((n) => n.shift === "PM");
          const missingShifts: string[] = [];
          if (!hasAM) missingShifts.push("AM");
          if (!hasPM) missingShifts.push("PM");

          return (
            <Card key={resident.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{resident.residentName}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasAM ? (
                      <Badge variant="default" className="bg-green-500 text-xs">AM</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">AM</Badge>
                    )}
                    {hasPM ? (
                      <Badge variant="default" className="bg-green-500 text-xs">PM</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">PM</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">DOB:</span>{" "}
                    <span className="font-medium">{formatDate(resident.dateOfBirth)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Admitted:</span>{" "}
                    <span className="font-medium">{formatDate(resident.createdAt)}</span>
                  </div>
                </div>

                {missingShifts.length > 0 && (
                  <div className="flex items-center gap-1 text-amber-600 text-sm mb-3 bg-amber-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    Missing progress notes: {missingShifts.join(", ")}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Link href={`/facility/residents/${resident.id}/progress-notes/new`}>
                    <Button size="sm" variant="default" className="w-full h-10">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Progress Note
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    <Link href={`/facility/residents/${resident.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-10">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 w-10 p-0"
                      onClick={() =>
                        handleOpenEmailDialog(resident.id, resident.residentName)
                      }
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {residents.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No residents found. Create an intake to add a resident.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Admission Date</TableHead>
              <TableHead>Today&apos;s Progress Notes</TableHead>
              <TableHead className="w-[250px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {residents.map((resident) => {
              const asamCount = resident.asamAssessments.length;
              const todayNotes = resident.progressNotes || [];
              const hasAM = todayNotes.some((n) => n.shift === "AM");
              const hasPM = todayNotes.some((n) => n.shift === "PM");
              const missingShifts: string[] = [];
              if (!hasAM) missingShifts.push("AM");
              if (!hasPM) missingShifts.push("PM");

              return (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">
                    {resident.residentName}
                  </TableCell>
                  <TableCell>{formatDate(resident.dateOfBirth)}</TableCell>
                  <TableCell>{formatDate(resident.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {hasAM ? (
                          <Badge variant="default" className="bg-green-500">
                            AM
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            AM
                          </Badge>
                        )}
                        {hasPM ? (
                          <Badge variant="default" className="bg-green-500">
                            PM
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            PM
                          </Badge>
                        )}
                      </div>
                      {missingShifts.length > 0 && (
                        <div className="flex items-center gap-1 text-amber-600 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Missing: {missingShifts.join(", ")}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/facility/residents/${resident.id}/progress-notes/new`}>
                        <Button size="sm" variant="default">
                          <Plus className="h-4 w-4 mr-1" />
                          Progress Note
                        </Button>
                      </Link>
                      <Link href={`/facility/residents/${resident.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleOpenEmailDialog(resident.id, resident.residentName)
                        }
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {residents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No residents found. Create an intake to add a resident.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedResident && (
        <EnrollmentEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          residentId={selectedResident.id}
          residentName={selectedResident.name}
          bhpEmail={bhpEmail}
        />
      )}
    </>
  );
}
