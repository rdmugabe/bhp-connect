"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { ArrowLeft, Search, Users, Eye, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmployeeComplianceBadge } from "@/components/employees/employee-compliance-badge";
import { EmployeeEmailDialog } from "@/components/employees/employee-email-dialog";

interface Facility {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string;
  hireDate: string | null;
  isActive: boolean;
  complianceStatus: "VALID" | "EXPIRING_SOON" | "EXPIRED";
  documents: {
    id: string;
    documentType: { name: string };
    expiresAt: string | null;
    status: string;
  }[];
}

export default function BHPFacilityEmployeesPage() {
  const params = useParams();
  const { toast } = useToast();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bhpEmail, setBhpEmail] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchFacility();
    fetchEmployees();
  }, [params.id]);

  async function fetchFacility() {
    try {
      const response = await fetch(`/api/facilities/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFacility(data.facility);
      }
    } catch (error) {
      console.error("Failed to fetch facility:", error);
    }
  }

  async function fetchEmployees() {
    try {
      const response = await fetch(`/api/employees?facilityId=${params.id}`);
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

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(searchLower) ||
      emp.lastName.toLowerCase().includes(searchLower) ||
      emp.position.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: employees.length,
    compliant: employees.filter((e) => e.complianceStatus === "VALID").length,
    expiringSoon: employees.filter((e) => e.complianceStatus === "EXPIRING_SOON").length,
    nonCompliant: employees.filter((e) => e.complianceStatus === "EXPIRED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/bhp/facilities/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {facility?.name} - Employees
          </h1>
          <p className="text-muted-foreground">
            View employee compliance status (read-only)
          </p>
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
                View employee documents and compliance status
              </CardDescription>
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
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
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
                    <TableCell>{employee.documents.length}</TableCell>
                    <TableCell>
                      <EmployeeComplianceBadge
                        status={employee.complianceStatus}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/bhp/facilities/${params.id}/employees/${employee.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      {searchQuery
                        ? "No employees found matching your search"
                        : "No employees at this facility yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
