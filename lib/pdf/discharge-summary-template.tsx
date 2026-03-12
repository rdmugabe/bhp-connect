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
    paddingTop: 60,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
  },
  pageHeader: {
    position: "absolute",
    top: 15,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 8,
    fontSize: 8,
    color: "#4a5568",
  },
  pageHeaderLeft: {
    flexDirection: "column",
  },
  pageHeaderRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  pageHeaderItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  pageHeaderLabel: {
    color: "#718096",
    marginRight: 4,
  },
  pageHeaderValue: {
    fontWeight: "bold",
    color: "#1a365d",
  },
  header: {
    marginBottom: 15,
    borderBottom: "2 solid #1a365d",
    paddingBottom: 10,
  },
  facilityName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    color: "#4a5568",
    textAlign: "center",
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
  signatureSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f7fafc",
    borderRadius: 3,
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
  statusBadge: {
    backgroundColor: "#48bb78",
    color: "white",
    padding: 4,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    width: 80,
  },
  objectiveTable: {
    marginTop: 6,
    marginBottom: 10,
  },
  objectiveRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    padding: 4,
  },
  objectiveText: {
    flex: 2,
    fontSize: 8,
  },
  objectiveStatus: {
    flex: 1,
    fontSize: 8,
    textAlign: "center",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  serviceItem: {
    width: "33%",
    fontSize: 8,
    padding: 2,
  },
  medicationTable: {
    marginTop: 6,
  },
  referralBlock: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: "#f7fafc",
    borderRadius: 3,
  },
});

interface DischargeSummaryData {
  // Resident Info (from Intake)
  residentName: string;
  dateOfBirth: string;
  ahcccsId: string;
  admissionDate: string;

  // Facility Info
  facilityName: string;

  // Discharge Info
  dischargeDate: string;
  dischargeStartTime?: string;
  dischargeEndTime?: string;
  enrolledProgram?: string;
  dischargeType?: string;
  recommendedLevelOfCare?: string;

  // Contact Info
  contactPhoneAfterDischarge?: string;
  contactAddressAfterDischarge?: string;

  // Clinical Info - Prefilled from Intake/ASAM
  diagnoses?: string;
  allergies?: string;
  asamLevelOfCare?: string;

  // Clinical Content
  presentingIssuesAtAdmission?: string;
  treatmentSummary?: string;
  objectivesAttained?: Array<{
    objective: string;
    attained: string;
  }>;
  objectiveNarratives?: {
    fullyAttained?: string;
    partiallyAttained?: string;
    notAttained?: string;
  };
  completedServices?: string[];
  dischargeSummaryNarrative?: string;
  dischargingTo?: string;

  // Personal Items
  personalItemsReceived?: boolean;
  personalItemsStoredDays?: number;
  itemsRemainAtFacility?: boolean;

  // Medications
  dischargeMedications?: Array<{
    medication: string;
    dosage?: string;
    frequency?: string;
    prescriber?: string;
  }>;

  // Referrals
  serviceReferrals?: Array<{
    service: string;
    provider?: string;
    phone?: string;
    address?: string;
    appointmentDate?: string;
  }>;

  // Clinical Recommendations
  clinicalRecommendations?: string;

  // Relapse Prevention & Crisis
  relapsePreventionPlan?: string;
  crisisResources?: string;

  // Patient Education
  patientEducationProvided?: string;
  specialInstructions?: string;
  culturalPreferencesConsidered?: boolean;
  suicidePreventionEducation?: string;

  // Signatures
  clientSignature?: string;
  clientSignatureDate?: string;
  staffSignature?: string;
  staffCredentials?: string;
  staffSignatureDate?: string;
  reviewerSignature?: string;
  reviewerCredentials?: string;
  reviewerSignatureDate?: string;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    // Use UTC methods to avoid timezone shifting
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
}

function PageHeader({ data }: { data: DischargeSummaryData }) {
  return (
    <View style={styles.pageHeader} fixed>
      <View style={styles.pageHeaderLeft}>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>Name:</Text>
          <Text style={styles.pageHeaderValue}>{data.residentName}</Text>
        </View>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>DOB:</Text>
          <Text style={styles.pageHeaderValue}>{formatDate(data.dateOfBirth)}</Text>
        </View>
      </View>
      <View style={styles.pageHeaderRight}>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>AHCCCS ID:</Text>
          <Text style={styles.pageHeaderValue}>{data.ahcccsId || "N/A"}</Text>
        </View>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>Discharge Date:</Text>
          <Text style={styles.pageHeaderValue}>{formatDate(data.dischargeDate)}</Text>
        </View>
      </View>
    </View>
  );
}

function PageFooter({ facilityName }: { facilityName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {facilityName} | Discharge Summary | Confidential
      </Text>
    </View>
  );
}

