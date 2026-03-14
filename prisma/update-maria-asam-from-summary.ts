import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateMariaASAMFromSummary() {
  const asamId = "cmmnwg9f00006cr0evqfhqwb8";

  // Data extracted from Maria Hernandez - ASAM Assessment.md
  const updateData = {
    // Demographics
    phoneNumber: "213-802-4949",
    patientAddress: "Currently homeless. Facility address: 7515 W Odeum Ln, Phoenix AZ 85042",
    gender: "Female",
    raceEthnicity: "Native American (Gila River Tribe)",
    preferredLanguage: "English",
    ahcccsId: "A00275188",
    insuranceType: "AHCCCS",
    insurancePlan: "AIHP",
    livingArrangement: "Homeless (approximately 1 month). Was staying with a friend but was asked to leave.",
    referredBy: "Self-referred",

    reasonForTreatment: `Ms. Maria is seeking treatment for alcohol addiction and methamphetamine addiction. She also needs help with housing instability and mental health concerns including depression and anxiety. She stated: "I have a problem with drinking and meth addiction; I need help and a place to stay."`,

    currentSymptoms: `Depression (guilt, difficulty concentrating, lack of motivation, hopelessness, worthlessness - PHQ-9 score: 15, moderately severe), anxiety (feeling anxious, fearful, worried, muscle tension, fatigue, restlessness, irritability, sleep problems), intermittent auditory and visual hallucinations (especially during heavy substance use), PTSD symptoms (flashbacks, nightmares, hyperarousal), and impulsive/risky behaviors.`,

    // Dimension 1: Substance Use / Withdrawal Potential
    substanceUseHistory: [
      {
        substance: "Methamphetamine",
        route: "Not specified",
        frequency: "Daily (recent pattern)",
        lastUse: "2 days before evaluation",
        duration: "30 years",
        firstUseAge: "15",
        amount: "Unable to quantify exact amount"
      },
      {
        substance: "Alcohol",
        route: "Not specified",
        frequency: "Daily (recent pattern)",
        lastUse: "2 days before evaluation",
        duration: "30 years",
        firstUseAge: "15",
        amount: "Unable to quantify exact amount"
      },
      {
        substance: "Nicotine",
        route: "Not specified",
        frequency: "Ongoing",
        lastUse: "Current",
        duration: "Not specified"
      }
    ],
    usingMoreThanIntended: true,
    usingMoreDetails: "Ms. Maria reports her substance use has gotten worse over time and recently became a daily habit. She has trouble controlling how much she uses.",
    physicallyIllWhenStopping: false,
    physicallyIllDetails: "No severe withdrawal complications reported. She denies a history of alcohol withdrawal seizures or other serious withdrawal problems.",
    currentWithdrawalSymptoms: false,
    withdrawalSymptomsDetails: "At the time of the evaluation, Ms. Maria denied experiencing active withdrawal symptoms or severe cravings.",
    historyOfSeriousWithdrawal: false,
    seriousWithdrawalDetails: "She denies any history of withdrawal seizures or other severe withdrawal complications. She had one detox episode about 3 years ago.",
    toleranceIncreased: true,
    toleranceDetails: "Her substance use has gotten progressively worse over 30 years, going from occasional use to daily use. This shows her tolerance has increased over time.",
    recentUseChanges: true,
    recentUseChangesDetails: "Her substance use has recently gotten worse and has become a daily pattern.",
    familySubstanceHistory: "Ms. Maria reports that her entire family uses drugs and alcohol. This suggests a strong family history of substance use disorders.",
    dimension1Severity: 2, // Moderate
    dimension1Comments: `Ms. Maria has a 30-year history of alcohol and methamphetamine use that started at age 15 due to peer pressure. Her use has gotten progressively worse and recently became daily. Her last use of both substances was 2 days before the evaluation. While she denies severe withdrawal symptoms or a history of withdrawal seizures at this time, she remains at risk for withdrawal symptoms because of her chronic, long-term substance use. She needs monitoring within a structured setting. She also uses nicotine.`,

    // Dimension 2: Biomedical Conditions
    medicalConditions: [
      "Vision problems (wears glasses)",
      "Family history of diabetes",
      "Family history of high blood pressure"
    ],
    conditionsInterfere: false,
    conditionsInterfereDetails: "Ms. Maria's vision issues are managed with glasses and do not interfere with her ability to participate in treatment.",
    lifeThreatening: false,
    priorHospitalizations: "None. Ms. Maria denies any prior hospitalizations or surgeries.",
    medicalMedications: [],
    dimension2Severity: 1, // Low
    dimension2Comments: `Ms. Maria has no acute medical conditions at this time. However, she reports ongoing physical and psychological stress related to chronic substance use and homelessness. Her continued substance use puts her at risk for worsening health conditions. Her family history of diabetes and high blood pressure should be monitored. She wears glasses for vision problems but this does not affect her ability to participate in treatment. She is 5'5" tall and weighs 196 lbs.`,

    // Dimension 3: Emotional, Behavioral & Cognitive Conditions
    moodSymptoms: [
      "Guilt",
      "Difficulty concentrating",
      "Lack of motivation",
      "Hopelessness",
      "Worthlessness",
      "Worried",
      "Overwhelmed"
    ],
    anxietySymptoms: [
      "Feeling anxious",
      "Fearful",
      "Worried",
      "Muscle tension",
      "Fatigue",
      "Restlessness",
      "Irritability",
      "Sleep problems"
    ],
    psychosisSymptoms: [
      "Intermittent auditory hallucinations",
      "Intermittent visual hallucinations"
    ],
    otherSymptoms: [
      "PTSD - flashbacks",
      "PTSD - nightmares",
      "PTSD - hyperarousal",
      "Impulsive behaviors",
      "Risky behaviors (unsafe sex, spending sprees)"
    ],
    suicidalThoughts: false,
    suicidalThoughtsDetails: "Ms. Maria denies any thoughts of hurting herself.",
    thoughtsOfHarmingOthers: false,
    harmingOthersDetails: "Ms. Maria denies any thoughts of harming others.",
    abuseHistory: "Ms. Maria denies any history of abuse as a victim. However, she reports PTSD symptoms from exposure to traumatic events, though the specific nature of the trauma is not detailed.",
    traumaticEvents: "Ms. Maria reports exposure to traumatic events with ongoing PTSD symptoms including flashbacks, nightmares, and hyperarousal. The specific traumatic events are not detailed in the records.",
    mentalIllnessDiagnosed: true,
    mentalIllnessDetails: "Ms. Maria has a psychiatric history of depression and anxiety.",
    previousPsychTreatment: true,
    psychTreatmentDetails: "Ms. Maria completed a Behavioral Health Residential Facility (BHRF) program successfully about 3 years ago. She also had one detox episode about 3 years ago. She has not attended outpatient psychiatric services.",
    hallucinationsPresent: true,
    hallucinationsDetails: "Ms. Maria reports intermittent auditory and visual hallucinations, particularly during periods of heavy substance use.",
    furtherMHAssessmentNeeded: true,
    furtherMHAssessmentDetails: "Ongoing mental health assessment is recommended to monitor her depression, anxiety, hallucinations, and PTSD symptoms, especially as she achieves sobriety and these symptoms can be better evaluated without the influence of substances.",
    psychiatricMedications: [
      {
        medication: "Vistaril",
        dose: "25mg",
        reason: "Anxiety",
        effectiveness: "Recommended but refused"
      },
      {
        medication: "Naltrexone",
        dose: "50mg",
        reason: "Craving",
        effectiveness: "Recommended but refused"
      },
      {
        medication: "Zoloft",
        dose: "25mg",
        reason: "Mood",
        effectiveness: "Recommended but refused"
      }
    ],
    dimension3Severity: 3, // Moderate to High
    dimension3Comments: `Ms. Maria has co-occurring mental health conditions alongside her substance use disorders. She has a history of depression and anxiety, with a PHQ-9 score of 15 indicating moderately severe depression. She reports intermittent auditory and visual hallucinations that appear to be related to or worsened by substance use. She shows emotional dysregulation, limited coping skills, and impulsive behaviors that contribute to her relapse risk. She also has PTSD symptoms from past traumatic experiences. Her thought process is logical and goal-directed, and she is alert and oriented. She has good insight and fair judgment. Impulse control is noted as good during the clinical observation. Psychiatric evaluation and medication management are recommended, along with Cognitive Behavioral Therapy (CBT) and trauma-informed counseling.`,

    // Dimension 4: Readiness to Change
    areasAffectedByUse: [
      "Daily activities",
      "Finances",
      "Housing (homeless)",
      "Relationships",
      "Work",
      "Self-esteem",
      "Recreational activities",
      "Sexual activity",
      "Legal status"
    ],
    continueUseDespitefects: true,
    continueUseDetails: "Ms. Maria has continued using substances despite the negative effects on her life, including homelessness, relationship problems, and legal issues. However, she now recognizes the harm and is seeking help.",
    previousTreatmentHelp: true,
    treatmentProviders: [
      {
        name: "Previous BHRF",
        contact: "Completed about 3 years ago"
      }
    ],
    recoverySupport: "Limited. Ms. Maria has limited social support. Her entire family uses drugs and alcohol. She was staying with a friend but was recently asked to leave. She will need help building a recovery support network.",
    recoveryBarriers: "Homelessness, family substance use (entire family uses), limited coping skills, impulsivity, emotional distress, history of multiple relapses, triggers such as \"being around it\" (substances), addiction, skills gap, and lack of transportation (relies on public transit).",
    treatmentImportanceAlcohol: "Extremely",
    treatmentImportanceDrugs: "Extremely",
    treatmentImportanceDetails: "Ms. Maria expresses strong motivation for recovery. She actively seeks help and states she wants to achieve long-term sobriety. She recognizes that her addiction has negatively affected her life and wants to rebuild stability.",
    dimension4Severity: 1, // Low (readiness is a strength)
    dimension4Comments: `Ms. Maria demonstrates strong motivation for recovery and stabilization. She recognizes the negative impact of her addiction on her life and safety. She actively seeks help and is willing to participate in treatment services, including medication management and structured programming. Despite her history of relapse, she has shown she can achieve and maintain sobriety (12 months during pregnancy and successful completion of BHRF 3 years ago). Her motivation is a significant strength. However, she has limited social support and many barriers to recovery that will need to be addressed during treatment.`,

    // Dimension 5: Relapse Potential
    cravingsFrequencyAlcohol: "None",
    cravingsFrequencyDrugs: "None",
    cravingsDetails: "Ms. Maria denied experiencing severe cravings at the time of evaluation.",
    timeSearchingForSubstances: false,
    timeSearchingDetails: "Not specified in records. However, her daily use pattern suggests significant time spent on substance use.",
    relapseWithoutTreatment: true,
    relapseDetails: "Ms. Maria has a significant history of relapse. She has tried to stay sober while at home but has been unsuccessful. Without structured treatment, she remains at high risk for continued substance use.",
    awareOfTriggers: true,
    triggersList: [
      "Being around substances",
      "Emotional distress",
      "Impulsivity",
      "Environmental stressors"
    ],
    copingWithTriggers: "Ms. Maria has limited coping skills for managing triggers. Her limited ability to handle emotional distress and impulsivity contributes to her relapse patterns.",
    longestSobriety: "Approximately 12 months (during pregnancy)",
    whatHelped: "Structure has helped Ms. Maria in the past. Her longest sobriety was during pregnancy (12 months), and she successfully completed a residential treatment program about 3 years ago. Structured environments with support have been effective for her.",
    whatDidntHelp: "Attempting to stay sober at home without structure or support has been unsuccessful.",
    dimension5Severity: 3, // High
    dimension5Comments: `Ms. Maria has a significant history of relapse with multiple failed attempts at staying sober. Her limited coping strategies make it difficult for her to manage triggers like emotional distress and being around substances. When she has had structure and support (pregnancy, residential treatment), she has been able to achieve and maintain sobriety. Without structured treatment, she remains at high risk for continued substance use. She needs intensive relapse prevention therapy and help developing healthy coping skills.`,

    // Dimension 6: Recovery / Living Environment
    supportiveRelationships: "Limited. Ms. Maria has six children and eight siblings, but she currently lacks strong supportive relationships to help with her recovery. She has never been married.",
    currentLivingSituation: "Homeless. Ms. Maria has been homeless for approximately one month. Before becoming homeless, she was temporarily staying with a friend but was recently asked to leave. She has no source of finances.",
    othersUsingDrugsInEnvironment: true,
    othersUsingDetails: "Ms. Maria reports that her entire family uses drugs and alcohol. Her previous living environment with a friend was not supportive enough and she was asked to leave.",
    safetyThreats: true,
    safetyThreatsDetails: "Ms. Maria reports feeling increasingly fearful for her personal safety due to the instability associated with her substance use and homelessness. This fear prompted her to seek treatment.",
    negativeImpactRelationships: true,
    negativeImpactDetails: "Her substance use has negatively affected her relationships with family, friends, and others.",
    currentlyEmployedOrSchool: false,
    employmentSchoolDetails: "Ms. Maria last worked about a year ago (Circle K, Care Taker). She completed school through the 9th grade. She has no military history. Employment barriers include addiction, skills gap, and homelessness.",
    socialServicesInvolved: true,
    socialServicesDetails: "Ms. Maria is seeking case management services for housing assistance.",
    dimension6Severity: 3, // High
    dimension6Comments: `Ms. Maria currently lacks a stable or supportive recovery environment. She is homeless and has no safe place to live. Her entire family uses drugs and alcohol, so returning to family is not a safe option for her recovery. Her housing instability significantly increases her likelihood of relapse and limits her ability to engage in outpatient treatment. She needs residential placement to provide a safe, structured environment for recovery. Case management for housing assistance will be essential for her long-term recovery planning.`,

    // Summary Rationale
    summaryRationale: {
      dimension1: "Moderate - Recent substance use (2 days prior) with chronic, daily use patterns. While she denies current withdrawal symptoms or history of severe complications, her long history of use requires monitoring in a structured setting.",
      dimension2: "Low - No acute medical conditions. Standard residential treatment is appropriate for her biomedical needs.",
      dimension3: "Moderate to High - Significant mental health symptoms including moderately severe depression (PHQ-9: 15), anxiety, PTSD, and substance-induced hallucinations. Needs mental health stabilization within a structured residential setting.",
      dimension4: "Low - Strong motivation for recovery is a strength. She is highly motivated, cooperative, and willing to engage in treatment.",
      dimension5: "High - Chronic relapse history and limited coping skills. Unable to maintain sobriety without structure and support.",
      dimension6: "High - Homeless with no stable living environment. Family uses substances. Without residential placement, she has nowhere safe to go."
    },

    // DSM-5 Diagnoses
    dsm5Criteria: [
      {
        substance: "Alcohol",
        criteriaCount: 6,
        severity: "Severe"
      },
      {
        substance: "Methamphetamine",
        criteriaCount: 6,
        severity: "Severe"
      }
    ],
    dsm5Diagnoses: `F10.20 - Alcohol Use Disorder, Severe
F15.20 - Stimulant (Methamphetamine) Use Disorder, Severe
F33.1 - Major Depressive Disorder, Recurrent, Moderate
F41.9 - Anxiety Disorder, Unspecified

Additional Clinical Observations:
- Substance-induced auditory and visual hallucinations
- PTSD symptoms (exposure to trauma, flashbacks, nightmares, hyperarousal)
- Borderline personality features (impulsive and risky behaviors)`,

    // Level of Care Determination
    levelOfCareDetermination: {
      withdrawalManagement: "Low - No immediate medical detox needed",
      dimension1Level: "3.1",
      dimension2Level: "3.1",
      dimension3Level: "3.1",
      dimension4Level: "3.1",
      dimension5Level: "3.1",
      dimension6Level: "3.1",
      overallLevel: "3.1"
    },
    matInterested: false,
    matDetails: "Medications were recommended (Vistaril 25mg for anxiety, Naltrexone 50mg for craving, Zoloft 25mg for mood) but Ms. Maria refused at the time of evaluation. MAT should be discussed again during treatment.",
    recommendedLevelOfCare: "ASAM Level 3.1 - Behavioral Health Residential Facility (BHRF)",
    levelOfCareProvided: "BHRF Treatment",
    discrepancyReason: "Not Applicable",
    designatedTreatmentLocation: "Behavioral Health Residential Facility - Lucid Behavioral Health, 7515 W Odeum Ln, Phoenix AZ 85042",
    designatedProviderName: "Adebukola Aladesanmi, DNP, PMHNP-BC",

    // Signatures
    counselorName: "Richard Mugabe, BHT",
    counselorSignatureDate: new Date("2026-03-10"),
    bhpLphaName: "Chris Azode DNP, PMHNP-BC, MBA",
    bhpLphaSignatureDate: new Date("2026-03-10"),
  };

  try {
    const updated = await prisma.aSAMAssessment.update({
      where: { id: asamId },
      data: updateData,
    });

    console.log("✅ Successfully updated Maria Hernandez's ASAM Assessment from summary");
    console.log("Updated fields:", Object.keys(updateData).length);
    console.log("ASAM ID:", updated.id);
    console.log("Patient Name:", updated.patientName);
    console.log("Recommended Level of Care:", updated.recommendedLevelOfCare);
  } catch (error) {
    console.error("❌ Error updating ASAM assessment:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMariaASAMFromSummary();
