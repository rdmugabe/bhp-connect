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

interface IntakeDraft {
  id: string;
  residentName: string;
  draftStep: number | null;
  updatedAt: Date;
}

interface IntakeDraftsTableProps {
  drafts: IntakeDraft[];
}

export function IntakeDraftsTable({ drafts }: IntakeDraftsTableProps) {
  const router = useRouter();
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function handleArchive(id: string) {
    setArchivingId(id);
    try {
      const response = await fetch(`/api/intakes/${id}`, {
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
          <TableHead>Resident</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="w-[160px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drafts.map((intake) => (
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
            <TableCell>{formatDate(intake.updatedAt)}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/facility/intakes/${intake.id}/edit`}>
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
                      disabled={archivingId === intake.id}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Draft Intake?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to archive this draft intake for{" "}
                        <strong>
                          {intake.residentName === "Draft Intake"
                            ? "New Draft"
                            : intake.residentName}
                        </strong>
                        ? Archived drafts will no longer appear in your list but can be restored if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleArchive(intake.id)}
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
