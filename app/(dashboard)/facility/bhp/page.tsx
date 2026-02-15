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
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  ExternalLink,
  Building2,
  Download,
} from "lucide-react";
import { formatDate, getExpirationStatus } from "@/lib/utils";

export default async function FacilityBHPInfoPage() {
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
              credentials: {
                where: { isPublic: true },
                orderBy: { uploadedAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!bhrfProfile || !bhrfProfile.facility) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BHP Information</h1>
          <p className="text-muted-foreground">
            Your facility is not yet associated with a BHP
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Your facility registration is still pending approval.
              <br />
              Once approved, you&apos;ll see your BHP&apos;s information here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bhp = bhrfProfile.facility.bhp;
  const bhpUser = bhp.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BHP Information</h1>
        <p className="text-muted-foreground">
          Your Behavioral Health Professional contact information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* BHP Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Your assigned BHP&apos;s contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{bhpUser.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Behavioral Health Professional
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${bhpUser.email}`}
                  className="text-primary hover:underline"
                >
                  {bhpUser.email}
                </a>
              </div>
              {bhp.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${bhp.phone}`}
                    className="text-primary hover:underline"
                  >
                    {bhp.phone}
                  </a>
                </div>
              )}
              {bhp.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{bhp.address}</span>
                </div>
              )}
            </div>
            {bhp.bio && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">About</p>
                  <p className="text-sm">{bhp.bio}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Public Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Credentials
            </CardTitle>
            <CardDescription>
              Publicly shared licenses and certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bhp.credentials.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Link href={`/credentials/${bhp.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View All Credentials
                    </Button>
                  </Link>
                </div>
                {bhp.credentials.map((credential) => {
                  const status = getExpirationStatus(credential.expiresAt);
                  return (
                    <div
                      key={credential.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{credential.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {credential.type}
                            {credential.expiresAt && (
                              <> - Expires {formatDate(credential.expiresAt)}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status && (
                          <Badge
                            variant={
                              status === "expired"
                                ? "danger"
                                : status === "expiring"
                                ? "warning"
                                : "success"
                            }
                          >
                            {status === "expired"
                              ? "Expired"
                              : status === "expiring"
                              ? "Expiring Soon"
                              : "Valid"}
                          </Badge>
                        )}
                        {credential.fileUrl && (
                          <a
                            href={`/api/documents/download?key=${credential.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Award className="h-8 w-8 mb-2" />
                <p>No public credentials available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Your Facility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your Facility
          </CardTitle>
          <CardDescription>
            Facility information registered under this BHP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Facility Name</p>
              <p className="font-medium">{bhrfProfile.facility.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{bhrfProfile.facility.address}</p>
            </div>
            {bhrfProfile.facility.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{bhrfProfile.facility.phone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
