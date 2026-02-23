import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 10,
  },
  // Patient info table
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  cellLabel: {
    padding: 4,
    backgroundColor: "#f0f0f0",
    width: 70,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 8,
  },
  cellValue: {
    padding: 4,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 9,
    fontWeight: "bold",
  },
  cellValueLast: {
    padding: 4,
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
  },
  // Section header
  sectionHeader: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
  },
  // Disclosure table
  disclosureTable: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 15,
  },
  disclosureHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  disclosureHeader: {
    flex: 1,
    padding: 4,
    fontWeight: "bold",
    fontSize: 9,
  },
  disclosureHeaderRight: {
    flex: 1,
    padding: 4,
    fontWeight: "bold",
    fontSize: 9,
    borderLeftWidth: 1,
    borderLeftColor: "#000",
  },
  disclosureRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  disclosureRowLast: {
    flexDirection: "row",
  },
  disclosureLabel: {
    width: 90,
    padding: 4,
    backgroundColor: "#f9f9f9",
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 8,
  },
  disclosureValue: {
    flex: 1,
    padding: 4,
    fontSize: 9,
  },
  disclosureLabelRight: {
    width: 90,
    padding: 4,
    backgroundColor: "#f9f9f9",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderLeftColor: "#000",
    fontSize: 8,
  },
  disclosureValueRight: {
    flex: 1,
    padding: 4,
    fontSize: 9,
  },
  // Information checkboxes
  infoSection: {
    marginBottom: 12,
  },
  infoHeader: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
  },
  checkboxGrid: {
    flexDirection: "row",
  },
  checkboxColumn: {
    flex: 1,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    fontSize: 9,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 6,
    textAlign: "center",
    fontSize: 8,
    lineHeight: 1,
  },
  // Inline sections
  inlineSection: {
    marginBottom: 8,
    fontSize: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  inlineBold: {
    fontWeight: "bold",
    marginRight: 4,
  },
  inlineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  inlineCheckbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 3,
    textAlign: "center",
    fontSize: 7,
  },
  // Patient rights
  rightsSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  rightsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  rightsText: {
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 8,
    fontStyle: "italic",
    lineHeight: 1.4,
  },
  // Signatures
  signaturesSection: {
    marginTop: 15,
  },
  signaturesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
  },
  signatureRow: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-end",
  },
  signatureBlock: {
    flex: 2,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 20,
    marginBottom: 2,
  },
  signatureLabel: {
    fontSize: 8,
  },
  dateBlock: {
    flex: 1,
    marginLeft: 20,
  },
  dateValue: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 20,
    marginBottom: 2,
    paddingTop: 6,
    fontSize: 9,
  },
  legalRepText: {
    fontSize: 8,
    marginTop: 10,
  },
  // Office use
  separator: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 15,
    marginBottom: 8,
  },
  officeUse: {
    fontSize: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  officeUseBold: {
    fontWeight: "bold",
    marginRight: 4,
  },
});

interface ReleaseOfInformationData {
  patientName: string;
  dateOfBirth: string;
  phone: string;
  address?: string;
  ssn?: string;
  ahcccsId?: string;
  currentDate?: string;
  discloseFromName?: string;
  discloseFromContact?: string;
  discloseToName?: string;
  discloseToContact?: string;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return dateStr;
  }
}

function getArizonaDate(): string {
  // Arizona is UTC-7 (MST) and doesn't observe daylight saving time
  const now = new Date();
  const arizonaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Phoenix" }));
  const month = String(arizonaTime.getMonth() + 1).padStart(2, "0");
  const day = String(arizonaTime.getDate()).padStart(2, "0");
  const year = arizonaTime.getFullYear();
  return `${month}/${day}/${year}`;
}

