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
  subSectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
    marginTop: 6,
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
  threeColumn: {
    flexDirection: "row",
    gap: 8,
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
  dimensionBox: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#f0fff4",
    borderRadius: 3,
    border: "1 solid #c6f6d5",
  },
  dimensionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2f855a",
    marginBottom: 6,
  },
  severityBadge: {
    flexDirection: "row",
    marginTop: 6,
    padding: 4,
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  severityLabel: {
    fontSize: 8,
    color: "#4a5568",
    marginRight: 4,
  },
  severityValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a365d",
  },
  riskAlert: {
    backgroundColor: "#fed7d7",
    padding: 8,
    borderRadius: 3,
    marginBottom: 12,
    border: "1 solid #feb2b2",
  },
  riskAlertTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#c53030",
    marginBottom: 4,
  },
  riskAlertText: {
    fontSize: 9,
    color: "#742a2a",
  },
  dsm5Box: {
    backgroundColor: "#ebf8ff",
    padding: 8,
    borderRadius: 3,
    marginBottom: 8,
  },
  locBox: {
    backgroundColor: "#faf5ff",
    padding: 10,
    borderRadius: 3,
    marginBottom: 10,
    border: "1 solid #e9d8fd",
  },
  locTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#553c9a",
    marginBottom: 6,
  },
  table: {
    marginTop: 4,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
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
});

interface SubstanceUseEntry {
  substance: string;
  routeOfAdministration?: string;
  ageFirstUsed?: string;
  ageRegularUse?: string;
  lastUse?: string;
  frequency?: string;
  amount?: string;
}

interface ASAMData {
  id: string;
  patientName: string;
  dateOfBirth: string;
  admissionDate: string | null;
  assessmentDate: string;
  phoneNumber: string | null;
  okayToLeaveVoicemail: boolean;
  patientAddress: string | null;
  age: number | null;
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

  // Dimension 1
  substanceUseHistory: SubstanceUseEntry[] | null;
  usingMoreThanIntended: boolean;
  usingMoreDetails: string | null;
  physicallyIllWhenStopping: boolean;
  physicallyIllDetails: string | null;
  currentWithdrawalSymptoms: boolean;
  withdrawalSymptomsDetails: string | null;
  historyOfSeriousWithdrawal: boolean;
  seriousWithdrawalDetails: string | null;
  toleranceIncreased: boolean;
  toleranceDetails: string | null;
  recentUseChanges: boolean;
  recentUseChangesDetails: string | null;
  familySubstanceHistory: string | null;
  dimension1Severity: number | null;
  dimension1Comments: string | null;

  // Dimension 2
  medicalProviders: { name?: string; specialty?: string; contact?: string }[] | null;
  medicalConditions: Record<string, boolean> | null;
  conditionsInterfere: boolean;
  conditionsInterfereDetails: string | null;
  priorHospitalizations: string | null;
  lifeThreatening: boolean;
  medicalMedications: { medication?: string; dose?: string; reason?: string; effectiveness?: string }[] | null;
  dimension2Severity: number | null;
  dimension2Comments: string | null;

  // Dimension 3
  moodSymptoms: Record<string, boolean> | null;
  anxietySymptoms: Record<string, boolean> | null;
  psychosisSymptoms: Record<string, boolean> | null;
  otherSymptoms: Record<string, boolean> | null;
  suicidalThoughts: boolean;
  suicidalThoughtsDetails: string | null;
  thoughtsOfHarmingOthers: boolean;
  harmingOthersDetails: string | null;
  abuseHistory: string | null;
  traumaticEvents: string | null;
  mentalIllnessDiagnosed: boolean;
  mentalIllnessDetails: string | null;
  previousPsychTreatment: boolean;
  psychTreatmentDetails: string | null;
  hallucinationsPresent: boolean;
  hallucinationsDetails: string | null;
  furtherMHAssessmentNeeded: boolean;
  furtherMHAssessmentDetails: string | null;
  psychiatricMedications: { medication?: string; dose?: string; reason?: string; effectiveness?: string }[] | null;
  mentalHealthProviders: { name?: string; specialty?: string; contact?: string }[] | null;
  dimension3Severity: number | null;
  dimension3Comments: string | null;

