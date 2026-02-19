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
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #1e3a5f",
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#4a5568",
    textAlign: "center",
  },
  sectionHeader: {
    backgroundColor: "#f0f4f8",
    padding: 10,
    marginBottom: 15,
    marginTop: 10,
    borderLeft: "4 solid #1e3a5f",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  content: {
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: "justify",
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 10,
  },
  bullet: {
    width: 15,
    color: "#1e3a5f",
  },
  bulletText: {
    flex: 1,
  },
  numberedItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  number: {
    width: 20,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  numberedText: {
    flex: 1,
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: "1 solid #e2e8f0",
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 25,
    gap: 30,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottom: "1 solid #1e3a5f",
    height: 25,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#4a5568",
  },
  prefilledName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a5f",
    padding: 5,
    backgroundColor: "#f7fafc",
    borderBottom: "1 solid #1e3a5f",
    marginBottom: 5,
  },
  dateLine: {
    borderBottom: "1 solid #1e3a5f",
    height: 25,
    marginBottom: 5,
    width: 120,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: "1 solid #1e3a5f",
    marginRight: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  formField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 3,
  },
  fieldLine: {
    borderBottom: "1 solid #cbd5e0",
    height: 20,
    backgroundColor: "#f7fafc",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 20,
  },
  column: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: "1 solid #e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#718096",
    textAlign: "center",
  },
  pageNumber: {
    fontSize: 8,
    color: "#718096",
    textAlign: "right",
    marginTop: 3,
  },
  importantBox: {
    backgroundColor: "#fef3c7",
    padding: 12,
    marginVertical: 10,
    borderRadius: 4,
    border: "1 solid #f59e0b",
  },
  importantText: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: 8,
    marginBottom: 0,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    padding: 8,
    backgroundColor: "#ffffff",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    padding: 8,
    backgroundColor: "#f7fafc",
  },
  indexItem: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1 dashed #cbd5e0",
  },
  indexNumber: {
    width: 30,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  indexTitle: {
    flex: 1,
  },
  indexPage: {
    width: 50,
    textAlign: "right",
    color: "#4a5568",
  },
});

interface OnboardingData {
  residentName: string;
  facilityName?: string;
  date?: string;
}

function PageFooter({ pageNum, totalPages }: { pageNum: number; totalPages: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        BHRF Resident Onboarding Packet - Confidential
      </Text>
      <Text style={styles.pageNumber}>
        Page {pageNum} of {totalPages}
      </Text>
    </View>
  );
}

function SignatureBlock({ name, showDate = true }: { name: string; showDate?: boolean }) {
  return (
    <View style={styles.signatureRow}>
      <View style={styles.signatureBlock}>
        <Text style={styles.prefilledName}>{name}</Text>
        <Text style={styles.signatureLabel}>Resident Name (Printed)</Text>
      </View>
      <View style={styles.signatureBlock}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Resident Signature</Text>
      </View>
      {showDate && (
        <View style={{ width: 120 }}>
          <View style={styles.dateLine} />
          <Text style={styles.signatureLabel}>Date</Text>
        </View>
      )}
    </View>
  );
}

function StaffSignature() {
  return (
    <View style={styles.signatureRow}>
      <View style={styles.signatureBlock}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Staff Name (Printed)</Text>
      </View>
      <View style={styles.signatureBlock}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Staff Signature</Text>
      </View>
      <View style={{ width: 120 }}>
        <View style={styles.dateLine} />
        <Text style={styles.signatureLabel}>Date</Text>
      </View>
    </View>
  );
}

