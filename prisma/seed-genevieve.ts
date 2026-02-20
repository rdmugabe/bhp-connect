import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create BHP user (Richard Mugabe)
  const bhpEmail = "richard@lucid.com";
  const bhpPassword = "Lucid123!";

  let bhpUser = await prisma.user.findUnique({ where: { email: bhpEmail } });

  if (!bhpUser) {
    const passwordHash = await bcrypt.hash(bhpPassword, 12);
    bhpUser = await prisma.user.create({
      data: {
        email: bhpEmail,
        passwordHash,
        name: "Richard Mugabe",
        role: "BHP",
        approvalStatus: "APPROVED",
        approvedAt: new Date(),
      },
    });
    console.log("BHP user created:", bhpEmail);
  }

  // Create BHP profile
  let bhpProfile = await prisma.bHPProfile.findUnique({ where: { userId: bhpUser.id } });
  if (!bhpProfile) {
    bhpProfile = await prisma.bHPProfile.create({
      data: {
        userId: bhpUser.id,
        phone: "6025551234",
        address: "Phoenix, AZ",
      },
    });
    console.log("BHP profile created");
  }

  // Create Facility
  let facility = await prisma.facility.findFirst({ where: { name: "Lucid Behavioral Health" } });
  if (!facility) {
    facility = await prisma.facility.create({
      data: {
        name: "Lucid Behavioral Health",
        address: "Phoenix, AZ",
        phone: "6025551234",
        bhpId: bhpProfile.id,
      },
    });
    console.log("Facility created:", facility.name);
  }

  // Create BHRF user
  const bhrfEmail = "staff@lucid.com";
  const bhrfPassword = "Lucid123!";

  let bhrfUser = await prisma.user.findUnique({ where: { email: bhrfEmail } });

  if (!bhrfUser) {
    const passwordHash = await bcrypt.hash(bhrfPassword, 12);
    bhrfUser = await prisma.user.create({
      data: {
        email: bhrfEmail,
        passwordHash,
        name: "Lucid Staff",
        role: "BHRF",
        approvalStatus: "APPROVED",
        approvedAt: new Date(),
      },
    });
    console.log("BHRF user created:", bhrfEmail);
  }

  // Create or find BHRF profile
  let bhrfProfile = await prisma.bHRFProfile.findUnique({ where: { userId: bhrfUser.id } });
  if (!bhrfProfile) {
    // Check if facility already has a BHRF profile
    const existingFacilityProfile = await prisma.bHRFProfile.findUnique({ where: { facilityId: facility.id } });
    if (existingFacilityProfile) {
      bhrfProfile = existingFacilityProfile;
      console.log("Using existing BHRF profile for facility");
    } else {
      bhrfProfile = await prisma.bHRFProfile.create({
        data: {
          userId: bhrfUser.id,
          facilityId: facility.id,
        },
      });
      console.log("BHRF profile created");
    }
  } else {
    console.log("BHRF profile already exists");
  }

  // Check if intake already exists for Genevieve Begay
  const existingIntake = await prisma.intake.findFirst({
    where: {
      residentName: "Genevieve Begay",
      facilityId: facility.id
    }
  });

  if (existingIntake) {
    console.log("Intake already exists for Genevieve Begay, ID:", existingIntake.id);
    return;
  }

  // Create the intake for Genevieve Begay
  const intake = await prisma.intake.create({
    data: {
      facilityId: facility.id,
      status: "APPROVED",
      submittedBy: bhrfUser.id,

      // Demographics
      residentName: "Genevieve Begay",
      ssn: "1429",
      dateOfBirth: new Date("1981-04-21"),
      admissionDate: new Date("2026-02-11"),
      sex: "Female",
      sexualOrientation: "N/A",
      ethnicity: "Native American",
      language: "English",
      religion: "Non-Religious",

      // Contact Information
      patientAddress: "7515 W Odeum Ln, Phoenix AZ 85043",
      patientPhone: "6028312698",
      patientEmail: "begaygenevieve99@gmail.com",
      contactPreference: "Email",
      emergencyContactName: "None",
      emergencyContactRelationship: "None",
      emergencyContactPhone: "None",
      emergencyContactAddress: "None",
      primaryCarePhysician: "None",
      primaryCarePhysicianPhone: "None",
      caseManagerName: "None",
      caseManagerPhone: "None",

      // Insurance
      insuranceProvider: "AHCCCS",
      policyNumber: "A00213797",
      groupNumber: "None",
      ahcccsHealthPlan: "AIHP",
      hasDNR: false,
      hasAdvancedDirective: false,
      hasWill: false,
      poaLegalGuardian: "None",

      // Referral
      referralSource: "ORBIT BEHAVIORAL HEALTH & WELLNESS",
      evaluatorName: "Adebukola Aladesanmi",
      evaluatorCredentials: "DNP, PMHNP-BC",
      reasonsForReferral: `Ms. Genevieve meets ASAM Level 3.1 criteria based on the following:
• Dimension 1 (Withdrawal Potential): Currently medically stable with no acute withdrawal symptoms, but recent opioid and stimulant use places her at continued risk without monitoring.
• Dimension 2 (Biomedical Conditions): Medical concerns including iron deficiency and insomnia require monitoring but do not preclude residential treatment.
• Dimension 3 (Emotional/Behavioral Conditions): Depression, anxiety, PTSD, and emotional dysregulation interfere with recovery and require structured therapeutic support.
• Dimension 4 (Readiness to Change): Demonstrates motivation and willingness to engage in treatment and medication-assisted therapy.
• Dimension 5 (Relapse Potential): High relapse risk due to chronic addiction history, repeated relapse, poor coping skills, and impulsivity.
• Dimension 6 (Recovery Environment): Homelessness and unstable social environment make outpatient recovery unsafe and unsustainable.`,
      residentNeeds: "Ms. Genevieve needs a BHRF that can provide integrated treatment for her co-occurring substance use disorders and mental health conditions within a safe, structured environment while addressing her housing instability and helping her develop sustainable coping and life skills for long-term recovery.",
      residentExpectedLOS: "30 days",
      teamExpectedLOS: "30-90 days",
      strengthsAndLimitations: "Willingness to attend treatment\nCommunication\nHelping others",
      familyInvolved: "None",

      // Behavioral Symptoms
      reasonForServices: `Ms. Genevieve presents today requesting assistance in addressing her long-standing substance use disorders and achieving sustained sobriety. She reports a strong desire to enter a structured and supportive treatment environment to stabilize her mental health, improve her overall functioning, and rebuild her life. During today's psychiatric evaluation for potential placement in a Behavioral Health Residential Facility (BHRF), she appeared alert, oriented to person, place, time, and situation, cooperative, and appropriately engaged. She denied current suicidal or homicidal ideation.

Ms. Genevieve reports a 32-year history of alcohol use beginning at age 12, which she attributes to growing up in a toxic and unstable environment. She began using methamphetamine and fentanyl at approximately age 25 while experiencing homelessness and attempting to cope with the challenges of living on the streets. She reports previously consuming at least a six-pack of beer daily, with her last alcohol use approximately one and a half weeks ago. She also reports daily methamphetamine use, typically smoking approximately $40 worth per day, with last use occurring yesterday. Additionally, she reports smoking approximately $10 worth of fentanyl daily, with last use three days ago.`,
      currentBehavioralSymptoms: "ROSS,\nAnxiety\nDepression",
      copingWithSymptoms: "Walking a lot and watching movies",
      symptomsLimitations: "Symptoms impact motivation for looking or keeping a job for an extended period of time\nSymptoms also impact the quality or length of relationship in her life",
      immediateUrgentNeeds: "None",
      signsOfImprovement: "Resident has stopped using\nResident feels good about herself\nResident has better skills for coping mechanisms\nResident shows improved relationships with family and friends",
      assistanceExpectations: "Stops using\nhas more motivation for work and activities",
      involvedInTreatment: "None",

      // Medical
      allergies: "Seasonal weather changes",
      historyNonCompliance: false,
      potentialViolence: false,
      medicalUrgency: "Low",
      personalMedicalHX: "1. Head injury & surgery",
      familyMedicalHX: "None",
      height: "5'2",
      weight: "125",
      bmi: "22.9",

      // Psychiatric
      isCOT: false,
      personalPsychHX: `Diagnosed Conditions:
- Depression (rates at 7/10 at worst)
- Anxiety (rates at 10/10 at worst)
- Post-Traumatic Stress Disorder (PTSD)
- Insomnia

Psychiatric Treatment History:
- Hospitalized approximately 6 months ago for detox
- Attended rehab 4 times in Phoenix (completed 1 out of 4 programs)
- Prior admission to a psychiatric facility for detoxification

Symptoms Reported:
- Depression: guilt, difficulty concentrating, lack of motivation, hopelessness, worthlessness
- Anxiety: fearfulness, worry, muscle tension, fatigue, restlessness, irritability, sleep disturbances
- PTSD: symptoms related to exposure to traumatic events
- History of physical abuse

Denies:
- Bipolar disorder symptoms
- Psychosis/hallucinations
- OCD
- Borderline Personality Disorder traits
- Suicidal attempts (though assessed as high risk without supervision)`,
      familyPsychHX: "Family has known problems with alcohol",

      // Risk Assessment - DTS
      suicideHistory: "Denies any suicidal history",
      suicideAttemptDetails: "Denies any suicidal attempts",
      currentSuicideIdeation: false,
      suicideIdeationDetails: null,
      mostRecentSuicideIdeation: "Denies any recent suicidal ideation",
      historySelfHarm: false,
      selfHarmDetails: null,
      dtsRiskFactors: { substanceUse: true },
      dtsProtectiveFactors: { copingSkills: true, reasonsForLiving: true, engagedInTreatment: true },

      // Risk Assessment - DTO
      historyHarmingOthers: false,
      harmingOthersDetails: null,
      homicidalIdeation: false,
      homicidalIdeationDetails: null,
      dtoRiskFactors: { stressors: true, substanceUse: true },
      dutyToWarnCompleted: false,
      dutyToWarnDetails: null,
      previousHospitalizations: "Hospitalized approximately 6 months ago for detox",
      hospitalizationDetails: "Reports a bad experience and near Overdose",

      // Developmental
      inUteroExposure: false,
      inUteroExposureDetails: null,
      developmentalMilestones: "Met",
      developmentalDetails: "None reported",
      speechDifficulties: false,
      speechDetails: null,
      visualImpairment: true,
      visualDetails: null,
      hearingImpairment: false,
      hearingDetails: null,
      motorSkillsImpairment: false,
      motorSkillsDetails: null,
      cognitiveImpairment: false,
      cognitiveDetails: null,
      socialSkillsDeficits: false,
      socialSkillsDetails: null,
      immunizationStatus: "Current",

      // Skills
      hygieneSkills: {
        bathing: "Independent",
        dressing: "Independent",
        grooming: "Independent",
        oralCare: "Independent",
        toileting: "Independent",
      },
      skillsContinuation: {
        money: "Independent",
        laundry: "Moderate Assist",
        mealPrep: "Moderate Assist",
        medication: "Dependent",
        housekeeping: "Moderate Assist",
        communication: "Independent",
        transportation: "Moderate Assist",
      },

      // PHQ-9
      phq9Responses: [2, 2, 1, 3, 1, 2, 3, 0, 0],
      phq9TotalScore: 14,

      // Treatment
      treatmentObjectives: `1. Client will maintain abstinence from fentanyl, methamphetamine, and alcohol as evidenced by negative drug screens throughout residential treatment.
2. Client will engage in medication-assisted treatment (MAT) by taking Suboxone as prescribed and attending all medication management appointments.
3. Client will identify at least 5 personal relapse triggers (e.g., stress, habit, emotional dysregulation) and develop 2-3 coping strategies for each trigger within 30 days.
4. Client will complete residential substance use treatment programming and attend at least 90% of scheduled individual and group therapy sessions.
5. Client will report a reduction in anxiety symptoms from 10/10 to 6/10 or below within 30 days through medication management and coping skill development.
6. Client will report a reduction in depression symptoms from 7/10 to 4/10 or below within 30 days as measured by self-report and clinical observation.
7. Client will work with case management to secure stable housing
8. Client will learn and demonstrate at least 3 healthy coping skills (e.g., grounding techniques, deep breathing, distress tolerance) to manage cravings and emotional distress.`,
      dischargePlanObjectives: `Client will be appropriate for discharge when she has:
- Completed residential programming requirements
- Achieved initial stabilization of mood, anxiety, and sleep symptoms
- Demonstrated use of coping skills in the milieu
- Secured confirmed housing placement
- Established continuing care appointments
- Completed relapse prevention and crisis safety plans
- Verbalized commitment to ongoing recovery`,
      supportSystem: `Based on the psychiatric evaluation, Ms. Genevieve has limited documented support systems, which is a significant concern given her high relapse risk and history of homelessness. Below is what Ms. Genevieve will need during this treatment.
- Psychiatrist/Psychiatric NP – For ongoing medication management (Suboxone, Zoloft, Trazodone, Vistaril)
- Individual Therapist – For trauma-focused therapy addressing PTSD, grief (loss of child), and physical abuse history
- Case Manager – For housing, benefits, and coordination of services
- Primary Care Provider – For iron deficiency, back pain, and general health
- MAT Provider – For Suboxone management and monitoring`,
      communityResources: `Resident doesn't report of any currently available community resources available to her. Below is what the program is planning to integrate through her program:
- Navajo cultural connections – Traditional healers, ceremonies, or cultural practices if desired
- Native American church or spiritual community
- Elders or mentors from her tribal community`,

      // Social/Education
      childhoodDescription: `Resident reported - "I just grew up I guess".
She "attributes early alcohol use to growing up in a toxic and unstable environment"`,
      abuseHistory: `"Yes, physical abuse" (no details on timing, perpetrator, or duration)`,
      familyMentalHealthHistory: "Family is known to have problem with alcohol",
      relationshipStatus: "Single",
      relationshipSatisfaction: "No satisfaction from current relationship. Resident reports unhappiness.",
      friendsDescription: "No reported social connections or friends.",
      highestEducation: "High school diploma/GED",
      specialEducation: false,
      specialEducationDetails: null,
      plan504: false,
      iep: false,
      educationDetails: "None",
      currentlyEmployed: false,
      employmentDetails: null,
      workVolunteerHistory: "-Goodwill",
      employmentBarriers: "Substance abuse\nLack of motivation\nLack of structure",

      // Legal/Substance
      criminalLegalHistory: "None",
      courtOrderedTreatment: false,
      courtOrderedDetails: null,
      otherLegalIssues: "None",
      substanceHistory: `Methamphetamine:
- Started using at age 25 (19-year history)
- Began while experiencing homelessness to cope with street life
- Smokes approximately $40 worth per day
- Last use was the day before evaluation

Fentanyl:
- Started using at age 25 (19-year history)
- Began while experiencing homelessness
- Smokes approximately $10 worth per day
- Last use was 3 days prior to evaluation`,
      drugOfChoice: "methamphetamine and fentanyl",
      longestSobriety: "Longest period of sobriety lasted approximately 12 months during pregnancy.",
      substanceTreatmentHistory: `Rehab History:
- Attended rehab 4 times in Phoenix
- Completed only 1 program

Other Treatment Settings:
- Prior admission to a psychiatric facility for detoxification (approximately 6 months ago)
- Has been in outpatient services
- Has been in a group home
- Has been in halfway house/sober living
- Did not complete most of these programs`,
      nicotineUse: true,
      nicotineDetails: null,
      substanceImpact: `Life Areas Affected:
- Activities of Daily Living
- Finances
- Housing
- Recreational Activities
- Relationships
- Self-Esteem
- Sexual Activity
- Work
- Overall impact on life, work, social activities, or family`,
      historyOfAbuse: "Physical abuse history is confirmed but not explored in depth",

      // Living/ADLs
      livingArrangements: `- Homeless for approximately 5 years
- No stable housing identified
- No specific details provided about where she is currently staying (e.g., temporary arrangements, group home)`,
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
      preferredActivities: "Walking (park or neighborhood)\nMovies\nHanging out with boyfriend",
      significantOthers: "None",
      supportLevel: "Moderate",
      typicalDay: "Genevieve would prefer to wake up at around 8AM, clean up and refreshen. Get some food for break fast and start the resident program. Do group therapy and leave the afternoon for her to talk to family, entertain and relax. Or go on walks.",
      strengthsAbilitiesInterests: "Hygiene, communication and helping others.",

      // Behavioral Observations
      appearanceAge: "Consistent with stated",
      appearanceHeight: "5'2",
      appearanceWeight: "125",
      appearanceAttire: "Appropriate",
      appearanceGrooming: "Well-groomed",
      appearanceDescription: "Seems tired, and sleepy",
      demeanorMood: "Anxious",
      demeanorAffect: "Full range",
      demeanorEyeContact: "Poor",
      demeanorCooperation: "Guarded",
      demeanorDescription: null,
      speechArticulation: "Clear",
      speechTone: "Normal",
      speechRate: "Normal",
      speechLatency: "Normal",
      speechDescription: null,
      motorGait: "Normal",
      motorPosture: "Normal",
      motorActivity: "Slowed",
      motorMannerisms: "None noted",
      motorDescription: null,
      cognitionThoughtContent: "Normal",
      cognitionThoughtProcess: "Circumstantial",
      cognitionDelusions: "None",
      cognitionPerception: "Normal",
      cognitionJudgment: "Fair",
      cognitionImpulseControl: "Fair",
      cognitionInsight: "Good",
      cognitionDescription: "Normal",
      estimatedIntelligence: "Average",

      // Diagnosis
      diagnosis: `ICD-10 Diagnosis Codes:
• F11.20 — Opioid Use Disorder, severe (fentanyl)
• F15.20 — Stimulant Use Disorder, severe (methamphetamine)
• F10.20 — Alcohol Use Disorder, severe
• F33.1 — Major Depressive Disorder, recurrent, moderate
• F41.1 — Generalized Anxiety Disorder
• F43.10 — Post-Traumatic Stress Disorder
• F51.01 — Insomnia Disorder`,
      treatmentRecommendation: "The evaluation recommends BHRF placement at ASAM Level 3.1 with integrated treatment for her substance use disorders and co-occurring mental health conditions, supported by MAT (Suboxone), psychiatric medications, individual and group therapy, and case management for housing and vocational needs.",

      // Wellness
      healthNeeds: `Physical Health:
- Iron deficiency – requires monitoring and treatment
- Chronic back pain (4/10) – requires pain management
- Insomnia – sleep disturbances affecting daily functioning
- Withdrawal monitoring – recent substance use with history of significant withdrawal symptoms

Mental/Behavioral Health:
- Major Depressive Disorder (recurrent, moderate) – 7/10 severity at worst
- Generalized Anxiety Disorder – 10/10 severity at worst
- Post-Traumatic Stress Disorder (PTSD) – related to trauma and physical abuse
- Insomnia Disorder
- Emotional dysregulation
- Impulsivity and poor impulse control

Substance Use Disorders:
- Opioid Use Disorder, severe (fentanyl)
- Stimulant Use Disorder, severe (methamphetamine)
- Alcohol Use Disorder, severe

Medication Needs:
- Suboxone 2mg SL BID (opioid dependence)
- Zoloft 25mg PO daily (mood)
- Trazodone 50mg PO QHS PRN (insomnia)
- Vistaril 50mg PO Q6hrs PRN (anxiety)
- Vitamin C 500mg PO daily

Safety:
- High suicide risk if unsupervised in community
- Requires structured, supervised environment`,
      nutritionalNeeds: `- Iron deficiency – may indicate poor nutrition or dietary deficits
- No eating disorder noted
- Regular meal schedule to support recovery and medication effectiveness
- Hydration needs`,
      spiritualNeeds: `- Connection to traditional Navajo spiritual practices
- Connection to a chaplain or spiritual advisor`,
      culturalNeeds: "Connection to Navajo culture, traditions, and language",
      educationHistory: "- Reported GED level",
      vocationalHistory: "- Goodwill volunteer/employee",

      // Crisis/Discharge
      feedbackFrequency: "Weekly",
      dischargePlanning: `Upon completion of residential treatment, Ms. Genevieve will transition to a lower level of care with the following supports:
- Step-down to Intensive Outpatient Program or outpatient substance use treatment
- Continued medication management and psychiatric follow-up
- Continuation of medication assisted treatment services if needed/prescribed
- Referral to sober living or transitional housing if independent housing is not secured
- Ongoing individual and group counseling participation
- Connection to community support groups such as AA, NA, or culturally appropriate recovery groups
- Case management support for employment, housing, and benefits coordination`,
    },
  });

  console.log("Intake created for Genevieve Begay, ID:", intake.id);
  console.log("\n--- Login Credentials ---");
  console.log("BHP User: richard@lucid.com / Lucid123!");
  console.log("BHRF User: staff@lucid.com / Lucid123!");
  console.log("Admin User: admin@bhpconnect.com / Admin123!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