  // Dimension 4
  areasAffectedByUse: Record<string, boolean> | null;
  continueUseDespiteEffects: boolean;
  continueUseDetails: string | null;
  previousTreatmentHelp: boolean;
  treatmentProviders: { name?: string; specialty?: string; contact?: string }[] | null;
  recoverySupport: string | null;
  recoveryBarriers: string | null;
  treatmentImportanceAlcohol: number | null;
  treatmentImportanceDrugs: number | null;
  treatmentImportanceDetails: string | null;
  dimension4Severity: number | null;
  dimension4Comments: string | null;

  // Dimension 5
  cravingsFrequencyAlcohol: number | null;
  cravingsFrequencyDrugs: number | null;
  cravingsDetails: string | null;
  timeSearchingForSubstances: boolean;
  timeSearchingDetails: string | null;
  relapseWithoutTreatment: boolean;
  relapseDetails: string | null;
  awareOfTriggers: boolean;
  triggersList: string | null;
  copingWithTriggers: string | null;
  attemptsToControl: string | null;
  longestSobriety: string | null;
  whatHelped: string | null;
  whatDidntHelp: string | null;
  dimension5Severity: number | null;
  dimension5Comments: string | null;

  // Dimension 6
  supportiveRelationships: string | null;
  currentLivingSituation: string | null;
  othersUsingDrugsInEnvironment: boolean;
  othersUsingDetails: string | null;
  safetyThreats: boolean;
  safetyThreatsDetails: string | null;
  negativeImpactRelationships: boolean;
  negativeImpactDetails: string | null;
  currentlyEmployedOrSchool: boolean;
  employmentSchoolDetails: string | null;
  socialServicesInvolved: boolean;
  socialServicesDetails: string | null;
  probationParoleOfficer: string | null;
  probationParoleContact: string | null;
  dimension6Severity: number | null;
  dimension6Comments: string | null;

  // Summary
  summaryRationale: string | null;
  dsm5Criteria: Record<string, boolean> | null;
  dsm5Diagnoses: string | null;
  levelOfCareDetermination: string | null;
  matInterested: boolean;
  matDetails: string | null;

  // Placement
  recommendedLevelOfCare: string | null;
  levelOfCareProvided: string | null;
  discrepancyReason: string | null;
  discrepancyExplanation: string | null;
  designatedTreatmentLocation: string | null;
  designatedProviderName: string | null;

  // Signatures
  counselorName: string | null;
  counselorSignatureDate: string | null;
  bhpLphaName: string | null;
  bhpLphaSignatureDate: string | null;

  // Workflow
  status: "DRAFT" | "PENDING" | "APPROVED" | "CONDITIONAL" | "DENIED";
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  facility: {
    name: string;
  };
  bhpName: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getSeverityLabel(severity: number | null): string {
  if (severity === null) return "Not Rated";
  const labels = ["None (0)", "Mild (1)", "Moderate (2)", "Severe (3)", "Very Severe (4)"];
  return labels[severity] || "Not Rated";
}

function getCheckedItems(record: Record<string, boolean> | null | undefined): string[] {
  if (!record || typeof record !== 'object' || Object.keys(record).length === 0) return [];
  return Object.entries(record)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/([A-Z])/g, " $1").trim());
}

function isValidRecord(val: unknown): val is Record<string, boolean> {
  return val !== null && val !== undefined && typeof val === 'object' && Object.keys(val).length > 0;
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0;
}

