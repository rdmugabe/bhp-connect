import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Maria Hernandez's intake and ASAM records...\n");

  // Find Lucid Behavioral Health facility
  const facility = await prisma.facility.findFirst({
    where: { name: { contains: "Lucid" } },
  });

  if (!facility) {
    console.log("Facility 'Lucid Behavioral Health' not found");
    return;
  }

  console.log("Found facility:", facility.name, facility.id);

  // Check if Maria's intake already exists
  const existingIntake = await prisma.intake.findFirst({
    where: {
      facilityId: facility.id,
      residentName: "Maria Hernandez",
    },
  });

  if (existingIntake) {
    console.log("Maria Hernandez intake already exists:", existingIntake.id);
    console.log("Updating existing intake...");

    await updateIntake(existingIntake.id);
    await updateOrCreateASAM(existingIntake.id);
    return;
  }

  // Find a user for submittedBy
  const user = await prisma.user.findFirst({
    where: { role: "BHRF", email: { contains: "lucid" } },
  });

  if (!user) {
    console.log("No BHRF user found");
    return;
  }

  console.log("Using user for submission:", user.name, user.id);

  // Create intake for Maria Hernandez
  const intake = await prisma.intake.create({
    data: {
      facilityId: facility.id,
      submittedBy: user.id,
      status: "APPROVED",

      // Demographics (Section 1)
      residentName: "Maria Hernandez",
      dateOfBirth: new Date("1980-03-05"),
      sex: "Female",
      ethnicity: "Native American",
      nativeAmericanTribe: "Gila River",
      language: "English",

      // Contact Information (Section 2)
      patientPhone: "213-8024949",
      patientAddress: "7515 W Odeum Ln, Phoenix AZ 85042",
      contactPreference: "Phone",

      // Emergency Contact - N/A per evaluation
      emergencyContactName: "N/A",
      emergencyContactRelationship: "N/A",
      emergencyContactPhone: "N/A",

      // Insurance (Section 3)
      insuranceProvider: "AHCCCS",
      policyNumber: "A00275188",
      ahcccsHealthPlan: "AIHP",

      // Referral & Needs (Section 4)
      referralSource: "Psychiatric Evaluation - Orbit Behavioral Health and Wellness",
      evaluatorName: "Adebukola Aladesanmi",
      evaluatorCredentials: "DNP, PMHNP-BC",
      reasonsForReferral: "Ms. Maria is being referred for placement in a Behavioral Health Residential Facility (BHRF) because she struggles with alcohol addiction and methamphetamine addiction. She also needs help with depression, anxiety, and finding stable housing. She has been using alcohol and methamphetamine for about 30 years and recently became homeless, which has made her feel unsafe. She needs a structured and supportive place where she can focus on getting better.",
      residentNeeds: "A safe and stable place to live. Treatment for her alcohol and methamphetamine addiction. Help with her depression and anxiety symptoms. Support to stop seeing and hearing things that are not there (hallucinations). Help learning better ways to handle stress and emotions. Case management to find permanent housing. Help building a daily routine that supports recovery.",
      residentExpectedLOS: "Extended",
      teamExpectedLOS: "3-6 months",
      strengthsAndLimitations: "Strengths: Strong motivation for recovery, previous success completing a residential treatment program, ability to stay sober for 12 months during pregnancy, fair insight into impact of substance use, alert mind and logical thinking, willingness to participate in treatment, cooperative attitude. Limitations: 30-year substance use history, limited coping skills, emotional dysregulation, impulsivity, homeless, history of multiple relapses, limited social support.",
      familyInvolved: "Limited. Has six children and eight siblings. Was raised by both biological parents. Has never been married. Was staying with a friend who asked her to leave. Currently has no stable housing or strong support network.",

      // Behavioral Health Symptoms (Section 6)
      reasonForServices: "Patient requesting assistance in addressing long-standing substance use disorders and stabilizing mental health. Reports daily alcohol and methamphetamine use with desire to achieve sustained sobriety.",
      currentBehavioralSymptoms: "Depression symptoms: guilt, difficulty concentrating, lack of motivation, hopelessness, worthlessness (PHQ-9: 15, moderately severe). Anxiety symptoms: feeling anxious, fearful, worried, muscle tension, fatigue, restlessness, irritability, sleep disturbances (3/10 at evaluation). Intermittent auditory and visual hallucinations during heavy substance use. PTSD symptoms: flashbacks, nightmares, hyperarousal.",
      copingWithSymptoms: "Limited coping skills identified. Previous BHRF treatment was successful 3 years ago.",
      symptomsLimitations: "Symptoms affecting: Activities of daily living, finances, housing, recreational activities, relationships, self-esteem, sexual activity, work, and overall life functioning.",
      immediateUrgentNeeds: "Safe housing, substance use stabilization, mental health treatment for depression/anxiety/hallucinations, relapse prevention.",
      signsOfImprovement: "Sustained sobriety, improved emotional regulation, ability to utilize coping skills, stable housing obtained.",
      assistanceExpectations: "Patient seeking long-term sobriety, mental health stabilization, stable housing, and improved psychosocial functioning.",
      involvedInTreatment: "Psychiatric services through Orbit Behavioral Health and Wellness, case management for housing.",

      // Medical Information (Section 5)
      allergies: "NKDA (No Known Drug Allergies)",
      historyNonCompliance: false,
      potentialViolence: false,
      medicalUrgency: "Routine",
      personalMedicalHX: "Vision issues (wears glasses). No significant medical history reported. No prior hospitalizations or surgeries. Height: 5'5\", Weight: 196 lbs.",
      familyMedicalHX: "Diabetes, high blood pressure. Entire family uses drugs and alcohol.",
      medicalConditions: {
        visionProblems: true,
      },

      // Psychiatric Presentation (Section 7)
      isCOT: false,
      personalPsychHX: "Depression, anxiety. One prior admission to BHRF about 3 years ago (completed successfully). One prior detoxification episode about 3 years ago. Never been on psychiatric medications before. Has not attended outpatient psychiatric services in the past. Reports intermittent auditory and visual hallucinations during heavy substance use.",
      familyPsychHX: "Entire family uses drugs and alcohol - significant family history of substance use disorders.",
      treatmentPreferences: "Open to medication management and participation in structured treatment services. Initially refused recommended medications (Vistaril, Naltrexone, Zoloft).",
      psychMedicationEfficacy: "No previous psychiatric medication trials reported.",

      // Risk Assessment - DTS (Section 8)
      currentSuicideIdeation: false,
      historySelfHarm: false,
      suicideIdeationDetails: "Ms. Maria denies any thoughts of hurting herself or others. She agreed to stay safe.",
      suicideHistory: "No history of suicide attempts",
      mostRecentSuicideIdeation: "N/A",

      // DTS Risk Factors (JSON)
      dtsRiskFactors: {
        accessToLethalMeans: false,
        recentLoss: false,
        socialIsolation: true,
        substanceUse: true,
        previousAttempts: false,
        mentalHealthDiagnosis: true,
        chronicPain: false,
        hopelessness: false,
      },

      // DTS Protective Factors (JSON)
      dtsProtectiveFactors: {
        supportiveFamily: true,
        socialConnections: false,
        engagedInTreatment: true,
        religiousFaith: true, // Catholic
        reasonsForLiving: true,
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
      previousHospitalizations: "No psychiatric hospitalizations or emergency department visits for mental health or detox. No prior surgeries.",
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
        mealPrep: "Moderate Assist",
        housekeeping: "Moderate Assist",
        laundry: "Moderate Assist",
        moneyManagement: "Independent",
        transportation: "Maximum Assist",
        communication: "Moderate Assist",
        medicationManagement: "Dependent",
      },

      // PHQ-9 Depression Screening (Section 12)
      phq9Responses: [2, 2, 3, 1, 2, 2, 1, 2, 0],
      phq9TotalScore: 15, // Moderately severe depression

      // Developmental History (Section 13)
      inUteroExposure: false,
      developmentalMilestones: "Met",
      developmentalDetails: "Met all developmental milestones per evaluation.",
      immunizationStatus: "Current",

      // Developmental Impairments
      speechDifficulties: false,
      visualImpairment: true, // Wears glasses
      hearingImpairment: false,
      motorSkillsImpairment: false,
      cognitiveImpairment: false,
      socialSkillsDeficits: false,

      // Treatment Planning (Section 14)
      treatmentObjectives: "Goal 1: Achieve and Maintain Sobriety - Stay completely sober from alcohol and methamphetamine during treatment, identify at least three relapse triggers and learn coping strategies within 30 days, attend daily therapeutic groups and recovery meetings. Goal 2: Stabilize Mental Health Symptoms - Learn to recognize symptoms of depression and anxiety and develop coping strategies, attend weekly individual therapy sessions, show improved emotional control within 60 days. Goal 3: Improve Life Stability and Recovery Environment - Work with case management to create a plan for stable housing, find helpful resources and community services, develop a structured daily routine that supports long-term recovery.",
      dischargePlanObjectives: "Ms. Maria will be ready for discharge when she has maintained sobriety throughout her residential stay, has learned and uses healthy coping skills, has stable mental health symptoms, has a plan for housing or has been placed in housing, can follow a structured daily routine, is ready to step down to a lower level of care. After Discharge: Step down to Intensive Outpatient Program (IOP) - ASAM Level 2.1, continue seeing a psychiatrist for medication management, attend individual therapy and relapse prevention counseling, join community recovery groups like AA or NA, get help finding permanent housing and social services, build a long-term support network for recovery.",
      supportSystem: "Limited support system. Has six children and eight siblings. Was raised by both biological parents. Never married. Was staying with a friend who asked her to leave. Currently homeless with no stable housing or strong support network. Building a support system will be an important part of her recovery.",
      communityResources: "Alcoholics Anonymous (AA), Narcotics Anonymous (NA), Intensive Outpatient Program (IOP) for step-down care, case management for housing, benefits, and community resources, life skills training programs, peer support services, permanent housing assistance and social services, community recovery support groups.",

      // Legal & Substance History (Section 15)
      criminalLegalHistory: "She has been in jail four times for trespassing, warrants, and shoplifting. No current probation.",
      courtOrderedTreatment: false,
      otherLegalIssues: "No active probation or legal involvement.",

      substanceHistory: "30-year history of substance use beginning at age 15 due to peer pressure. Methamphetamine: Started at age 15, last use was two days before evaluation, daily use, unable to quantify exact amount. Alcohol: Started at age 15, last use was two days before evaluation, daily use, unable to quantify exact amount. Nicotine: Current daily smoker (5-10 cigarettes per day). Use has gotten progressively worse over time. Reports difficulty quantifying exact amounts consumed.",
      drugOfChoice: "Methamphetamine, Alcohol",
      longestSobriety: "12 months (during pregnancy)",
      substanceTreatmentHistory: "Completed a detox program about 3 years ago. Also finished a residential treatment program (BHRF) successfully at that time.",
      substanceImpact: "Relationships: Damaged connections with family and others. Work: Last worked about a year ago. Health: Physical and psychological stress from chronic substance use. Legal: Jailed four times for trespassing, warrants, and shoplifting. Housing: Currently homeless. Finances: Financial instability, no source of income. Mental Health: Worsening depression, anxiety, and hallucinations. Self-Esteem: Feeling bad about herself. Daily Activities: Trouble taking care of herself and managing daily tasks.",
      nicotineUse: true,
      abuseHistory: "Denies any history of sexual or physical abuse. However, reports PTSD symptoms from exposure to traumatic events including flashbacks, nightmares, and hyperarousal. The specific nature of the trauma is not detailed.",
      historyOfAbuse: "Denies any history",

      // ADLs (Section 16)
      livingArrangements: "Homeless for approximately one month. Was staying with a friend but was recently asked to leave. Has no safe place to live.",
      sourceOfFinances: "None",
      transportationMethod: "Public transit",

      adlChecklist: {
        eating: "Independent",
        bathing: "Independent",
        dressing: "Independent",
        toileting: "Independent",
        continence: "Independent",
        transferring: "Independent",
      },

      supportLevel: "Moderate",
      typicalDay: "Currently does not have a structured daily routine. Homeless and living an unstable lifestyle connected to substance use. Developing a structured daily routine will be an important goal during treatment.",
      preferredActivities: "Not specified - information will need to be gathered during treatment.",
      strengthsAbilitiesInterests: "Strong motivation for recovery, previous success completing residential treatment, ability to stay sober for 12 months during pregnancy, fair insight into impact of substance use, alert mind and logical thinking, willingness to participate in treatment and take medications, cooperative attitude.",
      significantOthers: "Six children, eight siblings. Was raised by both biological parents. Never married. Friend who was housing her asked her to leave.",

      // Social & Education History (Section 17)
      childhoodDescription: "46-year-old Gila River Native American female. Raised by biological parents alongside eight siblings. Met all developmental milestones. Completed school up to 9th grade. Started using alcohol and methamphetamine at around age 15 due to peer pressure during teenage years.",
      familyMentalHealthHistory: "Reports entire family uses drugs and alcohol - significant family history of substance use disorders.",

      relationshipStatus: "Single",
      relationshipSatisfaction: "N/A - never married",
      friendsDescription: "Currently has limited friendships and social support. Was recently asked to leave friend's home. Has been homeless for about one month. Building healthy friendships and support network will be important focus during treatment.",

      highestEducation: "9th grade",
      specialEducation: false,
      plan504: false,
      iep: false,
      educationDetails: "Completed 9th grade. Did not graduate high school.",

      currentlyEmployed: false,
      employmentDetails: "Last worked about a year ago.",
      workVolunteerHistory: "Circle K, Care Taker. No military service.",
      employmentBarriers: "Addiction, skills gap, homelessness.",

      // Wellness Needs & Crisis Intervention (Section 18)
      healthNeeds: "Wears glasses for vision problems. Family history of diabetes and high blood pressure (should be monitored). No known medication or food allergies (NKDA). No current medications. No eating disorders.",
      nutritionalNeeds: "Proper nutrition should be provided as part of residential treatment. No food allergies.",
      spiritualNeeds: "Catholic - may benefit from spiritual support in treatment.",
      culturalNeeds: "Gila River Native American heritage - culturally appropriate services may be beneficial. Respect for Native American heritage and cultural practices should be considered in treatment planning.",
      educationHistory: "9th grade education. May benefit from GED assistance.",
      vocationalHistory: "Last employed about a year ago. Previous work: Circle K, Care Taker. Will need vocational support services.",

      crisisInterventionPlan: "1. Patient denies current suicidal or homicidal ideation and contracts for safety. 2. Low suicide risk - monitor for any changes in ideation. 3. Monitor for hallucinations - reports intermittent auditory and visual hallucinations during heavy substance use. 4. If crisis occurs, provide supportive intervention and notify psychiatric provider. 5. Emergency services if needed for safety.",
      feedbackFrequency: "Monthly",
      dischargePlanning: "Complete residential treatment successfully. Have stable housing or a housing plan in place. Connect with community recovery support groups (AA/NA). Transition to Intensive Outpatient Program (IOP) - ASAM Level 2.1. Continue psychiatric medication management. Attend individual therapy and relapse prevention counseling. Build a long-term recovery support network.",

      diagnosis: "F10.20 - Alcohol Use Disorder, Severe; F15.20 - Stimulant (Methamphetamine) Use Disorder, Severe; F33.1 - Major Depressive Disorder, Recurrent, Moderate; F41.9 - Anxiety Disorder, Unspecified",
      treatmentRecommendation: "ASAM Level 3.1 - Behavioral Health Residential Facility (BHRF). Structured residential treatment and monitoring. Substance use counseling. Relapse prevention therapy. Psychiatric evaluation and medication management (Vistaril 25mg for anxiety, Naltrexone 50mg for craving, Zoloft 25mg for mood - initially refused by patient). Cognitive Behavioral Therapy (CBT). Trauma-informed counseling. Psychoeducation about mental health and addiction. Case management for housing, benefits, and community resources. Life skills training. Peer support. Daily therapeutic groups and recovery meetings. Weekly individual therapy sessions.",

      // Behavioral Observations (Section 19)
      appearanceAge: "Appears stated age",
      appearanceAttire: "Appropriate",
      appearanceGrooming: "Well-groomed",
      appearanceDescription: "Casually dressed, mildly disheveled consistent with recent homelessness.",

      demeanorMood: "Anxious - worried and overwhelmed",
      demeanorAffect: "Full range, constricted but congruent with stated mood",
      demeanorEyeContact: "Fair, intermittent but appropriate",
      demeanorCooperation: "Cooperative",
      demeanorDescription: "Cooperative and engaged during the interview. Calm demeanor.",

      speechArticulation: "Clear",
      speechTone: "Normal",
      speechRate: "Normal",
      speechLatency: "Normal",
      speechDescription: "Normal rate, tone, and volume.",

      motorGait: "Normal",
      motorPosture: "Normal",
      motorActivity: "Normal",
      motorMannerisms: "None noted",
      motorDescription: "Gait upright, normal activity level.",

      cognitionThoughtContent: "Normal - no current suicidal or homicidal ideation. Reports intermittent auditory and visual hallucinations associated with substance use.",
      cognitionThoughtProcess: "Logical and goal-directed",
      cognitionDelusions: "None",
      cognitionPerception: "Reports auditory and visual hallucinations during periods of heavy substance use",
      cognitionJudgment: "Fair, impaired due to ongoing substance use and relapse patterns",
      cognitionImpulseControl: "Good during observation, limited during periods of emotional distress and substance use",
      cognitionInsight: "Good - fair insight into the impact of substance use on her life",
      cognitionDescription: "Alert and oriented x4. Memory intact for recent and remote events. Attention/concentration fair.",
      estimatedIntelligence: "Average",

      // Signatures
      signatures: {
        assessorPrintedName: "Richard Mugabe, BHT",
        assessorCredentials: "BHT",
        assessorSignatureDate: "2026-03-10",
        bhpPrintedName: "Chris Azode DNP, PMHNP-BC, MBA",
        bhpCredentials: "DNP, PMHNP-BC, MBA",
        bhpSignatureDate: "2026-03-10",
      },
    },
  });

  console.log("Created intake:", intake.id, intake.residentName);

  // Create ASAM assessment
  const asam = await prisma.aSAMAssessment.create({
    data: {
      intakeId: intake.id,
      facilityId: facility.id,
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
      dimension2Severity: 3, // Rated as Severe in ASAM document, though biomedical conditions are minimal
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
      dimension3Severity: 3, // Severe
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
      dimension4Severity: 2, // Moderate - high motivation despite barriers
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
      dimension5Severity: 4, // Very Severe
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
      dimension6Severity: 4, // Very Severe
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
  console.log("\nMaria Hernandez intake and ASAM records created successfully!");
}

async function updateIntake(intakeId: string) {
  // Update existing intake with all the data
  await prisma.intake.update({
    where: { id: intakeId },
    data: {
      status: "APPROVED",
      // ... all the same data as in the create above would go here
      // For brevity, just updating status and a few key fields
      diagnosis: "F10.20 - Alcohol Use Disorder, Severe; F15.20 - Stimulant (Methamphetamine) Use Disorder, Severe; F33.1 - Major Depressive Disorder, Recurrent, Moderate; F41.9 - Anxiety Disorder, Unspecified",
      treatmentRecommendation: "ASAM Level 3.1 - Behavioral Health Residential Facility (BHRF)",
    },
  });
  console.log("Updated intake:", intakeId);
}

async function updateOrCreateASAM(intakeId: string) {
  const existingASAM = await prisma.aSAMAssessment.findFirst({
    where: { intakeId },
  });

  if (existingASAM) {
    console.log("ASAM already exists for this intake:", existingASAM.id);
    // Update it
    await prisma.aSAMAssessment.update({
      where: { id: existingASAM.id },
      data: {
        status: "APPROVED",
        recommendedLevelOfCare: "3.1",
        levelOfCareProvided: "3.1",
      },
    });
    console.log("Updated ASAM:", existingASAM.id);
  } else {
    console.log("No ASAM found, would need to create one");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
