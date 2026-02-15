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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileText,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { formatDate, getExpirationStatus } from "@/lib/utils";

export default async function BHPDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      facilities: {
        include: {
          intakes: {
            where: { status: "PENDING" },
          },
          documents: true,
        },
      },
      credentials: true,
    },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  // Calculate stats
  const totalFacilities = bhpProfile.facilities.length;
  const pendingIntakes = bhpProfile.facilities.reduce(
    (acc, f) => acc + f.intakes.length,
    0
  );

  // Get expiring credentials
  const expiringCredentials = bhpProfile.credentials.filter((c) => {
    const status = getExpirationStatus(c.expiresAt);
    return status === "expiring" || status === "expired";
  });

  // Get out-of-compliance facilities
  const outOfComplianceFacilities = bhpProfile.facilities.filter((f) =>
    f.documents.some((d) => {
      const status = getExpirationStatus(d.expiresAt);
      return status === "expired" || d.status === "REQUESTED";
    })
  );

  // Get recent intakes
  const recentIntakes = await prisma.intake.findMany({
    where: {
      facility: {
        bhpId: bhpProfile.id,
      },
      status: "PENDING",
    },
    include: {
      facility: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get pending facility applications
  const pendingApplications = await prisma.facilityApplication.count({
    where: {
      bhpId: bhpProfile.id,
      status: "PENDING",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Applications
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/bhp/applications" className="text-primary hover:underline">
                Review facility applications
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Facilities
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFacilities}</div>
            <p className="text-xs text-muted-foreground">
              Active facilities under your care
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Intakes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingIntakes}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Issues
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outOfComplianceFacilities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Facilities need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expiring Credentials
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringCredentials.length}</div>
            <p className="text-xs text-muted-foreground">
              Need renewal soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Intakes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Intakes
              <Link href="/bhp/intakes">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Intakes awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentIntakes.length > 0 ? (
              <div className="space-y-4">
                {recentIntakes.map((intake) => (
                  <div
                    key={intake.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{intake.residentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {intake.facility.name} -{" "}
                        {formatDate(intake.createdAt)}
                      </p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending intakes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Compliance Alerts
              <Link href="/bhp/documents">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Facilities with document issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {outOfComplianceFacilities.length > 0 ? (
              <div className="space-y-4">
                {outOfComplianceFacilities.slice(0, 5).map((facility) => (
                  <div
                    key={facility.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{facility.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {
                          facility.documents.filter(
                            (d) =>
                              getExpirationStatus(d.expiresAt) === "expired" ||
                              d.status === "REQUESTED"
                          ).length
                        }{" "}
                        document(s) need attention
                      </p>
                    </div>
                    <Badge variant="danger">Action Required</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All facilities are in compliance
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {pendingApplications > 0 && (
              <Link href="/bhp/applications">
                <Button variant="default" className="bg-yellow-600 hover:bg-yellow-700">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Review Applications ({pendingApplications})
                </Button>
              </Link>
            )}
            <Link href="/bhp/facilities/new">
              <Button>
                <Building2 className="mr-2 h-4 w-4" />
                Add Facility
              </Button>
            </Link>
            <Link href="/bhp/credentials">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Upload Credential
              </Button>
            </Link>
            <Link href="/bhp/messages">
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Messages
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
