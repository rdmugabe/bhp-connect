import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Maria Hernandez's ASAM record...\n");

  // Find Maria's intake
  const intake = await prisma.intake.findFirst({
    where: { residentName: "Maria Hernandez" },
    include: { facility: true },
  });

  if (!intake) {
    console.log("Maria Hernandez intake not found");
    return;
  }

  console.log("Found intake:", intake.id, intake.residentName);

  // Check if ASAM already exists
  const existingASAM = await prisma.aSAMAssessment.findFirst({
    where: { intakeId: intake.id },
  });

  if (existingASAM) {
    console.log("ASAM already exists:", existingASAM.id);
    return;
  }

  // Find user for submittedBy
  const user = await prisma.user.findFirst({
    where: { role: "BHRF", email: { contains: "lucid" } },
  });

  if (!user) {
    console.log("No BHRF user found");
    return;
  }

  // Create ASAM assessment
  const asam = await prisma.aSAMAssessment.create({
    data: {
      intakeId: intake.id,
      facilityId: intake.facilityId,
      submittedBy: user.id,
      status: "APPROVED",

      // Step 1: Demographics
      patientName: "Maria Hernandez",
      assessmentDate: new Date("2026-03-10"),
      admissionDate: new Date("2026-03-10"),
      phoneNumber: "213-802-4949",
      okayToLeaveVoicemail: false,
      patientAddress: "Currently homeless. Facility address: 7515 W Odeum Ln, Phoenix AZ 85042",
      dateOfBirth: new Date("1980-03-05"),
      age: 46,
      gender: "Female",
      raceEthnicity: "Native American (Gila River Tribe)",
      preferredLanguage: "English",
      ahcccsId: "A00275188",
      insuranceType: "AHCCCS",
      insurancePlan: "AIHP",
      livingArrangement: "Homeless (approximately 1 month). Was staying with a friend but was asked to leave.",
      referredBy: "Psychiatric Evaluation - Certification of Need",
      reasonForTreatment: "Ms. Maria is seeking treatment for alcohol addiction and methamphetamine addiction. She also needs help with housing instability and mental health concerns including depression and anxiety. She stated: 'I have a problem with drinking and meth addiction; I need help and a place to stay.'",
      currentSymptoms: "Depression (guilt, difficulty concentrating, lack of motivation, hopelessness, worthlessness - PHQ-9 score: 15, moderately severe), anxiety (feeling anxious, fearful, worried, muscle tension, fatigue, restlessness, irritability, sleep problems), intermittent auditory and visual hallucinations (especially during heavy substance use), PTSD symptoms (flashbacks, nightmares, hyperarousal), and impulsive/risky behaviors.",

      // Step 2: Dimension 1 - Substance Use / Withdrawal
      substanceUseHistory: [
        {
          substance: "Amphetamines (Meth, Ice, Crank)",
          ageFirstUse: 15,
          lastUse: "2 days before evaluation",
          routeOfAdmin: "Smoke",
          frequencyPattern: "Daily",
          amountTypical: "Unable to quantify exact amount",
          yearsOfUse: 31,
        },
        {
          substance: "Alcohol",
          ageFirstUse: 15,
          lastUse: "2 days before evaluation",
          routeOfAdmin: "Oral",
          frequencyPattern: "Daily",
          amountTypical: "Unable to quantify exact amount",
          yearsOfUse: 31,
        },
        {
          substance: "Nicotine",
          ageFirstUse: null,
          lastUse: "Current",
          routeOfAdmin: "Smoke",
          frequencyPattern: "Daily",
          amountTypical: "5-10 sticks a day",
          yearsOfUse: null,
        },
      ],
      usingMoreThanIntended: true,
      usingMoreDetails: "30-year history of polysubstance use starting at age 15 due to peer pressure. Use has gotten progressively worse and recently became daily.",
      physicallyIllWhenStopping: false,
      physicallyIllDetails: "Denies history of severe withdrawal symptoms or withdrawal seizures.",
      currentWithdrawalSymptoms: false,
      withdrawalSymptomsDetails: "Currently denies experiencing active withdrawal symptoms.",
      historyOfSeriousWithdrawal: false,
      seriousWithdrawalDetails: "No history of severe withdrawal complications reported.",
      toleranceIncreased: true,
      toleranceDetails: "30-year history with progressive escalation indicates significant tolerance development.",
      recentUseChanges: true,
      recentUseChangesDetails: "Last use of both alcohol and methamphetamine was 2 days prior to evaluation. Seeking treatment at BHRF.",
      familySubstanceHistory: "Entire family uses drugs and alcohol - strong family history of substance use disorders.",
      dimension1Severity: 3, // Severe
      dimension1Comments: "30-year history of alcohol and methamphetamine use starting at age 15 due to peer pressure. Use has gotten progressively worse and recently became daily. Last use was 2 days before evaluation. While she denies severe withdrawal symptoms or history of withdrawal seizures, she remains at risk for withdrawal symptoms because of her chronic, long-term substance use. She needs monitoring within a structured setting. Also uses nicotine.",

      // Step 3: Dimension 2 - Biomedical Conditions
      medicalProviders: [
        {
          name: "Adebukola Aladesanmi, DNP, PMHNP-BC",
          specialty: "Psychiatric Nurse Practitioner",
          phone: "423-619-5364",
          address: "123 W Chandler Height, #12385, Chandler, AZ 85248",
        },
      ],
      medicalConditions: {
        visionProblems: true,
      },
      conditionsInterfere: false,
      conditionsInterfereDetails: "Vision problems (wears glasses) do not affect ability to participate in treatment.",
      priorHospitalizations: "None. Ms. Maria denies any prior hospitalizations or surgeries.",
      lifeThreatening: false,
      medicalMedications: [],
      dimension2Severity: 3,
      dimension2Comments: "Ms. Maria has no acute medical conditions at this time. However, she reports ongoing physical and psychological stress related to chronic substance use and homelessness. Her continued substance use puts her at risk for worsening health conditions. Her family history of diabetes and high blood pressure should be monitored. She wears glasses for vision problems but this does not affect her ability to participate in treatment. She is 5'5\" tall and weighs 196 lbs.",

      // Step 4: Dimension 3 - Emotional/Behavioral/Cognitive
      moodSymptoms: {
        depressedMood: true,
        hopelessness: true,
        worthlessness: true,
        guiltFeelings: true,
        anhedonia: false,
        fatigue: true,
        sleepDisturbance: true,
        appetiteChanges: false,
        concentrationDifficulty: true,
        suicidalIdeation: false,
        impulsivity: true,
        racingThoughts: true,
      },
      anxietySymptoms: {
        excessiveWorry: true,
        restlessness: true,
        muscularTension: true,
        sleepDifficulty: true,
        irritability: true,
        fearfulness: true,
        obsessiveThoughts: true,
      },
      psychosisSymptoms: {
        auditoryHallucinations: true,
        visualHallucinations: true,
        paranoia: false,
        delusions: false,
      },
      otherSymptoms: {
        sleepProblems: true,
        memoryConcentration: true,
        emotionalDysregulation: true,
        limitedCopingSkills: true,
      },
      suicidalThoughts: false,
      suicidalThoughtsDetails: "Patient denies any current suicidal ideation. No history of suicide attempts. Has contracted for safety during evaluation.",
      thoughtsOfHarmingOthers: false,
      harmingOthersDetails: "Denies any current homicidal ideation or thoughts of harming others.",
      abuseHistory: "Denies any history of abuse as a victim. However, reports PTSD symptoms from exposure to traumatic events, though the specific nature of the trauma is not detailed.",
      traumaticEvents: "Reports exposure to traumatic events with ongoing PTSD symptoms including flashbacks, nightmares, and hyperarousal. The specific traumatic events are not detailed in the records.",
      mentalIllnessDiagnosed: true,
      mentalIllnessDetails: "F33.1 Major Depressive Disorder, Recurrent, Moderate; F41.9 Anxiety Disorder, Unspecified; Substance-induced auditory and visual hallucinations; PTSD symptoms; Borderline personality features (impulsive and risky behaviors)",
      previousPsychTreatment: true,
      psychTreatmentDetails: "Completed BHRF program approximately 3 years ago successfully. One prior detoxification episode about 3 years ago. Never been on psychiatric medications before.",
      hallucinationsPresent: true,
      hallucinationsDetails: "Intermittent auditory and visual hallucinations, particularly during periods of heavy substance use.",
      furtherMHAssessmentNeeded: true,
      psychiatricMedications: [
        { name: "Vistaril", dosage: "25mg PO Q6hrs PRN", indication: "Anxiety (recommended but patient initially refused)" },
        { name: "Naltrexone", dosage: "50mg PO daily", indication: "Craving (recommended but patient initially refused)" },
        { name: "Zoloft", dosage: "25mg PO daily", indication: "Mood (recommended but patient initially refused)" },
      ],
      mentalHealthProviders: [
        { name: "Adebukola Aladesanmi, DNP, PMHNP-BC", type: "Psychiatric NP" },
      ],
      dimension3Severity: 3,
      dimension3Comments: "Ms. Maria has co-occurring mental health conditions alongside her substance use disorders. She has a history of depression and anxiety, with a PHQ-9 score of 15 indicating moderately severe depression. She reports intermittent auditory and visual hallucinations that appear to be related to or worsened by substance use. She shows emotional dysregulation, limited coping skills, and impulsive behaviors that contribute to her relapse risk. She also has PTSD symptoms from past traumatic experiences. Her thought process is logical and goal-directed, and she is alert and oriented. She has good insight and fair judgment. Impulse control is noted as good during the clinical observation. Psychiatric evaluation and medication management are recommended, along with Cognitive Behavioral Therapy (CBT) and trauma-informed counseling.",

      // Step 5: Dimension 4 - Readiness to Change
      areasAffectedByUse: {
        housing: true,
        employment: true,
        relationships: true,
        familyDynamics: true,
        legalIssues: true,
        financialProblems: true,
        physicalHealth: true,
        mentalHealth: true,
        recreationalActivities: true,
        selfEsteem: true,
        sexualActivity: false,
        everydayTasks: true,
      },
      continueUseDespitefects: true,
      continueUseDetails: "Continued use despite homelessness for 1 month, unemployment for about a year, multiple incarcerations, worsening mental health symptoms including hallucinations, and severe impact on all life areas.",
      previousTreatmentHelp: true,
      treatmentProviders: [
        { name: "BHRF Program", type: "Residential", outcome: "Completed successfully about 3 years ago" },
        { name: "Detox Program", type: "Detoxification", outcome: "Completed about 3 years ago" },
      ],
      recoverySupport: "Limited. Ms. Maria has limited social support. Her entire family uses drugs and alcohol. She was staying with a friend but was recently asked to leave. She will need help building a recovery support network.",
      recoveryBarriers: "Homelessness, family substance use (entire family uses), limited coping skills, impulsivity, emotional distress, history of multiple relapses, triggers such as 'being around it' (substances), addiction, skills gap, and lack of transportation (relies on public transit).",
      treatmentImportanceAlcohol: "Extremely/10",
      treatmentImportanceDrugs: "Extremely/10",
      treatmentImportanceDetails: "Ms. Maria demonstrates strong motivation for recovery and stabilization. She recognizes the negative impact of her addiction on her life and safety. She actively seeks help and is willing to participate in treatment services, including medication management and structured programming. Despite her history of relapse, she has shown she can achieve and maintain sobriety (12 months during pregnancy and successful completion of BHRF 3 years ago). Her motivation is a significant strength.",
      dimension4Severity: 2,
      dimension4Comments: "Patient demonstrates strong motivation for treatment despite multiple barriers. Goal is to achieve sustained sobriety, improve mental health, and restore stability. Willing to participate in structured programming. Main barriers are external (homelessness, family substance use, limited support) and skill-based (coping, emotional regulation) rather than motivational resistance. Previous treatment success is a positive indicator.",

      // Step 6: Dimension 5 - Relapse Potential
      cravingsFrequencyAlcohol: "Frequently/10",
      cravingsFrequencyDrugs: "Frequently/10",
      cravingsDetails: "30-year history with daily use indicates persistent cravings. Long pattern of relapse often triggered by impulsivity, emotional distress, and limited coping skills.",
      timeSearchingForSubstances: false,
      timeSearchingDetails: "",
      relapseWithoutTreatment: true,
      relapseDetails: "High relapse risk without structured treatment given 30-year substance use history, multiple failed attempts at staying sober, limited coping mechanisms, and emotional dysregulation.",
      awareOfTriggers: true,
      triggersList: {
        impulsivity: true,
        emotionalDistress: true,
        limitedCopingSkills: true,
        beingAroundSubstances: true,
        environmentalTriggers: true,
      },
      copingWithTriggers: "Limited coping skills for managing triggers. Her limited ability to handle emotional distress and impulsivity contributes to her relapse patterns.",
      attemptsToControl: "Multiple attempts: BHRF completed successfully 3 years ago, detox 3 years ago, attempted sobriety at home (unsuccessful).",
      longestSobriety: "12 months - during pregnancy with one of her children",
      whatHelped: "Structure has helped in the past. Longest sobriety was during pregnancy (12 months), and she successfully completed a BHRF program about 3 years ago. Structured environments with support have been effective for her.",
      whatDidntHelp: "Attempts at home sobriety unsuccessful. Living with family who uses substances not safe option.",
      dimension5Severity: 4,
      dimension5Comments: "Ms. Maria has a significant history of relapse with multiple failed attempts at staying sober. Her limited coping strategies make it difficult for her to manage triggers like emotional distress and being around substances. When she has had structure and support (pregnancy, residential treatment), she has been able to achieve and maintain sobriety. Without structured treatment, she remains at high risk for continued substance use. She needs intensive relapse prevention therapy and help developing healthy coping skills.",

      // Step 7: Dimension 6 - Recovery Environment
      supportiveRelationships: "Limited. Ms. Maria has six children and eight siblings, but she currently lacks strong supportive relationships to help with her recovery. She has never been married.",
      currentLivingSituation: "Homeless. Ms. Maria has been homeless for approximately one month. Before becoming homeless, she was temporarily staying with a friend but was recently asked to leave. She has no source of finances.",
      othersUsingDrugsInEnvironment: true,
      othersUsingDetails: "Entire family uses drugs and alcohol. Returning to family is not a safe option for recovery.",
      safetyThreats: true,
      safetyThreatsDetails: "Homelessness creates unsafe living conditions. Feels increasingly fearful for personal safety due to instability.",
      negativeImpactRelationships: true,
      negativeImpactDetails: "Damaged connections with family and others. Was asked to leave friend's home.",
      currentlyEmployedOrSchool: false,
      employmentSchoolDetails: "Unemployed - last worked about a year ago. Highest education: 9th grade.",
      socialServicesInvolved: true,
      socialServicesDetails: "Case management needs identified: Housing assistance.",
      probationParoleOfficer: "",
      probationParoleContact: "",
      dimension6Severity: 4,
      dimension6Comments: "Ms. Maria currently lacks a stable or supportive recovery environment. She is homeless and has no safe place to live. Her entire family uses drugs and alcohol, so returning to family is not a safe option for her recovery. Her housing instability significantly increases her likelihood of relapse and limits her ability to engage in outpatient treatment. She needs residential placement to provide a safe, structured environment for recovery. Case management for housing assistance will be essential for her long-term recovery planning.",

      // Step 8: Summary
      summaryRationale: {
        dimension1Rationale: "Severe (3) - 30-year history of severe alcohol and methamphetamine use with chronic daily patterns. Recent use 2 days prior. Requires monitoring in structured setting.",
        dimension2Rationale: "Low to Moderate - No acute medical conditions. Standard residential treatment appropriate. Vision problems (glasses) do not affect treatment participation.",
        dimension3Rationale: "Moderate to High - Significant mental health symptoms including moderately severe depression (PHQ-9: 15), anxiety, PTSD, and substance-induced hallucinations. Needs mental health stabilization within structured residential setting.",
        dimension4Rationale: "Low - Strong motivation for recovery is a strength. Highly motivated, cooperative, and willing to engage in treatment.",
        dimension5Rationale: "High - Chronic relapse history and limited coping skills. Unable to maintain sobriety without structure and support.",
        dimension6Rationale: "High - Homeless with no stable living environment. Family uses substances. Without residential placement, she has nowhere safe to go.",
      },
      dsm5Criteria: [],
      dsm5Diagnoses: "F10.20 - Alcohol Use Disorder, Severe; F15.20 - Stimulant (Methamphetamine) Use Disorder, Severe; F33.1 - Major Depressive Disorder, Recurrent, Moderate; F41.9 - Anxiety Disorder, Unspecified; Additional: Substance-induced auditory and visual hallucinations, PTSD symptoms, Borderline personality features",
      levelOfCareDetermination: {
        withdrawalManagement: "Low - No immediate medical detox needed",
        treatmentServices: "3.1 - Clinically Managed Low-Intensity Residential Services (BHRF)",
        otp: false,
      },
      matInterested: false,
      matDetails: "Patient initially refused recommended medications (Vistaril 25mg for anxiety, Naltrexone 50mg for craving, Zoloft 25mg for mood). May reconsider during treatment.",
      recommendedLevelOfCare: "3.1",
      levelOfCareProvided: "3.1",
      discrepancyReason: "Not Applicable",
      discrepancyExplanation: "",
      designatedTreatmentLocation: "Behavioral Health Residential Facility - Lucid Behavioral Health, 7515 W Odeum Ln, Phoenix AZ 85042",
      designatedProviderName: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      counselorName: "Richard Mugabe",
      counselorSignatureDate: new Date("2026-03-10"),
      bhpLphaName: "Chris Azode DNP, PMHNP-BC, MBA",
      bhpLphaSignatureDate: new Date("2026-03-10"),
    },
  });

  console.log("Created ASAM assessment:", asam.id);
  console.log("\nMaria Hernandez ASAM record created successfully!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
