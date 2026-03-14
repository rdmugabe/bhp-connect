import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const asamId = "cmmjxhhny000eovdednrpbpvl";

  const asam = await prisma.aSAMAssessment.findUnique({
    where: { id: asamId },
    include: { intake: { select: { residentName: true } } },
  });

  if (!asam) {
    console.log("No ASAM found with ID:", asamId);
    return;
  }

  console.log("Found ASAM for:", asam.intake?.residentName, "Status:", asam.status);

  // Update ASAM with data from psychiatric evaluation documents
  const updated = await prisma.aSAMAssessment.update({
    where: { id: asamId },
    data: {
      // Step 1: Demographics
      patientName: "Juliane Lebron",
      assessmentDate: new Date("2026-03-09"),
      admissionDate: new Date("2026-03-09"),
      phoneNumber: "N/A",
      okayToLeaveVoicemail: false,
      patientAddress: "Homeless - Currently placed at BHRF",
      dateOfBirth: new Date("1972-04-03"),
      age: 53,
      gender: "Female",
      raceEthnicity: "Pima Native American",
      preferredLanguage: "English",
      ahcccsId: "A00157209",
      insuranceType: "AHCCCS",
      insurancePlan: "AHCCCS",
      livingArrangement: "Homeless/BHRF",
      referredBy: "Psychiatric Evaluation - Certification of Need",
      reasonForTreatment: "Fentanyl and methamphetamine addiction. Patient requests assistance in addressing long-standing substance use disorder and stabilizing mental health. Desires structured and supportive treatment environment to achieve sustained sobriety, improve emotional regulation, and restore stability.",
      currentSymptoms: "Anxiety symptoms (10/10 at worst): fearfulness, worry, muscle tension, fatigue, restlessness, irritability, sleep disturbances. Depression symptoms (5/10 at worst): guilt, difficulty concentrating, lack of motivation, hopelessness, worthlessness. Insomnia. Reports feeling emotionally overwhelmed and frustrated with addiction.",

      // Step 2: Dimension 1 - Substance Use / Withdrawal
      substanceUseHistory: [
        {
          substance: "Fentanyl",
          ageFirstUse: 26,
          lastUse: "Night prior to evaluation (03/08/2026)",
          routeOfAdmin: "Smoking",
          frequencyPattern: "Daily",
          amountTypical: "20 grams/day ($400/day)",
          yearsOfUse: 27,
        },
        {
          substance: "Methamphetamine",
          ageFirstUse: 26,
          lastUse: "Night prior to evaluation (03/08/2026)",
          routeOfAdmin: "Smoking",
          frequencyPattern: "Daily",
          amountTypical: "$20 worth/day",
          yearsOfUse: 27,
        },
      ],
      usingMoreThanIntended: true,
      usingMoreDetails: "16-year history of polysubstance use. Daily methamphetamine and fentanyl use with escalation over time. Spending approximately $420/day on substances.",
      physicallyIllWhenStopping: false,
      physicallyIllDetails: "Denies history of withdrawal seizures or other severe withdrawal-related medical complications.",
      currentWithdrawalSymptoms: false,
      withdrawalSymptomsDetails: "Currently denies experiencing active withdrawal symptoms.",
      historyOfSeriousWithdrawal: false,
      seriousWithdrawalDetails: "No history of severe withdrawal complications reported.",
      toleranceIncreased: true,
      toleranceDetails: "16-year history with escalation to 20 grams/day of fentanyl indicates significant tolerance development.",
      recentUseChanges: true,
      recentUseChangesDetails: "Last use of both fentanyl and methamphetamine the night prior to evaluation. Seeking treatment at BHRF.",
      familySubstanceHistory: "Unknown - family psychiatric history unknown per patient report.",
      dimension1Severity: 3, // Severe - 16-year polysubstance history with daily heavy use
      dimension1Comments: "16-year history of severe polysubstance use disorder starting at age 26 with methamphetamine and fentanyl. Daily use with significant financial impact ($420/day). Multiple treatment attempts including 2 IOP programs and 3 rehab stays, all unsuccessful due to relapse. Currently seeking structured treatment.",

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
        asthma: true,
        constipation: true,
        insomnia: true,
      },
      conditionsInterfere: false,
      conditionsInterfereDetails: "Medical history significant for asthma, constipation, and insomnia. Conditions require monitoring but not acute hospitalization.",
      priorHospitalizations: "Surgeries: Gallbladder removal, appendectomy, C-section x3. Denies psychiatric hospitalizations or detox.",
      lifeThreatening: false,
      medicalMedications: [
        { name: "Suboxone", dosage: "4mg SL BID", prescriber: "Adebukola Aladesanmi" },
        { name: "Wellbutrin SR", dosage: "200mg PO daily", prescriber: "Adebukola Aladesanmi" },
        { name: "Zoloft (Sertraline)", dosage: "25mg PO daily", prescriber: "Adebukola Aladesanmi" },
        { name: "Vistaril (Hydroxyzine)", dosage: "50mg PO Q6hrs PRN", prescriber: "Adebukola Aladesanmi" },
        { name: "Trazodone", dosage: "50mg PO QHS", prescriber: "Adebukola Aladesanmi" },
      ],
      dimension2Severity: 1, // Mild - asthma and insomnia require monitoring but no acute issues
      dimension2Comments: "Mild biomedical concerns including asthma, constipation, and insomnia. Prior surgeries (gallbladder, appendix, 3 C-sections). No acute medical conditions requiring hospitalization. Stable for BHRF level of care with routine monitoring. Food allergy: Onions.",

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
      },
      anxietySymptoms: {
        excessiveWorry: true,
        restlessness: true,
        muscularTension: true,
        sleepDifficulty: true,
        irritability: true,
        fearfulness: true,
      },
      psychosisSymptoms: {
        auditoryHallucinations: false,
        visualHallucinations: false,
        paranoia: false,
        delusions: false,
      },
      otherSymptoms: {
        emotionalDysregulation: true,
        impulsivity: true,
        limitedCopingSkills: true,
      },
      suicidalThoughts: false,
      suicidalThoughtsDetails: "Patient denies any current suicidal ideation. No history of suicide attempts. Low suicide risk. Has contracted for safety during evaluation.",
      thoughtsOfHarmingOthers: false,
      harmingOthersDetails: "Denies any current homicidal ideation or thoughts of harming others.",
      abuseHistory: "Denies history of physical or sexual abuse.",
      traumaticEvents: "Denies symptoms related to exposure to traumatic events. Loss of custody of 2 children through DCS involvement noted as significant stressor.",
      mentalIllnessDiagnosed: true,
      mentalIllnessDetails: "F33.1 Major Depressive Disorder, Recurrent, Moderate; F41.1 Generalized Anxiety Disorder; F51.01 Insomnia Disorder",
      previousPsychTreatment: true,
      psychTreatmentDetails: "2 Intensive Outpatient Program (IOP) enrollments - unable to complete either program due to relapse and safety concerns. Rehab x3 in Phoenix.",
      hallucinationsPresent: false,
      hallucinationsDetails: "Denies auditory and visual hallucinations.",
      furtherMHAssessmentNeeded: false,
      psychiatricMedications: [
        { name: "Wellbutrin SR", dosage: "200mg daily", indication: "Depression/Mood" },
        { name: "Zoloft", dosage: "25mg daily", indication: "Depression/Mood" },
        { name: "Vistaril", dosage: "50mg Q6hrs PRN", indication: "Anxiety" },
        { name: "Trazodone", dosage: "50mg QHS", indication: "Insomnia" },
      ],
      mentalHealthProviders: [
        { name: "Adebukola Aladesanmi, DNP, PMHNP-BC", type: "Psychiatric NP" },
      ],
      dimension3Severity: 2, // Moderate - co-occurring MDD, GAD, insomnia with impaired coping
      dimension3Comments: "Moderate psychiatric co-morbidity including Major Depressive Disorder (5/10 severity), Generalized Anxiety Disorder (10/10 severity), and Insomnia. No psychotic symptoms. No suicidal or homicidal ideation. Fair insight into impact of substance use. Judgment impaired during active use but improving. Limited impulse control, particularly during periods of relapse. Emotional dysregulation contributing to relapse patterns.",

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
        sexualActivity: true,
      },
      continueUseDespitefects: true,
      continueUseDetails: "Continued use despite homelessness for 3 months, loss of custody of 2 children through DCS, unemployment for 2 years, multiple incarcerations, and severe psychiatric symptoms.",
      previousTreatmentHelp: false,
      treatmentProviders: [
        { name: "IOP Program #1", type: "Intensive Outpatient", outcome: "Did not complete - relapsed" },
        { name: "IOP Program #2", type: "Intensive Outpatient", outcome: "Did not complete - relapsed" },
        { name: "Rehab #1", type: "Residential", outcome: "Phoenix area" },
        { name: "Rehab #2", type: "Residential", outcome: "Phoenix area" },
        { name: "Rehab #3", type: "Residential", outcome: "Phoenix area" },
      ],
      recoverySupport: "Mother identified as primary source of emotional support. Limited other support systems.",
      recoveryBarriers: "Homelessness, limited coping skills, emotional dysregulation, impulsivity, history of multiple treatment failures, limited support system beyond mother.",
      treatmentImportanceAlcohol: "N/A",
      treatmentImportanceDrugs: "High",
      treatmentImportanceDetails: "Patient expresses strong motivation for recovery. Clearly states goal of achieving long-term sobriety and rebuilding stability in life. Open to medication-assisted treatment and behavioral health services. Cooperative and appropriately engaged throughout evaluation.",
      dimension4Severity: 1, // Mild - high motivation despite treatment failures
      dimension4Comments: "Patient demonstrates strong motivation for treatment despite multiple prior treatment failures. Goal is to achieve sustained sobriety, improve emotional regulation, and restore stability. Willing to participate in structured programming and MAT. Main barriers are external (homelessness, limited support) and skill-based (coping, emotional regulation) rather than motivational resistance.",

      // Step 6: Dimension 5 - Relapse Potential
      cravingsFrequencyAlcohol: "N/A",
      cravingsFrequencyDrugs: "Daily",
      cravingsDetails: "16-year history with daily use indicates persistent cravings. Long pattern of relapse often triggered by impulsivity, emotional dysregulation, and limited coping skills.",
      timeSearchingForSubstances: true,
      timeSearchingDetails: "Spending approximately $420/day on substances suggests significant time obtaining and using.",
      relapseWithoutTreatment: true,
      relapseDetails: "High relapse risk without structured treatment given 16-year substance use history, multiple treatment failures, limited coping mechanisms, and emotional dysregulation.",
      awareOfTriggers: true,
      triggersList: {
        impulsivity: true,
        emotionalDysregulation: true,
        limitedCopingSkills: true,
        depression: true,
        environmentalTriggers: true,
      },
      copingWithTriggers: "Limited coping skills currently. Previously used substances to cope with emotional distress.",
      attemptsToControl: "Multiple treatment attempts: 2 IOP programs (unable to complete due to relapse), 3 rehab programs, multiple attempts at sobriety at home.",
      longestSobriety: "12 months - during period when she experienced loss of custody of children through DCS",
      whatHelped: "Structured environment during longest sobriety period. Currently prescribed Suboxone for opioid cravings.",
      whatDidntHelp: "Outpatient level of care insufficient - relapsed during IOP programs. Attempts at home sobriety unsuccessful.",
      dimension5Severity: 4, // Very Severe - 16-year history, multiple treatment failures, high relapse risk
      dimension5Comments: "Very severe relapse potential due to 16-year history of daily polysubstance use with multiple treatment failures. Limited coping skills with history of using substances to manage emotional distress. Long pattern of relapse triggered by impulsivity and emotional dysregulation. Previous IOP and rehab attempts unsuccessful. Requires structured residential environment to maintain sobriety.",

      // Step 7: Dimension 6 - Recovery Environment
      supportiveRelationships: "Mother identified as primary source of emotional support. Limited other support systems. Never married. 11 children, lost custody of 2 through DCS involvement.",
      currentLivingSituation: "Homeless for approximately 3 months prior to current placement. Currently at BHRF.",
      othersUsingDrugsInEnvironment: true,
      othersUsingDetails: "Homelessness likely involved exposure to substance use in environment.",
      safetyThreats: true,
      safetyThreatsDetails: "Homelessness created unsafe living conditions. Safety concerns contributed to inability to complete prior IOP programs.",
      negativeImpactRelationships: true,
      negativeImpactDetails: "Lost custody of 2 children through DCS involvement. Family disruption due to substance use.",
      currentlyEmployedOrSchool: false,
      employmentSchoolDetails: "Unemployed for approximately 2 years. Highest education: 10th grade.",
      socialServicesInvolved: true,
      socialServicesDetails: "DCS involvement regarding custody of 2 children. Case management needs identified: Housing.",
      probationParoleOfficer: "",
      probationParoleContact: "",
      dimension6Severity: 4, // Very Severe - homeless, limited support, unemployed, DCS involvement
      dimension6Comments: "Very severe recovery environment concerns. Homeless for 3 months with unstable living conditions. Limited support system - only mother identified as support. 11 children with loss of custody of 2 through DCS. Unemployed for 2 years with limited education (10th grade). History of 5 incarcerations for shoplifting. Requires extensive support for housing, employment, and psychosocial stabilization.",

      // Step 8: Summary
      summaryRationale: {
        dimension1Rationale: "Severe - 16-year history of severe opioid and stimulant use disorders with daily fentanyl and methamphetamine use",
        dimension2Rationale: "Mild - Asthma and insomnia require monitoring but no acute medical concerns",
        dimension3Rationale: "Moderate - Co-occurring MDD, GAD, and insomnia with impaired coping and emotional dysregulation",
        dimension4Rationale: "Mild - Strong motivation for treatment despite multiple prior treatment failures",
        dimension5Rationale: "Very Severe - High relapse risk due to 16-year history, multiple treatment failures, limited coping skills",
        dimension6Rationale: "Very Severe - Homeless 3 months, limited support system, unemployed 2 years, DCS involvement",
      },
      dsm5Criteria: [
        {
          substanceName: "Opioids (Fentanyl)",
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
      ],
      dsm5Diagnoses: "F11.20 – Opioid Use Disorder, Severe (Fentanyl); F15.20 – Stimulant Use Disorder, Severe (Methamphetamine); F33.1 – Major Depressive Disorder, Recurrent, Moderate; F41.1 – Generalized Anxiety Disorder; F51.01 – Insomnia Disorder",
      levelOfCareDetermination: {
        withdrawalManagement: "None currently required - no acute withdrawal symptoms at admission",
        treatmentServices: "3.1 - Clinically Managed Low-Intensity Residential Services (BHRF)",
        otp: true,
      },
      matInterested: true,
      matDetails: "Patient is open to medication-assisted treatment. Currently prescribed Suboxone 4mg SL BID for opioid use disorder. Should continue MAT as part of treatment plan.",
      recommendedLevelOfCare: "3.1",
      levelOfCareProvided: "3.1",
      discrepancyReason: "Not Applicable",
      discrepancyExplanation: "",
      designatedTreatmentLocation: "Lucid Behavioral Health - Adult Behavioral Health Residential Facility",
      designatedProviderName: "Lucid Behavioral Health",
      counselorName: "Adebukola Aladesanmi",
      counselorSignatureDate: new Date("2026-03-09"),
      bhpLphaName: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      bhpLphaSignatureDate: new Date("2026-03-09"),
    },
  });

  console.log("ASAM updated successfully:", updated.id);
  console.log("\nJuliane Lebron ASAM assessment update complete!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
