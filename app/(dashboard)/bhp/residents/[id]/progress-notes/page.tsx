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
import { ArrowLeft, FileText } from "lucide-react";
import { ProgressNoteList } from "@/components/progress-notes/progress-note-card";

export default async function BHPResidentProgressNotesPage({
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

  // Get the resident (intake) and verify it belongs to a facility managed by this BHP
  const resident = await prisma.intake.findUnique({
    where: { id },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
          bhpId: true,
        },
      },
    },
  });

  if (!resident || resident.facility.bhpId !== bhpProfile.id) {
    notFound();
  }

  // Get all progress notes for this resident
  const progressNotes = await prisma.progressNote.findMany({
    where: {
      intakeId: id,
      archivedAt: null,
    },
    include: {
      intake: {
        select: {
          id: true,
          residentName: true,
        },
      },
    },
    orderBy: [
      { noteDate: "desc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/bhp/residents/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Progress Notes
            </h1>
            <p className="text-muted-foreground">
              {resident.residentName} - {resident.facility.name}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daily Progress Notes
          </CardTitle>
          <CardDescription>
            AI-powered clinical documentation for this resident
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressNoteList
            notes={progressNotes}
            residentId={resident.id}
            residentName={resident.residentName}
            basePath="/bhp/residents"
            showActions={true}
            readOnly={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
