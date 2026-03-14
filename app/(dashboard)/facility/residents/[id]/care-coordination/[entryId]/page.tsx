"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CareCoordinationActivityType } from "@prisma/client";
import { formatDateOnly } from "@/lib/date-utils";
import { getActivityTypeConfig } from "@/lib/care-coordination";
import { ActivityTypeBadge } from "@/components/care-coordination/activity-type-badge";
import { CareCoordinationForm } from "@/components/care-coordination/care-coordination-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Paperclip,
  AlertCircle,
  FileText,
  History,
  Download,
} from "lucide-react";

interface Entry {
  id: string;
  intakeId: string;
  activityType: CareCoordinationActivityType;
  activityDate: string;
  activityTime: string | null;
  description: string;
  outcome: string | null;
  followUpNeeded: boolean;
  followUpDate: string | null;
  followUpNotes: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  editHistory: Array<{
    editedAt: string;
    editedBy: string;
    editedById: string;
    previousData: Record<string, unknown>;
  }> | null;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedByName: string;
    uploadedAt: string;
  }>;
  progressNoteLinks: Array<{
    id: string;
    progressNoteId: string;
    linkedByName: string;
    linkedAt: string;
    progressNote: {
      id: string;
      noteDate: string;
      status: string;
    };
  }>;
  intake: {
    id: string;
    residentName: string;
    dateOfBirth: string;
  };
}

export default function CareCoordinationEntryPage({
  params,
}: {
  params: { id: string; entryId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/care-coordination/${params.entryId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch entry");
        }
        const data = await response.json();
        setEntry(data.entry);
      } catch (error) {
        console.error("Fetch entry error:", error);
        toast({
          title: "Error",
          description: "Failed to load entry",
          variant: "destructive",
        });
        router.push(`/facility/residents/${params.id}/care-coordination`);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [params.entryId, params.id, toast, router]);

  const handleDownloadAttachment = async (attachment: Entry["attachments"][0]) => {
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
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  const isFollowUpOverdue =
    entry.followUpNeeded &&
    entry.followUpDate &&
    new Date(entry.followUpDate) < new Date();

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit Care Coordination Entry
            </h1>
            <p className="text-muted-foreground">
              for {entry.intake.residentName}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <CareCoordinationForm
              intakeId={params.id}
              residentName={entry.intake.residentName}
              entryId={entry.id}
              initialData={{
                intakeId: entry.intakeId,
                activityType: entry.activityType,
                activityDate: entry.activityDate.split("T")[0],
                activityTime: entry.activityTime || "",
                description: entry.description,
                outcome: entry.outcome || "",
                followUpNeeded: entry.followUpNeeded,
                followUpDate: entry.followUpDate?.split("T")[0] || "",
                followUpNotes: entry.followUpNotes || "",
                contactName: entry.contactName || "",
                contactRole: entry.contactRole || "",
                contactPhone: entry.contactPhone || "",
                contactEmail: entry.contactEmail || "",
              }}
              onSuccess={() => {
                setIsEditing(false);
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/facility/residents/${params.id}/care-coordination`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Care Coordination Entry
            </h1>
            <p className="text-muted-foreground">
              for {entry.intake.residentName}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Entry
        </Button>
      </div>

      {/* Entry Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ActivityTypeBadge type={entry.activityType} size="lg" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateOnly(entry.activityDate)}
                </span>
                {entry.activityTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {entry.activityTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{entry.description}</p>
          </div>

          {/* Outcome */}
          {entry.outcome && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">Outcome</h3>
              <p className="text-green-700 whitespace-pre-line">{entry.outcome}</p>
            </div>
          )}

          {/* Follow-up */}
          {entry.followUpNeeded && (
            <div
              className={`p-4 rounded-lg border ${
                isFollowUpOverdue
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    isFollowUpOverdue ? "text-red-500" : "text-yellow-500"
                  }`}
                />
                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      isFollowUpOverdue ? "text-red-800" : "text-yellow-800"
                    }`}
                  >
                    Follow-up {isFollowUpOverdue ? "Overdue" : "Needed"}
                    {entry.followUpDate && (
                      <span className="font-normal ml-2">
                        - {formatDateOnly(entry.followUpDate)}
                      </span>
                    )}
                  </h3>
                  {entry.followUpNotes && (
                    <p
                      className={`mt-2 ${
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>
                      {entry.contactName}
                      {entry.contactRole && (
                        <span className="text-gray-500 ml-1">
                          ({entry.contactRole})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {entry.contactPhone && (
                  <a
                    href={`tel:${entry.contactPhone}`}
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {entry.contactPhone}
                  </a>
                )}
                {entry.contactEmail && (
                  <a
                    href={`mailto:${entry.contactEmail}`}
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {entry.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {entry.attachments.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({entry.attachments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {entry.attachments.map((attachment) => (
                  <Button
                    key={attachment.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="truncate flex-1 text-left">
                      {attachment.fileName}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatFileSize(attachment.fileSize)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Progress Note Links */}
          {entry.progressNoteLinks.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Linked Progress Notes ({entry.progressNoteLinks.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {entry.progressNoteLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={`/facility/residents/${params.id}/progress-notes/${link.progressNoteId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                  >
                    <FileText className="h-4 w-4" />
                    {formatDateOnly(link.progressNote.noteDate)}
                    <span className="text-xs text-blue-500">
                      ({link.progressNote.status})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Edit History */}
          {entry.editHistory && entry.editHistory.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                Edit History ({entry.editHistory.length})
              </h3>
              <div className="space-y-2">
                {entry.editHistory.map((edit, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 bg-gray-50 rounded-md"
                  >
                    <span className="font-medium">{edit.editedBy}</span>
                    <span className="text-gray-500"> edited on </span>
                    <span>{formatDateOnly(edit.editedAt)}</span>
                    <span className="text-gray-500">
                      {" "}
                      - Changed: {Object.keys(edit.previousData).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t">
            <span>Created by {entry.createdByName}</span>
            <span>Created {formatDateOnly(entry.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
