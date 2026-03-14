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
import { Eye, FileText, Activity, Mail, Building2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EnrollmentEmailDialog } from "./enrollment-email-dialog";

interface Resident {
  id: string;
  residentName: string;
  dateOfBirth: Date;
  createdAt: Date;
  facility: {
    id: string;
    name: string;
  };
  asamAssessments: {
    id: string;
    status: string;
  }[];
}

interface ResidentsTableProps {
  residents: Resident[];
  bhpEmail: string;
}

export function ResidentsTable({ residents, bhpEmail }: ResidentsTableProps) {
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
          const asamCount = resident.asamAssessments.length;

          return (
            <Card key={resident.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{resident.residentName}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Building2 className="h-3 w-3" />
                      {resident.facility.name}
                    </div>
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

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    1 Intake
                  </Badge>
                  {asamCount > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {asamCount} ASAM
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/bhp/residents/${resident.id}`} className="flex-1">
                    <Button size="sm" className="w-full h-10">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 w-10 p-0"
                    onClick={() =>
                      handleOpenEmailDialog(resident.id, resident.residentName)
                    }
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {residents.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No residents found in your facilities.
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
              <TableHead>Facility</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Admission Date</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {residents.map((resident) => {
              const asamCount = resident.asamAssessments.length;

              return (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">
                    {resident.residentName}
                  </TableCell>
                  <TableCell>{resident.facility.name}</TableCell>
                  <TableCell>{formatDate(resident.dateOfBirth)}</TableCell>
                  <TableCell>{formatDate(resident.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        1 Intake
                      </Badge>
                      {asamCount > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {asamCount} ASAM
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/bhp/residents/${resident.id}`}>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
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
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No residents found in your facilities.
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
