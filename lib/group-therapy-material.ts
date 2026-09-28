/**
 * Group Therapy Material generation.
 *
 * Splits the work into TWO parallel Claude tool-use calls so we fit under
 * Amplify SSR's hard 28s CloudFront/Lambda ceiling:
 *
 *   Call A (meta):    topic + summary + facilitator guide + video queries (fast, ~10-12s)
 *   Call B (handout): the participant handout only                        (slower, ~15-18s)
 *
 * Both start at the same time via Promise.all; wall-clock ≈ max(A, B).
 * YouTube search then runs on the queries from call A. Result is assembled
 * and returned as a single GeneratedMaterial object.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { youtubeSearchMany, type YouTubeSearchResult } from "./youtube-search";

/**
 * Read the ANTHROPIC_API_KEY from the project's .env file directly, bypassing
 * process.env. Some shells export a stale ANTHROPIC_API_KEY that Next.js
 * gives priority over `.env`; reading the file ensures we always use the
 * value the developer just saved.
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

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS_INTRO = 800;   // topic + summary + 3 video queries only
const MAX_TOKENS_GUIDE = 2000;  // facilitator guide with answer keys — runs in parallel with handout
const MAX_TOKENS_HANDOUT = 2600; // handout with topic summary + questionnaire

const SHARED_CONSTRAINTS = `You are a licensed behavioral health clinician preparing a single group therapy session for adult residents in a Behavioral Health Residential Facility (BHRF). Residents commonly present with substance use disorders (alcohol, methamphetamine, cannabis) and co-occurring mental health conditions (MDD, GAD, PTSD, insomnia).

Constraints:
- Trauma-informed and non-shaming language throughout.
- Skills-based, evidence-informed (CBT, DBT, motivational interviewing, ACT, mindfulness, 12-step-compatible where appropriate).
- Avoid content that could re-traumatize (no explicit descriptions of substance use, violence, or self-harm).
- 8th-grade reading level.`;

// The material centers around ONE long-form educational video (a lecture,
// class, or informational talk) that the group watches together. The handout
// summarizes what the video covers and gives residents a questionnaire to
// fill in as they watch. The facilitator guide gives the instructor the
// answer key and expected discussion insights so they can guide reflection.
// The material centers around ONE long-form educational video (a lecture,
// class, or informational talk) that the group watches together. We split
// generation into three Claude calls so they can run mostly in parallel:
//   1. INTRO — pick the topic + summary + video queries (fast, <3s)
//   2. GUIDE — full instructor guide with answer keys (runs after 1)
//   3. HANDOUT — participant handout (runs in parallel with GUIDE)
// YouTube search fires as soon as INTRO returns.

const INTRO_SYSTEM = SHARED_CONSTRAINTS + `\n\nYour job: pick ONE cohesive session topic centered on a full-length educational video (a lecture, class, or informational talk, 20-60 minutes) and return topic + summary + 3 YouTube search queries via the "emit_session_intro" tool.`;

const GUIDE_SYSTEM = SHARED_CONSTRAINTS + `\n\nYour job: write the instructor guide for a group therapy session anchored to an educational video the group will watch together. Include objectives, session flow, an answer key aligned to a 6-question participant questionnaire, and watch-outs. Return via the "emit_facilitator_guide" tool.`;

const HANDOUT_SYSTEM = SHARED_CONSTRAINTS + `\n\nYour job: write a participant handout organized around a full-length educational video the group will watch together. Include a summary of what the video covers and an interactive questionnaire residents fill in as they watch or in discussion afterward. Return via the "emit_handout" tool.`;

const INTRO_TOOL = {
  name: "emit_session_intro",
  description: "Return the session topic, summary, and 3 YouTube search queries.",
  input_schema: {
    type: "object" as const,
    properties: {
      topic: { type: "string", description: "Short punchy title, 3-8 words." },
      topic_summary: { type: "string", description: "2-3 sentence description of what the session covers, oriented to the video's subject." },
      video_queries: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description:
          "Exactly 3 specific YouTube search phrases that will surface long-form educational content (lectures, TED talks, university classes, licensed clinician explainers, expert-led webinars). Prefer 20-60 minute videos. Add words like 'lecture', 'full class', 'explained', 'webinar', 'masterclass', 'psychology of', 'documentary' where appropriate. Avoid words like 'short', 'quick', 'in 60 seconds'.",
      },
    },
    required: ["topic", "topic_summary", "video_queries"],
  },
};

const GUIDE_TOOL = {
  name: "emit_facilitator_guide",
  description: "Return the instructor guide markdown.",
  input_schema: {
    type: "object" as const,
    properties: {
      facilitator_guide: {
        type: "string",
        description:
          "Concise markdown instructor guide with these sections:\n" +
          "**Objectives** — 2 short bullets.\n" +
          "**Session Flow (60 min)** — 4 bullets: intro (5min), video (~30min), questionnaire (20min), closing (5min).\n" +
          "**Answer Key & Discussion Insights** — 5 numbered items aligned to the participant questionnaire. For each: (a) expected answer in 1-2 sentences at 8th-grade level; (b) 1 short discussion prompt or insight.\n" +
          "**Watch-outs** — 2 bullets.",
      },
    },
    required: ["facilitator_guide"],
  },
};

const HANDOUT_TOOL = {
  name: "emit_handout",
  description: "Return the participant handout as markdown, structured around the session's educational video.",
  input_schema: {
    type: "object" as const,
    properties: {
      handout_markdown: {
        type: "string",
        description:
          "Concise markdown handout (2 pages printed) about the session TOPIC (not any specific video). Sections:\n\n" +
          "1. **Title + one-line subtitle**.\n\n" +
          "2. **About This Topic** — 2-3 sentences on the topic and why it matters for recovery. Then 3 short 'Key ideas to look for' bullets.\n\n" +
          "3. **Interactive Questionnaire** — 5 numbered topic-first questions with 3 blank underscored lines after each. Do NOT use phrases like 'what did the speaker say', 'the video mentions', 'according to the speaker'. Use phrasing like 'What is X?', 'Why does X happen?', 'How does X work?', 'How could you use X today?'. Mix concept, application, and one reflection question.\n\n" +
          "4. **Notes** — 4 blank lines.\n\n" +
          "Use plain 8th-grade reading level. Non-shaming, trauma-informed. No em-dashes. Keep it tight.",
      },
    },
    required: ["handout_markdown"],
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

interface IntroResult {
  topic: string;
  topic_summary: string;
  video_queries: string[];
}

// Wide catalog of clinical domains. When the user doesn't provide a theme
// seed we pick one of these at random per generation so the pipeline stops
// converging on the same handful of topics (previously Claude kept landing
// on sleep/stress even when told to vary). Claude picks the concrete
// skill/topic within the chosen domain.
const TOPIC_DOMAINS: string[] = [
  "handling cravings and urge surfing",
  "the neuroscience of addiction and how the brain heals",
  "boundaries with family and loved ones",
  "grief and loss in recovery",
  "anger management and healthy expression",
  "trauma-informed self-care",
  "shame, guilt, and self-compassion",
  "building a sober support network",
  "assertive communication",
  "healthy relationships in recovery",
  "parenting while in recovery",
  "financial stability and money management",
  "employment and job readiness",
  "the stress response and the nervous system",
  "sleep hygiene in early recovery",
  "nutrition, blood sugar, and mood",
  "exercise, movement, and mental health",
  "mindfulness and present-moment awareness",
  "cognitive distortions and thought reframing (CBT basics)",
  "distress tolerance skills",
  "emotional regulation (DBT skills)",
  "acceptance and commitment therapy (ACT) essentials",
  "12-step principles and mutual-help communities",
  "relapse-prevention planning and identifying high-risk situations",
  "co-occurring depression in recovery",
  "co-occurring anxiety and worry",
  "PTSD and complex trauma in recovery",
  "spiritual wellness and cultural identity",
  "healthy sexuality and intimacy",
  "forgiveness and making amends",
  "gratitude practice and positive psychology",
  "purpose, meaning, and values-based living",
  "goal setting and habit formation",
  "self-esteem and identity beyond substance use",
  "conflict resolution and repair",
  "returning to work: managing workplace stress",
  "healthy leisure, hobbies, and finding joy sober",
  "understanding co-dependency",
  "handling loneliness in recovery",
  "medication for addiction treatment (MAT) education",
];

function pickRandomDomain(): string {
  return TOPIC_DOMAINS[Math.floor(Math.random() * TOPIC_DOMAINS.length)];
}

async function generateIntro(themeSeed: string | null): Promise<IntroResult> {
  let userMsg: string;
  if (themeSeed && themeSeed.trim()) {
    userMsg = `Design today's group therapy session with the theme: "${themeSeed.trim()}". Pick a specific practical skill or concept within that theme. Vary from the most obvious sub-angles; don't repeat prior sessions.`;
  } else {
    const domain = pickRandomDomain();
    userMsg = `Design today's group therapy session. Focus on this clinical domain: **${domain}**. Pick ONE specific practical skill or concept within that domain (not the domain title itself). Avoid sleep-hygiene, stress-response, and craving-management topics unless the assigned domain is one of those. Make the topic concrete and immediately useful in early residential recovery.`;
  }

  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS_INTRO,
    system: INTRO_SYSTEM,
    tools: [INTRO_TOOL],
    tool_choice: { type: "tool", name: INTRO_TOOL.name },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === INTRO_TOOL.name
  );
  if (!toolUse) {
    throw new Error(`Intro call: no tool_use block (stop_reason: ${response.stop_reason})`);
  }
  const p = toolUse.input as Partial<IntroResult>;
  if (!p.topic || !p.video_queries) {
    throw new Error("Intro call output missing required fields");
  }
  return {
    topic: p.topic,
    topic_summary: p.topic_summary || "",
    video_queries: p.video_queries,
  };
}

async function generateFacilitatorGuide(
  topic: string,
  topicSummary: string
): Promise<string> {
  const userMsg = `Write the instructor guide for today's group therapy session.\n\nSession topic (already chosen — do NOT pick a different topic): "${topic}".\n\nOne-line session summary: ${topicSummary}\n\nAlign the Answer Key items to a 6-question participant questionnaire that covers this topic's core ideas, practical application, and comparison to prior beliefs. Emit via the emit_facilitator_guide tool.`;

  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS_GUIDE,
    system: GUIDE_SYSTEM,
    tools: [GUIDE_TOOL],
    tool_choice: { type: "tool", name: GUIDE_TOOL.name },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === GUIDE_TOOL.name
  );
  if (!toolUse) {
    throw new Error(`Guide call: no tool_use block (stop_reason: ${response.stop_reason})`);
  }
  const p = toolUse.input as { facilitator_guide?: string };
  if (!p.facilitator_guide) {
    throw new Error("Guide call output missing facilitator_guide");
  }
  return p.facilitator_guide;
}

async function generateHandout(
  themeSeed: string | null,
  fixedTopic: { topic: string; topic_summary: string } | null = null
): Promise<string> {
  // When the meta call has already resolved a specific topic, pass it into
  // the handout so both artifacts describe the same session. Otherwise fall
  // back to the theme seed and let the handout pick its own concrete skill.
  const userMsg = fixedTopic
    ? `Write a participant handout for today's group therapy session.\n\nSession topic (already chosen by the meta step — do NOT pick a different topic): "${fixedTopic.topic}".\n\nOne-line session summary: ${fixedTopic.topic_summary}\n\nWrite the handout so the "About Today's Video" section previews content on THIS exact topic and the 6 interactive questionnaire questions ask about THIS topic's content.`
    : themeSeed && themeSeed.trim()
      ? `Write a participant handout for today's group therapy session on the theme: "${themeSeed.trim()}". Choose a specific practical skill within that theme.`
      : "Write a participant handout for today's group therapy session. Pick a topic that's practical and immediately useful in early residential recovery.";

  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS_HANDOUT,
    system: HANDOUT_SYSTEM,
    tools: [HANDOUT_TOOL],
    tool_choice: { type: "tool", name: HANDOUT_TOOL.name },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === HANDOUT_TOOL.name
  );
  if (!toolUse) {
    throw new Error(`Handout call: no tool_use block (stop_reason: ${response.stop_reason})`);
  }
  const p = toolUse.input as { handout_markdown?: string };
  if (!p.handout_markdown) {
    throw new Error("Handout call output missing handout_markdown");
  }
  return p.handout_markdown;
}

/**
 * Generate a full group therapy material set. `themeSeed` is an optional
 * user-provided steer (e.g., "boundaries", "cravings", "gratitude").
 *
 * Sequence: pick the topic first (fast intro call), then fan out the
 * heavier guide + handout Claude calls and the YouTube search in parallel
 * so they all share the same fixed topic. Wall-clock is roughly
 * intro + max(guide, handout, videos), which stays well under Amplify's
 * 28-second SSR cap.
 */
export async function generateGroupTherapyMaterial(
  themeSeed?: string | null
): Promise<GeneratedMaterial> {
  const seed = themeSeed ?? null;

  // 1. Pick the topic + summary + video queries.
  const intro = await generateIntro(seed);

  // 2. Fan out: guide, handout, and video search all share the fixed topic.
  const queries = intro.video_queries.filter(q => typeof q === "string" && q.trim()).slice(0, 3);
  const [guide, handoutMd, resolved] = await Promise.all([
    generateFacilitatorGuide(intro.topic, intro.topic_summary),
    generateHandout(seed, { topic: intro.topic, topic_summary: intro.topic_summary }),
    youtubeSearchMany(queries),
  ]);

  const videos: GeneratedMaterial["videos"] = queries.map((q, i) => {
    const hit = resolved[i];
    return hit ?? { query: q, error: "No matching video found" };
  });

  return {
    topic: intro.topic.trim(),
    topicSummary: intro.topic_summary.trim(),
    facilitatorGuide: guide.trim(),
    handoutMarkdown: handoutMd.trim(),
    videos,
  };
}
