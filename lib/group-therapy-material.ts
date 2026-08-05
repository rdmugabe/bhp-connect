/**
 * Group Therapy Material generation.
 *
 * Uses Claude to draft the topic, facilitator guide, participant handout, and
 * a set of YouTube search queries; then hits the YouTube Data API to resolve
 * each query to a real, embeddable, safe-search video. Returns a fully-resolved
 * material object ready to persist and render.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { youtubeSearchMany, type YouTubeSearchResult } from "./youtube-search";

/**
 * Read the ANTHROPIC_API_KEY from the project's .env file directly, bypassing
 * process.env. Some shells (e.g. Claude Code's parent shell) export a stale
 * ANTHROPIC_API_KEY that Next.js gives priority over `.env`; reading the file
 * ensures we always use the value the developer just saved.
 */
function readAnthropicKey(): string {
  const envPath = path.join(process.cwd(), ".env");
  try {
    const contents = fs.readFileSync(envPath, "utf-8");
    for (const line of contents.split(/\r?\n/)) {
      const m = /^\s*ANTHROPIC_API_KEY\s*=\s*"?([^"\r\n]+)"?\s*$/.exec(line);
      if (m) return m[1].trim();
    }
  } catch {
    /* fall through */
  }
  return process.env.ANTHROPIC_API_KEY || "";
}

// Haiku 4.5 + trimmed max_tokens to stay comfortably under Amplify SSR's
// hard 30s CloudFront ceiling. 6000 tokens produced ~28s Lambda runs that
// then 504'd through CloudFront; 4000 tokens should finish in ~15-18s.
// Handout depth stays useful but slightly leaner (4 concepts instead of
// 5-6, tighter self-reflection block).
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4000;

const SYSTEM_PROMPT = `You are a licensed behavioral health clinician preparing a single group therapy session for adult residents in a Behavioral Health Residential Facility (BHRF). Residents commonly present with substance use disorders (alcohol, methamphetamine, cannabis) and co-occurring mental health conditions (MDD, GAD, PTSD, insomnia).

Your job is to draft ONE cohesive group therapy session that a BHT-level staff member can run with minimal prep. Use the "emit_session_material" tool to return your work.

Constraints:
- Trauma-informed and non-shaming language throughout.
- Skills-based, evidence-informed (CBT, DBT, motivational interviewing, ACT, mindfulness, 12-step-compatible where appropriate).
- Avoid content that could re-traumatize (no explicit descriptions of substance use, violence, or self-harm).
- Handout must be usable by residents with an 8th-grade reading level and possible cognitive symptoms of early recovery.
- The facilitator guide is a cheat sheet, keep it tight.
- The participant handout must be rich enough to carry a full 60-minute group. Include Why This Matters, 5-6 Key Concepts (each with a heading, 3-4 sentences, and a relatable example), 4-6 Self-Reflection prompts with write-in blanks, a Try This Week skill broken into 3-4 concrete steps, 3 Discussion Questions, and a Notes area.
- Do NOT invent specific YouTube URLs. Return exactly 3 short SEARCH QUERIES; a separate step resolves them to real videos.`;

// Tool definition passed to Anthropic — the model fills this schema and we
// receive a native object, so no JSON parsing on our side. Removes the entire
// class of "unescaped quote in a JSON string" failures we were hitting on
// production.
const EMIT_TOOL = {
  name: "emit_session_material",
  description: "Return the full group therapy session material as structured data.",
  input_schema: {
    type: "object" as const,
    properties: {
      topic: {
        type: "string",
        description: "Short punchy title, 3-8 words.",
      },
      topic_summary: {
        type: "string",
        description: "1-2 sentence description of what the session covers.",
      },
      facilitator_guide: {
        type: "string",
        description:
          "Markdown cheat sheet with sections: **Objectives** (2-3 bullets), **Opening (5 min)** (1-2 sentences), **Main Content (30 min)** (3-4 numbered steps, one-line talking points each), **Group Activity (15 min)** (brief), **Closing (10 min)** (brief), **Watch-outs** (2-3 bullets max).",
      },
      handout_markdown: {
        type: "string",
        description:
          "Markdown handout for participants, 2-3 pages when printed. Include all sections with real substance but keep prose tight: Title + one-line subtitle; Why This Matters (2 sentences); Key Concepts (4 concepts, each with a bold heading, 2-3 sentences of plain-language explanation, and one brief relatable example); Self-Reflection (3 open-ended prompts with write-in blanks); Try This Week (a specific skill broken into 3 concrete steps); Discussion Questions (3 questions to bring to sponsor, therapist, or next group); Notes (a labeled space with 3 lines).",
      },
      video_queries: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description:
          "Exactly 3 specific YouTube search phrases, each tight enough to surface a short (<15 min) clinically relevant video. Include duration hint when useful.",
      },
    },
    required: ["topic", "topic_summary", "facilitator_guide", "handout_markdown", "video_queries"],
  },
};

let anthropic: Anthropic | null = null;
function client(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: readAnthropicKey() });
  }
  return anthropic;
}

export interface GeneratedMaterial {
  topic: string;
  topicSummary: string;
  facilitatorGuide: string;
  handoutMarkdown: string;
  videos: Array<YouTubeSearchResult | { query: string; error: string }>;
}

/**
 * Generate a full group therapy material set. `themeSeed` is an optional
 * user-provided steer (e.g., "boundaries", "cravings", "gratitude").
 */
export async function generateGroupTherapyMaterial(
  themeSeed?: string | null
): Promise<GeneratedMaterial> {
  const userMsg =
    themeSeed && themeSeed.trim()
      ? `Design today's group therapy session with the theme: "${themeSeed.trim()}". Vary the specific skill focus — even within a theme, don't repeat prior sessions.`
      : "Design today's group therapy session. Pick a topic that's practical and immediately useful in early residential recovery. Vary from the most obvious choices.";

  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [EMIT_TOOL],
    tool_choice: { type: "tool", name: EMIT_TOOL.name },
    messages: [{ role: "user", content: userMsg }],
  });

  // With tool_choice forced, Claude MUST emit a tool_use block. Grab it and
  // treat its input as our structured payload — no JSON string parsing.
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === EMIT_TOOL.name
  );
  if (!toolUse) {
    throw new Error(
      "Claude did not emit the expected tool_use block (stop_reason: " +
        response.stop_reason + ")"
    );
  }
  const parsed = toolUse.input as {
    topic?: string;
    topic_summary?: string;
    facilitator_guide?: string;
    handout_markdown?: string;
    video_queries?: string[];
  };

  // Cap at 3 — each YouTube API call is a ~500ms roundtrip. 3 balances
  // usefulness with staying under the CloudFront ~30s timeout on Amplify.
  const queries = (parsed.video_queries || []).filter(q => typeof q === "string" && q.trim()).slice(0, 3);
  if (!parsed.topic || !parsed.facilitator_guide || !parsed.handout_markdown) {
    throw new Error("Claude output missing required fields (topic / facilitator_guide / handout_markdown)");
  }

  // Resolve every query to a real YouTube video (in parallel). Failed queries
  // come back as {query, error} so the UI can show what didn't resolve.
  const resolved = await youtubeSearchMany(queries);
  const videos: GeneratedMaterial["videos"] = queries.map((q, i) => {
    const hit = resolved[i];
    return hit ?? { query: q, error: "No matching video found" };
  });

  return {
    topic: parsed.topic.trim(),
    topicSummary: (parsed.topic_summary || "").trim(),
    facilitatorGuide: parsed.facilitator_guide.trim(),
    handoutMarkdown: parsed.handout_markdown.trim(),
    videos,
  };
}
