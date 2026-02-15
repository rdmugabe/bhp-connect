import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function BHPIntakesPage() {
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

  // Only show submitted intakes (not drafts)
  const intakes = await prisma.intake.findMany({
    where: {
      facility: {
        bhpId: bhpProfile.id,
      },
      status: { not: "DRAFT" },
    },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Intakes</h1>
        <p className="text-muted-foreground">
          Review intake assessments from your facilities
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intakes.map((intake) => (
                <TableRow key={intake.id}>
                  <TableCell className="font-medium">
                    {intake.residentName}
                  </TableCell>
                  <TableCell>{intake.facility.name}</TableCell>
                  <TableCell>{formatDate(intake.dateOfBirth)}</TableCell>
                  <TableCell>{formatDate(intake.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/bhp/intakes/${intake.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/bhp/intakes/${intake.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {intakes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No intakes found
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