export function DischargeSummaryDocument({ data }: { data: DischargeSummaryData }) {
  return (
    <Document>
      {/* Page 1: Header & Discharge Info */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />

        <View style={styles.header}>
          <Text style={styles.facilityName}>{data.facilityName}</Text>
          <Text style={styles.title}>Discharge Summary</Text>
          <View style={styles.confidentialBanner}>
            <Text style={styles.confidentialText}>
              CONFIDENTIAL - PROTECTED HEALTH INFORMATION
            </Text>
          </View>
        </View>

        {/* Resident Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resident Information</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Resident Name:</Text>
                <Text style={styles.value}>{data.residentName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Birth:</Text>
                <Text style={styles.value}>{formatDate(data.dateOfBirth)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>AHCCCS ID:</Text>
                <Text style={styles.value}>{data.ahcccsId || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Admission Date:</Text>
                <Text style={styles.value}>{formatDate(data.admissionDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Enrolled Program:</Text>
                <Text style={styles.value}>{data.enrolledProgram || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Discharge Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discharge Information</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Discharge Date:</Text>
                <Text style={styles.value}>{formatDate(data.dischargeDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>
                  {data.dischargeStartTime || "N/A"} - {data.dischargeEndTime || "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Discharge Type:</Text>
                <Text style={styles.value}>{data.dischargeType || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Recommended LOC:</Text>
                <Text style={styles.value}>{data.recommendedLevelOfCare || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Information After Discharge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information After Discharge</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.contactPhoneAfterDischarge || "N/A"}</Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.textBlockLabel}>Address:</Text>
            <Text style={styles.textBlockValue}>
              {data.contactAddressAfterDischarge || "N/A"}
            </Text>
          </View>
        </View>

        {/* Clinical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Information</Text>
          <View style={styles.textBlock}>
            <Text style={styles.textBlockLabel}>Diagnoses:</Text>
            <Text style={styles.textBlockValue}>
              {data.diagnoses || "N/A"}
            </Text>
          </View>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Allergies:</Text>
                <Text style={styles.value}>{data.allergies || "None reported"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>ASAM Level of Care:</Text>
                <Text style={styles.value}>{data.asamLevelOfCare || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Presenting Issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Presenting Issues at Admission</Text>
          <Text style={styles.textBlockValue}>
            {data.presentingIssuesAtAdmission || "N/A"}
          </Text>
        </View>

        {/* Treatment Summary */}
        {data.treatmentSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment Summary</Text>
            <Text style={styles.textBlockValue}>
              {data.treatmentSummary}
            </Text>
          </View>
        )}

        {/* Objectives Attained */}
        {data.objectivesAttained && data.objectivesAttained.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectives Attained</Text>
            <View style={styles.objectiveTable}>
              <View style={[styles.tableHeader]}>
                <Text style={[styles.objectiveText, { fontWeight: "bold" }]}>Objective</Text>
                <Text style={[styles.objectiveStatus, { fontWeight: "bold" }]}>Status</Text>
              </View>
              {data.objectivesAttained.map((obj, index) => (
                <View key={index} style={styles.objectiveRow}>
                  <Text style={styles.objectiveText}>{obj.objective}</Text>
                  <Text style={styles.objectiveStatus}>{obj.attained}</Text>
                </View>
              ))}
            </View>

            {data.objectiveNarratives?.fullyAttained && (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockLabel}>Fully Attained Narrative:</Text>
                <Text style={styles.textBlockValue}>{data.objectiveNarratives.fullyAttained}</Text>
              </View>
            )}
            {data.objectiveNarratives?.partiallyAttained && (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockLabel}>Partially Attained Narrative:</Text>
                <Text style={styles.textBlockValue}>{data.objectiveNarratives.partiallyAttained}</Text>
              </View>
            )}
            {data.objectiveNarratives?.notAttained && (
              <View style={styles.textBlock}>
                <Text style={styles.textBlockLabel}>Not Attained Narrative:</Text>
                <Text style={styles.textBlockValue}>{data.objectiveNarratives.notAttained}</Text>
              </View>
            )}
          </View>
        )}

        <PageFooter facilityName={data.facilityName} />
      </Page>

      {/* Page 2: Services, Summary, Medications */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />

        {/* Completed Services */}
        {data.completedServices && data.completedServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Services</Text>
            <View style={styles.servicesGrid}>
              {data.completedServices.map((service, index) => (
                <Text key={index} style={styles.serviceItem}>• {service}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Discharge Summary Narrative */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discharge Summary</Text>
          <Text style={styles.textBlockValue}>
            {data.dischargeSummaryNarrative || "N/A"}
          </Text>
        </View>

        {/* Discharging To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discharging To</Text>
          <Text style={styles.textBlockValue}>
            {data.dischargingTo || "N/A"}
          </Text>
        </View>

        {/* Personal Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Items</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Items Received by Client:</Text>
            <Text style={styles.value}>{data.personalItemsReceived ? "Yes" : "No"}</Text>
          </View>
          {!data.personalItemsReceived && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Days Items Stored:</Text>
                <Text style={styles.value}>{data.personalItemsStoredDays || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Items Remain at Facility:</Text>
                <Text style={styles.value}>{data.itemsRemainAtFacility ? "Yes" : "No"}</Text>
              </View>
            </>
          )}
        </View>

        {/* Discharge Medications */}
        {data.dischargeMedications && data.dischargeMedications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discharge Medications</Text>
            <View style={styles.medicationTable}>
              <View style={styles.tableHeader}>
                <Text style={{ width: "30%", fontWeight: "bold" }}>Medication</Text>
                <Text style={{ width: "20%", fontWeight: "bold" }}>Dosage</Text>
                <Text style={{ width: "25%", fontWeight: "bold" }}>Frequency</Text>
                <Text style={{ width: "25%", fontWeight: "bold" }}>Prescriber</Text>
              </View>
              {data.dischargeMedications.map((med, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={{ width: "30%" }}>{med.medication}</Text>
                  <Text style={{ width: "20%" }}>{med.dosage || "N/A"}</Text>
                  <Text style={{ width: "25%" }}>{med.frequency || "N/A"}</Text>
                  <Text style={{ width: "25%" }}>{med.prescriber || "N/A"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <PageFooter facilityName={data.facilityName} />
      </Page>

      {/* Page 3: Referrals, Recommendations, Signatures */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />

        {/* Service Referrals */}
        {data.serviceReferrals && data.serviceReferrals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Referrals</Text>
            {data.serviceReferrals.map((referral, index) => (
              <View key={index} style={styles.referralBlock}>
                <View style={styles.row}>
                  <Text style={styles.label}>Service:</Text>
                  <Text style={styles.value}>{referral.service}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Provider:</Text>
                  <Text style={styles.value}>{referral.provider || "N/A"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{referral.phone || "N/A"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{referral.address || "N/A"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Appointment Date:</Text>
                  <Text style={styles.value}>{formatDate(referral.appointmentDate)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Clinical Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Recommendations</Text>
          <Text style={styles.textBlockValue}>
            {data.clinicalRecommendations || "N/A"}
          </Text>
        </View>

        {/* Relapse Prevention Plan */}
        {data.relapsePreventionPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relapse Prevention Plan</Text>
            <Text style={styles.textBlockValue}>
              {data.relapsePreventionPlan}
            </Text>
          </View>
        )}

        {/* Crisis Resources */}
        {data.crisisResources && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crisis Resources</Text>
            <Text style={styles.textBlockValue}>
              {data.crisisResources}
            </Text>
          </View>
        )}

        {/* Patient Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Education</Text>
          {data.patientEducationProvided && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Education Provided:</Text>
              <Text style={styles.textBlockValue}>
                {data.patientEducationProvided}
              </Text>
            </View>
          )}
          {data.specialInstructions && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Special Instructions:</Text>
              <Text style={styles.textBlockValue}>
                {data.specialInstructions}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Cultural Preferences Considered:</Text>
            <Text style={styles.value}>{data.culturalPreferencesConsidered ? "Yes" : "No"}</Text>
          </View>
        </View>

        {/* Suicide Prevention Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suicide Prevention Education</Text>
          <Text style={styles.textBlockValue}>
            {data.suicidePreventionEducation || "N/A"}
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <Text style={styles.subSectionTitle}>Signatures</Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureValue}>{data.clientSignature || ""}</Text>
              </View>
              <Text style={styles.signatureLabel}>Client/Guardian Signature</Text>
            </View>
            <View style={[styles.signatureBlock, { flex: 0.5 }]}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureValue}>
                  {data.clientSignatureDate ? formatDate(data.clientSignatureDate) : ""}
                </Text>
              </View>
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureValue}>{data.staffSignature || ""}</Text>
              </View>
              <Text style={styles.signatureLabel}>
                Staff Signature {data.staffCredentials ? `(${data.staffCredentials})` : ""}
              </Text>
            </View>
            <View style={[styles.signatureBlock, { flex: 0.5 }]}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureValue}>
                  {data.staffSignatureDate ? formatDate(data.staffSignatureDate) : ""}
                </Text>
              </View>
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureValue}>{data.reviewerSignature || ""}</Text>
              </View>
              <Text style={styles.signatureLabel}>
                BHP Reviewer {data.reviewerCredentials ? `(${data.reviewerCredentials})` : ""}
              </Text>
            </View>
            <View style={[styles.signatureBlock, { flex: 0.5 }]}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureValue}>
                  {data.reviewerSignatureDate ? formatDate(data.reviewerSignatureDate) : ""}
                </Text>
              </View>
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        <PageFooter facilityName={data.facilityName} />
      </Page>
    </Document>
  );
}
