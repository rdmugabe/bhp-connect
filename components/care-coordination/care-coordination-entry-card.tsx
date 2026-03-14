"use client";

import { useState } from "react";
import Link from "next/link";
import { CareCoordinationActivityType } from "@prisma/client";
import { formatDateOnly } from "@/lib/date-utils";
import { getSignedDownloadUrl } from "@/lib/s3";
import { ActivityTypeBadge } from "./activity-type-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Paperclip,
  AlertCircle,
  MoreVertical,
  Edit,
  Eye,
  FileText,
  Download,
  Trash2,
} from "lucide-react";

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedByName: string;
  uploadedAt: Date;
}

interface ProgressNoteLink {
  id: string;
  progressNoteId: string;
  linkedByName: string;
  linkedAt: Date;
  progressNote: {
    id: string;
    noteDate: Date;
    status: string;
  };
}

interface CareCoordinationEntryCardProps {
  entry: {
    id: string;
    activityType: CareCoordinationActivityType;
    activityDate: Date;
    activityTime: string | null;
    description: string;
    outcome: string | null;
    followUpNeeded: boolean;
    followUpDate: Date | null;
    followUpNotes: string | null;
    contactName: string | null;
    contactRole: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    createdByName: string;
    createdAt: Date;
    attachments: Attachment[];
    progressNoteLinks: ProgressNoteLink[];
  };
  residentId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isAdmin?: boolean;
  compact?: boolean;
}

export function CareCoordinationEntryCard({
  entry,
  residentId,
  onEdit,
  onDelete,
  showActions = true,
  isAdmin = false,
  compact = false,
}: CareCoordinationEntryCardProps) {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleDownloadAttachment = async (attachment: Attachment) => {
    setDownloadingFile(attachment.id);
    try {
      const response = await fetch(`/api/files/download?key=${encodeURIComponent(attachment.fileUrl)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloadingFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isFollowUpOverdue =
    entry.followUpNeeded &&
    entry.followUpDate &&
    new Date(entry.followUpDate) < new Date();

  return (
    <Card className={compact ? "p-3" : ""}>
      <CardHeader className={compact ? "p-0 pb-2" : "pb-3"}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ActivityTypeBadge type={entry.activityType} />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateOnly(entry.activityDate)}</span>
              {entry.activityTime && (
                <>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{entry.activityTime}</span>
                </>
              )}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/facility/residents/${residentId}/care-coordination/${entry.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isAdmin && onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className={compact ? "p-0" : "pt-0"}>
        {/* Description */}
        <p className="text-sm text-gray-700 mb-3">{entry.description}</p>

        {/* Outcome */}
        {entry.outcome && (
          <div className="mb-3 p-2 bg-green-50 rounded-md border border-green-200">
            <p className="text-sm text-green-800">
              <span className="font-medium">Outcome:</span> {entry.outcome}
            </p>
          </div>
        )}

        {/* Follow-up */}
        {entry.followUpNeeded && (
          <div
            className={`mb-3 p-2 rounded-md border ${
              isFollowUpOverdue
                ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className={`h-4 w-4 mt-0.5 ${
                  isFollowUpOverdue ? "text-red-500" : "text-yellow-500"
                }`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isFollowUpOverdue ? "text-red-800" : "text-yellow-800"
                  }`}
                >
                  Follow-up {isFollowUpOverdue ? "Overdue" : "Needed"}
                  {entry.followUpDate && (
                    <span className="font-normal">
                      {" "}
                      - {formatDateOnly(entry.followUpDate)}
                    </span>
                  )}
                </p>
                {entry.followUpNotes && (
                  <p
                    className={`text-sm mt-1 ${
                      isFollowUpOverdue ? "text-red-700" : "text-yellow-700"
                    }`}
                  >
                    {entry.followUpNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(entry.contactName || entry.contactPhone || entry.contactEmail) && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <p className="text-xs font-medium text-gray-500 mb-1">Contact</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {entry.contactName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-gray-400" />
                  {entry.contactName}
                  {entry.contactRole && (
                    <span className="text-gray-500">({entry.contactRole})</span>
                  )}
                </span>
              )}
              {entry.contactPhone && (
                <a
                  href={`tel:${entry.contactPhone}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {entry.contactPhone}
                </a>
              )}
              {entry.contactEmail && (
                <a
                  href={`mailto:${entry.contactEmail}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {entry.contactEmail}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Attachments */}
        {entry.attachments.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              Attachments ({entry.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {entry.attachments.map((attachment) => (
                <Button
                  key={attachment.id}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleDownloadAttachment(attachment)}
                  disabled={downloadingFile === attachment.id}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {attachment.fileName.length > 20
                    ? `${attachment.fileName.substring(0, 17)}...`
                    : attachment.fileName}
                  <span className="ml-1 text-gray-400">
                    ({formatFileSize(attachment.fileSize)})
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Progress Note Links */}
        {entry.progressNoteLinks.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Linked Progress Notes ({entry.progressNoteLinks.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {entry.progressNoteLinks.map((link) => (
                <Link
                  key={link.id}
                  href={`/facility/residents/${residentId}/progress-notes/${link.progressNoteId}`}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                >
                  <FileText className="h-3 w-3" />
                  {formatDateOnly(link.progressNote.noteDate)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
          <span>By {entry.createdByName}</span>
          <span>Created {formatDateOnly(entry.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