// Page 1: Index
function IndexPage({ data }: { data: OnboardingData }) {
  const indexItems = [
    { num: 1, title: "Resident Information Cover Sheet", page: 2 },
    { num: 2, title: "Consent for Treatment", page: 3 },
    { num: 3, title: "Resident Rights", page: 4 },
    { num: 4, title: "House Rules", page: 6 },
    { num: 5, title: "Contraband Policy", page: 8 },
    { num: 6, title: "Orientation to Agency", page: 9 },
    { num: 7, title: "Property Disclaimer", page: 10 },
    { num: 8, title: "Confidentiality of Resident Records", page: 11 },
    { num: 9, title: "Internal Resident Disclosure List", page: 12 },
    { num: 10, title: "Photograph & Video Release Form", page: 13 },
    { num: 11, title: "Verification of Participation Request", page: 14 },
    { num: 12, title: "Behavioral Contract", page: 15 },
    { num: 13, title: "Advanced Directives", page: 17 },
    { num: 14, title: "Service Plan Rights Acknowledgment", page: 18 },
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>RESIDENT FILE INDEX</Text>
        <Text style={styles.subtitle}>Onboarding Document Packet</Text>
      </View>

      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Resident: {data.residentName}</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: 30 }]}>#</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Document Title</Text>
          <Text style={[styles.tableHeaderText, { width: 50, textAlign: "right" }]}>Page</Text>
        </View>
        {indexItems.map((item, idx) => (
          <View key={item.num} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[{ width: 30, color: "#1e3a5f", fontWeight: "bold" }]}>{item.num}</Text>
            <Text style={{ flex: 1 }}>{item.title}</Text>
            <Text style={{ width: 50, textAlign: "right", color: "#4a5568" }}>{item.page}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.importantBox, { marginTop: 30 }]}>
        <Text style={styles.importantText}>
          All documents in this packet must be reviewed, signed, and dated by the resident.
          Staff must witness all signatures.
        </Text>
      </View>

      <PageFooter pageNum={1} totalPages={18} />
    </Page>
  );
}

// Page 2: Cover Sheet
function CoverSheetPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>RESIDENT INFORMATION COVER SHEET</Text>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Resident Name</Text>
        <Text style={styles.prefilledName}>{data.residentName}</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Social Security Number (Last 4)</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Admission Date</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Room Assignment</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Case Manager</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Relationship</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Address</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Insurance Information</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Primary Insurance</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Policy Number</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>AHCCCS ID</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Effective Date</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Primary Care Provider</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Physician Name</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <PageFooter pageNum={2} totalPages={18} />
    </Page>
  );
}

// Page 3: Consent for Treatment
function ConsentPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>CONSENT FOR TREATMENT</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.paragraph}>
          I, {data.residentName}, hereby voluntarily consent to receive behavioral health residential
          services at this facility. I understand that these services may include but are not limited to:
        </Text>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Individual and group counseling sessions</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Medication management and monitoring</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Case management services</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Skills training and rehabilitation services</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Crisis intervention services</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Assistance with activities of daily living</Text>
        </View>

        <Text style={[styles.paragraph, { marginTop: 15 }]}>
          I understand that I have the right to:
        </Text>

        <View style={styles.numberedItem}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.numberedText}>
            Receive information about my treatment plan and participate in its development
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.numberedText}>
            Refuse any treatment or service at any time
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.numberedText}>
            Be treated with dignity and respect
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.numberedText}>
            Have my records kept confidential in accordance with state and federal laws
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>5.</Text>
          <Text style={styles.numberedText}>
            File a grievance if I am not satisfied with my treatment
          </Text>
        </View>

        <Text style={[styles.paragraph, { marginTop: 15 }]}>
          I understand that if I am receiving medication, I will be informed of the potential
          benefits and risks of the medication. I also understand that I may withdraw my consent
          at any time by providing written notice.
        </Text>

        <Text style={[styles.paragraph, { marginTop: 15 }]}>
          By signing below, I acknowledge that I have read and understand this consent form,
          have had the opportunity to ask questions, and voluntarily agree to receive services.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={3} totalPages={18} />
    </Page>
  );
}

