import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MEETING_ID = 'cmo7t1fm40001tnco2lgqbs4u';

const update = {
  resolutions: [
    "Team consensus: client is not ready for discharge; continue ASAM Level 3.1 residential placement at Lucid Behavioral Health.",
    "Lucid BH and GRHC case management to continue working to resolve AHCCCS coverage delay caused by identity theft (verifying client did not work).",
    "New clinical evaluation and updated treatment plan completed by Lucid BH; target date May 20, 2026.",
    "Written relapse prevention plan completed at Lucid BH; Richard Mugabe to provide a copy to GRHC case manager (Danielle Juarez) for the record.",
    "Probation status confirmed compliant by PO Kenny St. Fleur; client to continue check-ins on the 4th Tuesday of each month.",
    "Step-down plan upon clinical readiness: sober living/transitional housing with continued IOP, case management, individual and group counseling, and peer support.",
    "Next ART meeting scheduled for 05/01/2026."
  ].join("\n"),

  strengths: [
    "Engaged and participating in daily group therapy (3x/day) and weekly individual therapy at Lucid BH.",
    "Utilizing coping skills - drawing and demonstrated 5-4-3-2-1 grounding technique successfully in session (03/30/2026).",
    "Following program rules; helps with chores (e.g., taking out trash); getting along well with peers.",
    "Sleeping well with no current sleep concerns.",
    "Probation compliant; communicating needs to PO; consistent 4th-Tuesday monthly check-ins.",
    "Completed written relapse prevention plan and identified high-risk triggers and warning signs.",
    "Maintained sobriety from methamphetamine and all substances since admission to Lucid BH (02/20/2026).",
    "Supportive long-term partner (girlfriend of 9 years) and stated motivation to marry, work, and be self-sufficient.",
    "Cooperative with treatment providers; alert and oriented x4; demonstrates empathy with peers.",
    "ADL independent (hygiene, grooming, dressing); functions well in structured environments."
  ].join("\n"),

  barriers: [
    "High relapse potential (ASAM D5: Very Severe) - history of treatment engagement followed by relapse after step-down (most recent relapse after IOP discharge 02/18/2026).",
    "Homelessness and high-risk recovery environment (ASAM D6: Severe) - housing must be secured prior to discharge.",
    "Limited insight into the severity of his addiction; minimizes impact of substance use (ASAM D4: Very Severe).",
    "Limited coping skills repertoire; engagement in individual therapy at times remains passive with flat affect (per 04/08/2026 session) - requires frequent prompting.",
    "Limited support network outside of girlfriend; no family supports currently involved.",
    "Unemployed; legal involvement on probation until October 2026.",
    "AHCCCS coverage delayed due to identity theft, limiting access to community resources.",
    "Declined psychiatric medication management at recent evaluation despite PHQ-9 of 14 (moderate depression) and clinically observed anxiety.",
    "Long substance use history (~24 years of methamphetamine use beginning at age 18) with deeply ingrained patterns; history of overdose."
  ].join("\n"),

  whatHasWorked: [
    "Structured residential environment at Lucid BH - daily group therapy, weekly individual therapy, and consistent daily routine.",
    "Coping skill practice including drawing and 5-4-3-2-1 grounding (demonstrated successfully 03/30/2026).",
    "Completion of a written relapse prevention plan with identified triggers, warning signs, and step-by-step craving response plan.",
    "Probation coordination - regular monthly check-ins with PO Kenny St. Fleur and consistent compliance.",
    "Peer engagement and prosocial behavior - helping with chores and getting along well with housemates.",
    "Maintained abstinence from methamphetamine and all substances since admission."
  ].join("\n"),

  whatHasNotWorked: [
    "Prior step-downs without sufficient housing/support have led to relapse (history of relapse following IOP discharge on 02/18/2026).",
    "Refusal of psychiatric medication management at recent evaluation despite a PHQ-9 of 14 indicating moderate depression.",
    "Engagement in individual therapy is at times passive with flat affect; client provides surface-level responses without significant prompting (04/08/2026 session).",
    "Limited natural supports outside of girlfriend; no family or sober peer network in place.",
    "Identity theft continues to delay AHCCCS coverage activation, slowing access to community/wraparound services."
  ].join("\n"),

  goals: [
    "1. Maintain abstinence from methamphetamine and all mood-altering substances (Target: 05/20/2026).",
    "2. Develop and consistently practice at least 5 healthy coping skills for managing cravings and stress.",
    "3. Address depression and anxiety symptoms; reconsider psychiatric medication and complete weekly PHQ-9 monitoring.",
    "4. Build independent living skills and secure stable housing (sober living/transitional housing or tribal resources) prior to discharge.",
    "5. Engage in individual and group counseling to increase insight into addiction and develop emotional regulation.",
    "6. Maintain personal hygiene, clean living space, and program participation.",
    "7. Maintain probation compliance and coordination with PO Kenny St. Fleur through October 2026.",
    "8. Resolve AHCCCS coverage issue (identity theft) to ensure long-term access to behavioral health services."
  ].join("\n"),

  concreteSteps: [
    "Continue daily group therapy (3x/day) and weekly individual therapy at Lucid BH.",
    "Submit to random drug testing as requested by clinical team.",
    "Attend AA/NA or culturally appropriate recovery meetings (Salt River / Gila River resources) 3x weekly minimum.",
    "Daily practice of grounding (5-4-3-2-1), deep breathing, and at least one additional coping skill; maintain daily trigger/emotion journal.",
    "Case management to actively pursue housing applications (sober living, transitional housing, Salt River/Gila River tribal resources) and continue to resolve AHCCCS identity-theft issue.",
    "Re-engage psychiatric provider to reassess need for medication and MAT (Naltrexone/Acamprosate) once stabilized.",
    "Continue monthly 4th-Tuesday probation check-ins with PO Kenny St. Fleur and provide documentation of treatment participation as required.",
    "Richard Mugabe (Lucid BH) to provide a copy of the completed relapse prevention plan to GRHC case manager (Danielle Juarez).",
    "Begin exploring vocational rehabilitation and employment options through case management.",
    "Identify and connect with at least one additional sober support (sponsor) outside of girlfriend."
  ].join("\n"),

  progressIndicators: [
    "Negative random drug screens documenting continued sobriety.",
    "100% attendance and active participation in scheduled group and individual sessions.",
    "Demonstrated use of at least 3 coping skills when triggered (per staff observation and client self-report).",
    "Documented monthly probation check-ins maintained without incident.",
    "PHQ-9 score trending below moderate range; client reports mood changes/concerning symptoms to staff promptly.",
    "Completion of at least one housing application and identification of a target placement.",
    "Resolution of AHCCCS identity-theft issue and active coverage in place.",
    "Continued ADL independence, hygiene, chore participation, and prosocial peer interaction.",
    "Evidence of increased insight - more elaborated discussion of triggers, cravings, and relapse cycle in individual therapy with reduced prompting needed.",
    "Establishment of a sponsor relationship and consistent attendance at recovery meetings."
  ].join("\n"),

  medicalIssues: [
    "No prescribed medications currently; no past medication trials reported.",
    "Client declined psychiatric medication management at recent evaluation; PHQ-9 = 14 (moderate depression) with clinically observed anxiety - reconsideration recommended.",
    "MAT assessment (Naltrexone/Acamprosate) recommended once clinically stabilized.",
    "No known drug allergies (NKDA).",
    "History of opioid (fentanyl) overdose; last opioid use approximately one year ago - currently in remission.",
    "Sleeping well; no current sleep concerns reported.",
    "Denies current SI/HI/self-harm; no acute medical concerns at this time.",
    "AHCCCS coverage pending resolution of identity-theft issue."
  ].join("\n"),

  plan: [
    "Continue ASAM Level 3.1 - Clinically Managed Low-Intensity Residential Treatment at Lucid Behavioral Health LLC; client is not yet ready for discharge.",
    "Continue daily group therapy, weekly individual therapy, 3x weekly recovery meetings, and ongoing case management.",
    "Lucid BH and GRHC case management to continue working to resolve AHCCCS coverage delay (identity theft).",
    "Re-engage psychiatric provider to reassess medication management and MAT eligibility.",
    "Coordinate with Probation Officer Kenny St. Fleur on continued compliance and provide documentation as needed.",
    "Step-down plan upon clinical readiness: sober living/transitional housing with continued IOP, case management, individual and group counseling, and peer support.",
    "Family feedback about ART: Yes.",
    "Next ART meeting: 05/01/2026."
  ].join("\n"),

  summary: [
    "ART meeting held via Telehealth (Audio & Video) on 04/01/2026 from 10:02 AM to 10:25 AM. Attendees: Mario Webb (client), Danielle Juarez (GRHC Case Manager), Richard Mugabe (Lucid Behavioral Health), Kenny St. Fleur (Probation Officer), and Dr. Chris Azode (Medical Director). RN was absent.",
    "Meeting opened with confidentiality and its limits, introductions, and the meeting objective. The team reviewed Mr. Webb's progress at Lucid BH: he attends groups daily and individual therapy 1x weekly, utilizes coping skills (drawing, grounding), helps with chores, gets along well with peers, and is sleeping well. A written relapse prevention plan has been completed. Lucid BH completed a new clinical evaluation and updated treatment plan.",
    "Probation Officer Kenny St. Fleur reported the client is fully compliant, communicating his needs, and will complete probation in fall 2026; check-ins continue on the 4th Tuesday of each month.",
    "Mr. Webb is not currently on any medications. Lucid staff are working to resolve an AHCCCS coverage delay caused by identity theft (verifying that he did not work).",
    "Team consensus is that Mr. Webb is not yet ready for discharge and continues to need residential structure to build the tools necessary to maintain sobriety. Upon clinical readiness, the step-down plan is sober living/transitional housing with continued outpatient services, case management, IOP, counseling, group counseling, and peer support.",
    "Family feedback about ART: Yes. Next ART meeting: 05/01/2026."
  ].join("\n\n"),
};

async function main() {
  const before = await prisma.aRTMeeting.findUnique({ where: { id: MEETING_ID } });
  if (!before) throw new Error('Meeting not found');
  console.log('Before status:', before.status, '| meetingDate:', before.meetingDate);

  const updated = await prisma.aRTMeeting.update({
    where: { id: MEETING_ID },
    data: update,
  });
  console.log('Updated meeting', updated.id);
  console.log('Filled fields:', Object.keys(update).join(', '));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
