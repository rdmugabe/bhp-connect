"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Settings, Eye, Mail, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { EmployeeComplianceBadge } from "@/components/employees/employee-compliance-badge";
import { EmployeeEmailDialog } from "@/components/employees/employee-email-dialog";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string;
  hireDate: string | null;
  isActive: boolean;
  complianceStatus: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "COMPLIANT" | "NON_COMPLIANT";
  missingCertifications: string[];
  expiredCertifications: string[];
  expiringSoonCertifications: string[];
  totalRequired: number;
  totalCompleted: number;
  totalDocuments: number;
  employeeDocuments: {
    id: string;
    documentType: { name: string };
    expiresAt: string | null;
    status: string;
  }[];
  documents: {
    id: string;
    name: string;
    status: string;
    expiresAt: string | null;
  }[];
}

export default function FacilityEmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [bhpEmail, setBhpEmail] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isReactivating, setIsReactivating] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, [showInactive]);

  async function fetchEmployees() {
    setIsLoading(true);
    try {
      const url = showInactive ? "/api/employees?includeInactive=true" : "/api/employees"
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
        if (data.bhpEmail) {
          setBhpEmail(data.bhpEmail);
        }
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load employees",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenEmailDialog = (employeeId: string, employeeName: string) => {
    setSelectedEmployee({ id: employeeId, name: employeeName });
    setEmailDialogOpen(true);
  };

  async function handleReactivate(employeeId: string) {
    setIsReactivating(employeeId);
    try {
      const response = await fetch(`/api/employees/${employeeId}/reactivate`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Employee reactivated successfully",
        });
        fetchEmployees();
      } else {
        throw new Error("Failed to reactivate");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reactivate employee",
      });
    } finally {
      setIsReactivating(null);
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(searchLower) ||
      emp.lastName.toLowerCase().includes(searchLower) ||
      emp.position.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  const activeEmployees = employees.filter((e) => e.isActive);
  const inactiveEmployees = employees.filter((e) => !e.isActive);

  const stats = {
    total: activeEmployees.length,
    compliant: activeEmployees.filter((e) => e.complianceStatus === "VALID" || e.complianceStatus === "COMPLIANT").length,
    expiringSoon: activeEmployees.filter((e) => e.complianceStatus === "EXPIRING_SOON").length,
    nonCompliant: activeEmployees.filter((e) => e.complianceStatus === "EXPIRED" || e.complianceStatus === "NON_COMPLIANT").length,
    inactive: inactiveEmployees.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employees and track document compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/facility/settings/document-types">
              <Settings className="h-4 w-4 mr-2" />
              Document Types
            </Link>
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {stats.compliant}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-yellow-600">
              {stats.expiringSoon}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Non-Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">
              {stats.nonCompliant}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>
                Click on an employee to view and manage their documents
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={(checked) => setShowInactive(checked === true)}
                />
                <Label htmlFor="show-inactive" className="text-sm text-muted-foreground cursor-pointer">
                  Show inactive ({stats.inactive})
                </Label>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading employees...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Compliance</TableHead>
                  {showInactive && <TableHead>Status</TableHead>}
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className={!employee.isActive ? "opacity-60" : ""}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.email || "-"}</TableCell>
                    <TableCell>
                      {employee.hireDate
                        ? formatDate(employee.hireDate)
                        : "-"}
                    </TableCell>
                    <TableCell>{employee.totalDocuments || 0}</TableCell>
                    <TableCell>
                      {employee.isActive ? (
                        <EmployeeComplianceBadge
                          status={employee.complianceStatus}
                          missingCertifications={employee.missingCertifications}
                          expiredCertifications={employee.expiredCertifications}
                          expiringSoonCertifications={employee.expiringSoonCertifications}
                          totalRequired={employee.totalRequired}
                          totalCompleted={employee.totalCompleted}
                        />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {showInactive && (
                      <TableCell>
                        {employee.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/facility/employees/${employee.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {employee.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleOpenEmailDialog(
                                employee.id,
                                `${employee.firstName} ${employee.lastName}`
                              )
                            }
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReactivate(employee.id)}
                            disabled={isReactivating === employee.id}
                            title="Reactivate employee"
                          >
                            <RotateCcw className={`h-4 w-4 ${isReactivating === employee.id ? "animate-spin" : ""}`} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={showInactive ? 8 : 7}
                      className="text-center text-muted-foreground py-8"
                    >
                      {searchQuery
                        ? "No employees found matching your search"
                        : "No employees added yet. Click 'Add Employee' to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={showAddDialog || !!editingEmployee}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingEmployee(null);
          }
        }}
        employee={editingEmployee}
        onSuccess={fetchEmployees}
      />

      {selectedEmployee && bhpEmail && (
        <EmployeeEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          bhpEmail={bhpEmail}
        />
      )}
    </div>
  );
}
