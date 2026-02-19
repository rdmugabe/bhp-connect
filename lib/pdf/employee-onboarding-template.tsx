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
    padding: 8,
    marginBottom: 10,
    marginTop: 8,
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
    marginTop: 20,
    paddingTop: 15,
    borderTop: "1 solid #e2e8f0",
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 20,
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
  prefilledDate: {
    fontSize: 10,
    color: "#1e3a5f",
    padding: 5,
    backgroundColor: "#f7fafc",
    borderBottom: "1 solid #1e3a5f",
    marginBottom: 5,
    width: 120,
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
    marginBottom: 8,
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
    padding: 6,
    backgroundColor: "#ffffff",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    padding: 6,
    backgroundColor: "#f7fafc",
  },
  indexItem: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1 dashed #cbd5e0",
  },
  circleOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    border: "1 solid #1e3a5f",
    marginRight: 5,
  },
});

interface EmployeeOnboardingData {
  employeeName: string;
  hireDate: string;
  facilityName: string;
}

const TOTAL_PAGES = 14;

function PageFooter({ pageNum }: { pageNum: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        BHRF Employee Onboarding Packet - Confidential
      </Text>
      <Text style={styles.pageNumber}>
        Page {pageNum} of {TOTAL_PAGES}
      </Text>
    </View>
  );
}

function EmployeeSignatureBlock({ name, hireDate }: { name: string; hireDate?: string }) {
  return (
    <View style={styles.signatureRow}>
      <View style={styles.signatureBlock}>
        <Text style={styles.prefilledName}>{name}</Text>
        <Text style={styles.signatureLabel}>Employee Name (Printed)</Text>
      </View>
      <View style={styles.signatureBlock}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Employee Signature</Text>
      </View>
      <View style={{ width: 120 }}>
        {hireDate ? (
          <Text style={styles.prefilledDate}>{hireDate}</Text>
        ) : (
          <View style={styles.dateLine} />
        )}
        <Text style={styles.signatureLabel}>Date</Text>
      </View>
    </View>
  );
}

function AdminSignature() {
  return (
    <View style={styles.signatureRow}>
      <View style={styles.signatureBlock}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Administrator/Supervisor Name (Printed)</Text>
      </View>
      <View style={styles.signatureBlock}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Administrator/Supervisor Signature</Text>
      </View>
      <View style={{ width: 120 }}>
        <View style={styles.dateLine} />
        <Text style={styles.signatureLabel}>Date</Text>
      </View>
    </View>
  );
}

// Page 1: Index
function IndexPage({ data }: { data: EmployeeOnboardingData }) {
  const indexItems = [
    { num: 1, title: "Employee Application", page: 2 },
    { num: 2, title: "Employment Contract", page: 5 },
    { num: 3, title: "Job Description and Qualifications (BHT)", page: 6 },
    { num: 4, title: "Reference Check Form", page: 7 },
    { num: 5, title: "Confidentiality Agreement", page: 8 },
    { num: 6, title: "Verification of Skills", page: 9 },
    { num: 7, title: "New Employee Orientation", page: 10 },
    { num: 8, title: "Medication Administration Training", page: 11 },
    { num: 9, title: "Onboarding Checklist Training", page: 13 },
    { num: 10, title: "Employee Packet Acknowledgment", page: 14 },
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>EMPLOYEE FILE INDEX</Text>
        <Text style={styles.subtitle}>Onboarding Document Packet</Text>
      </View>

      <View style={[styles.sectionHeader, { marginTop: 10 }]}>
        <Text style={styles.sectionTitle}>Employee: {data.employeeName}</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Hire Date</Text>
            <Text style={styles.prefilledDate}>{data.hireDate}</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Position</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 15 }}>
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

      <View style={[styles.importantBox, { marginTop: 15 }]}>
        <Text style={styles.importantText}>
          All documents in this packet must be reviewed, signed, and dated by the employee
          and witnessed by the Administrator/Supervisor.
        </Text>
      </View>

      <PageFooter pageNum={1} />
    </Page>
  );
}

