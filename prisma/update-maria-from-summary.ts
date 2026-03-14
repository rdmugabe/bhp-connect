import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateMariaIntakeFromSummary() {
  const intakeId = "cmmnwg9aq0004cr0e9j8nxq6z";

  // Data extracted from Maria Hernandez - Comprehensive Assessment Summary.md
  const updateData = {
    // Demographics from summary
    evaluatorName: "Adebukola Aladesanmi",
    evaluatorCredentials: "DNP, PMHNP-BC",
    ethnicity: "Gila River Native American",
    nativeAmericanTribe: "Gila River",

    // Section 1: Reasons for Referral
    reasonsForReferral: `Ms. Maria is being referred for placement in a Behavioral Health Residential Facility (BHRF) because she struggles with alcohol addiction and methamphetamine addiction. She also needs help with depression, anxiety, and finding stable housing. She has been using alcohol and methamphetamine for about 30 years and recently became homeless, which has made her feel unsafe. She needs a structured and supportive place where she can focus on getting better.`,

    // Section 2: Resident Needs
    residentNeeds: `Ms. Maria needs:
- A safe and stable place to live
- Treatment for her alcohol and methamphetamine addiction
- Help with her depression and anxiety symptoms
- Support to stop seeing and hearing things that are not there (hallucinations)
- Help learning better ways to handle stress and emotions
- Case management to find permanent housing
- Help building a daily routine that supports recovery`,

    // Section 3: Strengths and Limitations
    strengthsAndLimitations: `**Strengths:**
- Ms. Maria is strongly motivated to get better and achieve sobriety
- She understands that her substance use has hurt her life
- She completed a residential treatment program successfully about 3 years ago
- She stayed sober for 12 months when she was pregnant with one of her children
- She is alert, cooperative, and willing to participate in treatment
- Her thinking is clear and logical
- She is open to taking medications and joining structured programs

**Limitations:**
- She has limited coping skills for handling stress and emotions
- She has a long history of relapse (going back to using substances)
- She acts on impulse, especially when she is upset or around substances
- She currently has no stable place to live
- She has limited social support
- Her judgment is affected by her ongoing substance use`,

    // Section 4: Why Seeking Services
    reasonForServices: `Ms. Maria is seeking help now because she has become homeless and feels scared for her safety. She was staying with a friend but was recently asked to leave. Her substance use has gotten worse and has become a daily habit. She feels worried and overwhelmed. These difficult circumstances made her realize she needs professional help to get her life back on track.`,

    // Section 5: Current Behavioral Health Symptoms
    currentBehavioralSymptoms: `**Anxiety:**
- She feels anxious, fearful, and worried
- She has muscle tension and feels tired and restless
- She feels irritable and has trouble sleeping
- She rated her anxiety as 3 out of 10 at its worst

**Depression:**
- She feels guilty, hopeless, and worthless
- She has trouble concentrating and lacks motivation
- She rated her depression as 2 out of 10 at its worst

**Psychosis/Hallucinations:**
- She sometimes sees and hears things that are not real
- These happen more often when she uses substances heavily

**PTSD Symptoms:**
- She has been exposed to traumatic events
- She has unwanted thoughts and memories (flashbacks)
- She has trouble sleeping
- She feels on edge (hyperarousal)
- She has nightmares

**Borderline Personality Features:**
- She acts impulsively and takes risks, like unsafe sex, spending too much money, or using drugs
- She sometimes sabotages good things in her life

**Mood:**
- She describes her mood as "worried and overwhelmed"`,

    // Section 6: Coping Strategies
    copingWithSymptoms: `Ms. Maria has limited coping strategies. When she feels emotional distress or is around substances, she tends to act on impulse and relapse. She has not been able to manage her triggers effectively on her own, which is why she has relapsed many times. Her lack of good coping skills is one of the main reasons she needs structured treatment and support.`,

    // Section 7: How Symptoms Affect Daily Life
    symptomsLimitations: `Ms. Maria's symptoms affect almost every part of her life:
- **Daily Activities:** She has trouble taking care of herself and doing regular tasks
- **Housing:** She is homeless and cannot maintain stable housing
- **Finances:** Her substance use and instability have hurt her finances
- **Work:** She last worked about a year ago
- **Relationships:** Her substance use has damaged her relationships
- **Self-Esteem:** She feels bad about herself
- **Recreational Activities:** She cannot enjoy hobbies or activities
- **Sexual Activity:** This area of her life is affected
- **Legal History:** She has been in jail four times for trespassing, warrants, and shoplifting (no current probation)`,

    // Section 8: Immediate Safety Concerns
    immediateUrgentNeeds: `Ms. Maria denies any thoughts of hurting herself or others. She agreed to stay safe. However, there are some concerns:
- She is homeless, which puts her at risk
- She recently used substances (two days before her evaluation)
- She has a history of impulsive behavior
- She needs to be monitored for possible withdrawal symptoms because of her long history of substance use

She does not have severe withdrawal symptoms right now and has no history of withdrawal seizures.`,

    // Section 9: Signs of Improvement
    signsOfImprovement: `Improvement for Ms. Maria would include:
- Staying sober from alcohol and methamphetamine
- Reduced symptoms of depression and anxiety
- No more hallucinations (seeing or hearing things that are not real)
- Better control over impulses
- Learning and using healthy coping skills
- Having stable housing
- Following a structured daily routine
- Better relationships with others
- Being able to work or do productive activities
- Successfully moving to a lower level of care (like outpatient treatment)`,

    // Section 10: Who Else Is Involved
    involvedInTreatment: `Currently, Ms. Maria's treatment involves:
- **Psychiatric Provider:** Adebukola Aladesanmi, DNP, PMHNP-BC (for evaluation and medication recommendations)
- **Case Management:** To help with housing and benefits
- **Future Treatment Team:** Once admitted to the BHRF, she will work with therapists, counselors, and peer support staff`,

    // Section 11: Personal Psychiatric History
    personalPsychHX: `Ms. Maria has a history of:
- Depression
- Anxiety
- One prior admission to a Behavioral Health Residential Facility about 3 years ago (she completed the program successfully)
- One prior detoxification episode about 3 years ago

She has never been on psychiatric medications before. She has not attended outpatient psychiatric services in the past.`,

    // Section 12: Family Psychiatric History
    familyPsychHX: `Ms. Maria reports that her entire family uses drugs and alcohol. This suggests a strong family history of substance use disorders. Her family also has a medical history of diabetes and high blood pressure.`,

    // Section 13: Previous Hospitalizations
    previousHospitalizations: `Ms. Maria denies any previous psychiatric hospitalizations. She has not had any emergency department visits for mental health or detox.`,

    // Section 15: Treatment Objectives
    treatmentObjectives: `**Goal 1: Achieve and Maintain Sobriety**
- Stay completely sober from alcohol and methamphetamine during treatment
- Identify at least three things that trigger relapse and learn ways to cope within 30 days
- Attend daily therapeutic groups and recovery meetings

**Goal 2: Stabilize Mental Health Symptoms**
- Learn to recognize symptoms of depression and anxiety and develop coping strategies
- Attend weekly individual therapy sessions
- Show improved emotional control within 60 days

**Goal 3: Improve Life Stability and Recovery Environment**
- Work with case management to create a plan for stable housing
- Find helpful resources and community services
- Develop a structured daily routine that supports long-term recovery`,

    // Section 16: Discharge Criteria
    dischargePlanObjectives: `Ms. Maria will be ready for discharge when she:
- Has maintained sobriety throughout her residential stay
- Has learned and uses healthy coping skills
- Has stable mental health symptoms
- Has a plan for housing or has been placed in housing
- Can follow a structured daily routine
- Is ready to step down to a lower level of care

**After Discharge:**
- Step down to Intensive Outpatient Program (IOP) - ASAM Level 2.1
- Continue seeing a psychiatrist for medication management
- Attend individual therapy and relapse prevention counseling
- Join community recovery groups like AA or NA
- Get help finding permanent housing and social services
- Build a long-term support network for recovery`,

    // Section 17 & 22: Support System
    supportSystem: `Ms. Maria has limited social support. She:
- Has never been married
- Is the mother of six children
- Was raised by both biological parents alongside eight siblings
- Was staying with a friend but was recently asked to leave
- Currently has no stable housing or strong support network

Building a support system will be an important part of her recovery.`,

    // Section 18: Community Resources
    communityResources: `Available resources for Ms. Maria include:
- Alcoholics Anonymous (AA)
- Narcotics Anonymous (NA)
- Intensive Outpatient Program (IOP) for step-down care
- Case management for housing, benefits, and community resources
- Life skills training programs
- Peer support services
- Permanent housing assistance and social services
- Community recovery support groups`,

    // Section 19: Childhood
    childhoodDescription: `Ms. Maria is a 46-year-old Gila River Native American female. She was raised by her biological parents alongside eight siblings. She met all her developmental milestones as a child. She completed school up to the 9th grade. She started using alcohol and methamphetamine at around age 15, which she says was because of peer pressure during her teenage years.`,

    // Section 20 & 25: Abuse/Trauma History
    abuseHistory: `Ms. Maria reports symptoms of PTSD, including:
- Exposure to traumatic events
- Intrusive thoughts and memories (flashbacks)
- Sleep disturbances
- Hyperarousal (feeling on edge)
- Nightmares

The documentation indicates "No" for sexual/physical abuse. However, her PTSD symptoms suggest she has experienced trauma that still affects her today. The specific nature of the trauma is not detailed in the records.`,

    // Section 21: Family Mental Health History
    familyMentalHealthHistory: `Ms. Maria reports that her entire family uses drugs and alcohol. This indicates a significant family history of substance use disorders. Family medical history includes diabetes and high blood pressure.`,

    // Family Medical History
    familyMedicalHX: `Family history includes diabetes and high blood pressure.`,

    // Section 22: Friends
    friendsDescription: `Ms. Maria currently has limited friendships and social support. She was recently asked to leave a friend's home where she was staying. She has been homeless for about one month. Building healthy friendships and a support network will be an important focus during treatment.`,

    // Section 23: Substance Use History
    substanceHistory: `Ms. Maria has a 30-year history of substance use:
- **Methamphetamine:** Started using at age 15; last use was two days before her evaluation
- **Alcohol:** Started using at age 15; last use was two days before her evaluation

She uses both substances frequently, often daily. She has difficulty saying exactly how much she uses. She started using because of peer influence as a teenager. Her substance use has gotten worse over time.

Her longest period of sobriety was about 12 months, which happened while she was pregnant with one of her children. She completed a detox program about 3 years ago and also finished a residential treatment program successfully at that time.`,

    drugOfChoice: "Methamphetamine, Alcohol",
    longestSobriety: "12 months (during pregnancy)",
    substanceTreatmentHistory: `She completed a detox program about 3 years ago and also finished a residential treatment program successfully at that time.`,

    // Section 24: Substance Impact
    substanceImpact: `Ms. Maria's substance use has affected many areas of her life:
- **Relationships:** Damaged connections with family and others
- **Work:** She last worked about a year ago
- **Health:** Physical and psychological stress from chronic substance use
- **Legal Status:** She has been in jail four times for trespassing, warrants, and shoplifting (no current probation)
- **Housing:** She is currently homeless
- **Finances:** Financial instability
- **Mental Health:** Worsening depression, anxiety, and hallucinations
- **Self-Esteem:** Feeling bad about herself
- **Daily Activities:** Trouble taking care of herself and managing daily tasks`,

    // Section 26: Typical Day
    typicalDay: `Ms. Maria currently does not have a structured daily routine. She is homeless and has been living an unstable lifestyle connected to her substance use. Developing a structured daily routine will be an important goal during her treatment to support long-term recovery.`,

    // Section 27: Preferred Activities
    preferredActivities: `The documents do not list specific hobbies or preferred activities. This information will need to be gathered during treatment to help build a meaningful recovery plan.`,

    // Section 28: Strengths
    strengthsAbilitiesInterests: `Ms. Maria has several strengths that can help her recovery:
- Strong motivation to get better and achieve sobriety
- Previous success completing a residential treatment program
- Ability to stay sober for 12 months (during pregnancy)
- Fair insight into how her substance use has hurt her life
- Alert mind and logical thinking
- Willingness to participate in treatment and take medications
- Cooperative attitude`,

    // Section 29: Significant Others
    significantOthers: `- **Children:** Ms. Maria is the mother of six children
- **Siblings:** She has eight siblings
- **Parents:** She was raised by both biological parents
- **Marital Status:** She has never been married
- **Recent Living Situation:** She was staying with a friend who asked her to leave`,

    // Section 30: Wellness Needs
    healthNeeds: `- She wears glasses for vision problems
- Family history of diabetes and high blood pressure (she should be monitored)
- No known medication or food allergies (NKDA)
- No current medications
- No eating disorders`,

    nutritionalNeeds: `Proper nutrition should be provided as part of residential treatment.`,

    spiritualNeeds: `Ms. Maria is a Gila River Native American; culturally appropriate services may be beneficial.`,

    culturalNeeds: `Respect for her Native American heritage and cultural practices should be considered in treatment planning.`,

    // Allergies
    allergies: "NKDA (No Known Drug Allergies)",

    // Visual impairment
    visualImpairment: true,
    visualDetails: "She wears glasses for vision problems",

    // Section 31: Crisis Intervention Plan
    crisisInterventionPlan: `**Triggers:**
- Being around substances ("being around it")
- Emotional distress
- Impulsivity
- Environmental stressors

**Warning Signs:**
- Increased anxiety or depression symptoms
- Feeling overwhelmed
- Difficulty controlling impulses
- Seeing or hearing things that are not real (hallucinations), especially during heavy substance use

**Intervention Strategies:**
- Structured residential treatment with 24-hour monitoring
- Daily therapeutic groups and recovery meetings
- Individual therapy sessions
- Substance use counseling and relapse prevention therapy
- Learning healthy coping skills
- Medication management (if the client agrees)
- Case management support

**Safety:**
- Ms. Maria denies suicidal and homicidal thoughts
- She has agreed to maintain safety
- Staff should monitor for withdrawal symptoms and emotional crises`,

    // Risk Assessment
    currentSuicideIdeation: false,
    homicidalIdeation: false,
    suicideHistory: "Ms. Maria denies any thoughts of hurting herself or others. She agreed to stay safe.",

    // Section 32: Discharge Planning
    dischargePlanning: `**Considerations:**
- Ms. Maria is currently homeless and needs housing before discharge
- She has limited social support
- She has a history of relapse and will need ongoing support
- She will need a lower level of care after residential treatment

**Discharge Goals:**
- Complete residential treatment successfully
- Have stable housing or a housing plan in place
- Connect with community recovery support groups (AA/NA)
- Transition to Intensive Outpatient Program (IOP) - ASAM Level 2.1
- Continue psychiatric medication management
- Attend individual therapy and relapse prevention counseling
- Build a long-term recovery support network`,

    // Section 33: Diagnoses
    diagnosis: `F10.20 - Alcohol Use Disorder, Severe
F15.20 - Stimulant (Methamphetamine) Use Disorder, Severe
F33.1 - Major Depressive Disorder, Recurrent, Moderate
F41.9 - Anxiety Disorder, Unspecified`,

    // Section 34: Treatment Recommendations
    treatmentRecommendation: `**Level of Care:**
ASAM Level 3.1 - Behavioral Health Residential Facility (BHRF)

**Why This Level of Care:**
Ms. Maria needs residential treatment because:
- She has severe substance use disorders with a 30-year history
- She is currently homeless and has no safe recovery environment
- She has co-occurring mental health conditions (depression, anxiety)
- She has a history of multiple relapses
- She has limited coping skills
- She needs 24-hour structure and monitoring
- Outpatient treatment alone would not be enough to meet her needs

**Recommended Services:**
- Structured residential treatment and monitoring
- Substance use counseling
- Relapse prevention therapy
- Psychiatric evaluation and medication management (Vistaril 25mg for anxiety, Naltrexone 50mg for craving, Zoloft 25mg for mood were recommended, though patient initially refused)
- Cognitive Behavioral Therapy (CBT)
- Trauma-informed counseling
- Psychoeducation about mental health and addiction
- Case management for housing, benefits, and community resources
- Life skills training
- Peer support
- Daily therapeutic groups and recovery meetings
- Weekly individual therapy sessions

**After Residential Treatment:**
- Step down to ASAM Level 2.1 Intensive Outpatient Program (IOP)
- Continued psychiatric medication management
- Individual therapy and relapse prevention counseling
- Community recovery support groups (AA/NA)
- Permanent housing placement assistance
- Long-term recovery support network development`,

    // Living Arrangements
    livingArrangements: "Homeless - was staying with a friend but was recently asked to leave. Has been homeless for about one month.",

    // Legal History
    criminalLegalHistory: "She has been in jail four times for trespassing, warrants, and shoplifting. No current probation.",
    courtOrderedTreatment: false,

    // Employment
    currentlyEmployed: false,
    employmentDetails: "She last worked about a year ago.",

    // Education
    highestEducation: "9th grade",

    // Relationship Status
    relationshipStatus: "Never married",
  };

  try {
    const updated = await prisma.intake.update({
      where: { id: intakeId },
      data: updateData,
    });

    console.log("✅ Successfully updated Maria Hernandez's intake from comprehensive summary");
    console.log("Updated fields:", Object.keys(updateData).length);
    console.log("Intake ID:", updated.id);
    console.log("Resident Name:", updated.residentName);
  } catch (error) {
    console.error("❌ Error updating intake:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMariaIntakeFromSummary();
