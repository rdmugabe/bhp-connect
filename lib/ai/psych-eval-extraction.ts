import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// ============================================================================
// EXTRACTED DATA INTERFACES
// ============================================================================

export interface ExtractedIntakeData {
  // Demographics
  residentName?: string;
  dateOfBirth?: string; // ISO date string
  ssn?: string; // Last 4 digits only
  sex?: string;
  ethnicity?: string;

  // Contact
  patientAddress?: string;
  patientPhone?: string;
  patientEmail?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;

  // Insurance
  insuranceProvider?: string;
  ahcccsHealthPlan?: string;
  policyNumber?: string;

  // Referral
  referralSource?: string;
  evaluatorName?: string;
  evaluatorCredentials?: string;
  reasonsForReferral?: string;

  // Medical
  allergies?: string;
  personalMedicalHX?: string;
  medicalConditions?: string[];

  // Psychiatric
  personalPsychHX?: string;
  familyPsychHX?: string;
  diagnosis?: string;
  isCOT?: boolean;
  treatmentPreferences?: string;
  psychMedicationEfficacy?: string;
  currentBehavioralSymptoms?: string;

  // Risk Assessment
  suicideHistory?: string;
  currentSuicideIdeation?: boolean;
  suicideIdeationDetails?: string;
  historySelfHarm?: boolean;
  selfHarmDetails?: string;
  historyHarmingOthers?: boolean;
  harmingOthersDetails?: string;
  homicidalIdeation?: boolean;
  previousHospitalizations?: string;

  // Substance Use
  substanceHistory?: string;
  drugOfChoice?: string;
  longestSobriety?: string;
  substanceTreatmentHistory?: string;

  // Current medications (will be converted to JSON)
  currentMedications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    reason?: string;
  }>;
}

export interface ExtractedASAMData {
  // Demographics (may overlap with intake)
  patientName?: string;
  dateOfBirth?: string;
  gender?: string;
  raceEthnicity?: string;
  phoneNumber?: string;
  patientAddress?: string;
  ahcccsId?: string;
  insuranceType?: string;
  reasonForTreatment?: string;
  currentSymptoms?: string;

  // Dimension 1: Substance Use, Acute Intoxication and/or Withdrawal Potential
  substanceUseHistory?: Array<{
    substance: string;
    route?: string;
    frequency?: string;
    lastUse?: string;
    duration?: string;
  }>;
  usingMoreThanIntended?: boolean;
  usingMoreDetails?: string;
  currentWithdrawalSymptoms?: boolean;
  withdrawalSymptomsDetails?: string;
  toleranceIncreased?: boolean;
  toleranceDetails?: string;
  familySubstanceHistory?: string;
  dimension1Severity?: number; // 0-4

  // Dimension 2: Biomedical Conditions and Complications
  medicalConditions?: string[];
  conditionsInterfere?: boolean;
  conditionsInterfereDetails?: string;
  priorHospitalizations?: string;
  medicalMedications?: Array<{
    medication: string;
    dose?: string;
    reason?: string;
  }>;
  dimension2Severity?: number;

  // Dimension 3: Emotional, Behavioral, or Cognitive Conditions
  moodSymptoms?: string[];
  anxietySymptoms?: string[];
  psychosisSymptoms?: string[];
  suicidalThoughts?: boolean;
  suicidalThoughtsDetails?: string;
  thoughtsOfHarmingOthers?: boolean;
  harmingOthersDetails?: string;
  abuseHistory?: string;
  traumaticEvents?: string;
  mentalIllnessDiagnosed?: boolean;
  mentalIllnessDetails?: string;
  previousPsychTreatment?: boolean;
  psychTreatmentDetails?: string;
  psychiatricMedications?: Array<{
    medication: string;
    dose?: string;
    reason?: string;
  }>;
  dimension3Severity?: number;

