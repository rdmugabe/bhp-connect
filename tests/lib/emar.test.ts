import { describe, it, expect } from "vitest";
import {
  ROUTE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  ALERT_SEVERITY_COLORS,
  SIX_RIGHTS,
  CONTROLLED_SCHEDULES,
  DOSAGE_FORMS,
  SHIFTS,
} from "@/lib/emar";

describe("ROUTE_LABELS", () => {
  it("contains all required medication routes", () => {
    expect(ROUTE_LABELS.PO).toBeDefined();
    expect(ROUTE_LABELS.SL).toBeDefined();
    expect(ROUTE_LABELS.IM).toBeDefined();
    expect(ROUTE_LABELS.IV).toBeDefined();
    expect(ROUTE_LABELS.SC).toBeDefined();
    expect(ROUTE_LABELS.TOPICAL).toBeDefined();
    expect(ROUTE_LABELS.INHALED).toBeDefined();
    expect(ROUTE_LABELS.OPHTHALMIC).toBeDefined();
    expect(ROUTE_LABELS.OTIC).toBeDefined();
    expect(ROUTE_LABELS.NASAL).toBeDefined();
    expect(ROUTE_LABELS.RECTAL).toBeDefined();
    expect(ROUTE_LABELS.TRANSDERMAL).toBeDefined();
    expect(ROUTE_LABELS.OTHER).toBeDefined();
  });

  it("has human-readable labels for all routes", () => {
    expect(ROUTE_LABELS.PO).toBe("By mouth (PO)");
    expect(ROUTE_LABELS.IV).toBe("Intravenous (IV)");
    expect(ROUTE_LABELS.TOPICAL).toBe("Topical");
  });
});

describe("STATUS_LABELS", () => {
  it("contains all required administration statuses", () => {
    expect(STATUS_LABELS.SCHEDULED).toBeDefined();
    expect(STATUS_LABELS.DUE).toBeDefined();
    expect(STATUS_LABELS.GIVEN).toBeDefined();
    expect(STATUS_LABELS.REFUSED).toBeDefined();
    expect(STATUS_LABELS.HELD).toBeDefined();
    expect(STATUS_LABELS.MISSED).toBeDefined();
    expect(STATUS_LABELS.NOT_AVAILABLE).toBeDefined();
    expect(STATUS_LABELS.LOA).toBeDefined();
    expect(STATUS_LABELS.DISCONTINUED).toBeDefined();
  });

  it("has correct human-readable labels", () => {
    expect(STATUS_LABELS.GIVEN).toBe("Given");
    expect(STATUS_LABELS.REFUSED).toBe("Refused");
    expect(STATUS_LABELS.DUE).toBe("Due Now");
    expect(STATUS_LABELS.LOA).toBe("Leave of Absence");
  });
});

describe("STATUS_COLORS", () => {
  it("contains colors for all statuses", () => {
    expect(STATUS_COLORS.SCHEDULED).toBeDefined();
    expect(STATUS_COLORS.DUE).toBeDefined();
    expect(STATUS_COLORS.GIVEN).toBeDefined();
    expect(STATUS_COLORS.REFUSED).toBeDefined();
    expect(STATUS_COLORS.HELD).toBeDefined();
    expect(STATUS_COLORS.MISSED).toBeDefined();
  });

  it("has bg and text properties for each status", () => {
    expect(STATUS_COLORS.GIVEN.bg).toBeDefined();
    expect(STATUS_COLORS.GIVEN.text).toBeDefined();
    expect(STATUS_COLORS.REFUSED.bg).toBeDefined();
    expect(STATUS_COLORS.REFUSED.text).toBeDefined();
  });

  it("uses appropriate color classes for statuses", () => {
    expect(STATUS_COLORS.GIVEN.bg).toContain("green");
    expect(STATUS_COLORS.REFUSED.bg).toContain("red");
    expect(STATUS_COLORS.HELD.bg).toContain("orange");
    expect(STATUS_COLORS.DUE.bg).toContain("yellow");
  });
});

describe("ALERT_SEVERITY_COLORS", () => {
  it("contains colors for all severity levels", () => {
    expect(ALERT_SEVERITY_COLORS.CRITICAL).toBeDefined();
    expect(ALERT_SEVERITY_COLORS.WARNING).toBeDefined();
    expect(ALERT_SEVERITY_COLORS.INFO).toBeDefined();
  });

  it("has bg, border, and text properties", () => {
    expect(ALERT_SEVERITY_COLORS.CRITICAL.bg).toBeDefined();
    expect(ALERT_SEVERITY_COLORS.CRITICAL.border).toBeDefined();
    expect(ALERT_SEVERITY_COLORS.CRITICAL.text).toBeDefined();
  });

  it("uses red for critical alerts", () => {
    expect(ALERT_SEVERITY_COLORS.CRITICAL.bg).toContain("red");
    expect(ALERT_SEVERITY_COLORS.CRITICAL.border).toContain("red");
    expect(ALERT_SEVERITY_COLORS.CRITICAL.text).toContain("red");
  });

  it("uses yellow for warning alerts", () => {
    expect(ALERT_SEVERITY_COLORS.WARNING.bg).toContain("yellow");
    expect(ALERT_SEVERITY_COLORS.WARNING.border).toContain("yellow");
  });
});

