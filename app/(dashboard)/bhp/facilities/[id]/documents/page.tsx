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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { formatDate, getExpirationStatus } from "@/lib/utils";

export default async function BHPFacilityDocumentsPage({
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
    select: {
      id: true,
      name: true,
    },
  });

  if (!facility) {
    notFound();
  }

  const documents = await prisma.document.findMany({
    where: { facilityId: id },
    orderBy: { uploadedAt: "desc" },
  });

  const getStatusBadge = (status: string, expiresAt: Date | null) => {
    if (status === "REQUESTED") {
      return <Badge variant="warning">Upload Required</Badge>;
    }
    if (status === "EXPIRED" || getExpirationStatus(expiresAt) === "expired") {
      return <Badge variant="danger">Expired</Badge>;
    }
    if (getExpirationStatus(expiresAt) === "expiring") {
      return <Badge variant="warning">Expiring Soon</Badge>;
    }
    if (status === "APPROVED") {
      return <Badge variant="success">Approved</Badge>;
    }
    if (status === "UPLOADED") {
      return <Badge variant="secondary">Uploaded</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const requestedDocs = documents.filter((d) => d.status === "REQUESTED");
  const uploadedDocs = documents.filter((d) => d.status !== "REQUESTED");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/bhp/facilities/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {facility.name} - Documents
          </h1>
          <p className="text-muted-foreground">
            View facility documents (read-only)
          </p>
        </div>
      </div>

      {/* Pending Documents Alert */}
      {requestedDocs.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <FileText className="h-5 w-5" />
              Pending Document Requests
            </CardTitle>
            <CardDescription className="text-yellow-700">
              These documents have been requested but not yet uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            Documents uploaded by this facility
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>{doc.type}</TableCell>
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
              {uploadedDocs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No documents uploaded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
