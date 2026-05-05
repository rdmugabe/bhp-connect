/**
 * Populate Lilia Lemus' Intake and ASAM records from her psych eval
 * (Lilia Lemus PE.pdf, dated 04/21/2026).
 *
 * Run: npx tsx prisma/update-lilia.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INTAKE_ID = "cmocct9hi0002epgz7n2aybcd";
const ASAM_ID = "cmoccu7wq0001c5oo64jxeeu6";

async function main() {
  // ---------- INTAKE UPDATES ----------
  await prisma.intake.update({
    where: { id: INTAKE_ID },
    data: {
      // Correct DOB (PDF: 06/18/1982)
      dateOfBirth: new Date("1982-06-18T00:00:00.000Z"),

      // Reason for services / chief complaint
      reasonForServices:
        '"I need help with substance abuse." Client presents requesting treatment for methamphetamine use disorder with associated functional impairment.',
      reasonsForReferral:
        "Methamphetamine use disorder with significant psychosocial decline including homelessness, unemployment, and social isolation. Referred for BHRF placement (ASAM 3.1) due to ongoing use, high relapse risk, and unstable living environment.",

      // Current behavioral symptoms
      currentBehavioralSymptoms:
        "Ongoing methamphetamine use (weekly, smoking ~$20 worth/week), social isolation, decreased motivation, inability to maintain employment (unemployed since 2022), homelessness since March 2025, impaired judgment related to substance use. Denies acute psychiatric symptoms.",
      copingWithSymptoms:
        "Client identifies environmental exposure (peers using substances) as a primary trigger. Has previously completed structured programs but relapses in unstable environments. Lacks effective relapse prevention skills outside structured settings.",
      symptomsLimitations:
        "Substance use significantly limits ability to maintain employment, stable housing, and supportive relationships. Affects ADLs, finances, recreational activities, relationships, self-esteem, and work functioning.",
      immediateUrgentNeeds:
        "Structured residential treatment to provide a safe, supportive environment for stabilization and recovery. Stable housing post-discharge. Connection to ongoing case management and aftercare services.",

      // Family / personal history
      personalPsychHX:
        "Last detox/psychiatric hospitalization approximately one year ago at Sonoran Desert facility in Tucson (March 2025). No current psychiatric medications.",
      personalMedicalHX: "Right ankle surgery (date unspecified).",
      familyPsychHX: "Unknown.",
      familyMedicalHX: "Unknown.",
      psychMedicationEfficacy:
        "Wellbutrin XL 150mg PO daily was recommended at evaluation for cravings, but client refused. No prior psychiatric medication trials reported.",

      // Hospitalizations
      previousHospitalizations:
        "March 2025 detox/psychiatric admission at Sonoran Desert facility, Tucson, AZ. Right ankle surgery (date unspecified).",
      hospitalizationDetails:
        "March 2025 — detox/psychiatric admission at Sonoran Desert facility, Tucson, AZ. Right ankle surgery (date unspecified).",

      // Risk assessments — eval explicitly denies all
      suicideHistory: "Client denies suicidal ideation, current and historical. Denies any suicide attempts.",
      currentSuicideIdeation: false,
      historySelfHarm: false,
      historyHarmingOthers: false,
      homicidalIdeation: false,
      potentialViolence: false,
      medicalUrgency: "None",
      historyNonCompliance: false,

      // Developmental
      developmentalMilestones: "Met all developmental milestones.",

      // Employment
      currentlyEmployed: false,
      employmentDetails:
        "Unemployed since 2022. Last position was Medical Transport Driver. Driver's license currently suspended, presenting a barrier to returning to work.",

      // Substance use — replace with accurate PDF data
      substanceHistory:
        "Methamphetamine use since age 21 (~22 years), smoked, ~$20/week. Cannabis use since age 21, ~1 joint/day. Tobacco: ~3 cigarettes/day. Denies alcohol use. Last use of meth/cannabis approximately 2 weeks prior to evaluation.",
      substanceUseTable: [
        {
          substance: "Methamphetamine",
          route: "Smoke",
          ageFirstUse: 21,
          frequency: "Weekly",
          amount: "$20/week",
          lastUse: "~2 weeks before evaluation (early April 2026)",
          pattern: "Chronic, weekly",
        },
        {
          substance: "Cannabis",
          route: "Smoke",
          ageFirstUse: 21,
          frequency: "Daily",
          amount: "~1 joint/day",
          lastUse: "~2 weeks before evaluation (early April 2026)",
          pattern: "Daily",
        },
        {
          substance: "Tobacco",
          route: "Smoke",
          ageFirstUse: null,
          frequency: "Daily",
          amount: "3 cigarettes/day",
          lastUse: "Current",
          pattern: "Daily",
        },
        {
          substance: "Alcohol",
          route: null,
          ageFirstUse: null,
          frequency: "Denies",
          amount: "Denies",
          lastUse: "Denies",
          pattern: "Denies",
        },
      ],
      drugOfChoice: "Methamphetamine",
      nicotineUse: true,
      nicotineDetails: "3 cigarettes/day.",
      substanceTreatmentHistory:
        "Three prior rehab admissions in Phoenix, AZ. Successfully completed at least one year-long structured program. Prior BHRF placement was discontinued after client was assaulted by another resident, leading to feelings of unsafety. Sober living and halfway house placements completed. Pattern of relapse in unstructured environments.",
      substanceImpact:
        "Substance use has resulted in homelessness (since March 2025), unemployment (since 2022), divorce, suspended driver's license, social isolation, loss of friendships, and impaired psychosocial functioning. Three incarcerations (~2 months each) for driving on suspended license, related to lifestyle around substance use.",

      // Diagnosis & treatment plan
      diagnosis:
        "F15.20 – Stimulant Use Disorder (Methamphetamine), Severe; F12.10 – Cannabis Use Disorder, Mild.",
      treatmentRecommendation:
        "ASAM 3.1 – Clinically Managed Low-Intensity Residential Treatment (BHRF). Recommended placement in a structured residential setting to provide a safe, supportive environment for stabilization and recovery. Without structured residential treatment, client is unlikely to achieve or maintain sobriety due to unstable housing, environmental triggers, and lack of support.",

      treatmentObjectives:
        [
          "Problem 1 — Methamphetamine Use Disorder (Primary). Goal: Achieve and maintain sobriety from methamphetamine throughout treatment.",
          "  Objective 1: Demonstrate abstinence as evidenced by negative drug screens (random UDS 1–2x/week).",
          "  Objective 2: Identify at least 3 personal triggers and develop coping strategies via CBT.",
          "  Objective 3: Report decreased cravings (consider Bupropion / Naltrexone for craving reduction; client previously refused Wellbutrin XL).",
          "",
          "Problem 2 — Unstable Living Environment / Homelessness. Goal: Obtain and maintain stable, sober housing prior to discharge.",
          "  Objective 1: Secure appropriate housing placement before discharge — refer to case management, sober living, transitional housing, and tribal resources.",
          "  Objective 2: Demonstrate ability to live in a structured environment via adherence to BHRF schedule and house rules.",
          "",
          "Problem 3 — Psychosocial Instability (Unemployment, Isolation). Goal: Improve functional stability and social engagement.",
          "  Objective 1: Engage in at least 3 group sessions weekly (life skills, communication, emotional regulation, NA/AA).",
          "  Objective 2: Begin vocational planning — refer to vocational rehab, resume building, job readiness.",
          "",
          "Problem 4 — Relapse Risk / Poor Coping Skills. Goal: Demonstrate improved relapse prevention skills prior to discharge.",
          "  Objective 1: Develop a written relapse prevention plan identifying high-risk situations and emergency coping strategies.",
          "  Objective 2: Demonstrate use of coping strategies in real-time scenarios (role-play, distress tolerance, emotional regulation).",
        ].join("\n"),

      dischargePlanObjectives:
        [
          "Discharge Criteria: Demonstrates consistent sobriety; reduced cravings and improved coping skills; secured stable housing placement; consistently engaged in treatment and aftercare planning.",
          "",
          "Step-Down Level of Care: ASAM 2.1 Intensive Outpatient Program (IOP) with continued individual and group therapy.",
          "",
          "Aftercare: Referral to outpatient psychiatric provider for medication management; enrollment in NA/AA or equivalent peer support (minimum 3x/week); ongoing case management for housing and employment support.",
          "",
          "Relapse Prevention: Avoid high-risk environments; utilize identified coping skills (grounding, distraction, support contact); contact sponsor, therapist, or crisis line when experiencing cravings; maintain structured daily routine.",
          "",
          "Housing Plan: Transition to sober living or supportive housing upon discharge; continued monitoring of housing stability through case management.",
        ].join("\n"),

      crisisInterventionPlan:
        "Client denies SI/HI at admission and discharge. If safety concerns arise, instructed to call 911 or crisis line. Provided list of emergency and community resources. Maintain 24/7 staff support during BHRF stay; escalate to emergency services for any acute psychiatric or medical concern.",

      dischargePlanning:
        "Continued structured support post-discharge is required due to high relapse risk, history of homelessness, and environmental triggers. Step-down to ASAM 2.1 IOP, stable sober/transitional housing, and ongoing behavioral health and case management services are essential to maintain recovery and prevent relapse.",

      signsOfImprovement:
        "Consistent sobriety (negative UDS), reduced cravings, improved coping skills, engagement in groups and individual sessions, secured housing placement, increased social engagement and reduced isolation.",
      assistanceExpectations:
        "Client expects support with housing placement, structured treatment programming, vocational planning, and connection to ongoing aftercare resources.",

      // Update timestamp
      updatedAt: new Date(),
    },
  });
  console.log("✓ Intake updated:", INTAKE_ID);

  // ---------- ASAM UPDATES ----------
  await prisma.aSAMAssessment.update({
    where: { id: ASAM_ID },
    data: {
      // Demographics fixes
      dateOfBirth: new Date("1982-06-18T00:00:00.000Z"),
      ahcccsId: "A00264070",
      insuranceType: "AHCCCS",
      insurancePlan: "AIHP",
      livingArrangement: "Homeless",
      referredBy: "ORBIT BEHAVIORAL HEALTH & WELLNESS",
      reasonForTreatment:
        '"I need help with substance abuse." Methamphetamine use disorder with associated psychosocial impairment, homelessness, and unemployment.',
      currentSymptoms:
        "Ongoing methamphetamine use, social isolation, decreased motivation, unable to maintain employment or stable housing, impaired judgment related to substance use. Denies acute withdrawal symptoms.",

      // Dimension 1: Substance Use
      substanceUseHistory: [
        {
          substance: "Methamphetamine",
          route: "Smoke",
          amount: "~$20/week",
          frequency: "Weekly",
          ageFirstUse: "21",
          lastUse: "2026-04-08",
          recentlyUsed: true,
          priorUse: true,
        },
        {
          substance: "Cannabis",
          route: "Smoke",
          amount: "~1 joint/day",
          frequency: "Daily",
          ageFirstUse: "21",
          lastUse: "2026-04-08",
          recentlyUsed: true,
          priorUse: true,
        },
        {
          substance: "Tobacco",
          route: "Smoke",
          amount: "3 cigarettes/day",
          frequency: "Daily",
          ageFirstUse: "",
          lastUse: "Current",
          recentlyUsed: true,
          priorUse: true,
        },
      ],
      usingMoreThanIntended: true,
      usingMoreDetails:
        "Client reports continued use despite intent to reduce, including continued methamphetamine use after multiple completed treatment episodes.",
      physicallyIllWhenStopping: false,
      physicallyIllDetails:
        "Denies physical illness on cessation; no current withdrawal symptoms.",
      currentWithdrawalSymptoms: false,
      withdrawalSymptomsDetails: "Denies current withdrawal symptoms.",
      historyOfSeriousWithdrawal: false,
      seriousWithdrawalDetails: "No reported history of serious withdrawal.",
      toleranceIncreased: true,
      toleranceDetails:
        "Long-standing pattern of regular methamphetamine and cannabis use since age 21 suggests established tolerance.",
      recentUseChanges: false,
      recentUseChangesDetails:
        "Pattern stable; weekly methamphetamine via smoking, daily cannabis.",
      familySubstanceHistory:
        "Family substance history unknown. Environmental exposure to peers using substances is a major trigger.",
      dimension1Severity: 2, // Moderate — ongoing use, no acute withdrawal
      dimension1Comments:
        "No current withdrawal symptoms; medically stable. Ongoing weekly methamphetamine and daily cannabis use with high relapse risk.",

      // Dimension 2: Biomedical
      medicalConditions: {
        allergies: "NKDA",
        surgeries: "Right ankle surgery (date unspecified)",
        cancer: "No",
        std: "No",
        infections: "None reported",
      },
      conditionsInterfere: false,
      conditionsInterfereDetails:
        "No active medical conditions reported that would interfere with treatment.",
      priorHospitalizations:
        "March 2025 — detox/psychiatric admission at Sonoran Desert, Tucson, AZ. Right ankle surgery (date unspecified).",
      lifeThreatening: false,
      medicalMedications: [],
      dimension2Severity: 0, // None — medically stable
      dimension2Comments:
        "Medically stable. NKDA. No current medications. No active medical conditions interfering with treatment.",

      // Dimension 3: Emotional/Behavioral/Cognitive — eval explicitly denies most
      moodSymptoms: {
        depression: false,
        hopelessness: false,
        irritability: false,
        lossOfPleasure: false,
      },
      anxietySymptoms: {
        anxiety: false,
        obsessiveThoughts: false,
        compulsiveBehaviors: false,
      },
      psychosisSymptoms: {
        paranoia: false,
        delusions: false,
        hallucinations: false,
      },
      otherSymptoms: {
        sleepDisturbance: false,
        memory: false,
        gambling: false,
        riskySex: false,
        impulsiveRiskyBehavior: true,
      },
      suicidalThoughts: false,
      suicidalThoughtsDetails:
        "Denies current and past suicidal ideation. Denies suicide attempts.",
      thoughtsOfHarmingOthers: false,
      harmingOthersDetails: "Denies homicidal ideation or thoughts of harming others.",
      abuseHistory: "Client denies any abuse or trauma history.",
      traumaticEvents:
        "Prior BHRF placement ended after client was assaulted by another resident, contributing to feelings of unsafety in residential settings.",
      mentalIllnessDiagnosed: false,
      mentalIllnessDetails:
        "No formal psychiatric diagnoses other than the substance use disorders. Denies depression, anxiety, OCD, PTSD, bipolar, and psychosis. Reports impulsive/risky behavior consistent with BPD-style traits.",
      previousPsychTreatment: true,
      psychTreatmentDetails:
        "Three prior rehab admissions in Phoenix, AZ. Last detox/psychiatric admission March 2025 at Sonoran Desert, Tucson.",
      hallucinationsPresent: false,
      hallucinationsDetails:
        "Denies audio-visual hallucinations. Thought content: no delusions or hallucinations on MSE.",
      furtherMHAssessmentNeeded: false,
      furtherMHAssessmentDetails:
        "No further mental-health assessment required at admission. Continue routine monitoring during BHRF stay.",
      psychiatricMedications: [],
      mentalHealthProviders: [],
      dimension3Severity: 2, // Moderate — impaired judgment, isolation
      dimension3Comments:
        "Behavioral instability — impaired judgment related to substance use, social isolation, decreased motivation. Denies acute psychiatric symptoms (no SI/HI, no psychosis, no mood/anxiety symptoms).",

      // Dimension 4: Readiness to Change
      areasAffectedByUse: {
        work: true,
        mentalHealth: true,
        physicalHealth: true,
        finances: true,
        legalMatters: true,
        relationships: true,
        recreationalActivities: true,
        selfEsteem: true,
        sexualActivity: true,
      },
      continueUseDespitefects: true,
      continueUseDetails:
        "Continues to use methamphetamine and cannabis despite homelessness, unemployment, divorce, suspended license, and prior incarcerations.",
      previousTreatmentHelp: true,
      treatmentProviders: [
        { name: "Sonoran Desert (Tucson)", contact: "March 2025 detox" },
        { name: "Phoenix-area rehab programs", contact: "Three prior episodes" },
      ],
      recoverySupport:
        "Limited social support. Reports minimal close support. Has previously engaged with NA/AA and case management.",
      recoveryBarriers:
        "Environmental exposure to peers using substances; unstable housing; unemployment; lack of structured support outside treatment.",
      treatmentImportanceAlcohol: "Not at all",
      treatmentImportanceDrugs: "Considerably",
      treatmentImportanceDetails:
        "Self-presented for treatment requesting help with substance abuse. Motivated to address methamphetamine use; lacks effective relapse prevention skills.",
      dimension4Severity: 2, // Moderate — motivated but lacks coping skills
      dimension4Comments:
        "Motivated for treatment (self-presented requesting help) but lacks relapse prevention skills and stable environment to sustain recovery independently.",

      // Dimension 5: Relapse Risk
      cravingsFrequencyAlcohol: "None",
      cravingsFrequencyDrugs: "Frequently",
      cravingsDetails:
        "Frequent cravings for methamphetamine driven by environmental triggers and peer exposure.",
      timeSearchingForSubstances: false,
      timeSearchingDetails: "No reported time spent searching for substances.",
      relapseWithoutTreatment: true,
      relapseDetails:
        "Pattern of completing structured treatment then relapsing in unstructured environments. Has completed at least one full year-long program but unable to sustain sobriety once outside structured settings.",
      awareOfTriggers: true,
      triggersList: {
        environment: true,
        peerExposure: true,
        housingInstability: true,
        unemployment: true,
        socialIsolation: true,
      },
      copingWithTriggers:
        "Limited effective coping strategies. Has used case management and counseling supports but struggles to apply skills in unstructured environments.",
      attemptsToControl:
        "Multiple prior treatment episodes (3 rehabs, sober living, halfway house, prior BHRF). Demonstrates ability to maintain sobriety in structured settings.",
      longestSobriety: "Approximately 1 year (during structured program)",
      whatHelped:
        "Structured residential programming, sober living environments, daily routine, case management, peer support.",
      whatDidntHelp:
        "Returning to the same unstable environment with peer substance use; unstructured living without daily accountability.",
      dimension5Severity: 3, // Severe — high relapse risk
      dimension5Comments:
        "High relapse risk due to environmental triggers (peer exposure, homelessness), limited coping skills outside structured environments, and pattern of relapse after prior treatment episodes.",

      // Dimension 6: Recovery Environment
      supportiveRelationships:
        "Minimal social support reported. Divorced, no children. Limited close relationships outside treatment settings.",
      currentLivingSituation:
        "Homeless since March 2025. Reports temporarily staying with a friend.",
      othersUsingDrugsInEnvironment: true,
      othersUsingDetails:
        "Environmental exposure to peers using substances is identified as the primary trigger for continued use and relapse.",
      safetyThreats: false,
      safetyThreatsDetails:
        "No current safety threats. Prior BHRF assault contributes to caution about residential placement.",
      negativeImpactRelationships: true,
      negativeImpactDetails:
        "Substance use has resulted in divorce, social isolation, and loss of friendships.",
      currentlyEmployedOrSchool: false,
      employmentSchoolDetails:
        "Unemployed since 2022. Last position: Medical Transport Driver. Driver's license suspended.",
      socialServicesInvolved: true,
      socialServicesDetails:
        "Tribal displacement assistance (PERCAT). Case manager: Thomsine, 520-562-3321.",
      probationParoleOfficer: "None — no active probation",
      probationParoleContact: "",
      dimension6Severity: 4, // Very Severe — homelessness with peer-use exposure
      dimension6Comments:
        "Unstable environment — homelessness since March 2025 with environmental exposure to peers using substances. No stable housing or supportive sober environment outside treatment.",

      // Summary rationale
      summaryRationale: {
        dimension1:
          "No current withdrawal; ongoing methamphetamine and cannabis use with high relapse risk (Severity 2 — Moderate).",
        dimension2: "Medically stable, no current medications, NKDA (Severity 0 — None).",
        dimension3:
          "Behavioral instability — impaired judgment, social isolation, denies acute psychiatric symptoms (Severity 2 — Moderate).",
        dimension4:
          "Motivated for treatment but lacks effective relapse prevention skills (Severity 2 — Moderate).",
        dimension5:
          "High relapse risk due to environmental triggers and pattern of relapse in unstructured environments (Severity 3 — Severe).",
        dimension6:
          "Homelessness and environmental exposure to peers using substances (Severity 4 — Very Severe).",
      },

      // DSM-5 Diagnoses
      dsm5Diagnoses:
        "F15.20 – Stimulant Use Disorder (Methamphetamine), Severe\nF12.10 – Cannabis Use Disorder, Mild",

      // Level of Care Determination
      levelOfCareDetermination: {
        withdrawalManagement: "None required",
        treatmentLevels: {
          dimension1: "3.1",
          dimension2: "1.0",
          dimension3: "3.1",
          dimension4: "3.1",
          dimension5: "3.1",
          dimension6: "3.1",
        },
        compositeRecommendation:
          "ASAM 3.1 – Clinically Managed Low-Intensity Residential Treatment (BHRF)",
      },
      matInterested: false,
      matDetails:
        "Wellbutrin XL 150mg PO daily was recommended for cravings; client refused. May reconsider Bupropion / Naltrexone during treatment.",

      // Placement Summary
      recommendedLevelOfCare:
        "ASAM 3.1 – Clinically Managed Low-Intensity Residential Treatment (BHRF)",
      levelOfCareProvided:
        "ASAM 3.1 – Clinically Managed Low-Intensity Residential Treatment (BHRF)",
      designatedTreatmentLocation:
        "Lucid Behavioral Health (BHRF), Phoenix, AZ",
      designatedProviderName: "Adebukola Aladesanmi, DNP, PMHNP-BC",

      // Signatures
      counselorName: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      counselorSignatureDate: new Date("2026-04-21T00:00:00.000Z"),

      // Workflow — move out of DRAFT to PENDING for review
      status: "PENDING",
      draftStep: null,
      updatedAt: new Date(),
    },
  });
  console.log("✓ ASAM updated:", ASAM_ID);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
