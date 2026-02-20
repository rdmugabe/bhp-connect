import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the facility
  const facility = await prisma.facility.findFirst({
    where: { name: "Lucid Behavioral health" }
  });

  if (!facility) {
    console.error("Facility 'Lucid Behavioral health' not found");
    process.exit(1);
  }

  // Find the intake for Genevieve Begay
  const intake = await prisma.intake.findFirst({
    where: {
      residentName: "Genevieve Begay",
      facilityId: facility.id
    }
  });

  if (!intake) {
    console.error("Intake for Genevieve Begay not found. Please run seed-genevieve.ts first.");
    process.exit(1);
  }

  // Find the BHRF user for submittedBy
  const bhrfUser = await prisma.user.findFirst({
    where: { role: "BHRF" }
  });

  if (!bhrfUser) {
    console.error("BHRF user not found");
    process.exit(1);
  }

  // Check if ASAM already exists
  const existingAsam = await prisma.aSAMAssessment.findFirst({
    where: {
      intakeId: intake.id
    }
  });

  if (existingAsam) {
    console.log("ASAM assessment already exists for this intake, ID:", existingAsam.id);
    return;
  }

  // Create the ASAM assessment
  const asam = await prisma.aSAMAssessment.create({
    data: {
      facilityId: facility.id,
      intakeId: intake.id,
      submittedBy: bhrfUser.id,
      status: "APPROVED",

      // Demographics
      patientName: "Genevieve Begay",
      assessmentDate: new Date("2026-02-11"),
      admissionDate: new Date("2026-02-11"),
      phoneNumber: "602-8316298",
      okayToLeaveVoicemail: false,
      patientAddress: "7515 W Odeum Ln, Phoenix AZ 85043",
      dateOfBirth: new Date("1981-04-21"),
      age: 44,
      gender: "Female",
      raceEthnicity: "Native American",
      preferredLanguage: "English",
      ahcccsId: "A00213797",
      insuranceType: "AHCCCS",
      livingArrangement: "Homeless",
      reasonForTreatment: `Ms. Genevieve presents today requesting assistance in addressing her long-standing substance use disorders and achieving sustained sobriety. She reports a strong desire to enter a structured and supportive treatment environment to stabilize her mental health, improve her overall functioning, and rebuild her life. During today's psychiatric evaluation for potential placement in a Behavioral Health Residential Facility (BHRF), she appeared alert, oriented to person, place, time, and situation, cooperative, and appropriately engaged. She denied current suicidal or homicidal ideation.

Ms. Genevieve reports a 32-year history of alcohol use beginning at age 12, which she attributes to growing up in a toxic and unstable environment. She began using methamphetamine and fentanyl at approximately age 25 while experiencing homelessness and attempting to cope with the challenges of living on the streets. She reports previously consuming at least a six-pack of beer daily, with her last alcohol use approximately one and a half weeks ago. She also reports daily methamphetamine use, typically smoking approximately $40 worth per day, with last use occurring yesterday. Additionally, she reports smoking approximately $10 worth of fentanyl daily, with last use three days ago.`,
      currentSymptoms: "ROSS\nDepression, Anxiety",

      // Dimension 1: Acute Intoxication / Withdrawal Potential
      substanceUseHistory: [
        {
          substance: "Amphetamines (Meth, Ice, Crank)",
          route: "Smoke",
          ageFirstUse: "25",
          lastUse: "2026-02-10",
          frequency: "Weekly",
          amount: "Unknown"
        },
        {
          substance: "Fentanyl",
          route: "Smoke",
          ageFirstUse: "25",
          lastUse: "2026-02-07",
          frequency: "Weekly",
          amount: "Unknown"
        },
        {
          substance: "Alcohol",
          route: "Oral",
          ageFirstUse: "12",
          lastUse: "2026-01-31",
          frequency: "Occasionally",
          amount: "Unknown"
        }
      ],
      usingMoreThanIntended: true,
      physicallyIllWhenStopping: true,
      currentWithdrawalSymptoms: true,
      historyOfSeriousWithdrawal: true,
      toleranceIncreased: true,
      recentUseChanges: true,
      familySubstanceHistory: "Unknown",
      dimension1Severity: 3, // Severe

      // Dimension 2: Biomedical Conditions
      medicalConditions: {
        visionProblems: true
      },
      conditionsInterfere: true,
      lifeThreatening: false,
      priorHospitalizations: "Hospitalized approximately 6 months ago for detox",
      medicalMedications: [
        { medication: "Vistaril", dose: "50mg", reason: "Anxiety", effectiveness: "Effective" },
        { medication: "Vitamin C", dose: "500mg", reason: "Nutritional supplement", effectiveness: "Effective" }
      ],
      dimension2Severity: 3, // Severe

      // Dimension 3: Emotional, Behavioral & Cognitive Conditions
      moodSymptoms: {
        depression: true,
        irritability: true
      },
      anxietySymptoms: {
        anxiety: true,
        flashbacks: true,
        obsessiveThoughts: true,
        compulsiveBehaviors: true
      },
      psychosisSymptoms: {},
      otherSymptoms: {
        sleepProblems: true
      },
      abuseHistory: '"Yes, physical abuse" (no details on timing, perpetrator, or duration)',
      mentalIllnessDiagnosed: true,
      previousPsychTreatment: true,
      hallucinationsPresent: true,
      furtherMHAssessmentNeeded: true,
      traumaticEvents: "None",
      dimension3Severity: 2, // Moderate

      // Dimension 4: Readiness to Change
      areasAffectedByUse: {
        work: true,
        finances: true,
        mentalHealth: true,
        relationships: true
      },
      continueUseDespitefects: true,
      treatmentImportanceAlcohol: "Not at all",
      treatmentImportanceDrugs: "Considerably",
      previousTreatmentHelp: true,
      recoverySupport: "Just a support system",
      recoveryBarriers: "Lack of motivation\nLack of structure\nLack of a support system",
      dimension4Severity: 4, // Very Severe

      // Dimension 5: Relapse, Continued Use, or Continued Problem Potential
      cravingsFrequencyAlcohol: "Frequently",
      cravingsFrequencyDrugs: "Frequently",
      awareOfTriggers: true,
      timeSearchingForSubstances: true,
      relapseWithoutTreatment: true,
      longestSobriety: "9 months during pregnancy and a few months of breast feeding.",
      copingWithTriggers: "Go on a walk",
      whatHelped: "Caring for my children",
      dimension5Severity: 3, // Severe

      // Dimension 6: Recovery / Living Environment
      othersUsingDrugsInEnvironment: false,
      safetyThreats: false,
      negativeImpactRelationships: true,
      currentlyEmployedOrSchool: false,
      socialServicesInvolved: false,
      supportiveRelationships: "No",
      currentLivingSituation: "Homeless/Group homes",
      dimension6Severity: 4, // Very Severe

      // DSM-5 Diagnoses
      dsm5Diagnoses: `ICD-10 Diagnosis Codes:
• F11.20 — Opioid Use Disorder, severe (fentanyl)
• F15.20 — Stimulant Use Disorder, severe (methamphetamine)
• F10.20 — Alcohol Use Disorder, severe
• F33.1 — Major Depressive Disorder, recurrent, moderate
• F41.1 — Generalized Anxiety Disorder
• F43.10 — Post-Traumatic Stress Disorder
• F51.01 — Insomnia Disorder`,

      // Level of Care Determination
      recommendedLevelOfCare: "3.1",
      levelOfCareProvided: "3.1",
      matInterested: true,
      designatedTreatmentLocation: "Lucid Behavioral Health\n7515 W Odeum Ln, Phoenix AZ 85043",
      designatedProviderName: "BHP - Dr. Chris Azode, DNP, PMHNP-BC, MBA",

      // Signatures
      counselorName: "Richard Mugabe, BHT",
      counselorSignatureDate: new Date("2026-02-10"),
      bhpLphaName: "Dr. Chris Azode",
      bhpLphaSignatureDate: new Date("2026-02-10"),
    }
  });

  console.log("ASAM Assessment created for Genevieve Begay");
  console.log("- ASAM ID:", asam.id);
  console.log("- Intake ID:", intake.id);
  console.log("- Facility:", facility.name);
  console.log("- Recommended LOC:", asam.recommendedLevelOfCare);
  console.log("- Status:", asam.status);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
