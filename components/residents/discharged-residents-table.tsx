"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Eye, FileText, Activity, RefreshCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ReadmitDialog } from "./readmit-dialog";

interface DischargedResident {
  id: string;
  residentName: string;
  dateOfBirth: Date;
  createdAt: Date;
  dischargedAt: Date | null;
  asamAssessments: {
    id: string;
    status: string;
  }[];
  dischargeSummary: {
    dischargeDate: Date;
  } | null;
}

interface DischargedResidentsTableProps {
  residents: DischargedResident[];
}

export function DischargedResidentsTable({ residents }: DischargedResidentsTableProps) {
  const [readmitDialogOpen, setReadmitDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const router = useRouter();

  const handleOpenReadmitDialog = (residentId: string, residentName: string) => {
    setSelectedResident({ id: residentId, name: residentName });
    setReadmitDialogOpen(true);
  };

  const handleReadmitSuccess = (newIntakeId: string) => {
    router.push(`/facility/intakes/${newIntakeId}/edit`);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Admission Date</TableHead>
            <TableHead>Discharge Date</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {residents.map((resident) => {
            const asamCount = resident.asamAssessments.length;
            const dischargeDate = resident.dischargeSummary?.dischargeDate || resident.dischargedAt;

            return (
              <TableRow key={resident.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {resident.residentName}
                    <Badge variant="secondary" className="text-xs">
                      Discharged
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{formatDate(resident.dateOfBirth)}</TableCell>
                <TableCell>{formatDate(resident.createdAt)}</TableCell>
                <TableCell>
                  {dischargeDate ? formatDate(dischargeDate) : "—"}
                </TableCell>
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
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Records
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleOpenReadmitDialog(resident.id, resident.residentName)
                      }
                    >
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      Re-admit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {residents.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No discharged residents.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {selectedResident && (
        <ReadmitDialog
          open={readmitDialogOpen}
          onOpenChange={setReadmitDialogOpen}
          residentId={selectedResident.id}
          residentName={selectedResident.name}
          onSuccess={handleReadmitSuccess}
        />
      )}
    </>
  );
}
