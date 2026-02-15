"use client";

import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EmployeeDocument {
  id: string;
  documentType: {
    id: string;
    name: string;
  };
  fileUrl: string;
  issuedAt: string;
  expiresAt: string | null;
  noExpiration: boolean;
  status: string;
  uploadedAt: string;
  notes: string | null;
}

interface EmployeeDocumentsTableProps {
  documents: EmployeeDocument[];
  onEdit?: (document: EmployeeDocument) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function EmployeeDocumentsTable({
  documents,
  onEdit,
  onDelete,
  readOnly = false,
}: EmployeeDocumentsTableProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/employee-documents/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      onDelete?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document",
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  const getStatusBadge = (status: string, noExpiration: boolean) => {
    if (noExpiration) {
      return <Badge variant="secondary">No Expiration</Badge>;
    }
    switch (status) {
      case "VALID":
        return <Badge variant="success">Valid</Badge>;
      case "EXPIRING_SOON":
        return <Badge variant="warning">Expiring Soon</Badge>;
      case "EXPIRED":
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                {doc.documentType.name}
              </TableCell>
              <TableCell>{formatDate(doc.issuedAt)}</TableCell>
              <TableCell>
                {doc.noExpiration
                  ? "No expiration"
                  : doc.expiresAt
                  ? formatDate(doc.expiresAt)
                  : "N/A"}
              </TableCell>
              <TableCell>{getStatusBadge(doc.status, doc.noExpiration)}</TableCell>
              <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={`/api/documents/download?key=${encodeURIComponent(doc.fileUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  {!readOnly && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(doc)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