// Pages 2-3: Employee Application
function EmployeeApplicationPages({ data }: { data: EmployeeOnboardingData }) {
  return (
    <>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>EMPLOYEE APPLICATION</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>FULL NAME</Text>
          <Text style={styles.prefilledName}>{data.employeeName}</Text>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.prefilledDate}>{data.hireDate}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Department/Group</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>ADDRESS</Text>
          <View style={styles.twoColumn}>
            <View style={[styles.column, { flex: 2 }]}>
              <View style={styles.fieldLine} />
              <Text style={[styles.fieldLabel, { marginTop: 2 }]}>Street Address</Text>
            </View>
            <View style={styles.column}>
              <View style={styles.fieldLine} />
              <Text style={[styles.fieldLabel, { marginTop: 2 }]}>Apt/Unit #</Text>
            </View>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={[styles.column, { flex: 2 }]}>
            <View style={styles.formField}>
              <View style={styles.fieldLine} />
              <Text style={[styles.fieldLabel, { marginTop: 2 }]}>City</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <View style={styles.fieldLine} />
              <Text style={[styles.fieldLabel, { marginTop: 2 }]}>State</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <View style={styles.fieldLine} />
              <Text style={[styles.fieldLabel, { marginTop: 2 }]}>Zip Code</Text>
            </View>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date Available</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Social Security Number</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Desired Salary</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Position Applied For</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
        </View>

        <View style={[styles.twoColumn, { marginTop: 10 }]}>
          <View style={styles.column}>
            <Text style={{ fontSize: 9 }}>Are you a citizen of the USA?</Text>
            <View style={{ flexDirection: "row", marginTop: 5 }}>
              <View style={[styles.checkboxRow, { marginRight: 15 }]}>
                <View style={styles.checkbox} />
                <Text>Yes</Text>
              </View>
              <View style={styles.checkboxRow}>
                <View style={styles.checkbox} />
                <Text>No</Text>
              </View>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={{ fontSize: 9 }}>If no, are you authorized to work in the US?</Text>
            <View style={{ flexDirection: "row", marginTop: 5 }}>
              <View style={[styles.checkboxRow, { marginRight: 15 }]}>
                <View style={styles.checkbox} />
                <Text>Yes</Text>
              </View>
              <View style={styles.checkboxRow}>
                <View style={styles.checkbox} />
                <Text>No</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.twoColumn, { marginTop: 10 }]}>
          <View style={styles.column}>
            <Text style={{ fontSize: 9 }}>Have you ever worked for this company?</Text>
            <View style={{ flexDirection: "row", marginTop: 5 }}>
              <View style={[styles.checkboxRow, { marginRight: 15 }]}>
                <View style={styles.checkbox} />
                <Text>Yes</Text>
              </View>
              <View style={styles.checkboxRow}>
                <View style={styles.checkbox} />
                <Text>No</Text>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>If yes, when?</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
          <View style={styles.column}>
            <Text style={{ fontSize: 9 }}>Have you ever been convicted of a felony?</Text>
            <View style={{ flexDirection: "row", marginTop: 5 }}>
              <View style={[styles.checkboxRow, { marginRight: 15 }]}>
                <View style={styles.checkbox} />
                <Text>Yes</Text>
              </View>
              <View style={styles.checkboxRow}>
                <View style={styles.checkbox} />
                <Text>No</Text>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>If yes, explain:</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
        </View>

        <PageFooter pageNum={2} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>EMPLOYEE APPLICATION (Continued)</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Education</Text>
        </View>

        {[
          { label: "High School", fields: ["Address", "From", "To", "Did you graduate?", "Degree"] },
          { label: "College", fields: ["Address", "From", "To", "Did you graduate?", "Degree"] },
          { label: "Other", fields: ["Address", "From", "To", "Did you graduate?", "Degree"] },
        ].map((edu, idx) => (
          <View key={idx} style={{ marginBottom: 8 }}>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>{edu.label}</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>From / To</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Did you graduate? / Degree</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>References</Text>
        </View>
        <Text style={[styles.paragraph, { fontSize: 9 }]}>Please list three professional references:</Text>

        {[1, 2, 3].map((num) => (
          <View key={num} style={{ marginBottom: 10 }}>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Relationship</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Company</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Previous Employment</Text>
        </View>

        {[1, 2].map((num) => (
          <View key={num} style={{ marginBottom: 8 }}>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Company</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Job Title / Supervisor</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Starting / Ending Salary</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>From / To</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Reason for Leaving</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
            <View style={styles.checkboxRow}>
              <Text style={{ fontSize: 8, marginRight: 5 }}>May we contact this employer?</Text>
              <View style={[styles.checkbox, { width: 10, height: 10 }]} />
              <Text style={{ fontSize: 8, marginRight: 10 }}>Yes</Text>
              <View style={[styles.checkbox, { width: 10, height: 10 }]} />
              <Text style={{ fontSize: 8 }}>No</Text>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Military Service</Text>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Branch</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>From / To</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
        </View>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Rank at Discharge</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Type of Discharge</Text>
              <View style={styles.fieldLine} />
            </View>
          </View>
        </View>

        <PageFooter pageNum={3} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>EMPLOYEE APPLICATION (Continued)</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Disclaimer and Signature</Text>
        </View>

        <Text style={[styles.paragraph, { fontSize: 9 }]}>
          I certify that my answers are true and complete to the best of my knowledge. If this application
          leads to employment, I understand that false or misleading information in my application or
          interview may result in my release.
        </Text>

        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.prefilledName}>{data.employeeName}</Text>
              <Text style={styles.signatureLabel}>Applicant Name (Printed)</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Applicant Signature</Text>
            </View>
            <View style={{ width: 120 }}>
              <View style={styles.dateLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        <PageFooter pageNum={4} />
      </Page>
    </>
  );
}

// Page 4: Employment Contract
function EmploymentContractPage({ data }: { data: EmployeeOnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>EMPLOYMENT CONTRACT</Text>
      </View>

      <Text style={styles.paragraph}>
        {data.facilityName} hereby agrees to employ {data.employeeName} under the terms
        and conditions set forth herein, and Employee hereby agrees to accept those terms and conditions.
      </Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Position</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <Text style={styles.prefilledDate}>{data.hireDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Compensation</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
        <View style={styles.circleOption}>
          <View style={styles.circle} />
          <Text>Salary $________</Text>
        </View>
        <Text style={{ marginRight: 10 }}>OR</Text>
        <View style={styles.circleOption}>
          <View style={styles.circle} />
          <Text>Hourly $________</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Terms of Employment</Text>
      </View>

      <Text style={styles.paragraph}>
        The employment may be terminated at any time without cause either by the employer or by the employee.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dispute Resolution</Text>
      </View>

      <Text style={[styles.paragraph, { fontSize: 9 }]}>
        Any dispute or claim arising out of or relating to this employment agreement, or that relates to
        the breach of this agreement, or that arises out of or is based upon employment relation (including
        any wage claim, any claim for wrongful termination, or any claim based upon any statute, regulation,
        or law, including those dealing with employment discrimination, sexual harassment, civil rights,
        age, or disability), including tort claims (except a tort that is a &apos;compensable injury&apos; under
        workers compensation law), shall be resolved by arbitration in accordance with the then effective
        arbitration rules and judgment upon the award rendered pursuant to such arbitration may be entered
        in any court having jurisdiction thereof.
      </Text>

      <View style={styles.signatureSection} wrap={false}>
        <EmployeeSignatureBlock name={data.employeeName} hireDate={data.hireDate} />
        <AdminSignature />
      </View>

      <PageFooter pageNum={5} />
    </Page>
  );
}

// Page 6: Job Description
function JobDescriptionPage({ data }: { data: EmployeeOnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>JOB DESCRIPTION AND QUALIFICATIONS</Text>
        <Text style={styles.subtitle}>Behavioral Health Paraprofessional (BHT)</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>POSITION TITLE</Text>
            <Text style={{ fontWeight: "bold" }}>BHT</Text>
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>REPORTS TO</Text>
            <Text>Administrator / Assistant Administrator / Supervisor / Nurse</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>POSITION SUMMARY</Text>
            <Text>Provides behavioral health support to residents in a 24-hour behavioral health residential facility.</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Responsibilities</Text>
      </View>

      <View style={{ fontSize: 8 }}>
        {[
          "Serves as part of the resident's treatment team",
          "Makes necessary referrals and serves as liaison with other agencies",
          "Provides timely documentation to support services rendered",
          "Builds support network around resident by working with authorized collateral sources",
          "Provides clinical supportive interventions according to treatment plan",
          "Ensures resident's attendance to medication evaluation and appointments",
          "Monitors and reports the activities of residents",
          "Ensures the security of the facility and safety of the residents",
          "Documents emergency situations and notifies appropriate staff",
          "Completes daily progress notes documenting progress toward treatment plan goals",
          "Reports to incoming staff at the end of each shift",
          "Transports residents to and from appointments when indicated",
          "Monitors residents' self-administration of medications",
          "Maintains appropriate resident/staff boundaries",
        ].map((item, idx) => (
          <View key={idx} style={styles.numberedItem}>
            <Text style={[styles.number, { width: 18 }]}>{idx + 1}.</Text>
            <Text style={styles.numberedText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Requirements</Text>
      </View>

      <View style={{ fontSize: 9 }}>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>High School diploma or GED and must be at least 21 years of age</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Knowledge of basic crisis intervention, de-escalation methods</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Must have CPR/First Aid training</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Must be able to obtain a fingerprint clearance card</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>TB skin test required</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Possess valid driver&apos;s license OR identification card</Text>
        </View>
      </View>

      <Text style={[styles.paragraph, { marginTop: 10, fontSize: 9 }]}>
        Your signature below indicates that you have read and understand fully the above job description
        for the position you hold and responsibilities as a BHT.
      </Text>

      <View style={styles.signatureSection} wrap={false}>
        <EmployeeSignatureBlock name={data.employeeName} hireDate={data.hireDate} />
        <AdminSignature />
      </View>

      <PageFooter pageNum={6} />
    </Page>
  );
}

// Page 7: Reference Check Form
function ReferenceCheckPage({ data }: { data: EmployeeOnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>REFERENCE CHECK FORM</Text>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>APPLICANT NAME</Text>
        <Text style={styles.prefilledName}>{data.employeeName}</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Name of Reference</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Company</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Title</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Relationship with Applicant</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Applicant&apos;s Job Title</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Date of Employment (From/To)</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Salary</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Reason for Leaving</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Would You Rehire?</Text>
        <View style={styles.fieldLine} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Job Duties</Text>
        <View style={[styles.fieldLine, { height: 40 }]} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Relationship with Others</Text>
        <View style={styles.fieldLine} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Quality and Productivity</Text>
        <View style={styles.fieldLine} />
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Strengths</Text>
            <View style={[styles.fieldLine, { height: 30 }]} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Areas for Improvement</Text>
            <View style={[styles.fieldLine, { height: 30 }]} />
          </View>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Work Habits (Attendance, Punctuality, Dependability)</Text>
        <View style={styles.fieldLine} />
      </View>

      <View style={styles.signatureSection} wrap={false}>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Reference Name</Text>
          </View>
          <View style={{ width: 120 }}>
            <View style={styles.dateLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Interviewer Name</Text>
          </View>
          <View style={{ width: 120 }}>
            <View style={styles.dateLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
      </View>

      <PageFooter pageNum={7} />
    </Page>
  );
}

// Page 8: Confidentiality Agreement
function ConfidentialityAgreementPage({ data }: { data: EmployeeOnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>CONFIDENTIALITY AGREEMENT</Text>
      </View>

      <Text style={styles.paragraph}>
        I, {data.employeeName}, understand that I may hear, see, and create information that is
        private and confidential.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Examples of Confidential Information</Text>
      </View>

      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>All resident information - written and verbal</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Private employee information (such as salaries, disciplinary actions, etc.)</Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Business information that belongs to the facility, including:</Text>
      </View>
      <View style={{ paddingLeft: 25 }}>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Copyrighted computer programs</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Business plans</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.bulletText}>Contract terms, financial cost data and other internal intellectual property</Text>
        </View>
      </View>

      <View style={[styles.importantBox, { marginTop: 15 }]}>
        <Text style={styles.importantText}>
          Keeping resident, employee, and intellectual property information private and confidential
          is critically important. Failure to do so may result in corrective action, including
          termination and possibly legal action.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>I Promise</Text>
      </View>

      <View style={styles.numberedItem}>
        <Text style={styles.number}>1.</Text>
        <Text style={styles.numberedText}>
          I will use confidential information only as needed to do my job. I will not access resident
          or employee information that is not needed to do my job.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>2.</Text>
        <Text style={styles.numberedText}>
          I will release resident information in accordance with the facility&apos;s Confidentiality,
          Code of Ethics, Use and Disclosure policies.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>3.</Text>
        <Text style={styles.numberedText}>
          I will not share confidential information in a careless manner.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>4.</Text>
        <Text style={styles.numberedText}>
          I understand that information on facility computers may not be protected from legal discovery.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>5.</Text>
        <Text style={styles.numberedText}>
          I will report if I think private or confidential information is being accessed improperly.
        </Text>
      </View>
      <View style={styles.numberedItem}>
        <Text style={styles.number}>6.</Text>
        <Text style={styles.numberedText}>
          I understand that these promises carry over even if my employment should end.
        </Text>
      </View>

      <View style={styles.signatureSection} wrap={false}>
        <EmployeeSignatureBlock name={data.employeeName} hireDate={data.hireDate} />
        <AdminSignature />
      </View>

      <PageFooter pageNum={8} />
    </Page>
  );
}

// Page 9: Verification of Skills
function VerificationOfSkillsPage({ data }: { data: EmployeeOnboardingData }) {
  const skills = [
    { title: "Protecting Client Rights", description: "Reviewing and understanding client rights/violation precautions" },
    { title: "Resident Treatment", description: "Identify positive teaching techniques and strategies" },
    { title: "Medication Services", description: "Instruction and procedures demonstrated by registered nurse" },
    { title: "Caring for the Aging", description: "Monitoring needs of the aging with mental health issues" },
    { title: "HIPAA Training", description: "Summarize all state laws regarding privacy of resident information" },
    { title: "Crisis Intervention", description: "Role play crisis situations and response procedures" },
    { title: "Understanding Resident Treatment", description: "Define monitoring and requirements for treatment plan implementation" },
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>VERIFICATION OF SKILLS</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Employee Name</Text>
            <Text style={styles.prefilledName}>{data.employeeName}</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={styles.prefilledDate}>{data.hireDate}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.paragraph, { fontSize: 9 }]}>
        METHOD OF VERIFICATION: V = Vision | O = Observation | R = Role Play
      </Text>

      <View style={{ marginTop: 10 }}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: "25%" }]}>Course Title</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Description</Text>
          <Text style={[styles.tableHeaderText, { width: "12%" }]}>Verified</Text>
          <Text style={[styles.tableHeaderText, { width: "12%" }]}>Method</Text>
        </View>
        {skills.map((skill, idx) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={{ width: "25%", fontSize: 8 }}>{skill.title}</Text>
            <Text style={{ flex: 1, fontSize: 8 }}>{skill.description}</Text>
            <Text style={{ width: "12%", fontSize: 8 }}></Text>
            <Text style={{ width: "12%", fontSize: 8 }}></Text>
          </View>
        ))}
      </View>

      <View style={styles.signatureSection} wrap={false}>
        <EmployeeSignatureBlock name={data.employeeName} hireDate={data.hireDate} />
        <AdminSignature />
      </View>

      <PageFooter pageNum={9} />
    </Page>
  );
}

// Page 10: New Employee Orientation
function NewEmployeeOrientationPage({ data }: { data: EmployeeOnboardingData }) {
  const orientationTopics = [
    "Personal introduction to facility and staff",
    "Resident introductions",
    "Personnel file review",
    "Code of conduct",
    "Employee competencies",
    "Fire, disaster, hazard, and medical emergency procedures",
    "Responding to a resident in crisis",
    "Immediate reporting of abuse, neglect, and exploitation",
    "Violations of resident's rights",
    "Residents' records: Location and protection",
    "Policies and procedures",
    "House rules",
    "Resident rights",
    "Work schedules and time sheets",
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>NEW EMPLOYEE ORIENTATION</Text>
      </View>

      <Text style={styles.paragraph}>
        The topics covered during your orientation are designed to acquaint you with the facility,
        its personnel, residents, policies, procedures, routines, surroundings, and other related
        procedures to ensure the highest quality of care for residents within a safe and responsive environment.
      </Text>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Employee Name</Text>
            <Text style={styles.prefilledName}>{data.employeeName}</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Date of Hire</Text>
            <Text style={styles.prefilledDate}>{data.hireDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>First Date Providing Service</Text>
        <View style={[styles.fieldLine, { width: 200 }]} />
      </View>

      <View style={{ marginTop: 10 }}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Subject</Text>
          <Text style={[styles.tableHeaderText, { width: "20%" }]}>Lead Person</Text>
          <Text style={[styles.tableHeaderText, { width: "15%" }]}>Employee Initials</Text>
        </View>
        {orientationTopics.map((topic, idx) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={{ flex: 1, fontSize: 8 }}>{topic}</Text>
            <Text style={{ width: "20%", fontSize: 8 }}></Text>
            <Text style={{ width: "15%", fontSize: 8 }}></Text>
          </View>
        ))}
      </View>

      <View style={styles.signatureSection} wrap={false}>
        <AdminSignature />
      </View>

      <PageFooter pageNum={10} />
    </Page>
  );
}

// Pages 11-12: Medication Administration Training
function MedicationTrainingPages({ data }: { data: EmployeeOnboardingData }) {
  const policyReviews = [
    { num: 1, title: "Pharmacy Packaging", desc: "Demonstrates competency regarding prescription label information (five rights)" },
    { num: 2, title: "Medication Storage", desc: "Demonstrates competency in medication storage according to guidelines" },
    { num: 3, title: "Forms/Documentation", desc: "Demonstrates competency in systems used to track medication administration" },
    { num: 4, title: "Discontinuing Medications", desc: "Demonstrates competency in proper documentation of medication discontinuation" },
    { num: 5, title: "Disposing of Medications", desc: "Demonstrates competency in proper medication disposal" },
    { num: 6, title: "Adverse Reactions", desc: "Demonstrates competency in potential adverse reactions and side effects" },
    { num: 7, title: "Reporting", desc: "Demonstrates competency in reporting medication administration errors" },
    { num: 8, title: "PRN Usage", desc: "Demonstrates competency in agency PRN policies and practices" },
  ];

  const policyReviews2 = [
    { num: 9, title: "Refusals", desc: "Demonstrates competency regarding medication refusals or misuse" },
    { num: 10, title: "Medication Errors", desc: "Accurately defining medication errors and identifying ways to minimize them" },
    { num: 11, title: "Missed Medication", desc: "Accurately describing agency protocol for missed medication" },
    { num: 12, title: "Medical Appointments", desc: "Competency when accompanying individuals to medical appointments" },
    { num: 13, title: "Self-Medication", desc: "Competency in agency policy regarding self-medication" },
    { num: 14, title: "Off-Site Administration", desc: "Competency in medication practices while on trips or away from home" },
    { num: 15, title: "Person-Centered Approach", desc: "Competency in treating each person with respect and assuring privacy" },
  ];

  return (
    <>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ASSISTANCE WITH SELF-ADMINISTRATION</Text>
          <Text style={styles.subtitle}>OF MEDICATION TRAINING</Text>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Staff Name</Text>
              <Text style={styles.prefilledName}>{data.employeeName}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.prefilledDate}>{data.hireDate}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: 25 }]}>#</Text>
            <Text style={[styles.tableHeaderText, { width: "25%" }]}>Policy Review</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { width: 30 }]}>Yes</Text>
            <Text style={[styles.tableHeaderText, { width: 30 }]}>No</Text>
          </View>
          {policyReviews.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={{ width: 25, fontSize: 8 }}>{item.num}.</Text>
              <Text style={{ width: "25%", fontSize: 8 }}>{item.title}</Text>
              <Text style={{ flex: 1, fontSize: 7 }}>{item.desc}</Text>
              <Text style={{ width: 30, fontSize: 8 }}></Text>
              <Text style={{ width: 30, fontSize: 8 }}></Text>
            </View>
          ))}
        </View>

        <PageFooter pageNum={11} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>MEDICATION TRAINING (Continued)</Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: 25 }]}>#</Text>
            <Text style={[styles.tableHeaderText, { width: "25%" }]}>Policy Review</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { width: 30 }]}>Yes</Text>
            <Text style={[styles.tableHeaderText, { width: 30 }]}>No</Text>
          </View>
          {policyReviews2.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={{ width: 25, fontSize: 8 }}>{item.num}.</Text>
              <Text style={{ width: "25%", fontSize: 8 }}>{item.title}</Text>
              <Text style={{ flex: 1, fontSize: 7 }}>{item.desc}</Text>
              <Text style={{ width: 30, fontSize: 8 }}></Text>
              <Text style={{ width: 30, fontSize: 8 }}></Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Practice Requirements</Text>
        </View>

        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>16. Successful completion of mock trial of administering medication</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>17. Successful documentation of agency Medication Administration Record (MAR)</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>18. If applicable, successful creation of a new agency MAR</Text>
        </View>
        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text>19. Successful administration of 3 medication passes without prompts</Text>
        </View>

        <View style={styles.signatureSection} wrap={false}>
          <EmployeeSignatureBlock name={data.employeeName} hireDate={data.hireDate} />
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Nurse Name & Signature</Text>
            </View>
            <View style={{ width: 120 }}>
              <View style={styles.dateLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        <PageFooter pageNum={12} />
      </Page>
    </>
  );
}