// Pages 4-5: Resident Rights
function ResidentRightsPages({ data }: { data: OnboardingData }) {
  return (
    <>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>RESIDENT RIGHTS</Text>
        </View>

        <Text style={styles.paragraph}>
          As a resident of this behavioral health residential facility, you have the following rights:
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>General Rights</Text>
        </View>

        <View style={styles.numberedItem}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.numberedText}>
            The right to be treated with consideration, respect, and full recognition of your dignity and individuality.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.numberedText}>
            The right to receive care in a safe, clean, and comfortable environment.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.numberedText}>
            The right to be free from abuse, neglect, exploitation, and harassment.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.numberedText}>
            The right to privacy in treatment and care for personal needs.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>5.</Text>
          <Text style={styles.numberedText}>
            The right to confidentiality of all records and communications.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Treatment Rights</Text>
        </View>

        <View style={styles.numberedItem}>
          <Text style={styles.number}>6.</Text>
          <Text style={styles.numberedText}>
            The right to participate in the development of your individualized treatment plan.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>7.</Text>
          <Text style={styles.numberedText}>
            The right to receive information about your diagnosis, treatment, and prognosis.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>8.</Text>
          <Text style={styles.numberedText}>
            The right to refuse treatment and be informed of the consequences of such refusal.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>9.</Text>
          <Text style={styles.numberedText}>
            The right to receive services without discrimination based on race, religion, gender, sexual orientation, or disability.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>10.</Text>
          <Text style={styles.numberedText}>
            The right to access your own records in accordance with state and federal law.
          </Text>
        </View>

        <PageFooter pageNum={4} totalPages={18} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>RESIDENT RIGHTS (Continued)</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Communication Rights</Text>
        </View>

        <View style={styles.numberedItem}>
          <Text style={styles.number}>11.</Text>
          <Text style={styles.numberedText}>
            The right to communicate freely and privately with persons outside the facility.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>12.</Text>
          <Text style={styles.numberedText}>
            The right to receive and send unopened mail.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>13.</Text>
          <Text style={styles.numberedText}>
            The right to receive visitors at reasonable times.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Grievance Rights</Text>
        </View>

        <View style={styles.numberedItem}>
          <Text style={styles.number}>14.</Text>
          <Text style={styles.numberedText}>
            The right to file grievances and have them addressed without fear of retaliation.
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>15.</Text>
          <Text style={styles.numberedText}>
            The right to contact regulatory agencies regarding any concerns about your care.
          </Text>
        </View>

        <View style={[styles.importantBox, { marginTop: 20 }]}>
          <Text style={styles.importantText}>
            If you believe your rights have been violated, you may file a grievance with the facility
            administrator or contact the Arizona Department of Health Services.
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.paragraph, { marginTop: 15 }]}>
            I, {data.residentName}, acknowledge that I have received a copy of my resident rights.
            I have had the opportunity to review these rights and ask questions. I understand my
            rights as a resident of this facility.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <SignatureBlock name={data.residentName} />
          <StaffSignature />
        </View>

        <PageFooter pageNum={5} totalPages={18} />
      </Page>
    </>
  );
}

// Pages 6-7: House Rules
function HouseRulesPages({ data }: { data: OnboardingData }) {
  return (
    <>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>HOUSE RULES</Text>
        </View>

        <Text style={styles.paragraph}>
          The following rules are established to maintain a safe, healthy, and supportive environment
          for all residents. Violation of these rules may result in disciplinary action up to and
          including discharge from the facility.
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>General Conduct</Text>
        </View>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Treat all residents, staff, and visitors with respect and courtesy</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>No violence, threats, or intimidation of any kind</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>No theft or destruction of property</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Appropriate language and behavior at all times</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Substances</Text>
        </View>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>No alcohol, illegal drugs, or non-prescribed controlled substances on the premises</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>All medications must be stored and managed by staff unless otherwise approved</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Random drug/alcohol testing may be conducted</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Schedule</Text>
        </View>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Attend all scheduled treatment activities and appointments</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Quiet hours from 10:00 PM to 7:00 AM</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Meals are served at scheduled times; notify staff of dietary needs</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Curfew must be observed; overnight passes require prior approval</Text>
        </View>

        <PageFooter pageNum={6} totalPages={18} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>HOUSE RULES (Continued)</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Responsibilities</Text>
        </View>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Keep your room and common areas clean and orderly</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Participate in assigned chores and cleaning duties</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Maintain personal hygiene and appropriate dress</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Report any maintenance issues or safety concerns immediately</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visitors & Communication</Text>
        </View>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Visitors are allowed during designated visiting hours only</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>All visitors must sign in at the front desk</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Phone use may be limited during treatment activities</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>No visitors in resident bedrooms</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety</Text>
        </View>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>No weapons of any kind on the premises</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Follow fire safety procedures and evacuation plans</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Report any safety hazards or concerns to staff immediately</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.paragraph, { marginTop: 20 }]}>
            I, {data.residentName}, have read and understand the house rules. I agree to follow
            these rules during my stay at this facility. I understand that violation of these rules
            may result in disciplinary action.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <SignatureBlock name={data.residentName} />
          <StaffSignature />
        </View>

        <PageFooter pageNum={7} totalPages={18} />
      </Page>
    </>
  );
}

