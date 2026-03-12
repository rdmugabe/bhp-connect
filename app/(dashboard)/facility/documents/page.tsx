"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, ExternalLink, FileText, Settings, Plus, FolderOpen, Building2, User, Users, Trash2, Download, Pencil, Archive, ArchiveRestore, ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, getExpirationStatus } from "@/lib/utils";

interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  bhpId: string | null;
  facilityId: string | null;
  _count: {
    documents: number;
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface Resident {
  id: string;
  residentName: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  ownerType: "FACILITY" | "EMPLOYEE" | "RESIDENT";
  categoryId: string | null;
  category: DocumentCategory | null;
  employee: Employee | null;
  intake: (Resident & {
    admissionDate?: string | null;
    dischargedAt?: string | null;
    createdAt?: string;
  }) | null;
  fileUrl: string | null;
  expiresAt: string | null;
  status: string;
  uploadedAt: string | null;
  requestedAt: string | null;
  archivedAt: string | null;
}

interface GroupedArchivedDocs {
  intakeId: string;
  residentName: string;
  admissionDate: string | null;
  dischargedAt: string | null;
  documents: Document[];
}

interface GroupedActiveDocs {
  id: string;
  type: "FACILITY" | "EMPLOYEE" | "RESIDENT";
  name: string;
  subtitle?: string;
  documents: Document[];
}

export default function FacilityDocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [archivedDocuments, setArchivedDocuments] = useState<Document[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategoryId, setNewDocCategoryId] = useState("");
  const [newDocOwnerType, setNewDocOwnerType] = useState<"FACILITY" | "EMPLOYEE" | "RESIDENT">("FACILITY");
  const [newDocEmployeeId, setNewDocEmployeeId] = useState("");
  const [newDocIntakeId, setNewDocIntakeId] = useState("");
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editOwnerType, setEditOwnerType] = useState<"FACILITY" | "EMPLOYEE" | "RESIDENT">("FACILITY");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editIntakeId, setEditIntakeId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["facility"])); // Facility expanded by default
  const [expandedAdmissions, setExpandedAdmissions] = useState<Set<string>>(new Set());

  // Separate requested and uploaded documents
  const requestedDocs = documents.filter((d) => d.status === "REQUESTED");
  const uploadedDocs = documents.filter((d) => d.status !== "REQUESTED");

  // Group active documents by owner type
  const groupedActiveDocs = useMemo(() => {
    const groups: GroupedActiveDocs[] = [];
    const facilityDocs: Document[] = [];
    const employeeGroups: Map<string, { name: string; documents: Document[] }> = new Map();
    const residentGroups: Map<string, { name: string; admissionDate: string | null; documents: Document[] }> = new Map();

    uploadedDocs.forEach((doc) => {
      if (doc.ownerType === "FACILITY") {
        facilityDocs.push(doc);
      } else if (doc.ownerType === "EMPLOYEE" && doc.employee) {
        const key = doc.employee.id;
        if (!employeeGroups.has(key)) {
          employeeGroups.set(key, {
            name: `${doc.employee.firstName} ${doc.employee.lastName}`,
            documents: [],
          });
        }
        employeeGroups.get(key)!.documents.push(doc);
      } else if (doc.ownerType === "RESIDENT" && doc.intake) {
        const key = doc.intake.id;
        if (!residentGroups.has(key)) {
          residentGroups.set(key, {
            name: doc.intake.residentName,
            admissionDate: doc.intake.admissionDate || doc.intake.createdAt || null,
            documents: [],
          });
        }
        residentGroups.get(key)!.documents.push(doc);
      }
    });

    // Add facility group first
    if (facilityDocs.length > 0) {
      groups.push({
        id: "facility",
        type: "FACILITY",
        name: "Facility Documents",
        documents: facilityDocs,
      });
    }

    // Add employee groups
    employeeGroups.forEach((value, key) => {
      groups.push({
        id: `employee-${key}`,
        type: "EMPLOYEE",
        name: value.name,
        subtitle: "Employee",
        documents: value.documents,
      });
    });

    // Add resident groups
    residentGroups.forEach((value, key) => {
      groups.push({
        id: `resident-${key}`,
        type: "RESIDENT",
        name: value.name,
        subtitle: value.admissionDate ? `Admitted: ${formatDate(value.admissionDate)}` : "Resident",
        documents: value.documents,
      });
    });

    return groups;
  }, [uploadedDocs]);

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Group archived documents by admission period
  const groupedArchivedDocs = useMemo(() => {
    const groups: GroupedArchivedDocs[] = [];
    const facilityDocs: Document[] = [];

    archivedDocuments.forEach((doc) => {
      if (doc.ownerType === "RESIDENT" && doc.intake) {
        let group = groups.find((g) => g.intakeId === doc.intake!.id);
        if (!group) {
          group = {
            intakeId: doc.intake.id,
            residentName: doc.intake.residentName,
            admissionDate: doc.intake.admissionDate || doc.intake.createdAt || null,
            dischargedAt: doc.intake.dischargedAt || null,
            documents: [],
          };
          groups.push(group);
        }
        group.documents.push(doc);
      } else {
        facilityDocs.push(doc);
      }
    });

    // Sort groups by discharge date (most recent first)
    groups.sort((a, b) => {
      if (!a.dischargedAt) return 1;
      if (!b.dischargedAt) return -1;
      return new Date(b.dischargedAt).getTime() - new Date(a.dischargedAt).getTime();
    });

    // Add facility docs as a separate group if any
    if (facilityDocs.length > 0) {
      groups.push({
        intakeId: "facility",
        residentName: "Facility Documents",
        admissionDate: null,
        dischargedAt: null,
        documents: facilityDocs,
      });
    }

    return groups;
  }, [archivedDocuments]);

  const toggleAdmissionExpanded = (intakeId: string) => {
    setExpandedAdmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(intakeId)) {
        newSet.delete(intakeId);
      } else {
        newSet.add(intakeId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchDocuments();
    fetchArchivedDocuments();
    fetchCategories();
    fetchEmployees();
    fetchResidents();
  }, []);

  async function fetchDocuments() {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setArchivedCount(data.archivedCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  }

  async function fetchArchivedDocuments() {
    try {
      const response = await fetch("/api/documents?archived=true");
      if (response.ok) {
        const data = await response.json();
        setArchivedDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch archived documents:", error);
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

  async function fetchEmployees() {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  }

  async function fetchResidents() {
    try {
      // Fetch only active (non-discharged), approved residents
      const response = await fetch("/api/intakes?status=APPROVED&active=true");
      if (response.ok) {
        const data = await response.json();
        setResidents(data.intakes || []);
      }
    } catch (error) {
      console.error("Failed to fetch residents:", error);
    }
  }

  async function handleUpload(documentId: string) {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "document");
      formData.append("entityId", documentId);
      if (expiresAt) {
        formData.append("expiresAt", expiresAt);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload document");

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setUploadingDocId(null);
      setSelectedFile(null);
      setExpiresAt("");
      fetchDocuments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNewDocUpload() {
    if (!selectedFile || !newDocName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a name and select a file",
      });
      return;
    }

    if (newDocOwnerType === "EMPLOYEE" && !newDocEmployeeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an employee",
      });
      return;
    }

    if (newDocOwnerType === "RESIDENT" && !newDocIntakeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a resident",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "facility-document");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      const uploadData = await uploadResponse.json();

      // Then create the document record
      const docResponse = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName,
          type: newDocCategoryId
            ? categories.find((c) => c.id === newDocCategoryId)?.name || "Other"
            : "Other",
          categoryId: newDocCategoryId || null,
          fileUrl: uploadData.fileUrl,
          expiresAt: expiresAt || null,
          ownerType: newDocOwnerType,
          employeeId: newDocOwnerType === "EMPLOYEE" ? newDocEmployeeId : null,
          intakeId: newDocOwnerType === "RESIDENT" ? newDocIntakeId : null,
        }),
      });

      if (!docResponse.ok) throw new Error("Failed to create document");

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setShowNewDocDialog(false);
      setSelectedFile(null);
      setExpiresAt("");
      setNewDocName("");
      setNewDocCategoryId("");
      setNewDocOwnerType("FACILITY");
      setNewDocEmployeeId("");
      setNewDocIntakeId("");
      fetchDocuments();
      fetchCategories();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document",
      });
    } finally {
      setIsLoading(false);
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
      fetchCategories();
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

  function openEditDialog(doc: Document) {
    setEditingDoc(doc);
    setEditOwnerType(doc.ownerType);
    setEditEmployeeId(doc.employee?.id || "");
    setEditIntakeId(doc.intake?.id || "");
  }

  async function handleUpdateAssignment() {
    if (!editingDoc) return;

    if (editOwnerType === "EMPLOYEE" && !editEmployeeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an employee",
      });
      return;
    }

    if (editOwnerType === "RESIDENT" && !editIntakeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a resident",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/documents/${editingDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType: editOwnerType,
          employeeId: editOwnerType === "EMPLOYEE" ? editEmployeeId : null,
          intakeId: editOwnerType === "RESIDENT" ? editIntakeId : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update document");

      toast({
        title: "Success",
        description: "Document assignment updated successfully",
      });

      setEditingDoc(null);
      fetchDocuments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document assignment",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    if (status === "REQUESTED") {
      return <Badge variant="warning">Upload Required</Badge>;
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

  // Group by category for required categories
  const bhpCategories = categories.filter((c) => c.bhpId !== null);
  const requiredCategories = bhpCategories.filter((c) => c.isRequired);
  const missingRequired = requiredCategories.filter(
    (cat) => !uploadedDocs.some((doc) => doc.categoryId === cat.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Upload and manage facility documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/facility/settings/document-categories">
              <Settings className="h-4 w-4 mr-2" />
              Categories
            </Link>
          </Button>
          <Button onClick={() => setShowNewDocDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Missing Required Categories Alert */}
      {missingRequired.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <FileText className="h-5 w-5" />
              Missing Required Documents
            </CardTitle>
            <CardDescription className="text-red-700">
              Your BHP requires documents in these categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missingRequired.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewDocCategoryId(cat.id);
                      setShowNewDocDialog(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requested Documents */}
      {requestedDocs.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <FileText className="h-5 w-5" />
              Documents Requested by BHP
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Your BHP has requested the following documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requestedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between bg-white p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {doc.type} | Requested:{" "}
                      {doc.requestedAt
                        ? formatDate(doc.requestedAt)
                        : "Unknown"}
                    </p>
                  </div>
                  <Dialog
                    open={uploadingDocId === doc.id}
                    onOpenChange={(open) =>
                      setUploadingDocId(open ? doc.id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload {doc.name}</DialogTitle>
                        <DialogDescription>
                          Upload the requested document
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>File</Label>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) =>
                              setSelectedFile(e.target.files?.[0] || null)
                            }
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, Word, or image files up to 10MB
                          </p>
                        </div>
                        <div>
                          <Label>Expiration Date (Optional)</Label>
                          <Input
                            type="date"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setUploadingDocId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleUpload(doc.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents with Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "archived")} className="w-full">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Active Documents
            <Badge variant="secondary" className="ml-1">
              {uploadedDocs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived
            <Badge variant="outline" className="ml-1">
              {archivedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Documents
              </CardTitle>
              <CardDescription>
                Documents organized by facility, employees, and residents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupedActiveDocs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-4">
                  {groupedActiveDocs.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const getGroupIcon = () => {
                      switch (group.type) {
                        case "FACILITY":
                          return <Building2 className="h-4 w-4" />;
                        case "EMPLOYEE":
                          return <User className="h-4 w-4" />;
                        case "RESIDENT":
                          return <Users className="h-4 w-4" />;
                      }
                    };

                    return (
                      <div
                        key={group.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroupExpanded(group.id)}
                          className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                {getGroupIcon()}
                                <span className="font-medium">{group.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {group.documents.length} document{group.documents.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                              {group.subtitle && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span>{group.subtitle}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Documents List */}
                        {isExpanded && (
                          <div className="border-t">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Document</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Uploaded</TableHead>
                                  <TableHead>Expires</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="w-[120px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.documents.map((doc) => (
                                  <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                      {doc.name}
                                    </TableCell>
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
                                        <span className="text-muted-foreground">
                                          {doc.type}
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {doc.uploadedAt ? formatDate(doc.uploadedAt) : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                      {doc.expiresAt ? formatDate(doc.expiresAt) : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(doc.status, doc.expiresAt)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        {doc.fileUrl && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            title="Download"
                                          >
                                            <a
                                              href={`/api/documents/download?key=${encodeURIComponent(doc.fileUrl)}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Download className="h-4 w-4" />
                                            </a>
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openEditDialog(doc)}
                                          title="Edit Assignment"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
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
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Archived Documents
              </CardTitle>
              <CardDescription>
                Documents from discharged patients, grouped by admission period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupedArchivedDocs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No archived documents
                </p>
              ) : (
                <div className="space-y-4">
                  {groupedArchivedDocs.map((group) => {
                    const isExpanded = expandedAdmissions.has(group.intakeId);
                    const isFacilityGroup = group.intakeId === "facility";

                    return (
                      <div
                        key={group.intakeId}
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* Admission Header */}
                        <button
                          onClick={() => toggleAdmissionExpanded(group.intakeId)}
                          className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                {isFacilityGroup ? (
                                  <Building2 className="h-4 w-4" />
                                ) : (
                                  <Users className="h-4 w-4" />
                                )}
                                <span className="font-medium">{group.residentName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {group.documents.length} document{group.documents.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                              {!isFacilityGroup && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Admitted: {group.admissionDate ? formatDate(group.admissionDate) : "N/A"}
                                  </span>
                                  {group.dischargedAt && (
                                    <span>
                                      Discharged: {formatDate(group.dischargedAt)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Documents List */}
                        {isExpanded && (
                          <div className="border-t">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Document</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Uploaded</TableHead>
                                  <TableHead>Archived</TableHead>
                                  <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.documents.map((doc) => (
                                  <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                      {doc.name}
                                    </TableCell>
                                    <TableCell>
                                      {doc.category ? (
                                        <div className="flex items-center gap-1">
                                          <FolderOpen className="h-3 w-3 text-muted-foreground" />
                                          <span>{doc.category.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">
                                          {doc.type}
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {doc.uploadedAt ? formatDate(doc.uploadedAt) : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                      {doc.archivedAt ? formatDate(doc.archivedAt) : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                      {doc.fileUrl && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          asChild
                                          title="Download"
                                        >
                                          <a
                                            href={`/api/documents/download?key=${encodeURIComponent(doc.fileUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Download className="h-4 w-4" />
                                          </a>
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Document Upload Dialog */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
            <DialogDescription>
              Upload a new document for your facility, employee, or resident
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Name *</Label>
              <Input
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="e.g., Business License 2024"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Owner Type *</Label>
              <Select
                value={newDocOwnerType}
                onValueChange={(value: "FACILITY" | "EMPLOYEE" | "RESIDENT") => {
                  setNewDocOwnerType(value);
                  setNewDocEmployeeId("");
                  setNewDocIntakeId("");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACILITY">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Facility
                    </div>
                  </SelectItem>
                  <SelectItem value="EMPLOYEE">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Employee
                    </div>
                  </SelectItem>
                  <SelectItem value="RESIDENT">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Resident
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newDocOwnerType === "EMPLOYEE" && (
              <div>
                <Label>Select Employee *</Label>
                <Select value={newDocEmployeeId} onValueChange={setNewDocEmployeeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newDocOwnerType === "RESIDENT" && (
              <div>
                <Label>Select Resident *</Label>
                <Select value={newDocIntakeId} onValueChange={setNewDocIntakeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((res) => (
                      <SelectItem key={res.id} value={res.id}>
                        {res.residentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Category</Label>
              <Select
                value={newDocCategoryId}
                onValueChange={setNewDocCategoryId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                      {cat.isRequired && " (Required)"}
                      {cat.bhpId && " - BHP"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File *</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] || null)
                }
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Word, or image files up to 10MB
              </p>
            </div>
            <div>
              <Label>Expiration Date (Optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewDocDialog(false);
                  setNewDocName("");
                  setNewDocCategoryId("");
                  setNewDocOwnerType("FACILITY");
                  setNewDocEmployeeId("");
                  setNewDocIntakeId("");
                  setSelectedFile(null);
                  setExpiresAt("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleNewDocUpload} disabled={isLoading}>
                {isLoading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Edit Assignment Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document Assignment</DialogTitle>
            <DialogDescription>
              Change the owner assignment for &quot;{editingDoc?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Assignment</Label>
              <div className="mt-1 p-2 bg-muted rounded text-sm">
                {editingDoc?.ownerType === "FACILITY" && "Facility"}
                {editingDoc?.ownerType === "EMPLOYEE" && (
                  <>Employee: {editingDoc.employee?.firstName} {editingDoc.employee?.lastName}</>
                )}
                {editingDoc?.ownerType === "RESIDENT" && (
                  <>Resident: {editingDoc.intake?.residentName}</>
                )}
              </div>
            </div>

            <div>
              <Label>New Owner Type *</Label>
              <Select
                value={editOwnerType}
                onValueChange={(value: "FACILITY" | "EMPLOYEE" | "RESIDENT") => {
                  setEditOwnerType(value);
                  setEditEmployeeId("");
                  setEditIntakeId("");
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACILITY">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Facility
                    </div>
                  </SelectItem>
                  <SelectItem value="EMPLOYEE">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Employee
                    </div>
                  </SelectItem>
                  <SelectItem value="RESIDENT">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Resident
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editOwnerType === "EMPLOYEE" && (
              <div>
                <Label>Select Employee *</Label>
                <Select value={editEmployeeId} onValueChange={setEditEmployeeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editOwnerType === "RESIDENT" && (
              <div>
                <Label>Select Resident *</Label>
                <Select value={editIntakeId} onValueChange={setEditIntakeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((res) => (
                      <SelectItem key={res.id} value={res.id}>
                        {res.residentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingDoc(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateAssignment} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
