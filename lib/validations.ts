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
    clientSignature: z.string().optional(),
    clientSignatureDate: z.string().optional(),
    assessorSignature: z.string().optional(),
    assessorSignatureDate: z.string().optional(),
    clinicalOversightSignature: z.string().optional(),
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
    clientSignature: z.string().optional(),
    clientSignatureDate: z.string().optional(),
    assessorSignature: z.string().optional(),
    assessorSignatureDate: z.string().optional(),
    clinicalOversightSignature: z.string().optional(),
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
  dsm5Criteria: z.array(z.object({
    substanceName: z.string(),
    criteria: z.array(z.boolean()).optional(),
    totalCriteria: z.number().optional(),
  })).optional(),
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
  numberEvacuated: z.number().min(0).optional(),
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
  })).optional(),
  observations: z.string().optional(),
  correctiveActions: z.string().optional(),
  drillResult: z.enum(["SATISFACTORY", "NEEDS_IMPROVEMENT", "UNSATISFACTORY"]),
  signatures: z.object({
    staffSignature: z.string().optional(),
    staffSignatureDate: z.string().optional(),
    supervisorSignature: z.string().optional(),
    supervisorSignatureDate: z.string().optional(),
  }).optional(),
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
  totalLengthMinutes: z.number().min(0).optional(),
  shift: z.enum(["AM", "PM"]),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  year: z.number().min(2020).max(2100),
  disasterDrillType: z.string().optional(),
  staffInvolved: z.array(z.object({
    name: z.string().min(1, "Staff name is required"),
  })).min(1, "At least one staff member is required"),
  residentsInvolved: z.array(z.object({
    name: z.string(),
    assistanceRequired: z.string().optional(),
  })).optional(),
  exitBlocked: z.string().optional(),
  exitUsed: z.string().optional(),
  assemblyPoint: z.string().optional(),
  correctLocation: z.boolean().optional(),
  allAccountedFor: z.boolean().optional(),
  issuesIdentified: z.boolean().optional(),
  observations: z.string().optional(),
  drillResult: z.enum(["SATISFACTORY", "NEEDS_IMPROVEMENT", "UNSATISFACTORY"]),
  signatures: z.object({
    conductedBy: z.string().optional(),
    conductedByDate: z.string().optional(),
    supervisor: z.string().optional(),
    supervisorDate: z.string().optional(),
  }).optional(),
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