// Page 8: Contraband Policy
function ContrabandPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>CONTRABAND POLICY</Text>
      </View>

      <Text style={styles.paragraph}>
        To maintain a safe and therapeutic environment, the following items are prohibited
        on facility premises. Possession of contraband may result in confiscation, disciplinary
        action, and/or discharge from the program.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Prohibited Items</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Alcohol in any form</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Illegal drugs or paraphernalia</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Non-prescribed medications</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Weapons of any kind</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Sharp objects (razors, knives)</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Pornographic materials</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Candles or incense</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Hot plates or cooking devices</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Extension cords (fire hazard)</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Any item deemed unsafe by staff</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Search Policy</Text>
      </View>

      <Text style={styles.paragraph}>
        Upon admission and at any time during your stay, your belongings and living space may
        be searched for contraband. Searches will be conducted in a respectful manner. Any
        contraband found will be confiscated and documented.
      </Text>

      <View style={[styles.importantBox, { marginTop: 15 }]}>
        <Text style={styles.importantText}>
          Possession of illegal substances or weapons may be reported to law enforcement.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          I, {data.residentName}, have read and understand the contraband policy. I agree to
          comply with this policy and understand the consequences of violating it.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={8} totalPages={18} />
    </Page>
  );
}

// Page 9: Orientation to Agency
function OrientationPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>ORIENTATION TO AGENCY</Text>
      </View>

      <Text style={styles.paragraph}>
        I, {data.residentName}, acknowledge that I have received orientation to this behavioral
        health residential facility. The following topics have been reviewed with me:
      </Text>

      <View style={{ marginTop: 15 }}>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Facility tour and layout</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Fire safety and evacuation procedures</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Emergency procedures and contact numbers</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Meal times and dining procedures</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Visiting hours and policies</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Treatment schedule and expectations</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Medication policies and procedures</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>House rules and consequences</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Resident rights and responsibilities</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Grievance procedures</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Discharge planning process</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Staff roles and how to contact them</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Available services and programs</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          I have had the opportunity to ask questions about the facility and the services provided.
          All of my questions have been answered to my satisfaction.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={9} totalPages={18} />
    </Page>
  );
}

// Page 10: Property Disclaimer
function PropertyPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>PROPERTY DISCLAIMER</Text>
      </View>

      <Text style={styles.paragraph}>
        I, {data.residentName}, understand and acknowledge the following regarding personal
        property during my stay at this facility:
      </Text>

      <View style={styles.numberedItem}>
        <Text style={styles.number}>1.</Text>
        <Text style={styles.numberedText}>
          I am responsible for my own personal property and valuables.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>2.</Text>
        <Text style={styles.numberedText}>
          The facility is not responsible for loss, theft, or damage to personal belongings.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>3.</Text>
        <Text style={styles.numberedText}>
          I am advised not to bring valuable items, large amounts of cash, or irreplaceable items to the facility.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>4.</Text>
        <Text style={styles.numberedText}>
          Valuables may be stored in a secure location upon request, but the facility assumes no liability for these items.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>5.</Text>
        <Text style={styles.numberedText}>
          Any property left behind after discharge may be disposed of after 30 days.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>6.</Text>
        <Text style={styles.numberedText}>
          I am responsible for maintaining my living space in good condition.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>7.</Text>
        <Text style={styles.numberedText}>
          I may be held financially responsible for any damage I cause to facility property.
        </Text>
      </View>

      <View style={[styles.importantBox, { marginTop: 20 }]}>
        <Text style={styles.importantText}>
          We strongly recommend leaving valuable jewelry, electronics, and large amounts of
          cash at home or with a trusted family member.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 15 }]}>
          By signing below, I acknowledge that I have read and understand this property
          disclaimer and release the facility from liability for my personal property.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={10} totalPages={18} />
    </Page>
  );
}

