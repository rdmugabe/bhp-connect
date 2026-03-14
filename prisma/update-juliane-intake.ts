import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const intakeId = "cmmjx7wc60004ovde5judao4f";

  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    include: { medications: true },
  });

  if (!intake) {
    console.log("No intake found with ID:", intakeId);
    return;
  }

  console.log("Found intake:", intake.id, intake.residentName);

  // Update intake with data from the evaluation PDFs
  const updated = await prisma.intake.update({
    where: { id: intakeId },
    data: {
      // Demographics (Section 1)
      residentName: "Juliane Lebron",
      dateOfBirth: new Date("1972-04-03"),
      sex: "Female",
      ethnicity: "Native American",
      nativeAmericanTribe: "Pima",
      language: "English",

      // Contact Information (Section 2)
      patientPhone: "", // N/A per evaluation
      patientAddress: "Homeless - approximately 3 months",
      contactPreference: "None",

      // Emergency Contact
      emergencyContactName: "Mother",
      emergencyContactRelationship: "Mother",
      emergencyContactPhone: "", // Not specified

      // Insurance (Section 3)
      insuranceProvider: "AHCCCS",
      policyNumber: "A00157209",
      ahcccsHealthPlan: "AHCCCS",

      // Referral & Needs (Section 4)
      referralSource: "Psychiatric Evaluation - Orbit Behavioral Health and Wellness",
      evaluatorName: "Adebukola Aladesanmi",
      evaluatorCredentials: "DNP, PMHNP-BC",
      reasonsForReferral: "Patient presents with severe stimulant and opioid use disorders. Chief complaint: 'I have a problem with fentanyl and meth addiction.' She reports a desire to enter a structured and supportive treatment environment to help her achieve sustained sobriety, improve emotional regulation, and restore stability in her life.",
      residentNeeds: "Substance use treatment, mental health stabilization (depression, anxiety, insomnia), housing assistance, case management, relapse prevention programming, medication-assisted treatment (MAT).",
      residentExpectedLOS: "Extended",
      teamExpectedLOS: "3-6 months",
      strengthsAndLimitations: "Strengths: Strong motivation for recovery, goal of achieving long-term sobriety, mother as primary emotional support, cooperative and engaged during evaluation, fair insight into impact of substance use. Limitations: 16-year substance use history, limited coping skills, emotional dysregulation, impaired impulse control during relapse, homeless, history of incomplete treatment attempts.",
      familyInvolved: "Mother identified as primary source of emotional support. Patient has 11 children, lost custody of 2 through DCS involvement.",

      // Behavioral Health Symptoms (Section 6)
      reasonForServices: "Patient requesting assistance in addressing long-standing substance use disorder and stabilizing mental health. Reports daily methamphetamine and fentanyl use with desire to achieve sustained sobriety.",
      currentBehavioralSymptoms: "Depression symptoms: guilt, difficulty concentrating, lack of motivation, hopelessness, worthlessness (5/10 severity). Anxiety symptoms: fearfulness, worry, muscle tension, fatigue, restlessness, irritability, sleep disturbance (10/10 severity at worst). Insomnia affecting daily functioning.",
      copingWithSymptoms: "Limited coping skills identified. Previous attempts at IOP treatment unsuccessful due to relapse and safety concerns.",
      symptomsLimitations: "Symptoms affecting: Activities of daily living, finances, housing, recreational activities, relationships, self-esteem, sexual activity, work, and overall life functioning.",
      immediateUrgentNeeds: "Safe housing, substance use stabilization, medication management for depression/anxiety/insomnia, relapse prevention.",
      signsOfImprovement: "Sustained sobriety, improved emotional regulation, ability to utilize relapse prevention skills independently, stable housing obtained.",
      assistanceExpectations: "Patient seeking long-term sobriety, mental health stabilization, stable housing, and improved psychosocial functioning.",
      involvedInTreatment: "Psychiatric services through Orbit Behavioral Health and Wellness, case management for housing.",

      // Medical Information (Section 5)
      allergies: "Onions (food allergy)",
      historyNonCompliance: false,
      potentialViolence: false,
      medicalUrgency: "Routine",
      personalMedicalHX: "Asthma, insomnia, constipation. Surgical history: Gallbladder removal, appendectomy, C-section x3. No prior hospitalizations for substance use. No withdrawal seizures or severe withdrawal complications reported.",
      familyMedicalHX: "Diabetes, high blood pressure",
      medicalConditions: {
        asthma: true,
        constipation: true,
      },

      // Psychiatric Presentation (Section 7)
      isCOT: false,
      personalPsychHX: "Depression, anxiety, and insomnia. Previous treatment attempts: 2 IOP enrollments (incomplete due to relapse and safety concerns), Rehab x3 in Phoenix. No prior psychiatric hospitalizations or detox. No history of suicide attempts.",
      familyPsychHX: "Unknown",
      treatmentPreferences: "Open to medication-assisted treatment and behavioral health services.",
      psychMedicationEfficacy: "No previous psychiatric medication trials reported.",

      // Risk Assessment - DTS (Section 8)
      currentSuicideIdeation: false,
      historySelfHarm: false,
      suicideIdeationDetails: "Patient denies any history of suicide attempts and currently denies suicidal ideation. Has contracted for safety during evaluation. Low suicide risk assessment.",
      suicideHistory: "No history of suicide attempts",
      mostRecentSuicideIdeation: "None reported",

      // DTS Risk Factors (JSON)
      dtsRiskFactors: {
        accessToLethalMeans: false,
        recentLoss: true, // Loss of custody of children
        socialIsolation: true, // Homeless, limited support
        substanceUse: true,
        previousAttempts: false,
        mentalHealthDiagnosis: true,
        chronicPain: false,
        hopelessness: true,
      },

      // DTS Protective Factors (JSON)
      dtsProtectiveFactors: {
        supportiveFamily: true, // Mother as support
        socialConnections: false,
        engagedInTreatment: true,
        religiousFaith: false,
        reasonsForLiving: true, // 11 children
        copingSkills: false,
      },

      // Risk Assessment - DTO (Section 9)
      historyHarmingOthers: false,
      homicidalIdeation: false,
      harmingOthersDetails: "No history of violence or aggression reported.",
      homicidalIdeationDetails: "Patient denies any homicidal ideation.",

      // DTO Risk Factors (JSON)
      dtoRiskFactors: {
        accessToWeapons: false,
        historyOfViolence: false,
        paranoidThinking: false,
        substanceUse: true,
        identifiedTarget: false,
        significantStressors: true,
      },

      // Duty to Warn
      dutyToWarnCompleted: false,

      // Hospitalization History
      previousHospitalizations: "No psychiatric hospitalizations or detox. Medical surgeries: Gallbladder, appendix, C-section x3.",
      hospitalizationDetails: "",

      // Skills Assessment (Section 10-11 - JSON format)
      hygieneSkills: {
        bathing: "Independent",
        grooming: "Independent",
        dressing: "Independent",
        toileting: "Independent",
        oralCare: "Independent",
      },
      skillsContinuation: {
        mealPrep: "Independent",
        housekeeping: "Independent",
        laundry: "Independent",
        moneyManagement: "Moderate Assistance", // Financial problems reported
        transportation: "Independent",
        communication: "Independent",
        medicationManagement: "Minimal Assistance",
      },

      // PHQ-9 Depression Screening (Section 12 - based on evaluation symptoms)
      phq9Responses: [1, 2, 2, 2, 1, 2, 2, 1, 0], // Estimated based on depression 5/10
      phq9TotalScore: 13, // Moderate depression

      // Developmental History (Section 13)
      inUteroExposure: false,
      developmentalMilestones: "Met",
      developmentalDetails: "Met all developmental milestones per evaluation.",
      immunizationStatus: "Unknown",

      // Developmental Impairments
      speechDifficulties: false,
      visualImpairment: false, // Denies vision problems
      hearingImpairment: false, // Denies hearing issues
      motorSkillsImpairment: false,
      cognitiveImpairment: false,
      socialSkillsDeficits: false,

      // Treatment Planning (Section 14)
      treatmentObjectives: "1. Achieve and maintain abstinence from fentanyl and methamphetamine. 2. Stabilize mood and anxiety symptoms. 3. Improve coping skills and emotional regulation. 4. Develop relapse prevention strategies. 5. Obtain stable housing and improve psychosocial functioning.",
      dischargePlanObjectives: "1. Sustained sobriety demonstrated. 2. Improved emotional regulation. 3. Ability to utilize relapse prevention skills independently. 4. Step-down to IOP. 5. Ongoing psychiatric medication management. 6. Participation in community recovery support groups. 7. Continued outpatient therapy. 8. Housing placement and vocational support services.",
      supportSystem: "Limited support system. Mother identified as primary emotional support. 11 children (2 lost custody through DCS). Currently homeless. Limited social connections.",
      communityResources: "NA/AA or culturally appropriate recovery services, housing assistance programs, vocational support services, case management.",

      // Legal & Substance History (Section 15)
      criminalLegalHistory: "Five prior incarcerations related to shoplifting. No current probation or active legal involvement.",
      courtOrderedTreatment: false,
      otherLegalIssues: "DCS involvement - lost custody of 2 children",

      substanceHistory: "16-year history of substance use beginning at approximately age 26. Attributes initial use to peer influence and experimentation. Daily methamphetamine use - smoking approximately $20 worth per day, last use night prior to evaluation. Heavy fentanyl use - smoking approximately 20 grams per day, spending roughly $400 daily, last use night prior to evaluation. No history of withdrawal seizures or severe withdrawal complications.",
      drugOfChoice: "Fentanyl, Methamphetamine",
      longestSobriety: "12 months (occurred during loss of custody of children through DCS)",
      substanceTreatmentHistory: "Two IOP enrollments - unable to complete either program due to relapse and safety concerns. Rehab x3 in Phoenix. Previous halfway house/sober living - did not complete due to relapse. Multiple attempts at sobriety at home - unsuccessful.",
      substanceImpact: "Significant psychosocial consequences including homelessness, family disruption (loss of custody of 2 children), legal involvement (5 incarcerations), repeated treatment failures, impaired relationships, financial problems, and difficulty maintaining employment.",
      nicotineUse: false,
      abuseHistory: "No history of sexual or physical abuse reported.",
      historyOfAbuse: "No history of abuse reported as victim.",

      // ADLs (Section 16)
      livingArrangements: "Homeless for approximately 3 months. Homelessness has significantly impacted stability and recovery efforts.",
      sourceOfFinances: "None reported - unemployed for 2 years",
      transportationMethod: "Unknown",

      adlChecklist: {
        eating: "Independent",
        bathing: "Independent",
        dressing: "Independent",
        toileting: "Independent",
        transferring: "Independent",
        continence: "Independent",
      },

      supportLevel: "Extensive",
      typicalDay: "Daily substance use (methamphetamine and fentanyl) prior to treatment. Limited structure due to homelessness and unemployment.",
      preferredActivities: "Not specified",
      strengthsAbilitiesInterests: "Strong motivation for recovery, goal-oriented (achieving long-term sobriety), has 11 children as motivation, mother as emotional support.",
      significantOthers: "11 children (9 in her life, 2 lost custody through DCS), mother (primary emotional support). Never married.",

      // Social & Education History (Section 17)
      childhoodDescription: "Not detailed in evaluation. Met all developmental milestones.",
      familyMentalHealthHistory: "Unknown",

      relationshipStatus: "Never Married",
      relationshipSatisfaction: "N/A - never married",
      friendsDescription: "Limited social connections. Peer influence attributed to initial substance use.",

      highestEducation: "10th grade (did not complete high school)",
      specialEducation: false,
      plan504: false,
      iep: false,
      educationDetails: "Completed 10th grade. Did not graduate high school.",

      currentlyEmployed: false,
      employmentDetails: "Unemployed for approximately 2 years",
      workVolunteerHistory: "Last employed 2 years ago. No military service.",
      employmentBarriers: "Homelessness, active substance use, legal history, lack of stable housing, mental health symptoms.",

      // Wellness Needs & Crisis Intervention (Section 18)
      healthNeeds: "Asthma monitoring, insomnia management, GI issues (constipation), medication management for psychiatric conditions.",
      nutritionalNeeds: "Food allergy: Onions. No other dietary restrictions reported.",
      spiritualNeeds: "Not specified",
      culturalNeeds: "Pima Native American heritage - culturally appropriate recovery services may be beneficial (NA/AA or tribal recovery programs).",
      educationHistory: "10th grade education. May benefit from GED assistance.",
      vocationalHistory: "Unemployed for 2 years. Will need vocational support services.",

      crisisInterventionPlan: "1. Patient has contracted for safety during evaluation. 2. Low suicide risk - monitor for any changes in ideation. 3. Monitor for withdrawal symptoms - recent fentanyl and methamphetamine use. 4. PRN medications available for anxiety (Vistaril). 5. If crisis occurs, provide supportive intervention and notify psychiatric provider. 6. Emergency services if needed for safety.",
      feedbackFrequency: "Weekly",
      dischargePlanning: "Discharge from BHRF when patient demonstrates sustained sobriety, improved emotional regulation, and ability to utilize relapse prevention skills independently. Step-down to IOP, ongoing psychiatric medication management, community recovery support groups, continued outpatient therapy, housing placement and vocational support services.",

      diagnosis: "F11.20 Opioid Use Disorder, Severe (Fentanyl); F15.20 Stimulant Use Disorder, Severe (Methamphetamine); F33.1 Major Depressive Disorder, Recurrent, Moderate; F41.1 Generalized Anxiety Disorder; F51.01 Insomnia Disorder",
      treatmentRecommendation: "ASAM Level 3.1 - Behavioral Health Residential Facility (BHRF). Medication-assisted treatment (MAT) evaluation for opioid use disorder, psychiatric medication management for depression/anxiety/insomnia, individual therapy utilizing trauma-informed and cognitive behavioral approaches, group therapy and relapse prevention education, case management services for housing/benefits/community resources, peer support and recovery groups.",

      // Behavioral Observations (Section 19)
      appearanceAge: "Appears stated age",
      appearanceAttire: "Casually dressed",
      appearanceGrooming: "Fair hygiene",
      appearanceDescription: "Casually dressed, fair hygiene, appears stated age.",

      demeanorMood: "Emotionally overwhelmed and frustrated with addiction",
      demeanorAffect: "Restricted but congruent with stated mood",
      demeanorEyeContact: "Intermittent but appropriate",
      demeanorCooperation: "Cooperative",
      demeanorDescription: "Cooperative and appropriately engaged throughout the interview. Calm demeanor.",

      speechArticulation: "Normal",
      speechTone: "Normal",
      speechRate: "Normal",
      speechLatency: "Normal",
      speechDescription: "Normal rate, tone, and volume.",

      motorGait: "Upright/Normal",
      motorPosture: "Normal",
      motorActivity: "Within normal limits",
      motorMannerisms: "None noted",
      motorDescription: "Psychomotor activity within normal limits.",

      cognitionThoughtContent: "No suicidal or homicidal ideation. No delusional thinking.",
      cognitionThoughtProcess: "Logical, coherent, and goal-directed",
      cognitionDelusions: "None",
      cognitionPerception: "No hallucinations reported",
      cognitionJudgment: "Impaired during active substance use but currently improving",
      cognitionImpulseControl: "Limited, particularly during periods of relapse",
      cognitionInsight: "Fair insight into the impact of substance use on her functioning",
      cognitionDescription: "Alert and oriented x4. Recent and remote memory intact.",
      estimatedIntelligence: "Average",

      // Signatures
      signatures: {
        assessorPrintedName: "Adebukola Aladesanmi, DNP, PMHNP-BC",
        assessorCredentials: "DNP, PMHNP-BC",
        assessorSignatureDate: "2026-03-09",
      },
    },
  });

  console.log("Intake updated successfully:", updated.id);

  // Update or create medications
  await prisma.intakeMedication.deleteMany({
    where: { intakeId: intakeId },
  });

  const medications = [
    {
      intakeId: intakeId,
      name: "Suboxone (Buprenorphine/Naloxone)",
      dosage: "4mg",
      frequency: "BID (twice daily)",
      route: "Sublingual",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Opioid craving/MAT for Opioid Use Disorder",
    },
    {
      intakeId: intakeId,
      name: "Wellbutrin SR (Bupropion)",
      dosage: "200mg",
      frequency: "Daily",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Depression/Mood stabilization",
    },
    {
      intakeId: intakeId,
      name: "Zoloft (Sertraline)",
      dosage: "25mg",
      frequency: "Daily",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Depression/Mood stabilization",
    },
    {
      intakeId: intakeId,
      name: "Vistaril (Hydroxyzine)",
      dosage: "50mg",
      frequency: "Q6hrs PRN",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Anxiety relief",
    },
    {
      intakeId: intakeId,
      name: "Trazodone",
      dosage: "50mg",
      frequency: "QHS (at bedtime)",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Insomnia treatment",
    },
  ];

  for (const med of medications) {
    await prisma.intakeMedication.create({ data: med });
  }

  console.log("Created", medications.length, "medications");
  console.log("\nJuliane Lebron intake update complete!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
