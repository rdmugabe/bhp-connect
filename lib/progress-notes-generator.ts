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
      "Resident continuing early adjustment to the residential setting.",
      "Resident settling into daily routine and program expectations.",
      "Resident oriented to unit, staff, and daily schedule; cooperative with intake procedures.",
      "Resident acclimating well to residential structure; following redirection when offered.",
      "Resident stable in early stabilization phase.",
      "Resident participating in orientation and starting to engage with programming.",
      "Resident following house routine with occasional staff cueing.",
      "Resident appears comfortable in the environment; no acute distress noted.",
      "Resident gradually settling in and learning the program's rhythms.",
      "Resident present and oriented; getting familiar with staff and peers.",
      "Resident continues to adjust to residential level of care without acute concerns.",
      "Resident maintaining engagement with the admission process.",
    ],
    extras: [
      "Asked clarifying questions about the daily schedule.",
      "Expressed appreciation for staff support.",
      "Required occasional orientation reminders.",
      "Spent part of the shift in common areas.",
      "Reported feeling safe at the facility.",
      "Verbalized readiness to engage with treatment.",
    ],
  },
  midStay: {
    base: [
      "Resident stable and engaged with treatment programming.",
      "Resident following house schedule and participating in daily activities.",
      "Resident continuing steady progress toward identified treatment goals.",
      "Resident cooperative with staff and consistent in program attendance.",
      "Resident maintaining structure and routine throughout the shift.",
      "Resident actively participating in programming without reminders.",
      "Resident stable; using coping skills learned in group.",
      "Resident present and engaged across the shift.",
      "Resident demonstrating increased independence in daily routine.",
      "Resident consistent with program expectations.",
      "Resident continuing to build recovery skills; participating actively in group work.",
      "Resident stable and focused on recovery-related objectives.",
    ],
    extras: [
      "Shared insight in group about personal triggers.",
      "Volunteered to help with household tasks.",
      "Set a goal for the week with staff support.",
      "Discussed discharge planning with assigned case manager.",
      "Checked in with family during approved call window.",
      "Reviewed relapse-prevention concepts during individual time.",
    ],
  },
  longStay: {
    base: [
      "Resident stable and well-integrated in program.",
      "Resident modeling positive engagement for newer peers.",
      "Resident consistently engaged with treatment; focused on discharge readiness.",
      "Resident continuing progress on long-term recovery goals.",
      "Resident stable, cooperative, and following house routine independently.",
      "Resident maintaining strong participation across all program elements.",
      "Resident demonstrating leadership during community meeting.",
      "Resident mentoring newer residents informally throughout the shift.",
      "Resident functioning at a high level of independence.",
      "Resident actively planning transition and aftercare steps.",
      "Resident continuing to show stable mood and consistent program behavior.",
      "Resident set a positive tone during community activities.",
    ],
    extras: [
      "Participated in a peer-support conversation with a newer resident.",
      "Followed through on prior commitments made in group.",
      "Shared a specific aftercare step during individual time.",
      "Helped a peer de-escalate during a brief disagreement.",
      "Took initiative on a household responsibility.",
      "Reflected on long-term recovery goals during the shift.",
    ],
  },
};

