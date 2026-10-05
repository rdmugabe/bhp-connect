/**
 * Progress-note content generator.
 *
 * Produces one field-level content block per shift, drawn from a large
 * variant library and picked by a seeded PRNG. Same (resident, date,
 * shift) tuple → same output (stable across reruns), but across the
 * census and the calendar you get wide variety instead of the four-
 * variant rotation we were using before.
 *
 * Each field uses:
 *   1) A primary sentence picked from an N-sentence pool for the phase
 *   2) Occasionally (seeded probability), a short appended clause from
 *      a secondary pool for compositional variety
 *
 * Phases: "admit" (early stabilization), "midStay" (weeks 3-8),
 * "longStay" (two months plus).
 */

export type Phase = "admit" | "midStay" | "longStay";
export type Shift = "AM" | "PM";

export interface NoteContent {
  residentStatus: string;
  observedBehaviors: string;
  moodAffect: string;
  activityParticipation: string;
  staffInteractions: string;
  peerInteractions: string;
  medicationCompliance: string;
  hygieneAdl: string;
  mealsAppetite: string;
  sleepPattern: string;
  staffInterventions: string;
  residentResponse: string;
  notableEvents: string;
  additionalNotes: string;
}

// ---------------------------------------------------------------------------
// Deterministic PRNG
// ---------------------------------------------------------------------------

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRng(seedStr: string): () => number {
  let a = hash32(seedStr) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(list: T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)];
}

/** Append the extra clause with the given probability (0-1). */
function maybeAppend(base: string, extras: string[], rand: () => number, p = 0.5): string {
  if (rand() < p && extras.length > 0) return `${base} ${pick(extras, rand)}`;
  return base;
}

// ---------------------------------------------------------------------------
// Variant libraries
// ---------------------------------------------------------------------------

const RESIDENT_STATUS: Record<Phase, { base: string[]; extras: string[] }> = {
  admit: {
    base: [
      "Resident is still getting used to the program.",
      "Resident is settling into the daily routine.",
      "Resident knows the staff and schedule and worked with the team today.",
      "Resident is adjusting well and listens when staff give direction.",
      "Resident was calm and steady this shift.",
      "Resident is going through orientation and starting to join in with groups.",
      "Resident followed the daily schedule with a few reminders from staff.",
      "Resident seems comfortable at the facility. No signs of being upset.",
      "Resident is slowly settling in and learning how the program runs.",
      "Resident was present and alert, and is getting to know staff and peers.",
      "Resident is handling the transition into treatment without any problems.",
      "Resident stayed engaged with the intake and welcome process.",
    ],
    extras: [
      "Asked a few questions about the daily schedule.",
      "Thanked staff for helping her/him get settled.",
      "Needed a reminder or two about the schedule.",
      "Spent part of the shift hanging out in common areas.",
      "Said she/he feels safe here.",
      "Said she/he is ready to work on treatment.",
    ],
  },
  midStay: {
    base: [
      "Resident is doing well and taking part in programming.",
      "Resident followed the house schedule and joined in the day's activities.",
      "Resident is making steady progress on treatment goals.",
      "Resident worked well with staff and showed up to every group.",
      "Resident stuck to the routine throughout the shift.",
      "Resident joined groups on her/his own without needing reminders.",
      "Resident is doing well and using the coping skills she/he has learned.",
      "Resident was present and involved all shift.",
      "Resident is becoming more independent in the daily routine.",
      "Resident has been consistent with what the program expects.",
      "Resident is building recovery skills and taking part in group discussions.",
      "Resident is focused and working on recovery goals.",
    ],
    extras: [
      "Shared something personal in group about her/his triggers.",
      "Offered to help with chores around the house.",
      "Set a goal for the week with staff help.",
      "Talked about discharge planning with her/his case manager.",
      "Checked in with family during the scheduled call time.",
      "Reviewed her/his relapse prevention plan during one-on-one time.",
    ],
  },
  longStay: {
    base: [
      "Resident is doing well and is a steady part of the community.",
      "Resident is setting a good example for newer peers.",
      "Resident is consistent in treatment and focused on getting ready for discharge.",
      "Resident is making progress on long-term recovery goals.",
      "Resident is steady and follows the house routine on her/his own.",
      "Resident takes part in every part of the program.",
      "Resident spoke up during the community meeting and helped move things along.",
      "Resident informally supports newer residents.",
      "Resident is working at a high level of independence.",
      "Resident is actively planning next steps for after discharge.",
      "Resident has been steady in mood and reliable in behavior.",
      "Resident helped set a positive tone during community activities.",
    ],
    extras: [
      "Had a supportive talk with a newer resident today.",
      "Followed through on things she/he agreed to in group.",
      "Named a specific aftercare step during one-on-one time.",
      "Helped settle a small disagreement between peers.",
      "Took the lead on a chore without being asked.",
      "Reflected on how far she/he has come since starting treatment.",
    ],
  },
};

