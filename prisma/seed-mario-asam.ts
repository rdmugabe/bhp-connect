import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the facility
  const facility = await prisma.facility.findFirst({
    where: { name: "Lucid Behavioral Health" }
  });

  if (!facility) {
    console.error("Facility 'Lucid Behavioral Health' not found");
    process.exit(1);
  }

  // Find the intake for Mario Webb
  const intake = await prisma.intake.findFirst({
    where: {
      residentName: "Mario Webb",
      facilityId: facility.id
    }
  });

  if (!intake) {
    console.error("Intake for Mario Webb not found. Please run seed-mario-webb.ts first.");
    process.exit(1);
  }

  // Find the BHRF user for submittedBy
  const bhrfUser = await prisma.user.findFirst({
    where: { role: "BHRF" }
  });

  if (!bhrfUser) {
    console.error("BHRF user not found");
    process.exit(1);
  }

  // Check if ASAM already exists
  const existingAsam = await prisma.aSAMAssessment.findFirst({
    where: {
      intakeId: intake.id
    }
  });

  if (existingAsam) {
    console.log("ASAM assessment already exists for this intake, ID:", existingAsam.id);
    return;
  }

  // Create the ASAM assessment
  const asam = await prisma.aSAMAssessment.create({
    data: {
      facilityId: facility.id,
      intakeId: intake.id,
      submittedBy: bhrfUser.id,
      status: "APPROVED",

      // Demographics
      patientName: "Mario Webb",
      assessmentDate: new Date("2026-03-27"),
      admissionDate: new Date("2026-03-27"),
      phoneNumber: "480-316-9707",
      okayToLeaveVoicemail: false,
      patientAddress: "7515 W Odeum Ln, Phoenix AZ 85043",
      dateOfBirth: new Date("1983-09-13"),
      age: 42,
      gender: "Male",
      raceEthnicity: "Native American",
      preferredLanguage: "English",
      ahcccsId: "A00541100",
      insuranceType: "AHCCCS",
      insurancePlan: "AIHP",
      livingArrangement: "Homeless",
      reasonForTreatment: `Mario needs residential treatment because:
- He has severe addiction to alcohol and methamphetamine
- He recently relapsed after completing an Intensive Outpatient Program
- He cannot stay sober on his own without structured support
- He is homeless, unemployed, and on probation
- He has underlying depression and anxiety that make coping harder
- His life has gotten worse in many areas due to substance use

In his own words: "I need help with drugs"`,
      currentSymptoms: `- Moderate depression (PHQ-9 score of 10)
- Sleep problems (trouble falling or staying asleep)
- Difficulty concentrating
- Restlessness
- Rapid speech
- Fair impulse control and judgment
- Limited insight into the seriousness of his addiction
- Underlying anxiety
- No current psychotic symptoms`,

      // Dimension 1: Acute Intoxication / Withdrawal Potential
      substanceUseHistory: [
        {
          substance: "Amphetamines (Meth, Ice, Crank)",
          route: "Smoke",
          ageFirstUse: "18",
          lastUse: "2026-03-13",
          frequency: "Daily",
          amount: "Up to 1 oz/day at peak ($200/day)"
        },
        {
          substance: "Fentanyl",
          route: "Unknown",
          ageFirstUse: "18",
          lastUse: "2025-03-27",
          frequency: "Daily",
          amount: "$20/day during active use"
        },
        {
          substance: "Alcohol",
          route: "Oral",
          ageFirstUse: "Unknown",
          lastUse: "Unknown",
          frequency: "Self-reports minimal use",
          amount: "Unknown"
        }
      ],
      usingMoreThanIntended: true,
      usingMoreDetails: "Mario has a pattern of impaired control over his substance use. He cannot control his use on his own and has progressively increased use over time. At peak use, he was spending $200/day on methamphetamine.",
      physicallyIllWhenStopping: false,
      physicallyIllDetails: "Mario denies any history of withdrawal seizures. No significant physical withdrawal symptoms currently documented.",
      currentWithdrawalSymptoms: false,
      withdrawalSymptomsDetails: "No current withdrawal symptoms documented. Mario was approximately 6 months abstinent from methamphetamine at intake (February 2026), though he had recent use about two weeks before his March psychiatric evaluation.",
      historyOfSeriousWithdrawal: false,
      seriousWithdrawalDetails: "Mario denies history of withdrawal seizures or serious withdrawal complications.",
      toleranceIncreased: true,
      toleranceDetails: "Mario showed high tolerance, with heavy daily use at his peak. He used up to one ounce of methamphetamine per day during his 20s to mid-30s.",
      recentUseChanges: true,
      recentUseChangesDetails: "Mario recently relapsed after being discharged from IOP on February 18, 2026. His last reported methamphetamine use was about two weeks before his psychiatric evaluation in late March 2026.",
      familySubstanceHistory: "Unknown. Mario does not have information about his family's substance use history.",
      dimension1Severity: 2, // Moderate
      dimension1Comments: `Mario has a long history of stimulant and opioid use, starting at age 18 (approximately 24 years of use). He started using methamphetamine due to environmental exposure and availability. His use pattern shows high tolerance and heavy daily use during his 20s to mid-30s. He has a history of overdose, which served as motivation to try to stop. He reports easy access to substances even when money is limited, indicating high-risk environmental exposure. He recently relapsed after completing IOP, demonstrating he cannot maintain sobriety outside of structured settings. He denies withdrawal seizures but has a history of substance-induced psychotic symptoms (hallucinations and paranoia) during active use.`,

      // Dimension 2: Biomedical Conditions
      medicalConditions: {
        none: true,
        excessiveThirst: true
      },
      conditionsInterfere: false,
      conditionsInterfereDetails: "Mario does not have medical conditions that would interfere with treatment at this time.",
      lifeThreatening: false,
      priorHospitalizations: `- No hospitalizations or surgeries reported
- No inpatient psychiatric hospitalizations
- History of residential treatment stays (not hospitalizations):
  * Two 3-month stays at Crossroads (Ocotillo and Scottsdale locations)
  * Completed 6 months in a halfway house/sober living
  * At least one prior detox episode
  * Recent admission for detox and mental health`,
      medicalMedications: [],
      dimension2Severity: 1, // Low
      dimension2Comments: `Mario denies significant medical history and has no chronic conditions such as hypertension, diabetes, asthma, or seizures. He reports no allergies. His physical health appears stable and does not require specialized medical monitoring during treatment. However, his history of overdose is an important consideration for overall risk. He reports excessive thirst, which may warrant monitoring. Physical exam shows normal gait, upright posture, and dry/clean/intact skin.`,

      // Dimension 3: Emotional, Behavioral & Cognitive Conditions
      moodSymptoms: {
        depression: true,
        hopelessness: true,
        lowSelfEsteem: true
      },
      anxietySymptoms: {
        anxiety: true
      },
      psychosisSymptoms: {
        pastHallucinations: true,
        pastParanoia: true
      },
      otherSymptoms: {
        sleepProblems: true,
        concentrationDifficulty: true,
        rapidSpeech: true,
        restlessness: true,
        fairImpulseControl: true,
        fairJudgment: true,
        limitedInsight: true
      },
      suicidalThoughts: false,
      suicidalThoughtsDetails: "Mario denies current suicidal ideation.",
      thoughtsOfHarmingOthers: false,
      harmingOthersDetails: "Mario denies current homicidal ideation.",
      abuseHistory: "None reported. Client denies sexual/physical abuse. History of abuse as victim: Unknown. Denies history of trauma.",
      traumaticEvents: "None reported. Mario denies history of trauma, abuse, or exposure to traumatic events. He denies PTSD symptoms including intrusive thoughts, flashbacks, nightmares, and hyperarousal.",
      mentalIllnessDiagnosed: true,
      mentalIllnessDetails: "- Major Depressive Disorder, Recurrent, Moderate (F33.1)\n- Generalized Anxiety Disorder (F41.1)",
      previousPsychTreatment: true,
      psychTreatmentDetails: "- No prior outpatient psychiatrist or therapist\n- Recent admission(s) for psychiatric hospitalization related to detox and mental health\n- No inpatient psychiatric hospitalizations\n- Past substance-induced psychotic symptoms during use\n- Treatment has focused primarily on substance use",
      hallucinationsPresent: false,
      hallucinationsDetails: "No, not currently. Mario denies current audio and visual hallucinations. However, he had past episodes of hallucinations and paranoid thinking during active substance use.",
      furtherMHAssessmentNeeded: true,
      furtherMHAssessmentDetails: "Ongoing monitoring is recommended for:\n- Depression symptoms (to determine if antidepressant needed after stabilization)\n- Anxiety management\n- Continued psychiatric monitoring throughout treatment",
      psychiatricMedications: [],
      dimension3Severity: 2, // Low to Moderate
      dimension3Comments: `Mario has been diagnosed with Major Depressive Disorder (Recurrent, Moderate) and Generalized Anxiety Disorder. His PHQ-9 score of 10 indicates moderate depression with symptoms including sleep problems, concentration difficulties, and restlessness. Although he denies current mood and anxiety symptoms during assessment, clinical presentation suggests limited insight into the severity of his substance use disorder and its impact on his functioning. He had past substance-induced psychotic symptoms (hallucinations, paranoia) during active use, but no current psychotic symptoms. His presentation shows fair judgment, fair impulse control, and limited insight. He denies trauma history and abuse. Mental status exam shows he is alert and oriented x4, with logical thought process, normal thought content, and no delusions. He appears cooperative and calm with appropriate, congruent affect.`,

      // Dimension 4: Readiness to Change
      areasAffectedByUse: {
        adl: true,
        finances: true,
        housing: true,
        legalStatus: true,
        recreationalActivities: true,
        relationships: true,
        selfEsteem: true,
        sexualActivity: true,
        work: true,
        overallFunctioning: true
      },
      continueUseDespitefects: true,
      continueUseDetails: "Mario has continued using substances despite significant negative consequences across all life domains. He has a pattern of treatment engagement followed by relapse, showing continued use despite knowing the harmful effects.",
      previousTreatmentHelp: true,
      recoverySupport: `- Girlfriend of 9 years (only consistent support)
- Treatment providers
- 12-step meetings (has participated)
- Plans to get a sponsor

Limited support network - needs to expand beyond just his partner.`,
      recoveryBarriers: `- Homelessness
- Unemployment
- Legal issues (on probation until October 2026)
- History of incarceration
- Limited support network
- High-risk environment with easy access to substances
- Limited coping skills
- Limited insight into addiction severity
- Environmental triggers`,
      treatmentImportanceAlcohol: "Not at all",
      treatmentImportanceDrugs: "Considerably",
      treatmentImportanceDetails: "Mario expresses desire for help but has limited understanding of addiction severity. He is motivated enough to seek treatment voluntarily and has clear goals for housing and employment. He stated 'I need help with drugs' and acknowledges that trying to stay sober at home is hard.",
      dimension4Severity: 2, // Moderate
      dimension4Comments: `Mario expresses desire for help and has voluntarily sought treatment, stating "I need help with drugs." He has clear goals for housing and employment and is cooperative with providers. However, he demonstrates limited understanding of the full severity of his addiction. He has a history of completing treatment programs but then relapsing, indicating moderate readiness to change but difficulty sustaining motivation and recovery outside of structured settings. His past overdose served as motivation for cessation attempts. He acknowledges that trying to stay sober at home is hard. He plans to marry his girlfriend, which may provide additional motivation for stability.`,

      // Dimension 5: Relapse, Continued Use, or Continued Problem Potential
      cravingsFrequencyAlcohol: "None",
      cravingsFrequencyDrugs: "Frequently",
      cravingsDetails: "Mario has a long history of methamphetamine use and recently relapsed after completing IOP, suggesting significant ongoing craving/relapse potential.",
      timeSearchingForSubstances: true,
      timeSearchingDetails: "During active use, Mario reports easy access to substances even when financially limited, indicating high-risk environmental exposure. At peak use, he was spending significant time and resources ($200/day) on methamphetamine.",
      relapseWithoutTreatment: true,
      relapseDetails: "Highly likely. Mario has demonstrated inability to maintain sobriety outside of structured settings. He recently relapsed after completing IOP (discharged February 18, 2026). His pattern shows treatment engagement followed by relapse. He cannot sustain recovery independently.",
      awareOfTriggers: true,
      triggersList: {
        environment: true,
        stress: true,
        anger: true
      },
      copingWithTriggers: `Learning but limited effectiveness so far. Mario is developing coping skills through treatment including:
- Counting to ten when angry
- Taking a walk
- Writing in a journal
- Using "I feel" statements
- Distraction techniques
- Calling someone for support
- "Urge surfing" (riding out cravings)

However, these skills have not been effectively applied outside of structured treatment settings yet.`,
      attemptsToControl: "Mario has completed previous treatment programs: 6 months of outpatient services, 6 months in a halfway house/sober living, two 3-month residential stays at Crossroads. However, treatment gains have not been sustained.",
      longestSobriety: "6 months abstinent from methamphetamine (at intake, February 2026)",
      whatHelped: `- Structured residential treatment settings
- 12-step meetings
- Sponsor support (plans to get one)
- Support from his girlfriend
- Case management services
- His overdose experience served as motivation to stop`,
      whatDidntHelp: "Returning to unstructured settings where substances are readily available",
      dimension5Severity: 3, // High/Severe
      dimension5Comments: `Mario has HIGH relapse potential due to his long history of use (approximately 24 years), chronic substance exposure, environmental triggers, easy access to substances, and limited coping mechanisms. His history of overdose elevates his clinical risk profile. He has a pattern of completing treatment programs but then relapsing when returning to less structured settings. His recent relapse after IOP discharge demonstrates inability to maintain sobriety independently. He functions best in structured treatment settings. He is learning coping skills in treatment but has not yet demonstrated ability to apply them outside of residential care. He needs intensive relapse prevention programming and ongoing structured support after discharge.`,

      // Dimension 6: Recovery/Living Environment
      supportiveRelationships: `Very limited:
- Girlfriend of 9 years (only consistent support)
- She is his only friend
- Plans to marry her
- No emergency contact listed
- No family members mentioned as support

Expanding support network is a major treatment goal.`,
      currentLivingSituation: `- Homeless prior to treatment
- Currently in residential treatment facility
- History of unstable housing (built makeshift shelter on land)
- No stable housing plan - securing housing is a priority before discharge
- Relocated to Phoenix about 6 months ago seeking services and stability`,
      othersUsingDrugsInEnvironment: true,
      othersUsingDetails: "Mario reports continued exposure to high-risk environments where substances are readily available. He acknowledges access to substances even when financially limited. His environment prior to treatment was not supportive of recovery.",
      safetyThreats: true,
      safetyThreatsDetails: `- Currently homeless (unstable living conditions)
- History of living in makeshift shelter
- High-risk environment with drug availability
- No current suicidal or homicidal thoughts
- No current danger to self or others`,
      negativeImpactRelationships: true,
      negativeImpactDetails: `His substance use has led to:
- Social isolation
- Limited support network (only girlfriend)
- Strained relationships
- History of aggravated assault (2009)`,
      currentlyEmployedOrSchool: false,
      employmentSchoolDetails: `No. Mario is currently unemployed.
- Last employment: January 2026
- Previous work: Hello Fresh, self-employed landscaper
- Barriers to employment: legal history, housing instability, substance use
- No military history
- Education: High school graduate`,
      socialServicesInvolved: true,
      socialServicesDetails: `- AHCCCS (health insurance)
- Case management services
- Probation (until October 2026)
- Previously involved with treatment programs at Crossroads`,
      probationParoleOfficer: "Unknown",
      probationParoleContact: "Probation until October 2026",
      dimension6Severity: 3, // High/Severe
      dimension6Comments: `Mario's recovery environment presents HIGH risk. He is homeless, has unstable living conditions, and lives in a high-risk environment where substances are readily available. His support network is extremely limited, consisting only of his girlfriend of 9 years. He is unemployed and faces significant barriers to employment due to his legal history, housing instability, and substance use. He is currently on probation until October 2026. He relocated to Phoenix about 6 months ago seeking services and stability. A structured and supportive treatment environment is needed to provide stabilization. Housing MUST be secured before discharge. Tribal resources from Salt River and Gila River communities may be helpful. Sober living or transitional housing will be needed after residential treatment.`,

      // Summary of Multidimensional Assessment
      summaryRationale: {
        dimension1: "MODERATE RISK - Recent substance use with history of fentanyl exposure and overdose",
        dimension2: "LOW RISK - Denies medical conditions. No biomedical concerns requiring specialized medical attention.",
        dimension3: "LOW TO MODERATE - No diagnosed psychiatric conditions causing acute impairment, but depression and anxiety present with limited insight",
        dimension4: "MODERATE - Expresses desire for help but limited understanding of addiction severity. Has history of treatment completion followed by relapse.",
        dimension5: "HIGH - Long history of use, environmental triggers, access to substances, limited coping mechanisms, pattern of relapse after treatment",
        dimension6: "HIGH - Homelessness, unstable living conditions, high-risk environment, limited support network"
      },

      // DSM-5 Diagnoses
      dsm5Diagnoses: `PRIMARY SUBSTANCE USE DIAGNOSES:
F10.20 - Alcohol Use Disorder, Severe
F15.20 - Stimulant Use Disorder (Methamphetamine), Severe

CO-OCCURRING MENTAL HEALTH DIAGNOSES:
F33.1 - Major Depressive Disorder, Recurrent, Moderate
F41.1 - Generalized Anxiety Disorder

OTHER RELEVANT CODES:
Z59.819 - Housing Instability/Homelessness
Z65.3 - Problems Related to Legal Circumstances (Probation)
Z65.1 - Personal History of Incarceration`,

      // Level of Care Determination
      recommendedLevelOfCare: "3.5",
      levelOfCareProvided: "3.5",
      matInterested: false,
      matDetails: `To be assessed. Treatment plan includes:
- Assess readiness for Medication-Assisted Treatment (MAT)
- Consider Naltrexone or Acamprosate once stable
- Client refused medication management at initial psychiatric evaluation
- Will reassess MAT interest after stabilization`,
      designatedTreatmentLocation: "Lucid Behavioral Health\n7515 W Odeum Ln\nPhoenix, AZ 85043",
      designatedProviderName: "BHP - Dr. Chris Azode, DNP, MBA, PMHNP-BC",

      // Signatures
      counselorName: "Richard Mugabe, BHT",
      counselorSignatureDate: new Date("2026-03-27"),
      bhpLphaName: "Dr. Chris Azode",
      bhpLphaSignatureDate: new Date("2026-03-27"),
    }
  });

  console.log("ASAM Assessment created for Mario Webb");
  console.log("- ASAM ID:", asam.id);
  console.log("- Intake ID:", intake.id);
  console.log("- Facility:", facility.name);
  console.log("- Recommended LOC:", asam.recommendedLevelOfCare);
  console.log("- Status:", asam.status);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
