/**
 * Re-Evaluation Countdown
 *
 * Each active resident has an admin-set `nextReEvaluationDueDate`. The
 * countdown is just "days until that date." When an admin uploads a new
 * re-evaluation (or simply edits the date), they set the next due date and
 * the countdown restarts.
 *
 * No cycle math, no admission-anchored grid — the due date is the source
 * of truth.
 */

const ACTION_WINDOW_DAYS = 4; // last 4 days before due date trigger amber state
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type ReEvaluationStatus =
  | "UNSCHEDULED" // no due date set yet
  | "NOT_YET" // green — more than 4 days remaining
  | "DUE_SOON" // amber — 0-4 days remaining (action window)
  | "OVERDUE"; // red — past the due date

export interface ReEvaluationState {
  dueDate: Date | null; // null when unscheduled
  daysUntilDue: number | null; // negative when overdue
  isInActionWindow: boolean;
  isOverdue: boolean;
  daysOverdue: number; // 0 unless overdue
  status: ReEvaluationStatus;
}

/** Strip a Date to UTC midnight. */
export function toUTCMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** Whole-day difference (UTC), positive when `b` is after `a`. */
function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    (toUTCMidnight(b).getTime() - toUTCMidnight(a).getTime()) / MS_PER_DAY
  );
}

/** Add whole days to a date in UTC. */
export function addDaysUTC(date: Date, days: number): Date {
  return new Date(toUTCMidnight(date).getTime() + days * MS_PER_DAY);
}

/**
 * Compute countdown state for a resident given their admin-set re-evaluation
 * due date. Returns UNSCHEDULED if no date is set.
 */
export function getReEvaluationState(
  dueDate: Date | null | undefined,
  today: Date = new Date()
): ReEvaluationState {
  if (!dueDate) {
    return {
      dueDate: null,
      daysUntilDue: null,
      isInActionWindow: false,
      isOverdue: false,
      daysOverdue: 0,
      status: "UNSCHEDULED",
    };
  }

  const due = toUTCMidnight(dueDate);
  const ref = toUTCMidnight(today);
  const daysUntilDue = daysBetween(ref, due);
  const isOverdue = daysUntilDue < 0;
  const daysOverdue = isOverdue ? -daysUntilDue : 0;
  const isInActionWindow =
    !isOverdue && daysUntilDue >= 0 && daysUntilDue < ACTION_WINDOW_DAYS;

  let status: ReEvaluationStatus;
  if (isOverdue) status = "OVERDUE";
  else if (isInActionWindow) status = "DUE_SOON";
  else status = "NOT_YET";

  return {
    dueDate: due,
    daysUntilDue,
    isInActionWindow,
    isOverdue,
    daysOverdue,
    status,
  };
}

/**
 * Sort order for dashboard tiles: most urgent first.
 * OVERDUE (largest daysOverdue first) → DUE_SOON (smallest daysUntilDue first)
 * → NOT_YET (smallest daysUntilDue first) → UNSCHEDULED.
 */
export const STATUS_SORT_ORDER: Record<ReEvaluationStatus, number> = {
  OVERDUE: 0,
  DUE_SOON: 1,
  NOT_YET: 2,
  UNSCHEDULED: 3,
};

export function compareByUrgency(
  a: ReEvaluationState,
  b: ReEvaluationState
): number {
  const byStatus = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
  if (byStatus !== 0) return byStatus;
  if (a.status === "OVERDUE") return b.daysOverdue - a.daysOverdue;
  if (a.daysUntilDue == null || b.daysUntilDue == null) return 0;
  return a.daysUntilDue - b.daysUntilDue;
}
