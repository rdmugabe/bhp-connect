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
