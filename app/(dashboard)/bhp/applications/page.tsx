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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function FacilityApplicationsPage() {
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

  const applications = await prisma.facilityApplication.findMany({
    where: {
      bhpId: bhpProfile.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingApplications = applications.filter((a) => a.status === "PENDING");
  const approvedApplications = applications.filter((a) => a.status === "APPROVED");
  const rejectedApplications = applications.filter((a) => a.status === "REJECTED");

  const ApplicationTable = ({ items }: { items: typeof applications }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Applicant</TableHead>
          <TableHead>Facility Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Applied</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((application) => (
          <TableRow key={application.id}>
            <TableCell>
              <div>
                <p className="font-medium">{application.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {application.user.email}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {application.facilityName}
              </div>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {application.facilityAddress}
            </TableCell>
            <TableCell>{formatDate(application.createdAt)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  application.status === "APPROVED"
                    ? "success"
                    : application.status === "REJECTED"
                    ? "danger"
                    : "warning"
                }
              >
                {application.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/bhp/applications/${application.id}`}>
                <Button variant="outline" size="sm">
                  {application.status === "PENDING" ? "Review" : "View"}
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <CheckCircle className="h-8 w-8 mb-2" />
      <p>{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bhp">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Facility Applications
          </h1>
          <p className="text-muted-foreground">
            Review and manage facility registration requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedApplications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Facility users who want to register under your BHP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedApplications.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedApplications.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              {pendingApplications.length > 0 ? (
                <ApplicationTable items={pendingApplications} />
              ) : (
                <EmptyState message="No pending applications" />
              )}
            </TabsContent>
            <TabsContent value="approved">
              {approvedApplications.length > 0 ? (
                <ApplicationTable items={approvedApplications} />
              ) : (
                <EmptyState message="No approved applications" />
              )}
            </TabsContent>
            <TabsContent value="rejected">
              {rejectedApplications.length > 0 ? (
                <ApplicationTable items={rejectedApplications} />
              ) : (
                <EmptyState message="No rejected applications" />
              )}
            </TabsContent>
            <TabsContent value="all">
              {applications.length > 0 ? (
                <ApplicationTable items={applications} />
              ) : (
                <EmptyState message="No applications yet" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
