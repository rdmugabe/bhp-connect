"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

interface DocumentType {
  id: string;
  name: string;
  expirationRequired: boolean;
  isDefault: boolean;
  isActive: boolean;
}

export default function DocumentTypesSettingsPage() {
  const { toast } = useToast();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    expirationRequired: true,
  });

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (editingType) {
      setFormData({
        name: editingType.name,
        expirationRequired: editingType.expirationRequired,
      });
    } else {
      setFormData({
        name: "",
        expirationRequired: true,
      });
    }
  }, [editingType, showFormDialog]);

  async function fetchDocumentTypes() {
    try {
      const response = await fetch("/api/employee-document-types");
      if (response.ok) {
        const data = await response.json();
        setDocumentTypes(data.documentTypes || []);
      }
    } catch (error) {
      console.error("Failed to fetch document types:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load document types",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingType
        ? `/api/employee-document-types/${editingType.id}`
        : "/api/employee-document-types";
      const method = editingType ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save document type");
      }

      toast({
        title: "Success",
        description: editingType
          ? "Document type updated successfully"
          : "Document type created successfully",
      });

      setShowFormDialog(false);
      setEditingType(null);
      fetchDocumentTypes();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save document type",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/employee-document-types/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document type");

      toast({
        title: "Success",
        description: "Document type deleted successfully",
      });

      fetchDocumentTypes();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document type",
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  const defaultTypes = documentTypes.filter((t) => t.isDefault);
  const customTypes = documentTypes.filter((t) => !t.isDefault);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/facility/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Document Types</h1>
          <p className="text-muted-foreground">
            Manage document types for employee compliance tracking
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingType(null);
            setShowFormDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Type
        </Button>
      </div>

      {/* Default Document Types */}
      <Card>
        <CardHeader>
          <CardTitle>Default Document Types</CardTitle>
          <CardDescription>
            System-wide document types available to all facilities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Expiration Required</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaultTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      {type.expirationRequired ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Default</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {defaultTypes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No default document types found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Custom Document Types */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Document Types</CardTitle>
          <CardDescription>
            Custom document types specific to your facility
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Expiration Required</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    {type.expirationRequired ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>
                    <Badge>Custom</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingType(type);
                          setShowFormDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(type.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {customTypes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No custom document types. Click &quot;Add Custom Type&quot; to create
                    one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog
        open={showFormDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowFormDialog(false);
            setEditingType(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Document Type" : "Add Custom Document Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update the document type settings"
                : "Create a new document type for your facility"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="mt-1"
                placeholder="e.g., Background Check, Training Certificate"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="expirationRequired"
                checked={formData.expirationRequired}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    expirationRequired: checked === true,
                  })
                }
              />
              <Label htmlFor="expirationRequired" className="font-normal">
                Expiration date required for this document type
              </Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowFormDialog(false);
                  setEditingType(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingType ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document type? If there are
              existing documents of this type, the type will be deactivated
              instead of deleted.
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
    </div>
  );
}