  // Dimension 4: Readiness to Change
  areasAffectedByUse?: string[];
  continueUseDespitefects?: boolean;
  continueUseDetails?: string;
  recoverySupport?: string;
  recoveryBarriers?: string;
  treatmentImportanceAlcohol?: string;
  treatmentImportanceDrugs?: string;
  dimension4Severity?: number;

  // Dimension 5: Relapse, Continued Use, or Continued Problem Potential
  cravingsFrequencyAlcohol?: string;
  cravingsFrequencyDrugs?: string;
  cravingsDetails?: string;
  awareOfTriggers?: boolean;
  triggersList?: string[];
  copingWithTriggers?: string;
  longestSobriety?: string;
  whatHelped?: string;
  whatDidntHelp?: string;
  dimension5Severity?: number;

  // Dimension 6: Recovery/Living Environment
  supportiveRelationships?: string;
  currentLivingSituation?: string;
  othersUsingDrugsInEnvironment?: boolean;
  othersUsingDetails?: string;
  safetyThreats?: boolean;
  safetyThreatsDetails?: string;
  currentlyEmployedOrSchool?: boolean;
  employmentSchoolDetails?: string;
  socialServicesInvolved?: boolean;
  socialServicesDetails?: string;
  dimension6Severity?: number;

  // DSM-5 & Level of Care
  dsm5Diagnoses?: string;
  recommendedLevelOfCare?: string;
}

export interface ExtractionConfidence {
  overall: number; // 0-1
  intake: number;
  asam: number;
}

export interface ExtractionWarning {
  field: string;
  message: string;
}

export interface PsychEvalExtractionResult {
  intake: ExtractedIntakeData;
  asam: ExtractedASAMData;
  confidence: ExtractionConfidence;
  warnings: ExtractionWarning[];
}

// ============================================================================
// AI EXTRACTION PROMPT
// ============================================================================

const PSYCH_EVAL_EXTRACTION_PROMPT = `You are a clinical data extraction specialist for behavioral health facilities. Your task is to extract structured data from a psychiatric evaluation document.

EXTRACTION RULES:
1. Only extract information that is EXPLICITLY stated in the document
2. DO NOT infer, assume, or make up any information
3. If a field cannot be found, omit it from the output (leave as null/undefined)
4. For dates, convert to ISO format (YYYY-MM-DD) when possible
5. For SSN, only extract the last 4 digits
6. Be conservative - if unsure about a value, don't include it

IMPORTANT FIELD MAPPINGS:

INTAKE DATA:
- Demographics: name, DOB, sex, ethnicity, SSN (last 4 only)
- Contact: address, phone, email
- Emergency contact: name, relationship, phone
- Insurance: provider, AHCCCS plan, policy number
- Referral: source, evaluator name/credentials, reasons for referral
- Medical: allergies, medical history, current conditions
- Psychiatric: psychiatric history (personal & family), diagnoses, Court-Ordered Treatment (COT)
- Risk: suicide history, current ideation, self-harm history, harm to others, hospitalizations
- Substance: use history, drug of choice, longest sobriety, treatment history
- Medications: name, dosage, frequency, reason for each

ASAM DATA (6 Dimensions):
- Dimension 1 (Substance Use/Withdrawal): substance use details, withdrawal symptoms, tolerance
- Dimension 2 (Biomedical): medical conditions, medications, hospitalizations
- Dimension 3 (Emotional/Behavioral): mood symptoms, anxiety, trauma, mental illness history
- Dimension 4 (Readiness): areas affected by use, motivation, barriers to recovery
- Dimension 5 (Relapse Potential): triggers, coping strategies, sobriety history
- Dimension 6 (Environment): living situation, support system, safety concerns

For severity ratings (0-4 scale):
- 0: None/Not applicable
- 1: Mild
- 2: Moderate
- 3: Severe/Significant
- 4: Very Severe/Imminent risk

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "intake": { /* extracted intake fields */ },
  "asam": { /* extracted ASAM fields */ },
  "confidence": {
    "overall": 0.0-1.0,
    "intake": 0.0-1.0,
    "asam": 0.0-1.0
  },
  "warnings": [
    { "field": "fieldName", "message": "Description of issue" }
  ]
}

CONFIDENCE SCORING:
- 0.9-1.0: Clear, explicit data found
- 0.7-0.89: Data found but some interpretation needed
- 0.5-0.69: Partial data, significant gaps
- 0.0-0.49: Very limited data available

Include warnings for:
- Critical fields not found (DOB, name)
- Conflicting information
- Unclear or ambiguous data
- Missing risk assessment information

CRITICAL: Your response must be ONLY valid JSON. Do not include any text before or after the JSON object. Do not use markdown code blocks. Start directly with { and end with }.`;

