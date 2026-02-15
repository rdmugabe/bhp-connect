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
  Users,
  Building2,
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Get counts for pending approvals
  const pendingBHPCount = await prisma.user.count({
    where: {
      role: "BHP",
      approvalStatus: "PENDING",
    },
  });

  const pendingBHRFCount = await prisma.user.count({
    where: {
      role: "BHRF",
      approvalStatus: "PENDING",
    },
  });

  // Get total users by role
  const totalBHPs = await prisma.user.count({
    where: { role: "BHP" },
  });

  const totalBHRFs = await prisma.user.count({
    where: { role: "BHRF" },
  });

  const totalFacilities = await prisma.facility.count();

  // Get recent pending BHP registrations
  const recentPendingBHPs = await prisma.user.findMany({
    where: {
      role: "BHP",
      approvalStatus: "PENDING",
    },
    include: {
      bhpProfile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage user approvals and system settings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending BHP Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBHPCount}</div>
            <p className="text-xs text-muted-foreground">
              BHPs awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total BHPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBHPs}</div>
            <p className="text-xs text-muted-foreground">
              Registered BHP users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFacilities}</div>
            <p className="text-xs text-muted-foreground">
              Active facilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total BHRF Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBHRFs}</div>
            <p className="text-xs text-muted-foreground">
              Registered facility users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending BHP Registrations
              <Link href="/admin/users/pending">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              BHP users awaiting your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPendingBHPs.length > 0 ? (
              <div className="space-y-4">
                {recentPendingBHPs.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email} - Registered {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="mr-2 h-4 w-4" />
                No pending BHP approvals
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Statistics</CardTitle>
            <CardDescription>
              Overview of user registration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  <span className="text-sm">Pending BHPs</span>
                </div>
                <Badge variant="warning">{pendingBHPCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  <span className="text-sm">Pending BHRFs</span>
                </div>
                <Badge variant="warning">{pendingBHRFCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <span className="text-sm">Total BHPs</span>
                </div>
                <Badge variant="success">{totalBHPs}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  <span className="text-sm">Total BHRFs</span>
                </div>
                <Badge>{totalBHRFs}</Badge>
              </div>
            </div>
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
            <Link href="/admin/users/pending">
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Review Pending Users
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
