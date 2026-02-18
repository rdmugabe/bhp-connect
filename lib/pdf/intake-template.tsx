import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 15,
    borderBottom: "2 solid #1a365d",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 10,
    color: "#4a5568",
  },
  headerInfo: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 6,
    borderTop: "1 solid #e2e8f0",
    gap: 20,
  },
  headerInfoItem: {
    flexDirection: "row",
    fontSize: 8,
  },
  headerInfoLabel: {
    color: "#4a5568",
    marginRight: 4,
  },
  headerInfoValue: {
    fontWeight: "bold",
    color: "#1a365d",
  },
  confidentialBanner: {
    backgroundColor: "#fed7d7",
    padding: 5,
    marginTop: 8,
    borderRadius: 3,
  },
  confidentialText: {
    color: "#c53030",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1 solid #e2e8f0",
    backgroundColor: "#f7fafc",
    padding: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    color: "#4a5568",
    fontSize: 8,
  },
  value: {
    width: "65%",
    fontSize: 9,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 10,
  },
  column: {
    flex: 1,
  },
  textBlock: {
    marginBottom: 8,
  },
  textBlockLabel: {
    color: "#4a5568",
    fontSize: 8,
    marginBottom: 2,
  },
  textBlockValue: {
    fontSize: 9,
    backgroundColor: "#f7fafc",
    padding: 6,
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: "1 solid #e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#718096",
    textAlign: "center",
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#edf2f7",
    padding: 4,
    fontWeight: "bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    borderBottom: "1 solid #e2e8f0",
    fontSize: 8,
  },
  subSectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
    marginTop: 6,
  },
  checklistItem: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 8,
  },
  checklistLabel: {
    width: "40%",
    color: "#4a5568",
  },
  checklistValue: {
    width: "60%",
  },
  phq9Section: {
    marginTop: 6,
    marginBottom: 12,
    padding: 6,
    backgroundColor: "#f0fff4",
    borderRadius: 3,
  },
  phq9Score: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a365d",
  },
  signatureSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f7fafc",
    borderRadius: 3,
    border: "1 solid #e2e8f0",
  },
  signatureRow: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-end",
  },
  signatureBlock: {
    flex: 1,
    marginRight: 15,
  },
  signatureLine: {
    borderBottom: "1 solid #1a365d",
    marginBottom: 4,
    height: 20,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#4a5568",
  },
  signatureValue: {
    fontSize: 9,
    color: "#1a365d",
    height: 20,
    paddingTop: 4,
  },
  dateBlock: {
    width: 100,
  },
  dateLine: {
    borderBottom: "1 solid #1a365d",
    marginBottom: 4,
    height: 20,
  },
  dateLabel: {
    fontSize: 8,
    color: "#4a5568",
  },
});

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself",
  "Trouble concentrating",
  "Moving or speaking slowly/being fidgety",
  "Thoughts of self-harm",
];