const MOOD_AFFECT: Record<Phase, { base: string[]; extras: string[] }> = {
  admit: {
    base: [
      "Mood reported as motivated but with mild anxiety; affect congruent.",
      "Mood described as hopeful; affect appropriate to context.",
      "Mood guarded but cooperative; affect reactive and within normal range.",
      "Mood anxious but tolerable; affect appropriate.",
      "Mood described as calm; affect full range.",
      "Mood described as 'okay'; affect appropriate.",
      "Mood slightly subdued; affect constricted but engaging with staff when approached.",
      "Mood steady; affect bright compared with intake.",
      "Mood described as 'ready to work'; affect appropriate.",
      "Mood ambivalent; affect reactive and appropriate.",
      "Mood described as tired but hopeful; affect appropriate.",
    ],
    extras: [
      "Smiled during a brief exchange with staff.",
      "Became teary when discussing family but recovered quickly.",
      "Laughed at a group member's joke.",
      "Verbalized gratitude for the opportunity to be in treatment.",
      "Noted hope that treatment will go well this time.",
    ],
  },
  midStay: {
    base: [
      "Mood euthymic; affect full range and congruent.",
      "Mood described as 'good'; affect bright.",
      "Mood stable; affect appropriate to interactions.",
      "Mood pleasant; affect engaging with peers and staff.",
      "Mood steady throughout the shift; affect appropriate.",
      "Mood described as motivated; affect reactive and warm.",
      "Mood slightly elevated in a positive direction; affect bright.",
      "Mood calm; affect appropriate to content of interactions.",
      "Mood even throughout the shift; affect appropriate.",
      "Mood described as 'focused'; affect reactive.",
      "Mood neutral to positive; affect congruent with content.",
    ],
    extras: [
      "Expressed pride in abstinence milestone.",
      "Shared a laugh with peers over dinner.",
      "Noted gratitude for a recent family contact.",
      "Reflected on progress during a brief check-in.",
      "Mentioned feeling more hopeful about discharge.",
    ],
  },
  longStay: {
    base: [
      "Mood euthymic and stable; affect full range.",
      "Mood consistently positive; affect bright.",
      "Mood described as 'good' and 'at peace'; affect reactive and warm.",
      "Mood stable with increased confidence; affect appropriate.",
      "Mood pleasant; affect engaging with peers and staff.",
      "Mood steady; affect calm and appropriate.",
      "Mood confident and future-oriented; affect bright.",
      "Mood described as grounded; affect reactive.",
      "Mood even throughout the shift; affect appropriate to context.",
      "Mood engaged and purposeful; affect bright.",
      "Mood consistently stable across the shift; affect appropriate.",
    ],
    extras: [
      "Shared a story about long-term recovery goals with a peer.",
      "Smiled broadly during a positive update from family.",
      "Noted ongoing commitment to the program.",
      "Expressed excitement about a specific aftercare step.",
      "Reflected on how far she/he has come since admission.",
    ],
  },
};

const PROGRAMMING: Record<Phase, { base: string[]; extras: string[] }> = {
  admit: {
    base: [
      "Attended morning meeting and skills group; contributed briefly.",
      "Attended process group; listened and offered short reflections.",
      "Attended psychoeducation on relapse prevention; engaged with content.",
      "Attended group programming; participated with staff prompting.",
      "Attended two groups; mostly listening with brief verbal contributions.",
      "Attended community meeting and skills session; participated as able.",
      "Attended orientation group and daily meeting; cooperative throughout.",
      "Attended scheduled programming; engagement building across the shift.",
      "Attended group therapy; needed occasional refocusing but engaged with topic.",
      "Attended morning meeting and relapse-prevention group.",
      "Attended all scheduled groups; mostly observing peers at this stage.",
    ],
    extras: [
      "Asked a clarifying question during psychoeducation.",
      "Volunteered a brief answer to the facilitator.",
      "Appeared attentive throughout the activity.",
      "Took notes during group content.",
      "Shared a brief personal connection to the topic.",
    ],
  },
  midStay: {
    base: [
      "Attended all scheduled groups and community meeting; contributed to discussions.",
      "Attended group therapy and life-skills programming; engaged throughout.",
      "Attended process group and skills session; active participation.",
      "Attended morning meeting, group therapy, and afternoon activity; contributed appropriately.",
      "Attended psychoeducation and process group; participated meaningfully.",
      "Attended community meeting and two group sessions; shared relevant content.",
      "Attended all scheduled programming; contributed consistent reflections.",
      "Attended group therapy with active engagement in discussion.",
      "Attended three groups; contributed insight on cravings and coping.",
      "Attended morning meeting, group, and skills programming; engaged across all.",
      "Attended programming consistently; active voice in community.",
    ],
    extras: [
      "Shared a personal strategy that helps with triggers.",
      "Supported a peer who was struggling with the topic.",
      "Took the lead on a small group activity.",
      "Asked a thoughtful follow-up question.",
      "Volunteered personal reflection during process group.",
    ],
  },
  longStay: {
    base: [
      "Attended all scheduled groups and community meeting; contributed thoughtfully.",
      "Attended group therapy and afternoon programming; active in discussions.",
      "Attended all scheduled programming; modeling engagement for newer residents.",
      "Attended morning meeting, group, and skills programming; contributed positively.",
      "Attended three group sessions; led discussion on aftercare planning.",
      "Attended community meeting and groups; shared mentoring insight.",
      "Attended all programming; demonstrated consistent engagement across groups.",
      "Attended group therapy and life-skills; mentored a newer peer during activity.",
      "Attended programming consistently; strong voice in discussion.",
      "Attended all scheduled sessions; actively supported group cohesion.",
      "Attended morning meeting and groups; shared recovery wisdom with the community.",
    ],
    extras: [
      "Facilitated discussion on a difficult topic with staff support.",
      "Shared a long-term recovery insight with the group.",
      "Supported two newer residents through a hard moment.",
      "Took the lead on a community-building activity.",
      "Reflected on growth since admission.",
    ],
  },
};

