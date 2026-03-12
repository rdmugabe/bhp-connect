// eMAR (Electronic Medication Administration Record) Utilities

export * from "./schedule-generator";
export * from "./alerts";

// Route labels for display
export const ROUTE_LABELS: Record<string, string> = {
  PO: "By mouth (PO)",
  SL: "Sublingual (SL)",
  IM: "Intramuscular (IM)",
  IV: "Intravenous (IV)",
  SC: "Subcutaneous (SC)",
  TOPICAL: "Topical",
  INHALED: "Inhaled",
  OPHTHALMIC: "Ophthalmic (eye)",
  OTIC: "Otic (ear)",
  NASAL: "Nasal",
  RECTAL: "Rectal",
  TRANSDERMAL: "Transdermal (patch)",
  OTHER: "Other",
};

// Administration status labels
export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  DUE: "Due Now",
  GIVEN: "Given",
  REFUSED: "Refused",
  HELD: "Held",
  MISSED: "Missed",
  NOT_AVAILABLE: "Not Available",
  LOA: "Leave of Absence",
  DISCONTINUED: "Discontinued",
};

// Status colors for UI
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: "bg-gray-100", text: "text-gray-700" },
  DUE: { bg: "bg-yellow-100", text: "text-yellow-800" },
  GIVEN: { bg: "bg-green-100", text: "text-green-800" },
  REFUSED: { bg: "bg-red-100", text: "text-red-800" },
  HELD: { bg: "bg-orange-100", text: "text-orange-800" },
  MISSED: { bg: "bg-red-200", text: "text-red-900" },
  NOT_AVAILABLE: { bg: "bg-gray-200", text: "text-gray-800" },
  LOA: { bg: "bg-blue-100", text: "text-blue-800" },
  DISCONTINUED: { bg: "bg-gray-300", text: "text-gray-900" },
};

// Alert severity colors
export const ALERT_SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  CRITICAL: { bg: "bg-red-50", border: "border-red-400", text: "text-red-800" },
  WARNING: { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-800" },
  INFO: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-800" },
};

// The 6 Rights of Medication Administration
export const SIX_RIGHTS = [
  {
    id: "right_patient",
    label: "Right Patient",
    description: "Verify patient identity using two identifiers (name and date of birth)",
  },
  {
    id: "right_medication",
    label: "Right Medication",
    description: "Verify medication name and strength match the order",
  },
  {
    id: "right_dose",
    label: "Right Dose",
    description: "Verify the dose amount to be administered",
  },
  {
    id: "right_route",
    label: "Right Route",
    description: "Verify the route of administration (PO, IM, IV, etc.)",
  },
  {
    id: "right_time",
    label: "Right Time",
    description: "Verify the administration time is correct",
  },
  {
    id: "right_documentation",
    label: "Right Documentation",
    description: "Verify the order is current and properly documented",
  },
] as const;

// Controlled substance schedules
export const CONTROLLED_SCHEDULES = [
  { value: "II", label: "Schedule II" },
  { value: "III", label: "Schedule III" },
  { value: "IV", label: "Schedule IV" },
  { value: "V", label: "Schedule V" },
] as const;

// Common dosage forms
export const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Liquid",
  "Syrup",
  "Suspension",
  "Solution",
  "Injection",
  "Patch",
  "Cream",
  "Ointment",
  "Gel",
  "Drops",
  "Spray",
  "Inhaler",
  "Suppository",
  "Other",
] as const;

// Shift definitions (for reporting)
export const SHIFTS = {
  DAY: { label: "Day Shift", start: "07:00", end: "19:00" },
  NIGHT: { label: "Night Shift", start: "19:00", end: "07:00" },
} as const;
