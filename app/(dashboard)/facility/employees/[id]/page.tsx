"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Pencil, Trash2, Upload, Mail, Phone, Calendar, Briefcase } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { EmployeeDocumentsTable } from "@/components/employees/employee-documents-table";
import { EmployeeDocumentForm } from "@/components/employees/employee-document-form";
import { EmployeeComplianceBadge } from "@/components/employees/employee-compliance-badge";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string;
  hireDate: string | null;
  isActive: boolean;
  facility: {
    id: string;
    name: string;
  };
  documents: {
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
  }[];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Employee["documents"][0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  async function fetchEmployee() {
    try {
      const response = await fetch(`/api/employees/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setEmployee(data.employee);
      } else if (response.status === 404) {
        router.push("/facility/employees");
      }
    } catch (error) {
      console.error("Failed to fetch employee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load employee details",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/employees/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to deactivate employee");

      toast({
        title: "Success",
        description: "Employee deactivated successfully",
      });

      router.push("/facility/employees");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate employee",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  function getComplianceStatus(): "VALID" | "EXPIRING_SOON" | "EXPIRED" {
    if (!employee) return "VALID";

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let hasExpired = false;
    let hasExpiringSoon = false;

    employee.documents.forEach((doc) => {
      if (doc.noExpiration) return;
      if (doc.expiresAt) {
        const expiresAt = new Date(doc.expiresAt);
        if (expiresAt < now) {
          hasExpired = true;
        } else if (expiresAt <= thirtyDaysFromNow) {
          hasExpiringSoon = true;
        }
      }
    });

    return hasExpired ? "EXPIRED" : hasExpiringSoon ? "EXPIRING_SOON" : "VALID";
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/facility/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-muted-foreground">{employee.position}</p>
        </div>
        <EmployeeComplianceBadge status={getComplianceStatus()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employee Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Information</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{employee.position}</p>
              </div>
            </div>
            {employee.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{employee.phone}</p>
                </div>
              </div>
            )}
            {employee.hireDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">{formatDate(employee.hireDate)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Card - spans 2 columns */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Manage employee certifications and compliance documents
                </CardDescription>
              </div>
              <Button onClick={() => setShowDocumentForm(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EmployeeDocumentsTable
              documents={employee.documents}
              onEdit={(doc) => {
                setEditingDocument(doc);
                setShowDocumentForm(true);
              }}
              onDelete={fetchEmployee}
            />
          </CardContent>
        </Card>
      </div>

      <EmployeeFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        employee={employee}
        onSuccess={fetchEmployee}
      />

      <EmployeeDocumentForm
        open={showDocumentForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowDocumentForm(false);
            setEditingDocument(null);
          }
        }}
        employeeId={employee.id}
        document={editingDocument}
        onSuccess={fetchEmployee}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {employee.firstName}{" "}
              {employee.lastName}? This will remove them from the active
              employee list but preserve their records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
