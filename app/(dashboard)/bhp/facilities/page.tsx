import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, Building2, MoreHorizontal, Users, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

function getComplianceStatus(employees: { employeeDocuments: { expiresAt: Date | null; noExpiration: boolean }[] }[]) {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  let hasExpired = false;
  let hasExpiringSoon = false;

  employees.forEach((emp) => {
    emp.employeeDocuments.forEach((doc) => {
      if (doc.noExpiration) return;
      if (doc.expiresAt) {
        if (doc.expiresAt < now) {
          hasExpired = true;
        } else if (doc.expiresAt <= thirtyDaysFromNow) {
          hasExpiringSoon = true;
        }
      }
    });
  });

  return hasExpired ? "EXPIRED" : hasExpiringSoon ? "EXPIRING_SOON" : "VALID";
}

function ComplianceBadge({ status }: { status: "VALID" | "EXPIRING_SOON" | "EXPIRED" }) {
  if (status === "VALID") {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Compliant
      </Badge>
    );
  }
  if (status === "EXPIRING_SOON") {
    return (
      <Badge variant="warning" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Expiring Soon
      </Badge>
    );
  }
  return (
    <Badge variant="danger" className="gap-1">
      <XCircle className="h-3 w-3" />
      Non-Compliant
    </Badge>
  );
}

export default async function FacilitiesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  const facilities = await prisma.facility.findMany({
    where: { bhpId: bhpProfile.id },
    include: {
      owner: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      employees: {
        where: { isActive: true },
        include: {
          employeeDocuments: {
            select: {
              expiresAt: true,
              noExpiration: true,
            },
          },
        },
      },
      _count: {
        select: {
          intakes: true,
          documents: true,
          employees: { where: { isActive: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground">
            Manage your behavioral health residential facilities
          </p>
        </div>
        <Link href="/bhp/facilities/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Facility
          </Button>
        </Link>
      </div>

      {facilities.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facility</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Intakes</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((facility) => {
                  const complianceStatus = getComplianceStatus(facility.employees);
                  return (
                  <TableRow key={facility.id}>
                    <TableCell>
                      <Link href={`/bhp/facilities/${facility.id}`} className="hover:underline">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{facility.name}</span>
                            <p className="text-sm text-muted-foreground">{facility.address}</p>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {facility.owner ? (
                        <div>
                          <p className="font-medium">
                            {facility.owner.user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {facility.owner.user.email}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="outline">Not Assigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {facility._count.employees}
                      </div>
                    </TableCell>
                    <TableCell>
                      {facility._count.employees > 0 ? (
                        <ComplianceBadge status={complianceStatus} />
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{facility._count.intakes}</TableCell>
                    <TableCell>{facility._count.documents}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/bhp/facilities/${facility.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/bhp/facilities/${facility.id}/employees`}>
                              View Employees
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/bhp/facilities/${facility.id}/edit`}>
                              Edit Facility
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/bhp/facilities/${facility.id}/documents`}>
                              View Documents
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/bhp/facilities/${facility.id}/assign`}>
                              Assign Operator
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Facilities Yet</CardTitle>
            <CardDescription>
              Get started by adding your first facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/bhp/facilities/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Facility
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
