import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the most recent Genevieve intake
  const intake = await prisma.intake.findFirst({
    where: { residentName: { contains: "Genevieve", mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    include: { medications: true },
  });

  if (!intake) {
    console.log("No intake found for Genevieve");
    return;
  }

  console.log("Found intake:", intake.id, intake.residentName);

  // Update intake with data from the evaluation PDFs
  const updated = await prisma.intake.update({
    where: { id: intake.id },
    data: {
      // Demographics (Section 1)
      residentName: "Genevieve Begay",
      dateOfBirth: new Date("1981-04-21"),
      sex: "Female",
      ethnicity: "Native American",
      nativeAmericanTribe: "Navajo",
      language: "English",
      religion: "Christian",
      sexualOrientation: "Heterosexual",

      // Contact Information (Section 2)
      patientPhone: "602-831-2698",
      patientAddress: "Homeless - Currently placed at BHRF",
      contactPreference: "Phone",

      // Insurance (Section 3)
      insuranceProvider: "AHCCCS",
      policyNumber: "A00213797",
      ahcccsHealthPlan: "AHCCCS",

      // Referral & Needs (Section 4)
      referralSource: "Psychiatric Evaluation - Certification of Need",
      evaluatorName: "Adebukola Aladesanmi",
      evaluatorCredentials: "DNP, PMHNP-BC",
      reasonsForReferral: "Persistent depressed and anxious moods, polysubstance abuse, hallucinations, history of trauma with abuse, domestic violence, and the death of her eldest child in 2011. Requesting placement in an adult behavioral health residential facility (BHRF) for additional supervised care, treatment, and stabilization.",
      residentNeeds: "Mental health stabilization, substance abuse treatment, trauma-informed care, medication management, housing assistance, and social support development.",
      residentExpectedLOS: "Extended",
      teamExpectedLOS: "3-6 months",
      strengthsAndLimitations: "Strengths: Motivated for treatment, has children as reason to stay sober, cooperative during assessment. Limitations: Homeless for 5 years, no employment, limited social support, history of trauma.",
      familyInvolved: "Limited - Children taken into foster care following domestic violence incident with ex-boyfriend. Family history includes both parents deceased (mother 2021, father 2012).",

      // Behavioral Health Symptoms (Section 6)
      reasonForServices: "Persistent depressed and anxious moods, polysubstance abuse (alcohol, methamphetamine, fentanyl), hallucinations, history of trauma with abuse, domestic violence, and the death of her eldest child in 2011.",
      currentBehavioralSymptoms: "Depressed mood, anxiety, auditory hallucinations (hears voices, sometimes a man's voice, sometimes her child's voice calling for her), anhedonia, decreased motivation, trouble sleeping, frequent crying, reports suicidal ideation with past attempt (2014), homicidal ideation (wants to hurt the person who killed her child).",
      copingWithSymptoms: "Limited coping skills currently. Previously used substances to cope with trauma and emotional distress.",
      symptomsLimitations: "Severe impairment: Unable to maintain employment (last worked April 2025), homeless for 5 years, lost custody of children, unable to maintain stable relationships, requires supervised care.",
      immediateUrgentNeeds: "Psychiatric stabilization, medication management, safe housing environment, substance abuse treatment.",
      signsOfImprovement: "Engagement in treatment, medication compliance, reduced substance use, improved mood stability, participation in therapy.",
      assistanceExpectations: "Patient seeking help for mental health and substance use issues, wants to stabilize and eventually reunite with children.",
      involvedInTreatment: "Psychiatric services through Mercy Care RBHA, potential case management services.",

      // Medical Information (Section 5)
      allergies: "No Known Drug Allergies (NKDA)",
      historyNonCompliance: false,
      potentialViolence: false,
      medicalUrgency: "Routine",
      personalMedicalHX: "Polysubstance use disorder, Major Depressive Disorder (recurrent, moderate), Generalized Anxiety Disorder, PTSD, Primary Insomnia, history of Hepatitis C treatment at 25 years old with successful completion.",
      familyMedicalHX: "Mother: History of alcohol abuse, used tobacco. Father: Unknown medical history, abusive toward family.",

      // Psychiatric Presentation (Section 7)
      isCOT: false,
      personalPsychHX: "Major Depressive Disorder (recurrent, moderate) since childhood, Generalized Anxiety Disorder since childhood, PTSD related to trauma and child's death, Primary Insomnia. Previous psychiatric hospitalizations unknown. Suicide attempt in 2014 via overdose, did not go to hospital. History of auditory and visual hallucinations.",
      familyPsychHX: "Mother had history of alcohol abuse. Father was abusive. Limited information available.",
      treatmentPreferences: "Open to medication and therapy. Currently prescribed Vistaril, Suboxone, Zoloft, Trazodone.",
      psychMedicationEfficacy: "Currently on medications that appear to be helping. Suboxone for opioid dependence, Zoloft for depression, Trazodone for insomnia, Vistaril as needed for anxiety.",

      // Risk Assessment - DTS (Section 8)
      currentSuicideIdeation: true,
      historySelfHarm: true,
      suicideIdeationDetails: "Patient reports current suicidal ideation - wants to die and end the pain. Reports hearing voices telling her to kill herself. Has plan (overdose) but denies current intent. Recent ideation within last month.",
      suicideHistory: "One prior suicide attempt in 2014 via overdose. Did not seek medical attention. Survived and continued with life.",
      suicideAttemptDetails: "2014 - Attempted suicide by overdose. Did not go to hospital. Recovered on own.",
      mostRecentSuicideIdeation: "Within the last month",
      selfHarmDetails: "History of self-harm behaviors not specified, but has suicidal ideation and previous attempt.",

      // DTS Risk Factors (JSON)
      dtsRiskFactors: {
        accessToLethalMeans: true,
        recentLoss: true,
        socialIsolation: true,
        substanceUse: true,
        previousAttempts: true,
        mentalHealthDiagnosis: true,
        chronicPain: false,
        hopelessness: true,
      },

      // DTS Protective Factors (JSON)
      dtsProtectiveFactors: {
        supportiveFamily: false,
        socialConnections: false,
        engagedInTreatment: true,
        religiousFaith: true,
        reasonsForLiving: true,
        copingSkills: false,
      },

      // Risk Assessment - DTO (Section 9)
      historyHarmingOthers: true,
      homicidalIdeation: true,
      harmingOthersDetails: "History of physical altercation with ex-boyfriend (domestic violence incident that led to loss of custody of children).",
      homicidalIdeationDetails: "Wants to hurt the person who killed her child. Targeted toward specific individual. Reports no current plan or intent to act on these thoughts.",

      // DTO Risk Factors (JSON)
      dtoRiskFactors: {
        accessToWeapons: false,
        historyOfViolence: true,
        paranoidThinking: true,
        substanceUse: true,
        identifiedTarget: true,
        significantStressors: true,
      },

      // Duty to Warn
      dutyToWarnCompleted: false,
      dutyToWarnDetails: "",

      // Hospitalization History
      previousHospitalizations: "No known psychiatric hospitalizations",
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
        moneyManagement: "Moderate Assistance",
        transportation: "Independent",
        communication: "Independent",
        medicationManagement: "Minimal Assistance",
      },

      // PHQ-9 Depression Screening (Section 12 - JSON)
      phq9Responses: [2, 3, 3, 2, 1, 3, 2, 1, 3], // Q1-Q9 scores
      phq9TotalScore: 20, // Sum of scores: 2+3+3+2+1+3+2+1+3 = 20 (Moderately Severe)

      // Developmental History (Section 13)
      inUteroExposure: false,
      inUteroExposureDetails: "",
      developmentalMilestones: "Met",
      immunizationStatus: "Unknown",
      developmentalDetails: "No reported developmental delays or concerns.",

      // Developmental Impairments
      speechDifficulties: false,
      visualImpairment: false,
      hearingImpairment: false,
      motorSkillsImpairment: false,
      cognitiveImpairment: false,
      socialSkillsDeficits: true,
      socialSkillsDetails: "History of unhealthy relationships, domestic violence involvement, difficulty maintaining stable social connections.",

      // Treatment Planning (Section 14)
      treatmentObjectives: "1. Stabilize psychiatric symptoms including depression, anxiety, and psychotic features. 2. Achieve and maintain sobriety from all substances. 3. Process trauma related to abuse, domestic violence, and child's death. 4. Develop healthy coping skills. 5. Establish stable housing and employment. 6. Work toward reunification with children if appropriate.",
      dischargePlanObjectives: "1. Psychiatrically stable on appropriate medication regimen. 2. Minimum 90 days sobriety. 3. Active participation in therapy and groups. 4. Identified stable housing placement. 5. Connected with ongoing outpatient services. 6. Demonstrated use of healthy coping skills.",
      supportSystem: "Limited support system. Both parents deceased. Children in foster care. No reported close friends or family members providing support.",
      communityResources: "Mercy Care RBHA for psychiatric services, potential housing assistance programs, vocational rehabilitation, NA/AA support groups.",

      // Legal & Substance History (Section 15)
      criminalLegalHistory: "Involvement with CPS due to domestic violence incident with ex-boyfriend. Children taken into foster care.",
      courtOrderedTreatment: false,
      courtOrderedDetails: "",
      otherLegalIssues: "CPS involvement regarding custody of children",

      substanceHistory: "32-year history of substance use. Started drinking alcohol at age 12 (around the same time her parents introduced it to her). Started using methamphetamine and fentanyl at age 25 (approximately 2006). Uses alcohol, methamphetamine, and fentanyl regularly. Reports polysubstance dependence. Last use of alcohol: 2 days prior to evaluation. Last use of methamphetamine: unknown. Last use of fentanyl: unknown.",
      drugOfChoice: "Alcohol (primary), Methamphetamine, Fentanyl",
      longestSobriety: "Unknown - reports continuous use with brief periods of abstinence",
      substanceTreatmentHistory: "Unknown previous substance abuse treatment history",
      substanceImpact: "Severe impact: Homelessness for 5 years, loss of custody of children, unemployment, legal involvement, severe psychiatric symptoms, physical health complications (hepatitis C history).",
      nicotineUse: true,
      nicotineDetails: "Uses tobacco (learned from mother who also used tobacco)",
      abuseHistory: "History of physical abuse by father during childhood. Domestic violence with ex-boyfriend as an adult. Eldest child killed in 2011 (traumatic loss).",
      historyOfAbuse: "History of physical abuse by father during childhood. Domestic violence with ex-boyfriend as an adult. Eldest child killed in 2011 (traumatic loss).",

      // ADLs (Section 16)
      livingArrangements: "Homeless for 5 years prior to current placement. Currently at BHRF.",
      sourceOfFinances: "None reported - unemployed since April 2025",
      transportationMethod: "Unknown - likely relies on others or public transportation",

      adlChecklist: {
        eating: "Independent",
        bathing: "Independent",
        dressing: "Independent",
        toileting: "Independent",
        transferring: "Independent",
        continence: "Independent",
      },

      supportLevel: "Extensive",
      typicalDay: "Patient reports difficulty with daily structure due to depression, anxiety, and substance use. Sleeps poorly due to insomnia. Limited meaningful activities due to homelessness and unemployment.",
      preferredActivities: "Unknown - limited engagement in activities due to psychiatric symptoms",
      strengthsAbilitiesInterests: "Motivated for treatment, has children as reason for recovery, cooperative and engaged during assessment, religious faith.",
      significantOthers: "5 children (4 living, 1 deceased in 2011), ex-boyfriend (relationship ended due to domestic violence), parents deceased (mother 2021, father 2012).",

      // Social & Education History (Section 17)
      childhoodDescription: "Difficult childhood with abusive father and parents who introduced her to alcohol at age 12. Experienced physical abuse from father.",
      familyMentalHealthHistory: "Mother: History of alcohol abuse. Father: Abusive, unknown mental health history.",

      relationshipStatus: "Never Married",
      relationshipSatisfaction: "N/A - not currently in relationship",
      friendsDescription: "Limited - reports social isolation, no close friendships mentioned",

      highestEducation: "GED",
      specialEducation: false,
      plan504: false,
      iep: false,
      educationDetails: "Completed GED. No special education services reported.",

      currentlyEmployed: false,
      employmentDetails: "Unemployed since April 2025",
      workVolunteerHistory: "Unknown work history prior to April 2025",
      employmentBarriers: "Homelessness, mental health symptoms, substance use, criminal/legal history, lack of transportation, childcare needs if reunified with children.",

      // Wellness Needs & Crisis Intervention (Section 18)
      healthNeeds: "Psychiatric stabilization, medication management, monitoring for substance withdrawal, hepatitis C follow-up if needed.",
      nutritionalNeeds: "No specific dietary requirements reported",
      spiritualNeeds: "Patient identifies as Christian - spiritual support may be beneficial",
      culturalNeeds: "Navajo Native American heritage - culturally appropriate services may be beneficial",
      educationHistory: "GED obtained. No barriers to treatment participation based on education.",
      vocationalHistory: "Last worked April 2025. Will need vocational assistance and job training for reintegration.",

      crisisInterventionPlan: "1. Monitor for suicidal ideation - patient reports current SI with plan (overdose) but denies intent. 2. Remove access to medications and potentially lethal means. 3. Close supervision during high-risk periods. 4. Crisis hotline numbers provided. 5. Immediate staff notification if patient expresses intent or plan to harm self or others. 6. PRN medications for agitation/anxiety. 7. Transfer to higher level of care if unable to maintain safety.",
      feedbackFrequency: "Weekly",
      dischargePlanning: "Patient will need extensive discharge planning including: stable housing, ongoing psychiatric services, substance abuse treatment, vocational services, and potential CPS involvement for reunification with children. Recommend step-down to lower level of care (outpatient) only after demonstrated stability.",

      diagnosis: "F11.20 Opioid Use Disorder, Severe; F15.20 Stimulant Use Disorder, Severe; F10.20 Alcohol Use Disorder, Severe; F33.1 Major Depressive Disorder, Recurrent, Moderate; F41.1 Generalized Anxiety Disorder; F43.10 Post-Traumatic Stress Disorder; F51.01 Primary Insomnia",
      treatmentRecommendation: "ASAM Level 3.1 - Clinically Managed Low-Intensity Residential Services (Adult Behavioral Health Residential Facility). Individual therapy, group therapy, psychiatric medication management, substance abuse treatment, trauma-informed care.",

      // Behavioral Observations (Section 19)
      appearanceAge: "Stated age or slightly older",
      appearanceHeight: "5'3\"",
      appearanceWeight: "135 lbs",
      height: "5'3\"",
      weight: "135 lbs",
      appearanceAttire: "Appropriate",
      appearanceGrooming: "Adequate hygiene and grooming",
      appearanceDescription: "Patient appeared her stated age or slightly older due to effects of long-term substance use and difficult life circumstances.",

      demeanorMood: "Depressed",
      demeanorAffect: "Constricted, anxious",
      demeanorEyeContact: "Appropriate",
      demeanorCooperation: "Cooperative",
      demeanorDescription: "Patient was cooperative throughout the evaluation and answered questions openly.",

      speechArticulation: "Clear",
      speechTone: "Normal",
      speechRate: "Normal",
      speechLatency: "Normal",
      speechDescription: "Speech was clear and coherent throughout evaluation.",

      motorGait: "Normal",
      motorPosture: "Normal",
      motorActivity: "Calm",
      motorMannerisms: "None observed",
      motorDescription: "No unusual motor activity or mannerisms observed.",

      cognitionThoughtContent: "Depressive themes, trauma-related content, suicidal ideation, homicidal ideation toward specific target (person who killed child), auditory hallucinations (voices, including male voice and child's voice calling for her)",
      cognitionThoughtProcess: "Linear and goal-directed",
      cognitionDelusions: "No delusions observed",
      cognitionPerception: "Auditory hallucinations - hears voices, sometimes a man's voice, sometimes her child's voice calling for her. Also reports some visual hallucinations.",
      cognitionJudgment: "Fair - seeking treatment but history of poor judgment related to substance use",
      cognitionImpulseControl: "Fair - history of impulsive behavior related to substance use",
      cognitionInsight: "Fair - aware of problems and seeking help but may have limited insight into full extent of issues",
      cognitionDescription: "Patient was alert and oriented during evaluation. Memory appeared intact for recent and remote events.",
      estimatedIntelligence: "Average",

      // Signatures (Section 20 - JSON) - Leave assessor info for reference
      signatures: {
        assessorPrintedName: "Adebukola Aladesanmi, DNP, PMHNP-BC",
        assessorCredentials: "DNP, PMHNP-BC",
      },
    },
  });

  console.log("Intake updated successfully:", updated.id);

  // Update or create medications
  // First, delete existing medications
  await prisma.intakeMedication.deleteMany({
    where: { intakeId: intake.id },
  });

  // Create new medications
  const medications = [
    {
      intakeId: intake.id,
      name: "Vistaril (Hydroxyzine)",
      dosage: "As prescribed",
      frequency: "PRN",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Anxiety relief",
    },
    {
      intakeId: intake.id,
      name: "Vitamin C",
      dosage: "As prescribed",
      frequency: "Daily",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Supplementation",
    },
    {
      intakeId: intake.id,
      name: "Suboxone (Buprenorphine/Naloxone)",
      dosage: "As prescribed",
      frequency: "Daily",
      route: "Sublingual",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Opioid use disorder treatment (MAT)",
    },
    {
      intakeId: intake.id,
      name: "Zoloft (Sertraline)",
      dosage: "As prescribed",
      frequency: "Daily",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Depression and anxiety treatment",
    },
    {
      intakeId: intake.id,
      name: "Trazodone",
      dosage: "As prescribed",
      frequency: "Daily at bedtime",
      route: "Oral",
      prescriber: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      purpose: "Insomnia treatment",
    },
  ];

  for (const med of medications) {
    await prisma.intakeMedication.create({ data: med });
  }

  console.log("Created", medications.length, "medications");
  console.log("\nGenevieve Begay intake update complete!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
