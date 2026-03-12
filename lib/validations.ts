import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  mfaCode: z.string().optional(),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["BHP", "BHRF"]),
    // BHP specific fields
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    // BHRF specific fields - facility application
    selectedBhpId: z.string().optional(),
    facilityName: z.string().optional(),
    facilityAddress: z.string().optional(),
    facilityPhone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // BHRF users must select a BHP
      if (data.role === "BHRF" && !data.selectedBhpId) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a BHP to register under",
      path: ["selectedBhpId"],
    }
  )
  .refine(
    (data) => {
      // BHRF users must provide facility name
      if (data.role === "BHRF" && !data.facilityName) {
        return false;
      }
      return true;
    },
    {
      message: "Facility name is required",
      path: ["facilityName"],
    }
  )
  .refine(
    (data) => {
      // BHRF users must provide facility address
      if (data.role === "BHRF" && !data.facilityAddress) {
        return false;
      }
      return true;
    },
    {
      message: "Facility address is required",
      path: ["facilityAddress"],
    }
  );

// Intake Step Schemas - 17 steps

// Step 1: Demographics
export const intakeStep1Schema = z.object({
  residentName: z.string().min(2, "Resident name is required"),
  ssn: z.string().max(4).optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  admissionDate: z.string().optional(),
  sex: z.string().optional(),
  sexualOrientation: z.string().optional(),
  ethnicity: z.string().optional(),
  nativeAmericanTribe: z.string().optional(),
  language: z.string().optional(),
  religion: z.string().min(1, "Religion is required"),
});

// Step 2: Contact & Emergency Information
export const intakeStep2Schema = z.object({
  patientAddress: z.string().optional(),
  patientPhone: z.string().optional(),
  patientEmail: z.string().email().optional().or(z.literal("")),
  contactPreference: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactAddress: z.string().optional(),
  primaryCarePhysician: z.string().optional(),
  primaryCarePhysicianPhone: z.string().optional(),
  caseManagerName: z.string().optional(),
  caseManagerPhone: z.string().optional(),
});

// Step 3: Insurance & Directives
export const intakeStep3Schema = z.object({
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  groupNumber: z.string().optional(),
  ahcccsHealthPlan: z.string().optional(),
  hasDNR: z.boolean().default(false),
  hasAdvancedDirective: z.boolean().default(false),
  hasWill: z.boolean().default(false),
  poaLegalGuardian: z.string().optional(),
});

// Step 4: Referral & Needs
export const intakeStep4Schema = z.object({
  referralSource: z.string().optional(),
  evaluatorName: z.string().optional(),
  evaluatorCredentials: z.string().optional(),
  reasonsForReferral: z.string().optional(),
  residentNeeds: z.string().optional(),
  residentExpectedLOS: z.string().optional(),
  teamExpectedLOS: z.string().optional(),
  strengthsAndLimitations: z.string().optional(),
  familyInvolved: z.string().optional(),
});

// Step 5: Behavioral Health Symptoms
export const intakeStep5Schema = z.object({
  reasonForServices: z.string().optional(),
  currentBehavioralSymptoms: z.string().optional(),
  copingWithSymptoms: z.string().optional(),
  symptomsLimitations: z.string().optional(),
  immediateUrgentNeeds: z.string().optional(),
  signsOfImprovement: z.string().optional(),
  assistanceExpectations: z.string().optional(),
  involvedInTreatment: z.string().optional(),
});

// Step 6: Medical Information
export const intakeStep6Schema = z.object({
  allergies: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1, "Medication name is required"),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    route: z.string().optional(),
    prescriber: z.string().optional(),
    purpose: z.string().optional(),
    startDate: z.string().optional(),
  })).optional(),
  historyNonCompliance: z.boolean().default(false),
  potentialViolence: z.boolean().default(false),
  medicalUrgency: z.string().optional(),
  personalMedicalHX: z.string().optional(),
  familyMedicalHX: z.string().optional(),
  medicalConditions: z.object({
    diabetes: z.boolean().optional(),
    heartDisease: z.boolean().optional(),
    hypertension: z.boolean().optional(),
    seizures: z.boolean().optional(),
    asthma: z.boolean().optional(),
    cancer: z.boolean().optional(),
    hepatitis: z.boolean().optional(),
    hiv: z.boolean().optional(),
    thyroid: z.boolean().optional(),
    kidney: z.boolean().optional(),
    liver: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bmi: z.string().optional(),
});

// Step 7: Psychiatric Presentation
export const intakeStep7Schema = z.object({
  isCOT: z.boolean().default(false),
  personalPsychHX: z.string().optional(),
  familyPsychHX: z.string().optional(),
  treatmentPreferences: z.string().optional(),
  psychMedicationEfficacy: z.string().optional(),
});

