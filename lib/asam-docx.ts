/**
 * Plain, no-color .docx builder for an ASAM assessment.
 *
 * Matches the facility reference docx: Calibri 11pt, black on white,
 * two-column KV layout for short fields, bold label-on-own-line for long
 * free-text, confidential banner, section titles ALL CAPS, severity rating
 * at the end of each dimension.
 */

import { Document, Packer, Paragraph, Table } from "docx";
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
  twoColumnKVTable,
} from "./plain-docx-utils";
import { AlignmentType } from "docx";

function severityLabel(severity: number | null | undefined): string {
  if (severity === null || severity === undefined) return "Not Rated";
  const labels = ["None (0)", "Mild (1)", "Moderate (2)", "Severe (3)", "Very Severe (4)"];
  return labels[severity] || "Not Rated";
}

export interface ASAMDocxData {
  id: string;
  patientName: string;
  dateOfBirth: string | Date;
  admissionDate: string | Date | null;
  assessmentDate: string | Date;
  phoneNumber: string | null;
  okayToLeaveVoicemail: boolean | null;
  patientAddress: string | null;
  age: string | number | null;
  gender: string | null;
  raceEthnicity: string | null;
  preferredLanguage: string | null;
  ahcccsId: string | null;
  otherInsuranceId: string | null;
  insuranceType: string | null;
  insurancePlan: string | null;
  livingArrangement: string | null;
  referredBy: string | null;
  reasonForTreatment: string | null;
  currentSymptoms: string | null;

  substanceUseHistory:
    | {
        substance: string;
        route?: string;
        routeOfAdministration?: string;
        ageFirstUse?: string;
        ageFirstUsed?: string;
        ageRegularUse?: string;
        lastUse?: string;
        frequency?: string;
        amount?: string;
      }[]
    | null;
  usingMoreThanIntended: boolean | null;
  usingMoreDetails: string | null;
  physicallyIllWhenStopping: boolean | null;
  physicallyIllDetails: string | null;
  currentWithdrawalSymptoms: boolean | null;
  withdrawalSymptomsDetails: string | null;
  historyOfSeriousWithdrawal: boolean | null;
  seriousWithdrawalDetails: string | null;
  toleranceIncreased: boolean | null;
  toleranceDetails: string | null;
  recentUseChanges: boolean | null;
  recentUseChangesDetails: string | null;
  familySubstanceHistory: string | null;
  dimension1Severity: number | null;
  dimension1Comments: string | null;

  medicalProviders: { name?: string; specialty?: string; contact?: string }[] | null;
  medicalConditions: Record<string, boolean> | null;
  conditionsInterfere: boolean | null;
  conditionsInterfereDetails: string | null;
  priorHospitalizations: string | null;
  lifeThreatening: boolean | null;
  medicalMedications: { medication?: string; dose?: string; reason?: string; effectiveness?: string }[] | null;
  dimension2Severity: number | null;
  dimension2Comments: string | null;

  moodSymptoms: Record<string, boolean> | null;
  anxietySymptoms: Record<string, boolean> | null;
  psychosisSymptoms: (Record<string, boolean> & { delusions?: string; hallucinations?: string }) | null;
  otherSymptoms: Record<string, boolean> | null;
  suicidalThoughts: boolean | null;
  suicidalThoughtsDetails: string | null;
  thoughtsOfHarmingOthers: boolean | null;
  harmingOthersDetails: string | null;
  abuseHistory: string | null;
  traumaticEvents: string | null;
  mentalIllnessDiagnosed: boolean | null;
  mentalIllnessDetails: string | null;
  previousPsychTreatment: boolean | null;
  psychTreatmentDetails: string | null;
  hallucinationsPresent: boolean | null;
  hallucinationsDetails: string | null;
  furtherMHAssessmentNeeded: boolean | null;
  furtherMHAssessmentDetails: string | null;
  psychiatricMedications: { medication?: string; dose?: string; reason?: string; effectiveness?: string }[] | null;
  mentalHealthProviders: { name?: string; specialty?: string; contact?: string }[] | null;
  dimension3Severity: number | null;
  dimension3Comments: string | null;

