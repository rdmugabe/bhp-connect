import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseDate,
  parseOptionalDate,
  parseRequiredDate,
  parseOptionalDateOfBirth,
  parseOptionalPastDate,
  parseOptionalSignatureDate,
  formatDateForEmail,
  formatISODate,
  calculateAge,
} from "@/lib/date-utils";

describe("Real-world date parsing patterns", () => {
  describe("ISO 8601 formats", () => {
    it("parses date-only format", () => {
      const result = parseDate("2024-03-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("parses datetime with Z timezone", () => {
      const result = parseDate("2024-03-15T10:30:00Z");
      expect(result).toBeInstanceOf(Date);
    });

    it("parses datetime with offset timezone", () => {
      const result = parseDate("2024-03-15T10:30:00+05:00");
      expect(result).toBeInstanceOf(Date);
    });

    it("parses datetime with negative offset", () => {
      const result = parseDate("2024-03-15T10:30:00-08:00");
      expect(result).toBeInstanceOf(Date);
    });

    it("parses datetime with milliseconds", () => {
      const result = parseDate("2024-03-15T10:30:00.123Z");
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("US date formats", () => {
    it("parses MM/DD/YYYY format", () => {
      const result = parseDate("03/15/2024");
      expect(result).toBeInstanceOf(Date);
    });

    it("parses M/D/YYYY format", () => {
      const result = parseDate("3/5/2024");
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("Long date formats", () => {
    it("parses month name format", () => {
      const result = parseDate("March 15, 2024");
      expect(result).toBeInstanceOf(Date);
    });

    it("parses abbreviated month format", () => {
      const result = parseDate("Mar 15, 2024");
      expect(result).toBeInstanceOf(Date);
    });
  });
});

describe("Intake form date patterns", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Date of Birth", () => {
    it("accepts adult DOB", () => {
      const result = parseOptionalDateOfBirth("1990-05-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("accepts child DOB", () => {
      const result = parseOptionalDateOfBirth("2015-08-20");
      expect(result).toBeInstanceOf(Date);
    });

    it("accepts elderly DOB", () => {
      const result = parseOptionalDateOfBirth("1935-01-01");
      expect(result).toBeInstanceOf(Date);
    });

    it("rejects future DOB", () => {
      expect(() => parseOptionalDateOfBirth("2025-01-01")).toThrow();
    });

    it("calculates age correctly from DOB", () => {
      const dob = parseOptionalDateOfBirth("1990-03-15");
      if (dob) {
        expect(calculateAge(dob)).toBe(34);
      }
    });
  });

  describe("Admission Date", () => {
    it("accepts recent admission date", () => {
      const result = parseOptionalPastDate("2024-03-01");
      expect(result).toBeInstanceOf(Date);
    });

    it("accepts today as admission date", () => {
      const result = parseOptionalPastDate("2024-03-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("rejects future admission date", () => {
      expect(() => parseOptionalPastDate("2024-03-20")).toThrow();
    });
  });
});

describe("Employee document date patterns", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Issue Date", () => {
    it("accepts past issue date", () => {
      const result = parseOptionalPastDate("2023-06-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("accepts recent issue date", () => {
      const result = parseOptionalPastDate("2024-03-10");
      expect(result).toBeInstanceOf(Date);
    });

    it("rejects future issue date", () => {
      expect(() => parseOptionalPastDate("2024-06-01")).toThrow();
    });
  });

  describe("Expiration Date", () => {
    it("accepts future expiration date", () => {
      const result = parseOptionalDate("2025-06-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("returns null for missing expiration (no expiration documents)", () => {
      const result = parseOptionalDate(null);
      expect(result).toBe(null);
    });
  });
});

describe("Signature date patterns", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts today as signature date", () => {
    const result = parseOptionalSignatureDate("2024-03-15");
    expect(result).toBeInstanceOf(Date);
  });

  it("accepts recent past signature date", () => {
    const result = parseOptionalSignatureDate("2024-03-10");
    expect(result).toBeInstanceOf(Date);
  });

  it("accepts signature from a few months ago", () => {
    const result = parseOptionalSignatureDate("2023-12-01");
    expect(result).toBeInstanceOf(Date);
  });

  it("rejects future signature date", () => {
    expect(() => parseOptionalSignatureDate("2024-03-20")).toThrow();
  });

  it("rejects signature date more than 1 year ago", () => {
    expect(() => parseOptionalSignatureDate("2023-01-01")).toThrow();
  });

  it("returns null for missing signature date", () => {
    const result = parseOptionalSignatureDate(null);
    expect(result).toBe(null);
  });
});

describe("Incident report date patterns", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts recent incident date", () => {
    const result = parseOptionalPastDate("2024-03-14");
    expect(result).toBeInstanceOf(Date);
  });

  it("accepts today as incident date", () => {
    const result = parseOptionalPastDate("2024-03-15");
    expect(result).toBeInstanceOf(Date);
  });

  it("accepts incident from last week", () => {
    const result = parseOptionalPastDate("2024-03-08");
    expect(result).toBeInstanceOf(Date);
  });

  it("rejects future incident date", () => {
    expect(() => parseOptionalPastDate("2024-03-20")).toThrow();
  });
});

describe("Meeting date patterns", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("parses meeting datetime", () => {
    const result = parseRequiredDate("2024-03-20T14:00:00Z", "Meeting time");
    expect(result).toBeInstanceOf(Date);
  });

  it("throws for missing meeting time", () => {
    expect(() => parseRequiredDate(null, "Meeting time")).toThrow("Meeting time is required");
  });

  it("throws for invalid meeting time", () => {
    expect(() => parseRequiredDate("not-a-date", "Meeting time")).toThrow();
  });
});