// Page 11: Confidentiality
function ConfidentialityPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>CONFIDENTIALITY OF RESIDENT RECORDS</Text>
      </View>

      <Text style={styles.paragraph}>
        This facility is committed to protecting the confidentiality of your personal and
        health information in accordance with state and federal laws, including HIPAA
        (Health Insurance Portability and Accountability Act) and 42 CFR Part 2.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Information is Protected</Text>
      </View>

      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Your medical and treatment records are confidential</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Information will not be released without your written consent</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Even acknowledgment that you are a resident here is protected</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exceptions to Confidentiality</Text>
      </View>

      <Text style={styles.paragraph}>
        Your information may be disclosed without your consent only in the following circumstances:
      </Text>

      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Medical emergencies</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Court orders signed by a judge</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Reports of suspected child abuse or neglect</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Threats of harm to yourself or others</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Regulatory audits and investigations</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          I, {data.residentName}, acknowledge that I have been informed of the facility&apos;s
          confidentiality policies and understand my rights regarding the protection of my information.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={11} totalPages={18} />
    </Page>
  );
}

// Page 12: Disclosure List
function DisclosureListPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>INTERNAL RESIDENT DISCLOSURE LIST</Text>
      </View>

      <Text style={styles.paragraph}>
        I, {data.residentName}, authorize the facility to disclose my presence and general
        condition to the following individuals. Only individuals listed below will be given
        information about me.
      </Text>

      <View style={{ marginTop: 20 }}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: "30%" }]}>Name</Text>
          <Text style={[styles.tableHeaderText, { width: "25%" }]}>Relationship</Text>
          <Text style={[styles.tableHeaderText, { width: "25%" }]}>Phone Number</Text>
          <Text style={[styles.tableHeaderText, { width: "20%" }]}>Can Visit?</Text>
        </View>
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <View key={num} style={num % 2 === 0 ? styles.tableRowAlt : styles.tableRow}>
            <View style={{ width: "30%", height: 20 }} />
            <View style={{ width: "25%", height: 20 }} />
            <View style={{ width: "25%", height: 20 }} />
            <View style={{ width: "20%", height: 20 }} />
          </View>
        ))}
      </View>

      <View style={[styles.importantBox, { marginTop: 20 }]}>
        <Text style={styles.importantText}>
          Only individuals listed above will be acknowledged as having a relationship with you.
          You may update this list at any time by speaking with staff.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 15 }]}>
          I understand that if someone calls or visits who is not on this list, staff will not
          confirm or deny my presence at this facility.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={12} totalPages={18} />
    </Page>
  );
}

// Page 13: Photo/Video Release
function PhotoReleasePage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>PHOTOGRAPH & VIDEO RELEASE FORM</Text>
      </View>

      <Text style={styles.paragraph}>
        This form authorizes or denies permission for the facility to photograph or video record
        the resident named below.
      </Text>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Resident Name</Text>
        <Text style={styles.prefilledName}>{data.residentName}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Authorization (Check One)</Text>
      </View>

      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text style={{ flex: 1 }}>
          I AUTHORIZE the facility to photograph/video record me for the following purposes:
        </Text>
      </View>

      <View style={{ paddingLeft: 25 }}>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Treatment documentation and progress records</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Training and educational purposes</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Marketing and promotional materials</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Website and social media</Text>
        </View>
      </View>

      <View style={[styles.checkboxRow, { marginTop: 15 }]}>
        <View style={styles.checkbox} />
        <Text style={{ flex: 1 }}>
          I DO NOT AUTHORIZE the facility to photograph or video record me for any purpose.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          I understand that I may revoke this authorization at any time by providing written
          notice to the facility. I understand that any photographs or videos taken prior to
          revocation may continue to be used as authorized above.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={13} totalPages={18} />
    </Page>
  );
}

