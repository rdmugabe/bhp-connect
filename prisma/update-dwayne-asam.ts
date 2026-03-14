import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find Dwayne's intake first
  const intake = await prisma.intake.findFirst({
    where: {
      OR: [
        { residentName: { contains: "Dwayne", mode: "insensitive" } },
        { residentName: { contains: "Hunt", mode: "insensitive" } },
      ],
    },
  });

  if (!intake) {
    console.log("No intake found for Dwayne Hunt");
    return;
  }

  console.log("Found intake for:", intake.residentName, "ID:", intake.id);

  // Find the ASAM assessment linked to this intake
  let asamAssessment = await prisma.aSAMAssessment.findFirst({
    where: {
      intakeId: intake.id,
    },
  });

  if (!asamAssessment) {
    console.log("No ASAM assessment found for this intake");
    return;
  }

  console.log("Found ASAM assessment ID:", asamAssessment.id);
  console.log("Current status:", asamAssessment.status);

  // Update the ASAM assessment with information from the Comprehensive Assessment
  const updatedAsam = await prisma.aSAMAssessment.update({
    where: { id: asamAssessment.id },
    data: {
      // Demographics
      gender: asamAssessment.gender || "Male",
      age: asamAssessment.age || 62,
      ahcccsId: asamAssessment.ahcccsId || "A43560437",
      insuranceType: asamAssessment.insuranceType || "AHCCCS",
      livingArrangement: asamAssessment.livingArrangement || "Homeless",
      referredBy: asamAssessment.referredBy || "Orbit Behavioral Health & Wellness",

      reasonForTreatment: asamAssessment.reasonForTreatment || `Mr. Dwayne came for help because he says, "I need help with my alcoholism; I need help getting myself right." He has been drinking heavily for over 40 years and is tired of waking up thinking about alcohol every day. He tried to stay sober on his own for six weeks but could not keep it up. He does not have a stable place to live, has no job, and has no one to support him. He recognizes that he cannot beat this problem alone and needs professional help in a structured setting.`,

      currentSymptoms: asamAssessment.currentSymptoms || `Anxiety (6/10 at worst):
- Feels anxious, fearful, and worried
- Has muscle tension, feels tired and restless
- Gets irritable easily, has trouble sleeping

Depression (7/10 at worst):
- Feels guilty, has poor concentration
- Lacks motivation, feels hopeless and worthless

PTSD:
- Intrusive thoughts and memories/flashbacks
- Nightmares, hyperarousal
- Triggers: gun fire, "anything with a bum"

Sleep Issues:
- Chronic insomnia
- Trouble falling and staying asleep

Alcohol Cravings:
- Persistent, strong cravings (8/10)
- Intrusive thoughts about drinking`,

      // Dimension 1: Substance Use
      substanceUseHistory: asamAssessment.substanceUseHistory || JSON.stringify([
        {
          substance: "Alcohol (hard liquor)",
          route: "Oral",
          frequency: "Daily/chronic heavy use",
          duration: "Over 40 years (since age 17)",
          lastUse: "About 6 weeks before evaluation",
          amountPerUse: "~$100/week spending",
        },
        {
          substance: "Tobacco",
          route: "Smoking",
          frequency: "Regular use",
          duration: "Not specified",
          lastUse: "Current user",
          amountPerUse: "Not specified",
        },
      ]),

      toleranceIncreased: true,
      toleranceDetails: asamAssessment.toleranceDetails || "40+ years of chronic heavy alcohol use indicates significant tolerance development",

      historyOfSeriousWithdrawal: false,
      seriousWithdrawalDetails: asamAssessment.seriousWithdrawalDetails || "Denies having alcohol withdrawal seizures or delirium tremens",

      familySubstanceHistory: asamAssessment.familySubstanceHistory || "Family has a known history of alcohol problems",

      dimension1Severity: asamAssessment.dimension1Severity ?? 3, // Severe
      dimension1Comments: asamAssessment.dimension1Comments || `Mr. Dwayne has a 40+ year history of severe alcohol use disorder. He began drinking at age 17, and use intensified during military service. He reports chronic heavy use of hard liquor, spending approximately $100/week on alcohol. Longest sobriety period is 6 weeks while attempting to stay sober on his own. No formal substance use treatment prior to this evaluation. Denies history of withdrawal seizures or delirium tremens. Also reports tobacco use.`,

      // Dimension 2: Biomedical Conditions
      medicalConditions: asamAssessment.medicalConditions || JSON.stringify({
        bulletWound: true,
        recentSpiderBite: true,
        excessiveThirst: true,
        allergies: ["Saline", "Peaches", "Grass", "Melon"],
      }),

      priorHospitalizations: asamAssessment.priorHospitalizations || "Hospitalized for detox and mental health treatment at Valleywise Hospital over one year ago",

      lifeThreatening: false,

      dimension2Severity: asamAssessment.dimension2Severity ?? 1, // Mild
      dimension2Comments: asamAssessment.dimension2Comments || `Medical history includes a bullet in his right arm from a previous injury. He complained of a spider bite a few days before evaluation but denies current pain. Reports excessive thirst (possible endocrine concern that should be monitored). Allergies to saline, peaches, grass, and melon. No life-threatening medical conditions identified.`,

      // Dimension 3: Emotional, Behavioral, Cognitive
      moodSymptoms: asamAssessment.moodSymptoms || JSON.stringify({
        depression: true,
        guilt: true,
        poorConcentration: true,
        lackOfMotivation: true,
        hopelessness: true,
        worthlessness: true,
        depthRating: "7/10 at worst",
      }),

      anxietySymptoms: asamAssessment.anxietySymptoms || JSON.stringify({
        anxiety: true,
        fearfulness: true,
        worry: true,
        muscleTension: true,
        fatigue: true,
        restlessness: true,
        irritability: true,
        sleepDisturbance: true,
        depthRating: "6/10 at worst",
      }),

      psychosisSymptoms: asamAssessment.psychosisSymptoms || JSON.stringify({
        paranoia: false,
        delusions: false,
        hallucinations: false,
      }),

      otherSymptoms: asamAssessment.otherSymptoms || JSON.stringify({
        chronicInsomnia: true,
        troubleFallingAsleep: true,
        troubleStayingAsleep: true,
        nightmares: true,
        intrusiveThoughts: true,
        flashbacks: true,
        hyperarousal: true,
      }),

      suicidalThoughts: false,
      suicidalThoughtsDetails: asamAssessment.suicidalThoughtsDetails || "Denies any suicidal thoughts. Denies history of suicide attempts. Denies self-harming behaviors.",

      thoughtsOfHarmingOthers: false,
      harmingOthersDetails: asamAssessment.harmingOthersDetails || "Denies homicidal ideation",

      traumaticEvents: asamAssessment.traumaticEvents || `Mr. Dwayne has PTSD related to his military service as a Marine officer. He experienced traumatic events during his time in the military. Triggers include "gun fire and anything with a bum". He has intrusive thoughts, flashbacks, nightmares, and hyperarousal related to his trauma. He denies any history of sexual or physical abuse.`,

      mentalIllnessDiagnosed: true,
      mentalIllnessDetails: asamAssessment.mentalIllnessDetails || `Diagnoses:
- Post-Traumatic Stress Disorder (PTSD) - F43.10
- Major Depressive Disorder, Recurrent, Moderate - F33.1
- Generalized Anxiety Disorder - F41.1
- Primary Insomnia - F51.01
- Alcohol Use Disorder, Severe - F10.20`,

      previousPsychTreatment: true,
      psychTreatmentDetails: asamAssessment.psychTreatmentDetails || "Hospitalized for detox and mental health treatment at Valleywise Hospital over one year ago. Has never had outpatient psychiatric services or therapy before. Has never tried psychiatric medications before.",

      hallucinationsPresent: false,
      hallucinationsDetails: asamAssessment.hallucinationsDetails || "Denies hallucinations (hearing or seeing things that are not there)",

      dimension3Severity: asamAssessment.dimension3Severity ?? 3, // Severe
      dimension3Comments: asamAssessment.dimension3Comments || `Mr. Dwayne presents with significant co-occurring mental health conditions including PTSD (military-related), moderate depression (7/10), generalized anxiety (6/10), and chronic insomnia. He has intrusive thoughts, flashbacks, nightmares, and hyperarousal related to military trauma. Triggers include gunfire and homeless individuals. No suicidal or homicidal ideation. No hallucinations or psychotic symptoms. Has had one prior psychiatric hospitalization for detox at Valleywise Hospital. No prior outpatient treatment or psychiatric medications. His emotional conditions significantly interfere with his ability to maintain sobriety.`,

      // Dimension 4: Readiness to Change
      areasAffectedByUse: asamAssessment.areasAffectedByUse || JSON.stringify({
        dailyActivities: true,
        finances: true,
        housing: true,
        work: true,
        relationships: true,
        selfEsteem: true,
        recreationalActivities: true,
        sexualActivity: true,
        legal: true,
      }),

      continueUseDespitefects: true,
      continueUseDetails: asamAssessment.continueUseDetails || "Mr. Dwayne continued drinking heavily despite negative effects on his housing (homeless for 1 year), employment (not worked in 2 years), relationships (no family support despite 9 children), finances, and overall functioning.",

      previousTreatmentHelp: false,

      recoveryBarriers: asamAssessment.recoveryBarriers || `- Limited coping skills
- Long history of relapse (longest sobriety was 6 weeks)
- Homeless for about one year
- No family or social support
- Financially unstable
- Untreated trauma from military service
- Limited impulse control related to alcohol use`,

      treatmentImportanceAlcohol: asamAssessment.treatmentImportanceAlcohol || "Extremely",
      treatmentImportanceDetails: asamAssessment.treatmentImportanceDetails || `Mr. Dwayne is highly motivated to get better and wants to stop drinking. He states, "I need help with my alcoholism; I need help getting myself right." He is seeking treatment voluntarily (not being forced). He is willing to participate in treatment and medication management. He understands that he has a problem with alcohol and needs help.`,

      dimension4Severity: asamAssessment.dimension4Severity ?? 1, // Mild (good readiness)
      dimension4Comments: asamAssessment.dimension4Comments || `Mr. Dwayne demonstrates high motivation for treatment. He sought help voluntarily and expresses genuine desire to stop drinking. He has fair insight into his problem and is willing to engage in treatment and medication management. However, he has no prior formal treatment experience, so his understanding of recovery process may be limited. His high motivation is a significant strength that can support his recovery.`,

      // Dimension 5: Relapse Potential
      cravingsFrequencyAlcohol: asamAssessment.cravingsFrequencyAlcohol || "Constantly",
      cravingsDetails: asamAssessment.cravingsDetails || "Reports persistent, strong cravings for alcohol rated at 8/10. Has intrusive thoughts about drinking. Reports waking up thinking about alcohol every day.",

      relapseWithoutTreatment: true,
      relapseDetails: asamAssessment.relapseDetails || "He tried to stay sober on his own for six weeks but could not keep it up. The cravings became too strong, especially when he felt stressed or emotionally upset. He recognizes that he cannot beat this problem alone.",

      awareOfTriggers: true,
      triggersList: asamAssessment.triggersList || JSON.stringify({
        cravings: true,
        stress: true,
        emotionalDistress: true,
        loneliness: true,
        isolation: true,
        environmentsWithAlcohol: true,
        ptsdTriggers: true,
        gunfire: true,
        homelessIndividuals: true,
      }),

      copingWithTriggers: asamAssessment.copingWithTriggers || "Mr. Dwayne has limited coping skills. In the past, he used alcohol as his main way to deal with stress, trauma, and emotional pain. He does not have healthy coping strategies yet, which is why he needs treatment to learn new skills.",

      longestSobriety: asamAssessment.longestSobriety || "6 weeks",
      whatHelped: asamAssessment.whatHelped || "Self-directed efforts to stop drinking - was able to maintain for 6 weeks",
      whatDidntHelp: asamAssessment.whatDidntHelp || "Using alcohol to cope with stress, trauma, and emotional pain. Attempting recovery without professional help or structured support.",

      dimension5Severity: asamAssessment.dimension5Severity ?? 4, // Very Severe
      dimension5Comments: asamAssessment.dimension5Comments || `Mr. Dwayne presents with very high relapse potential. He has persistent, strong cravings (8/10) and intrusive thoughts about drinking. His longest sobriety was only 6 weeks despite 40+ years of attempts. He has limited coping skills and historically used alcohol to manage stress and trauma. His PTSD triggers, homelessness, lack of support system, and untreated mental health conditions all significantly increase relapse risk. He requires intensive, structured treatment to develop coping skills and establish a recovery foundation.`,

      // Dimension 6: Recovery/Living Environment
      supportiveRelationships: asamAssessment.supportiveRelationships || `Mr. Dwayne currently has no reliable support system:
- Has nine children but no active family support
- Never married
- No close friends who are sober
- Has been isolated due to homelessness and addiction
- Is a retired Marine officer - may connect with veteran support services`,

      currentLivingSituation: asamAssessment.currentLivingSituation || "Homeless for approximately one year. No stable housing identified. Housing instability is connected to his addiction and lack of resources.",

      othersUsingDrugsInEnvironment: true,
      othersUsingDetails: asamAssessment.othersUsingDetails || "As a homeless individual, he is likely exposed to environments where substance use is prevalent",

      safetyThreats: true,
      safetyThreatsDetails: asamAssessment.safetyThreatsDetails || "Homelessness presents safety concerns. Triggers include 'anything with a bum' suggesting negative experiences while homeless.",

      currentlyEmployedOrSchool: false,
      employmentSchoolDetails: asamAssessment.employmentSchoolDetails || "Has not worked in two years. Retired Marine officer. Employment has been affected by his drinking.",

      dimension6Severity: asamAssessment.dimension6Severity ?? 4, // Very Severe
      dimension6Comments: asamAssessment.dimension6Comments || `Mr. Dwayne's recovery environment is severely compromised. He has been homeless for about one year with no stable housing. He has no active family support despite having nine children. He has no sober friends or social connections. His environment likely exposes him to substances and unsafe conditions. He has not worked in two years. His only potential resource is his military background, which may allow connection to VA services and veteran support groups. Building a support system and securing stable housing are critical priorities for his recovery.`,

      // Summary
      summaryRationale: asamAssessment.summaryRationale || JSON.stringify({
        dimension1: "Severe - 40+ year history of severe alcohol use disorder with chronic heavy use",
        dimension2: "Mild - No acute medical concerns requiring intensive intervention; allergies and minor medical issues noted",
        dimension3: "Severe - Significant co-occurring PTSD, depression, anxiety, and insomnia that interfere with functioning",
        dimension4: "Mild - High motivation and willingness to engage in treatment; seeking help voluntarily",
        dimension5: "Very Severe - Very high relapse risk due to persistent cravings, limited coping skills, and short sobriety history",
        dimension6: "Very Severe - Homeless, no support system, unemployed, socially isolated",
      }),

      // DSM-5 Diagnoses
      dsm5Diagnoses: asamAssessment.dsm5Diagnoses || `Primary Diagnoses:
1. F10.20 - Alcohol Use Disorder, Severe
2. F43.10 - Post-Traumatic Stress Disorder (PTSD)
3. F33.1 - Major Depressive Disorder, Recurrent, Moderate
4. F41.1 - Generalized Anxiety Disorder
5. F51.01 - Primary Insomnia`,

      // Level of Care
      matInterested: true,
      matDetails: asamAssessment.matDetails || "Recommended medications include Vistaril for anxiety, Sertraline for mood, Naltrexone for cravings, Prazosin for PTSD, and Trazodone for insomnia. Client initially refused but remains open to medication management.",

      recommendedLevelOfCare: asamAssessment.recommendedLevelOfCare || "3.1",
      designatedTreatmentLocation: asamAssessment.designatedTreatmentLocation || "ASAM Level 3.1 - Clinically Managed Low-Intensity Residential Services (Behavioral Health Residential Facility)",

      levelOfCareDetermination: asamAssessment.levelOfCareDetermination || JSON.stringify({
        rationale: `Mr. Dwayne meets ASAM Level 3.1 criteria based on the following:
- Dimension 1: 40+ year history of severe alcohol use disorder requiring structured treatment environment
- Dimension 2: Medical conditions stable but require monitoring
- Dimension 3: Co-occurring PTSD, depression, anxiety, and insomnia require integrated treatment
- Dimension 4: High motivation supports residential treatment engagement
- Dimension 5: Very high relapse risk necessitates 24-hour structure and support
- Dimension 6: Homelessness and lack of support system make outpatient recovery unsafe

He needs a structured therapeutic environment to:
- Stabilize from chronic alcohol use
- Address co-occurring mental health conditions
- Develop healthy coping skills
- Secure stable housing
- Build a sober support network
- Connect with VA services`,
      }),
    },
  });

  console.log("\nASAM Assessment updated successfully!");
  console.log("Updated assessment for:", updatedAsam.patientName);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