const MOOD_AFFECT: Record<Phase, { base: string[]; extras: string[] }> = {
  admit: {
    base: [
      "Mood seemed motivated but a little anxious. Expression matched how she/he was feeling.",
      "Mood was hopeful today.",
      "Mood was guarded but cooperative. Still engaged with staff when approached.",
      "Mood seemed anxious but manageable.",
      "Mood was calm with a normal range of emotions.",
      "Said she/he feels 'okay' today.",
      "Mood was a little low, but still responsive and willing to talk when approached.",
      "Mood was steady. Seemed a little brighter than at intake.",
      "Said she/he is 'ready to work' and seemed to mean it.",
      "Mood seemed mixed. Some moments of hope, some uncertainty.",
      "Mood was tired but hopeful.",
    ],
    extras: [
      "Smiled briefly while talking with staff.",
      "Got teary for a moment when family came up, but recovered quickly.",
      "Laughed at a joke in group.",
      "Said she/he is grateful for the chance to be in treatment.",
      "Said she/he hopes this treatment goes well.",
    ],
  },
  midStay: {
    base: [
      "Mood was steady and seemed like a normal range for her/him.",
      "Said her/his mood is 'good' today. Seemed bright.",
      "Mood was stable all shift.",
      "Mood was pleasant. Engaged with peers and staff.",
      "Mood seemed even throughout the shift.",
      "Mood was motivated. Warm and open with staff.",
      "Mood seemed a little lifted. Bright and talkative.",
      "Mood was calm and matched the day's conversations.",
      "Mood was steady all shift.",
      "Said her/his mood is 'focused' today.",
      "Mood was neutral to positive. Nothing unusual.",
    ],
    extras: [
      "Said she/he is proud of hitting a sobriety milestone.",
      "Had a good laugh with peers over dinner.",
      "Said she/he is grateful for a recent family call.",
      "Reflected on how far she/he has come during a brief check-in.",
      "Said she/he is feeling more hopeful about discharge.",
    ],
  },
  longStay: {
    base: [
      "Mood was steady and in a normal range.",
      "Mood has been consistently positive.",
      "Said she/he feels 'good' and 'at peace' today. Warm and engaged.",
      "Mood was stable with more confidence than before.",
      "Mood was pleasant. Engaging with peers and staff.",
      "Mood was steady. Calm and even.",
      "Mood was confident and forward-looking. Seemed bright.",
      "Said she/he feels grounded today.",
      "Mood was even all shift.",
      "Mood was engaged and purposeful.",
      "Mood was consistently stable.",
    ],
    extras: [
      "Shared a story about long-term goals with a peer.",
      "Smiled big during a positive call with family.",
      "Said she/he is still fully committed to the program.",
      "Was excited about a specific next step after discharge.",
      "Reflected on how much has changed since admission.",
    ],
  },
};