interface IntakeData {
  id: string;
  residentName: string;
  ssn: string | null;
  dateOfBirth: string;
  admissionDate: string | null;
  sex: string | null;
  ethnicity: string | null;
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
  hasDNR: boolean;
  hasAdvancedDirective: boolean;
  hasWill: boolean;
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
  historyNonCompliance: boolean;
  potentialViolence: boolean;
  medicalUrgency: string | null;
  personalMedicalHX: string | null;
  familyMedicalHX: string | null;
  medicalConditions: string | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;
  isCOT: boolean;
  personalPsychHX: string | null;
  familyPsychHX: string | null;
  treatmentPreferences: string | null;
  psychMedicationEfficacy: string | null;
  suicideHistory: string | null;
  suicideAttemptDetails: string | null;
  currentSuicideIdeation: boolean;
  suicideIdeationDetails: string | null;
  mostRecentSuicideIdeation: string | null;
  historySelfHarm: boolean;
  selfHarmDetails: string | null;
  dtsRiskFactors: Record<string, boolean> | null;
  dtsProtectiveFactors: Record<string, boolean> | null;
  historyHarmingOthers: boolean;
  harmingOthersDetails: string | null;
  homicidalIdeation: boolean;
  homicidalIdeationDetails: string | null;
  dtoRiskFactors: Record<string, boolean> | null;
  dutyToWarnCompleted: boolean;
  dutyToWarnDetails: string | null;
  previousHospitalizations: string | null;
  hospitalizationDetails: string | null;
  inUteroExposure: boolean;
  inUteroExposureDetails: string | null;
  developmentalMilestones: string | null;
  developmentalDetails: string | null;
  speechDifficulties: boolean;
  speechDetails: string | null;
  visualImpairment: boolean;
  visualDetails: string | null;
  hearingImpairment: boolean;
  hearingDetails: string | null;
  motorSkillsImpairment: boolean;
  motorSkillsDetails: string | null;
  cognitiveImpairment: boolean;
  cognitiveDetails: string | null;
  socialSkillsDeficits: boolean;
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
  specialEducation: boolean;
  specialEducationDetails: string | null;
  plan504: boolean;
  iep: boolean;
  educationDetails: string | null;
  currentlyEmployed: boolean;
  employmentDetails: string | null;
  workVolunteerHistory: string | null;
  employmentBarriers: string | null;
  criminalLegalHistory: string | null;
  courtOrderedTreatment: boolean;
  courtOrderedDetails: string | null;
  otherLegalIssues: string | null;
  substanceHistory: string | null;
  substanceUseTable: Record<string, unknown>[] | null;
  drugOfChoice: string | null;
  longestSobriety: string | null;
  substanceTreatmentHistory: string | null;
  nicotineUse: boolean;
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
  educationHistory: string | null;
  vocationalHistory: string | null;
  crisisInterventionPlan: string | null;
  feedbackFrequency: string | null;
  dischargePlanning: string | null;
  signatures: Record<string, string> | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "CONDITIONAL" | "DENIED";
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  facility: {
    name: string;
    address: string;
  };
  bhpName: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function getPHQ9Severity(score: number): string {
  if (score <= 4) return "Minimal depression";
  if (score <= 9) return "Mild depression";
  if (score <= 14) return "Moderate depression";
  if (score <= 19) return "Moderately severe depression";
  return "Severe depression";
}

function Header({ data }: { data: IntakeData }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.title}>Full Intake Assessment</Text>
      <Text style={styles.subtitle}>
        {data.facility.name} | Managed by {data.bhpName}
      </Text>
      <View style={styles.headerInfo}>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>Client:</Text>
          <Text style={styles.headerInfoValue}>{data.residentName}</Text>
        </View>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>DOB:</Text>
          <Text style={styles.headerInfoValue}>{formatDate(data.dateOfBirth)}</Text>
        </View>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>Admission:</Text>
          <Text style={styles.headerInfoValue}>{data.admissionDate ? formatDate(data.admissionDate) : "N/A"}</Text>
        </View>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>AHCCCS ID:</Text>
          <Text style={styles.headerInfoValue}>{data.policyNumber || "N/A"}</Text>
        </View>
      </View>
      <View style={styles.confidentialBanner}>
        <Text style={styles.confidentialText}>
          CONFIDENTIAL - PROTECTED HEALTH INFORMATION (PHI)
        </Text>
      </View>
    </View>
  );
}

