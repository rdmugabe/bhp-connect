"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentRequestSchema, type DocumentRequestInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, ExternalLink, Settings, FolderOpen, Building2, User, Users, Trash2, Download } from "lucide-react";
import { formatDate, getExpirationStatus } from "@/lib/utils";

interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  ownerType: "FACILITY" | "EMPLOYEE" | "RESIDENT";
  categoryId: string | null;
  category: DocumentCategory | null;
  employee: { id: string; firstName: string; lastName: string } | null;
  intake: { id: string; residentName: string } | null;
  fileUrl: string | null;
  expiresAt: string | null;
  status: string;
  uploadedAt: string | null;
  facility: {
    id: string;
    name: string;
  };
}

interface Facility {
  id: string;
  name: string;
}

export default function BHPDocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [filterOwnerType, setFilterOwnerType] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<DocumentRequestInput>({
    resolver: zodResolver(documentRequestSchema),
    defaultValues: {
      name: "",
      type: "",
    },
  });

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const response = await fetch("/api/facilities");
        if (response.ok) {
          const data = await response.json();
          setFacilities(data.facilities || []);
        }
      } catch (error) {
        console.error("Failed to fetch facilities:", error);
      }
    }
    async function fetchCategories() {
      try {
        const response = await fetch("/api/document-categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchFacilities();
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const url = selectedFacility && selectedFacility !== "all"
          ? `/api/documents?facilityId=${selectedFacility}`
          : "/api/documents";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      }
    }
    fetchDocuments();
  }, [selectedFacility]);

  async function onSubmit(data: DocumentRequestInput) {
    if (!selectedFacility || selectedFacility === "all") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a facility",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          facilityId: selectedFacility,
          categoryId: selectedCategoryId || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to request document");

      toast({
        title: "Success",
        description: "Document request sent to facility",
      });

      setIsDialogOpen(false);
      setSelectedCategoryId("");
      form.reset();

      // Refresh documents
      const refreshResponse = await fetch(
        `/api/documents?facilityId=${selectedFacility}`
      );
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setDocuments(refreshData.documents || []);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to request document",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDocuments() {
    try {
      const url = selectedFacility && selectedFacility !== "all"
        ? `/api/documents?facilityId=${selectedFacility}`
        : "/api/documents";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  }

  async function handleDelete(doc: Document) {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      setDeletingDoc(null);
      fetchDocuments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    if (status === "REQUESTED") {
      return <Badge variant="warning">Requested</Badge>;
    }
    if (status === "EXPIRED" || getExpirationStatus(expiresAt) === "expired") {
      return <Badge variant="danger">Expired</Badge>;
    }
    if (getExpirationStatus(expiresAt) === "expiring") {
      return <Badge variant="warning">Expiring Soon</Badge>;
    }
    return <Badge variant="success">Valid</Badge>;
  };

  const getOwnerBadge = (doc: Document) => {
    switch (doc.ownerType) {
      case "FACILITY":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Facility
          </Badge>
        );
      case "EMPLOYEE":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : "Employee"}
          </Badge>
        );
      case "RESIDENT":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {doc.intake?.residentName || "Resident"}
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter documents by owner type
  const filteredDocuments = filterOwnerType === "ALL"
    ? documents
    : documents.filter(d => d.ownerType === filterOwnerType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Facility Documents
          </h1>
          <p className="text-muted-foreground">
            Request and manage documents from your facilities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/bhp/settings/document-categories">
              <Settings className="h-4 w-4 mr-2" />
              Categories
            </Link>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request Document
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Document</DialogTitle>
              <DialogDescription>
                Request a document from a facility
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormItem>
                  <FormLabel>Facility</FormLabel>
                  <Select
                    value={selectedFacility}
                    onValueChange={setSelectedFacility}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities.map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Fire Safety Certificate"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Certificate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select
                    value={selectedCategoryId || "none"}
                    onValueChange={(value) => setSelectedCategoryId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                          {cat.isRequired && " (Required)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Requesting..." : "Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Facility:</span>
              <Select
                value={selectedFacility}
                onValueChange={setSelectedFacility}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Facilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Owner:</span>
              <Select value={filterOwnerType} onValueChange={setFilterOwnerType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Owners</SelectItem>
                  <SelectItem value="FACILITY">Facility</SelectItem>
                  <SelectItem value="EMPLOYEE">Employees</SelectItem>
                  <SelectItem value="RESIDENT">Residents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>{doc.facility.name}</TableCell>
                  <TableCell>{getOwnerBadge(doc)}</TableCell>
                  <TableCell>
                    {doc.category ? (
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3 text-muted-foreground" />
                        <span>{doc.category.name}</span>
                        {doc.category.isRequired && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{doc.type}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.expiresAt ? formatDate(doc.expiresAt) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(doc.status, doc.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {doc.fileUrl ? (
                        <Button variant="ghost" size="icon" asChild title="Download">
                          <a
                            href={`/api/documents/download?key=${encodeURIComponent(doc.fileUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Pending
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingDoc(doc)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingDoc?.name}&quot;? This action cannot be undone.
              The file will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDoc && handleDelete(deletingDoc)}
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