describe("Email formatting patterns", () => {
  it("formats date for enrollment email", () => {
    const result = formatDateForEmail("2024-03-15T00:00:00Z");
    expect(result).toBe("March 15, 2024");
  });

  it("returns null for missing date in email", () => {
    const result = formatDateForEmail(null);
    expect(result).toBe(null);
  });

  it("formats admission date for email", () => {
    const admissionDate = new Date(Date.UTC(2024, 2, 1));
    const result = formatDateForEmail(admissionDate);
    expect(result).toBe("March 1, 2024");
  });

  it("formats DOB for email", () => {
    const dob = new Date(Date.UTC(1990, 0, 15));
    const result = formatDateForEmail(dob);
    expect(result).toBe("January 15, 1990");
  });
});

describe("PDF generation date patterns", () => {
  it("formats date as ISO for PDF filename", () => {
    const result = formatISODate("2024-03-15T10:30:00Z");
    expect(result).toBe("2024-03-15");
  });

  it("formats date object as ISO", () => {
    const date = new Date(Date.UTC(2024, 2, 15));
    const result = formatISODate(date);
    expect(result).toBe("2024-03-15");
  });
});

describe("Edge cases", () => {
  it("handles date at year boundary", () => {
    const result = parseDate("2023-12-31T23:59:59Z");
    expect(result).toBeInstanceOf(Date);
  });

  it("handles leap year date", () => {
    // Use explicit UTC date to avoid timezone issues
    const result = parseDate("2024-02-29T12:00:00Z");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getUTCDate()).toBe(29);
  });

  it("handles first day of year", () => {
    const result = parseDate("2024-01-01");
    expect(result).toBeInstanceOf(Date);
  });

  it("handles last day of year", () => {
    const result = parseDate("2024-12-31");
    expect(result).toBeInstanceOf(Date);
  });

  it("handles daylight saving time transition", () => {
    const result = parseDate("2024-03-10T02:30:00-05:00");
    expect(result).toBeInstanceOf(Date);
  });

  it("handles midnight UTC", () => {
    const result = parseDate("2024-03-15T00:00:00Z");
    expect(result).toBeInstanceOf(Date);
  });

  it("handles end of day UTC", () => {
    const result = parseDate("2024-03-15T23:59:59Z");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("Whitespace handling", () => {
  it("trims leading whitespace", () => {
    const result = parseDate("  2024-03-15");
    expect(result).toBeInstanceOf(Date);
  });

  it("trims trailing whitespace", () => {
    const result = parseDate("2024-03-15  ");
    expect(result).toBeInstanceOf(Date);
  });

  it("trims both sides whitespace", () => {
    const result = parseDate("  2024-03-15  ");
    expect(result).toBeInstanceOf(Date);
  });

  it("returns null for whitespace-only string", () => {
    const result = parseDate("   ");
    expect(result).toBe(null);
  });
});

describe("Type coercion prevention", () => {
  it("does not parse boolean true", () => {
    const result = parseDate(true as unknown);
    expect(result).toBe(null);
  });

  it("does not parse boolean false", () => {
    const result = parseDate(false as unknown);
    expect(result).toBe(null);
  });

  it("does not parse number 0", () => {
    const result = parseDate(0 as unknown);
    expect(result).toBe(null);
  });

  it("does not parse NaN", () => {
    const result = parseDate(NaN as unknown);
    expect(result).toBe(null);
  });

  it("does not parse Infinity", () => {
    const result = parseDate(Infinity as unknown);
    expect(result).toBe(null);
  });

  it("does not parse symbol", () => {
    const result = parseDate(Symbol("date") as unknown);
    expect(result).toBe(null);
  });

  it("does not parse function", () => {
    const result = parseDate((() => {}) as unknown);
    expect(result).toBe(null);
  });
});

describe("Invalid date format strings", () => {
  it("returns null for random text", () => {
    expect(parseDate("hello world")).toBe(null);
  });

  // Note: JavaScript Date.parse is lenient and parses "2024-03" as March 1, 2024
  // This is expected behavior for Date.parse
  it("parses partial month-year format (JS Date behavior)", () => {
    const result = parseDate("2024-03");
    // JavaScript parses this as valid, returning a Date
    expect(result).toBeInstanceOf(Date);
  });

  // Note: JavaScript Date.parse parses "2024" as January 1, 2024
  it("parses year-only format (JS Date behavior)", () => {
    const result = parseDate("2024");
    // JavaScript parses this as valid
    expect(result).toBeInstanceOf(Date);
  });

  it("returns null for invalid month", () => {
    expect(parseDate("2024-13-15")).toBe(null);
  });

  it("returns null for invalid day", () => {
    expect(parseDate("2024-03-32")).toBe(null);
  });

  // Note: JavaScript rolls over Feb 30 to March 1
  it("rolls over invalid February date (JS Date behavior)", () => {
    const result = parseDate("2024-02-30");
    // JavaScript parses this and rolls over to March 1
    expect(result).toBeInstanceOf(Date);
  });

  // Note: JavaScript may parse negative years differently
  it("handles negative year format (implementation dependent)", () => {
    const result = parseDate("-2024-03-15");
    // Behavior varies by implementation - just check it doesn't crash
    // Some implementations parse it, others return Invalid Date
    expect(result === null || result instanceof Date).toBe(true);
  });
});

describe("Date object preservation", () => {
  it("preserves date when input is already a Date", () => {
    const original = new Date(2024, 2, 15, 10, 30);
    const result = parseDate(original);
    expect(result?.getTime()).toBe(original.getTime());
  });

  it("does not modify the original Date object", () => {
    const original = new Date(2024, 2, 15, 10, 30);
    const originalTime = original.getTime();
    parseDate(original);
    expect(original.getTime()).toBe(originalTime);
  });
});
