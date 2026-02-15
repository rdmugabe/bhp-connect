import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Award, Shield } from "lucide-react";
import { formatDate, getExpirationStatus } from "@/lib/utils";
import Link from "next/link";

export default async function PublicCredentialsPage({
  params,
}: {
  params: { bhpId: string };
}) {
  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { id: params.bhpId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      credentials: {
        where: { isPublic: true },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!bhpProfile) {
    notFound();
  }

  const initials = bhpProfile.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">BHP</span>
            </div>
            <span className="font-semibold text-lg">BHP Connect</span>
          </Link>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Verified Credentials
          </Badge>
        </div>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{bhpProfile.user.name}</CardTitle>
                <CardDescription>
                  Behavioral Health Professional
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {bhpProfile.bio && (
              <p className="text-muted-foreground">{bhpProfile.bio}</p>
            )}
            {bhpProfile.address && (
              <p className="text-sm text-muted-foreground mt-2">
                {bhpProfile.address}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Professional Credentials
            </CardTitle>
            <CardDescription>
              Verified credentials and certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bhpProfile.credentials.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credential</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bhpProfile.credentials.map((credential) => {
                    const status = getExpirationStatus(credential.expiresAt);
                    return (
                      <TableRow key={credential.id}>
                        <TableCell className="font-medium">
                          {credential.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{credential.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {credential.expiresAt
                            ? formatDate(credential.expiresAt)
                            : "No Expiration"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === "valid"
                                ? "success"
                                : status === "expiring"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {status === "valid"
                              ? "Valid"
                              : status === "expiring"
                              ? "Expiring Soon"
                              : "Expired"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={`/api/documents/download?key=${credential.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No public credentials available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This page displays verified credentials for {bhpProfile.user.name}.
          </p>
          <p>
            Powered by{" "}
            <Link href="/" className="text-primary hover:underline">
              BHP Connect
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