// Page 14: Verification of Participation
function VerificationPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>VERIFICATION OF PARTICIPATION REQUEST</Text>
      </View>

      <Text style={styles.paragraph}>
        I, {data.residentName}, understand that there may be situations where third parties
        request verification of my participation in this residential treatment program. This
        form allows me to specify how such requests should be handled.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Authorization Options</Text>
      </View>

      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text style={{ flex: 1 }}>
          I authorize the facility to verify my participation to the following entities:
        </Text>
      </View>

      <View style={{ paddingLeft: 25 }}>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Probation/Parole Officers</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Courts and legal representatives</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Insurance companies</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Employers (for employment verification)</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Other treatment providers</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>Family members (as specified on disclosure list)</Text>
        </View>
      </View>

      <View style={[styles.checkboxRow, { marginTop: 15 }]}>
        <View style={styles.checkbox} />
        <Text style={{ flex: 1 }}>
          I DO NOT authorize verification of my participation to any third parties without
          my specific written consent for each request.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          I understand that I may modify this authorization at any time by providing written
          notice to the facility.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={14} totalPages={18} />
    </Page>
  );
}

// Pages 15-16: Behavioral Contract
function BehavioralContractPages({ data }: { data: OnboardingData }) {
  return (
    <>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>BEHAVIORAL CONTRACT</Text>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>RESIDENT NAME</Text>
          <Text style={styles.prefilledName}>{data.residentName}</Text>
        </View>

        <Text style={styles.paragraph}>
          This behavioral contract outlines expectations and commitments for maintaining a
          safe and therapeutic environment during my stay at this facility.
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Commitments</Text>
        </View>

        <Text style={styles.paragraph}>I agree to:</Text>

        <View style={styles.numberedItem}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.numberedText}>
            Actively participate in all scheduled treatment activities and groups
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.numberedText}>
            Take all prescribed medications as directed by medical staff
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.numberedText}>
            Communicate honestly with staff about my feelings, concerns, and progress
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.numberedText}>
            Treat all residents and staff with respect and dignity
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>5.</Text>
          <Text style={styles.numberedText}>
            Follow all house rules and facility policies
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>6.</Text>
          <Text style={styles.numberedText}>
            Refrain from using alcohol, drugs, or other contraband substances
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>7.</Text>
          <Text style={styles.numberedText}>
            Submit to random drug testing when requested
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>8.</Text>
          <Text style={styles.numberedText}>
            Immediately inform staff if I am having thoughts of harming myself or others
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>9.</Text>
          <Text style={styles.numberedText}>
            Use appropriate coping skills when experiencing difficult emotions
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>10.</Text>
          <Text style={styles.numberedText}>
            Work collaboratively with my treatment team on discharge planning
          </Text>
        </View>

        <PageFooter pageNum={15} totalPages={18} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>BEHAVIORAL CONTRACT (Continued)</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety Plan</Text>
        </View>

        <Text style={styles.paragraph}>
          If I am feeling unsafe or having thoughts of harming myself, I agree to:
        </Text>

        <View style={styles.numberedItem}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.numberedText}>
            Immediately tell a staff member
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.numberedText}>
            Use my coping skills (deep breathing, journaling, walking)
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.numberedText}>
            Stay in common areas where staff can observe me
          </Text>
        </View>
        <View style={styles.numberedItem}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.numberedText}>
            Allow staff to implement safety precautions if needed
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consequences</Text>
        </View>

        <Text style={styles.paragraph}>
          I understand that violations of this contract may result in:
        </Text>

        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Verbal warning and processing with staff</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Written incident report</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Loss of privileges</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Behavioral intervention plan</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Discharge from the program</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.paragraph, { marginTop: 20 }]}>
            I, {data.residentName}, have read and understand this behavioral contract. I commit
            to following these guidelines during my stay at this facility.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <SignatureBlock name={data.residentName} />
          <StaffSignature />
        </View>

        <PageFooter pageNum={16} totalPages={18} />
      </Page>
    </>
  );
}