// ============================================================================
// EXTRACTION FUNCTION
// ============================================================================

function parseExtractionResponse(
  response: Anthropic.Message
): PsychEvalExtractionResult {
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format from AI");
  }

  let text = content.text.trim();
  console.log("[PsychEval] Raw AI response length:", text.length);
  console.log("[PsychEval] Raw AI response preview:", text.substring(0, 500));

  // Handle potential markdown code blocks - find JSON within code blocks
  const jsonCodeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonCodeBlockMatch) {
    text = jsonCodeBlockMatch[1].trim();
    console.log("[PsychEval] Extracted from code block");
  }

  // If still not valid JSON, try to find JSON object in the text
  if (!text.startsWith("{")) {
    // Try to find the largest JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
      console.log("[PsychEval] Extracted JSON object from text");
    } else {
      console.error("[PsychEval] No JSON object found in response");
      console.error("[PsychEval] Full response:", text);
      throw new Error("AI did not return valid JSON");
    }
  }

  // Clean up any trailing text after the JSON
  let braceCount = 0;
  let jsonEndIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') braceCount++;
    if (text[i] === '}') braceCount--;
    if (braceCount === 0 && text[i] === '}') {
      jsonEndIndex = i + 1;
      break;
    }
  }
  if (jsonEndIndex > 0 && jsonEndIndex < text.length) {
    text = text.substring(0, jsonEndIndex);
    console.log("[PsychEval] Trimmed trailing text after JSON");
  }

  try {
    const parsed = JSON.parse(text);
    console.log("[PsychEval] Successfully parsed JSON");
    console.log("[PsychEval] Intake fields:", Object.keys(parsed.intake || {}));
    console.log("[PsychEval] ASAM fields:", Object.keys(parsed.asam || {}));
    console.log("[PsychEval] Intake data sample:", JSON.stringify(parsed.intake || {}).substring(0, 500));

    // Validate structure
    return {
      intake: parsed.intake || {},
      asam: parsed.asam || {},
      confidence: {
        overall: parsed.confidence?.overall ?? 0.5,
        intake: parsed.confidence?.intake ?? 0.5,
        asam: parsed.confidence?.asam ?? 0.5,
      },
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (e) {
    console.error("[PsychEval] Failed to parse AI extraction response:", e);
    console.error("[PsychEval] Text that failed to parse:", text.substring(0, 1000));
    throw new Error("Failed to parse AI extraction response");
  }
}

export async function extractPsychEvalData(
  pdfText: string,
  residentName?: string
): Promise<PsychEvalExtractionResult> {
  const client = getAnthropicClient();

  // Build user message with context
  let userMessage = "Extract structured intake and ASAM assessment data from this psychiatric evaluation. Respond with ONLY a JSON object, no other text.\n\n";

  if (residentName) {
    userMessage += `Resident name: "${residentName}"\n\n`;
  }

  userMessage += "DOCUMENT:\n\n";
  userMessage += pdfText.substring(0, 15000); // Limit text to avoid token limits
  userMessage += "\n\nRespond with only the JSON object. Start with { and end with }.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: PSYCH_EVAL_EXTRACTION_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return parseExtractionResponse(response);
}
