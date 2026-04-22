import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDwayneDischarge() {
  const intakeId = "cmme6m2st00025n8ov5hs3wlp";
  const facilityId = "cmlv1gi3300087obts0c35wqi";

  // Check if discharge summary already exists for this intake
  const existing = await prisma.dischargeSummary.findUnique({
    where: { intakeId },
  });

  if (existing) {
    console.log("Discharge summary already exists for this intake, updating...");
    const updated = await prisma.dischargeSummary.update({
      where: { intakeId },
      data: getDischargeData(intakeId, facilityId),
    });
    console.log("Updated discharge summary:", updated.id);
    return updated;
  }

  const dischargeSummary = await prisma.dischargeSummary.create({
    data: getDischargeData(intakeId, facilityId),
  });

  console.log("Created discharge summary:", dischargeSummary.id);
  return dischargeSummary;
}

function getDischargeData(intakeId: string, facilityId: string) {
  return {
    intakeId,
    facilityId,

    // Discharge Date/Time
    dischargeDate: new Date("2026-03-31"),
    dischargeStartTime: "14:30",
    dischargeEndTime: "15:00",

    // Program Info
    enrolledProgram: "Residential",
    dischargeType: "Elopement",
    recommendedLevelOfCare: "Residential Treatment",

    // Diagnoses from intake
    diagnoses: `F10.20 - Alcohol Use Disorder, Severe
F43.10 - Post-Traumatic Stress Disorder (PTSD)
F33.1 - Major Depressive Disorder, Recurrent, Moderate
F41.1 - Generalized Anxiety Disorder
F51.01 - Primary Insomnia`,

    // Allergies
    allergies: "Saline solution, Seasonal allergies and sinuses",

    // ASAM Level of Care
    asamLevelOfCare: "3.1 - Clinically Managed Low-Intensity Residential Services",

    // Presenting Issues at Admission
    presentingIssuesAtAdmission: `Mr. Dwayne Anthony Hardrick Hunt Sr. presented with severe alcohol use disorder with over 40 years of chronic heavy use, co-occurring PTSD related to military service, major depressive disorder, generalized anxiety disorder, and primary insomnia. He reported persistent alcohol cravings, difficulty maintaining sobriety independently, and had been homeless for approximately one year. He sought treatment stating, "I need help with my alcoholism; I need help getting myself right."`,

    // Treatment Summary
    treatmentSummary: `Mr. Dwayne was admitted to the residential treatment program on March 9, 2026. During his 22-day stay, he participated in the following services:

- Daily structured residential programming including group therapy sessions
- Individual therapy sessions focusing on trauma and alcohol use disorder
- Psychiatric evaluation and medication management consultation (client initially declined medications)
- Case management services to address housing and VA benefits (note: Mr. Dwayne was initially resistant to receiving case management services but eventually agreed to participate)
- Peer support meetings (AA and Veteran Recovery Groups)
- Relapse prevention education and planning
- Sleep hygiene education for insomnia management

Mr. Dwayne was engaged in treatment and showed initial progress in identifying triggers and developing coping skills. He was working with case management on housing applications and VA benefit connections. Unfortunately, on March 31, 2026, Mr. Dwayne eloped from the facility without completing his recommended treatment course. Staff were unable to locate him after discovering his absence during routine checks.`,

    // Objectives with attainment status (partial/not attained due to elopement)
    objectivesAttained: [
      {
        objective: "Stay alcohol-free throughout residential stay, demonstrated by negative random alcohol tests",
        attained: true,
      },
      {
        objective: "Reduce alcohol cravings from 8/10 to 3/10 or less within 60 days",
        attained: false,
      },
      {
        objective: "Complete a written relapse prevention plan before discharge",
        attained: false,
      },
      {
        objective: "Report 50% fewer depression and anxiety symptoms within 90 days",
        attained: false,
      },
      {
        objective: "Identify at least 5 coping skills to manage trauma-related triggers within 45 days",
        attained: true,
      },
      {
        objective: "Secure stable housing before discharge",
        attained: false,
      },
    ],

    // Objective Narratives
    objectiveNarratives: {
      objective1: "Mr. Dwayne maintained sobriety during his stay. All random alcohol tests were negative. This objective was attained.",
      objective2: "Mr. Dwayne reported some reduction in cravings during structured programming, but had not reached the target level before elopement. Unable to assess final craving levels at discharge.",
      objective3: "Relapse prevention planning was initiated but not completed due to unexpected departure. Client had begun identifying triggers and early warning signs.",
      objective4: "Insufficient time in treatment to fully assess improvement in depression and anxiety symptoms. Client was showing some initial stabilization.",
      objective5: "Mr. Dwayne successfully identified multiple coping skills during group and individual therapy including grounding techniques, deep breathing, journaling, attending meetings, and reaching out to staff when struggling.",
      objective6: "Mr. Dwayne was initially resistant to receiving case management services, which delayed progress on housing applications. Once he agreed to participate, housing applications were submitted, but stable housing had not been secured at the time of elopement. VA benefit referrals were in progress.",
    },

    // Relapse Prevention Plan
    relapsePreventionPlan: `1. Avoid environments and people associated with past drinking
2. Attend AA meetings minimum 3x per week
3. Call crisis hotline when experiencing strong cravings or urges (1-800-662-4357)
4. Use grounding techniques when triggered (5-4-3-2-1 sensory technique)
5. Practice deep breathing exercises when feeling anxious
6. Reach out to VA services for ongoing support
7. Re-engage with residential or outpatient treatment as soon as possible
8. Avoid isolation - maintain contact with supportive people
9. Recognize warning signs: increased cravings, mood changes, sleep problems, isolating
10. Have emergency contact numbers readily available`,

    // Crisis Resources
    crisisResources: `National Suicide Prevention Lifeline: 988 (24/7)
SAMHSA National Helpline: 1-800-662-4357 (24/7)
Veterans Crisis Line: 988, Press 1 (24/7)
Crisis Text Line: Text HOME to 741741
Local Crisis Line: 480-784-1500
Arizona Complete Health Crisis Line: 1-866-495-6735`,

    // Patient Education
    patientEducationProvided: `During his stay, Mr. Dwayne received education regarding:
- Alcohol use disorder and its effects on the brain and body
- PTSD and trauma-informed coping strategies
- Recognizing relapse warning signs and triggers
- Overdose prevention and risks of returning to use after a period of abstinence
- Importance of medication compliance (if choosing to start medications)
- Sleep hygiene techniques for insomnia
- Community recovery resources and VA services
- Crisis intervention and safety planning`,

    // Special Instructions
    specialInstructions: `URGENT: Mr. Dwayne left treatment via elopement and his whereabouts are currently unknown. If contact is made:

1. Strongly encourage immediate return to residential treatment or engagement with crisis services
2. Remind him that he is at HIGH RISK for relapse due to:
   - Over 40 years of alcohol use disorder
   - Homelessness and lack of stable housing
   - Limited support network
   - Co-occurring PTSD and depression
3. Provide crisis hotline numbers
4. Encourage contact with VA services for housing and mental health support
5. If he returns within 48 hours, bed may be available pending clinical assessment
6. Follow up with emergency contact (sister Micky Hunt: 317-292-0456) to attempt to locate and encourage return to treatment`,

    // Discharge Summary Narrative
    dischargeSummaryNarrative: `Dwayne Anthony Hardrick Hunt Sr., a 62-year-old Native American male and retired Marine officer, was admitted to Lucid Behavioral Health BHRF on March 9, 2026 for treatment of severe alcohol use disorder and co-occurring PTSD, major depressive disorder, generalized anxiety disorder, and primary insomnia. Mr. Dwayne had been drinking heavily since age 17 (over 40 years of use) and was homeless for approximately one year prior to admission.

During his 22-day stay, Mr. Dwayne engaged in treatment programming including group therapy, individual therapy, case management, and peer support meetings. He maintained sobriety throughout his stay with all random alcohol tests returning negative. He was working on identifying triggers related to his military trauma and developing healthier coping skills. Mr. Dwayne was initially resistant to receiving case management services, but eventually agreed to participate. Case management was then actively assisting him with housing applications and VA benefit referrals.

On March 31, 2026, Mr. Dwayne eloped from the facility without notice to staff. His absence was discovered during routine afternoon checks. Staff attempted to locate him on the premises and contacted his emergency contact. His current whereabouts are unknown.

Mr. Dwayne left treatment before completing his recommended course of care. He remains at HIGH RISK for relapse due to his lengthy history of severe alcohol use disorder, homelessness, limited support system, and untreated co-occurring mental health conditions. He was advised of the risks of leaving treatment early including increased risk of relapse, worsening mental health symptoms, and potential for medical complications from return to alcohol use after a period of abstinence.

Facility staff strongly encourage Mr. Dwayne to re-engage with treatment services as soon as possible. Crisis resources and VA contact information were previously provided during his stay.`,

    // Discharging To
    dischargingTo: "Unknown - Patient eloped from facility. Last known housing status was homeless.",

    // Personal Items
    personalItemsReceived: false,
    personalItemsStoredDays: 30,
    itemsRemainAtFacility: true,

    // Discharge Medications
    dischargeMedications: [],

    // Service Referrals
    serviceReferrals: [
      {
        service: "VA Mental Health Services",
        provider: "Phoenix VA Health Care System",
        phone: "602-277-5551",
        notes: "For PTSD treatment and mental health support",
      },
      {
        service: "VA Housing Assistance (SSVF)",
        provider: "Phoenix VA",
        phone: "1-877-4AID-VET",
        notes: "Supportive Services for Veteran Families program",
      },
      {
        service: "Outpatient Substance Use Treatment",
        provider: "AHCCCS Contracted Provider",
        notes: "IOP or outpatient SUD treatment when ready to re-engage",
      },
      {
        service: "Crisis Services",
        provider: "Veterans Crisis Line",
        phone: "988 Press 1",
        notes: "24/7 crisis support for veterans",
      },
    ],

    // Clinical Recommendations
    clinicalRecommendations: `1. URGENT: Re-engage with residential treatment or crisis stabilization immediately
2. Contact VA services for housing assistance through SSVF program
3. Resume psychiatric evaluation for medication management (recommended: Naltrexone for cravings, Sertraline for depression, Prazosin for PTSD nightmares, Trazodone for insomnia)
4. Attend AA meetings daily if not in structured treatment
5. Connect with Veterans peer support groups
6. Avoid isolation and high-risk environments
7. Establish outpatient mental health care for PTSD and depression
8. Consider Intensive Outpatient Program (IOP) if unable to return to residential
9. Complete safety planning with crisis resources
10. Follow up with primary care for medical clearance if returning to use`,

    // Cultural Preferences
    culturalPreferencesConsidered: true,

    // Suicide Prevention Education
    suicidePreventionEducation: "Mr. Dwayne was provided with suicide prevention education and crisis resources during his stay. He denied suicidal ideation throughout treatment. The Veterans Crisis Line (988, Press 1) was emphasized given his military background. Safety planning was initiated but not completed due to elopement.",

    // Meeting Participants (N/A for elopement - no discharge meeting held)
    meetingInvitees: {
      bhp: false,
      caseManager: false,
      bhtAdmin: false,
      resident: false,
      nurse: false,
    },
    meetingAttendees: {
      bhp: false,
      caseManager: false,
      bhtAdmin: false,
      resident: false,
      nurse: false,
    },

    // Signatures
    staffSignature: "Richard Mugabe",
    staffCredentials: "BHT",
    staffSignatureDate: new Date("2026-03-31"),
    reviewerSignature: "Chris Azode",
    reviewerCredentials: "DNP, MBA, PMHNP-BC",
    reviewerSignatureDate: new Date("2026-03-31"),
  };
}

createDwayneDischarge()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
