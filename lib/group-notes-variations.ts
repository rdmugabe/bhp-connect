/**
 * Session-summary variation generator.
 *
 * The group therapy day has up to three sessions (9:30 AM / 1:00 PM /
 * 4:30 PM). The wizard collects one summary text describing the day's
 * topic; each session's progress note is more defensible when its summary
 * reads slightly differently — the morning framing differs from the
 * afternoon and evening framings. One Claude tool-use call turns the
 * facilitator's single summary into N distinct rewrites, preserving the
 * core content but shifting phrasing, opening lines, and takeaway framing
 * per session.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

export type SlotCode = "0930" | "1300" | "1630";

const SLOT_META: Record<SlotCode, { label: string; timeOfDay: string }> = {
  "0930": { label: "9:30 AM group",  timeOfDay: "morning" },
  "1300": { label: "1:00 PM group",  timeOfDay: "afternoon" },
  "1630": { label: "4:30 PM group",  timeOfDay: "late-afternoon / evening" },
};

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 2000;

function readAnthropicKey(): string {
  const envPath = path.join(process.cwd(), ".env");
  try {
    const contents = fs.readFileSync(envPath, "utf-8");
    for (const line of contents.split(/\r?\n/)) {
      const m = /^\s*ANTHROPIC_API_KEY\s*=\s*"?([^"\r\n]+)"?\s*$/.exec(line);
      if (m) return m[1].trim();
    }
  } catch { /* fall through */ }
  return process.env.ANTHROPIC_API_KEY || "";
}

let anthropic: Anthropic | null = null;
function client(): Anthropic {
  if (!anthropic) anthropic = new Anthropic({ apiKey: readAnthropicKey() });
  return anthropic;
}

const SYSTEM = `You are a licensed behavioral health clinician writing brief session summaries for group therapy progress notes at a Behavioral Health Residential Facility (BHRF). Residents commonly present with substance use disorders and co-occurring mental health conditions.

Style constraints:
- Plain language at an 8th-grade reading level.
- Trauma-informed, non-shaming.
- Clinically defensible: describe what the group covered, how members engaged, and what they took away.
- 2-4 sentences per summary.
- Distinct openings and phrasing across sessions; do not repeat the same sentence structure.
- Do not fabricate content that contradicts the facilitator's summary. Reuse the same key content and takeaway but vary the framing to reflect the time-of-day and session ordinal (first, middle, last group of the day).
- No em-dashes.`;

const TOOL = {
  name: "emit_session_summaries",
  description: "Return one session-specific summary per requested slot.",
  input_schema: {
    type: "object" as const,
    properties: {
      summaries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slot: { type: "string", enum: ["0930", "1300", "1630"] },
            summary: {
              type: "string",
              description: "2-4 sentence summary for this session's progress note.",
            },
          },
          required: ["slot", "summary"],
        },
        minItems: 1,
        maxItems: 3,
      },
    },
    required: ["summaries"],
  },
};

/**
 * Generate one distinct summary per requested session slot.
 *
 * Fallback: if the API call fails or the key is missing, returns the
 * original summary for every slot (no throw) so document generation
 * remains resilient.
 */
export async function generateSessionSummaries(
  topic: string,
  baseSummary: string,
  slots: SlotCode[]
): Promise<Record<SlotCode, string>> {
  const fallback: Record<SlotCode, string> = { "0930": baseSummary, "1300": baseSummary, "1630": baseSummary };
  if (slots.length === 0) return fallback;
  if (slots.length === 1 || !baseSummary.trim()) return fallback;
  if (!readAnthropicKey()) return fallback;

  const slotLines = slots
    .map((s, i) => `- Slot ${s} (${SLOT_META[s].label}, ${SLOT_META[s].timeOfDay}) — this is group ${i + 1} of ${slots.length} for the day`)
    .join("\n");

  const userMsg = `Group topic: ${topic || "(not specified)"}

Facilitator's day-level summary:
${baseSummary}

Write one 2-4 sentence session-specific summary for each of the following slots. Keep the core content consistent with the facilitator's summary but vary the opening line, phrasing, and takeaway framing so the three summaries read distinctly. Do not repeat sentences across summaries.

${slotLines}`;

  try {
    const c = client();
    const resp = await c.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: userMsg }],
    });
    const toolUse = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL.name
    );
    if (!toolUse) return fallback;
    const input = toolUse.input as { summaries?: Array<{ slot?: SlotCode; summary?: string }> };
    if (!Array.isArray(input.summaries)) return fallback;

    const out: Record<SlotCode, string> = { ...fallback };
    for (const item of input.summaries) {
      if (item.slot && typeof item.summary === "string" && item.summary.trim()) {
        out[item.slot] = item.summary.trim();
      }
    }
    return out;
  } catch {
    return fallback;
  }
}