// Page 17: Advanced Directives
function AdvancedDirectivesPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>ADVANCED DIRECTIVES</Text>
      </View>

      <Text style={styles.paragraph}>
        Advanced directives allow you to document your wishes regarding medical treatment
        in case you become unable to make decisions for yourself.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current Status</Text>
      </View>

      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text>I HAVE existing advanced directives (copy attached)</Text>
      </View>
      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text>I DO NOT have advanced directives</Text>
      </View>
      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text>I WISH to create advanced directives (please notify staff)</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Healthcare Power of Attorney</Text>
      </View>

      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text>I HAVE designated a healthcare power of attorney:</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text>I DO NOT have a healthcare power of attorney</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Do Not Resuscitate (DNR) Order</Text>
      </View>

      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text>I HAVE a DNR order (copy attached)</Text>
      </View>
      <View style={styles.checkboxRow}>
        <View style={styles.checkbox} />
        <Text>I DO NOT have a DNR order</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          I, {data.residentName}, have been informed of my right to have advanced directives
          and have indicated my current status above.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={17} totalPages={18} />
    </Page>
  );
}

// Page 18: Service Plan Rights
function ServicePlanRightsPage({ data }: { data: OnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>SERVICE PLAN RIGHTS ACKNOWLEDGMENT</Text>
      </View>

      <Text style={styles.paragraph}>
        As a resident of this facility, you have the right to participate in the development
        of your individualized service plan. This document outlines your rights regarding
        your treatment planning process.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Rights</Text>
      </View>

      <View style={styles.numberedItem}>
        <Text style={styles.number}>1.</Text>
        <Text style={styles.numberedText}>
          You have the right to participate in the development of your service plan.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>2.</Text>
        <Text style={styles.numberedText}>
          You have the right to have your preferences and goals included in your plan.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>3.</Text>
        <Text style={styles.numberedText}>
          You have the right to receive a copy of your service plan.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>4.</Text>
        <Text style={styles.numberedText}>
          You have the right to request changes to your service plan at any time.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>5.</Text>
        <Text style={styles.numberedText}>
          You have the right to have your service plan reviewed regularly.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>6.</Text>
        <Text style={styles.numberedText}>
          You have the right to include family members or advocates in your treatment planning.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>7.</Text>
        <Text style={styles.numberedText}>
          You have the right to refuse any service included in your plan.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          I, {data.residentName}, acknowledge that I have been informed of my rights regarding
          my service plan. I understand that I am an active participant in my treatment planning
          and recovery process.
        </Text>

        <Text style={[styles.paragraph, { marginTop: 15, fontWeight: "bold" }]}>
          This completes the Resident Onboarding Packet. Please ensure all pages have been
          reviewed and signed.
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <SignatureBlock name={data.residentName} />
        <StaffSignature />
      </View>

      <PageFooter pageNum={18} totalPages={18} />
    </Page>
  );
}

export function OnboardingPDF({ data }: { data: OnboardingData }) {
  return (
    <Document>
      <IndexPage data={data} />
      <CoverSheetPage data={data} />
      <ConsentPage data={data} />
      <ResidentRightsPages data={data} />
      <HouseRulesPages data={data} />
      <ContrabandPage data={data} />
      <OrientationPage data={data} />
      <PropertyPage data={data} />
      <ConfidentialityPage data={data} />
      <DisclosureListPage data={data} />
      <PhotoReleasePage data={data} />
      <VerificationPage data={data} />
      <BehavioralContractPages data={data} />
      <AdvancedDirectivesPage data={data} />
      <ServicePlanRightsPage data={data} />
    </Document>
  );
}
