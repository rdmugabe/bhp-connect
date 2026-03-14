import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const intakeId = "cmmgv45lj0004hrcmzjqa0qec";

  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    select: { residentName: true, status: true, previousIntakeId: true },
  });

  if (!intake) {
    console.log("No intake found with ID:", intakeId);
    return;
  }

  console.log("Found intake for:", intake.residentName, "Status:", intake.status);
  console.log("Previous Intake ID:", intake.previousIntakeId);

  // Update intake with readmission-specific phrasing
  const updated = await prisma.intake.update({
    where: { id: intakeId },
    data: {
      // Referral section - updated to reflect readmission
      reasonsForReferral: "READMISSION: Patient is returning to BHRF care following a brief discharge. Persistent depressed and anxious moods, polysubstance abuse, hallucinations, history of trauma with abuse, domestic violence, and the death of her eldest child in 2011. Patient demonstrated progress during previous admission but requires continued supervised care, treatment, and stabilization in an adult behavioral health residential facility (BHRF).",

      reasonForServices: "READMISSION: Patient is being readmitted for continued treatment of persistent depressed and anxious moods, polysubstance abuse (alcohol, methamphetamine, fentanyl), hallucinations, history of trauma with abuse, domestic violence, and the death of her eldest child in 2011. Patient requires ongoing stabilization and support following previous BHRF placement.",

      residentNeeds: "Continuation of mental health stabilization from previous admission, ongoing substance abuse treatment and MAT (Suboxone), trauma-informed care, medication management, housing assistance, and continued development of social support systems established during prior stay.",

      // Treatment history - updated to reflect previous BHRF stay
      substanceTreatmentHistory: "Previous BHRF admission at Lucid Behavioral Health (see prior intake record). Patient was engaged in MAT with Suboxone for opioid use disorder. Currently continuing Suboxone treatment. Demonstrated engagement with treatment during previous stay.",

      // Psychiatric history - can reference previous admission
      personalPsychHX: "READMISSION NOTE: Patient previously admitted to this BHRF. History includes Major Depressive Disorder (recurrent, moderate), Generalized Anxiety Disorder, Post-Traumatic Stress Disorder, and Primary Insomnia. Patient experienced auditory hallucinations (voices, including deceased child's voice) and visual hallucinations during previous admission. History of suicidal ideation with past attempt in 2014 via overdose. Homicidal ideation toward person who killed her child (targeted, no current plan/intent). Patient was stabilizing on current medication regimen during previous stay.",

      // Strengths - can reference progress from previous admission
      strengthsAndLimitations: "STRENGTHS: High motivation for treatment, children serve as strong motivating factor for recovery, cooperative and engaged during previous admission, demonstrated willingness to participate in treatment programming, currently compliant with MAT (Suboxone). LIMITATIONS: Chronic homelessness (5+ years), limited social support system, history of trauma affecting emotional regulation, co-occurring psychiatric disorders requiring ongoing management.",

      // Update immediate needs to reflect continuity of care
      immediateUrgentNeeds: "Continuation of psychiatric medication management, ongoing MAT (Suboxone) for opioid use disorder, safe and structured living environment, monitoring for suicidal/homicidal ideation, trauma-informed therapeutic support.",

      // Signs of improvement - reference previous progress
      signsOfImprovement: "During previous admission, patient demonstrated: engagement with treatment team, compliance with medication regimen, participation in group activities, reduced frequency of hallucinations with medication adjustment, stable mood with psychiatric medication management. Readmission goals include maintaining and building upon previous progress.",
    },
  });

  console.log("Intake updated successfully:", updated.id);
  console.log("\nGenevieve Begay intake updated to reflect READMISSION status!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
