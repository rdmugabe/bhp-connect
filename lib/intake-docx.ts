/**
 * Plain, no-color .docx builder for a full intake assessment.
 *
 * Matches the layout of the facility's reference docx: Calibri 11pt, black on
 * white, two-column key-value layout for short fields, bold label-on-own-line
 * for long free-text, confidential header banner, section titles ALL CAPS.
 */

import { AlignmentType, Document, Packer, Paragraph, Table } from "docx";
import {
  checklistToString,
  confidentialBanner,
  dataTable,
  defaultDocProps,
  defaultSection,
  docSubtitle,
  docTitle,
  fmtDate,
  fmtDateLong,
  labeledBlock,
  run,
  sanitizeFilename,
  sectionHeading,
  subHeading,
  twoColumnKVTable,
} from "./plain-docx-utils";

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself",
  "Trouble concentrating",
  "Moving or speaking slowly / being fidgety",
  "Thoughts of self-harm",
];

function phq9Severity(score: number | null | undefined): string {
  if (score === null || score === undefined || !Number.isFinite(score)) return "Unknown";
  if (score <= 4) return "Minimal depression";
  if (score <= 9) return "Mild depression";
  if (score <= 14) return "Moderate depression";
  if (score <= 19) return "Moderately severe depression";
  return "Severe depression";
}

function hskey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

export interface IntakeDocxData {
  id: string;
  residentName: string;
  ssn: string | null;
  dateOfBirth: string | Date;
  admissionDate: string | Date | null;
  sex: string | null;
  ethnicity: string | null;
  nativeAmericanTribe: string | null;
  language: string | null;
  religion: string | null;
  sexualOrientation: string | null;

  patientAddress: string | null;
  patientPhone: string | null;
  patientEmail: string | null;
  contactPreference: string | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  emergencyContactAddress: string | null;
  primaryCarePhysician: string | null;
  primaryCarePhysicianPhone: string | null;
  caseManagerName: string | null;
  caseManagerPhone: string | null;

  insuranceProvider: string | null;
  policyNumber: string | null;
  groupNumber: string | null;
  ahcccsHealthPlan: string | null;
  hasDNR: boolean | null;
  hasAdvancedDirective: boolean | null;
  hasWill: boolean | null;
  poaLegalGuardian: string | null;

  referralSource: string | null;
  evaluatorName: string | null;
  evaluatorCredentials: string | null;
  reasonsForReferral: string | null;
  residentNeeds: string | null;
  residentExpectedLOS: string | null;
  teamExpectedLOS: string | null;
  strengthsAndLimitations: string | null;
  familyInvolved: string | null;

  reasonForServices: string | null;
  currentBehavioralSymptoms: string | null;
  copingWithSymptoms: string | null;
  symptomsLimitations: string | null;
  immediateUrgentNeeds: string | null;
  signsOfImprovement: string | null;
  assistanceExpectations: string | null;
  involvedInTreatment: string | null;

  allergies: string | null;
  medications: { name: string; dosage?: string | null; frequency?: string | null; route?: string | null }[] | null;
  historyNonCompliance: boolean | null;
  potentialViolence: boolean | null;
  medicalUrgency: string | null;
  personalMedicalHX: string | null;
  familyMedicalHX: string | null;
  medicalConditions: string | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;

  isCOT: boolean | null;
  personalPsychHX: string | null;
  familyPsychHX: string | null;
  treatmentPreferences: string | null;
  psychMedicationEfficacy: string | null;

  suicideHistory: string | null;
  suicideAttemptDetails: string | null;
  currentSuicideIdeation: boolean | null;
  suicideIdeationDetails: string | null;
  mostRecentSuicideIdeation: string | null;
  historySelfHarm: boolean | null;
  selfHarmDetails: string | null;
  dtsRiskFactors: Record<string, boolean> | null;
  dtsProtectiveFactors: Record<string, boolean> | null;

