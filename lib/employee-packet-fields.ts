/**
 * Field schema for the employee onboarding packet's fillable form.
 *
 * Both the signing page and the PDF template read field keys from this file,
 * so adding a question in one place automatically surfaces it in the other.
 * The map in `formData` on EmployeeOnboardingPacket uses these keys.
 *
 * Keep the field list in packet order — the signing UI renders sections in
 * the order declared here.
 */

export type FieldType = "text" | "textarea" | "date" | "yesno" | "choice" | "initials";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  /** For `choice`: the list of options. */
  options?: string[];
  placeholder?: string;
}

export interface Section {
  key: string;
  title: string;
  description?: string;
  fields: Field[];
}

const refFields = (n: number): Field[] => [
  { key: `reference${n}Name`, label: `Reference ${n} — Full Name`, type: "text" },
  { key: `reference${n}Relationship`, label: `Reference ${n} — Relationship`, type: "text" },
  { key: `reference${n}Company`, label: `Reference ${n} — Company`, type: "text" },
  { key: `reference${n}Phone`, label: `Reference ${n} — Phone`, type: "text" },
];

const prevEmployerFields = (n: number): Field[] => [
  { key: `prevEmployer${n}Company`, label: `Previous Employer ${n} — Company`, type: "text" },
  { key: `prevEmployer${n}Phone`, label: `Previous Employer ${n} — Phone`, type: "text" },
  { key: `prevEmployer${n}TitleSupervisor`, label: `Previous Employer ${n} — Job Title / Supervisor`, type: "text" },
  { key: `prevEmployer${n}SalaryStartEnd`, label: `Previous Employer ${n} — Starting / Ending Salary`, type: "text" },
  { key: `prevEmployer${n}FromTo`, label: `Previous Employer ${n} — From / To`, type: "text" },
  { key: `prevEmployer${n}MayContact`, label: `Previous Employer ${n} — May we contact?`, type: "yesno" },
  { key: `prevEmployer${n}ReasonForLeaving`, label: `Previous Employer ${n} — Reason for Leaving`, type: "textarea" },
];

const ORIENTATION_TOPICS: string[] = [
  "Personal introduction",
  "Resident introductions",
  "Personnel file review",
  "Code of conduct",
  "Employee competencies",
  "Fire / disaster / hazard / medical emergency procedures",
  "Responding to a resident in crisis",
  "Immediate reporting of abuse / neglect / exploitation",
  "Violations of resident's rights",
  "Residents' records location and protection",
  "Policies and procedures",
  "House rules",
  "Resident rights",
  "Work schedules and time sheets",
];

const ONBOARDING_TASKS: string[] = [
  "Facility / premise orientation",
  "Garbage handling",
  "Food packaging",
  "Functionality of house machines",
  "House supplies, food, and beverage management",
  "House tools and equipment handling",
  "Preparation of shopping list",
  "House rules and resident management",
  "Notice board",
  "Medication management and handling",
  "Medication refills",
  "Residents' money management and records",
  "Making progress notes",
  "Making cancellation notes",
  "Making MARs",
  "Monthly clinical summary",
  "Concurrent reviews",
  "Correspondence with PCP / Doctors",
  "Appointment management",
  "Intake file and data entry",
  "Office supplies management",
  "Computer password / credentials",
  "Network password",
  "Filing (electronic / paperwork)",
];