const PROGRAMMING: Record<Phase, { base: string[]; extras: string[] }> = {
  admit: {
    base: [
      "Went to morning meeting and skills group. Shared a little.",
      "Went to discussion group. Mostly listened and shared a short thought.",
      "Went to the group on relapse prevention. Followed along with the content.",
      "Went to group with a staff reminder. Took part when prompted.",
      "Went to two groups. Mostly listening, but spoke up a few times.",
      "Went to community meeting and skills group. Took part as much as she/he could.",
      "Went to orientation group and daily meeting. Cooperative throughout.",
      "Went to groups as scheduled. Engagement is building each shift.",
      "Went to group therapy. Needed a little help to stay focused but took part.",
      "Went to morning meeting and relapse-prevention group.",
      "Went to every scheduled group. Mostly watching peers at this point.",
    ],
    extras: [
      "Asked a question during the teaching part of group.",
      "Spoke up briefly when the facilitator asked.",
      "Looked focused and attentive during the activity.",
      "Took notes during group.",
      "Shared a quick personal connection to the topic.",
    ],
  },
  midStay: {
    base: [
      "Went to every scheduled group and community meeting. Took part in discussions.",
      "Went to group therapy and life-skills group. Engaged all shift.",
      "Went to discussion group and skills group. Active participation.",
      "Went to morning meeting, group therapy, and afternoon activity. Took part well.",
      "Went to teaching group and discussion group. Shared meaningful content.",
      "Went to community meeting and two group sessions. Shared on topic.",
      "Went to every scheduled group. Shared consistent reflections.",
      "Went to group therapy and was active in the discussion.",
      "Went to three groups. Shared helpful thoughts on cravings and coping.",
      "Went to morning meeting, group, and skills group. Engaged in each.",
      "Went to all programming today. Was a steady voice in community.",
    ],
    extras: [
      "Shared a personal strategy that helps her/him with triggers.",
      "Supported a peer who was having a hard time with the topic.",
      "Took the lead on a small group activity.",
      "Asked a thoughtful follow-up question.",
      "Shared her/his own experience during discussion group.",
    ],
  },
  longStay: {
    base: [
      "Went to every group and community meeting. Shared thoughtful comments.",
      "Went to group therapy and afternoon programming. Active in discussions.",
      "Went to every scheduled group. Setting a good example for newer residents.",
      "Went to morning meeting, group, and skills group. Shared helpful comments.",
      "Went to three group sessions. Helped lead discussion on aftercare planning.",
      "Went to community meeting and groups. Shared mentoring thoughts.",
      "Went to all programming. Engaged across every group.",
      "Went to group therapy and life-skills. Mentored a newer peer during activity.",
      "Went to programming consistently. Strong voice in the discussion.",
      "Went to every scheduled group. Helped the group stay connected and on topic.",
      "Went to morning meeting and groups. Shared recovery wisdom with the community.",
    ],
    extras: [
      "Helped lead a tough conversation with staff support.",
      "Shared a long-term recovery insight with the group.",
      "Supported two newer residents through a hard moment.",
      "Took the lead on a community-building activity.",
      "Reflected on how much she/he has grown since admission.",
    ],
  },
};

const STAFF_INTERACTION: string[] = [
  "Worked well with staff and listened when staff gave direction.",
  "Was respectful and easy to talk to all shift.",
  "Was respectful and open with the team on shift.",
  "Came to staff when she/he needed help.",
  "Followed staff direction without any problems.",
  "Talked with staff during one-on-one check-ins.",
  "Was clear with staff about what she/he needed.",
  "Did what staff asked throughout the shift.",
  "Took feedback from staff without pushback.",
  "Had a supportive conversation with staff.",
  "Followed through on what staff suggested.",
  "Spoke respectfully with staff all shift.",
];

const PEER_INTERACTION: string[] = [
  "Got along well with other residents and added to a good vibe in the house.",
  "Was warm with peers during shared activities.",
  "Was friendly with peers all shift.",
  "Shared the space respectfully with others.",
  "Was supportive of peers during group work.",
  "Checked on a peer who seemed down.",
  "Got along well with peers during meals and downtime.",
  "Chatted a bit with peers during community time.",
  "Worked well with peers on chores.",
  "Spoke respectfully with other residents.",
  "Helped a peer find materials for group.",
  "No conflicts with other residents observed.",
];

const MEDICATION: string[] = [
  "Took her/his medications on time. No refusals this shift.",
  "Took all scheduled medications as ordered.",
  "Took medications when offered. No concerns.",
  "Took her/his medications and said she/he knows what each one is for.",
  "Took medications as ordered without needing a reminder.",
  "No medication refusals this shift. Dose recorded on the MAR.",
  "Took medications on schedule without any issues.",
  "Took medications on time and knew when the next dose was due.",
  "Took medications. No side effects reported at this time.",
  "Medications given per the MAR. Resident was cooperative.",
];

