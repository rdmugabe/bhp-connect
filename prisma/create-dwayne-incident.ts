import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDwayneIncident() {
  const facilityId = "cmlv1gi3300087obts0c35wqi";
  const intakeId = "cmme6m2st00025n8ov5hs3wlp";

  // Get the next report number
  const lastReport = await prisma.incidentReport.findFirst({
    where: { facilityId },
    orderBy: { reportNumber: "desc" },
  });

  let reportNumber = "IR-2026-0001";
  if (lastReport?.reportNumber) {
    const lastNum = parseInt(lastReport.reportNumber.split("-")[2] || "0");
    reportNumber = `IR-2026-${String(lastNum + 1).padStart(4, "0")}`;
  }

  // Find BHRF user for submittedBy
  const bhrfUser = await prisma.user.findFirst({
    where: { role: "BHRF" },
  });

  const incidentReport = await prisma.incidentReport.create({
    data: {
      facilityId,
      intakeId,
      reportNumber,

      // Incident Information
      incidentDate: new Date("2026-03-29"),
      incidentTime: "19:30",
      incidentLocation: "Facility premises - resident left without authorization",
      reportDate: new Date("2026-03-30"),
      reportCompletedBy: "Richard Mugabe",
      reporterTitle: "BHT",

      // Resident Information
      residentName: "Dwayne Anthony Hardrick Hunt Sr.",
      residentDOB: new Date("1964-01-24"),
      residentAdmissionDate: new Date("2026-03-09"),
      residentAhcccsId: "A43560437",

      // Incident Types
      incidentTypes: ["ELOPEMENT"],
      otherIncidentType: "",

      // Incident Description
      incidentDescription: `On Sunday, March 29, 2026, at approximately 7:30 PM, Mr. Dwayne Anthony Hardrick Hunt Sr. eloped from the facility without supervision or staff accompaniment.

Staff discovered Mr. Dwayne's absence during evening rounds. Upon investigation, it was determined that Mr. Dwayne had left the facility grounds without notifying staff or obtaining permission.

Mr. Dwayne did not return by the facility curfew. Staff attempted to contact him via phone but were unable to reach him.

The following day, Monday, March 30, 2026, at approximately 11:00 AM, Mr. Dwayne returned to the facility on his own. He was apologetic and explained the circumstances of his absence.

Mr. Dwayne stated that he left to help another resident who had been recently discharged from the facility, with whom he had developed a close friendship. He reported that he "got stuck" during his attempt to assist and his phone died, preventing him from contacting the facility or returning by curfew.

Upon his return, Mr. Dwayne expressed that he was unable to help his intended friend as planned and decided to return to the facility. He appeared remorseful and acknowledged that he should have notified staff before leaving.`,

      // Persons Involved
      residentsInvolved: [
        {
          name: "Dwayne Anthony Hardrick Hunt Sr.",
          dob: "1964-01-24",
          roleInIncident: "Resident who eloped from facility",
        },
      ],
      staffInvolved: [
        {
          name: "Richard Mugabe",
          title: "BHT",
          roleInIncident: "Staff on duty who discovered absence and documented return",
        },
      ],
      witnesses: [],

      // Injuries
      anyInjuries: false,
      injuryDescription: "",
      medicalAttentionRequired: false,
      treatmentProvided: "",
      was911Called: false,
      wasTransportedToHospital: false,
      hospitalName: "",

      // Interventions
      interventionsUsed: ["VERBAL_REDIRECTION", "CRISIS_INTERVENTION", "OTHER"],
      otherIntervention: "1:1 discussion upon return, review of facility rules and safety concerns",
      actionsDescription: `1. Staff discovered Mr. Dwayne's absence during evening rounds at approximately 8:00 PM
2. Staff searched facility premises to confirm resident was not on grounds
3. Staff attempted to contact Mr. Dwayne via phone - no answer, phone appeared to be off
4. Emergency contact (sister Micky Hunt) was notified of the elopement
5. BHP (Dr. Chris Azode) was notified of the incident
6. Upon Mr. Dwayne's return at 11:00 AM on 3/30/2026:
   - Staff conducted wellness check - resident was physically unharmed
   - 1:1 discussion held regarding the incident
   - Resident expressed remorse and explained circumstances
   - Facility rules and safety concerns were reviewed
   - Treatment team was notified of resident's return`,

      // Notifications
      notifications: [
        {
          personEntity: "Emergency Contact",
          name: "Micky Hunt (Sister)",
          dateTime: "2026-03-29T20:30",
          method: "Phone",
          notifiedBy: "Richard Mugabe",
        },
        {
          personEntity: "BHP",
          name: "Dr. Chris Azode",
          dateTime: "2026-03-29T20:45",
          method: "Phone",
          notifiedBy: "Richard Mugabe",
        },
      ],

      // Resident Condition
      residentConditionBeforeIncident: "Mr. Dwayne was in stable condition prior to the incident. He had been participating in treatment programming and was engaged with peers. No observable warning signs of elopement risk were noted earlier in the day.",

      // Resident Status Post-Incident
      residentCurrentCondition: "Upon return, Mr. Dwayne appeared physically unharmed and in stable condition. He was alert, oriented, and cooperative. He denied any injuries, substance use, or safety concerns during his time away from the facility. He expressed remorse for leaving without permission and stated he understood the seriousness of his actions.",
      residentStatement: `"I left to help a friend who got discharged. We had gotten close and he needed help. I got stuck and my phone died so I couldn't call. I couldn't help him like I wanted to, so I decided to come back. I'm sorry for leaving without telling anyone. I'm okay."`,
      currentSupervisionLevel: "Increased",
      otherSupervisionLevel: "",

      // Follow-Up Required
      followUpRequired: [
        "INCREASED_SUPERVISION",
        "INCIDENT_REVIEW",
        "TREATMENT_PLAN_UPDATE",
        "PHYSICIAN_NOTIFICATION",
      ],
      otherFollowUp: "Review elopement risk factors and update safety plan",
      followUpActionsTimeline: `1. Increased supervision implemented immediately upon return
2. Treatment team meeting scheduled to review incident and update treatment plan
3. 1:1 session with therapist to process incident and underlying motivations
4. Review and update of safety/crisis plan
5. Discussion of appropriate ways to maintain peer connections post-discharge
6. Assessment of elopement risk factors and implementation of preventive measures
7. Consideration of whether continued residential treatment is appropriate`,

      // Signatures
      staffSignatureName: "Richard Mugabe",
      staffSignatureDate: new Date("2026-03-30"),
      adminSignatureName: "Richard Mugabe",
      adminSignatureDate: new Date("2026-03-30"),
      bhpSignatureName: "Dr. Chris Azode, DNP, PMHNP-BC, MBA",
      bhpSignatureDate: new Date("2026-03-30"),

      // Workflow
      status: "APPROVED",
      submittedAt: new Date("2026-03-30"),
      submittedBy: bhrfUser?.id || "system",
    },
  });

  console.log("Created incident report for Dwayne Hunt:");
  console.log("- Report ID:", incidentReport.id);
  console.log("- Report Number:", incidentReport.reportNumber);
  console.log("- Incident Date:", incidentReport.incidentDate);
  console.log("- Incident Type:", incidentReport.incidentTypes);
  console.log("- Status:", incidentReport.status);
}

createDwayneIncident()
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