  areasAffectedByUse: Record<string, boolean> | null;
  continueUseDespiteEffects: boolean | null;
  continueUseDetails: string | null;
  previousTreatmentHelp: boolean | null;
  treatmentProviders: { name?: string; specialty?: string; contact?: string }[] | null;
  recoverySupport: string | null;
  recoveryBarriers: string | null;
  treatmentImportanceAlcohol: string | null;
  treatmentImportanceDrugs: string | null;
  treatmentImportanceDetails: string | null;
  dimension4Severity: number | null;
  dimension4Comments: string | null;

  cravingsFrequencyAlcohol: string | null;
  cravingsFrequencyDrugs: string | null;
  cravingsDetails: string | null;
  timeSearchingForSubstances: boolean | null;
  timeSearchingDetails: string | null;
  relapseWithoutTreatment: boolean | null;
  relapseDetails: string | null;
  awareOfTriggers: boolean | null;
  triggersList: string | Record<string, boolean | string> | null;
  copingWithTriggers: string | null;
  attemptsToControl: string | null;
  longestSobriety: string | null;
  whatHelped: string | null;
  whatDidntHelp: string | null;
  dimension5Severity: number | null;
  dimension5Comments: string | null;

  supportiveRelationships: string | null;
  currentLivingSituation: string | null;
  othersUsingDrugsInEnvironment: boolean | null;
  othersUsingDetails: string | null;
  safetyThreats: boolean | null;
  safetyThreatsDetails: string | null;
  negativeImpactRelationships: boolean | null;
  negativeImpactDetails: string | null;
  currentlyEmployedOrSchool: boolean | null;
  employmentSchoolDetails: string | null;
  socialServicesInvolved: boolean | null;
  socialServicesDetails: string | null;
  probationParoleOfficer: string | null;
  probationParoleContact: string | null;
  dimension6Severity: number | null;
  dimension6Comments: string | null;

  summaryRationale:
    | string
    | {
        dimension1Rationale?: string;
        dimension2Rationale?: string;
        dimension3Rationale?: string;
        dimension4Rationale?: string;
        dimension5Rationale?: string;
        dimension6Rationale?: string;
      }
    | null;
  dsm5Criteria:
    | Record<string, boolean>
    | { substanceName: string; criteria?: (string | boolean)[]; totalCriteria?: number }[]
    | string[]
    | null;
  dsm5Diagnoses: string | null;
  levelOfCareDetermination:
    | string
    | {
        treatmentServices?: string;
        withdrawalManagement?: string;
        otp?: boolean;
      }
    | null;
  matInterested: boolean | null;
  matDetails: string | null;

  recommendedLevelOfCare: string | null;
  levelOfCareProvided: string | null;
  discrepancyReason: string | null;
  discrepancyExplanation: string | null;
  designatedTreatmentLocation: string | null;
  designatedProviderName: string | null;

  counselorName: string | null;
  counselorSignatureDate: string | Date | null;
  bhpLphaName: string | null;
  bhpLphaSignatureDate: string | Date | null;

  status: string;
  decisionReason: string | null;
  decidedAt: string | Date | null;
  createdAt: string | Date;
  facility: { name: string };
  bhpName: string;
}

/** Render the severity rating line at the end of a dimension. */
function severityLine(label: string, severity: number | null): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [run(`${label}: `, { bold: true }), run(severityLabel(severity))],
  });
}