// Step 8: Risk Assessment
export const intakeStep8Schema = z.object({
  suicideHistory: z.string().optional(),
  suicideAttemptDetails: z.string().optional(),
  currentSuicideIdeation: z.boolean().default(false),
  suicideIdeationDetails: z.string().optional(),
  mostRecentSuicideIdeation: z.string().optional(),
  historySelfHarm: z.boolean().default(false),
  selfHarmDetails: z.string().optional(),
  dtsRiskFactors: z.object({
    accessToMeans: z.boolean().optional(),
    recentLoss: z.boolean().optional(),
    socialIsolation: z.boolean().optional(),
    substanceUse: z.boolean().optional(),
    previousAttempts: z.boolean().optional(),
    mentalHealthDiagnosis: z.boolean().optional(),
    chronicPain: z.boolean().optional(),
    hopelessness: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  dtsProtectiveFactors: z.object({
    familySupport: z.boolean().optional(),
    socialConnections: z.boolean().optional(),
    engagedInTreatment: z.boolean().optional(),
    spirituality: z.boolean().optional(),
    reasonsForLiving: z.boolean().optional(),
    copingSkills: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  historyHarmingOthers: z.boolean().default(false),
  harmingOthersDetails: z.string().optional(),
  homicidalIdeation: z.boolean().default(false),
  homicidalIdeationDetails: z.string().optional(),
  dtoRiskFactors: z.object({
    accessToWeapons: z.boolean().optional(),
    historyOfViolence: z.boolean().optional(),
    paranoia: z.boolean().optional(),
    substanceUse: z.boolean().optional(),
    identifiedTarget: z.boolean().optional(),
    stressors: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  dutyToWarnCompleted: z.boolean().default(false),
  dutyToWarnDetails: z.string().optional(),
  previousHospitalizations: z.string().optional(),
  hospitalizationDetails: z.string().optional(),
});

// Step 9: Developmental History
export const intakeStep9Schema = z.object({
  inUteroExposure: z.boolean().default(false),
  inUteroExposureDetails: z.string().optional(),
  developmentalMilestones: z.string().optional(),
  developmentalDetails: z.string().optional(),
  speechDifficulties: z.boolean().default(false),
  speechDetails: z.string().optional(),
  visualImpairment: z.boolean().default(false),
  visualDetails: z.string().optional(),
  hearingImpairment: z.boolean().default(false),
  hearingDetails: z.string().optional(),
  motorSkillsImpairment: z.boolean().default(false),
  motorSkillsDetails: z.string().optional(),
  cognitiveImpairment: z.boolean().default(false),
  cognitiveDetails: z.string().optional(),
  socialSkillsDeficits: z.boolean().default(false),
  socialSkillsDetails: z.string().optional(),
  immunizationStatus: z.string().optional(),
});

// Step 10: Skills Assessment
export const intakeStep10Schema = z.object({
  hygieneSkills: z.object({
    bathing: z.string().optional(),
    grooming: z.string().optional(),
    dressing: z.string().optional(),
    toileting: z.string().optional(),
    oralCare: z.string().optional(),
  }).optional(),
  skillsContinuation: z.object({
    mealPrep: z.string().optional(),
    housekeeping: z.string().optional(),
    laundry: z.string().optional(),
    money: z.string().optional(),
    transportation: z.string().optional(),
    communication: z.string().optional(),
    medication: z.string().optional(),
  }).optional(),
});

// Step 11: PHQ-9 Depression Screening
export const intakeStep11Schema = z.object({
  phq9Responses: z.array(z.number().min(0).max(3)).length(9).optional(),
  phq9TotalScore: z.number().min(0).max(27).optional(),
});

// Step 12: Treatment Planning
export const intakeStep12Schema = z.object({
  treatmentObjectives: z.string().optional(),
  dischargePlanObjectives: z.string().optional(),
  supportSystem: z.string().optional(),
  communityResources: z.string().optional(),
});

// Step 13: Social & Education History
export const intakeStep13Schema = z.object({
  childhoodDescription: z.string().optional(),
  abuseHistory: z.string().optional(),
  familyMentalHealthHistory: z.string().optional(),
  relationshipStatus: z.string().optional(),
  relationshipSatisfaction: z.string().optional(),
  friendsDescription: z.string().optional(),
  highestEducation: z.string().optional(),
  specialEducation: z.boolean().default(false),
  specialEducationDetails: z.string().optional(),
  plan504: z.boolean().default(false),
  iep: z.boolean().default(false),
  educationDetails: z.string().optional(),
  currentlyEmployed: z.boolean().default(false),
  employmentDetails: z.string().optional(),
  workVolunteerHistory: z.string().optional(),
  employmentBarriers: z.string().optional(),
});

// Step 14: Legal & Substance History
export const intakeStep14Schema = z.object({
  criminalLegalHistory: z.string().optional(),
  courtOrderedTreatment: z.boolean().default(false),
  courtOrderedDetails: z.string().optional(),
  otherLegalIssues: z.string().optional(),
  substanceHistory: z.string().optional(),
  substanceUseTable: z.array(z.object({
    substance: z.string().optional(),
    firstUse: z.string().optional(),
    lastUse: z.string().optional(),
    pattern: z.string().optional(),
    route: z.string().optional(),
  })).optional(),
  drugOfChoice: z.string().optional(),
  longestSobriety: z.string().optional(),
  substanceTreatmentHistory: z.string().optional(),
  nicotineUse: z.boolean().default(false),
  nicotineDetails: z.string().optional(),
  substanceImpact: z.string().optional(),
  historyOfAbuse: z.string().optional(),
});

// Step 15: Living Situation & ADLs
export const intakeStep15Schema = z.object({
  livingArrangements: z.string().optional(),
  sourceOfFinances: z.string().optional(),
  transportationMethod: z.string().optional(),
  adlChecklist: z.object({
    eating: z.string().optional(),
    bathing: z.string().optional(),
    dressing: z.string().optional(),
    toileting: z.string().optional(),
    transferring: z.string().optional(),
    continence: z.string().optional(),
  }).optional(),
  preferredActivities: z.string().optional(),
  significantOthers: z.string().optional(),
  supportLevel: z.string().optional(),
  typicalDay: z.string().optional(),
  strengthsAbilitiesInterests: z.string().optional(),
});

// Step 16: Behavioral Observations (Clinical)
export const intakeStep16Schema = z.object({
  appearanceAge: z.string().optional(),
  appearanceHeight: z.string().optional(),
  appearanceWeight: z.string().optional(),
  appearanceAttire: z.string().optional(),
  appearanceGrooming: z.string().optional(),
  appearanceDescription: z.string().optional(),
  demeanorMood: z.string().optional(),
  demeanorAffect: z.string().optional(),
  demeanorEyeContact: z.string().optional(),
  demeanorCooperation: z.string().optional(),
  demeanorDescription: z.string().optional(),
  speechArticulation: z.string().optional(),
  speechTone: z.string().optional(),
  speechRate: z.string().optional(),
  speechLatency: z.string().optional(),
  speechDescription: z.string().optional(),
  motorGait: z.string().optional(),
  motorPosture: z.string().optional(),
  motorActivity: z.string().optional(),
  motorMannerisms: z.string().optional(),
  motorDescription: z.string().optional(),
  cognitionThoughtContent: z.string().optional(),
  cognitionThoughtProcess: z.string().optional(),
  cognitionDelusions: z.string().optional(),
  cognitionPerception: z.string().optional(),
  cognitionJudgment: z.string().optional(),
  cognitionImpulseControl: z.string().optional(),
  cognitionInsight: z.string().optional(),
  cognitionDescription: z.string().optional(),
  estimatedIntelligence: z.string().optional(),
});

// Step 17: Wellness, Diagnosis & Final Review
export const intakeStep17Schema = z.object({
  healthNeeds: z.string().optional(),
  nutritionalNeeds: z.string().optional(),
  spiritualNeeds: z.string().optional(),
  culturalNeeds: z.string().optional(),
  educationHistory: z.string().optional(),
  vocationalHistory: z.string().optional(),
  crisisInterventionPlan: z.string().optional(),
  feedbackFrequency: z.string().optional(),
  dischargePlanning: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentRecommendation: z.string().optional(),
  signatures: z.object({
    clientSignature: z.string().optional(), // Base64 PNG image
    clientPrintedName: z.string().optional(),
    clientSignatureDate: z.string().optional(),
    assessorSignature: z.string().optional(), // Base64 PNG image
    assessorPrintedName: z.string().optional(),
    assessorSignatureDate: z.string().optional(),
    clinicalOversightSignature: z.string().optional(), // Base64 PNG image
    clinicalOversightPrintedName: z.string().optional(),
    clinicalOversightSignatureDate: z.string().optional(),
  }).optional(),
});

// Combined intake schema for full submission
export const intakeSchema = intakeStep1Schema
  .merge(intakeStep2Schema)
  .merge(intakeStep3Schema)
  .merge(intakeStep4Schema)
  .merge(intakeStep5Schema)
  .merge(intakeStep6Schema.omit({ medications: true }))
  .merge(intakeStep7Schema)
  .merge(intakeStep8Schema)
  .merge(intakeStep9Schema)
  .merge(intakeStep10Schema)
  .merge(intakeStep11Schema)
  .merge(intakeStep12Schema)
  .merge(intakeStep13Schema)
  .merge(intakeStep14Schema)
  .merge(intakeStep15Schema)
  .merge(intakeStep16Schema)
  .merge(intakeStep17Schema);

// Draft schema - allows partial data with minimal requirements
export const intakeDraftSchema = z.object({
  // Step 1: Demographics
  residentName: z.string().optional().default(""),
  ssn: z.string().max(4).optional(),
  dateOfBirth: z.string().optional().default(""),
  admissionDate: z.string().optional(),
  sex: z.string().optional(),
  sexualOrientation: z.string().optional(),
  ethnicity: z.string().optional(),
  nativeAmericanTribe: z.string().optional(),
  language: z.string().optional(),
  religion: z.string().optional(),

  // Step 2: Contact & Emergency
  patientAddress: z.string().optional(),
  patientPhone: z.string().optional(),
  patientEmail: z.string().optional(),
  contactPreference: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactAddress: z.string().optional(),
  primaryCarePhysician: z.string().optional(),
  primaryCarePhysicianPhone: z.string().optional(),
  caseManagerName: z.string().optional(),
  caseManagerPhone: z.string().optional(),

  // Step 3: Insurance & Directives
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  groupNumber: z.string().optional(),
  ahcccsHealthPlan: z.string().optional(),
  hasDNR: z.boolean().optional().default(false),
  hasAdvancedDirective: z.boolean().optional().default(false),
  hasWill: z.boolean().optional().default(false),
  poaLegalGuardian: z.string().optional(),

  // Step 4: Referral & Needs
  referralSource: z.string().optional(),
  evaluatorName: z.string().optional(),
  evaluatorCredentials: z.string().optional(),
  reasonsForReferral: z.string().optional(),
  residentNeeds: z.string().optional(),
  residentExpectedLOS: z.string().optional(),
  teamExpectedLOS: z.string().optional(),
  strengthsAndLimitations: z.string().optional(),
  familyInvolved: z.string().optional(),

  // Step 5: Behavioral Health Symptoms
  reasonForServices: z.string().optional(),
  currentBehavioralSymptoms: z.string().optional(),
  copingWithSymptoms: z.string().optional(),
  symptomsLimitations: z.string().optional(),
  immediateUrgentNeeds: z.string().optional(),
  signsOfImprovement: z.string().optional(),
  assistanceExpectations: z.string().optional(),
  involvedInTreatment: z.string().optional(),

  // Step 6: Medical Information
  allergies: z.string().optional(),
  historyNonCompliance: z.boolean().optional().default(false),
  potentialViolence: z.boolean().optional().default(false),
  medicalUrgency: z.string().optional(),
  personalMedicalHX: z.string().optional(),
  familyMedicalHX: z.string().optional(),
  medicalConditions: z.object({
    diabetes: z.boolean().optional(),
    heartDisease: z.boolean().optional(),
    hypertension: z.boolean().optional(),
    seizures: z.boolean().optional(),
    asthma: z.boolean().optional(),
    cancer: z.boolean().optional(),
    hepatitis: z.boolean().optional(),
    hiv: z.boolean().optional(),
    thyroid: z.boolean().optional(),
    kidney: z.boolean().optional(),
    liver: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bmi: z.string().optional(),

  // Step 7: Psychiatric Presentation
  isCOT: z.boolean().optional().default(false),
  personalPsychHX: z.string().optional(),
  familyPsychHX: z.string().optional(),
  treatmentPreferences: z.string().optional(),
  psychMedicationEfficacy: z.string().optional(),

  // Step 8: Risk Assessment
  suicideHistory: z.string().optional(),
  suicideAttemptDetails: z.string().optional(),
  currentSuicideIdeation: z.boolean().optional().default(false),
  suicideIdeationDetails: z.string().optional(),
  mostRecentSuicideIdeation: z.string().optional(),
  historySelfHarm: z.boolean().optional().default(false),
  selfHarmDetails: z.string().optional(),
  dtsRiskFactors: z.object({
    accessToMeans: z.boolean().optional(),
    recentLoss: z.boolean().optional(),
    socialIsolation: z.boolean().optional(),
    substanceUse: z.boolean().optional(),
    previousAttempts: z.boolean().optional(),
    mentalHealthDiagnosis: z.boolean().optional(),
    chronicPain: z.boolean().optional(),
    hopelessness: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  dtsProtectiveFactors: z.object({
    familySupport: z.boolean().optional(),
    socialConnections: z.boolean().optional(),
    engagedInTreatment: z.boolean().optional(),
    spirituality: z.boolean().optional(),
    reasonsForLiving: z.boolean().optional(),
    copingSkills: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  historyHarmingOthers: z.boolean().optional().default(false),
  harmingOthersDetails: z.string().optional(),
  homicidalIdeation: z.boolean().optional().default(false),
  homicidalIdeationDetails: z.string().optional(),
  dtoRiskFactors: z.object({
    accessToWeapons: z.boolean().optional(),
    historyOfViolence: z.boolean().optional(),
    paranoia: z.boolean().optional(),
    substanceUse: z.boolean().optional(),
    identifiedTarget: z.boolean().optional(),
    stressors: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  dutyToWarnCompleted: z.boolean().optional().default(false),
  dutyToWarnDetails: z.string().optional(),
  previousHospitalizations: z.string().optional(),
  hospitalizationDetails: z.string().optional(),

  // Step 9: Developmental History
  inUteroExposure: z.boolean().optional().default(false),
  inUteroExposureDetails: z.string().optional(),
  developmentalMilestones: z.string().optional(),
  developmentalDetails: z.string().optional(),
  speechDifficulties: z.boolean().optional().default(false),
  speechDetails: z.string().optional(),
  visualImpairment: z.boolean().optional().default(false),
  visualDetails: z.string().optional(),
  hearingImpairment: z.boolean().optional().default(false),
  hearingDetails: z.string().optional(),
  motorSkillsImpairment: z.boolean().optional().default(false),
  motorSkillsDetails: z.string().optional(),
  cognitiveImpairment: z.boolean().optional().default(false),
  cognitiveDetails: z.string().optional(),
  socialSkillsDeficits: z.boolean().optional().default(false),
  socialSkillsDetails: z.string().optional(),
  immunizationStatus: z.string().optional(),

  // Step 10: Skills Assessment
  hygieneSkills: z.object({
    bathing: z.string().optional(),
    grooming: z.string().optional(),
    dressing: z.string().optional(),
    toileting: z.string().optional(),
    oralCare: z.string().optional(),
  }).optional(),
  skillsContinuation: z.object({
    mealPrep: z.string().optional(),
    housekeeping: z.string().optional(),
    laundry: z.string().optional(),
    money: z.string().optional(),
    transportation: z.string().optional(),
    communication: z.string().optional(),
    medication: z.string().optional(),
  }).optional(),

  // Step 11: PHQ-9
  phq9Responses: z.array(z.number().min(0).max(3)).optional(),
  phq9TotalScore: z.number().min(0).max(27).optional(),

  // Step 12: Treatment Planning
  treatmentObjectives: z.string().optional(),
  dischargePlanObjectives: z.string().optional(),
  supportSystem: z.string().optional(),
  communityResources: z.string().optional(),

  // Step 13: Social & Education History
  childhoodDescription: z.string().optional(),
  abuseHistory: z.string().optional(),
  familyMentalHealthHistory: z.string().optional(),
  relationshipStatus: z.string().optional(),
  relationshipSatisfaction: z.string().optional(),
  friendsDescription: z.string().optional(),
  highestEducation: z.string().optional(),
  specialEducation: z.boolean().optional().default(false),
  specialEducationDetails: z.string().optional(),
  plan504: z.boolean().optional().default(false),
  iep: z.boolean().optional().default(false),
  educationDetails: z.string().optional(),
  currentlyEmployed: z.boolean().optional().default(false),
  employmentDetails: z.string().optional(),
  workVolunteerHistory: z.string().optional(),
  employmentBarriers: z.string().optional(),

  // Step 14: Legal & Substance History
  criminalLegalHistory: z.string().optional(),
  courtOrderedTreatment: z.boolean().optional().default(false),
  courtOrderedDetails: z.string().optional(),
  otherLegalIssues: z.string().optional(),
  substanceHistory: z.string().optional(),
  substanceUseTable: z.array(z.object({
    substance: z.string().optional(),
    firstUse: z.string().optional(),
    lastUse: z.string().optional(),
    pattern: z.string().optional(),
    route: z.string().optional(),
  })).optional(),
  drugOfChoice: z.string().optional(),
  longestSobriety: z.string().optional(),
  substanceTreatmentHistory: z.string().optional(),
  nicotineUse: z.boolean().optional().default(false),
  nicotineDetails: z.string().optional(),
  substanceImpact: z.string().optional(),
  historyOfAbuse: z.string().optional(),

  // Step 15: Living Situation & ADLs
  livingArrangements: z.string().optional(),
  sourceOfFinances: z.string().optional(),
  transportationMethod: z.string().optional(),
  adlChecklist: z.object({
    eating: z.string().optional(),
    bathing: z.string().optional(),
    dressing: z.string().optional(),
    toileting: z.string().optional(),
    transferring: z.string().optional(),
    continence: z.string().optional(),
  }).optional(),
  preferredActivities: z.string().optional(),
  significantOthers: z.string().optional(),
  supportLevel: z.string().optional(),
  typicalDay: z.string().optional(),
  strengthsAbilitiesInterests: z.string().optional(),

  // Step 16: Behavioral Observations
  appearanceAge: z.string().optional(),
  appearanceHeight: z.string().optional(),
  appearanceWeight: z.string().optional(),
  appearanceAttire: z.string().optional(),
  appearanceGrooming: z.string().optional(),
  appearanceDescription: z.string().optional(),
  demeanorMood: z.string().optional(),
  demeanorAffect: z.string().optional(),
  demeanorEyeContact: z.string().optional(),
  demeanorCooperation: z.string().optional(),
  demeanorDescription: z.string().optional(),
  speechArticulation: z.string().optional(),
  speechTone: z.string().optional(),
  speechRate: z.string().optional(),
  speechLatency: z.string().optional(),
  speechDescription: z.string().optional(),
  motorGait: z.string().optional(),
  motorPosture: z.string().optional(),
  motorActivity: z.string().optional(),
  motorMannerisms: z.string().optional(),
  motorDescription: z.string().optional(),
  cognitionThoughtContent: z.string().optional(),
  cognitionThoughtProcess: z.string().optional(),
  cognitionDelusions: z.string().optional(),
  cognitionPerception: z.string().optional(),
  cognitionJudgment: z.string().optional(),
  cognitionImpulseControl: z.string().optional(),
  cognitionInsight: z.string().optional(),
  cognitionDescription: z.string().optional(),
  estimatedIntelligence: z.string().optional(),

  // Step 17: Wellness & Final Review
  healthNeeds: z.string().optional(),
  nutritionalNeeds: z.string().optional(),
  spiritualNeeds: z.string().optional(),
  culturalNeeds: z.string().optional(),
  educationHistory: z.string().optional(),
  vocationalHistory: z.string().optional(),
  crisisInterventionPlan: z.string().optional(),
  feedbackFrequency: z.string().optional(),
  dischargePlanning: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentRecommendation: z.string().optional(),
  signatures: z.object({
    clientSignature: z.string().optional(), // Base64 PNG image
    clientPrintedName: z.string().optional(),
    clientSignatureDate: z.string().optional(),
    assessorSignature: z.string().optional(), // Base64 PNG image
    assessorPrintedName: z.string().optional(),
    assessorSignatureDate: z.string().optional(),
    clinicalOversightSignature: z.string().optional(), // Base64 PNG image
    clinicalOversightPrintedName: z.string().optional(),
    clinicalOversightSignatureDate: z.string().optional(),
  }).optional(),

  currentStep: z.number().optional(), // Track which step the user is on
});

export const intakeDecisionSchema = z
  .object({
    status: z.enum(["APPROVED", "CONDITIONAL", "DENIED"]),
    decisionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status !== "APPROVED") {
        return data.decisionReason && data.decisionReason.length >= 10;
      }
      return true;
    },
    {
      message: "Please provide a reason (at least 10 characters) for conditional approval or denial",
      path: ["decisionReason"],
    }
  );

export const facilitySchema = z.object({
  name: z.string().min(2, "Facility name is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().optional(),
});

export const credentialSchema = z.object({
  type: z.enum(["LICENSE", "CERTIFICATION", "INSURANCE", "RESUME", "OTHER"]),
  name: z.string().min(2, "Credential name is required"),
  expiresAt: z.string().optional(),
  isPublic: z.boolean(),
});

export const documentRequestSchema = z.object({
  name: z.string().min(2, "Document name is required"),
  type: z.string().min(2, "Document type is required"),
});

export const documentUploadSchema = z.object({
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  linkedType: z.string().optional(),
  linkedId: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

// Employee validation schemas
export const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  hireDate: z.string().optional(),
});

export const employeeDocumentTypeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  expirationRequired: z.boolean(),
});

export const employeeDocumentSchema = z
  .object({
    documentTypeId: z.string().min(1, "Document type is required"),
    issuedAt: z.string().min(1, "Issue date is required"),
    expiresAt: z.string().optional(),
    noExpiration: z.boolean(),
    notes: z.string().optional(),
  })
  .refine((data) => data.noExpiration || data.expiresAt, {
    message: "Expiration date required when not marked as no expiration",
    path: ["expiresAt"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type IntakeInput = z.infer<typeof intakeSchema>;
export type IntakeDraftInput = z.infer<typeof intakeDraftSchema>;
export type IntakeDecisionInput = z.infer<typeof intakeDecisionSchema>;
export type IntakeStep1Input = z.infer<typeof intakeStep1Schema>;
export type IntakeStep2Input = z.infer<typeof intakeStep2Schema>;
export type IntakeStep3Input = z.infer<typeof intakeStep3Schema>;
export type IntakeStep4Input = z.infer<typeof intakeStep4Schema>;
export type IntakeStep5Input = z.infer<typeof intakeStep5Schema>;
export type IntakeStep6Input = z.infer<typeof intakeStep6Schema>;
export type IntakeStep7Input = z.infer<typeof intakeStep7Schema>;
export type IntakeStep8Input = z.infer<typeof intakeStep8Schema>;
export type IntakeStep9Input = z.infer<typeof intakeStep9Schema>;
export type IntakeStep10Input = z.infer<typeof intakeStep10Schema>;
export type IntakeStep11Input = z.infer<typeof intakeStep11Schema>;
export type IntakeStep12Input = z.infer<typeof intakeStep12Schema>;
export type IntakeStep13Input = z.infer<typeof intakeStep13Schema>;
export type IntakeStep14Input = z.infer<typeof intakeStep14Schema>;
export type IntakeStep15Input = z.infer<typeof intakeStep15Schema>;
export type IntakeStep16Input = z.infer<typeof intakeStep16Schema>;
export type IntakeStep17Input = z.infer<typeof intakeStep17Schema>;
export type FacilityInput = z.infer<typeof facilitySchema>;
export type CredentialInput = z.infer<typeof credentialSchema>;
export type DocumentRequestInput = z.infer<typeof documentRequestSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export const documentCategorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  isRequired: z.boolean(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EmployeeDocumentTypeInput = z.infer<typeof employeeDocumentTypeSchema>;
export type EmployeeDocumentInput = z.infer<typeof employeeDocumentSchema>;
export type DocumentCategoryInput = z.infer<typeof documentCategorySchema>;

// Meeting validation schemas
export const meetingSchema = z.object({
  facilityId: z.string().min(1, "Facility is required"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  scheduledAt: z.string().min(1, "Date and time are required"),
  duration: z.number().min(15).max(180).default(30),
  meetingUrl: z.string().url("Invalid meeting URL").optional().or(z.literal("")),
});

export const meetingUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  duration: z.number().min(15).max(180).optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["SCHEDULED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export type MeetingInput = z.infer<typeof meetingSchema>;
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>;

// =====================================================
// ASAM Assessment Validation Schemas - 8 Steps
// =====================================================

// Step 1: Demographics
export const asamStep1Schema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  assessmentDate: z.string().optional(),
  admissionDate: z.string().optional(),
  phoneNumber: z.string().optional(),
  okayToLeaveVoicemail: z.boolean().optional(),
  patientAddress: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().optional(),
  gender: z.string().optional(),
  raceEthnicity: z.string().optional(),
  preferredLanguage: z.string().optional(),
  ahcccsId: z.string().optional(),
  otherInsuranceId: z.string().optional(),
  insuranceType: z.string().optional(),
  insurancePlan: z.string().optional(),
  livingArrangement: z.string().optional(),
  referredBy: z.string().optional(),
  reasonForTreatment: z.string().optional(),
  currentSymptoms: z.string().optional(),
});

// Step 2: Dimension 1 - Substance Use, Acute Intoxication and/or Withdrawal Potential
export const asamStep2Schema = z.object({
  substanceUseHistory: z.array(z.object({
    substance: z.string(),
    recentlyUsed: z.boolean().optional(),
    priorUse: z.boolean().optional(),
    route: z.string().optional(),
    frequency: z.string().optional(),
    ageFirstUse: z.string().optional(),
    lastUse: z.string().optional(),
    amount: z.string().optional(),
  })).optional(),
  usingMoreThanIntended: z.boolean().optional(),
  usingMoreDetails: z.string().optional(),
  physicallyIllWhenStopping: z.boolean().optional(),
  physicallyIllDetails: z.string().optional(),
  currentWithdrawalSymptoms: z.boolean().optional(),
  withdrawalSymptomsDetails: z.string().optional(),
  historyOfSeriousWithdrawal: z.boolean().optional(),
  seriousWithdrawalDetails: z.string().optional(),
  toleranceIncreased: z.boolean().optional(),
  toleranceDetails: z.string().optional(),
  recentUseChanges: z.boolean().optional(),
  recentUseChangesDetails: z.string().optional(),
  familySubstanceHistory: z.string().optional(),
  dimension1Severity: z.number().min(0).max(4).optional(),
  dimension1Comments: z.string().optional(),
});

// Step 3: Dimension 2 - Biomedical Conditions and Complications
export const asamStep3Schema = z.object({
  medicalProviders: z.array(z.object({
    name: z.string(),
    specialty: z.string().optional(),
    contact: z.string().optional(),
  })).optional(),
  medicalConditions: z.object({
    heartProblems: z.boolean().optional(),
    seizureNeurological: z.boolean().optional(),
    muscleJointProblems: z.boolean().optional(),
    diabetes: z.boolean().optional(),
    highBloodPressure: z.boolean().optional(),
    thyroidProblems: z.boolean().optional(),
    visionProblems: z.boolean().optional(),
    sleepProblems: z.boolean().optional(),
    highCholesterol: z.boolean().optional(),
    kidneyProblems: z.boolean().optional(),
    hearingProblems: z.boolean().optional(),
    chronicPain: z.boolean().optional(),
    bloodDisorder: z.boolean().optional(),
    liverProblems: z.boolean().optional(),
    dentalProblems: z.boolean().optional(),
    pregnant: z.boolean().optional(),
    stomachIntestinalProblems: z.boolean().optional(),
    asthmaLungProblems: z.boolean().optional(),
    std: z.string().optional(),
    cancer: z.string().optional(),
    infections: z.string().optional(),
    allergies: z.string().optional(),
    other: z.string().optional(),
  }).optional(),
  conditionsInterfere: z.boolean().optional(),
  conditionsInterfereDetails: z.string().optional(),
  priorHospitalizations: z.string().optional(),
  lifeThreatening: z.boolean().optional(),
  medicalMedications: z.array(z.object({
    medication: z.string(),
    dose: z.string().optional(),
    reason: z.string().optional(),
    effectiveness: z.string().optional(),
  })).optional(),
  dimension2Severity: z.number().min(0).max(4).optional(),
  dimension2Comments: z.string().optional(),
});

// Step 4: Dimension 3 - Emotional, Behavioral, or Cognitive Conditions
export const asamStep4Schema = z.object({
  moodSymptoms: z.object({
    depression: z.boolean().optional(),
    lossOfPleasure: z.boolean().optional(),
    hopelessness: z.boolean().optional(),
    irritability: z.boolean().optional(),
    impulsivity: z.boolean().optional(),
    pressuredSpeech: z.boolean().optional(),
    grandiosity: z.boolean().optional(),
    racingThoughts: z.boolean().optional(),
  }).optional(),
  anxietySymptoms: z.object({
    anxiety: z.boolean().optional(),
    obsessiveThoughts: z.boolean().optional(),
    compulsiveBehaviors: z.boolean().optional(),
    flashbacks: z.boolean().optional(),
  }).optional(),
  psychosisSymptoms: z.object({
    paranoia: z.boolean().optional(),
    delusions: z.string().optional(),
    hallucinations: z.string().optional(),
  }).optional(),
  otherSymptoms: z.object({
    sleepProblems: z.boolean().optional(),
    memoryConcentration: z.boolean().optional(),
    gambling: z.boolean().optional(),
    riskySexBehaviors: z.boolean().optional(),
  }).optional(),
  suicidalThoughts: z.boolean().optional(),
  suicidalThoughtsDetails: z.string().optional(),
  thoughtsOfHarmingOthers: z.boolean().optional(),
  harmingOthersDetails: z.string().optional(),
  abuseHistory: z.string().optional(),
  traumaticEvents: z.string().optional(),
  mentalIllnessDiagnosed: z.boolean().optional(),
  mentalIllnessDetails: z.string().optional(),
  previousPsychTreatment: z.boolean().optional(),
  psychTreatmentDetails: z.string().optional(),
  hallucinationsPresent: z.boolean().optional(),
  hallucinationsDetails: z.string().optional(),
  furtherMHAssessmentNeeded: z.boolean().optional(),
  furtherMHAssessmentDetails: z.string().optional(),
  psychiatricMedications: z.array(z.object({
    medication: z.string(),
    dose: z.string().optional(),
    reason: z.string().optional(),
    effectiveness: z.string().optional(),
  })).optional(),
  mentalHealthProviders: z.array(z.object({
    name: z.string(),
    contact: z.string().optional(),
  })).optional(),
  dimension3Severity: z.number().min(0).max(4).optional(),
  dimension3Comments: z.string().optional(),
});

// Step 5: Dimension 4 - Readiness to Change
export const asamStep5Schema = z.object({
  areasAffectedByUse: z.object({
    work: z.boolean().optional(),
    mentalHealth: z.boolean().optional(),
    physicalHealth: z.boolean().optional(),
    finances: z.boolean().optional(),
    school: z.boolean().optional(),
    relationships: z.boolean().optional(),
    sexualActivity: z.boolean().optional(),
    legalMatters: z.boolean().optional(),
    everydayTasks: z.boolean().optional(),
    selfEsteem: z.boolean().optional(),
    hygiene: z.boolean().optional(),
    recreationalActivities: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  continueUseDespiteEffects: z.boolean().optional(),
  continueUseDetails: z.string().optional(),
  previousTreatmentHelp: z.boolean().optional(),
  treatmentProviders: z.array(z.object({
    name: z.string(),
    contact: z.string().optional(),
  })).optional(),
  recoverySupport: z.string().optional(),
  recoveryBarriers: z.string().optional(),
  treatmentImportanceAlcohol: z.string().optional(),
  treatmentImportanceDrugs: z.string().optional(),
  treatmentImportanceDetails: z.string().optional(),
  dimension4Severity: z.number().min(0).max(4).optional(),
  dimension4Comments: z.string().optional(),
});

// Step 6: Dimension 5 - Relapse, Continued Use, or Continued Problem Potential
export const asamStep6Schema = z.object({
  cravingsFrequencyAlcohol: z.string().optional(),
  cravingsFrequencyDrugs: z.string().optional(),
  cravingsDetails: z.string().optional(),
  timeSearchingForSubstances: z.boolean().optional(),
  timeSearchingDetails: z.string().optional(),
  relapseWithoutTreatment: z.boolean().optional(),
  relapseDetails: z.string().optional(),
  awareOfTriggers: z.boolean().optional(),
  triggersList: z.object({
    strongCravings: z.boolean().optional(),
    workPressure: z.boolean().optional(),
    mentalHealth: z.boolean().optional(),
    relationshipProblems: z.boolean().optional(),
    difficultyDealingWithFeelings: z.boolean().optional(),
    financialStressors: z.boolean().optional(),
    physicalHealth: z.boolean().optional(),
    schoolPressure: z.boolean().optional(),
    environment: z.boolean().optional(),
    unemployment: z.boolean().optional(),
    chronicPain: z.boolean().optional(),
    peerPressure: z.boolean().optional(),
    other: z.string().optional(),
  }).optional(),
  copingWithTriggers: z.string().optional(),
  attemptsToControl: z.string().optional(),
  longestSobriety: z.string().optional(),
  whatHelped: z.string().optional(),
  whatDidntHelp: z.string().optional(),
  dimension5Severity: z.number().min(0).max(4).optional(),
  dimension5Comments: z.string().optional(),
});

// Step 7: Dimension 6 - Recovery/Living Environment
export const asamStep7Schema = z.object({
  supportiveRelationships: z.string().optional(),
  currentLivingSituation: z.string().optional(),
  othersUsingDrugsInEnvironment: z.boolean().optional(),
  othersUsingDetails: z.string().optional(),
  safetyThreats: z.boolean().optional(),
  safetyThreatsDetails: z.string().optional(),
  negativeImpactRelationships: z.boolean().optional(),
  negativeImpactDetails: z.string().optional(),
  currentlyEmployedOrSchool: z.boolean().optional(),
  employmentSchoolDetails: z.string().optional(),
  socialServicesInvolved: z.boolean().optional(),
  socialServicesDetails: z.string().optional(),
  probationParoleOfficer: z.string().optional(),
  probationParoleContact: z.string().optional(),
  dimension6Severity: z.number().min(0).max(4).optional(),
  dimension6Comments: z.string().optional(),
});

// Step 8: Summary, DSM-5 Criteria, Level of Care, and Signatures
export const asamStep8Schema = z.object({
  summaryRationale: z.object({
    dimension1Rationale: z.string().optional(),
    dimension2Rationale: z.string().optional(),
    dimension3Rationale: z.string().optional(),
    dimension4Rationale: z.string().optional(),
    dimension5Rationale: z.string().optional(),
    dimension6Rationale: z.string().optional(),
  }).optional(),
  dsm5Criteria: z.union([
    // Format 1: Array of strings (e.g., ["Hazardous use", "Tolerance", ...])
    z.array(z.string()),
    // Format 2: Array of objects with substanceName and criteria
    z.array(z.object({
      substanceName: z.string(),
      criteria: z.array(z.union([z.string(), z.boolean()])).optional(),
      totalCriteria: z.number().optional(),
    })),
  ]).optional(),
  dsm5Diagnoses: z.string().optional(),
  levelOfCareDetermination: z.object({
    withdrawalManagement: z.string().optional(),
    treatmentServices: z.string().optional(),
    otp: z.boolean().optional(),
  }).optional(),
  matInterested: z.boolean().optional(),
  matDetails: z.string().optional(),
  recommendedLevelOfCare: z.string().optional(),
  levelOfCareProvided: z.string().optional(),
  discrepancyReason: z.string().optional(),
  discrepancyExplanation: z.string().optional(),
  designatedTreatmentLocation: z.string().optional(),
  designatedProviderName: z.string().optional(),
  counselorName: z.string().optional(),
  counselorSignatureDate: z.string().optional(),
  bhpLphaName: z.string().optional(),
  bhpLphaSignatureDate: z.string().optional(),
});

// Combined ASAM schema for full submission
export const asamSchema = asamStep1Schema
  .merge(asamStep2Schema)
  .merge(asamStep3Schema)
  .merge(asamStep4Schema)
  .merge(asamStep5Schema)
  .merge(asamStep6Schema)
  .merge(asamStep7Schema)
  .merge(asamStep8Schema);

// ASAM draft schema - minimal validation for saving progress
export const asamDraftSchema = z.object({
  patientName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  currentStep: z.number().optional(),
}).passthrough();

// ASAM decision schema (for BHP approval/denial)
export const asamDecisionSchema = z.object({
  status: z.enum(["APPROVED", "CONDITIONAL", "DENIED"]),
  decisionReason: z.string().min(1, "Decision reason is required"),
});

export type ASAMInput = z.infer<typeof asamSchema>;
export type ASAMDraftInput = z.infer<typeof asamDraftSchema>;
export type ASAMDecisionInput = z.infer<typeof asamDecisionSchema>;
export type ASAMStep1Input = z.infer<typeof asamStep1Schema>;
export type ASAMStep2Input = z.infer<typeof asamStep2Schema>;
export type ASAMStep3Input = z.infer<typeof asamStep3Schema>;
export type ASAMStep4Input = z.infer<typeof asamStep4Schema>;
export type ASAMStep5Input = z.infer<typeof asamStep5Schema>;
export type ASAMStep6Input = z.infer<typeof asamStep6Schema>;
export type ASAMStep7Input = z.infer<typeof asamStep7Schema>;
export type ASAMStep8Input = z.infer<typeof asamStep8Schema>;

// =====================================================
// Fire Drill Report Validation Schema
// =====================================================

export const fireDrillReportSchema = z.object({
  drillDate: z.string().min(1, "Drill date is required"),
  drillTime: z.string().min(1, "Drill time is required"),
  location: z.string().optional(),
  shift: z.enum(["AM", "PM"]),
  drillType: z.enum(["ANNOUNCED", "UNANNOUNCED"]),
  conductedBy: z.string().min(1, "Conducted by is required"),
  alarmActivatedTime: z.string().optional(),
  buildingClearTime: z.string().optional(),
  totalEvacuationTime: z.string().optional(),
  numberEvacuated: z.number().min(0).nullish(),
  safetyChecklist: z.object({
    fireAlarmFunctioned: z.boolean().default(false),
    allResidentsAccountedFor: z.boolean().default(false),
    staffFollowedProcedures: z.boolean().default(false),
    exitRoutesClear: z.boolean().default(false),
    emergencyExitsOpenedProperly: z.boolean().default(false),
    fireExtinguishersAccessible: z.boolean().default(false),
  }),
  residentsPresent: z.array(z.object({
    name: z.string(),
    evacuated: z.boolean(),
  })).nullish(),
  observations: z.string().optional(),
  correctiveActions: z.string().optional(),
  drillResult: z.enum(["SATISFACTORY", "NEEDS_IMPROVEMENT", "UNSATISFACTORY"]),
  signatures: z.object({
    staffSignature: z.string().optional(),
    staffSignatureDate: z.string().optional(),
    supervisorSignature: z.string().optional(),
    supervisorSignatureDate: z.string().optional(),
  }).nullish(),
});

export type FireDrillReportInput = z.infer<typeof fireDrillReportSchema>;

// =====================================================
// Evacuation/Disaster Drill Report Validation Schema
// =====================================================

export const evacuationDrillReportSchema = z.object({
  drillType: z.enum(["EVACUATION", "DISASTER"]),
  drillDate: z.string().min(1, "Drill date is required"),
  drillTime: z.string().min(1, "Drill time is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  totalLengthMinutes: z.number().min(0).nullish(),
  shift: z.enum(["AM", "PM"]),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  year: z.number().min(2020).max(2100),
  disasterDrillType: z.string().nullish(),
  staffInvolved: z.array(z.object({
    name: z.string().min(1, "Staff name is required"),
  })).min(1, "At least one staff member is required"),
  residentsInvolved: z.array(z.object({
    name: z.string(),
    assistanceRequired: z.string().nullish(),
  })).nullish(),
  exitBlocked: z.string().nullish(),
  exitUsed: z.string().nullish(),
  assemblyPoint: z.string().nullish(),
  correctLocation: z.boolean().nullish(),
  allAccountedFor: z.boolean().nullish(),
  issuesIdentified: z.boolean().nullish(),
  observations: z.string().nullish(),
  drillResult: z.enum(["SATISFACTORY", "NEEDS_IMPROVEMENT", "UNSATISFACTORY"]),
  signatures: z.object({
    conductedBy: z.string().optional(),
    conductedByDate: z.string().optional(),
    supervisor: z.string().optional(),
    supervisorDate: z.string().optional(),
  }).nullish(),
});

export type EvacuationDrillReportInput = z.infer<typeof evacuationDrillReportSchema>;

// =====================================================
// Oversight Training Report Validation Schema
// =====================================================

export const oversightTrainingReportSchema = z.object({
  trainingDate: z.string().min(1, "Training date is required"),
  conductedBy: z.string().min(1, "Conducted by is required"),
  staffParticipants: z.array(z.object({
    name: z.string().min(1, "Staff name is required"),
    position: z.string().optional(),
  })).min(1, "At least one staff participant is required"),
  notes: z.string().optional(),
});

export type OversightTrainingReportInput = z.infer<typeof oversightTrainingReportSchema>;

// =====================================================
// ART Meeting Worksheet Validation Schema
// =====================================================

// Attendee options for Present/Absent
export const ART_MEETING_ATTENDEES = [
  "Resident",
  "Case Manager",
  "BHP",
  "BHT/Administrator",
  "RN",
  "Probationary Officer",
] as const;

export const artMeetingSchema = z.object({
  meetingDate: z.string().min(1, "Meeting date is required"),
  dxCodes: z.string().optional(),
  presentDuringMeeting: z.array(z.string()).default([]),
  absentDuringMeeting: z.array(z.string()).default([]),
  focusOfMeeting: z.string().optional(),
  resolutions: z.string().optional(),
  strengths: z.string().optional(),
  barriers: z.string().optional(),
  whatHasWorked: z.string().optional(),
  whatHasNotWorked: z.string().optional(),
  goals: z.string().optional(),
  concreteSteps: z.string().optional(),
  progressIndicators: z.string().optional(),
  medicalIssues: z.string().optional(),
  plan: z.string().optional(),
  notesTakenBy: z.string().optional(),
  meetingStartTime: z.string().optional(),
  meetingEndTime: z.string().optional(),
});

export const artMeetingDraftSchema = z.object({
  meetingDate: z.string().optional(),
  dxCodes: z.string().optional(),
  presentDuringMeeting: z.array(z.string()).optional().default([]),
  absentDuringMeeting: z.array(z.string()).optional().default([]),
  focusOfMeeting: z.string().optional(),
  resolutions: z.string().optional(),
  strengths: z.string().optional(),
  barriers: z.string().optional(),
  whatHasWorked: z.string().optional(),
  whatHasNotWorked: z.string().optional(),
  goals: z.string().optional(),
  concreteSteps: z.string().optional(),
  progressIndicators: z.string().optional(),
  medicalIssues: z.string().optional(),
  plan: z.string().optional(),
  notesTakenBy: z.string().optional(),
  meetingStartTime: z.string().optional(),
  meetingEndTime: z.string().optional(),
});

export const skipArtMeetingSchema = z.object({
  skipReason: z.string().min(10, "Skip reason must be at least 10 characters"),
});

export type ARTMeetingInput = z.infer<typeof artMeetingSchema>;
export type ARTMeetingDraftInput = z.infer<typeof artMeetingDraftSchema>;
export type SkipARTMeetingInput = z.infer<typeof skipArtMeetingSchema>;

// =====================================================
// Discharge Summary Validation Schema
// =====================================================

export const DISCHARGE_TYPES = [
  "Completed Treatment",
  "AMA (Against Medical Advice)",
  "Administrative Discharge",
  "Transfer to Higher Level of Care",
  "Transfer to Lower Level of Care",
  "Incarceration",
  "Hospitalization",
  "Death",
  "Other",
] as const;

export const ENROLLED_PROGRAMS = [
  "Residential",
  "IOP (Intensive Outpatient)",
  "Outpatient",
  "Community Day",
  "PHP (Partial Hospitalization)",
] as const;

export const RECOMMENDED_LEVELS_OF_CARE = [
  "No further treatment",
  "Outpatient therapy",
  "IOP (Intensive Outpatient)",
  "PHP (Partial Hospitalization)",
  "Residential treatment",
  "Inpatient hospitalization",
  "Medical detox",
  "Other",
] as const;

export const COMPLETED_SERVICES = [
  "Individual Therapy",
  "Group Therapy",
  "Family Therapy",
  "Case Management",
  "Medication Management",
  "Skills Training",
  "Crisis Intervention",
  "Peer Support",
  "Vocational Services",
  "Educational Services",
  "Housing Assistance",
  "Transportation Assistance",
  "Other",
] as const;

export const dischargeSummarySchema = z.object({
  // Discharge Date/Time
  dischargeDate: z.string().min(1, "Discharge date is required"),
  dischargeStartTime: z.string().optional(),
  dischargeEndTime: z.string().optional(),

  // Program Info
  enrolledProgram: z.string().optional(),
  dischargeType: z.string().min(1, "Discharge type is required"),
  recommendedLevelOfCare: z.string().optional(),

  // Contact Info After Discharge
  contactPhoneAfterDischarge: z.string().optional(),
  contactAddressAfterDischarge: z.string().optional(),

  // Clinical Content
  presentingIssuesAtAdmission: z.string().optional(),
  objectivesAttained: z.array(z.object({
    objective: z.string(),
    attained: z.enum(["Fully Attained", "Partially Attained", "Not Attained", "N/A"]),
  })).optional(),
  objectiveNarratives: z.object({
    fullyAttained: z.string().optional(),
    partiallyAttained: z.string().optional(),
    notAttained: z.string().optional(),
  }).optional(),

  // Completed Services
  completedServices: z.array(z.string()).default([]),

  // Discharge Summary
  actualDischargeDate: z.string().optional(),
  dischargeSummaryNarrative: z.string().optional(),

  // Discharging To
  dischargingTo: z.string().optional(),

  // Personal Items & Medications
  personalItemsReceived: z.boolean().default(false),
  personalItemsStoredDays: z.number().min(0).optional(),
  itemsRemainAtFacility: z.boolean().default(false),

  // Discharge Medications
  dischargeMedications: z.array(z.object({
    medication: z.string(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    prescriber: z.string().optional(),
  })).optional(),

  // Service Referrals
  serviceReferrals: z.array(z.object({
    service: z.string(),
    provider: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    appointmentDate: z.string().optional(),
  })).optional(),

  // Clinical Recommendations
  clinicalRecommendations: z.string().optional(),

  // Cultural Preferences
  culturalPreferencesConsidered: z.boolean().default(false),

  // Suicide Prevention Education
  suicidePreventionEducation: z.string().optional(),

  // Signatures
  clientSignature: z.string().optional(),
  clientSignatureDate: z.string().optional(),
  staffSignature: z.string().optional(),
  staffCredentials: z.string().optional(),
  staffSignatureDate: z.string().optional(),
  reviewerSignature: z.string().optional(),
  reviewerCredentials: z.string().optional(),
  reviewerSignatureDate: z.string().optional(),
});

export const dischargeSummaryDraftSchema = z.object({
  // Discharge Date/Time
  dischargeDate: z.string().optional(),
  dischargeStartTime: z.string().optional(),
  dischargeEndTime: z.string().optional(),

  // Program Info
  enrolledProgram: z.string().optional(),
  dischargeType: z.string().optional(),
  recommendedLevelOfCare: z.string().optional(),

  // Contact Info After Discharge
  contactPhoneAfterDischarge: z.string().optional(),
  contactAddressAfterDischarge: z.string().optional(),

  // Clinical Content
  presentingIssuesAtAdmission: z.string().optional(),
  objectivesAttained: z.array(z.object({
    objective: z.string(),
    attained: z.enum(["Fully Attained", "Partially Attained", "Not Attained", "N/A"]),
  })).optional(),
  objectiveNarratives: z.object({
    fullyAttained: z.string().optional(),
    partiallyAttained: z.string().optional(),
    notAttained: z.string().optional(),
  }).optional(),

  // Completed Services
  completedServices: z.array(z.string()).optional().default([]),

  // Discharge Summary
  actualDischargeDate: z.string().optional(),
  dischargeSummaryNarrative: z.string().optional(),

  // Discharging To
  dischargingTo: z.string().optional(),

  // Personal Items & Medications
  personalItemsReceived: z.boolean().optional().default(false),
  personalItemsStoredDays: z.number().min(0).optional(),
  itemsRemainAtFacility: z.boolean().optional().default(false),

  // Discharge Medications
  dischargeMedications: z.array(z.object({
    medication: z.string(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    prescriber: z.string().optional(),
  })).optional(),

  // Service Referrals
  serviceReferrals: z.array(z.object({
    service: z.string(),
    provider: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    appointmentDate: z.string().optional(),
  })).optional(),

  // Clinical Recommendations
  clinicalRecommendations: z.string().optional(),

  // Cultural Preferences
  culturalPreferencesConsidered: z.boolean().optional().default(false),

  // Suicide Prevention Education
  suicidePreventionEducation: z.string().optional(),

  // Signatures
  clientSignature: z.string().optional(),
  clientSignatureDate: z.string().optional(),
  staffSignature: z.string().optional(),
  staffCredentials: z.string().optional(),
  staffSignatureDate: z.string().optional(),
  reviewerSignature: z.string().optional(),
  reviewerCredentials: z.string().optional(),
  reviewerSignatureDate: z.string().optional(),
});

export type DischargeSummaryInput = z.infer<typeof dischargeSummarySchema>;
export type DischargeSummaryDraftInput = z.infer<typeof dischargeSummaryDraftSchema>;

// =====================================================
// Incident Report Validation Schema
// =====================================================

export const INCIDENT_TYPES = [
  { code: "BEHAVIORAL", label: "Behavioral (aggression, verbal outburst, property damage)" },
  { code: "MEDICAL_EMERGENCY", label: "Medical emergency" },
  { code: "INJURY", label: "Injury (resident or staff)" },
  { code: "FALL", label: "Fall" },
  { code: "MEDICATION_ERROR", label: "Medication error" },
  { code: "SUICIDE_ATTEMPT", label: "Suicide attempt/self-harm" },
  { code: "SUICIDAL_HOMICIDAL_IDEATION", label: "Suicidal/homicidal ideation" },
  { code: "ELOPEMENT", label: "Elopement/AWOL" },
  { code: "AMA", label: "AMA (Against Medical Advice) discharge" },
  { code: "SUBSTANCE_USE", label: "Substance use/positive drug screen" },
  { code: "CONTRABAND", label: "Contraband" },
  { code: "ALTERCATION", label: "Altercation between residents" },
  { code: "ABUSE_NEGLECT", label: "Alleged abuse/neglect" },
  { code: "THEFT_LOSS", label: "Property theft/loss" },
  { code: "DEATH", label: "Death" },
  { code: "OTHER", label: "Other" },
] as const;

export const INTERVENTION_TYPES = [
  { code: "VERBAL_DEESCALATION", label: "Verbal de-escalation" },
  { code: "REDIRECTION", label: "Redirection" },
  { code: "PRN_MEDICATION", label: "PRN medication administered" },
  { code: "ONE_ON_ONE", label: "1:1 supervision initiated" },
  { code: "ROOM_RESTRICTION", label: "Room restriction" },
  { code: "PHYSICAL_INTERVENTION", label: "Physical intervention/restraint" },
  { code: "SECLUSION", label: "Seclusion" },
  { code: "CRISIS_SERVICES", label: "Crisis services contacted" },
  { code: "CALL_911", label: "911 called" },
  { code: "FIRST_AID", label: "First aid administered" },
  { code: "OTHER", label: "Other" },
] as const;

export const NOTIFICATION_ENTITIES = [
  "Supervisor/Administrator",
  "BHP",
  "Physician/Prescriber",
  "Family/Guardian",
  "Case Manager",
  "AHCCCS/Licensing",
  "Law Enforcement",
  "Other",
] as const;

export const SUPERVISION_LEVELS = [
  "Routine",
  "Increased",
  "1:1",
  "Other",
] as const;

export const FOLLOW_UP_TYPES = [
  { code: "TREATMENT_PLAN_UPDATE", label: "Treatment plan update" },
  { code: "PHYSICIAN_NOTIFICATION", label: "Physician/prescriber notification" },
  { code: "MEDICATION_REVIEW", label: "Medication review" },
  { code: "INCREASED_SUPERVISION", label: "Increased supervision" },
  { code: "ROOM_CHANGE", label: "Room/environment change" },
  { code: "FAMILY_MEETING", label: "Family meeting" },
  { code: "INCIDENT_REVIEW", label: "Incident review meeting" },
  { code: "REGULATORY_REPORT", label: "Regulatory report required" },
  { code: "OTHER", label: "Other" },
] as const;

export const incidentReportSchema = z.object({
  // Resident link (optional)
  intakeId: z.string().optional(),

  // Incident Information
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentTime: z.string().min(1, "Incident time is required"),
  incidentLocation: z.string().min(1, "Incident location is required"),
  reportCompletedBy: z.string().min(1, "Report completed by is required"),
  reporterTitle: z.string().optional(),

  // Resident Information (manual if no intake linked)
  residentName: z.string().optional(),
  residentDOB: z.string().optional(),
  residentAdmissionDate: z.string().optional(),
  residentAhcccsId: z.string().optional(),

  // Incident Types
  incidentTypes: z.array(z.string()).min(1, "At least one incident type is required"),
  otherIncidentType: z.string().optional(),

  // Incident Description
  incidentDescription: z.string().min(10, "Incident description must be at least 10 characters"),

  // Persons Involved
  residentsInvolved: z.array(z.object({
    name: z.string(),
    dob: z.string().optional(),
    roleInIncident: z.string().optional(),
  })).optional(),
  staffInvolved: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    roleInIncident: z.string().optional(),
  })).optional(),
  witnesses: z.array(z.object({
    name: z.string(),
    titleOrRelationship: z.string().optional(),
    contactInfo: z.string().optional(),
  })).optional(),

  // Injuries
  anyInjuries: z.boolean().default(false),
  injuryDescription: z.string().optional(),
  medicalAttentionRequired: z.boolean().default(false),
  treatmentProvided: z.string().optional(),
  was911Called: z.boolean().default(false),
  wasTransportedToHospital: z.boolean().default(false),
  hospitalName: z.string().optional(),

  // Interventions
  interventionsUsed: z.array(z.string()).default([]),
  otherIntervention: z.string().optional(),
  actionsDescription: z.string().optional(),

  // Notifications
  notifications: z.array(z.object({
    personEntity: z.string(),
    name: z.string().optional(),
    dateTime: z.string().optional(),
    method: z.string().optional(),
    notifiedBy: z.string().optional(),
  })).optional(),

  // Resident Status Post-Incident
  residentCurrentCondition: z.string().optional(),
  residentStatement: z.string().optional(),
  currentSupervisionLevel: z.string().optional(),
  otherSupervisionLevel: z.string().optional(),

  // Follow-Up
  followUpRequired: z.array(z.string()).default([]),
  otherFollowUp: z.string().optional(),
  followUpActionsTimeline: z.string().optional(),

  // Signatures
  staffSignatureName: z.string().optional(),
  staffSignatureDate: z.string().optional(),
  adminSignatureName: z.string().optional(),
  adminSignatureDate: z.string().optional(),
  bhpSignatureName: z.string().optional(),
  bhpSignatureDate: z.string().optional(),
});

export const incidentReportDraftSchema = z.object({
  // Resident link (optional)
  intakeId: z.string().optional(),

  // Incident Information
  incidentDate: z.string().optional(),
  incidentTime: z.string().optional(),
  incidentLocation: z.string().optional(),
  reportCompletedBy: z.string().optional(),
  reporterTitle: z.string().optional(),

  // Resident Information (manual if no intake linked)
  residentName: z.string().optional(),
  residentDOB: z.string().optional(),
  residentAdmissionDate: z.string().optional(),
  residentAhcccsId: z.string().optional(),

  // Incident Types
  incidentTypes: z.array(z.string()).default([]),
  otherIncidentType: z.string().optional(),

  // Incident Description
  incidentDescription: z.string().optional(),

  // Persons Involved
  residentsInvolved: z.array(z.object({
    name: z.string(),
    dob: z.string().optional(),
    roleInIncident: z.string().optional(),
  })).optional(),
  staffInvolved: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    roleInIncident: z.string().optional(),
  })).optional(),
  witnesses: z.array(z.object({
    name: z.string(),
    titleOrRelationship: z.string().optional(),
    contactInfo: z.string().optional(),
  })).optional(),

  // Injuries
  anyInjuries: z.boolean().default(false),
  injuryDescription: z.string().optional(),
  medicalAttentionRequired: z.boolean().default(false),
  treatmentProvided: z.string().optional(),
  was911Called: z.boolean().default(false),
  wasTransportedToHospital: z.boolean().default(false),
  hospitalName: z.string().optional(),

  // Interventions
  interventionsUsed: z.array(z.string()).default([]),
  otherIntervention: z.string().optional(),
  actionsDescription: z.string().optional(),

  // Notifications
  notifications: z.array(z.object({
    personEntity: z.string(),
    name: z.string().optional(),
    dateTime: z.string().optional(),
    method: z.string().optional(),
    notifiedBy: z.string().optional(),
  })).optional(),

  // Resident Status Post-Incident
  residentCurrentCondition: z.string().optional(),
  residentStatement: z.string().optional(),
  currentSupervisionLevel: z.string().optional(),
  otherSupervisionLevel: z.string().optional(),

  // Follow-Up
  followUpRequired: z.array(z.string()).default([]),
  otherFollowUp: z.string().optional(),
  followUpActionsTimeline: z.string().optional(),

  // Signatures
  staffSignatureName: z.string().optional(),
  staffSignatureDate: z.string().optional(),
  adminSignatureName: z.string().optional(),
  adminSignatureDate: z.string().optional(),
  bhpSignatureName: z.string().optional(),
  bhpSignatureDate: z.string().optional(),
});

export type IncidentReportInput = z.infer<typeof incidentReportSchema>;
export type IncidentReportDraftInput = z.infer<typeof incidentReportDraftSchema>;

// Medication Administration Record (MAR) Schema
export const marHeaderSchema = z.object({
  // Facility Info
  facilityName: z.string().min(1, "Facility name is required"),
  monthYear: z.string().min(1, "Month/Year is required"),

  // Resident Info
  residentName: z.string().min(1, "Resident name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  admitDate: z.string().optional(),
  allergies: z.string().optional(),
  ahcccsId: z.string().optional(),
  diagnosis: z.string().optional(),
  emergencyContact: z.string().optional(),

  // Prescriber Info
  prescriberName: z.string().optional(),
  prescriberPhone: z.string().optional(),

  // Pharmacy Info
  pharmacyName: z.string().optional(),
  pharmacyPhone: z.string().optional(),

  // Optional: link to intake
  intakeId: z.string().optional(),
});

export type MARHeaderInput = z.infer<typeof marHeaderSchema>;

// =====================================================
// eMAR (Electronic Medication Administration Record) Schemas
// =====================================================

// Medication Route enum values
export const MEDICATION_ROUTES = [
  "PO", "SL", "IM", "IV", "SC", "TOPICAL", "INHALED",
  "OPHTHALMIC", "OTIC", "NASAL", "RECTAL", "TRANSDERMAL", "OTHER"
] as const;

// Medication Frequency enum values
export const MEDICATION_FREQUENCIES = [
  "ONCE", "DAILY", "BID", "TID", "QID", "Q4H", "Q6H", "Q8H",
  "Q12H", "QHS", "QAM", "PRN", "WEEKLY", "CUSTOM"
] as const;

// Administration Status enum values
export const ADMINISTRATION_STATUSES = [
  "SCHEDULED", "DUE", "GIVEN", "REFUSED", "HELD",
  "MISSED", "NOT_AVAILABLE", "LOA", "DISCONTINUED"
] as const;

// Medication Order Schema
export const medicationOrderSchema = z.object({
  intakeId: z.string().min(1, "Patient is required"),

  // Medication Details
  medicationName: z.string().min(1, "Medication name is required"),
  genericName: z.string().optional(),
  strength: z.string().min(1, "Strength is required"),
  dosageForm: z.string().optional(),

  // Dosing
  dose: z.string().min(1, "Dose is required"),
  route: z.enum(MEDICATION_ROUTES),
  frequency: z.enum(MEDICATION_FREQUENCIES),
  customFrequency: z.string().optional(),
  scheduleTimes: z.array(z.string()).default([]),

  // PRN
  isPRN: z.boolean().default(false),
  prnReason: z.string().optional(),
  prnMinIntervalHours: z.number().min(0).optional(),
  prnMaxDailyDoses: z.number().min(1).optional(),

  // Prescriber
  prescriberName: z.string().min(1, "Prescriber name is required"),
  prescriberNPI: z.string().optional(),
  prescriberPhone: z.string().optional(),

  // Dates
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),

  // Instructions
  instructions: z.string().optional(),
  administrationNotes: z.string().optional(),

  // Pharmacy
  pharmacyName: z.string().optional(),
  pharmacyPhone: z.string().optional(),
  rxNumber: z.string().optional(),

  // Control
  isControlled: z.boolean().default(false),
  controlSchedule: z.string().optional(),
}).refine(
  (data) => {
    // If frequency is CUSTOM, scheduleTimes must be provided
    if (data.frequency === "CUSTOM" && (!data.scheduleTimes || data.scheduleTimes.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Schedule times are required for custom frequency",
    path: ["scheduleTimes"],
  }
).refine(
  (data) => {
    // If isPRN, prnReason should be provided
    if (data.isPRN && !data.prnReason) {
      return false;
    }
    return true;
  },
  {
    message: "PRN reason is required for PRN medications",
    path: ["prnReason"],
  }
).refine(
  (data) => {
    // If isControlled, controlSchedule should be provided
    if (data.isControlled && !data.controlSchedule) {
      return false;
    }
    return true;
  },
  {
    message: "Control schedule is required for controlled substances",
    path: ["controlSchedule"],
  }
);

// Medication Order Update Schema
export const medicationOrderUpdateSchema = z.object({
  dose: z.string().optional(),
  instructions: z.string().optional(),
  administrationNotes: z.string().optional(),
  scheduleTimes: z.array(z.string()).optional(),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD"]).optional(),
});

// Discontinue Medication Schema
export const discontinueMedicationSchema = z.object({
  discontinueReason: z.string().min(5, "Reason must be at least 5 characters"),
});

// Administration Schema (for recording medication administration)
export const medicationAdministrationSchema = z.object({
  scheduleId: z.string().optional(), // Optional for PRN
  medicationOrderId: z.string().min(1, "Medication order is required"),

  administeredAt: z.string().min(1, "Administration time is required"),
  doseGiven: z.string().min(1, "Dose given is required"),
  route: z.enum(MEDICATION_ROUTES),
  status: z.enum(["GIVEN", "REFUSED", "HELD", "NOT_AVAILABLE", "LOA"]),

  // Reason fields
  refusedReason: z.string().optional(),
  heldReason: z.string().optional(),
  notGivenReason: z.string().optional(),

  // PRN specific
  prnReasonGiven: z.string().optional(),

  // Vitals (optional)
  vitalsBP: z.string().optional(),
  vitalsPulse: z.number().optional(),
  vitalsTemp: z.string().optional(),
  vitalsResp: z.number().optional(),
  vitalsPain: z.number().min(0).max(10).optional(),

  // Witness for controlled substances
  witnessId: z.string().optional(),
  witnessName: z.string().optional(),

  notes: z.string().optional(),

  // 6 Rights verification
  sixRightsVerified: z.boolean().refine(val => val === true, {
    message: "All 6 Rights must be verified before administration",
  }),
}).refine(
  (data) => {
    // If status is REFUSED, refusedReason must be provided
    if (data.status === "REFUSED" && !data.refusedReason) {
      return false;
    }
    return true;
  },
  {
    message: "Reason is required when medication is refused",
    path: ["refusedReason"],
  }
).refine(
  (data) => {
    // If status is HELD, heldReason must be provided
    if (data.status === "HELD" && !data.heldReason) {
      return false;
    }
    return true;
  },
  {
    message: "Reason is required when medication is held",
    path: ["heldReason"],
  }
);

// PRN Administration Schema (for PRN medications - requires prnReasonGiven)
export const prnAdministrationSchema = z.object({
  scheduleId: z.string().optional(),
  medicationOrderId: z.string().min(1, "Medication order is required"),
  administeredAt: z.string().min(1, "Administration time is required"),
  doseGiven: z.string().min(1, "Dose given is required"),
  route: z.enum(MEDICATION_ROUTES),
  status: z.enum(["GIVEN", "REFUSED", "HELD", "NOT_AVAILABLE", "LOA"]),
  refusedReason: z.string().optional(),
  heldReason: z.string().optional(),
  notGivenReason: z.string().optional(),
  prnReasonGiven: z.string().min(1, "PRN reason is required"),
  prnFollowupMinutes: z.number().min(15).max(120).default(60),
  vitalsBP: z.string().optional(),
  vitalsPulse: z.number().optional(),
  vitalsTemp: z.string().optional(),
  vitalsResp: z.number().optional(),
  vitalsPain: z.number().min(0).max(10).optional(),
  witnessId: z.string().optional(),
  witnessName: z.string().optional(),
  notes: z.string().optional(),
  sixRightsVerified: z.boolean().refine(val => val === true, {
    message: "All 6 Rights must be verified before administration",
  }),
});

// PRN Follow-up Schema
export const prnFollowupSchema = z.object({
  administrationId: z.string().min(1, "Administration ID is required"),
  prnEffectiveness: z.string().min(1, "Effectiveness assessment is required"),
  prnFollowupNotes: z.string().optional(),
});

// Schedule Generation Schema
export const scheduleGenerationSchema = z.object({
  medicationOrderId: z.string().min(1, "Medication order is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  daysToGenerate: z.number().min(1).max(30).default(7),
});

// Alert Acknowledgment Schema
export const alertAcknowledgmentSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required"),
});

// Dashboard Query Schema
export const emarDashboardQuerySchema = z.object({
  date: z.string().optional(), // Default to today
  shift: z.enum(["DAY", "NIGHT", "ALL"]).optional(),
  intakeId: z.string().optional(),
  includeUpcoming: z.boolean().optional(),
  hoursAhead: z.number().min(1).max(12).optional(),
});

// MAR Report Query Schema
export const marReportQuerySchema = z.object({
  intakeId: z.string().min(1, "Patient is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  includeDiscontinued: z.boolean().optional(),
});

// Type exports
export type MedicationOrderInput = z.infer<typeof medicationOrderSchema>;
export type MedicationOrderUpdateInput = z.infer<typeof medicationOrderUpdateSchema>;
export type DiscontinueMedicationInput = z.infer<typeof discontinueMedicationSchema>;
export type MedicationAdministrationInput = z.infer<typeof medicationAdministrationSchema>;
export type PRNAdministrationInput = z.infer<typeof prnAdministrationSchema>;
export type PRNFollowupInput = z.infer<typeof prnFollowupSchema>;
export type ScheduleGenerationInput = z.infer<typeof scheduleGenerationSchema>;
export type AlertAcknowledgmentInput = z.infer<typeof alertAcknowledgmentSchema>;
export type EmarDashboardQueryInput = z.infer<typeof emarDashboardQuerySchema>;
export type MARReportQueryInput = z.infer<typeof marReportQuerySchema>;

// =====================================================
// Progress Note Validation Schema
// =====================================================

export const PROGRESS_NOTE_SHIFTS = ["AM", "PM", "NOC"] as const;

export const PROGRESS_NOTE_STATUSES = ["DRAFT", "FINAL"] as const;

export const RISK_FLAGS = [
  "SELF_HARM",
  "SUICIDAL_IDEATION",
  "HOMICIDAL_IDEATION",
  "AGGRESSION",
  "MEDICAL_DISTRESS",
  "ELOPEMENT_RISK",
  "SUBSTANCE_USE",
] as const;

export const progressNoteSchema = z.object({
  // Required fields
  noteDate: z.string().min(1, "Note date is required"),
  authorName: z.string().min(1, "Author name is required"),

  // Optional fields
  shift: z.enum(PROGRESS_NOTE_SHIFTS).optional(),
  authorTitle: z.string().optional(),

  // Staff Input Fields (all optional)
  residentStatus: z.string().optional(),
  observedBehaviors: z.string().optional(),
  moodAffect: z.string().optional(),
  activityParticipation: z.string().optional(),
  staffInteractions: z.string().optional(),
  peerInteractions: z.string().optional(),
  medicationCompliance: z.string().optional(),
  hygieneAdl: z.string().optional(),
  mealsAppetite: z.string().optional(),
  sleepPattern: z.string().optional(),
  staffInterventions: z.string().optional(),
  residentResponse: z.string().optional(),
  notableEvents: z.string().optional(),
  additionalNotes: z.string().optional(),

  // BHT Signature (required for finalization)
  bhtSignature: z.string().min(1, "BHT signature is required"),
  bhtCredentials: z.string().optional(),
  bhtSignatureDate: z.string().min(1, "Signature date is required"),
});

export const progressNoteDraftSchema = z.object({
  // All fields optional for drafts
  noteDate: z.string().optional(),
  authorName: z.string().optional(),
  shift: z.enum(PROGRESS_NOTE_SHIFTS).optional(),
  authorTitle: z.string().optional(),
  residentStatus: z.string().optional(),
  observedBehaviors: z.string().optional(),
  moodAffect: z.string().optional(),
  activityParticipation: z.string().optional(),
  staffInteractions: z.string().optional(),
  peerInteractions: z.string().optional(),
  medicationCompliance: z.string().optional(),
  hygieneAdl: z.string().optional(),
  mealsAppetite: z.string().optional(),
  sleepPattern: z.string().optional(),
  staffInterventions: z.string().optional(),
  residentResponse: z.string().optional(),
  notableEvents: z.string().optional(),
  additionalNotes: z.string().optional(),
  // BHT Signature (optional for drafts)
  bhtSignature: z.string().optional(),
  bhtCredentials: z.string().optional(),
  bhtSignatureDate: z.string().optional(),
});

export const progressNoteUpdateSchema = z.object({
  noteDate: z.string().optional(),
  shift: z.enum(PROGRESS_NOTE_SHIFTS).optional(),
  authorName: z.string().optional(),
  authorTitle: z.string().optional(),
  residentStatus: z.string().optional(),
  observedBehaviors: z.string().optional(),
  moodAffect: z.string().optional(),
  activityParticipation: z.string().optional(),
  staffInteractions: z.string().optional(),
  peerInteractions: z.string().optional(),
  medicationCompliance: z.string().optional(),
  hygieneAdl: z.string().optional(),
  mealsAppetite: z.string().optional(),
  sleepPattern: z.string().optional(),
  staffInterventions: z.string().optional(),
  residentResponse: z.string().optional(),
  notableEvents: z.string().optional(),
  additionalNotes: z.string().optional(),
  generatedNote: z.string().optional(),
  riskFlagsDetected: z.array(z.string()).optional(),
  status: z.enum(PROGRESS_NOTE_STATUSES).optional(),
  // BHT Signature fields
  bhtSignature: z.string().optional(),
  bhtCredentials: z.string().optional(),
  bhtSignatureDate: z.string().optional(),
});

export type ProgressNoteInput = z.infer<typeof progressNoteSchema>;
export type ProgressNoteDraftInput = z.infer<typeof progressNoteDraftSchema>;
export type ProgressNoteUpdateInput = z.infer<typeof progressNoteUpdateSchema>;