export const SECTIONS: Section[] = [
  {
    key: "position",
    title: "Position",
    fields: [
      { key: "position", label: "Position / Job Title", type: "text" },
      { key: "department", label: "Department / Group", type: "text" },
    ],
  },
  {
    key: "personal",
    title: "Personal Information",
    description: "Your contact and identifying information.",
    fields: [
      { key: "addressStreet", label: "Street Address", type: "text" },
      { key: "addressAptUnit", label: "Apt / Unit #", type: "text" },
      { key: "addressCity", label: "City", type: "text" },
      { key: "addressState", label: "State", type: "text" },
      { key: "addressZip", label: "Zip Code", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email Address", type: "text" },
      { key: "dateAvailable", label: "Date Available", type: "date" },
      { key: "ssn", label: "Social Security Number", type: "text" },
      { key: "desiredSalary", label: "Desired Salary", type: "text" },
      { key: "positionAppliedFor", label: "Position Applied For", type: "text" },
      { key: "usCitizen", label: "Are you a U.S. citizen?", type: "yesno" },
      { key: "authorizedToWork", label: "Authorized to work in the U.S.?", type: "yesno" },
      { key: "previouslyWorked", label: "Previously worked for this company?", type: "yesno" },
      { key: "previouslyWorkedWhen", label: "If yes, when?", type: "text" },
      { key: "felony", label: "Convicted of a felony?", type: "yesno" },
      { key: "felonyExplanation", label: "If yes, please explain", type: "textarea" },
    ],
  },
  {
    key: "education",
    title: "Education",
    fields: [
      { key: "highSchoolName", label: "High School — Name", type: "text" },
      { key: "highSchoolAddress", label: "High School — Address", type: "text" },
      { key: "highSchoolFromTo", label: "High School — From / To", type: "text" },
      { key: "highSchoolGraduateDegree", label: "High School — Graduated / Degree", type: "text" },
      { key: "collegeName", label: "College — Name", type: "text" },
      { key: "collegeAddress", label: "College — Address", type: "text" },
      { key: "collegeFromTo", label: "College — From / To", type: "text" },
      { key: "collegeGraduateDegree", label: "College — Graduated / Degree", type: "text" },
      { key: "otherSchoolName", label: "Other School — Name", type: "text" },
      { key: "otherSchoolAddress", label: "Other School — Address", type: "text" },
      { key: "otherSchoolFromTo", label: "Other School — From / To", type: "text" },
      { key: "otherSchoolGraduateDegree", label: "Other School — Graduated / Degree", type: "text" },
    ],
  },
  {
    key: "references",
    title: "References",
    description: "Three professional references.",
    fields: [...refFields(1), ...refFields(2), ...refFields(3)],
  },
  {
    key: "previousEmployment",
    title: "Previous Employment",
    description: "Up to two most recent positions.",
    fields: [...prevEmployerFields(1), ...prevEmployerFields(2)],
  },
  {
    key: "military",
    title: "Military Service (if applicable)",
    fields: [
      { key: "militaryBranch", label: "Branch", type: "text" },
      { key: "militaryFromTo", label: "From / To", type: "text" },
      { key: "militaryRankAtDischarge", label: "Rank at Discharge", type: "text" },
      { key: "militaryTypeOfDischarge", label: "Type of Discharge", type: "text" },
    ],
  },
  {
    key: "orientation",
    title: "New Employee Orientation — Your Initials",
    description:
      "After reviewing each orientation topic with your trainer, type your initials to acknowledge.",
    fields: ORIENTATION_TOPICS.map((topic, i) => ({
      key: `orientation${i + 1}EmployeeInitials`,
      label: topic,
      type: "initials" as const,
    })),
  },
  {
    key: "onboarding",
    title: "Onboarding Checklist — Your Initials",
    description: "Acknowledge each item as training is completed.",
    fields: ONBOARDING_TASKS.map((task, i) => ({
      key: `task${i + 1}TraineeInitials`,
      label: task,
      type: "initials" as const,
    })),
  },
];

export const ORIENTATION_LIST = ORIENTATION_TOPICS;
export const ONBOARDING_LIST = ONBOARDING_TASKS;

/** Flat lookup of every field in all sections. */
export const ALL_FIELDS: Field[] = SECTIONS.flatMap((s) => s.fields);

export type PacketFormData = Record<string, string | undefined>;

/** True when the value should render in the PDF. */
export function hasValue(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
