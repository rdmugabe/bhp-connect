"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, FileText, Activity, Mail } from "lucide-react";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Admission Date</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
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
                    <Link href={`/facility/residents/${resident.id}`}>
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
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No residents found. Create an intake to add a resident.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
