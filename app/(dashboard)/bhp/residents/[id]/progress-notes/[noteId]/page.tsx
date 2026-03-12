import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { ProgressNoteForm } from "@/components/progress-notes/progress-note-form";

export default async function BHPViewProgressNotePage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const { id, noteId } = await params;

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  // Get the progress note
  const progressNote = await prisma.progressNote.findUnique({
    where: { id: noteId },
    include: {
      intake: {
        select: {
          id: true,
          residentName: true,
          dateOfBirth: true,
          facilityId: true,
        },
      },
      facility: {
        select: {
          id: true,
          name: true,
          bhpId: true,
        },
      },
    },
  });

  if (!progressNote || progressNote.facility.bhpId !== bhpProfile.id) {
    notFound();
  }

  // Verify the intake ID matches
  if (progressNote.intakeId !== id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/bhp/residents/${id}/progress-notes`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              View Progress Note
            </h1>
            <p className="text-muted-foreground">
              {progressNote.intake.residentName} - {progressNote.facility.name}
            </p>
          </div>
        </div>
        <Link href={`/api/progress-notes/${noteId}/pdf`} target="_blank">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </Link>
      </div>

      <ProgressNoteForm
        resident={{
          id: progressNote.intake.id,
          residentName: progressNote.intake.residentName,
          dateOfBirth: progressNote.intake.dateOfBirth,
        }}
        initialData={{
          id: progressNote.id,
          noteDate: progressNote.noteDate,
          shift: progressNote.shift,
          authorName: progressNote.authorName,
          authorTitle: progressNote.authorTitle,
          residentStatus: progressNote.residentStatus,
          observedBehaviors: progressNote.observedBehaviors,
          moodAffect: progressNote.moodAffect,
          activityParticipation: progressNote.activityParticipation,
          staffInteractions: progressNote.staffInteractions,
          peerInteractions: progressNote.peerInteractions,
          medicationCompliance: progressNote.medicationCompliance,
          hygieneAdl: progressNote.hygieneAdl,
          mealsAppetite: progressNote.mealsAppetite,
          sleepPattern: progressNote.sleepPattern,
          staffInterventions: progressNote.staffInterventions,
          residentResponse: progressNote.residentResponse,
          notableEvents: progressNote.notableEvents,
          additionalNotes: progressNote.additionalNotes,
          generatedNote: progressNote.generatedNote,
          riskFlagsDetected: progressNote.riskFlagsDetected,
          status: progressNote.status,
          bhtSignature: progressNote.bhtSignature,
          bhtCredentials: progressNote.bhtCredentials,
          bhtSignatureDate: progressNote.bhtSignatureDate,
        }}
        mode="edit"
        readOnly={true}
      />
    </div>
  );
}
