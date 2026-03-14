import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { careCoordinationProgressNoteLinkSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";

// Create a link between a care coordination entry and a progress note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = careCoordinationProgressNoteLinkSchema.parse(parseResult.data);

    // Verify the entry exists and belongs to the facility
    const entry = await prisma.careCoordinationEntry.findUnique({
      where: { id: validatedData.entryId },
    });

    if (!entry || entry.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Care coordination entry not found or unauthorized" },
        { status: 404 }
      );
    }

    // Verify the progress note exists and belongs to the facility
    const progressNote = await prisma.progressNote.findUnique({
      where: { id: validatedData.progressNoteId },
    });

    if (!progressNote || progressNote.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Progress note not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if link already exists
    const existingLink = await prisma.careCoordinationProgressNoteLink.findUnique({
      where: {
        entryId_progressNoteId: {
          entryId: validatedData.entryId,
          progressNoteId: validatedData.progressNoteId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Link already exists" },
        { status: 400 }
      );
    }

    // Create the link
    const link = await prisma.careCoordinationProgressNoteLink.create({
      data: {
        entryId: validatedData.entryId,
        progressNoteId: validatedData.progressNoteId,
        linkedById: session.user.id,
        linkedByName: session.user.name || "Unknown",
      },
      include: {
        entry: {
          select: {
            id: true,
            activityType: true,
            activityDate: true,
            description: true,
          },
        },
        progressNote: {
          select: {
            id: true,
            noteDate: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Create care coordination link error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}

// Delete a link between a care coordination entry and a progress note
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");
    const progressNoteId = searchParams.get("progressNoteId");

    if (!entryId || !progressNoteId) {
      return NextResponse.json(
        { error: "Entry ID and Progress Note ID are required" },
        { status: 400 }
      );
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    // Find the link
    const link = await prisma.careCoordinationProgressNoteLink.findUnique({
      where: {
        entryId_progressNoteId: {
          entryId,
          progressNoteId,
        },
      },
      include: {
        entry: true,
      },
    });

    if (!link || link.entry.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Link not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the link
    await prisma.careCoordinationProgressNoteLink.delete({
      where: {
        entryId_progressNoteId: {
          entryId,
          progressNoteId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete care coordination link error:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}

// Get entries that can be linked to a progress note (same resident, not already linked)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const progressNoteId = searchParams.get("progressNoteId");

    if (!intakeId) {
      return NextResponse.json(
        { error: "Intake ID is required" },
        { status: 400 }
      );
    }

    let facilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      facilityId = bhrfProfile?.facilityId;
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          facilities: {
            select: { id: true },
          },
        },
      });
      // Get first facility for simplicity
      facilityId = bhpProfile?.facilities[0]?.id;
    }

    if (!facilityId) {
      return NextResponse.json({ entries: [] });
    }

    // Get entries for this resident that aren't archived
    const entries = await prisma.careCoordinationEntry.findMany({
      where: {
        intakeId,
        facilityId,
        archivedAt: null,
      },
      include: {
        progressNoteLinks: progressNoteId
          ? {
              where: {
                progressNoteId,
              },
            }
          : true,
      },
      orderBy: { activityDate: "desc" },
    });

    // Filter out already linked entries if progressNoteId is provided
    const availableEntries = progressNoteId
      ? entries.filter((entry) => entry.progressNoteLinks.length === 0)
      : entries;

    // Get already linked entries for this progress note
    const linkedEntries = progressNoteId
      ? entries.filter((entry) => entry.progressNoteLinks.length > 0)
      : [];

    return NextResponse.json({
      availableEntries,
      linkedEntries,
    });
  } catch (error) {
    console.error("Get linkable entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
