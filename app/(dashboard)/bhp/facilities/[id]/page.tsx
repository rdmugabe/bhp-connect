import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
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
  ArrowLeft,
  Building2,
  Users,
  FileText,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

function getComplianceStats(employees: { employeeDocuments: { expiresAt: Date | null; noExpiration: boolean; status: string }[] }[]) {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  let compliant = 0;
  let expiringSoon = 0;
  let nonCompliant = 0;

  employees.forEach((emp) => {
    let hasExpired = false;
    let hasExpiringSoon = false;

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

    if (hasExpired) {
      nonCompliant++;
    } else if (hasExpiringSoon) {
      expiringSoon++;
    } else {
      compliant++;
    }
  });

  return { compliant, expiringSoon, nonCompliant, total: employees.length };
}

export default async function BHPFacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const { id } = await params;

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  const facility = await prisma.facility.findFirst({
    where: {
      id,
      bhpId: bhpProfile.id,
    },
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
              status: true,
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
  });

  if (!facility) {
    notFound();
  }

  const complianceStats = getComplianceStats(facility.employees);

  // Get recent documents
  const recentDocuments = await prisma.document.findMany({
    where: { facilityId: id },
    orderBy: { uploadedAt: "desc" },
    take: 5,
  });

  // Get expiring employee documents
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringDocs = await prisma.employeeDocument.findMany({
    where: {
      employee: {
        facilityId: id,
        isActive: true,
      },
      noExpiration: false,
      expiresAt: {
        lte: thirtyDaysFromNow,
      },
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      documentType: { select: { name: true } },
    },
    orderBy: { expiresAt: "asc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bhp/facilities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{facility.name}</h1>
          <p className="text-muted-foreground">{facility.address}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{complianceStats.total}</span>
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
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {complianceStats.compliant}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">
                {complianceStats.expiringSoon}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Non-Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {complianceStats.nonCompliant}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Facility Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facility Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{facility.address}</p>
              </div>
            </div>
            {facility.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{facility.phone}</p>
                </div>
              </div>
            )}
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-2">Operator</p>
              {facility.owner ? (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-medium">{facility.owner.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {facility.owner.user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <Badge variant="outline">Not Assigned</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/bhp/facilities/${id}/employees`}>
                <Users className="h-4 w-4 mr-2" />
                View Employees ({facility._count.employees})
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/bhp/facilities/${id}/documents`}>
                <FolderOpen className="h-4 w-4 mr-2" />
                View Documents ({facility._count.documents})
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/bhp/intakes?facility=${id}`}>
                <FileText className="h-4 w-4 mr-2" />
                View Intakes ({facility._count.intakes})
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Expiring Documents Alert */}
        <Card className={expiringDocs.length > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${expiringDocs.length > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
              Expiring Documents
            </CardTitle>
            <CardDescription>
              Employee documents expiring within 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiringDocs.length > 0 ? (
              <div className="space-y-3">
                {expiringDocs.map((doc) => (
                  <div key={doc.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium">
                        {doc.employee.firstName} {doc.employee.lastName}
                      </p>
                      <p className="text-muted-foreground">{doc.documentType.name}</p>
                    </div>
                    <Badge variant={doc.expiresAt && doc.expiresAt < new Date() ? "danger" : "warning"}>
                      {doc.expiresAt ? formatDate(doc.expiresAt) : "N/A"}
                    </Badge>
                  </div>
                ))}
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href={`/bhp/facilities/${id}/employees`}>
                    View all employees
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents expiring soon
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Facility Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Facility Documents</CardTitle>
              <CardDescription>
                Documents uploaded by this facility
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/bhp/facilities/${id}/documents`}>View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        doc.status === "APPROVED"
                          ? "success"
                          : doc.status === "EXPIRED"
                          ? "danger"
                          : doc.status === "UPLOADED"
                          ? "secondary"
                          : "warning"
                      }
                    >
                      {doc.status}
                    </Badge>
                    {doc.uploadedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(doc.uploadedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents uploaded yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
