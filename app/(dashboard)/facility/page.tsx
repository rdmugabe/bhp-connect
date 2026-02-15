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
  FileText,
  FolderOpen,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { formatDate, getExpirationStatus } from "@/lib/utils";

export default async function FacilityDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      facility: {
        include: {
          bhp: {
            include: {
              user: true,
            },
          },
          intakes: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          documents: true,
        },
      },
    },
  });

  if (!bhrfProfile) {
    // BHRF not yet assigned to a facility
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Facility Not Assigned</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Your account has not been assigned to a facility yet. Please contact
          your BHP administrator to complete your registration.
        </p>
      </div>
    );
  }

  const { facility } = bhrfProfile;

  // Calculate stats
  const pendingIntakes = facility.intakes.filter(
    (i) => i.status === "PENDING"
  ).length;
  const approvedIntakes = facility.intakes.filter(
    (i) => i.status === "APPROVED"
  ).length;
  const conditionalIntakes = facility.intakes.filter(
    (i) => i.status === "CONDITIONAL"
  ).length;
  const deniedIntakes = facility.intakes.filter(
    (i) => i.status === "DENIED"
  ).length;

  // Get document stats
  const requestedDocuments = facility.documents.filter(
    (d) => d.status === "REQUESTED"
  ).length;
  const expiringDocuments = facility.documents.filter((d) => {
    const status = getExpirationStatus(d.expiresAt);
    return status === "expiring" || status === "expired";
  }).length;

  // Calculate compliance health
  const totalDocIssues = requestedDocuments + expiringDocuments;
  const complianceStatus =
    totalDocIssues === 0 ? "good" : totalDocIssues <= 2 ? "warning" : "danger";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{facility.name}</h1>
        <p className="text-muted-foreground">
          Managed by {facility.bhp.user.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Intakes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingIntakes}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting BHP review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedIntakes}</div>
            <p className="text-xs text-muted-foreground">
              Approved intakes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deniedIntakes}</div>
            <p className="text-xs text-muted-foreground">Denied intakes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Health
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  complianceStatus === "good"
                    ? "success"
                    : complianceStatus === "warning"
                    ? "warning"
                    : "danger"
                }
              >
                {complianceStatus === "good"
                  ? "Good"
                  : complianceStatus === "warning"
                  ? "Needs Attention"
                  : "Critical"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDocIssues} document issue(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Intakes
              <Link href="/facility/intakes">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Your recent intake submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {facility.intakes.length > 0 ? (
              <div className="space-y-4">
                {facility.intakes.map((intake) => (
                  <div
                    key={intake.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{intake.residentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(intake.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        intake.status === "APPROVED"
                          ? "success"
                          : intake.status === "CONDITIONAL"
                          ? "warning"
                          : intake.status === "DENIED"
                          ? "danger"
                          : "secondary"
                      }
                    >
                      {intake.status === "CONDITIONAL" ? "Conditional" : intake.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No intakes submitted yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Document Requests
              <Link href="/facility/documents">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Documents requested by your BHP
            </CardDescription>
          </CardHeader>
          <CardContent>
            {facility.documents.filter((d) => d.status === "REQUESTED").length >
            0 ? (
              <div className="space-y-4">
                {facility.documents
                  .filter((d) => d.status === "REQUESTED")
                  .slice(0, 5)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type}
                        </p>
                      </div>
                      <Badge variant="warning">Requested</Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending document requests
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
            <Link href="/facility/intakes/new">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Submit Intake
              </Button>
            </Link>
            <Link href="/facility/documents">
              <Button variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </Link>
            <Link href="/facility/messages">
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact BHP
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