function Footer({ id }: { id: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        This document contains Protected Health Information (PHI) subject to HIPAA regulations.
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Document ID: ${id} | Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

export function IntakePDF({ data }: { data: IntakeData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <Header data={data} />
        <Footer id={data.id} />

        {/* Demographics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEMOGRAPHICS</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{data.residentName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Birth:</Text>
                <Text style={styles.value}>{formatDate(data.dateOfBirth)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>SSN (Last 4):</Text>
                <Text style={styles.value}>{data.ssn || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Sex:</Text>
                <Text style={styles.value}>{data.sex || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Ethnicity:</Text>
                <Text style={styles.value}>{data.ethnicity || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Language:</Text>
                <Text style={styles.value}>{data.language || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Religion:</Text>
                <Text style={styles.value}>{data.religion || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{data.patientPhone || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{data.patientEmail || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Emergency Contact:</Text>
                <Text style={styles.value}>{data.emergencyContactName || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Emergency Phone:</Text>
                <Text style={styles.value}>{data.emergencyContactPhone || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.patientAddress && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Address:</Text>
              <Text style={styles.textBlockValue}>{data.patientAddress}</Text>
            </View>
          )}
        </View>

        {/* Insurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSURANCE INFORMATION</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Provider:</Text>
                <Text style={styles.value}>{data.insuranceProvider || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Policy Number:</Text>
                <Text style={styles.value}>{data.policyNumber || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Health Plan:</Text>
                <Text style={styles.value}>{data.ahcccsHealthPlan || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Group Number:</Text>
                <Text style={styles.value}>{data.groupNumber || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Referral Information */}
        {data.reasonsForReferral && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REFERRAL INFORMATION</Text>
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Reasons for Referral:</Text>
              <Text style={styles.textBlockValue}>{data.reasonsForReferral}</Text>
            </View>
            {data.residentNeeds && (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockLabel}>Resident Needs:</Text>
                <Text style={styles.textBlockValue}>{data.residentNeeds}</Text>
              </View>
            )}
          </View>
        )}

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEDICAL INFORMATION</Text>
          {data.allergies && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Allergies:</Text>
              <Text style={styles.textBlockValue}>{data.allergies}</Text>
            </View>
          )}
          {data.personalMedicalHX && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Medical History:</Text>
              <Text style={styles.textBlockValue}>{data.personalMedicalHX}</Text>
            </View>
          )}
          {data.medications && data.medications.length > 0 && (
            <View style={styles.table}>
              <Text style={styles.textBlockLabel}>Current Medications:</Text>
              <View style={styles.tableHeader}>
                <Text style={{ width: "30%" }}>Medication</Text>
                <Text style={{ width: "20%" }}>Dosage</Text>
                <Text style={{ width: "25%" }}>Frequency</Text>
                <Text style={{ width: "25%" }}>Route</Text>
              </View>
              {data.medications.map((med, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "30%" }}>{med.name}</Text>
                  <Text style={{ width: "20%" }}>{med.dosage || "-"}</Text>
                  <Text style={{ width: "25%" }}>{med.frequency || "-"}</Text>
                  <Text style={{ width: "25%" }}>{med.route || "-"}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Psychiatric Information */}
        {data.personalPsychHX && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PSYCHIATRIC HISTORY</Text>
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Personal Psychiatric History:</Text>
              <Text style={styles.textBlockValue}>{data.personalPsychHX}</Text>
            </View>
          </View>
        )}

        {/* Risk Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RISK ASSESSMENT</Text>

          {/* Danger to Self */}
          <Text style={styles.subSectionTitle}>Danger to Self (DTS)</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Current Suicidal Ideation:</Text>
                <Text style={styles.value}>{data.currentSuicideIdeation ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>History Self-Harm:</Text>
                <Text style={styles.value}>{data.historySelfHarm ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Most Recent Ideation:</Text>
                <Text style={styles.value}>{data.mostRecentSuicideIdeation || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.suicideHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Suicide History:</Text>
              <Text style={styles.textBlockValue}>{data.suicideHistory}</Text>
            </View>
          )}
          {data.suicideAttemptDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Suicide Attempt Details:</Text>
              <Text style={styles.textBlockValue}>{data.suicideAttemptDetails}</Text>
            </View>
          )}
          {data.selfHarmDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Self-Harm Details:</Text>
              <Text style={styles.textBlockValue}>{data.selfHarmDetails}</Text>
            </View>
          )}

          {/* DTS Risk Factors */}
          {data.dtsRiskFactors && Object.keys(data.dtsRiskFactors).length > 0 && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>DTS Risk Factors:</Text>
              <View style={[styles.textBlockValue, { flexDirection: "row", flexWrap: "wrap", gap: 4 }]}>
                {Object.entries(data.dtsRiskFactors)
                  .filter(([, v]) => v)
                  .map(([key]) => (
                    <Text key={key} style={{ fontSize: 8, backgroundColor: "#fed7d7", padding: 2, borderRadius: 2 }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Text>
                  ))}
              </View>
            </View>
          )}

          {/* DTS Protective Factors */}
          {data.dtsProtectiveFactors && Object.keys(data.dtsProtectiveFactors).length > 0 && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>DTS Protective Factors:</Text>
              <View style={[styles.textBlockValue, { flexDirection: "row", flexWrap: "wrap", gap: 4 }]}>
                {Object.entries(data.dtsProtectiveFactors)
                  .filter(([, v]) => v)
                  .map(([key]) => (
                    <Text key={key} style={{ fontSize: 8, backgroundColor: "#c6f6d5", padding: 2, borderRadius: 2 }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Text>
                  ))}
              </View>
            </View>
          )}

          {/* Danger to Others */}
          <Text style={styles.subSectionTitle}>Danger to Others (DTO)</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>History Harming Others:</Text>
                <Text style={styles.value}>{data.historyHarmingOthers ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Homicidal Ideation:</Text>
                <Text style={styles.value}>{data.homicidalIdeation ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Duty to Warn Completed:</Text>
                <Text style={styles.value}>{data.dutyToWarnCompleted ? "Yes" : "No"}</Text>
              </View>
            </View>
          </View>
          {data.harmingOthersDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Harming Others Details:</Text>
              <Text style={styles.textBlockValue}>{data.harmingOthersDetails}</Text>
            </View>
          )}
          {data.homicidalIdeationDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Homicidal Ideation Details:</Text>
              <Text style={styles.textBlockValue}>{data.homicidalIdeationDetails}</Text>
            </View>
          )}
          {data.dutyToWarnDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Duty to Warn Details:</Text>
              <Text style={styles.textBlockValue}>{data.dutyToWarnDetails}</Text>
            </View>
          )}

          {/* DTO Risk Factors */}
          {data.dtoRiskFactors && Object.keys(data.dtoRiskFactors).length > 0 && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>DTO Risk Factors:</Text>
              <View style={[styles.textBlockValue, { flexDirection: "row", flexWrap: "wrap", gap: 4 }]}>
                {Object.entries(data.dtoRiskFactors)
                  .filter(([, v]) => v)
                  .map(([key]) => (
                    <Text key={key} style={{ fontSize: 8, backgroundColor: "#fed7d7", padding: 2, borderRadius: 2 }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Text>
                  ))}
              </View>
            </View>
          )}

          {data.previousHospitalizations && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Previous Hospitalizations:</Text>
              <Text style={styles.textBlockValue}>{data.previousHospitalizations}</Text>
            </View>
          )}
          {data.hospitalizationDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Hospitalization Details:</Text>
              <Text style={styles.textBlockValue}>{data.hospitalizationDetails}</Text>
            </View>
          )}
        </View>

        {/* Developmental History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEVELOPMENTAL HISTORY</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>In Utero Exposure:</Text>
                <Text style={styles.value}>{data.inUteroExposure ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Speech Difficulties:</Text>
                <Text style={styles.value}>{data.speechDifficulties ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Visual Impairment:</Text>
                <Text style={styles.value}>{data.visualImpairment ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Hearing Impairment:</Text>
                <Text style={styles.value}>{data.hearingImpairment ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Motor Skills Impairment:</Text>
                <Text style={styles.value}>{data.motorSkillsImpairment ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Cognitive Impairment:</Text>
                <Text style={styles.value}>{data.cognitiveImpairment ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Social Skills Deficits:</Text>
                <Text style={styles.value}>{data.socialSkillsDeficits ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Immunization Status:</Text>
                <Text style={styles.value}>{data.immunizationStatus || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.inUteroExposureDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>In Utero Exposure Details:</Text>
              <Text style={styles.textBlockValue}>{data.inUteroExposureDetails}</Text>
            </View>
          )}
          {data.developmentalMilestones && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Developmental Milestones:</Text>
              <Text style={styles.textBlockValue}>{data.developmentalMilestones}</Text>
            </View>
          )}
          {data.developmentalDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Developmental Details:</Text>
              <Text style={styles.textBlockValue}>{data.developmentalDetails}</Text>
            </View>
          )}
        </View>

        {/* Skills Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SKILLS ASSESSMENT</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 4 }}>Hygiene Skills:</Text>
              {data.hygieneSkills &&
                Object.entries(data.hygieneSkills).map(([key, value]) => (
                  <View key={key} style={styles.checklistItem}>
                    <Text style={styles.checklistLabel}>{key}:</Text>
                    <Text style={styles.checklistValue}>{value}</Text>
                  </View>
                ))}
            </View>
            <View style={styles.column}>
              <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 4 }}>Additional Skills:</Text>
              {data.skillsContinuation &&
                Object.entries(data.skillsContinuation).map(([key, value]) => (
                  <View key={key} style={styles.checklistItem}>
                    <Text style={styles.checklistLabel}>{key}:</Text>
                    <Text style={styles.checklistValue}>{value}</Text>
                  </View>
                ))}
            </View>
          </View>
        </View>

        {/* PHQ-9 */}
        {data.phq9Responses && data.phq9TotalScore !== null && (
          <View style={styles.phq9Section}>
            <Text style={styles.sectionTitle}>PHQ-9 DEPRESSION SCREENING</Text>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                {PHQ9_QUESTIONS.slice(0, 5).map((q, idx) => (
                  <View key={idx} style={styles.checklistItem}>
                    <Text style={{ width: "80%", fontSize: 8 }}>{q}:</Text>
                    <Text style={{ width: "20%", fontSize: 8 }}>{data.phq9Responses?.[idx] ?? 0}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.column}>
                {PHQ9_QUESTIONS.slice(5).map((q, idx) => (
                  <View key={idx + 5} style={styles.checklistItem}>
                    <Text style={{ width: "80%", fontSize: 8 }}>{q}:</Text>
                    <Text style={{ width: "20%", fontSize: 8 }}>{data.phq9Responses?.[idx + 5] ?? 0}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ marginTop: 8, padding: 6, backgroundColor: "#fff", borderRadius: 3 }}>
              <Text style={styles.phq9Score}>
                Total Score: {data.phq9TotalScore} - {getPHQ9Severity(data.phq9TotalScore)}
              </Text>
            </View>
          </View>
        )}

        {/* Treatment Planning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TREATMENT PLANNING</Text>
          {data.treatmentObjectives && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Treatment Objectives:</Text>
              <Text style={styles.textBlockValue}>{data.treatmentObjectives}</Text>
            </View>
          )}
          {data.dischargePlanObjectives && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Discharge Plan Objectives:</Text>
              <Text style={styles.textBlockValue}>{data.dischargePlanObjectives}</Text>
            </View>
          )}
          {data.supportSystem && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Support System:</Text>
              <Text style={styles.textBlockValue}>{data.supportSystem}</Text>
            </View>
          )}
          {data.communityResources && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Community Resources:</Text>
              <Text style={styles.textBlockValue}>{data.communityResources}</Text>
            </View>
          )}
        </View>

        {/* Social & Education History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOCIAL & EDUCATION HISTORY</Text>
          <Text style={styles.subSectionTitle}>Social History</Text>
          {data.childhoodDescription && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Childhood Description:</Text>
              <Text style={styles.textBlockValue}>{data.childhoodDescription}</Text>
            </View>
          )}
          {data.abuseHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Abuse History:</Text>
              <Text style={styles.textBlockValue}>{data.abuseHistory}</Text>
            </View>
          )}
          {data.familyMentalHealthHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Family Mental Health History:</Text>
              <Text style={styles.textBlockValue}>{data.familyMentalHealthHistory}</Text>
            </View>
          )}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Relationship Status:</Text>
                <Text style={styles.value}>{data.relationshipStatus || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Relationship Satisfaction:</Text>
                <Text style={styles.value}>{data.relationshipSatisfaction || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.friendsDescription && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Friends Description:</Text>
              <Text style={styles.textBlockValue}>{data.friendsDescription}</Text>
            </View>
          )}

          <Text style={styles.subSectionTitle}>Education History</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Highest Education:</Text>
                <Text style={styles.value}>{data.highestEducation || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Special Education:</Text>
                <Text style={styles.value}>{data.specialEducation ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>504 Plan:</Text>
                <Text style={styles.value}>{data.plan504 ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>IEP:</Text>
                <Text style={styles.value}>{data.iep ? "Yes" : "No"}</Text>
              </View>
            </View>
          </View>
          {data.educationDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Education Details:</Text>
              <Text style={styles.textBlockValue}>{data.educationDetails}</Text>
            </View>
          )}

          <Text style={styles.subSectionTitle}>Employment History</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Currently Employed:</Text>
            <Text style={styles.value}>{data.currentlyEmployed ? "Yes" : "No"}</Text>
          </View>
          {data.employmentDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Employment Details:</Text>
              <Text style={styles.textBlockValue}>{data.employmentDetails}</Text>
            </View>
          )}
          {data.workVolunteerHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Work/Volunteer History:</Text>
              <Text style={styles.textBlockValue}>{data.workVolunteerHistory}</Text>
            </View>
          )}
          {data.employmentBarriers && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Employment Barriers:</Text>
              <Text style={styles.textBlockValue}>{data.employmentBarriers}</Text>
            </View>
          )}
        </View>

        {/* Legal & Substance History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL & SUBSTANCE HISTORY</Text>
          <Text style={styles.subSectionTitle}>Legal History</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Court Ordered Treatment:</Text>
            <Text style={styles.value}>{data.courtOrderedTreatment ? "Yes" : "No"}</Text>
          </View>
          {data.criminalLegalHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Criminal/Legal History:</Text>
              <Text style={styles.textBlockValue}>{data.criminalLegalHistory}</Text>
            </View>
          )}
          {data.courtOrderedDetails && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Court Order Details:</Text>
              <Text style={styles.textBlockValue}>{data.courtOrderedDetails}</Text>
            </View>
          )}
          {data.otherLegalIssues && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Other Legal Issues:</Text>
              <Text style={styles.textBlockValue}>{data.otherLegalIssues}</Text>
            </View>
          )}

          <Text style={styles.subSectionTitle}>Substance Use History</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Drug of Choice:</Text>
                <Text style={styles.value}>{data.drugOfChoice || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Nicotine Use:</Text>
                <Text style={styles.value}>{data.nicotineUse ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Longest Sobriety:</Text>
                <Text style={styles.value}>{data.longestSobriety || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.substanceHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Substance History:</Text>
              <Text style={styles.textBlockValue}>{data.substanceHistory}</Text>
            </View>
          )}
          {data.substanceTreatmentHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Substance Treatment History:</Text>
              <Text style={styles.textBlockValue}>{data.substanceTreatmentHistory}</Text>
            </View>
          )}
          {data.substanceImpact && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Impact of Substance Use:</Text>
              <Text style={styles.textBlockValue}>{data.substanceImpact}</Text>
            </View>
          )}
          {data.historyOfAbuse && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>History of Abuse (as victim):</Text>
              <Text style={styles.textBlockValue}>{data.historyOfAbuse}</Text>
            </View>
          )}
        </View>

        {/* Living Situation & ADLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIVING SITUATION & ADLs</Text>
          <Text style={styles.subSectionTitle}>Current Living Situation</Text>
          {data.livingArrangements && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Living Arrangements:</Text>
              <Text style={styles.textBlockValue}>{data.livingArrangements}</Text>
            </View>
          )}
          {data.sourceOfFinances && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Source of Finances:</Text>
              <Text style={styles.textBlockValue}>{data.sourceOfFinances}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Transportation:</Text>
            <Text style={styles.value}>{data.transportationMethod || "N/A"}</Text>
          </View>

          <Text style={styles.subSectionTitle}>Activities of Daily Living</Text>
          {data.adlChecklist && (
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                {Object.entries(data.adlChecklist)
                  .slice(0, Math.ceil(Object.keys(data.adlChecklist).length / 2))
                  .map(([key, value]) => (
                    <View key={key} style={styles.checklistItem}>
                      <Text style={styles.checklistLabel}>{key}:</Text>
                      <Text style={styles.checklistValue}>{value}</Text>
                    </View>
                  ))}
              </View>
              <View style={styles.column}>
                {Object.entries(data.adlChecklist)
                  .slice(Math.ceil(Object.keys(data.adlChecklist).length / 2))
                  .map(([key, value]) => (
                    <View key={key} style={styles.checklistItem}>
                      <Text style={styles.checklistLabel}>{key}:</Text>
                      <Text style={styles.checklistValue}>{value}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Support Level:</Text>
            <Text style={styles.value}>{data.supportLevel || "N/A"}</Text>
          </View>
          {data.typicalDay && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Typical Day:</Text>
              <Text style={styles.textBlockValue}>{data.typicalDay}</Text>
            </View>
          )}
          {data.preferredActivities && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Preferred Activities:</Text>
              <Text style={styles.textBlockValue}>{data.preferredActivities}</Text>
            </View>
          )}
          {data.strengthsAbilitiesInterests && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Strengths, Abilities & Interests:</Text>
              <Text style={styles.textBlockValue}>{data.strengthsAbilitiesInterests}</Text>
            </View>
          )}
          {data.significantOthers && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Significant Others:</Text>
              <Text style={styles.textBlockValue}>{data.significantOthers}</Text>
            </View>
          )}
        </View>

        {/* Behavioral Observations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLINICAL BEHAVIORAL OBSERVATIONS</Text>

          <Text style={styles.subSectionTitle}>Appearance</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Apparent Age:</Text>
                <Text style={styles.value}>{data.appearanceAge || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Height:</Text>
                <Text style={styles.value}>{data.appearanceHeight || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Weight:</Text>
                <Text style={styles.value}>{data.appearanceWeight || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Attire:</Text>
                <Text style={styles.value}>{data.appearanceAttire || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Grooming:</Text>
                <Text style={styles.value}>{data.appearanceGrooming || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.appearanceDescription && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Appearance Description:</Text>
              <Text style={styles.textBlockValue}>{data.appearanceDescription}</Text>
            </View>
          )}

          <Text style={styles.subSectionTitle}>Demeanor</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Mood:</Text>
                <Text style={styles.value}>{data.demeanorMood || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Affect:</Text>
                <Text style={styles.value}>{data.demeanorAffect || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Eye Contact:</Text>
                <Text style={styles.value}>{data.demeanorEyeContact || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Cooperation:</Text>
                <Text style={styles.value}>{data.demeanorCooperation || "N/A"}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.subSectionTitle}>Speech</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Articulation:</Text>
                <Text style={styles.value}>{data.speechArticulation || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tone:</Text>
                <Text style={styles.value}>{data.speechTone || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Rate:</Text>
                <Text style={styles.value}>{data.speechRate || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Latency:</Text>
                <Text style={styles.value}>{data.speechLatency || "N/A"}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.subSectionTitle}>Motor</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Gait:</Text>
                <Text style={styles.value}>{data.motorGait || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Posture:</Text>
                <Text style={styles.value}>{data.motorPosture || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Activity Level:</Text>
                <Text style={styles.value}>{data.motorActivity || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Mannerisms:</Text>
                <Text style={styles.value}>{data.motorMannerisms || "N/A"}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.subSectionTitle}>Cognition</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Thought Content:</Text>
                <Text style={styles.value}>{data.cognitionThoughtContent || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Thought Process:</Text>
                <Text style={styles.value}>{data.cognitionThoughtProcess || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Delusions:</Text>
                <Text style={styles.value}>{data.cognitionDelusions || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Perception:</Text>
                <Text style={styles.value}>{data.cognitionPerception || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Judgment:</Text>
                <Text style={styles.value}>{data.cognitionJudgment || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Impulse Control:</Text>
                <Text style={styles.value}>{data.cognitionImpulseControl || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Insight:</Text>
                <Text style={styles.value}>{data.cognitionInsight || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Est. Intelligence:</Text>
                <Text style={styles.value}>{data.estimatedIntelligence || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.cognitionDescription && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Cognition Notes:</Text>
              <Text style={styles.textBlockValue}>{data.cognitionDescription}</Text>
            </View>
          )}
        </View>

        {/* Diagnosis & Treatment */}
        {(data.diagnosis || data.treatmentRecommendation) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DIAGNOSIS & TREATMENT</Text>
            {data.diagnosis && (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockLabel}>Diagnosis:</Text>
                <Text style={styles.textBlockValue}>{data.diagnosis}</Text>
              </View>
            )}
            {data.treatmentRecommendation && (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockLabel}>Treatment Recommendation:</Text>
                <Text style={styles.textBlockValue}>{data.treatmentRecommendation}</Text>
              </View>
            )}
          </View>
        )}

        {/* Wellness */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WELLNESS & NEEDS</Text>
          {data.healthNeeds && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Health Needs:</Text>
              <Text style={styles.textBlockValue}>{data.healthNeeds}</Text>
            </View>
          )}
          {data.nutritionalNeeds && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Nutritional Needs:</Text>
              <Text style={styles.textBlockValue}>{data.nutritionalNeeds}</Text>
            </View>
          )}
          {data.spiritualNeeds && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Spiritual Needs:</Text>
              <Text style={styles.textBlockValue}>{data.spiritualNeeds}</Text>
            </View>
          )}
          {data.culturalNeeds && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Cultural Needs:</Text>
              <Text style={styles.textBlockValue}>{data.culturalNeeds}</Text>
            </View>
          )}
        </View>

        {/* Crisis & Discharge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CRISIS & DISCHARGE PLANNING</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Feedback Frequency:</Text>
            <Text style={styles.value}>{data.feedbackFrequency || "N/A"}</Text>
          </View>
          {data.dischargePlanning && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Discharge Planning:</Text>
              <Text style={styles.textBlockValue}>{data.dischargePlanning}</Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>
          <Text style={{ fontSize: 8, marginBottom: 15 }}>Client/Guardian: _________________________________ Date: _____________</Text>
          <Text style={{ fontSize: 8, marginBottom: 15 }}>Assessment Completed By: _________________________ Date: _____________</Text>
          <Text style={{ fontSize: 8 }}>Clinical Oversight / BHP Reviewer: __________________ Date: _____________</Text>
        </View>
      </Page>
    </Document>
  );
}
