import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find Dwayne's intake by name
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
  console.log("Current status:", intake.status);

  // Update the intake with information from the Comprehensive Assessment
  const updatedIntake = await prisma.intake.update({
    where: { id: intake.id },
    data: {
      // Demographics - only update if missing
      sex: intake.sex || "Male",

      // Insurance - AHCCCS ID
      policyNumber: intake.policyNumber || "A43560437",

      // Referral Information
      evaluatorName: intake.evaluatorName || "Adebukola Aladesanmi",
      evaluatorCredentials: intake.evaluatorCredentials || "DNP, PMHNP-BC",

      reasonsForReferral: intake.reasonsForReferral || `Mr. Dwayne is being referred for placement in a Behavioral Health Residential Facility (BHRF) because he needs help with his alcohol addiction and related mental health issues. He has been drinking heavily since he was 17 years old, and his drinking got worse when he joined the military. He has been trying to stay sober on his own but has not been able to maintain it. He also has PTSD, depression, anxiety, and trouble sleeping that need treatment. Because he is homeless, unemployed, and has no support system, he needs a structured place where he can get the help he needs to recover.`,

      residentNeeds: intake.residentNeeds || `Mr. Dwayne needs:
- A safe, structured place to live while he works on his recovery
- Treatment for his severe alcohol use disorder
- Help with his PTSD, depression, anxiety, and sleep problems
- Help finding housing after treatment
- Help connecting with VA (Veterans Affairs) services
- Support building a sober network of people
- Help managing daily cravings for alcohol
- Case management to help with housing and other needs`,

      strengthsAndLimitations: intake.strengthsAndLimitations || `Strengths:
- He is highly motivated to get better and wants to stop drinking
- He is willing to participate in treatment and medication management
- He is alert and oriented (knows who he is, where he is, what time it is, and what is happening)
- He can think clearly and communicate well
- He has fair insight and understands that he has a problem with alcohol
- He is seeking treatment on his own (not being forced)
- He completed high school
- He served as a Marine officer
- He met all his developmental milestones growing up

Limitations:
- He has limited coping skills and has trouble managing cravings, especially when stressed
- He has a long history of relapse and has only been able to stay sober for about six weeks at most
- He has no stable housing (homeless for about one year)
- He has no family or social support
- He is financially unstable
- He has untreated trauma from his military service
- He has historically had limited impulse control related to alcohol use`,

      // Behavioral Health Symptoms
      reasonForServices: intake.reasonForServices || `Mr. Dwayne came for help because he says, "I need help with my alcoholism; I need help getting myself right." He has been drinking heavily for over 40 years and is tired of waking up thinking about alcohol every day. He tried to stay sober on his own for six weeks but could not keep it up. He does not have a stable place to live, has no job, and has no one to support him. He recognizes that he cannot beat this problem alone and needs professional help in a structured setting.`,

      currentBehavioralSymptoms: intake.currentBehavioralSymptoms || `Anxiety:
- Feels anxious, fearful, and worried
- Has muscle tension
- Feels tired and restless
- Gets irritable easily
- Has trouble sleeping
- Rates his anxiety as 6 out of 10 at its worst

Depression:
- Feels guilty
- Has poor concentration and focus
- Lacks motivation
- Feels hopeless and worthless
- Rates his depression as 7 out of 10 at its worst

PTSD:
- Has been exposed to traumatic events
- Has intrusive thoughts and memories/flashbacks
- Has nightmares
- Experiences hyperarousal (being on edge)
- Has sleep disturbances
- Triggers include "gun fire and anything with a bum"

Sleep Issues:
- Has chronic insomnia
- Has trouble falling and staying asleep

Alcohol Cravings:
- Has persistent, strong cravings for alcohol
- Has intrusive thoughts about drinking

Other Notes:
- He does not have suicidal or homicidal thoughts
- He does not have hallucinations (hearing or seeing things that are not there)
- He does not have bipolar disorder symptoms`,

      copingWithSymptoms: intake.copingWithSymptoms || `Mr. Dwayne has limited coping skills. In the past, he used alcohol as his main way to deal with stress, trauma, and emotional pain. This has not worked well because it has made his problems worse and led to a cycle of drinking that has lasted over 40 years. He tried to stay sober on his own for six weeks, but the cravings became too strong, especially when he felt stressed or emotionally upset. He does not have healthy coping strategies yet, which is why he needs treatment to learn new skills.`,

      symptomsLimitations: intake.symptomsLimitations || `Mr. Dwayne's symptoms affect almost every part of his life:
- Daily Activities: Yes, he has trouble with everyday tasks
- Finances: Yes, he is financially unstable and spent about $100 per week on alcohol
- Housing: Yes, he has been homeless for about one year
- Work: Yes, he has not worked in two years
- Relationships: Yes, his relationships have been affected
- Self-Esteem: Yes, he struggles with how he feels about himself
- Recreational Activities: Yes, he has trouble enjoying activities
- Sexual Activity: Yes, this area has been affected
- Legal History: He was in jail for about five hours for a traffic offense`,

      immediateUrgentNeeds: intake.immediateUrgentNeeds || `Safety Concerns:
- Mr. Dwayne denies having suicidal or homicidal thoughts
- He denies any history of suicide attempts
- He denies self-harming behaviors
- There are no acute safety concerns at this time

Urgent Needs:
- He needs stable housing right away
- He needs help managing his alcohol cravings
- He needs treatment for his PTSD, depression, anxiety, and insomnia
- He needs to be connected to VA services for veterans`,

      signsOfImprovement: intake.signsOfImprovement || `Improvement for Mr. Dwayne would include:
- Staying sober from alcohol throughout his stay (shown by negative alcohol tests)
- Reducing his cravings from 8 out of 10 to 3 out of 10 or less within 60 days
- Completing a written relapse prevention plan before leaving treatment
- Reducing depression and anxiety symptoms by 50% within 90 days
- Identifying at least 5 coping skills to manage trauma-related triggers within 45 days
- Sleeping better (6-7 hours per night) within 60 days
- Having stable housing before discharge
- Being connected to outpatient follow-up care
- Being able to take his medications as prescribed`,

      involvedInTreatment: intake.involvedInTreatment || `Current Treatment Team:
- Evaluating Provider: Adebukola Aladesanmi, DNP, PMHNP-BC (Psychiatric Nurse Practitioner)
- BHRF Treatment Team: Will include case managers, therapists, and residential staff

Future Treatment Team (after discharge):
- Outpatient psychiatrist for medication management
- Individual therapist for trauma-focused therapy
- VA services for PTSD support and housing assistance
- Peer support groups (AA meetings, Veteran Recovery Groups)

Note: Mr. Dwayne does not have an outpatient psychiatrist or therapist at this time.`,

      // Psychiatric History
      personalPsychHX: intake.personalPsychHX || `- He has a history of PTSD, depression, anxiety, and chronic insomnia
- He was admitted to the hospital for detox and mental health treatment at Valleywise Hospital over a year ago
- He has never had outpatient psychiatric services or therapy before
- He has never tried psychiatric medications before
- He denies any history of self-harming behaviors
- He denies any history of suicide attempts`,

      familyPsychHX: intake.familyPsychHX || `- His family has a known history of alcohol problems
- His family has a history of arthritis (medical condition)`,

      previousHospitalizations: intake.previousHospitalizations || "Yes, Mr. Dwayne was hospitalized for detox and mental health treatment at Valleywise Hospital. This was over one year ago.",

      hospitalizationDetails: intake.hospitalizationDetails || `- Medical Hospitalizations/Surgeries: He has a bullet in his right arm from a previous injury
- Recent Concerns: He complained of a spider bite a few days before his evaluation
- He denies current pain`,

      // Treatment Objectives
      treatmentObjectives: intake.treatmentObjectives || `Problem 1: Severe Alcohol Use Disorder with Persistent Cravings

Long-Term Goal: Mr. Dwayne will stay sober and learn how to prevent relapse so he can maintain his recovery on his own.

Short-Term Goals (30-90 Days):
1. Stay alcohol-free throughout his stay, shown by negative random alcohol tests
2. Reduce cravings from 8 out of 10 to 3 out of 10 or less within 60 days
3. Complete a written relapse prevention plan before discharge

Problem 2: PTSD, Depression, and Anxiety

Long-Term Goal: Mr. Dwayne will show better control over his emotions and have fewer PTSD and depression symptoms.

Short-Term Goals:
1. Report 50% fewer depression and anxiety symptoms within 90 days
2. Identify at least 5 coping skills to manage trauma-related triggers within 45 days
3. Sleep better (6-7 hours per night) within 60 days

Problem 3: Homelessness and Lack of Support System

Long-Term Goal: Mr. Dwayne will find stable housing and have community support before leaving treatment.

Short-Term Goals:
1. Meet with a case manager weekly to apply for housing
2. Look into VA benefits and veteran support services within 30 days
3. Attend at least 3 peer-support meetings per week (AA or Veteran Recovery Group)`,

      dischargePlanObjectives: intake.dischargePlanObjectives || `Mr. Dwayne will be ready for discharge when he has:
- Stayed sober throughout his residential stay
- Stabilized his cravings to manageable levels (3 out of 10 or less)
- Stabilized his mood and improved his sleep
- Shown that he can take his medications as prescribed
- Completed a relapse prevention and safety plan
- Found stable housing or transitional supportive housing
- Set up outpatient follow-up appointments`,

      supportSystem: intake.supportSystem || `Family:
- Mr. Dwayne has nine children
- He has never been married
- He currently has no family support

Friends:
- He has no reliable sober support system at this time

Other Connections:
- He is a retired Marine officer
- He may be able to connect with veteran support services and peer groups

Note: Building a support system is a major goal of his treatment.`,

      communityResources: intake.communityResources || `- VA (Veterans Affairs) services for PTSD support and housing assistance
- Veteran-specific support services
- AA (Alcoholics Anonymous) meetings
- Veteran Recovery Groups
- Sober living or veteran housing programs after discharge
- Intensive Outpatient Program (IOP) for step-down care
- Outpatient psychiatric services
- Individual therapy services
- Case management services
- Crisis hotline services`,

      // Developmental History
      developmentalMilestones: intake.developmentalMilestones || "Met",
      developmentalDetails: intake.developmentalDetails || `- Mr. Dwayne met all of his developmental milestones growing up
- He completed high school
- He started drinking alcohol at age 17
- His family has a history of alcohol problems, which may have influenced his early drinking`,

      // Social History
      childhoodDescription: intake.childhoodDescription || `- Mr. Dwayne met all of his developmental milestones growing up
- He completed high school
- He started drinking alcohol at age 17
- His family has a history of alcohol problems, which may have influenced his early drinking
- No other specific details about his childhood were documented`,

      abuseHistory: intake.abuseHistory || `Trauma History:
- Mr. Dwayne has PTSD related to his military service
- He experienced traumatic events during his time as a Marine
- His triggers include "gun fire and anything with a bum"
- He has intrusive thoughts, flashbacks, nightmares, and hyperarousal related to his trauma

Abuse History:
- He denies any history of sexual or physical abuse`,

      familyMentalHealthHistory: intake.familyMentalHealthHistory || `- His family has a known history of alcohol problems
- No other specific mental health conditions in the family were documented`,

      relationshipStatus: intake.relationshipStatus || "Never married",

      friendsDescription: intake.friendsDescription || `- Mr. Dwayne currently has no reliable social support network
- He has no close friends who are sober
- He lacks family support
- He has been isolated due to his homelessness and addiction
- Building a sober support network is an important part of his treatment plan`,

      // Education
      highestEducation: intake.highestEducation || "High school diploma",

      // Employment
      currentlyEmployed: intake.currentlyEmployed ?? false,
      employmentDetails: intake.employmentDetails || "He has not worked in two years",
      workVolunteerHistory: intake.workVolunteerHistory || "Served as a Marine officer (retired)",
      employmentBarriers: intake.employmentBarriers || `- Severe alcohol use disorder
- Homelessness
- Untreated mental health conditions`,

      // Legal History
      criminalLegalHistory: intake.criminalLegalHistory || "He was in jail for about five hours for a traffic offense. He denies any other significant legal history.",

      // Substance Use
      substanceHistory: intake.substanceHistory || `- Substance: Alcohol (primarily hard liquor)
- Age of First Use: 17 years old
- Duration: Over 40 years
- Pattern: Chronic heavy use
- Spending: About $100 per week on alcohol
- Last Use: About 6 weeks before evaluation
- Longest Sobriety: 6 weeks (while trying to stay sober on his own)
- Prior Treatment: No formal substance use treatment before
- Withdrawal History: He denies having alcohol withdrawal seizures or delirium tremens
- Tobacco Use: Yes`,

      drugOfChoice: intake.drugOfChoice || "Alcohol (hard liquor)",
      longestSobriety: intake.longestSobriety || "6 weeks",
      substanceTreatmentHistory: intake.substanceTreatmentHistory || "No formal substance use treatment before this evaluation",
      nicotineUse: intake.nicotineUse ?? true,

      substanceImpact: intake.substanceImpact || `Relationships:
- His alcohol use has hurt his relationships
- He has nine children but no active family support

Work:
- He has not worked in two years
- His employment was affected by his drinking

Health:
- He has PTSD, depression, anxiety, and insomnia that are connected to his alcohol use
- Alcohol has been used to cope with trauma, making symptoms worse

Legal Status:
- He was in jail for about five hours for a traffic offense
- He denies any other significant legal history

Housing:
- He has been homeless for about one year
- His instability is connected to his addiction and lack of resources

Finances:
- He is financially unstable
- He was spending about $100 per week on alcohol`,

      historyOfAbuse: intake.historyOfAbuse || "He denies any history of sexual or physical abuse. His trauma is related to his military service, not personal abuse.",

      // Living Situation
      livingArrangements: intake.livingArrangements || "Homeless for about one year. No stable housing identified.",
      sourceOfFinances: intake.sourceOfFinances || "Financially unstable - no current income source identified",

      // ADLs
      typicalDay: intake.typicalDay || `Mr. Dwayne's current daily routine has been affected by homelessness and unemployment. Before treatment, he reported:
- Thinking about alcohol every day from the time he woke up
- Not having a stable routine due to lack of housing
- Difficulty with sleep because of insomnia

In treatment, his schedule will include:
- Daily participation in structured residential programming (at least 5 days per week, 3+ hours per day)
- Weekly individual therapy
- Group therapy sessions
- Case management meetings
- Peer support meetings`,

      preferredActivities: intake.preferredActivities || `Specific hobbies and interests were not documented in the evaluation. However, during treatment, Mr. Dwayne will be encouraged to explore healthy activities such as:
- Participating in group activities
- Engaging in peer support meetings
- Learning mindfulness and relaxation techniques
- Exploring creative outlets like music or art as coping tools`,

      strengthsAbilitiesInterests: intake.strengthsAbilitiesInterests || `- Motivation: He is highly motivated to get better and wants to eliminate cravings
- Insight: He understands that he has a problem with alcohol and needs help
- Willingness: He is open to medication management and treatment
- Intelligence: He is alert, oriented, and can think clearly
- Military Background: His discipline and structure from being a Marine officer can help him follow the treatment program
- Education: He finished high school
- Communication: He communicates openly and honestly`,

      significantOthers: intake.significantOthers || `- Children: Nine children (ages and names not documented)
- Marital Status: Never married
- Current Support: No active family or friend support at this time
- Note: Building connections with peers in recovery and possibly reconnecting with family members may be part of his recovery journey`,

      // Wellness
      healthNeeds: intake.healthNeeds || `Health Needs:
- Treatment for PTSD, depression, anxiety, and insomnia
- Medication management (recommended but initially refused)
- Regular medical check-ups
- Monitoring for any medical concerns (recent spider bite)
- Management of excessive thirst (possible endocrine concern)`,

      nutritionalNeeds: intake.nutritionalNeeds || `Allergies to saline, peaches, grass, and melon
Need for healthy eating habits to support recovery`,

      culturalNeeds: intake.culturalNeeds || "As an American male and military veteran, culturally appropriate care should include veteran-specific services and peer support",

      // Allergies
      allergies: intake.allergies || "Saline, peaches, grass, and melon",

      // Crisis Intervention
      crisisInterventionPlan: intake.crisisInterventionPlan || `Triggers:
- Gun fire
- "Anything with a bum"
- Stress and emotional distress
- Loneliness and isolation
- Being in environments where alcohol is present

Warning Signs:
- Increased alcohol cravings
- Worsening depression or anxiety
- Trouble sleeping
- Intrusive thoughts about drinking or trauma
- Isolating from others
- Mood changes

Intervention Strategies:
- Contact treatment staff immediately
- Use grounding techniques and emotional regulation skills
- Call crisis hotline
- Attend extra peer support meetings
- Use safety plan
- Reach out to case manager or sponsor
- Review relapse prevention plan
- Practice coping skills learned in therapy

Emergency Contacts:
- Crisis hotline information will be provided
- Emergency contacts will be documented
- Safety plan will be reviewed and signed`,

      // Discharge Planning
      dischargePlanning: intake.dischargePlanning || `Level of Care Transition:
- Step down to ASAM Level 2.1 Intensive Outpatient Program (IOP)
- Attend IOP at least 3 days per week

Psychiatric Follow-Up:
- Outpatient medication management within 7 days of discharge
- Continue antidepressant and medication-assisted treatment as needed

Therapy:
- Weekly outpatient trauma-focused therapy
- Continue cognitive behavioral therapy (CBT) for relapse prevention

Support System:
- Attend at least 3 AA meetings per week
- Join a veteran peer-support group
- Find a sponsor before discharge if possible

Housing Plan:
- Transition to structured sober living or veteran housing program
- Follow all housing rules

Crisis Plan:
- Crisis hotline information provided
- Safety plan reviewed and signed
- Emergency contacts documented`,

      // Diagnosis
      diagnosis: intake.diagnosis || `ICD-10 Diagnosis Codes:
- F10.20: Alcohol Use Disorder, Severe
- F43.10: Post-Traumatic Stress Disorder (PTSD)
- F33.1: Major Depressive Disorder, Recurrent, Moderate
- F41.1: Generalized Anxiety Disorder
- F51.01: Primary Insomnia`,

      treatmentRecommendation: intake.treatmentRecommendation || `Recommended Level of Care:
ASAM Level 3.1 - Clinically Managed Low-Intensity Residential Services (Behavioral Health Residential Facility)

Reason for This Level of Care:
- Mr. Dwayne has a long history of severe alcohol use disorder spanning over 40 years
- He has been unable to maintain sobriety on his own (longest sobriety was 6 weeks)
- He has co-occurring mental health conditions (PTSD, depression, anxiety, insomnia)
- He is homeless and has no stable support system
- He has high relapse risk due to cravings, untreated trauma, and unstable environment
- He needs a structured therapeutic environment to stabilize

Recommended Services:

Substance Use Treatment:
- Daily participation in structured residential programming (at least 5 days per week, 3+ hours per day)
- Trauma-informed substance use counseling
- Education about how alcohol affects the brain
- Identifying triggers related to military trauma and loneliness
- Weekly monitoring of craving levels
- Random alcohol and drug testing
- Relapse prevention planning

Mental Health Treatment:
- Psychiatric medication management (recommended medications include Vistaril for anxiety, Sertraline for mood, Naltrexone for cravings, Prazosin for PTSD, and Trazodone for insomnia - client initially refused)
- Weekly individual therapy using CBT and motivational interviewing
- Weekly trauma-focused therapy
- Grounding techniques and emotional regulation training
- Sleep hygiene education
- Mindfulness-based stress reduction exercises
- Ongoing suicide risk monitoring (currently low risk)

Case Management:
- Intensive case management
- Referral to VA services for PTSD support and housing assistance
- Vocational readiness assessment
- Community resource connections
- Help building a sober support network before discharge

Support Services:
- At least 3 peer-support meetings per week (AA or Veteran Recovery Group)
- Weekly meetings with case manager for housing applications
- Exploration of VA benefits within 30 days`,

      // Risk Assessment
      suicideHistory: intake.suicideHistory || "Denies any history of suicide attempts",
      currentSuicideIdeation: intake.currentSuicideIdeation ?? false,
      historySelfHarm: intake.historySelfHarm ?? false,
      historyHarmingOthers: intake.historyHarmingOthers ?? false,
      homicidalIdeation: intake.homicidalIdeation ?? false,
    },
  });

  console.log("\nIntake updated successfully!");
  console.log("Updated fields for:", updatedIntake.residentName);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
