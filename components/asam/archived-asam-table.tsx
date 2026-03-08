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
import { RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ArchivedASAM {
  id: string;
  patientName: string;
  draftStep: number | null;
  archivedAt: Date | null;
  intake: {
    id: string;
    residentName: string;
  };
}

interface ArchivedASAMTableProps {
  assessments: ArchivedASAM[];
}

export function ArchivedASAMTable({ assessments }: ArchivedASAMTableProps) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      const response = await fetch(`/api/asam/${id}/restore`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Failed to restore assessment:", data.error);
      }
    } catch (error) {
      console.error("Failed to restore assessment:", error);
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Linked Intake</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Archived On</TableHead>
          <TableHead className="w-[120px]">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assessments.map((assessment) => (
          <TableRow key={assessment.id}>
            <TableCell className="font-medium">
              {assessment.patientName === "Draft Assessment"
                ? "New Draft"
                : assessment.patientName}
            </TableCell>
            <TableCell>
              <Link
                href={`/facility/intakes/${assessment.intake.id}`}
                className="text-primary hover:underline text-sm"
              >
                View Intake
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                Step {assessment.draftStep || 1} of 8
              </Badge>
            </TableCell>
            <TableCell>{formatDate(assessment.archivedAt)}</TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoringId === assessment.id}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore Draft ASAM Assessment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore the draft ASAM assessment for{" "}
                      <strong>
                        {assessment.patientName === "Draft Assessment"
                          ? "New Draft"
                          : assessment.patientName}
                      </strong>{" "}
                      back to your active drafts list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRestore(assessment.id)}>
                      Restore
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