const STAFF_INTERACTION: string[] = [
  "Cooperative with staff; followed redirection when offered.",
  "Interacted appropriately with staff throughout the shift.",
  "Respectful and communicative with the on-duty team.",
  "Approached staff for support when needed.",
  "Followed staff direction without issue.",
  "Engaged with staff during individual check-ins.",
  "Communicated clearly with staff about needs.",
  "Cooperative with all staff requests this shift.",
  "Received staff feedback openly.",
  "Engaged in a supportive conversation with staff.",
  "Followed through on staff recommendations.",
  "Communicated respectfully across the shift.",
];

const PEER_INTERACTION: string[] = [
  "Appropriate interactions with peers; contributing to positive milieu.",
  "Interacted warmly with peers during shared activities.",
  "Pro-social behavior with peers throughout the shift.",
  "Shared space respectfully with peers.",
  "Supportive of peers during group work.",
  "Checked in with a peer who seemed down.",
  "Positive peer engagement during meals and downtime.",
  "Chatted briefly with peers during community time.",
  "Collaborative with peers during household tasks.",
  "Modeled respectful communication with peers.",
  "Helped a peer locate materials for group.",
  "No peer conflicts observed.",
];

const MEDICATION: string[] = [
  "Compliant with prescribed medications; no refusals this shift.",
  "Took all scheduled medications as ordered.",
  "Medication compliance observed; no concerns.",
  "Compliant with scheduled medications; verbalized understanding of purpose.",
  "Took medications as ordered without prompting.",
  "No medication refusals this shift; staff documented administration per MAR.",
  "Followed medication administration protocol without issue.",
  "Compliant with medication schedule and verbalized next dose timing.",
  "Took medications; no reported side effects at this time.",
  "Medication administered per MAR; resident cooperative throughout.",
];

const HYGIENE: string[] = [
  "Independent with ADLs; appropriate hygiene and grooming.",
  "Hygiene maintained independently; appropriate dress for setting.",
  "Independent with bathing, dressing, and grooming today.",
  "ADLs completed independently; appearance well-maintained.",
  "Independent with self-care; room tidied without staff prompt.",
  "Independent with hygiene; appropriate attire for the shift.",
  "ADLs maintained consistently; grooming appropriate.",
  "Independent in all areas of self-care today.",
  "Completed hygiene routine without prompting; appropriate presentation.",
  "ADLs independent; room kept tidy per facility expectations.",
];

const MEALS = {
  AM: [
    "Ate breakfast and lunch; adequate appetite.",
    "Breakfast consumed in full; lunch adequate.",
    "Appropriate meals at breakfast and lunch; no concerns.",
    "Ate scheduled meals; reports no appetite changes.",
    "Breakfast and lunch consumed without issue.",
    "Adequate intake across morning meals.",
    "Ate breakfast and lunch per facility schedule.",
    "Meals adequate this shift; verbalized no complaints.",
    "Breakfast and lunch consumed; hydration encouraged throughout.",
    "Participated in both morning meals with adequate intake.",
  ],
  PM: [
    "Ate dinner and evening snack; adequate appetite.",
    "Dinner consumed in full; snack taken as offered.",
    "Appropriate meals at dinner; evening snack consumed.",
    "Ate scheduled meals; reports no appetite changes.",
    "Dinner and snack consumed without issue.",
    "Adequate intake across evening meals.",
    "Ate dinner per facility schedule; snack taken.",
    "Meals adequate this shift; verbalized no complaints.",
    "Dinner consumed; hydration encouraged throughout the evening.",
    "Participated in evening meal with adequate intake.",
  ],
} as const;