// Page 13: Onboarding Checklist
function OnboardingChecklistPage({ data }: { data: EmployeeOnboardingData }) {
  const tasks = [
    "Facility/premise orientation",
    "Garbage handling & collection days",
    "Food packaging instructions",
    "Functionality of house machines",
    "House supplies, food and beverage management",
    "House tools/equipment handling",
    "Preparation of shopping list",
    "House rules and resident management",
    "Notice board details and use",
    "Medication management/handling",
    "Medication refills",
    "Residents' money management/records",
    "Making progress notes",
    "Making cancellation notes",
    "Making MARs",
    "Monthly clinical summary",
    "Concurrent reviews",
    "Correspondence with PCP/Doctors",
    "Appointment management",
    "Intake file and data entry",
    "Office supplies management",
    "Computer password/credentials",
    "Network password",
    "Filing (Electronic/Paperwork)",
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>ONBOARDING CHECKLIST TRAINING</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Trainee Name</Text>
            <Text style={styles.prefilledName}>{data.employeeName}</Text>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={styles.prefilledDate}>{data.hireDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Trainer Name</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Trainer Date</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Task Covered</Text>
          <Text style={[styles.tableHeaderText, { width: 40 }]}>Check</Text>
          <Text style={[styles.tableHeaderText, { width: 60 }]}>Trainer</Text>
          <Text style={[styles.tableHeaderText, { width: 60 }]}>Trainee</Text>
        </View>
        {tasks.map((task, idx) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={{ flex: 1, fontSize: 8 }}>{task}</Text>
            <Text style={{ width: 40, fontSize: 8 }}></Text>
            <Text style={{ width: 60, fontSize: 8 }}></Text>
            <Text style={{ width: 60, fontSize: 8 }}></Text>
          </View>
        ))}
      </View>

      <View style={styles.signatureSection} wrap={false}>
        <EmployeeSignatureBlock name={data.employeeName} hireDate={data.hireDate} />
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Trainer Signature</Text>
          </View>
          <View style={{ width: 120 }}>
            <View style={styles.dateLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
      </View>

      <PageFooter pageNum={13} />
    </Page>
  );
}

// Page 14: Employee Packet Acknowledgment
function AcknowledgmentPage({ data }: { data: EmployeeOnboardingData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>EMPLOYEE PACKET ACKNOWLEDGMENT</Text>
      </View>

      <Text style={styles.paragraph}>
        I, {data.employeeName}, acknowledge that I have received, read, and understand the contents
        of this Employee Packet. I agree to comply with all policies, procedures, and guidelines
        contained herein.
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>I Understand That</Text>
      </View>

      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>
          Employment is at-will and may be terminated at any time by either party
        </Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>
          I am responsible for maintaining confidentiality of all resident and business information
        </Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>
          I must complete all required training and maintain required certifications
        </Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>
          I must report any concerns regarding abuse, neglect, or exploitation immediately
        </Text>
      </View>
      <View style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>
          Violation of policies may result in disciplinary action up to and including termination
        </Text>
      </View>

      <View style={[styles.importantBox, { marginTop: 20 }]}>
        <Text style={styles.importantText}>
          This completes the Employee Onboarding Packet. Please ensure all pages have been
          reviewed and signed by both the employee and the administrator/supervisor.
        </Text>
      </View>

      <View style={[styles.signatureSection, { marginTop: 30 }]} wrap={false}>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.prefilledName}>{data.employeeName}</Text>
            <Text style={styles.signatureLabel}>Employee Name (Printed)</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Employee Signature</Text>
          </View>
          <View style={{ width: 120 }}>
            <View style={styles.dateLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Witness/Administrator Name (Printed)</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Witness/Administrator Signature</Text>
          </View>
          <View style={{ width: 120 }}>
            <View style={styles.dateLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
      </View>

      <PageFooter pageNum={14} />
    </Page>
  );
}

export function EmployeeOnboardingPDF({ data }: { data: EmployeeOnboardingData }) {
  return (
    <Document>
      <IndexPage data={data} />
      <EmployeeApplicationPages data={data} />
      <EmploymentContractPage data={data} />
      <JobDescriptionPage data={data} />
      <ReferenceCheckPage data={data} />
      <ConfidentialityAgreementPage data={data} />
      <VerificationOfSkillsPage data={data} />
      <NewEmployeeOrientationPage data={data} />
      <MedicationTrainingPages data={data} />
      <OnboardingChecklistPage data={data} />
      <AcknowledgmentPage data={data} />
    </Document>
  );
}
