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
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { ProgressNoteList } from "@/components/progress-notes/progress-note-card";

export default async function ResidentProgressNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const { id } = await params;

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhrfProfile) {
    redirect("/login");
  }

  // Get the resident (intake)
  const resident = await prisma.intake.findUnique({
    where: { id },
    select: {
      id: true,
      residentName: true,
      dateOfBirth: true,
      facilityId: true,
      status: true,
    },
  });

  if (!resident || resident.facilityId !== bhrfProfile.facilityId) {
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
          <Link href={`/facility/residents/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Progress Notes
            </h1>
            <p className="text-muted-foreground">
              {resident.residentName}
            </p>
          </div>
        </div>
        <Link href={`/facility/residents/${id}/progress-notes/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Progress Note
          </Button>
        </Link>
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
            basePath="/facility/residents"
            showActions={true}
            readOnly={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