  historyHarmingOthers: boolean | null;
  harmingOthersDetails: string | null;
  homicidalIdeation: boolean | null;
  homicidalIdeationDetails: string | null;
  dtoRiskFactors: Record<string, boolean> | null;
  dutyToWarnCompleted: boolean | null;
  dutyToWarnDetails: string | null;
  previousHospitalizations: string | null;
  hospitalizationDetails: string | null;

  inUteroExposure: boolean | null;
  inUteroExposureDetails: string | null;
  developmentalMilestones: string | null;
  developmentalDetails: string | null;
  speechDifficulties: boolean | null;
  speechDetails: string | null;
  visualImpairment: boolean | null;
  visualDetails: string | null;
  hearingImpairment: boolean | null;
  hearingDetails: string | null;
  motorSkillsImpairment: boolean | null;
  motorSkillsDetails: string | null;
  cognitiveImpairment: boolean | null;
  cognitiveDetails: string | null;
  socialSkillsDeficits: boolean | null;
  socialSkillsDetails: string | null;
  immunizationStatus: string | null;

  hygieneSkills: Record<string, string> | null;
  skillsContinuation: Record<string, string> | null;

  phq9Responses: number[] | null;
  phq9TotalScore: number | null;

  treatmentObjectives: string | null;
  dischargePlanObjectives: string | null;
  supportSystem: string | null;
  communityResources: string | null;

  childhoodDescription: string | null;
  abuseHistory: string | null;
  familyMentalHealthHistory: string | null;
  relationshipStatus: string | null;
  relationshipSatisfaction: string | null;
  friendsDescription: string | null;
  highestEducation: string | null;
  specialEducation: boolean | null;
  specialEducationDetails: string | null;
  plan504: boolean | null;
  iep: boolean | null;
  educationDetails: string | null;
  currentlyEmployed: boolean | null;
  employmentDetails: string | null;
  workVolunteerHistory: string | null;
  employmentBarriers: string | null;

  criminalLegalHistory: string | null;
  courtOrderedTreatment: boolean | null;
  courtOrderedDetails: string | null;
  otherLegalIssues: string | null;
  substanceHistory: string | null;
  substanceUseTable: Record<string, unknown>[] | null;
  drugOfChoice: string | null;
  longestSobriety: string | null;
  substanceTreatmentHistory: string | null;
  nicotineUse: boolean | null;
  nicotineDetails: string | null;
  substanceImpact: string | null;
  historyOfAbuse: string | null;

  livingArrangements: string | null;
  sourceOfFinances: string | null;
  transportationMethod: string | null;
  adlChecklist: Record<string, string> | null;
  preferredActivities: string | null;
  significantOthers: string | null;
  supportLevel: string | null;
  typicalDay: string | null;
  strengthsAbilitiesInterests: string | null;

  appearanceAge: string | null;
  appearanceHeight: string | null;
  appearanceWeight: string | null;
  appearanceAttire: string | null;
  appearanceGrooming: string | null;
  appearanceDescription: string | null;
  demeanorMood: string | null;
  demeanorAffect: string | null;
  demeanorEyeContact: string | null;
  demeanorCooperation: string | null;
  demeanorDescription: string | null;
  speechArticulation: string | null;
  speechTone: string | null;
  speechRate: string | null;
  speechLatency: string | null;
  speechDescription: string | null;
  motorGait: string | null;
  motorPosture: string | null;
  motorActivity: string | null;
  motorMannerisms: string | null;
  motorDescription: string | null;
  cognitionThoughtContent: string | null;
  cognitionThoughtProcess: string | null;
  cognitionDelusions: string | null;
  cognitionPerception: string | null;
  cognitionJudgment: string | null;
  cognitionImpulseControl: string | null;
  cognitionInsight: string | null;
  cognitionDescription: string | null;
  estimatedIntelligence: string | null;

  diagnosis: string | null;
  treatmentRecommendation: string | null;

  healthNeeds: string | null;
  nutritionalNeeds: string | null;
  spiritualNeeds: string | null;
  culturalNeeds: string | null;

  crisisInterventionPlan: string | null;
  feedbackFrequency: string | null;
  dischargePlanning: string | null;
  signatures: Record<string, string> | null;

