import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const asamId = "cmmipnxag001payunfo8je4dz";

  const asam = await prisma.aSAMAssessment.findUnique({
    where: { id: asamId },
    include: { intake: { select: { residentName: true } } },
  });

  if (!asam) {
    console.log("No ASAM found with ID:", asamId);
    return;
  }

  console.log("Found ASAM for:", asam.intake?.residentName, "Status:", asam.status);

  // Update ASAM with data from evaluation documents
  const updated = await prisma.aSAMAssessment.update({
    where: { id: asamId },
    data: {
      // Step 1: Demographics
      patientName: "Genevieve Begay",
      assessmentDate: new Date("2026-03-06"),
      admissionDate: new Date("2026-03-06"),
      phoneNumber: "602-831-2698",
      okayToLeaveVoicemail: true,
      patientAddress: "Homeless - Currently placed at BHRF",
      dateOfBirth: new Date("1981-04-21"),
      age: 44,
      gender: "Female",
      raceEthnicity: "Native American - Navajo",
      preferredLanguage: "English",
      ahcccsId: "A00213797",
      insuranceType: "AHCCCS",
      insurancePlan: "AHCCCS",
      livingArrangement: "Homeless/BHRF",
      referredBy: "Psychiatric Evaluation - Certification of Need",
      reasonForTreatment: "Persistent depressed and anxious moods, polysubstance abuse (alcohol, methamphetamine, fentanyl), hallucinations, history of trauma with abuse, domestic violence, and the death of her eldest child in 2011.",
      currentSymptoms: "Depressed mood, anxiety, auditory hallucinations (hears voices, sometimes a man's voice, sometimes her child's voice calling for her), anhedonia, decreased motivation, trouble sleeping, frequent crying, suicidal ideation with past attempt (2014), homicidal ideation toward person who killed her child.",

      // Step 2: Dimension 1 - Substance Use / Withdrawal
      substanceUseHistory: [
        {
          substance: "Alcohol",
          ageFirstUse: "12",
          lastUse: "2 days prior to evaluation",
          route: "Oral",
          frequency: "Regular/Heavy",
          amount: "Not specified",
        },
        {
          substance: "Methamphetamine",
          ageFirstUse: "25",
          lastUse: "Unknown",
          route: "Smoking/IV",
          frequency: "Regular",
          amount: "Not specified",
        },
        {
          substance: "Fentanyl",
          ageFirstUse: "25",
          lastUse: "Unknown",
          route: "Smoking/IV",
          frequency: "Regular",
          amount: "Not specified",
        },
      ],
      usingMoreThanIntended: true,
      usingMoreDetails: "32-year history of polysubstance use. Reports polysubstance dependence with alcohol, methamphetamine, and fentanyl.",
      physicallyIllWhenStopping: true,
      physicallyIllDetails: "History of withdrawal symptoms when stopping substance use.",
      currentWithdrawalSymptoms: false,
      withdrawalSymptomsDetails: "No acute withdrawal symptoms at time of evaluation.",
      historyOfSeriousWithdrawal: true,
      seriousWithdrawalDetails: "History of hepatitis C treatment at age 25 with successful completion. Recent hospitalization for severe anemia (low iron and low red blood cells).",
      toleranceIncreased: true,
      toleranceDetails: "32-year history suggests significant tolerance development to alcohol and other substances.",
      recentUseChanges: true,
      recentUseChangesDetails: "Last use of alcohol 2 days prior to evaluation. Seeking treatment at BHRF.",
      familySubstanceHistory: "Mother had history of alcohol abuse and used tobacco. Parents introduced her to alcohol at age 12.",
      dimension1Severity: 3, // Severe - 32-year polysubstance history
      dimension1Comments: "32-year history of polysubstance use disorder starting at age 12 with alcohol, progressing to methamphetamine and fentanyl at age 25. Severe impact on all life domains. Currently on Suboxone for opioid use disorder treatment.",

      // Step 3: Dimension 2 - Biomedical Conditions
      medicalProviders: [
        {
          name: "Adebukola Aladesanmi, DNP, PMHNP-BC",
          specialty: "Psychiatric Nurse Practitioner",
          contact: "Lucid Behavioral Health",
        },
      ],
      medicalConditions: {
        hepatitisC: true,
        anemia: true,
        visualImpairment: true,
      },
      conditionsInterfere: true,
      conditionsInterfereDetails: "Recent hospitalization for severe anemia (low iron and low red blood cells). History of Hepatitis C treatment at 25 years old with successful completion. Visual impairment noted.",
      priorHospitalizations: "Recently hospitalized for low iron and low red blood cells count (Severe anemia). No known psychiatric hospitalizations.",
      lifeThreatening: false,
      medicalMedications: [
        { medication: "Vistaril (Hydroxyzine)", dose: "PRN", reason: "Anxiety", effectiveness: "Effective" },
        { medication: "Vitamin C", dose: "Daily", reason: "Anemia/Nutrition", effectiveness: "Effective" },
        { medication: "Suboxone", dose: "Daily", reason: "Opioid Use Disorder/MAT", effectiveness: "Effective" },
        { medication: "Zoloft (Sertraline)", dose: "Daily", reason: "Depression/Anxiety", effectiveness: "Effective" },
        { medication: "Trazodone", dose: "Daily at bedtime", reason: "Insomnia", effectiveness: "Effective" },
      ],
      dimension2Severity: 2, // Moderate - recent anemia hospitalization, history of Hep C, visual impairment
      dimension2Comments: "Moderate biomedical concerns including recent hospitalization for severe anemia, history of Hepatitis C (successfully treated), and visual impairment. Currently stable on medication regimen. No acute life-threatening conditions.",

      // Step 4: Dimension 3 - Emotional/Behavioral/Cognitive
      moodSymptoms: {
        depressedMood: true,
        hopelessness: true,
        worthlessness: true,
        guiltFeelings: true,
        anhedonia: true,
        fatigue: true,
        sleepDisturbance: true,
        appetiteChanges: true,
        concentrationDifficulty: true,
        suicidalIdeation: true,
      },
      anxietySymptoms: {
        excessiveWorry: true,
        restlessness: true,
        muscularTension: true,
        sleepDifficulty: true,
        irritability: true,
      },
      psychosisSymptoms: {
        auditoryHallucinations: true,
        visualHallucinations: true,
        paranoia: false,
        delusions: false,
      },
      otherSymptoms: {
        trauma: true,
        grief: true,
        anger: true,
      },
      suicidalThoughts: true,
      suicidalThoughtsDetails: "Patient reports current suicidal ideation - wants to die and end the pain. Reports hearing voices telling her to kill herself. Has plan (overdose) but denies current intent. Prior suicide attempt in 2014 via overdose.",
      thoughtsOfHarmingOthers: true,
      harmingOthersDetails: "Homicidal ideation - wants to hurt the person who killed her child. Targeted toward specific individual. Reports no current plan or intent to act on these thoughts. History of domestic violence with ex-boyfriend.",
      abuseHistory: "History of physical abuse by father during childhood. Domestic violence with ex-boyfriend as an adult. Eldest child killed in 2011 (traumatic loss).",
      traumaticEvents: "Physical abuse from father in childhood, domestic violence with ex-boyfriend, death of eldest child in 2011, loss of custody of children to foster care.",
      mentalIllnessDiagnosed: true,
      mentalIllnessDetails: "F33.1 Major Depressive Disorder, Recurrent, Moderate; F41.1 Generalized Anxiety Disorder; F43.10 Post-Traumatic Stress Disorder; F51.01 Primary Insomnia",
      previousPsychTreatment: true,
      psychTreatmentDetails: "No known previous psychiatric hospitalizations. Currently receiving psychiatric services.",
      hallucinationsPresent: true,
      hallucinationsDetails: "Auditory hallucinations - hears voices, sometimes a man's voice, sometimes her child's voice calling for her. Reports some visual hallucinations as well.",
      furtherMHAssessmentNeeded: false,
      psychiatricMedications: [
        { medication: "Zoloft (Sertraline)", dose: "Daily", reason: "Depression/Anxiety", effectiveness: "Effective" },
        { medication: "Vistaril", dose: "PRN", reason: "Anxiety", effectiveness: "Effective" },
        { medication: "Trazodone", dose: "At bedtime", reason: "Insomnia", effectiveness: "Effective" },
      ],
      mentalHealthProviders: [
        { name: "Adebukola Aladesanmi, DNP, PMHNP-BC", specialty: "Psychiatric NP", contact: "Lucid Behavioral Health" },
        { name: "Chris Azode DNP, PMHNP-BC, MBA", specialty: "BHP Reviewer", contact: "BHRF" },
      ],
      dimension3Severity: 3, // Severe - co-occurring MDD, GAD, PTSD, psychotic symptoms, SI/HI
      dimension3Comments: "Severe psychiatric co-morbidity including Major Depressive Disorder, Generalized Anxiety Disorder, PTSD, and Primary Insomnia. Presents with auditory and visual hallucinations. Current suicidal ideation with past attempt (2014). Homicidal ideation toward specific target. Significant trauma history including childhood abuse, domestic violence, and loss of child.",

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
      },
      continueUseDespitefects: true,
      continueUseDetails: "Continued use despite homelessness for 5 years, loss of custody of children, unemployment, legal involvement, and severe psychiatric symptoms.",
      previousTreatmentHelp: false,
      treatmentProviders: [],
      recoverySupport: "Limited support system. Both parents deceased. Children in foster care. No reported close friends or family members providing support.",
      recoveryBarriers: "Homelessness, lack of social support, trauma history, co-occurring psychiatric disorders, loss of custody of children.",
      treatmentImportanceAlcohol: "High",
      treatmentImportanceDrugs: "High",
      treatmentImportanceDetails: "Patient is motivated for treatment, has children as reason to stay sober, cooperative during assessment. Seeking help to stabilize and eventually reunite with children.",
      dimension4Severity: 1, // Mild - high motivation and willingness to engage
      dimension4Comments: "Patient demonstrates high motivation for treatment. Children serve as significant motivating factor for recovery. Cooperative and engaged during assessment. Minimal resistance to treatment. Main barriers are external (lack of support system, homelessness) rather than internal motivation.",

      // Step 6: Dimension 5 - Relapse Potential
      cravingsFrequencyAlcohol: "Daily",
      cravingsFrequencyDrugs: "Daily",
      cravingsDetails: "32-year history with brief periods of abstinence suggests persistent cravings and high relapse risk.",
      timeSearchingForSubstances: true,
      timeSearchingDetails: "Significant time spent obtaining and using substances prior to admission.",
      relapseWithoutTreatment: true,
      relapseDetails: "High relapse risk without structured treatment given 32-year substance use history and limited coping skills.",
      awareOfTriggers: true,
      triggersList: {
        strongCravings: true,
        mentalHealth: true,
        relationshipProblems: true,
        difficultyDealingWithFeelings: true,
        financialStressors: true,
        physicalHealth: true,
        environment: true,
        unemployment: true,
        chronicPain: false,
        peerPressure: false,
        other: "Trauma memories, grief over loss of child, hearing voices",
      },
      copingWithTriggers: "Limited coping skills currently. Previously used substances to cope with trauma and emotional distress.",
      attemptsToControl: "Unknown - reports continuous use with brief periods of abstinence",
      longestSobriety: "Unknown - reports continuous use with brief periods of abstinence",
      whatHelped: "Currently on Suboxone for opioid use disorder which may be helping with opioid cravings.",
      whatDidntHelp: "Prior attempts without structured support and treatment were unsuccessful.",
      dimension5Severity: 4, // Very Severe - 32-year history, limited coping, high relapse risk
      dimension5Comments: "Very severe relapse potential due to 32-year history of polysubstance use with minimal periods of sustained sobriety. Limited coping skills with history of using substances to manage trauma and emotional distress. Multiple triggers present including emotional distress, trauma memories, social isolation, and co-occurring psychiatric symptoms.",

      // Step 7: Dimension 6 - Recovery Environment
      supportiveRelationships: "Limited - both parents deceased (mother 2021, father 2012). 5 children (4 living, 1 deceased 2011) in foster care. No close friendships reported.",
      currentLivingSituation: "Homeless for 5 years prior to current placement. Currently at BHRF.",
      othersUsingDrugsInEnvironment: true,
      othersUsingDetails: "Prior living environment likely included exposure to substance use given homelessness.",
      safetyThreats: true,
      safetyThreatsDetails: "History of domestic violence with ex-boyfriend. Homelessness created unsafe living conditions.",
      negativeImpactRelationships: true,
      negativeImpactDetails: "Lost custody of children due to domestic violence incident. Relationship ended with ex-boyfriend due to violence.",
      currentlyEmployedOrSchool: false,
      employmentSchoolDetails: "Unemployed since April 2025. Unknown work history prior.",
      socialServicesInvolved: true,
      socialServicesDetails: "CPS involvement regarding custody of children. Children in foster care. Mercy Care RBHA for psychiatric services.",
      probationParoleOfficer: "",
      probationParoleContact: "",
      dimension6Severity: 4, // Very Severe - homeless, no support system, unemployed, children in foster care
      dimension6Comments: "Very severe recovery environment concerns. Homeless for 5 years with no stable housing. No support system - both parents deceased, children in foster care, no close friendships. Unemployed since April 2025. History of domestic violence and unsafe living conditions. Will require extensive support for housing, employment, and social connection building.",

      // Step 8: Summary
      summaryRationale: {
        dimension1Rationale: "Severe - 32-year history of polysubstance use disorder (alcohol, methamphetamine, fentanyl) starting at age 12",
        dimension2Rationale: "Moderate - Recent anemia hospitalization, Hep C history (treated), visual impairment, stable on medications",
        dimension3Rationale: "Severe - Co-occurring MDD, GAD, PTSD, insomnia, psychotic symptoms (AH/VH), current SI/HI",
        dimension4Rationale: "Mild - High motivation, children as reason for recovery, cooperative and engaged",
        dimension5Rationale: "Very Severe - 32-year history, limited coping skills, high relapse risk without treatment",
        dimension6Rationale: "Very Severe - Homeless 5 years, no support system, unemployed, children in foster care",
      },
      dsm5Criteria: [
        {
          substanceName: "Opioids (Fentanyl)",
          criteria: [
            "Hazardous use",
            "Social/interpersonal problems related to use",
            "Neglected major roles",
            "Withdrawal symptoms",
            "Tolerance",
            "Used larger amounts/longer",
            "Repeated attempts to quit/control",
            "Much time spent using",
            "Physical/psychological problems related to use",
            "Activities given up to use",
            "Craving",
          ],
          totalCriteria: 11,
        },
        {
          substanceName: "Stimulants (Methamphetamine)",
          criteria: [
            "Hazardous use",
            "Social/interpersonal problems related to use",
            "Neglected major roles",
            "Tolerance",
            "Used larger amounts/longer",
            "Repeated attempts to quit/control",
            "Much time spent using",
            "Physical/psychological problems related to use",
            "Activities given up to use",
            "Craving",
          ],
          totalCriteria: 10,
        },
        {
          substanceName: "Alcohol",
          criteria: [
            "Hazardous use",
            "Social/interpersonal problems related to use",
            "Neglected major roles",
            "Withdrawal symptoms",
            "Tolerance",
            "Used larger amounts/longer",
            "Repeated attempts to quit/control",
            "Much time spent using",
            "Physical/psychological problems related to use",
            "Activities given up to use",
            "Craving",
          ],
          totalCriteria: 11,
        },
      ],
      dsm5Diagnoses: "F11.20 Opioid Use Disorder, Severe (11 criteria met); F15.20 Stimulant Use Disorder, Severe; F10.20 Alcohol Use Disorder, Severe; F33.1 Major Depressive Disorder, Recurrent, Moderate; F41.1 Generalized Anxiety Disorder; F43.10 Post-Traumatic Stress Disorder; F51.01 Primary Insomnia",
      levelOfCareDetermination: {
        withdrawalManagement: "None currently required - no acute withdrawal symptoms at admission",
        treatmentServices: "3.1 - Clinically Managed Low-Intensity Residential Services (BHRF)",
        otp: true,
      },
      matInterested: true,
      matDetails: "Currently on Suboxone for opioid use disorder. Patient is engaged with MAT and should continue medication-assisted treatment.",
      recommendedLevelOfCare: "3.1",
      levelOfCareProvided: "3.1",
      discrepancyReason: "Not Applicable",
      discrepancyExplanation: "",
      designatedTreatmentLocation: "Lucid Behavioral Health - Adult Behavioral Health Residential Facility",
      designatedProviderName: "Lucid Behavioral Health",
      counselorName: "Adebukola Aladesanmi",
      counselorSignatureDate: new Date("2026-03-06"),
      bhpLphaName: "Chris Azode DNP, PMHNP-BC, MBA",
      bhpLphaSignatureDate: new Date("2026-03-06"),
    },
  });

  console.log("ASAM updated successfully:", updated.id);
  console.log("\nGenevieve Begay ASAM assessment update complete!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
