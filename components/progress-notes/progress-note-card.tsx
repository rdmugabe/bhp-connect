"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskFlagBadge } from "./risk-flag-banner";
import { formatDate } from "@/lib/utils";
import { Eye, Edit, FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface ProgressNote {
  id: string;
  noteDate: Date | string;
  shift: string | null;
  authorName: string;
  authorTitle: string | null;
  status: string;
  riskFlagsDetected: string[];
  generatedNote: string | null;
  createdAt: Date | string;
  intake: {
    id: string;
    residentName: string;
  };
}

interface ProgressNoteCardProps {
  note: ProgressNote;
  residentId: string;
  basePath?: string;
  showActions?: boolean;
  readOnly?: boolean;
}

export function ProgressNoteCard({
  note,
  residentId,
  basePath = "/facility/residents",
  showActions = true,
  readOnly = false,
}: ProgressNoteCardProps) {
  const hasRiskFlags = note.riskFlagsDetected && note.riskFlagsDetected.length > 0;
  const hasCriticalFlags = note.riskFlagsDetected?.some(
    (f) => f === "SUICIDAL_IDEATION" || f === "HOMICIDAL_IDEATION" || f === "SELF_HARM"
  );

  return (
    <Card className={hasCriticalFlags ? "border-red-300 bg-red-50/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                hasCriticalFlags
                  ? "bg-red-100"
                  : note.status === "FINAL"
                  ? "bg-green-100"
                  : "bg-yellow-100"
              }`}
            >
              {hasCriticalFlags ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : note.status === "FINAL" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {formatDate(note.noteDate)}
                {note.shift && (
                  <Badge variant="outline" className="ml-2 font-normal">
                    {note.shift}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                By {note.authorName}
                {note.authorTitle && `, ${note.authorTitle}`}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={note.status === "FINAL" ? "default" : "secondary"}
            className={note.status === "FINAL" ? "bg-green-100 text-green-800" : ""}
          >
            {note.status === "FINAL" ? "Finalized" : "Draft"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Risk Flags */}
        {hasRiskFlags && (
          <div className="flex flex-wrap gap-2">
            {note.riskFlagsDetected.map((flag) => (
              <RiskFlagBadge key={flag} flag={flag} size="sm" />
            ))}
          </div>
        )}

        {/* Preview */}
        {note.generatedNote && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {note.generatedNote}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Link href={`${basePath}/${residentId}/progress-notes/${note.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            {!readOnly && note.status !== "FINAL" && (
              <Link href={`${basePath}/${residentId}/progress-notes/${note.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressNoteListProps {
  notes: ProgressNote[];
  residentId: string;
  residentName: string;
  basePath?: string;
  showActions?: boolean;
  readOnly?: boolean;
}

export function ProgressNoteList({
  notes,
  residentId,
  residentName,
  basePath = "/facility/residents",
  showActions = true,
  readOnly = false,
}: ProgressNoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No Progress Notes Yet
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create the first progress note for {residentName}
        </p>
        {!readOnly && (
          <Link href={`${basePath}/${residentId}/progress-notes/new`}>
            <Button>Create Progress Note</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <ProgressNoteCard
          key={note.id}
          note={note}
          residentId={residentId}
          basePath={basePath}
          showActions={showActions}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
