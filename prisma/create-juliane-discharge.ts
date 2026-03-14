import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createJulianeDischarge() {
  // Data extracted from discharge_summary_juliane_lebron_2026-03-11.pdf
  const intakeId = "cmmjx7wc60004ovde5judao4f";
  const facilityId = "cmlv1gi3300087obts0c35wqi";

  // Check if discharge summary already exists for this intake
  const existing = await prisma.dischargeSummary.findUnique({
    where: { intakeId },
  });

  if (existing) {
    console.log("Discharge summary already exists for this intake, updating...");
    const updated = await prisma.dischargeSummary.update({
      where: { intakeId },
      data: getDischargeData(intakeId, facilityId),
    });
    console.log("Updated discharge summary:", updated.id);
    return updated;
  }

  const dischargeSummary = await prisma.dischargeSummary.create({
    data: getDischargeData(intakeId, facilityId),
  });

  console.log("Created discharge summary:", dischargeSummary.id);
  return dischargeSummary;
}

function getDischargeData(intakeId: string, facilityId: string) {
  return {
    intakeId,
    facilityId,

    // Discharge Date/Time
    dischargeDate: new Date("2026-03-11"),

    // Program Info
    enrolledProgram: "Residential",
    dischargeType: "AMA",
    recommendedLevelOfCare: "Residential Treatment",

    // Diagnoses from PDF
    diagnoses: `F11.20 - Opioid Use Disorder, Moderate
F15.20 - Stimulant Use Disorder, Moderate
F33.1 - Major Depressive Disorder, Recurrent, Moderate
F41.1 - Generalized Anxiety Disorder
F51.01 - Primary Insomnia`,

    // Allergies
    allergies: "NKA (No Known Allergies)",

    // ASAM Level of Care
    asamLevelOfCare: "3.1 - Clinically Managed Low-Intensity Residential Services",

    // Presenting Issues at Admission
    presentingIssuesAtAdmission: `Patient presented with polysubstance use disorder involving opioids and stimulants, with co-occurring depression and anxiety. Patient reported history of trauma and difficulty managing cravings and emotional regulation.`,

    // Treatment Summary
    treatmentSummary: `Patient was admitted to residential treatment program on March 9, 2026. During her brief stay, patient participated in initial assessments and orientation. Patient was started on Medication-Assisted Treatment (MAT) with Suboxone for opioid use disorder management. Patient attended group therapy sessions and met with case management. Unfortunately, patient chose to leave treatment against medical advice on March 11, 2026, after only 2 days in the program. Patient cited personal reasons for her decision to leave early.`,

    // Objectives with attainment status (all Not Attained due to AMA discharge)
    objectivesAttained: [
      {
        objective: "Identify and demonstrate healthy coping mechanisms to manage stress and cravings without the use of substances",
        attained: false,
      },
      {
        objective: "Demonstrate improved decision-making skills related to avoiding high-risk situations",
        attained: false,
      },
      {
        objective: "Develop and verbalize a personalized relapse prevention plan",
        attained: false,
      },
      {
        objective: "Participate actively in therapeutic programming and case management services",
        attained: false,
      },
      {
        objective: "Demonstrate improved symptoms of mental health diagnoses through reported decreased frequency and intensity",
        attained: false,
      },
    ],

    // Objective Narratives
    objectiveNarratives: {
      objective1: "Patient did not complete sufficient time in treatment to develop and demonstrate coping mechanisms. Brief introduction to coping skills was provided during initial group sessions.",
      objective2: "Patient was unable to demonstrate improved decision-making as evidenced by AMA discharge before completing treatment recommendations.",
      objective3: "Initial relapse prevention planning was started but not completed due to early discharge.",
      objective4: "Patient attended limited programming during her 2-day stay but did not complete recommended treatment course.",
      objective5: "Insufficient time in treatment to assess improvement in mental health symptoms.",
    },

    // Relapse Prevention Plan
    relapsePreventionPlan: `1. Continue Suboxone (MAT) treatment as prescribed with outpatient provider
2. Attend NA/AA meetings minimum 3x per week
3. Identify and avoid high-risk triggers including people, places, and things associated with past use
4. Utilize crisis hotline numbers when experiencing cravings or urges
5. Re-engage with outpatient behavioral health services for ongoing therapy
6. Build sober support network through community recovery resources`,

    // Crisis Resources
    crisisResources: `National Suicide Prevention Lifeline: 1-800-273-8255 (24/7)
SAMHSA National Helpline: 1-800-662-4357 (24/7)
Local Crisis Line: 480-784-1500
Crisis Text Line: Text HOME to 741741`,

    // Patient Education
    patientEducationProvided: `Patient was provided with education regarding:
- Overdose prevention and Narcan use
- Medication compliance importance
- Recognizing relapse warning signs
- Community recovery resources`,

    // Special Instructions
    specialInstructions: `Patient strongly encouraged to re-engage with residential treatment when ready. Bed will be held for 48 hours pending patient decision to return. Follow up with outpatient prescriber within 7 days for MAT continuation.`,

    // Discharge Summary Narrative
    dischargeSummaryNarrative: `Juliane Lebron was admitted to Odeum Arizona BHRF on March 9, 2026 for residential treatment of polysubstance use disorder and co-occurring mental health conditions. Patient left the facility against medical advice (AMA) on March 11, 2026 after only 2 days of treatment. During her brief stay, patient was initiated on Suboxone for opioid use disorder and participated in initial assessments and orientation. Patient was advised of the risks of leaving treatment early including increased risk of relapse and overdose. Patient verbalized understanding but still chose to leave. Discharge medications were provided along with crisis resources and referrals for outpatient follow-up. Patient encouraged to return to treatment when ready.`,

    // Discharging To
    dischargingTo: "Community (patient's own residence)",

    // Personal Items
    personalItemsReceived: true,
    itemsRemainAtFacility: false,

    // Discharge Medications
    dischargeMedications: [
      {
        name: "Suboxone (Buprenorphine-Naloxone)",
        dose: "8mg-2mg",
        frequency: "1 strip daily",
        route: "Sublingual",
      },
      {
        name: "Wellbutrin (Bupropion)",
        dose: "150mg",
        frequency: "Once daily",
        route: "Oral",
      },
      {
        name: "Zoloft (Sertraline)",
        dose: "100mg",
        frequency: "Once daily",
        route: "Oral",
      },
      {
        name: "Vistaril (Hydroxyzine)",
        dose: "25mg",
        frequency: "As needed for anxiety",
        route: "Oral",
      },
      {
        name: "Trazodone",
        dose: "50mg",
        frequency: "At bedtime for sleep",
        route: "Oral",
      },
    ],

    // Service Referrals
    serviceReferrals: [
      {
        service: "Outpatient MAT Provider",
        provider: "Community Health Center",
        notes: "Continue Suboxone management",
      },
      {
        service: "Outpatient Behavioral Health",
        provider: "AHCCCS Contracted Provider",
        notes: "Individual and group therapy",
      },
    ],

    // Clinical Recommendations
    clinicalRecommendations: `1. Continue MAT treatment with Suboxone
2. Re-engage with residential treatment at earliest opportunity
3. Attend outpatient behavioral health services
4. Participate in peer support/12-step programming
5. Follow up with psychiatry for medication management`,

    // Cultural Preferences
    culturalPreferencesConsidered: true,

    // Suicide Prevention Education
    suicidePreventionEducation: "Patient provided with suicide prevention resources and safety planning. Crisis hotline numbers provided.",

    // Meeting Participants
    meetingInvitees: {
      bhp: true,
      caseManager: true,
      bhtAdmin: true,
      resident: true,
      nurse: true,
    },
    meetingAttendees: {
      bhp: true,
      caseManager: false,
      bhtAdmin: true,
      resident: true,
      nurse: false,
    },

    // Signatures
    staffSignature: "Richard Mugabe",
    staffCredentials: "BHT",
    staffSignatureDate: new Date("2026-03-11"),
    reviewerSignature: "Chris Azode",
    reviewerCredentials: "BHP",
    reviewerSignatureDate: new Date("2026-03-11"),
  };
}

createJulianeDischarge()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