const HYGIENE: string[] = [
  "Handled personal care on her/his own. Hygiene and grooming looked good.",
  "Took care of hygiene on her/his own. Appropriate for the setting.",
  "Showered, dressed, and groomed on her/his own today.",
  "Took care of daily living tasks on her/his own. Looked well put together.",
  "Handled self-care without help. Tidied the room without being asked.",
  "Handled hygiene on her/his own. Dressed appropriately for the shift.",
  "Kept up with hygiene throughout the day. Grooming looked good.",
  "Did all self-care tasks on her/his own today.",
  "Finished the hygiene routine without a reminder.",
  "Handled daily tasks independently. Kept the room tidy per house rules.",
];

const MEALS = {
  AM: [
    "Ate breakfast and lunch. Appetite was good.",
    "Ate all of breakfast. Lunch was good too.",
    "Had breakfast and lunch today. No concerns.",
    "Ate her/his meals. Said appetite feels normal.",
    "Had breakfast and lunch without any issues.",
    "Ate a good amount at both morning meals.",
    "Had breakfast and lunch on the regular schedule.",
    "Meals were adequate this shift. Didn't mention any issues.",
    "Had breakfast and lunch. Staff encouraged water throughout the day.",
    "Took part in both morning meals. Ate enough.",
  ],
  PM: [
    "Ate dinner and had the evening snack. Appetite was good.",
    "Ate all of dinner. Took the snack when offered.",
    "Had dinner and the evening snack. No concerns.",
    "Ate dinner. Said appetite feels normal.",
    "Had dinner and the snack without any issues.",
    "Ate a good amount at dinner.",
    "Had dinner on schedule. Took the snack too.",
    "Meals were adequate this shift. Didn't mention any issues.",
    "Had dinner. Staff encouraged water throughout the evening.",
    "Took part in the evening meal. Ate enough.",
  ],
} as const;

const SLEEP = {
  AM: [
    "Slept through the night per overnight staff. Woke up on time.",
    "Said she/he slept well. Woke up on schedule.",
    "Had a good night of sleep per overnight staff. Up and ready for the morning.",
    "Slept well. Woke up alert and ready to go.",
    "Said she/he got good rest. No overnight issues reported.",
    "Woke up on time and said she/he feels rested.",
    "Overnight sleep was fine. No interruptions reported.",
    "Slept well per overnight staff. Calm this morning.",
    "Woke up at the usual time. No sleep complaints.",
    "Had a quiet night. Up and alert.",
  ],
  PM: [
    "Followed the wind-down routine and went to bed on time.",
    "Followed the evening wind-down and went to bed on schedule.",
    "Got ready for bed per facility rules. Went to her/his room.",
    "Finished the evening routine and went to her/his room by lights-out.",
    "Did the evening wind-down and went to bed without issues.",
    "Followed the wind-down routine. Went to her/his room on time.",
    "Was calm in the evening. Went to bed on time.",
    "Finished the evening routine. Went to her/his room on schedule.",
    "Followed the wind-down routine. No issues at bedtime.",
    "Went to her/his room at the scheduled time. Evening routine done.",
  ],
} as const;