  status: string;
  decisionReason: string | null;
  decidedAt: string | Date | null;
  createdAt: string | Date;

  facility: { name: string; address?: string | null };
  bhpName: string;
}

export async function buildIntakeDocx(d: IntakeDocxData): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];

  // Header
  children.push(docTitle("Full Intake Assessment"));
  children.push(docSubtitle(d.facility.name));
  children.push(confidentialBanner());

  // Demographics
  children.push(sectionHeading("Demographics"));
  children.push(
    twoColumnKVTable([
      ["Full Name", d.residentName],
      ["Ethnicity", d.ethnicity],
      ["Date of Birth", fmtDateLong(d.dateOfBirth)],
      ...(d.ethnicity === "Native American" ? [["Tribe", d.nativeAmericanTribe]] as [string, string | null][] : []),
      ["SSN (Last 4)", d.ssn],
      ["Language", d.language],
      ["Sex", d.sex],
      ["Religion", d.religion],
      ["Sexual Orientation", d.sexualOrientation],
    ])
  );

  // Contact Information
  children.push(sectionHeading("Contact Information"));
  children.push(
    twoColumnKVTable([
      ["Phone", d.patientPhone],
      ["Emergency Contact", d.emergencyContactName],
      ["Email", d.patientEmail],
      ["Emergency Phone", d.emergencyContactPhone],
      ["Contact Preference", d.contactPreference],
      ["Emergency Relationship", d.emergencyContactRelationship],
      ["Primary Care Physician", d.primaryCarePhysician],
      ["Emergency Address", d.emergencyContactAddress],
      ["PCP Phone", d.primaryCarePhysicianPhone],
      ["Case Manager", d.caseManagerName],
      ["Case Manager Phone", d.caseManagerPhone],
    ])
  );
  children.push(...labeledBlock("Address", d.patientAddress));

  // Insurance
  children.push(sectionHeading("Insurance Information"));
  children.push(
    twoColumnKVTable([
      ["Provider", d.insuranceProvider],
      ["Health Plan", d.ahcccsHealthPlan],
      ["Policy Number", d.policyNumber],
      ["Group Number", d.groupNumber],
      ["Has DNR", d.hasDNR],
      ["Has Advanced Directive", d.hasAdvancedDirective],
      ["Has Will", d.hasWill],
      ["POA / Legal Guardian", d.poaLegalGuardian],
    ])
  );

  // Referral
  if (
    d.referralSource ||
    d.evaluatorName ||
    d.reasonsForReferral ||
    d.residentNeeds ||
    d.strengthsAndLimitations ||
    d.familyInvolved
  ) {
    children.push(sectionHeading("Referral Information"));
    children.push(
      twoColumnKVTable([
        ["Referral Source", d.referralSource],
        ["Evaluator Name", d.evaluatorName],
        ["Evaluator Credentials", d.evaluatorCredentials],
        ["Resident Expected LOS", d.residentExpectedLOS],
        ["Team Expected LOS", d.teamExpectedLOS],
      ])
    );
    children.push(...labeledBlock("Reasons for Referral", d.reasonsForReferral));
    children.push(...labeledBlock("Resident Needs", d.residentNeeds));
    children.push(...labeledBlock("Strengths and Limitations", d.strengthsAndLimitations));
    children.push(...labeledBlock("Family Involved", d.familyInvolved));
  }

  // Behavioral Symptoms
  if (
    d.reasonForServices ||
    d.currentBehavioralSymptoms ||
    d.copingWithSymptoms ||
    d.symptomsLimitations ||
    d.immediateUrgentNeeds ||
    d.signsOfImprovement ||
    d.assistanceExpectations ||
    d.involvedInTreatment
  ) {
    children.push(sectionHeading("Behavioral Symptoms"));
    children.push(...labeledBlock("Reason for Services", d.reasonForServices));
    children.push(...labeledBlock("Current Behavioral Symptoms", d.currentBehavioralSymptoms));
    children.push(...labeledBlock("Coping With Symptoms", d.copingWithSymptoms));
    children.push(...labeledBlock("Symptom Limitations", d.symptomsLimitations));
    children.push(...labeledBlock("Immediate / Urgent Needs", d.immediateUrgentNeeds));
    children.push(...labeledBlock("Signs of Improvement", d.signsOfImprovement));
    children.push(...labeledBlock("Assistance Expectations", d.assistanceExpectations));
    children.push(...labeledBlock("Involved in Treatment", d.involvedInTreatment));
  }

  // Medical Information
  children.push(sectionHeading("Medical Information"));
  children.push(...labeledBlock("Allergies", d.allergies));
  children.push(...labeledBlock("Personal Medical History", d.personalMedicalHX));
  children.push(...labeledBlock("Family Medical History", d.familyMedicalHX));
  children.push(
    twoColumnKVTable([
      ["History of Non-Compliance", d.historyNonCompliance],
      ["Potential Violence", d.potentialViolence],
      ["Medical Urgency", d.medicalUrgency],
      ["Height", d.height],
      ["Weight", d.weight],
      ["BMI", d.bmi],
      ["Medical Conditions", d.medicalConditions],
    ])
  );
  if (d.medications && d.medications.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [run("Current Medications", { bold: true })],
      })
    );
    children.push(
      dataTable(
        ["Medication", "Dosage", "Frequency", "Route"],
        d.medications.map((m) => [m.name || "Unknown", m.dosage || "", m.frequency || "", m.route || ""])
      )
    );
  }

  // Psychiatric
  if (d.personalPsychHX || d.familyPsychHX || d.treatmentPreferences || d.psychMedicationEfficacy || d.isCOT) {
    children.push(sectionHeading("Psychiatric History"));
    children.push(twoColumnKVTable([["Court-Ordered Treatment (COT)", d.isCOT]]));
    children.push(...labeledBlock("Personal Psychiatric History", d.personalPsychHX));
    children.push(...labeledBlock("Family Psychiatric History", d.familyPsychHX));
    children.push(...labeledBlock("Treatment Preferences", d.treatmentPreferences));
    children.push(...labeledBlock("Psychiatric Medication Efficacy", d.psychMedicationEfficacy));
  }

  // Risk Assessment
  children.push(sectionHeading("Risk Assessment"));
  children.push(subHeading("Danger to Self (DTS)"));
  children.push(
    twoColumnKVTable([
      ["Current Suicidal Ideation", d.currentSuicideIdeation],
      ["Most Recent Ideation", d.mostRecentSuicideIdeation],
      ["History Self-Harm", d.historySelfHarm],
    ])
  );
  children.push(...labeledBlock("Suicide History", d.suicideHistory));
  children.push(...labeledBlock("Suicide Attempt Details", d.suicideAttemptDetails));
  children.push(...labeledBlock("Suicide Ideation Details", d.suicideIdeationDetails));
  children.push(...labeledBlock("Self-Harm Details", d.selfHarmDetails));
  const dtsRisk = checklistToString(d.dtsRiskFactors);
  if (dtsRisk) children.push(...labeledBlock("DTS Risk Factors", dtsRisk));
  const dtsProt = checklistToString(d.dtsProtectiveFactors);
  if (dtsProt) children.push(...labeledBlock("DTS Protective Factors", dtsProt));

  children.push(subHeading("Danger to Others (DTO)"));
  children.push(
    twoColumnKVTable([
      ["History Harming Others", d.historyHarmingOthers],
      ["Duty to Warn Completed", d.dutyToWarnCompleted],
      ["Homicidal Ideation", d.homicidalIdeation],
    ])
  );
  children.push(...labeledBlock("Harming Others Details", d.harmingOthersDetails));
  children.push(...labeledBlock("Homicidal Ideation Details", d.homicidalIdeationDetails));
  children.push(...labeledBlock("Duty to Warn Details", d.dutyToWarnDetails));
  const dtoRisk = checklistToString(d.dtoRiskFactors);
  if (dtoRisk) children.push(...labeledBlock("DTO Risk Factors", dtoRisk));
  children.push(...labeledBlock("Previous Hospitalizations", d.previousHospitalizations));
  children.push(...labeledBlock("Hospitalization Details", d.hospitalizationDetails));

  // Developmental History
  children.push(sectionHeading("Developmental History"));
  children.push(
    twoColumnKVTable([
      ["In Utero Exposure", d.inUteroExposure],
      ["Motor Skills Impairment", d.motorSkillsImpairment],
      ["Speech Difficulties", d.speechDifficulties],
      ["Cognitive Impairment", d.cognitiveImpairment],
      ["Visual Impairment", d.visualImpairment],
      ["Social Skills Deficits", d.socialSkillsDeficits],
      ["Hearing Impairment", d.hearingImpairment],
      ["Immunization Status", d.immunizationStatus],
      ["Developmental Milestones", d.developmentalMilestones],
    ])
  );
  children.push(...labeledBlock("In Utero Exposure Details", d.inUteroExposureDetails));
  children.push(...labeledBlock("Developmental Details", d.developmentalDetails));
  children.push(...labeledBlock("Speech Details", d.speechDetails));
  children.push(...labeledBlock("Visual Details", d.visualDetails));
  children.push(...labeledBlock("Hearing Details", d.hearingDetails));
  children.push(...labeledBlock("Motor Skills Details", d.motorSkillsDetails));
  children.push(...labeledBlock("Cognitive Details", d.cognitiveDetails));
  children.push(...labeledBlock("Social Skills Details", d.socialSkillsDetails));

  // Skills Assessment — two literal columns: Hygiene left, Additional right
  if (
    (d.hygieneSkills && Object.keys(d.hygieneSkills).length) ||
    (d.skillsContinuation && Object.keys(d.skillsContinuation).length)
  ) {
    children.push(sectionHeading("Skills Assessment"));
    const hygienePairs: [string, string][] = d.hygieneSkills
      ? (Object.entries(d.hygieneSkills).filter(([, v]) => !!v) as [string, string][])
      : [];
    const addPairs: [string, string][] = d.skillsContinuation
      ? (Object.entries(d.skillsContinuation).filter(([, v]) => !!v) as [string, string][])
      : [];
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 40 },
        children: [run("Hygiene Skills"), run("     "), run("Additional Skills", { bold: false })],
      })
    );
    const max = Math.max(hygienePairs.length, addPairs.length);
    for (let i = 0; i < max; i++) {
      const h = hygienePairs[i];
      const a = addPairs[i];
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            run(h ? `${h[0]}: ${h[1]}` : ""),
            run("     "),
            run(a ? `${a[0]}: ${a[1]}` : ""),
          ],
        })
      );
    }
  }

  // PHQ-9 as 2-column table
  if (d.phq9Responses && d.phq9Responses.length > 0 && d.phq9TotalScore !== null && d.phq9TotalScore !== undefined) {
    children.push(sectionHeading("PHQ-9 Depression Screening"));
    const rows = PHQ9_QUESTIONS.map((q, i) => [q, Number.isFinite(d.phq9Responses?.[i]) ? String(d.phq9Responses![i]) : "N/A"]);
    children.push(dataTable(["Screening Item", "Score"], rows));
    children.push(
      new Paragraph({
        spacing: { before: 100 },
        children: [run(`Total Score: ${d.phq9TotalScore} - ${phq9Severity(d.phq9TotalScore)}`, { bold: true })],
      })
    );
  }

  // Treatment Planning
  children.push(sectionHeading("Treatment Planning"));
  children.push(...labeledBlock("Treatment Objectives", d.treatmentObjectives));
  children.push(...labeledBlock("Discharge Plan Objectives", d.dischargePlanObjectives));
  children.push(...labeledBlock("Support System", d.supportSystem));
  children.push(...labeledBlock("Community Resources", d.communityResources));

  // Social & Education History
  children.push(sectionHeading("Social & Education History"));
  children.push(subHeading("Social History"));
  children.push(...labeledBlock("Childhood Description", d.childhoodDescription));
  children.push(...labeledBlock("Abuse History", d.abuseHistory));
  children.push(...labeledBlock("Family Mental Health History", d.familyMentalHealthHistory));
  children.push(
    twoColumnKVTable([
      ["Relationship Status", d.relationshipStatus],
      ["Relationship Satisfaction", d.relationshipSatisfaction],
    ])
  );
  children.push(...labeledBlock("Friends Description", d.friendsDescription));

  children.push(subHeading("Education History"));
  children.push(
    twoColumnKVTable([
      ["Highest Education", d.highestEducation],
      ["504 Plan", d.plan504],
      ["Special Education", d.specialEducation],
      ["IEP", d.iep],
    ])
  );
  children.push(...labeledBlock("Special Education Details", d.specialEducationDetails));
  children.push(...labeledBlock("Education Details", d.educationDetails));

  children.push(subHeading("Employment History"));
  children.push(twoColumnKVTable([["Currently Employed", d.currentlyEmployed]]));
  children.push(...labeledBlock("Employment Details", d.employmentDetails));
  children.push(...labeledBlock("Work / Volunteer History", d.workVolunteerHistory));
  children.push(...labeledBlock("Employment Barriers", d.employmentBarriers));

  // Legal & Substance History
  children.push(sectionHeading("Legal & Substance History"));
  children.push(subHeading("Legal History"));
  children.push(twoColumnKVTable([["Court-Ordered Treatment", d.courtOrderedTreatment]]));
  children.push(...labeledBlock("Criminal / Legal History", d.criminalLegalHistory));
  children.push(...labeledBlock("Court Order Details", d.courtOrderedDetails));
  children.push(...labeledBlock("Other Legal Issues", d.otherLegalIssues));

  children.push(subHeading("Substance Use History"));
  children.push(
    twoColumnKVTable([
      ["Drug of Choice", d.drugOfChoice],
      ["Longest Sobriety", d.longestSobriety],
      ["Nicotine Use", d.nicotineUse],
      ["Nicotine Details", d.nicotineDetails],
    ])
  );
  children.push(...labeledBlock("Substance History", d.substanceHistory));
  children.push(...labeledBlock("Substance Treatment History", d.substanceTreatmentHistory));
  children.push(...labeledBlock("Impact of Substance Use", d.substanceImpact));
  children.push(...labeledBlock("History of Abuse (as victim)", d.historyOfAbuse));

  // Living & ADLs
  children.push(sectionHeading("Living Situation & ADLs"));
  children.push(subHeading("Current Living Situation"));
  children.push(...labeledBlock("Living Arrangements", d.livingArrangements));
  children.push(...labeledBlock("Source of Finances", d.sourceOfFinances));
  children.push(twoColumnKVTable([["Transportation", d.transportationMethod], ["Support Level", d.supportLevel]]));

  if (d.adlChecklist) {
    children.push(subHeading("Activities of Daily Living"));
    const adlPairs: [string, string][] = Object.entries(d.adlChecklist).filter(([, v]) => !!v) as [string, string][];
    // render in 2 columns
    const half = Math.ceil(adlPairs.length / 2);
    const left = adlPairs.slice(0, half);
    const right = adlPairs.slice(half);
    const rows = Math.max(left.length, right.length);
    for (let i = 0; i < rows; i++) {
      const l = left[i];
      const r = right[i];
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [run(l ? `${hskey(l[0])}: ${l[1]}` : ""), run("     "), run(r ? `${hskey(r[0])}: ${r[1]}` : "")],
        })
      );
    }
  }
  children.push(...labeledBlock("Typical Day", d.typicalDay));
  children.push(...labeledBlock("Preferred Activities", d.preferredActivities));
  children.push(...labeledBlock("Strengths, Abilities & Interests", d.strengthsAbilitiesInterests));
  children.push(...labeledBlock("Significant Others", d.significantOthers));

  // Clinical Behavioral Observations
  children.push(sectionHeading("Clinical Behavioral Observations"));
  children.push(subHeading("Appearance"));
  children.push(
    twoColumnKVTable([
      ["Apparent Age", d.appearanceAge],
      ["Attire", d.appearanceAttire],
      ["Height", d.appearanceHeight],
      ["Grooming", d.appearanceGrooming],
      ["Weight", d.appearanceWeight],
    ])
  );
  children.push(...labeledBlock("Appearance Notes", d.appearanceDescription));

  children.push(subHeading("Demeanor"));
  children.push(
    twoColumnKVTable([
      ["Mood", d.demeanorMood],
      ["Eye Contact", d.demeanorEyeContact],
      ["Affect", d.demeanorAffect],
      ["Cooperation", d.demeanorCooperation],
    ])
  );
  children.push(...labeledBlock("Demeanor Notes", d.demeanorDescription));

  children.push(subHeading("Speech"));
  children.push(
    twoColumnKVTable([
      ["Articulation", d.speechArticulation],
      ["Rate", d.speechRate],
      ["Tone", d.speechTone],
      ["Latency", d.speechLatency],
    ])
  );
  children.push(...labeledBlock("Speech Notes", d.speechDescription));

  children.push(subHeading("Motor"));
  children.push(
    twoColumnKVTable([
      ["Gait", d.motorGait],
      ["Activity Level", d.motorActivity],
      ["Posture", d.motorPosture],
      ["Mannerisms", d.motorMannerisms],
    ])
  );
  children.push(...labeledBlock("Motor Notes", d.motorDescription));

  children.push(subHeading("Cognition"));
  children.push(
    twoColumnKVTable([
      ["Thought Content", d.cognitionThoughtContent],
      ["Judgment", d.cognitionJudgment],
      ["Thought Process", d.cognitionThoughtProcess],
      ["Impulse Control", d.cognitionImpulseControl],
      ["Delusions", d.cognitionDelusions],
      ["Insight", d.cognitionInsight],
      ["Perception", d.cognitionPerception],
      ["Estimated Intelligence", d.estimatedIntelligence],
    ])
  );
  children.push(...labeledBlock("Cognition Notes", d.cognitionDescription));

  // Diagnosis & Treatment
  if (d.diagnosis || d.treatmentRecommendation) {
    children.push(sectionHeading("Diagnosis & Treatment"));
    children.push(...labeledBlock("Diagnosis", d.diagnosis));
    children.push(...labeledBlock("Treatment Recommendation", d.treatmentRecommendation));
  }

  // Wellness & Needs
  children.push(sectionHeading("Wellness & Needs"));
  children.push(...labeledBlock("Health Needs", d.healthNeeds));
  children.push(...labeledBlock("Nutritional Needs", d.nutritionalNeeds));
  children.push(...labeledBlock("Spiritual Needs", d.spiritualNeeds));
  children.push(...labeledBlock("Cultural Needs", d.culturalNeeds));

  // Crisis & Discharge
  children.push(sectionHeading("Crisis & Discharge Planning"));
  children.push(twoColumnKVTable([["Feedback Frequency", d.feedbackFrequency]]));
  children.push(...labeledBlock("Crisis Intervention Plan", d.crisisInterventionPlan));
  const dp = (d.dischargePlanning || "").replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  children.push(...labeledBlock("Discharge Planning", dp || null));

  // Signatures
  const sig = d.signatures || {};
  children.push(sectionHeading("Signatures"));
  children.push(
    twoColumnKVTable([
      ["Client / Guardian", sig.clientPrintedName || ""],
      ["Date", fmtDate(sig.clientSignatureDate || null)],
      ["Assessment Completed By", sig.assessorPrintedName || ""],
      ["Date", fmtDate(sig.assessorSignatureDate || null)],
      ["Clinical Oversight / BHP Reviewer", sig.clinicalOversightPrintedName || ""],
      ["Date", fmtDate(sig.clinicalOversightSignatureDate || null)],
    ])
  );

  const doc = new Document({
    ...defaultDocProps(`Intake - ${d.residentName}`),
    sections: [defaultSection(children)],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

export function intakeDocxFilename(d: Pick<IntakeDocxData, "residentName">, dateStr: string): string {
  const safeName = d.residentName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  return sanitizeFilename(`intake_${safeName}_${dateStr}.docx`);
}

// Silence unused import — AlignmentType is useful if the builder is extended.
void AlignmentType;