export async function buildASAMDocx(d: ASAMDocxData): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];

  // Header
  children.push(docTitle("ASAM Assessment"));
  children.push(docSubtitle(d.facility.name));
  if (d.recommendedLevelOfCare) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [run(`Recommended LOC: ${d.recommendedLevelOfCare}`, { bold: true })],
      })
    );
  }
  children.push(confidentialBanner());

  // Risk Alert (plain)
  if (d.suicidalThoughts || d.thoughtsOfHarmingOthers) {
    children.push(sectionHeading("Risk Alert"));
    if (d.suicidalThoughts) {
      children.push(...labeledBlock("Suicidal Thoughts Reported", d.suicidalThoughtsDetails || "Reported"));
    }
    if (d.thoughtsOfHarmingOthers) {
      children.push(
        ...labeledBlock("Thoughts of Harming Others Reported", d.harmingOthersDetails || "Reported")
      );
    }
  }

  // Patient Demographics
  children.push(sectionHeading("Patient Demographics"));
  children.push(
    twoColumnKVTable([
      ["Full Name", d.patientName],
      ["Phone", d.phoneNumber],
      ["Date of Birth", fmtDateLong(d.dateOfBirth)],
      ["Language", d.preferredLanguage],
      ["Age", d.age],
      ["Insurance", d.insuranceType],
      ["Gender", d.gender],
      ["AHCCCS ID", d.ahcccsId],
      ["Race / Ethnicity", d.raceEthnicity],
      ["Living Arrangement", d.livingArrangement],
      ["OK to Leave Voicemail", d.okayToLeaveVoicemail],
      ["Other Insurance ID", d.otherInsuranceId],
      ["Insurance Plan", d.insurancePlan],
      ["Referred By", d.referredBy],
    ])
  );
  children.push(...labeledBlock("Address", d.patientAddress));
  children.push(...labeledBlock("Reason for Treatment", d.reasonForTreatment));
  children.push(...labeledBlock("Current Symptoms", d.currentSymptoms));

  // Dimension 1
  children.push(sectionHeading("Dimension 1: Acute Intoxication / Withdrawal Potential"));
  if (d.substanceUseHistory && d.substanceUseHistory.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [run("Substance Use History", { bold: true })],
      })
    );
    children.push(
      dataTable(
        ["Substance", "Route", "First Use Age", "Last Use", "Frequency", "Amount"],
        d.substanceUseHistory.map((e) => [
          e.substance || "",
          e.route || e.routeOfAdministration || "",
          e.ageFirstUse || e.ageFirstUsed || "",
          e.lastUse || "",
          e.frequency || "",
          e.amount || "",
        ])
      )
    );
  }
  children.push(
    twoColumnKVTable([
      ["Using More Than Intended", d.usingMoreThanIntended],
      ["History Serious Withdrawal", d.historyOfSeriousWithdrawal],
      ["Physically Ill When Stopping", d.physicallyIllWhenStopping],
      ["Tolerance Increased", d.toleranceIncreased],
      ["Current Withdrawal Symptoms", d.currentWithdrawalSymptoms],
      ["Recent Use Changes", d.recentUseChanges],
    ])
  );
  children.push(...labeledBlock("Using More Details", d.usingMoreDetails));
  children.push(...labeledBlock("Physically Ill Details", d.physicallyIllDetails));
  children.push(...labeledBlock("Withdrawal Symptom Details", d.withdrawalSymptomsDetails));
  children.push(...labeledBlock("Serious Withdrawal Details", d.seriousWithdrawalDetails));
  children.push(...labeledBlock("Tolerance Details", d.toleranceDetails));
  children.push(...labeledBlock("Recent Use Changes Details", d.recentUseChangesDetails));
  children.push(...labeledBlock("Family Substance History", d.familySubstanceHistory));
  children.push(...labeledBlock("Comments", d.dimension1Comments));
  children.push(severityLine("Severity Rating", d.dimension1Severity));

  // Dimension 2
  children.push(sectionHeading("Dimension 2: Biomedical Conditions"));
  const medConds = checklistToString(d.medicalConditions);
  if (medConds) children.push(...labeledBlock("Medical Conditions", medConds));
  children.push(
    twoColumnKVTable([
      ["Conditions Interfere", d.conditionsInterfere],
      ["Life-Threatening", d.lifeThreatening],
    ])
  );
  children.push(...labeledBlock("Conditions Interference Details", d.conditionsInterfereDetails));
  children.push(...labeledBlock("Prior Hospitalizations", d.priorHospitalizations));
  if (d.medicalProviders && d.medicalProviders.length > 0) {
    children.push(
      ...labeledBlock(
        "Medical Providers",
        d.medicalProviders
          .map((p) => [p.name, p.specialty, p.contact].filter(Boolean).join(" — "))
          .filter(Boolean)
          .join("; ")
      )
    );
  }
  if (d.medicalMedications && d.medicalMedications.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [run("Medical Medications", { bold: true })],
      })
    );
    children.push(
      dataTable(
        ["Medication", "Dose", "Reason", "Effectiveness"],
        d.medicalMedications.map((m) => [m.medication || "", m.dose || "", m.reason || "", m.effectiveness || ""])
      )
    );
  }
  children.push(...labeledBlock("Comments", d.dimension2Comments));
  children.push(severityLine("Severity Rating", d.dimension2Severity));

  // Dimension 3
  children.push(sectionHeading("Dimension 3: Emotional, Behavioral & Cognitive Conditions"));
  const mood = checklistToString(d.moodSymptoms);
  if (mood) children.push(...labeledBlock("Mood Symptoms", mood));
  const anxiety = checklistToString(d.anxietySymptoms);
  if (anxiety) children.push(...labeledBlock("Anxiety Symptoms", anxiety));
  if (d.psychosisSymptoms) {
    const parts = [checklistToString(d.psychosisSymptoms)];
    if (d.psychosisSymptoms.delusions) parts.push(`Delusions: ${d.psychosisSymptoms.delusions}`);
    if (d.psychosisSymptoms.hallucinations) parts.push(`Hallucinations: ${d.psychosisSymptoms.hallucinations}`);
    const joined = parts.filter(Boolean).join(", ");
    if (joined) children.push(...labeledBlock("Psychosis Symptoms", joined));
  }
  const other = checklistToString(d.otherSymptoms);
  if (other) children.push(...labeledBlock("Other Symptoms", other));
  children.push(
    twoColumnKVTable([
      ["Mental Illness Diagnosed", d.mentalIllnessDiagnosed],
      ["Hallucinations Present", d.hallucinationsPresent],
      ["Previous Psych Treatment", d.previousPsychTreatment],
      ["Further MH Assessment Needed", d.furtherMHAssessmentNeeded],
    ])
  );
  children.push(...labeledBlock("Abuse History", d.abuseHistory));
  children.push(...labeledBlock("Mental Illness Details", d.mentalIllnessDetails));
  children.push(...labeledBlock("Psych Treatment Details", d.psychTreatmentDetails));
  children.push(...labeledBlock("Hallucinations Details", d.hallucinationsDetails));
  children.push(...labeledBlock("Further MH Assessment Details", d.furtherMHAssessmentDetails));
  children.push(...labeledBlock("Traumatic Events", d.traumaticEvents));
  if (d.psychiatricMedications && d.psychiatricMedications.length > 0) {
    children.push(
      ...labeledBlock(
        "Psychiatric Medications",
        d.psychiatricMedications.map((m) => m.medication || "").filter(Boolean).join(", ")
      )
    );
  }
  if (d.mentalHealthProviders && d.mentalHealthProviders.length > 0) {
    children.push(
      ...labeledBlock(
        "Mental Health Providers",
        d.mentalHealthProviders
          .map((p) => [p.name, p.specialty, p.contact].filter(Boolean).join(" — "))
          .filter(Boolean)
          .join("; ")
      )
    );
  }
  children.push(...labeledBlock("Comments", d.dimension3Comments));
  children.push(severityLine("Severity Rating", d.dimension3Severity));

  // Dimension 4
  children.push(sectionHeading("Dimension 4: Readiness to Change"));
  const areas = checklistToString(d.areasAffectedByUse);
  if (areas) children.push(...labeledBlock("Areas Affected by Use", areas));
  children.push(
    twoColumnKVTable([
      ["Continue Use Despite Effects", d.continueUseDespiteEffects],
      ["Treatment Importance (Alcohol)", d.treatmentImportanceAlcohol],
      ["Previous Treatment Helped", d.previousTreatmentHelp],
      ["Treatment Importance (Drugs)", d.treatmentImportanceDrugs],
    ])
  );
  children.push(...labeledBlock("Continue Use Details", d.continueUseDetails));
  children.push(...labeledBlock("Treatment Importance Details", d.treatmentImportanceDetails));
  children.push(...labeledBlock("Recovery Support", d.recoverySupport));
  children.push(...labeledBlock("Recovery Barriers", d.recoveryBarriers));
  children.push(...labeledBlock("Comments", d.dimension4Comments));
  children.push(severityLine("Severity Rating", d.dimension4Severity));

  // Dimension 5
  children.push(sectionHeading("Dimension 5: Relapse, Continued Use, or Continued Problem Potential"));
  children.push(
    twoColumnKVTable([
      ["Cravings (Alcohol)", d.cravingsFrequencyAlcohol],
      ["Time Searching for Substances", d.timeSearchingForSubstances],
      ["Cravings (Drugs)", d.cravingsFrequencyDrugs],
      ["Relapse Without Treatment", d.relapseWithoutTreatment],
      ["Aware of Triggers", d.awareOfTriggers],
      ["Longest Sobriety", d.longestSobriety],
    ])
  );
  const triggers =
    typeof d.triggersList === "string"
      ? d.triggersList
      : d.triggersList
      ? [
          checklistToString(d.triggersList),
          typeof d.triggersList.other === "string" && d.triggersList.other ? `Other: ${d.triggersList.other}` : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "";
  if (triggers) children.push(...labeledBlock("Triggers", triggers));
  children.push(...labeledBlock("Cravings Details", d.cravingsDetails));
  children.push(...labeledBlock("Time Searching Details", d.timeSearchingDetails));
  children.push(...labeledBlock("Relapse Details", d.relapseDetails));
  children.push(...labeledBlock("Coping With Triggers", d.copingWithTriggers));
  children.push(...labeledBlock("Attempts to Control", d.attemptsToControl));
  children.push(...labeledBlock("What Helped", d.whatHelped));
  children.push(...labeledBlock("What Didn't Help", d.whatDidntHelp));
  children.push(...labeledBlock("Comments", d.dimension5Comments));
  children.push(severityLine("Severity Rating", d.dimension5Severity));

  // Dimension 6
  children.push(sectionHeading("Dimension 6: Recovery / Living Environment"));
  children.push(
    twoColumnKVTable([
      ["Employed / In School", d.currentlyEmployedOrSchool],
      ["Others Using in Environment", d.othersUsingDrugsInEnvironment],
      ["Safety Threats", d.safetyThreats],
      ["Negative Impact Relationships", d.negativeImpactRelationships],
      ["Social Services Involved", d.socialServicesInvolved],
    ])
  );
  children.push(...labeledBlock("Others Using Details", d.othersUsingDetails));
  children.push(...labeledBlock("Safety Threats Details", d.safetyThreatsDetails));
  children.push(...labeledBlock("Negative Impact Details", d.negativeImpactDetails));
  children.push(...labeledBlock("Employment / School Details", d.employmentSchoolDetails));
  children.push(...labeledBlock("Social Services Details", d.socialServicesDetails));
  children.push(...labeledBlock("Supportive Relationships", d.supportiveRelationships));
  children.push(...labeledBlock("Current Living Situation", d.currentLivingSituation));
  if (d.probationParoleOfficer) {
    children.push(
      ...labeledBlock(
        "Probation / Parole Officer",
        `${d.probationParoleOfficer}${d.probationParoleContact ? ` (${d.probationParoleContact})` : ""}`
      )
    );
  }
  children.push(...labeledBlock("Comments", d.dimension6Comments));
  children.push(severityLine("Severity Rating", d.dimension6Severity));

  // DSM-5
  children.push(sectionHeading("DSM-5 Substance Use Disorder Criteria"));
  if (Array.isArray(d.dsm5Criteria) && d.dsm5Criteria.length > 0) {
    if (typeof d.dsm5Criteria[0] === "string") {
      children.push(
        ...labeledBlock(
          `Criteria Met (${d.dsm5Criteria.length})`,
          (d.dsm5Criteria as string[]).join(", ")
        )
      );
    } else {
      for (const item of d.dsm5Criteria as {
        substanceName: string;
        criteria?: (string | boolean)[];
        totalCriteria?: number;
      }[]) {
        const display = Array.isArray(item.criteria)
          ? item.criteria.every((c) => typeof c === "boolean")
            ? `${item.criteria.filter(Boolean).length} criteria met`
            : item.criteria.filter((c) => typeof c === "string").join(", ")
          : "Not specified";
        children.push(
          ...labeledBlock(`${item.substanceName} (${item.totalCriteria || 0} criteria)`, display)
        );
      }
    }
  } else if (d.dsm5Criteria && typeof d.dsm5Criteria === "object") {
    const met = checklistToString(d.dsm5Criteria as Record<string, boolean>);
    if (met) children.push(...labeledBlock("Criteria Met", met));
  }
  children.push(...labeledBlock("DSM-5 Diagnoses", d.dsm5Diagnoses));

  // Level of Care
  children.push(sectionHeading("Level of Care Determination"));
  children.push(
    twoColumnKVTable([
      ["Treatment Location", d.designatedTreatmentLocation],
      ["Recommended Level of Care", d.recommendedLevelOfCare],
      ["Level of Care Provided", d.levelOfCareProvided],
      ["MAT Interested", d.matInterested],
      ["Provider Name", d.designatedProviderName],
    ])
  );
  children.push(...labeledBlock("MAT Details", d.matDetails));
  if (d.levelOfCareDetermination) {
    const loc =
      typeof d.levelOfCareDetermination === "string"
        ? d.levelOfCareDetermination
        : `Treatment Services: ${d.levelOfCareDetermination.treatmentServices || "N/A"}. Withdrawal Management: ${
            d.levelOfCareDetermination.withdrawalManagement || "N/A"
          }. OTP: ${d.levelOfCareDetermination.otp ? "Yes" : "No"}.`;
    children.push(...labeledBlock("Level of Care Determination", loc));
  }
  children.push(...labeledBlock("Discrepancy Reason", d.discrepancyReason));
  children.push(...labeledBlock("Discrepancy Explanation", d.discrepancyExplanation));

  if (d.summaryRationale) {
    const rat =
      typeof d.summaryRationale === "string"
        ? d.summaryRationale
        : [
            d.summaryRationale.dimension1Rationale && `Dimension 1: ${d.summaryRationale.dimension1Rationale}`,
            d.summaryRationale.dimension2Rationale && `Dimension 2: ${d.summaryRationale.dimension2Rationale}`,
            d.summaryRationale.dimension3Rationale && `Dimension 3: ${d.summaryRationale.dimension3Rationale}`,
            d.summaryRationale.dimension4Rationale && `Dimension 4: ${d.summaryRationale.dimension4Rationale}`,
            d.summaryRationale.dimension5Rationale && `Dimension 5: ${d.summaryRationale.dimension5Rationale}`,
            d.summaryRationale.dimension6Rationale && `Dimension 6: ${d.summaryRationale.dimension6Rationale}`,
          ]
            .filter(Boolean)
            .join(" ");
    children.push(...labeledBlock("Summary Rationale", rat));
  }

  // BHP Decision
  if (d.status && d.status !== "PENDING" && d.status !== "DRAFT" && d.decisionReason) {
    children.push(sectionHeading("BHP Decision"));
    children.push(
      twoColumnKVTable([
        ["Status", d.status],
        ["Decision Date", d.decidedAt ? fmtDate(d.decidedAt) : null],
      ])
    );
    children.push(...labeledBlock("Decision Reason", d.decisionReason));
  }

  // Signatures
  children.push(sectionHeading("Signatures"));
  children.push(
    twoColumnKVTable([
      ["Counselor / Assessor", d.counselorName || ""],
      ["Date", fmtDate(d.counselorSignatureDate)],
      ["BHP / LPHA", d.bhpLphaName || ""],
      ["Date", fmtDate(d.bhpLphaSignatureDate)],
    ])
  );

  const doc = new Document({
    ...defaultDocProps(`ASAM Assessment - ${d.patientName}`),
    sections: [defaultSection(children)],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

export function asamDocxFilename(d: Pick<ASAMDocxData, "patientName">, dateStr: string): string {
  const safeName = d.patientName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  return sanitizeFilename(`ASAM_${safeName}_${dateStr}.docx`);
}