const INTERVENTIONS: Record<Phase, string[]> = {
  admit: [
    "Orientation to the program. Built rapport. Reviewed house rules and pass procedures. Coached on coping skills. Watched for signs of withdrawal.",
    "Program orientation. One-on-one check-ins. Reviewed house expectations. Reinforced coping skills. Continued to watch for withdrawal signs.",
    "Built rapport. Walked through the daily schedule. Coached on coping skills. Had one-on-one time. Watched for new symptoms.",
    "Supportive engagement. Program orientation. Introduced coping skills. Assessed early recovery needs. Monitored throughout.",
    "Program orientation. One-on-one talk. Coping skills coaching. Motivational conversation. Watched for withdrawal signs.",
    "Built rapport. Reviewed what the facility expects. One-on-one time. Coped-skills coaching. Monitoring and reassurance.",
  ],
  midStay: [
    "Facilitated group. One-on-one check-ins. Reinforced relapse prevention. Coached on coping skills. Took part in community meeting.",
    "Supported group participation. One-on-one time. Reviewed coping skills. Reinforced relapse prevention. Redirected when needed.",
    "One-on-one talk. Facilitated group. Coping skills coaching. Took part in community meeting. Talked about aftercare.",
    "Facilitated group. One-on-one check-ins. Talked about discharge planning. Reinforced relapse prevention.",
    "Supportive engagement. Facilitated group. One-on-one time. Coping skills coaching. Community engagement.",
    "Group participation. One-on-one time. Talked about aftercare and discharge planning. Reinforced coping skills.",
  ],
  longStay: [
    "Facilitated group. One-on-one talk. Reinforced relapse prevention. Supported aftercare planning. Helped lead community meeting.",
    "Mentoring support. Facilitated group. One-on-one time. Talked about aftercare. Took part in community meeting.",
    "Talked about discharge planning. Facilitated group. One-on-one check-ins. Continued to reinforce relapse prevention.",
    "Worked on aftercare planning. Facilitated group. One-on-one talk. Mentored newer peers.",
    "Facilitated group. One-on-one time. Coordinated discharge planning. Reinforced relapse prevention. Supported community meeting.",
    "Mentoring support. Facilitated group. One-on-one time. Discharge planning. Reinforced peer support.",
  ],
};

const RESPONSE: string[] = [
  "Responded well to what staff did today. No problems.",
  "Was positive and engaged with staff throughout.",
  "Was open to staff support all shift.",
  "Took staff encouragement well.",
  "Took in what staff offered. No concerns.",
  "Was engaged in the one-on-one talk with staff.",
  "Was open to feedback and reminders.",
  "Took an active part in what staff offered.",
  "Was cooperative with everything staff worked on today.",
  "Was open and engaged across the shift.",
];

const BEHAVIOR = (shift: Shift): string[] => {
  const shiftBlock =
    shift === "AM"
      ? "AM shift (06:00-18:00): morning routine, breakfast, medications, morning meeting, and morning programming."
      : "PM shift (18:00-06:00): dinner, evening programming, medications, evening wind-down, and overnight monitoring.";
  return [
    `${shiftBlock} No safety concerns this shift.`,
    `${shiftBlock} Behavior was appropriate all shift.`,
    `${shiftBlock} No behavior concerns.`,
    `${shiftBlock} Behavior was in line with what the program expects.`,
    `${shiftBlock} Nothing unusual observed.`,
    `${shiftBlock} Behavior was steady. No incidents.`,
  ];
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BuildArgs {
  phase: Phase;
  shift: Shift;
  seed: string; // typically `${residentName}|${ymd}|${shift}`
  /** When false (default), the medicationCompliance field is left empty so
   *  no "compliant with prescribed medications" line prints on notes for
   *  residents with no active meds on file. */
  hasActiveMeds?: boolean;
}

export function buildVariedContent(args: BuildArgs): NoteContent {
  const rand = seededRng(args.seed);

  const statusPool = RESIDENT_STATUS[args.phase];
  const moodPool = MOOD_AFFECT[args.phase];
  const progPool = PROGRAMMING[args.phase];

  const residentStatus = maybeAppend(pick(statusPool.base, rand), statusPool.extras, rand, 0.55);
  const moodAffect = maybeAppend(pick(moodPool.base, rand), moodPool.extras, rand, 0.35);
  const activityParticipation = maybeAppend(pick(progPool.base, rand), progPool.extras, rand, 0.35);

  return {
    residentStatus,
    observedBehaviors: pick(BEHAVIOR(args.shift), rand),
    moodAffect,
    activityParticipation,
    staffInteractions: pick(STAFF_INTERACTION, rand),
    peerInteractions: pick(PEER_INTERACTION, rand),
    medicationCompliance: args.hasActiveMeds ? pick(MEDICATION, rand) : "",
    hygieneAdl: pick(HYGIENE, rand),
    mealsAppetite: pick(MEALS[args.shift] as unknown as string[], rand),
    sleepPattern: pick(SLEEP[args.shift] as unknown as string[], rand),
    staffInterventions: pick(INTERVENTIONS[args.phase], rand),
    residentResponse: pick(RESPONSE, rand),
    notableEvents: "None.",
    additionalNotes: "",
  };
}