function Header({ data, showConfidential = false }: { data: ASAMData; showConfidential?: boolean }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.title}>ASAM Assessment</Text>
      <Text style={styles.subtitle}>
        {data.facility.name} | Managed by {data.bhpName}
      </Text>
      <View style={styles.headerInfo}>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>Patient:</Text>
          <Text style={styles.headerInfoValue}>{data.patientName}</Text>
        </View>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>DOB:</Text>
          <Text style={styles.headerInfoValue}>{formatDate(data.dateOfBirth)}</Text>
        </View>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>Admission Date:</Text>
          <Text style={styles.headerInfoValue}>{data.admissionDate ? formatDate(data.admissionDate) : "N/A"}</Text>
        </View>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>AHCCCS/Policy:</Text>
          <Text style={styles.headerInfoValue}>{data.ahcccsId || "N/A"}</Text>
        </View>
      </View>
      <View style={styles.headerInfo}>
        <View style={styles.headerInfoItem}>
          <Text style={styles.headerInfoLabel}>Recommended LOC:</Text>
          <Text style={styles.headerInfoValue}>{data.recommendedLevelOfCare || "N/A"}</Text>
        </View>
      </View>
      {showConfidential && (
        <View style={styles.confidentialBanner}>
          <Text style={styles.confidentialText}>
            CONFIDENTIAL - PROTECTED HEALTH INFORMATION (PHI)
          </Text>
        </View>
      )}
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

