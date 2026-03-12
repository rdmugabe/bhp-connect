import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

export interface ProgressNoteInputs {
  residentName: string;
  noteDate: string;
  shift?: string;
  authorName: string;
  authorTitle?: string;
  residentStatus?: string;
  observedBehaviors?: string;
  moodAffect?: string;
  activityParticipation?: string;
  staffInteractions?: string;
  peerInteractions?: string;
  medicationCompliance?: string;
  hygieneAdl?: string;
  mealsAppetite?: string;
  sleepPattern?: string;
  staffInterventions?: string;
  residentResponse?: string;
  notableEvents?: string;
  additionalNotes?: string;
}

export interface ProgressNoteResult {
  note: string;
  riskFlags: string[];
}

const CLINICAL_SYSTEM_PROMPT = `You are a clinical documentation specialist for a behavioral health residential facility (BHRF). Your role is to convert staff observations into professional, audit-ready clinical progress notes suitable for Medicaid compliance and regulatory review.

DOCUMENTATION STANDARDS:
- Write in third person, clinical language
- Use objective, observable terms
- Avoid judgmental or subjective language
- Be concise but thorough
- Structure notes professionally with clear sections
- Include relevant clinical observations
- Document staff interventions and resident responses
- Note any changes in condition or behavior

RISK DETECTION:
Scan all inputs for indicators of:
- Self-harm or suicidal ideation (mention of wanting to hurt self, not wanting to live, history of self-harm)
- Threats toward others or homicidal ideation
- Aggressive behavior (physical altercations, verbal threats, property destruction)
- Medical distress (concerning physical symptoms, medication reactions)
- Elopement attempts or statements about leaving without authorization
- Substance use or signs of intoxication

If ANY risk indicators are detected, you MUST:
1. Include the risk flag in your response
2. Add this statement to the note: "Staff should continue to monitor the resident closely and follow facility protocol by notifying appropriate clinical personnel."

OUTPUT FORMAT:
Return a JSON object with exactly this structure:
{
  "note": "The professionally formatted clinical progress note text",
  "riskFlags": ["array", "of", "detected", "risk", "flags"] // or empty array if none
}

Valid risk flag values: "SELF_HARM", "SUICIDAL_IDEATION", "HOMICIDAL_IDEATION", "AGGRESSION", "MEDICAL_DISTRESS", "ELOPEMENT_RISK", "SUBSTANCE_USE"`;

function formatInputsForAI(inputs: ProgressNoteInputs): string {
  const sections: string[] = [];

  sections.push(`Resident: ${inputs.residentName}`);
  sections.push(`Date: ${inputs.noteDate}`);
  if (inputs.shift) sections.push(`Shift: ${inputs.shift}`);
  sections.push(`Author: ${inputs.authorName}${inputs.authorTitle ? `, ${inputs.authorTitle}` : ""}`);

  sections.push("\n--- STAFF OBSERVATIONS ---\n");

  if (inputs.residentStatus) {
    sections.push(`Resident Status: ${inputs.residentStatus}`);
  }
  if (inputs.observedBehaviors) {
    sections.push(`Observed Behaviors: ${inputs.observedBehaviors}`);
  }
  if (inputs.moodAffect) {
    sections.push(`Mood/Affect: ${inputs.moodAffect}`);
  }
  if (inputs.activityParticipation) {
    sections.push(`Activity Participation: ${inputs.activityParticipation}`);
  }
  if (inputs.staffInteractions) {
    sections.push(`Staff Interactions: ${inputs.staffInteractions}`);
  }
  if (inputs.peerInteractions) {
    sections.push(`Peer Interactions: ${inputs.peerInteractions}`);
  }
  if (inputs.medicationCompliance) {
    sections.push(`Medication Compliance: ${inputs.medicationCompliance}`);
  }
  if (inputs.hygieneAdl) {
    sections.push(`Hygiene/ADLs: ${inputs.hygieneAdl}`);
  }
  if (inputs.mealsAppetite) {
    sections.push(`Meals/Appetite: ${inputs.mealsAppetite}`);
  }
  if (inputs.sleepPattern) {
    sections.push(`Sleep Pattern: ${inputs.sleepPattern}`);
  }
  if (inputs.staffInterventions) {
    sections.push(`Staff Interventions: ${inputs.staffInterventions}`);
  }
  if (inputs.residentResponse) {
    sections.push(`Resident Response: ${inputs.residentResponse}`);
  }
  if (inputs.notableEvents) {
    sections.push(`Notable Events: ${inputs.notableEvents}`);
  }
  if (inputs.additionalNotes) {
    sections.push(`Additional Notes: ${inputs.additionalNotes}`);
  }

  return sections.join("\n");
}

