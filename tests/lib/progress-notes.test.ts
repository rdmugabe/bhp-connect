import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  progressNoteSchema,
  progressNoteDraftSchema,
  progressNoteUpdateSchema,
  PROGRESS_NOTE_SHIFTS,
  PROGRESS_NOTE_STATUSES,
  RISK_FLAGS,
} from "@/lib/validations";

describe("Progress Note Validation Schemas", () => {
  describe("progressNoteSchema", () => {
    it("validates required fields", () => {
      const validData = {
        noteDate: "2024-03-15",
        authorName: "John Smith",
      };

      const result = progressNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("fails when noteDate is missing", () => {
      const invalidData = {
        authorName: "John Smith",
      };

      const result = progressNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("fails when authorName is missing", () => {
      const invalidData = {
        noteDate: "2024-03-15",
      };

      const result = progressNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("fails when noteDate is empty string", () => {
      const invalidData = {
        noteDate: "",
        authorName: "John Smith",
      };

      const result = progressNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("fails when authorName is empty string", () => {
      const invalidData = {
        noteDate: "2024-03-15",
        authorName: "",
      };

      const result = progressNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("validates with all optional fields", () => {
      const validData = {
        noteDate: "2024-03-15",
        authorName: "John Smith",
        shift: "AM",
        authorTitle: "BHT",
        residentStatus: "Stable and cooperative",
        observedBehaviors: "Engaged in group activities",
        moodAffect: "Euthymic",
        activityParticipation: "Active participation in all activities",
        staffInteractions: "Positive interactions with staff",
        peerInteractions: "Social with peers",
        medicationCompliance: "Took all medications as prescribed",
        hygieneAdl: "Good hygiene, independent ADLs",
        mealsAppetite: "Good appetite, ate 100% of meals",
        sleepPattern: "Slept through the night",
        staffInterventions: "Provided encouragement",
        residentResponse: "Receptive to interventions",
        notableEvents: "None",
        additionalNotes: "Overall positive day",
      };

      const result = progressNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("validates shift enum values", () => {
      const validShifts = ["AM", "PM", "NOC"];

      validShifts.forEach((shift) => {
        const data = {
          noteDate: "2024-03-15",
          authorName: "John Smith",
          shift,
        };
        const result = progressNoteSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("fails with invalid shift value", () => {
      const invalidData = {
        noteDate: "2024-03-15",
        authorName: "John Smith",
        shift: "INVALID",
      };

      const result = progressNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("progressNoteDraftSchema", () => {
    it("validates empty object (all fields optional)", () => {
      const result = progressNoteDraftSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("validates partial data", () => {
      const partialData = {
        noteDate: "2024-03-15",
        residentStatus: "In progress",
      };

      const result = progressNoteDraftSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("validates with only author name", () => {
      const data = {
        authorName: "John Smith",
      };

      const result = progressNoteDraftSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("progressNoteUpdateSchema", () => {
    it("validates empty object for no updates", () => {
      const result = progressNoteUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("validates status update to FINAL", () => {
      const data = {
        status: "FINAL",
      };

      const result = progressNoteUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates status update to DRAFT", () => {
      const data = {
        status: "DRAFT",
      };

      const result = progressNoteUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("fails with invalid status value", () => {
      const data = {
        status: "INVALID",
      };

      const result = progressNoteUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("validates generatedNote update", () => {
      const data = {
        generatedNote: "Clinical progress note content here...",
      };

      const result = progressNoteUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates riskFlagsDetected update", () => {
      const data = {
        riskFlagsDetected: ["SELF_HARM", "SUICIDAL_IDEATION"],
      };

      const result = progressNoteUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates multiple field updates", () => {
      const data = {
        noteDate: "2024-03-16",
        shift: "PM",
        authorTitle: "RN",
        residentStatus: "Updated status",
        generatedNote: "Updated generated note",
        status: "FINAL",
      };

      const result = progressNoteUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Constants", () => {
    it("PROGRESS_NOTE_SHIFTS contains expected values", () => {
      expect(PROGRESS_NOTE_SHIFTS).toContain("AM");
      expect(PROGRESS_NOTE_SHIFTS).toContain("PM");
      expect(PROGRESS_NOTE_SHIFTS).toContain("NOC");
      expect(PROGRESS_NOTE_SHIFTS).toHaveLength(3);
    });

    it("PROGRESS_NOTE_STATUSES contains expected values", () => {
      expect(PROGRESS_NOTE_STATUSES).toContain("DRAFT");
      expect(PROGRESS_NOTE_STATUSES).toContain("FINAL");
      expect(PROGRESS_NOTE_STATUSES).toHaveLength(2);
    });

    it("RISK_FLAGS contains all expected risk flags", () => {
      const expectedFlags = [
        "SELF_HARM",
        "SUICIDAL_IDEATION",
        "HOMICIDAL_IDEATION",
        "AGGRESSION",
        "MEDICAL_DISTRESS",
        "ELOPEMENT_RISK",
        "SUBSTANCE_USE",
      ];

      expectedFlags.forEach((flag) => {
        expect(RISK_FLAGS).toContain(flag);
      });
      expect(RISK_FLAGS).toHaveLength(7);
    });
  });
});

describe("Progress Note Date Handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15)); // March 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("validates ISO date format", () => {
    const data = {
      noteDate: "2024-03-15",
      authorName: "John Smith",
    };

    const result = progressNoteSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("validates date with time component", () => {
    const data = {
      noteDate: "2024-03-15T10:30:00Z",
      authorName: "John Smith",
    };

    const result = progressNoteSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("validates US date format", () => {
    const data = {
      noteDate: "03/15/2024",
      authorName: "John Smith",
    };

    const result = progressNoteSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("Progress Note Risk Flag Validation", () => {
  it("accepts empty risk flags array", () => {
    const data = {
      riskFlagsDetected: [],
    };

    const result = progressNoteUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts single risk flag", () => {
    const data = {
      riskFlagsDetected: ["AGGRESSION"],
    };

    const result = progressNoteUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts multiple risk flags", () => {
    const data = {
      riskFlagsDetected: [
        "SELF_HARM",
        "SUICIDAL_IDEATION",
        "MEDICAL_DISTRESS",
      ],
    };

    const result = progressNoteUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts all possible risk flags", () => {
    const data = {
      riskFlagsDetected: [
        "SELF_HARM",
        "SUICIDAL_IDEATION",
        "HOMICIDAL_IDEATION",
        "AGGRESSION",
        "MEDICAL_DISTRESS",
        "ELOPEMENT_RISK",
        "SUBSTANCE_USE",
      ],
    };

    const result = progressNoteUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("Progress Note Field Length Handling", () => {
  it("accepts long text for observation fields", () => {
    const longText = "A".repeat(10000);
    const data = {
      noteDate: "2024-03-15",
      authorName: "John Smith",
      residentStatus: longText,
      observedBehaviors: longText,
      notableEvents: longText,
    };

    const result = progressNoteSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts multiline text for observation fields", () => {
    const multilineText = `Line 1
Line 2
Line 3

New paragraph with more details.
- Bullet point 1
- Bullet point 2`;

    const data = {
      noteDate: "2024-03-15",
      authorName: "John Smith",
      notableEvents: multilineText,
    };

    const result = progressNoteSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
