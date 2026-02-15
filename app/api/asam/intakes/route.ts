import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get completed intakes available for ASAM assessment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ intakes: [] });
    }

    // Get approved intakes that don't already have an ASAM assessment
    // or have a denied/draft ASAM (allowing retry)
    const intakes = await prisma.intake.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
        status: "APPROVED",
      },
      select: {
        id: true,
        residentName: true,
        dateOfBirth: true,
        sex: true,
        ethnicity: true,
        language: true,
        patientPhone: true,
        patientAddress: true,
        insuranceProvider: true,
        policyNumber: true,
        ahcccsHealthPlan: true,
        livingArrangements: true,
        referralSource: true,
        reasonsForReferral: true,
        currentBehavioralSymptoms: true,
        allergies: true,
        medicalConditions: true,
        personalMedicalHX: true,
        familyMedicalHX: true,
        personalPsychHX: true,
        familyPsychHX: true,
        suicideHistory: true,
        currentSuicideIdeation: true,
        historyHarmingOthers: true,
        homicidalIdeation: true,
        substanceHistory: true,
        substanceUseTable: true,
        drugOfChoice: true,
        longestSobriety: true,
        abuseHistory: true,
        criminalLegalHistory: true,
        currentlyEmployed: true,
        employmentDetails: true,
        decidedAt: true,
        asamAssessments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { decidedAt: "desc" },
    });

    // Filter to only include intakes without an active ASAM (pending/approved/conditional)
    const availableIntakes = intakes.filter((intake) => {
      const activeAsam = intake.asamAssessments.find(
        (asam) => asam.status === "PENDING" || asam.status === "APPROVED" || asam.status === "CONDITIONAL"
      );
      return !activeAsam;
    });

    // Remove asamAssessments from response to keep it clean
    const cleanedIntakes = availableIntakes.map(({ asamAssessments, ...rest }) => rest);

    return NextResponse.json({ intakes: cleanedIntakes });
  } catch (error) {
    console.error("Get intakes for ASAM error:", error);
    return NextResponse.json(
      { error: "Failed to fetch intakes" },
      { status: 500 }
    );
  }
}