function parseAIResponse(response: Anthropic.Message): ProgressNoteResult {
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format from AI");
  }

  const text = content.text.trim();

  // Try to parse as JSON
  try {
    // Handle potential markdown code blocks
    let jsonText = text;
    if (text.startsWith("```json")) {
      jsonText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      jsonText = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    if (typeof parsed.note !== "string") {
      throw new Error("Invalid response: missing 'note' field");
    }

    return {
      note: parsed.note,
      riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags : [],
    };
  } catch {
    // If parsing fails, treat the entire response as the note
    console.warn("Failed to parse AI response as JSON, using raw text");
    return {
      note: text,
      riskFlags: [],
    };
  }
}

export async function generateProgressNote(
  inputs: ProgressNoteInputs
): Promise<ProgressNoteResult> {
  const client = getAnthropicClient();

  const userMessage = formatInputsForAI(inputs);

  const response = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    system: CLINICAL_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please convert the following staff observations into a professional clinical progress note:\n\n${userMessage}`,
      },
    ],
  });

  return parseAIResponse(response);
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ============================================================================
// DISCHARGE SUMMARY AI GENERATION
// ============================================================================

export interface DischargeSummaryInputs {
  residentName: string;
  dateOfBirth: string;
  admissionDate: string;
  dischargeDate: string;
  lengthOfStay: number;

  // From Intake
  diagnosis?: string;
  treatmentRecommendation?: string;
  treatmentObjectives?: string;
  personalPsychHX?: string;
  substanceUseHistory?: string;
  presentingProblems?: string;

  // Treatment Plan Content (from document)
  treatmentPlanContent?: string;

  // Progress Summary
  progressNotesSummary?: string;
  totalProgressNotes?: number;
  riskFlagsEncountered?: string[];

  // ASAM Summary
  asamRecommendedLevel?: string;
  asamSummary?: string;

  // Current Medications
  currentMedications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;

  // Discharge Type
  dischargeType?: string;
}

export interface DischargeSummaryResult {
  presentingIssuesAtAdmission: string;
  treatmentSummary: string;
  dischargeSummaryNarrative: string;
  clinicalRecommendations: string;
  objectivesAttained: Array<{
    objective: string;
    attained: "Fully Attained" | "Partially Attained" | "Not Attained" | "N/A";
  }>;
  objectiveNarratives: {
    fullyAttained: string;
    partiallyAttained: string;
    notAttained: string;
  };
  relapsePreventionPlan: string;
  crisisResources: string;
  patientEducationProvided: string;
  specialInstructions: string;
  suicidePreventionEducation: string;
}

const DISCHARGE_SYSTEM_PROMPT = `You are a clinical documentation specialist for a behavioral health residential facility (BHRF). Your role is to generate professional, audit-ready discharge summary narratives suitable for Medicaid compliance and regulatory review.

You will receive information about a resident's stay including:
- Intake assessment data (diagnosis, presenting problems, history)
- Treatment plan goals and objectives
- Progress notes summary
- ASAM assessment recommendations
- Current medications
- Length of stay and discharge type

DOCUMENTATION STANDARDS:
- Write in third person, clinical language
- Use objective, observable terms
- Be thorough but concise
- Reference specific treatment objectives and their attainment
- Document the resident's overall progress during their stay
- Provide actionable clinical recommendations for continued care
- Include appropriate suicide prevention education based on history

OUTPUT FORMAT:
Return a JSON object with exactly this structure:
{
  "presentingIssuesAtAdmission": "A comprehensive paragraph describing the issues that brought the resident to treatment, including diagnosis, symptoms, and circumstances at admission",
  "treatmentSummary": "A summary of the treatment provided during the stay, including therapeutic interventions, groups attended, skills developed, and progress toward goals",
  "dischargeSummaryNarrative": "A detailed narrative (2-3 paragraphs) summarizing the resident's entire treatment episode, progress made, challenges encountered, and current status at discharge",
  "clinicalRecommendations": "Specific, actionable recommendations for continued care including therapy, medication management, support groups, and follow-up care",
  "objectivesAttained": [
    {"objective": "Specific treatment objective from plan", "attained": "Fully Attained|Partially Attained|Not Attained|N/A"}
  ],
  "objectiveNarratives": {
    "fullyAttained": "Summary of objectives that were fully achieved and how",
    "partiallyAttained": "Summary of objectives with partial progress and what remains",
    "notAttained": "Summary of objectives not achieved and barriers encountered"
  },
  "relapsePreventionPlan": "A detailed relapse prevention plan including triggers identified, coping strategies developed, warning signs to watch for, and action steps if relapse occurs",
  "crisisResources": "List of crisis resources provided to the resident including hotlines (988 Suicide & Crisis Lifeline, local crisis lines), emergency contacts, and instructions for seeking help",
  "patientEducationProvided": "Documentation of education provided to the resident about their diagnosis, medications, coping skills, community resources, and aftercare planning",
  "specialInstructions": "Any special instructions for the resident regarding medications, follow-up appointments, restrictions, or other important care considerations",
  "suicidePreventionEducation": "Documentation of suicide prevention education provided, including warning signs, coping strategies, and crisis resources shared with resident"
}

IMPORTANT:
- Base objectives on the treatment plan content if provided
- If no treatment plan is available, derive objectives from intake assessment goals
- Ensure clinical recommendations align with the discharge type (completed treatment vs AMA, etc.)
- For AMA discharges, note the against-medical-advice nature and emphasize importance of continued treatment`;

function formatDischargeSummaryInputs(inputs: DischargeSummaryInputs): string {
  const sections: string[] = [];

  sections.push("=== RESIDENT INFORMATION ===");
  sections.push(`Resident: ${inputs.residentName}`);
  sections.push(`Date of Birth: ${inputs.dateOfBirth}`);
  sections.push(`Admission Date: ${inputs.admissionDate}`);
  sections.push(`Discharge Date: ${inputs.dischargeDate}`);
  sections.push(`Length of Stay: ${inputs.lengthOfStay} days`);
  if (inputs.dischargeType) {
    sections.push(`Discharge Type: ${inputs.dischargeType}`);
  }

  sections.push("\n=== INTAKE ASSESSMENT ===");
  if (inputs.diagnosis) {
    sections.push(`Diagnosis: ${inputs.diagnosis}`);
  }
  if (inputs.presentingProblems) {
    sections.push(`Presenting Problems: ${inputs.presentingProblems}`);
  }
  if (inputs.personalPsychHX) {
    sections.push(`Psychiatric History: ${inputs.personalPsychHX}`);
  }
  if (inputs.substanceUseHistory) {
    sections.push(`Substance Use History: ${inputs.substanceUseHistory}`);
  }
  if (inputs.treatmentRecommendation) {
    sections.push(`Initial Treatment Recommendation: ${inputs.treatmentRecommendation}`);
  }
  if (inputs.treatmentObjectives) {
    sections.push(`Treatment Objectives from Intake: ${inputs.treatmentObjectives}`);
  }

  if (inputs.treatmentPlanContent) {
    sections.push("\n=== TREATMENT PLAN ===");
    sections.push(inputs.treatmentPlanContent);
  }

  if (inputs.asamRecommendedLevel || inputs.asamSummary) {
    sections.push("\n=== ASAM ASSESSMENT ===");
    if (inputs.asamRecommendedLevel) {
      sections.push(`Recommended Level of Care: ${inputs.asamRecommendedLevel}`);
    }
    if (inputs.asamSummary) {
      sections.push(`ASAM Summary: ${inputs.asamSummary}`);
    }
  }

  if (inputs.progressNotesSummary) {
    sections.push("\n=== PROGRESS DURING STAY ===");
    sections.push(`Total Progress Notes: ${inputs.totalProgressNotes || "N/A"}`);
    sections.push(inputs.progressNotesSummary);
    if (inputs.riskFlagsEncountered && inputs.riskFlagsEncountered.length > 0) {
      sections.push(`Risk Flags Encountered: ${inputs.riskFlagsEncountered.join(", ")}`);
    }
  }

  if (inputs.currentMedications && inputs.currentMedications.length > 0) {
    sections.push("\n=== CURRENT MEDICATIONS ===");
    inputs.currentMedications.forEach((med) => {
      sections.push(`- ${med.name} ${med.dosage} ${med.frequency}`);
    });
  }

  return sections.join("\n");
}

function parseDischargeSummaryResponse(response: Anthropic.Message): DischargeSummaryResult {
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format from AI");
  }

  const text = content.text.trim();

  // Try to parse as JSON
  try {
    let jsonText = text;
    if (text.startsWith("```json")) {
      jsonText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      jsonText = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    return {
      presentingIssuesAtAdmission: parsed.presentingIssuesAtAdmission || "",
      treatmentSummary: parsed.treatmentSummary || "",
      dischargeSummaryNarrative: parsed.dischargeSummaryNarrative || "",
      clinicalRecommendations: parsed.clinicalRecommendations || "",
      objectivesAttained: Array.isArray(parsed.objectivesAttained) ? parsed.objectivesAttained : [],
      objectiveNarratives: {
        fullyAttained: parsed.objectiveNarratives?.fullyAttained || "",
        partiallyAttained: parsed.objectiveNarratives?.partiallyAttained || "",
        notAttained: parsed.objectiveNarratives?.notAttained || "",
      },
      relapsePreventionPlan: parsed.relapsePreventionPlan || "",
      crisisResources: parsed.crisisResources || "",
      patientEducationProvided: parsed.patientEducationProvided || "",
      specialInstructions: parsed.specialInstructions || "",
      suicidePreventionEducation: parsed.suicidePreventionEducation || "",
    };
  } catch (e) {
    console.error("Failed to parse discharge summary AI response:", e);
    throw new Error("Failed to parse AI response for discharge summary");
  }
}

export async function generateDischargeSummary(
  inputs: DischargeSummaryInputs
): Promise<DischargeSummaryResult> {
  const client = getAnthropicClient();

  const userMessage = formatDischargeSummaryInputs(inputs);

  const response = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2048,
    system: DISCHARGE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please generate a professional discharge summary based on the following resident information:\n\n${userMessage}`,
      },
    ],
  });

  return parseDischargeSummaryResponse(response);
}
