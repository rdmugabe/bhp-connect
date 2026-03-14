"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { ExternalLink, Pencil, Trash2, FileText, Calendar, Clock } from "lucide-react";
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

  function handleViewDocument(fileUrl: string) {
    // Use window.open for better tablet/mobile compatibility
    const url = `/api/documents/download?key=${encodeURIComponent(fileUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 p-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-base">{doc.documentType.name}</h3>
                    {getStatusBadge(doc.status, doc.noExpiration)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Issued:</span>{" "}
                  <span className="font-medium">{formatDate(doc.issuedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Expires:</span>{" "}
                  <span className="font-medium">
                    {doc.noExpiration
                      ? "Never"
                      : doc.expiresAt
                      ? formatDate(doc.expiresAt)
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 h-10"
                  onClick={() => handleViewDocument(doc.fileUrl)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Document
                </Button>
                {!readOnly && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => onEdit?.(doc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => setDeletingId(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDocument(doc.fileUrl)}
                    >
                      <ExternalLink className="h-4 w-4" />
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
      </div>

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