describe("SIX_RIGHTS", () => {
  it("contains exactly 6 rights", () => {
    expect(SIX_RIGHTS).toHaveLength(6);
  });

  it("includes Right Patient", () => {
    const rightPatient = SIX_RIGHTS.find((r) => r.id === "right_patient");
    expect(rightPatient).toBeDefined();
    expect(rightPatient?.label).toBe("Right Patient");
    expect(rightPatient?.description).toContain("identity");
  });

  it("includes Right Medication", () => {
    const rightMedication = SIX_RIGHTS.find((r) => r.id === "right_medication");
    expect(rightMedication).toBeDefined();
    expect(rightMedication?.label).toBe("Right Medication");
  });

  it("includes Right Dose", () => {
    const rightDose = SIX_RIGHTS.find((r) => r.id === "right_dose");
    expect(rightDose).toBeDefined();
    expect(rightDose?.label).toBe("Right Dose");
  });

  it("includes Right Route", () => {
    const rightRoute = SIX_RIGHTS.find((r) => r.id === "right_route");
    expect(rightRoute).toBeDefined();
    expect(rightRoute?.label).toBe("Right Route");
  });

  it("includes Right Time", () => {
    const rightTime = SIX_RIGHTS.find((r) => r.id === "right_time");
    expect(rightTime).toBeDefined();
    expect(rightTime?.label).toBe("Right Time");
  });

  it("includes Right Documentation", () => {
    const rightDoc = SIX_RIGHTS.find((r) => r.id === "right_documentation");
    expect(rightDoc).toBeDefined();
    expect(rightDoc?.label).toBe("Right Documentation");
  });

  it("each right has id, label, and description", () => {
    SIX_RIGHTS.forEach((right) => {
      expect(right.id).toBeDefined();
      expect(right.label).toBeDefined();
      expect(right.description).toBeDefined();
      expect(right.id.length).toBeGreaterThan(0);
      expect(right.label.length).toBeGreaterThan(0);
      expect(right.description.length).toBeGreaterThan(0);
    });
  });
});

describe("CONTROLLED_SCHEDULES", () => {
  it("contains all DEA schedules (II-V)", () => {
    expect(CONTROLLED_SCHEDULES).toHaveLength(4);

    const values = CONTROLLED_SCHEDULES.map((s) => s.value);
    expect(values).toContain("II");
    expect(values).toContain("III");
    expect(values).toContain("IV");
    expect(values).toContain("V");
  });

  it("does not include Schedule I (not used in medical practice)", () => {
    const values = CONTROLLED_SCHEDULES.map((s) => s.value);
    expect(values).not.toContain("I");
  });

  it("has human-readable labels", () => {
    const scheduleII = CONTROLLED_SCHEDULES.find((s) => s.value === "II");
    expect(scheduleII?.label).toBe("Schedule II");
  });
});

describe("DOSAGE_FORMS", () => {
  it("contains common dosage forms", () => {
    expect(DOSAGE_FORMS).toContain("Tablet");
    expect(DOSAGE_FORMS).toContain("Capsule");
    expect(DOSAGE_FORMS).toContain("Liquid");
    expect(DOSAGE_FORMS).toContain("Injection");
    expect(DOSAGE_FORMS).toContain("Patch");
    expect(DOSAGE_FORMS).toContain("Cream");
    expect(DOSAGE_FORMS).toContain("Inhaler");
  });

  it("includes Other option", () => {
    expect(DOSAGE_FORMS).toContain("Other");
  });

  it("has at least 10 dosage forms", () => {
    expect(DOSAGE_FORMS.length).toBeGreaterThanOrEqual(10);
  });
});

describe("SHIFTS", () => {
  it("defines day and night shifts", () => {
    expect(SHIFTS.DAY).toBeDefined();
    expect(SHIFTS.NIGHT).toBeDefined();
  });

  it("day shift has correct hours", () => {
    expect(SHIFTS.DAY.label).toBe("Day Shift");
    expect(SHIFTS.DAY.start).toBe("07:00");
    expect(SHIFTS.DAY.end).toBe("19:00");
  });

  it("night shift has correct hours", () => {
    expect(SHIFTS.NIGHT.label).toBe("Night Shift");
    expect(SHIFTS.NIGHT.start).toBe("19:00");
    expect(SHIFTS.NIGHT.end).toBe("07:00");
  });

  it("shifts cover full 24 hours", () => {
    // Day ends at 19:00, Night starts at 19:00
    expect(SHIFTS.DAY.end).toBe(SHIFTS.NIGHT.start);
    // Night ends at 07:00, Day starts at 07:00
    expect(SHIFTS.NIGHT.end).toBe(SHIFTS.DAY.start);
  });
});