export function ReleaseOfInformationDocument({ data }: { data: ReleaseOfInformationData }) {
  const currentDate = getArizonaDate();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>AUTHORIZATION FOR RELEASE OF INFORMATION</Text>
        <Text style={styles.subtitle}>HIPAA Compliant (45 CFR 164.508) | 42 CFR Part 2 Protected</Text>

        {/* Patient Information Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.cellLabel}>Patient Name:</Text>
            <Text style={styles.cellValue}>{data.patientName}</Text>
            <Text style={styles.cellLabel}>DOB:</Text>
            <Text style={styles.cellValue}>{formatDate(data.dateOfBirth)}</Text>
            <Text style={styles.cellLabel}>SSN (Last 4):</Text>
            <Text style={styles.cellValueLast}>{data.ssn || "n/a"}</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.cellLabel}>Address:</Text>
            <Text style={styles.cellValue}>{data.address || ""}</Text>
            <Text style={styles.cellLabel}>Phone:</Text>
            <Text style={styles.cellValue}>{data.phone}</Text>
            <Text style={styles.cellLabel}>AHCCCS ID:</Text>
            <Text style={styles.cellValueLast}>{data.ahcccsId || ""}</Text>
          </View>
        </View>

        {/* Disclosure Authorization */}
        <Text style={styles.sectionHeader}>DISCLOSURE AUTHORIZATION</Text>
        <View style={styles.disclosureTable}>
          <View style={styles.disclosureHeaderRow}>
            <Text style={styles.disclosureHeader}>DISCLOSE FROM:</Text>
            <Text style={styles.disclosureHeaderRight}>DISCLOSE TO:</Text>
          </View>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Name:</Text>
            <Text style={styles.disclosureValue}>{data.discloseFromName || ""}</Text>
            <Text style={styles.disclosureLabelRight}>Name:</Text>
            <Text style={styles.disclosureValueRight}>{data.discloseToName || ""}</Text>
          </View>
          <View style={styles.disclosureRowLast}>
            <Text style={styles.disclosureLabel}>Address/Phone/Fax:</Text>
            <Text style={styles.disclosureValue}>{data.discloseFromContact || ""}</Text>
            <Text style={styles.disclosureLabelRight}>Address/Phone/Fax:</Text>
            <Text style={styles.disclosureValueRight}>{data.discloseToContact || ""}</Text>
          </View>
        </View>

        {/* Information to be Disclosed */}
        <View style={styles.infoSection}>
          <Text style={styles.infoHeader}>INFORMATION TO BE DISCLOSED (check all that apply):</Text>
          <View style={styles.checkboxGrid}>
            <View style={styles.checkboxColumn}>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}></Text>
                <Text>Complete Medical Record</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}>X</Text>
                <Text>Discharge Summary</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}>X</Text>
                <Text>Treatment Plan</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}></Text>
                <Text>Medication List</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}></Text>
                <Text>Lab Results</Text>
              </View>
            </View>
            <View style={styles.checkboxColumn}>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}>X</Text>
                <Text>Psychiatric Evaluation</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}>X</Text>
                <Text>Clinical Assessments</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}></Text>
                <Text>Progress/Counseling Notes</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}></Text>
                <Text>History & Physical</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkbox}></Text>
                <Text>Other: ________________</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sensitive Information - Single Line */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineBold}>SENSITIVE INFORMATION (Initial to authorize):</Text>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}>X</Text>
            <Text>Substance Use Disorder (42 CFR Part 2) _____</Text>
          </View>
          <Text> | </Text>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>HIV/AIDS _____</Text>
          </View>
          <Text> | </Text>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>Mental Health _____</Text>
          </View>
        </View>

        {/* Date Range - Single Line */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineBold}>Date Range:</Text>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>All records</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>From ____/____/____ to ____/____/____</Text>
          </View>
        </View>

        {/* Purpose - Single Line */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineBold}>PURPOSE:</Text>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}>X</Text>
            <Text>Continuity of Care</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}>X</Text>
            <Text>Insurance/Billing</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>Legal</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>Transfer</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>Personal Request</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>Other: ________</Text>
          </View>
        </View>

        {/* Expiration - Single Line */}
        <View style={styles.inlineSection}>
          <Text style={styles.inlineBold}>EXPIRATION:</Text>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>Date: ____/____/____</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}>X</Text>
            <Text>Upon discharge</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>One year from signature</Text>
          </View>
          <View style={styles.inlineItem}>
            <Text style={styles.inlineCheckbox}></Text>
            <Text>Event: ________________</Text>
          </View>
        </View>

        {/* Patient Rights and Acknowledgment */}
        <View style={styles.rightsSection}>
          <Text style={styles.rightsTitle}>PATIENT RIGHTS AND ACKNOWLEDGMENT</Text>
          <Text style={styles.rightsText}>
            By signing below, I acknowledge: (1) I may revoke this authorization in writing at any time, except where action has already been taken; (2) Treatment will not be conditioned on signing this authorization; (3) Information disclosed may be re-disclosed by the recipient and may no longer be protected, except substance use disorder records under 42 CFR Part 2 which prohibit re-disclosure without written consent; (4) I may request a copy of this authorization; (5) I am signing voluntarily.
          </Text>
          <Text style={styles.noticeText}>
            42 CFR Part 2 Notice: This information has been disclosed from records protected by federal confidentiality rules (42 CFR Part 2). Federal rules prohibit further disclosure without written patient consent. A general authorization for release of medical information is NOT sufficient.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesSection}>
          <Text style={styles.signaturesTitle}>SIGNATURES</Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Patient/Legal Rep Signature:</Text>
            </View>
            <View style={styles.dateBlock}>
              <View style={styles.dateValue}>
                <Text>{currentDate}</Text>
              </View>
              <Text style={styles.signatureLabel}>Date:</Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Witness Signature:</Text>
            </View>
            <View style={styles.dateBlock}>
              <View style={styles.dateValue}>
                <Text>{currentDate}</Text>
              </View>
              <Text style={styles.signatureLabel}>Date:</Text>
            </View>
          </View>

          <Text style={styles.legalRepText}>
            If signed by Legal Representative, relationship: __________________ Authority: __________________
          </Text>
        </View>

        {/* Separator and Office Use */}
        <View style={styles.separator} />
        <View style={styles.officeUse}>
          <Text style={styles.officeUseBold}>OFFICE USE:</Text>
          <Text>Received: ____/____/____  Staff: ____________  Disclosed: ____/____/____  Method: </Text>
          <Text style={styles.inlineCheckbox}></Text>
          <Text>Mail </Text>
          <Text style={styles.inlineCheckbox}></Text>
          <Text>Fax </Text>
          <Text style={styles.inlineCheckbox}></Text>
          <Text>Electronic </Text>
          <Text style={styles.inlineCheckbox}></Text>
          <Text>In Person</Text>
        </View>
      </Page>
    </Document>
  );
}
