"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface DocumentType {
  id: string;
  name: string;
  expirationRequired: boolean;
  isDefault: boolean;
}

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
  notes: string | null;
}

interface EmployeeDocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  document?: EmployeeDocument | null;
  onSuccess: () => void;
}

export function EmployeeDocumentForm({
  open,
  onOpenChange,
  employeeId,
  document,
  onSuccess,
}: EmployeeDocumentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    documentTypeId: "",
    issuedAt: "",
    expiresAt: "",
    noExpiration: false,
    notes: "",
  });

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (document) {
      setFormData({
        documentTypeId: document.documentType.id,
        issuedAt: new Date(document.issuedAt).toISOString().split("T")[0],
        expiresAt: document.expiresAt
          ? new Date(document.expiresAt).toISOString().split("T")[0]
          : "",
        noExpiration: document.noExpiration,
        notes: document.notes || "",
      });
      setSelectedFile(null);
    } else {
      setFormData({
        documentTypeId: "",
        issuedAt: "",
        expiresAt: "",
        noExpiration: false,
        notes: "",
      });
      setSelectedFile(null);
    }
  }, [document, open]);

  async function fetchDocumentTypes() {
    try {
      const response = await fetch("/api/employee-document-types");
      if (response.ok) {
        const data = await response.json();
        setDocumentTypes(data.documentTypes || []);
      }
    } catch (error) {
      console.error("Failed to fetch document types:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!document && !selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
      });
      return;
    }

    if (!formData.noExpiration && !formData.expiresAt) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Please provide an expiration date or select 'No Expiration'",
      });
      return;
    }

    setIsLoading(true);

    try {
      let fileUrl = document?.fileUrl;

      // Upload file if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);
        uploadFormData.append("type", "employee-document");
        uploadFormData.append("entityId", employeeId);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload file");

        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.fileUrl;
      }

      const url = document
        ? `/api/employee-documents/${document.id}`
        : "/api/employee-documents";
      const method = document ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          employeeId,
          fileUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save document");
      }

      toast({
        title: "Success",
        description: document
          ? "Document updated successfully"
          : "Document uploaded successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save document",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const selectedDocType = documentTypes.find(
    (dt) => dt.id === formData.documentTypeId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {document ? "Update Document" : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            {document
              ? "Update employee document information"
              : "Upload a new document for this employee"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="documentType">Document Type *</Label>
            <Select
              value={formData.documentTypeId}
              onValueChange={(value) =>
                setFormData({ ...formData, documentTypeId: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} {type.isDefault && "(Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">
              {document ? "Replace File (Optional)" : "File *"}
            </Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Word, or image files up to 10MB
            </p>
          </div>

          <div>
            <Label htmlFor="issuedAt">Date Issued *</Label>
            <Input
              id="issuedAt"
              type="date"
              value={formData.issuedAt}
              onChange={(e) =>
                setFormData({ ...formData, issuedAt: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="hasExpiration"
                  name="expirationType"
                  checked={!formData.noExpiration}
                  onChange={() =>
                    setFormData({ ...formData, noExpiration: false })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="hasExpiration" className="font-normal">
                  Has Expiration
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="noExpiration"
                  name="expirationType"
                  checked={formData.noExpiration}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      noExpiration: true,
                      expiresAt: "",
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="noExpiration" className="font-normal">
                  No Expiration
                </Label>
              </div>
            </div>
            {!formData.noExpiration && (
              <div>
                <Label htmlFor="expiresAt">Expiration Date *</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  required={!formData.noExpiration}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="mt-1"
              placeholder="Optional notes about this document"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : document ? "Update" : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
