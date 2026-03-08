"use client";

import { useState } from "react";
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

interface ArchivedIntake {
  id: string;
  residentName: string;
  draftStep: number | null;
  archivedAt: Date | null;
}

interface ArchivedIntakesTableProps {
  intakes: ArchivedIntake[];
}

export function ArchivedIntakesTable({ intakes }: ArchivedIntakesTableProps) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      const response = await fetch(`/api/intakes/${id}/restore`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Failed to restore intake:", data.error);
      }
    } catch (error) {
      console.error("Failed to restore intake:", error);
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Resident</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Archived On</TableHead>
          <TableHead className="w-[120px]">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {intakes.map((intake) => (
          <TableRow key={intake.id}>
            <TableCell className="font-medium">
              {intake.residentName === "Draft Intake"
                ? "New Draft"
                : intake.residentName}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                Step {intake.draftStep || 1} of 17
              </Badge>
            </TableCell>
            <TableCell>{formatDate(intake.archivedAt)}</TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoringId === intake.id}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore Draft Intake?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore the draft intake for{" "}
                      <strong>
                        {intake.residentName === "Draft Intake"
                          ? "New Draft"
                          : intake.residentName}
                      </strong>{" "}
                      back to your active drafts list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRestore(intake.id)}>
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
