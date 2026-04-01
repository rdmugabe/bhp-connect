import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the facility
  const facility = await prisma.facility.findFirst();
  if (!facility) {
    throw new Error("No facility found");
  }

  // Get the first BHRF user for submittedBy
  const bhrfUser = await prisma.user.findFirst({
    where: { role: "BHRF" },
  });

  const submittedById = bhrfUser?.id || "system";

  // Check if Mario Webb already exists
  const existingIntake = await prisma.intake.findFirst({
    where: {
      residentName: "Mario Webb",
      dateOfBirth: new Date("1983-09-13"),
    },
  });

  if (existingIntake) {
    console.log("Mario Webb intake already exists:");
    console.log("ID:", existingIntake.id);
    return;
  }

  // Create Mario Webb's intake
  const intake = await prisma.intake.create({
    data: {
      facilityId: facility.id,
      status: "APPROVED",
      submittedBy: submittedById,

      // Demographics
      residentName: "Mario Webb",
      dateOfBirth: new Date("1983-09-13"),
      admissionDate: new Date("2026-03-27"),
      sex: "Male",
      ethnicity: "Native American",
      language: "English",

      // Contact Information
      patientPhone: undefined,
      patientEmail: undefined,
      contactPreference: "None",

      // Insurance
      policyNumber: "A00541100",
      ahcccsHealthPlan: "AHCCCS",

      // Referral
      referralSource: "Orbit Behavioral Health and Wellness, LLC",
      evaluatorName: "Adebukola Aladesanmi",
      evaluatorCredentials: "DNP, PMHNP-BC",
      reasonsForReferral:
        "Mr. Mario demonstrates multiple clinically significant signs and symptoms consistent with severe stimulant and opioid use disorders that necessitate continued treatment in a Behavioral Health Residential Facility (BHRF). He has a longstanding history of methamphetamine and fentanyl use beginning at age 18, with progression to heavy, daily use characterized by impaired control, increased tolerance, and inability to maintain sustained abstinence.",
      residentNeeds:
        "Structured residential treatment environment for stabilization, relapse prevention, and development of adaptive coping skills. Housing assistance and employment resources.",
      teamExpectedLOS: "90 days",

      // Behavioral Symptoms
      reasonForServices: "I need help with drugs.",
      currentBehavioralSymptoms:
        "History of stimulant and opioid use disorder. Limited insight into severity of addiction. High relapse potential due to environmental triggers and chronic substance exposure.",
      symptomsLimitations:
        "Substance use has resulted in significant functional impairment including homelessness, unemployment, and legal involvement.",

      // Medical
      allergies: "NKDA (No Known Drug Allergies)",
      personalMedicalHX:
        "No significant medical history. Denies chronic conditions such as hypertension, diabetes, asthma, or seizures.",
      familyMedicalHX: "Client denies family medical history.",

      // Psychiatric
      isCOT: false,
      personalPsychHX:
        "Client reports recent admission(s) for psychiatric hospitalization for detox and mental health. Denies prior psychiatric diagnoses including depression, anxiety, bipolar disorder, ADHD, or PTSD.",
      familyPsychHX: "Client denies family psychiatric history.",

      // Risk Assessment - DTS
      suicideHistory: "Denies",
      currentSuicideIdeation: false,
      historySelfHarm: false,

      // Risk Assessment - DTO
      historyHarmingOthers: false,
      homicidalIdeation: false,

      previousHospitalizations: "Yes - detox and mental health",

      // Developmental History
      developmentalMilestones: "Met",
      developmentalDetails: "Met all developmental milestones.",

      // Education History
      highestEducation: "High School Diploma",
      specialEducation: false,
      plan504: false,
      iep: false,

      // Employment
      currentlyEmployed: false,
      employmentDetails:
        "Currently unemployed. Last reported employment in January 2026.",
      employmentBarriers:
        "Substance use disorder, history of incarceration, homelessness",

      // Legal History
      criminalLegalHistory:
        "History of incarceration (approximately one episode lasting six months). Currently on probation until October 2026.",
      courtOrderedTreatment: true,
      courtOrderedDetails: "Currently on probation until October 2026.",

      // Substance History
      substanceHistory:
        "Methamphetamine use since age 18, primarily smoking. At peak use during 20s to mid-30s, used approximately one ounce daily (~$200/day). Fentanyl use history (~$20/day during active use). History of overdose which motivated cessation attempts. Denies alcohol use disorder and marijuana use.",
      substanceUseTable: [
        {
          substance: "Methamphetamine",
          firstUse: "18 years old",
          lastUse: "Two weeks ago",
          frequency: "Daily at peak",
          route: "Smoking",
          amount: "Up to 1 oz daily at peak",
        },
        {
          substance: "Fentanyl/Opioids",
          firstUse: "18 years old",
          lastUse: "About a year ago",
          frequency: "Daily during active use",
          route: "Unknown",
          amount: "~$20/day",
        },
      ],
      drugOfChoice: "Methamphetamine",
      substanceTreatmentHistory:
        "Completed 6 months outpatient services. Completed 6 months sober living. At least one prior detox episode.",
      nicotineUse: false,
      substanceImpact:
        "Substance use has resulted in significant functional impairment, including homelessness, unemployment, and legal involvement.",

      // Living Situation
      livingArrangements:
        "History of homelessness, including constructing makeshift shelter. Relocated to Phoenix approximately six months ago seeking services and stability.",

      // Behavioral Observations
      appearanceGrooming: "Fairly groomed",
      appearanceAttire: "Appropriately dressed",
      demeanorMood: "Fine (self-reported euthymic)",
      demeanorAffect: "Appropriate, congruent",
      demeanorCooperation: "Cooperative, calm",
      speechRate: "Normal",
      speechTone: "Normal",
      motorGait: "Upright",
      cognitionThoughtProcess: "Linear, goal-directed",
      cognitionThoughtContent: "No delusions, denies SI/HI",
      cognitionPerception: "Denies auditory or visual hallucinations",
      cognitionJudgment: "Impaired related to substance use history",
      cognitionInsight: "Limited (minimizes impact of substance use)",
      estimatedIntelligence: "Average",

      // Diagnosis
      diagnosis:
        "F15.20 - Other stimulant dependence (Methamphetamine Use Disorder, Severe)",
      treatmentRecommendation:
        "ASAM Level 3.1 - Clinically Managed Low-Intensity Residential Treatment (BHRF) is recommended due to high relapse risk, unstable housing, and need for structured support.",

      // Treatment Goals
      treatmentObjectives:
        "Short-Term Goals: Achieve and maintain abstinence from methamphetamine and opioids; Stabilize within structured residential environment; Engage in daily therapeutic programming. Long-Term Goals: Develop relapse prevention strategies; Improve coping skills and insight into addiction; Secure stable housing and employment.",

      // Discharge Planning
      dischargePlanning:
        "Step-down to ASAM 2.1 Intensive Outpatient Program (IOP) upon stabilization. Continued engagement in outpatient therapy and substance use counseling. Referral to sober living or supportive housing. Linkage to community resources for employment and social support. Ongoing relapse prevention planning.",
    },
  });

  console.log("Created intake for Mario Webb:");
  console.log("ID:", intake.id);
  console.log("Name:", intake.residentName);
  console.log("Status:", intake.status);
  console.log("Facility ID:", intake.facilityId);
  console.log("DOB:", intake.dateOfBirth);
  console.log("Admission Date:", intake.admissionDate);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