export function ASAMPDF({ data }: { data: ASAMData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <Header data={data} showConfidential />
        <Footer id={data.id} />

        {/* Risk Alerts */}
        {(data.suicidalThoughts || data.thoughtsOfHarmingOthers) && (
          <View style={styles.riskAlert} wrap={false}>
            <Text style={styles.riskAlertTitle}>RISK ALERT</Text>
            {data.suicidalThoughts && (
              <Text style={styles.riskAlertText}>
                Patient has reported suicidal thoughts
                {data.suicidalThoughtsDetails && `: ${data.suicidalThoughtsDetails}`}
              </Text>
            )}
            {data.thoughtsOfHarmingOthers && (
              <Text style={styles.riskAlertText}>
                Patient has reported thoughts of harming others
                {data.harmingOthersDetails && `: ${data.harmingOthersDetails}`}
              </Text>
            )}
          </View>
        )}

        {/* Demographics */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>PATIENT DEMOGRAPHICS</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{data.patientName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Birth:</Text>
                <Text style={styles.value}>{formatDate(data.dateOfBirth)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Age:</Text>
                <Text style={styles.value}>{data.age || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Gender:</Text>
                <Text style={styles.value}>{data.gender || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Race/Ethnicity:</Text>
                <Text style={styles.value}>{data.raceEthnicity || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{data.phoneNumber || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Language:</Text>
                <Text style={styles.value}>{data.preferredLanguage || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Insurance:</Text>
                <Text style={styles.value}>{data.insuranceType || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>AHCCCS ID:</Text>
                <Text style={styles.value}>{data.ahcccsId || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Living Arrangement:</Text>
                <Text style={styles.value}>{data.livingArrangement || "N/A"}</Text>
              </View>
            </View>
          </View>
          {data.patientAddress && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Address:</Text>
              <Text style={styles.textBlockValue}>{data.patientAddress}</Text>
            </View>
          )}
          {data.reasonForTreatment && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Reason for Treatment:</Text>
              <Text style={styles.textBlockValue}>{data.reasonForTreatment}</Text>
            </View>
          )}
          {data.currentSymptoms && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Current Symptoms:</Text>
              <Text style={styles.textBlockValue}>{data.currentSymptoms}</Text>
            </View>
          )}
        </View>

        {/* Dimension 1: Substance Use */}
        <View style={styles.dimensionBox}>
          <Text style={styles.dimensionTitle}>DIMENSION 1: ACUTE INTOXICATION / WITHDRAWAL POTENTIAL</Text>

          {data.substanceUseHistory && data.substanceUseHistory.length > 0 && (
            <View style={styles.table}>
              <Text style={styles.textBlockLabel}>Substance Use History:</Text>
              <View style={styles.tableHeader}>
                <Text style={{ width: "18%" }}>Substance</Text>
                <Text style={{ width: "14%" }}>Route</Text>
                <Text style={{ width: "14%" }}>First Use</Text>
                <Text style={{ width: "14%" }}>Regular</Text>
                <Text style={{ width: "14%" }}>Last Use</Text>
                <Text style={{ width: "14%" }}>Frequency</Text>
                <Text style={{ width: "12%" }}>Amount</Text>
              </View>
              {data.substanceUseHistory.map((entry, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "18%" }}>{entry.substance}</Text>
                  <Text style={{ width: "14%" }}>{entry.routeOfAdministration || "-"}</Text>
                  <Text style={{ width: "14%" }}>{entry.ageFirstUsed || "-"}</Text>
                  <Text style={{ width: "14%" }}>{entry.ageRegularUse || "-"}</Text>
                  <Text style={{ width: "14%" }}>{entry.lastUse || "-"}</Text>
                  <Text style={{ width: "14%" }}>{entry.frequency || "-"}</Text>
                  <Text style={{ width: "12%" }}>{entry.amount || "-"}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Using More Than Intended:</Text>
                <Text style={styles.value}>{data.usingMoreThanIntended ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Physically Ill When Stopping:</Text>
                <Text style={styles.value}>{data.physicallyIllWhenStopping ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Current Withdrawal Symptoms:</Text>
                <Text style={styles.value}>{data.currentWithdrawalSymptoms ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>History Serious Withdrawal:</Text>
                <Text style={styles.value}>{data.historyOfSeriousWithdrawal ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tolerance Increased:</Text>
                <Text style={styles.value}>{data.toleranceIncreased ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Recent Use Changes:</Text>
                <Text style={styles.value}>{data.recentUseChanges ? "Yes" : "No"}</Text>
              </View>
            </View>
          </View>

          {data.familySubstanceHistory && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Family Substance History:</Text>
              <Text style={styles.textBlockValue}>{data.familySubstanceHistory}</Text>
            </View>
          )}
          {data.dimension1Comments && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Comments:</Text>
              <Text style={styles.textBlockValue}>{data.dimension1Comments}</Text>
            </View>
          )}

          <View style={styles.severityBadge}>
            <Text style={styles.severityLabel}>Severity Rating:</Text>
            <Text style={styles.severityValue}>{getSeverityLabel(data.dimension1Severity)}</Text>
          </View>
        </View>

        {/* Dimension 2: Biomedical */}
        <View style={styles.dimensionBox}>
          <Text style={styles.dimensionTitle}>DIMENSION 2: BIOMEDICAL CONDITIONS</Text>

          {isValidRecord(data.medicalConditions) && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Medical Conditions:</Text>
              <Text style={styles.textBlockValue}>
                {getCheckedItems(data.medicalConditions).join(", ") || "None reported"}
              </Text>
            </View>
          )}

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Conditions Interfere:</Text>
                <Text style={styles.value}>{data.conditionsInterfere ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Life-Threatening:</Text>
                <Text style={styles.value}>{data.lifeThreatening ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              {data.medicalProviders && data.medicalProviders.length > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Medical Providers:</Text>
                  <Text style={styles.value}>
                    {data.medicalProviders.map(p => p.name || "Unknown").join(", ")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {data.priorHospitalizations && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Prior Hospitalizations:</Text>
              <Text style={styles.textBlockValue}>{data.priorHospitalizations}</Text>
            </View>
          )}
          {data.medicalMedications && data.medicalMedications.length > 0 && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Medical Medications:</Text>
              <Text style={styles.textBlockValue}>
                {data.medicalMedications.map(m => m.medication || "Unknown").join(", ")}
              </Text>
            </View>
          )}
          {data.dimension2Comments && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Comments:</Text>
              <Text style={styles.textBlockValue}>{data.dimension2Comments}</Text>
            </View>
          )}

          <View style={styles.severityBadge}>
            <Text style={styles.severityLabel}>Severity Rating:</Text>
            <Text style={styles.severityValue}>{getSeverityLabel(data.dimension2Severity)}</Text>
          </View>
        </View>

        {/* Dimension 3: Emotional/Behavioral/Cognitive */}
        <View style={styles.dimensionBox}>
          <Text style={styles.dimensionTitle}>DIMENSION 3: EMOTIONAL, BEHAVIORAL & COGNITIVE CONDITIONS</Text>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              {isValidRecord(data.moodSymptoms) && (
                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>Mood Symptoms:</Text>
                  <Text style={{ fontSize: 8 }}>
                    {getCheckedItems(data.moodSymptoms).join(", ") || "None"}
                  </Text>
                </View>
              )}
              {isValidRecord(data.anxietySymptoms) && (
                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>Anxiety Symptoms:</Text>
                  <Text style={{ fontSize: 8 }}>
                    {getCheckedItems(data.anxietySymptoms).join(", ") || "None"}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.column}>
              {isValidRecord(data.psychosisSymptoms) && (
                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>Psychosis Symptoms:</Text>
                  <Text style={{ fontSize: 8 }}>
                    {getCheckedItems(data.psychosisSymptoms).join(", ") || "None"}
                  </Text>
                </View>
              )}
              {isValidRecord(data.otherSymptoms) && (
                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>Other Symptoms:</Text>
                  <Text style={{ fontSize: 8 }}>
                    {getCheckedItems(data.otherSymptoms).join(", ") || "None"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Abuse History:</Text>
                <Text style={styles.value}>{data.abuseHistory || "No history reported"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Mental Illness Diagnosed:</Text>
                <Text style={styles.value}>{data.mentalIllnessDiagnosed ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Previous Psych Treatment:</Text>
                <Text style={styles.value}>{data.previousPsychTreatment ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Hallucinations Present:</Text>
                <Text style={styles.value}>{data.hallucinationsPresent ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Further MH Assessment Needed:</Text>
                <Text style={styles.value}>{data.furtherMHAssessmentNeeded ? "Yes" : "No"}</Text>
              </View>
            </View>
          </View>

          {data.traumaticEvents && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Traumatic Events:</Text>
              <Text style={styles.textBlockValue}>{data.traumaticEvents}</Text>
            </View>
          )}
          {data.psychiatricMedications && data.psychiatricMedications.length > 0 && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Psychiatric Medications:</Text>
              <Text style={styles.textBlockValue}>
                {data.psychiatricMedications.map(m => m.medication || "Unknown").join(", ")}
              </Text>
            </View>
          )}
          {data.dimension3Comments && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Comments:</Text>
              <Text style={styles.textBlockValue}>{data.dimension3Comments}</Text>
            </View>
          )}

          <View style={styles.severityBadge}>
            <Text style={styles.severityLabel}>Severity Rating:</Text>
            <Text style={styles.severityValue}>{getSeverityLabel(data.dimension3Severity)}</Text>
          </View>
        </View>

        {/* Dimension 4: Readiness to Change */}
        <View style={styles.dimensionBox}>
          <Text style={styles.dimensionTitle}>DIMENSION 4: READINESS TO CHANGE</Text>

          {isValidRecord(data.areasAffectedByUse) && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Areas Affected by Use:</Text>
              <Text style={styles.textBlockValue}>
                {getCheckedItems(data.areasAffectedByUse).join(", ") || "None reported"}
              </Text>
            </View>
          )}

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Continue Use Despite Effects:</Text>
                <Text style={styles.value}>{data.continueUseDespiteEffects ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Treatment Importance (Alcohol):</Text>
                <Text style={styles.value}>{data.treatmentImportanceAlcohol ?? "N/A"}/10</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Treatment Importance (Drugs):</Text>
                <Text style={styles.value}>{data.treatmentImportanceDrugs ?? "N/A"}/10</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Previous Treatment Helped:</Text>
            <Text style={styles.value}>{data.previousTreatmentHelp ? "Yes" : "No"}</Text>
          </View>
          {data.recoverySupport && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Recovery Support:</Text>
              <Text style={styles.textBlockValue}>{data.recoverySupport}</Text>
            </View>
          )}
          {data.recoveryBarriers && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Recovery Barriers:</Text>
              <Text style={styles.textBlockValue}>{data.recoveryBarriers}</Text>
            </View>
          )}
          {data.dimension4Comments && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Comments:</Text>
              <Text style={styles.textBlockValue}>{data.dimension4Comments}</Text>
            </View>
          )}

          <View style={styles.severityBadge}>
            <Text style={styles.severityLabel}>Severity Rating:</Text>
            <Text style={styles.severityValue}>{getSeverityLabel(data.dimension4Severity)}</Text>
          </View>
        </View>

        {/* Dimension 5: Relapse Potential */}
        <View style={styles.dimensionBox}>
          <Text style={styles.dimensionTitle}>DIMENSION 5: RELAPSE, CONTINUED USE, OR CONTINUED PROBLEM POTENTIAL</Text>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Cravings (Alcohol):</Text>
                <Text style={styles.value}>{data.cravingsFrequencyAlcohol ?? "N/A"}/10</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Cravings (Drugs):</Text>
                <Text style={styles.value}>{data.cravingsFrequencyDrugs ?? "N/A"}/10</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Aware of Triggers:</Text>
                <Text style={styles.value}>{data.awareOfTriggers ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Time Searching for Substances:</Text>
                <Text style={styles.value}>{data.timeSearchingForSubstances ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Relapse Without Treatment:</Text>
                <Text style={styles.value}>{data.relapseWithoutTreatment ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Longest Sobriety:</Text>
                <Text style={styles.value}>{data.longestSobriety || "N/A"}</Text>
              </View>
            </View>
          </View>

          {isNonEmptyString(data.triggersList) && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Triggers:</Text>
              <Text style={styles.textBlockValue}>{data.triggersList}</Text>
            </View>
          )}
          {data.copingWithTriggers && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Coping With Triggers:</Text>
              <Text style={styles.textBlockValue}>{data.copingWithTriggers}</Text>
            </View>
          )}
          {data.whatHelped && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>What Helped:</Text>
              <Text style={styles.textBlockValue}>{data.whatHelped}</Text>
            </View>
          )}
          {data.dimension5Comments && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Comments:</Text>
              <Text style={styles.textBlockValue}>{data.dimension5Comments}</Text>
            </View>
          )}

          <View style={styles.severityBadge}>
            <Text style={styles.severityLabel}>Severity Rating:</Text>
            <Text style={styles.severityValue}>{getSeverityLabel(data.dimension5Severity)}</Text>
          </View>
        </View>

        {/* Dimension 6: Recovery Environment */}
        <View style={styles.dimensionBox}>
          <Text style={styles.dimensionTitle}>DIMENSION 6: RECOVERY / LIVING ENVIRONMENT</Text>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Others Using in Environment:</Text>
                <Text style={styles.value}>{data.othersUsingDrugsInEnvironment ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Safety Threats:</Text>
                <Text style={styles.value}>{data.safetyThreats ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Negative Impact Relationships:</Text>
                <Text style={styles.value}>{data.negativeImpactRelationships ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Employed/In School:</Text>
                <Text style={styles.value}>{data.currentlyEmployedOrSchool ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Social Services Involved:</Text>
                <Text style={styles.value}>{data.socialServicesInvolved ? "Yes" : "No"}</Text>
              </View>
            </View>
          </View>

          {data.supportiveRelationships && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Supportive Relationships:</Text>
              <Text style={styles.textBlockValue}>{data.supportiveRelationships}</Text>
            </View>
          )}
          {data.currentLivingSituation && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Current Living Situation:</Text>
              <Text style={styles.textBlockValue}>{data.currentLivingSituation}</Text>
            </View>
          )}
          {data.probationParoleOfficer && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Probation/Parole Officer:</Text>
              <Text style={styles.textBlockValue}>
                {data.probationParoleOfficer}
                {data.probationParoleContact && ` (${data.probationParoleContact})`}
              </Text>
            </View>
          )}
          {data.dimension6Comments && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Comments:</Text>
              <Text style={styles.textBlockValue}>{data.dimension6Comments}</Text>
            </View>
          )}

          <View style={styles.severityBadge}>
            <Text style={styles.severityLabel}>Severity Rating:</Text>
            <Text style={styles.severityValue}>{getSeverityLabel(data.dimension6Severity)}</Text>
          </View>
        </View>

        {/* DSM-5 Diagnosis */}
        <View style={styles.dsm5Box} wrap={false}>
          <Text style={styles.sectionTitle}>DSM-5 SUBSTANCE USE DISORDER CRITERIA</Text>

          {isValidRecord(data.dsm5Criteria) && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Criteria Met:</Text>
              <Text style={styles.textBlockValue}>
                {getCheckedItems(data.dsm5Criteria).join(", ") || "None documented"}
              </Text>
            </View>
          )}

          {data.dsm5Diagnoses && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>DSM-5 Diagnoses:</Text>
              <Text style={styles.textBlockValue}>{data.dsm5Diagnoses}</Text>
            </View>
          )}
        </View>

        {/* Level of Care Determination */}
        <View style={styles.locBox} wrap={false}>
          <Text style={styles.locTitle}>LEVEL OF CARE DETERMINATION</Text>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Recommended Level of Care:</Text>
                <Text style={styles.value}>{data.recommendedLevelOfCare || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Level of Care Provided:</Text>
                <Text style={styles.value}>{data.levelOfCareProvided || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>MAT Interested:</Text>
                <Text style={styles.value}>{data.matInterested ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Treatment Location:</Text>
                <Text style={styles.value}>{data.designatedTreatmentLocation || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Provider Name:</Text>
                <Text style={styles.value}>{data.designatedProviderName || "N/A"}</Text>
              </View>
            </View>
          </View>

          {data.levelOfCareDetermination && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Level of Care Determination Rationale:</Text>
              <Text style={styles.textBlockValue}>{data.levelOfCareDetermination}</Text>
            </View>
          )}

          {data.discrepancyReason && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Discrepancy Reason:</Text>
              <Text style={styles.textBlockValue}>{data.discrepancyReason}</Text>
            </View>
          )}

          {data.summaryRationale && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Summary Rationale:</Text>
              <Text style={styles.textBlockValue}>{data.summaryRationale}</Text>
            </View>
          )}
        </View>

        {/* BHP Decision (if reviewed) */}
        {data.status !== "PENDING" && data.status !== "DRAFT" && data.decisionReason && (
          <View style={[styles.section, {
            backgroundColor: data.status === "APPROVED" ? "#c6f6d5" :
                           data.status === "CONDITIONAL" ? "#fefcbf" : "#fed7d7",
            padding: 10,
            borderRadius: 3
          }]} wrap={false}>
            <Text style={styles.sectionTitle}>BHP DECISION</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{data.status}</Text>
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Decision Reason:</Text>
              <Text style={styles.textBlockValue}>{data.decisionReason}</Text>
            </View>
            {data.decidedAt && (
              <View style={styles.row}>
                <Text style={styles.label}>Decision Date:</Text>
                <Text style={styles.value}>{formatDate(data.decidedAt)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              {data.counselorName ? (
                <Text style={styles.signatureValue}>{data.counselorName}</Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>Counselor / Assessor</Text>
            </View>
            <View style={styles.dateBlock}>
              {data.counselorSignatureDate ? (
                <Text style={styles.signatureValue}>{formatDate(data.counselorSignatureDate)}</Text>
              ) : (
                <View style={styles.dateLine} />
              )}
              <Text style={styles.dateLabel}>Date</Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              {data.bhpLphaName ? (
                <Text style={styles.signatureValue}>{data.bhpLphaName}</Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>BHP / LPHA</Text>
            </View>
            <View style={styles.dateBlock}>
              {data.bhpLphaSignatureDate ? (
                <Text style={styles.signatureValue}>{formatDate(data.bhpLphaSignatureDate)}</Text>
              ) : (
                <View style={styles.dateLine} />
              )}
              <Text style={styles.dateLabel}>Date</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
