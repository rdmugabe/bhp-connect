import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProgressNoteForm } from "@/components/progress-notes/progress-note-form";

export default async function NewProgressNotePage({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/facility/residents/${id}/progress-notes`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            New Progress Note
          </h1>
          <p className="text-muted-foreground">
            {resident.residentName}
          </p>
        </div>
      </div>

      <ProgressNoteForm
        resident={{
          id: resident.id,
          residentName: resident.residentName,
          dateOfBirth: resident.dateOfBirth,
        }}
        mode="create"
      />
    </div>
  );
}
