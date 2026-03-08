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
import { Edit, Archive } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ASAMDraft {
  id: string;
  patientName: string;
  draftStep: number | null;
  updatedAt: Date;
  intake: {
    id: string;
    residentName: string;
  };
}

interface ASAMDraftsTableProps {
  drafts: ASAMDraft[];
}

export function ASAMDraftsTable({ drafts }: ASAMDraftsTableProps) {
  const router = useRouter();
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function handleArchive(id: string) {
    setArchivingId(id);
    try {
      const response = await fetch(`/api/asam/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Failed to archive draft:", data.error);
      }
    } catch (error) {
      console.error("Failed to archive draft:", error);
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Linked Intake</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="w-[160px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drafts.map((assessment) => (
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
            <TableCell>{formatDate(assessment.updatedAt)}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/facility/asam/${assessment.id}/edit`}>
                  <Button variant="default" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Continue
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      disabled={archivingId === assessment.id}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Draft ASAM Assessment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to archive this draft ASAM assessment for{" "}
                        <strong>
                          {assessment.patientName === "Draft Assessment"
                            ? "New Draft"
                            : assessment.patientName}
                        </strong>
                        ? Archived drafts will no longer appear in your list but can be restored if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleArchive(assessment.id)}
                      >
                        Archive
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