const SLEEP = {
  AM: [
    "Slept through the night per overnight report; awoke on schedule.",
    "Reports adequate rest overnight; awoke at scheduled time.",
    "Appropriate sleep per overnight staff; up and ready for morning programming.",
    "Overnight sleep adequate; awoke oriented and alert.",
    "Reports restful sleep; no reported overnight concerns.",
    "Awoke at scheduled time; reports feeling rested.",
    "Overnight rest adequate; no interruptions reported.",
    "Slept well per overnight team; morning presentation calm.",
    "Awoke at usual time; no sleep complaints.",
    "Overnight rest without issue; up and oriented.",
  ],
  PM: [
    "Wind-down routine followed; retired to room at scheduled time.",
    "Followed evening wind-down protocol; retired on schedule.",
    "Prepared for sleep per facility expectations; retired to room.",
    "Evening routine completed; retired to room by lights-out.",
    "Participated in evening wind-down; retired without issue.",
    "Followed wind-down routine; retired to room on schedule.",
    "Evening presentation calm; retired on time.",
    "Completed evening routine; retired to room per schedule.",
    "Wind-down protocol followed; no concerns at bedtime.",
    "Retired to room at scheduled hour; evening routine completed.",
  ],
} as const;

const INTERVENTIONS: Record<Phase, string[]> = {
  admit: [
    "Orientation to program, therapeutic rapport building, motivational interviewing, review of pass/communication procedures, coping-skills coaching, monitoring for withdrawal symptoms.",
    "Program orientation, individual check-ins, motivational interviewing, review of house expectations, coping skills reinforcement, continued withdrawal monitoring.",
    "Therapeutic rapport, orientation to daily schedule, coping-skills education, individual time, monitoring for emergent symptoms.",
    "Supportive engagement, orientation to program, coping-skill introduction, assessment of early-recovery needs, monitoring.",
    "Program orientation, individual therapeutic conversation, coping skills coaching, motivational interviewing, monitoring for withdrawal.",
    "Rapport building, review of facility expectations, individual time, coping-skills coaching, monitoring and reassurance.",
  ],
  midStay: [
    "Group facilitation, individual check-ins, relapse-prevention reinforcement, coping-skills coaching, community meeting participation.",
    "Group participation support, individual time, coping skills review, relapse-prevention reinforcement, redirection as needed.",
    "Individual therapeutic conversation, group facilitation, coping-skills coaching, community meeting participation, aftercare conversation.",
    "Group facilitation, individual check-ins, discharge-planning conversation, relapse-prevention reinforcement.",
    "Supportive engagement, group facilitation, individual time, coping skills coaching, community engagement.",
    "Group participation, individual time, aftercare and discharge-planning conversation, coping skills reinforcement.",
  ],
  longStay: [
    "Group facilitation, individual therapeutic conversation, relapse-prevention reinforcement, aftercare planning support, community meeting facilitation.",
    "Mentoring support, group facilitation, individual time, aftercare conversation, community meeting participation.",
    "Discharge-planning conversation, group facilitation, individual check-ins, continued relapse-prevention reinforcement.",
    "Aftercare planning, group facilitation, individual therapeutic conversation, mentoring newer peers.",
    "Group facilitation, individual time, discharge coordination, relapse-prevention reinforcement, community meeting support.",
    "Mentoring support, group facilitation, individual time, discharge planning, peer-support reinforcement.",
  ],
};

const RESPONSE: string[] = [
  "Resident responded positively to interventions; no adverse events.",
  "Resident engaged positively with staff interventions.",
  "Resident receptive to staff support throughout the shift.",
  "Responded well to staff engagement and encouragement.",
  "Interventions received positively; no concerns noted.",
  "Engaged well with therapeutic conversation and staff support.",
  "Receptive to feedback and reinforcement.",
  "Participated actively in interventions provided.",
  "Responded cooperatively to staff engagement.",
  "Receptive and engaged across all interventions this shift.",
];

const BEHAVIOR = (shift: Shift): string[] => {
  const shiftBlock =
    shift === "AM"
      ? "AM shift (06:00-18:00): morning routine, breakfast, medication administration, morning meeting, and morning programming."
      : "PM shift (18:00-06:00): dinner, evening programming, medication administration, evening wind-down, and overnight monitoring.";
  return [
    `${shiftBlock} No safety concerns observed this shift.`,
    `${shiftBlock} Resident remained appropriate throughout the shift.`,
    `${shiftBlock} No behavioral concerns noted.`,
    `${shiftBlock} Behavior appropriate and consistent with program expectations.`,
    `${shiftBlock} No unusual observations.`,
    `${shiftBlock} Behavior stable across the shift; no incidents.`,
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
