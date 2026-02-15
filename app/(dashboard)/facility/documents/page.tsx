"use client";

import { useState, useEffect } from "react";
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
import { Upload, ExternalLink, FileText, Settings, Plus, FolderOpen, Building2, User, Users } from "lucide-react";
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
  intake: Resident | null;
  fileUrl: string | null;
  expiresAt: string | null;
  status: string;
  uploadedAt: string | null;
  requestedAt: string | null;
}

export default function FacilityDocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
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
  const [filterOwnerType, setFilterOwnerType] = useState<string>("ALL");

  useEffect(() => {
    fetchDocuments();
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
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
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
      const response = await fetch("/api/intakes?status=APPROVED");
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

  const requestedDocs = documents.filter((d) => d.status === "REQUESTED");
  const uploadedDocs = documents.filter((d) => d.status !== "REQUESTED");

  // Apply owner type filter
  const filteredDocs = filterOwnerType === "ALL"
    ? uploadedDocs
    : uploadedDocs.filter(d => d.ownerType === filterOwnerType);

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

      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                Documents you have uploaded for your facility
              </CardDescription>
            </div>
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
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
                    {doc.uploadedAt ? formatDate(doc.uploadedAt) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {doc.expiresAt ? formatDate(doc.expiresAt) : "N/A"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(doc.status, doc.expiresAt)}
                  </TableCell>
                  <TableCell>
                    {doc.fileUrl ? (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`/api/documents/download?key=${encodeURIComponent(doc.fileUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocs.length === 0 && (
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
    </div>
  );
}
