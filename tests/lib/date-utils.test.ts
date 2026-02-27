import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseDate,
  parseDateWithValidation,
  parseOptionalDate,
  parseRequiredDate,
  parseDateOfBirth,
  parseOptionalDateOfBirth,
  parseRequiredDateOfBirth,
  parseExpirationDate,
  parseOptionalExpirationDate,
  parsePastDate,
  parseOptionalPastDate,
  parseRequiredPastDate,
  parseFutureDate,
  parseOptionalFutureDate,
  parseRequiredFutureDate,
  parseSignatureDate,
  parseOptionalSignatureDate,
  formatDateForEmail,
  formatDateLocal,
  formatISODate,
  startOfDay,
  endOfDay,
  isToday,
  isPast,
  isFuture,
  calculateAge,
  getMonthName,
  createUTCDate,
  parseDateToUTC,
  isValidDateInput,
} from "@/lib/date-utils";

describe("parseDate", () => {
  it("returns null for null input", () => {
    expect(parseDate(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(parseDate(undefined)).toBe(null);
  });

  it("returns null for empty string", () => {
    expect(parseDate("")).toBe(null);
  });

  it("returns null for whitespace-only string", () => {
    expect(parseDate("   ")).toBe(null);
  });

  it("returns null for invalid date string", () => {
    expect(parseDate("not-a-date")).toBe(null);
  });

  it("returns null for number input", () => {
    expect(parseDate(123)).toBe(null);
  });

  it("returns null for object input", () => {
    expect(parseDate({})).toBe(null);
  });

  it("returns null for array input", () => {
    expect(parseDate([])).toBe(null);
  });

  it("parses valid ISO date string", () => {
    const result = parseDate("2024-03-15");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it("parses valid ISO datetime string", () => {
    const result = parseDate("2024-03-15T10:30:00Z");
    expect(result).toBeInstanceOf(Date);
  });

  it("parses valid Date object", () => {
    const date = new Date(2024, 2, 15);
    const result = parseDate(date);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it("returns null for Invalid Date object", () => {
    const invalidDate = new Date("invalid");
    expect(parseDate(invalidDate)).toBe(null);
  });

  it("parses date with timezone offset", () => {
    const result = parseDate("2024-03-15T10:30:00-05:00");
    expect(result).toBeInstanceOf(Date);
  });

  it("parses US format date", () => {
    const result = parseDate("03/15/2024");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseDateWithValidation", () => {
  it("returns error for null input", () => {
    const result = parseDateWithValidation(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Date value is required");
    }
  });

  it("returns error for empty string", () => {
    const result = parseDateWithValidation("");
    expect(result.success).toBe(false);
  });

  it("returns error for invalid date format", () => {
    const result = parseDateWithValidation("not-a-date");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid date format");
    }
  });

  it("returns error for non-string/non-Date input", () => {
    const result = parseDateWithValidation(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Expected string or Date");
    }
  });

  it("returns success for valid date string", () => {
    const result = parseDateWithValidation("2024-03-15");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.date).toBeInstanceOf(Date);
    }
  });

  it("returns success for valid Date object", () => {
    const result = parseDateWithValidation(new Date(2024, 2, 15));
    expect(result.success).toBe(true);
  });

  it("returns error for Invalid Date object", () => {
    const result = parseDateWithValidation(new Date("invalid"));
    expect(result.success).toBe(false);
  });
});

describe("parseOptionalDate", () => {
  it("returns null for null input", () => {
    expect(parseOptionalDate(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(parseOptionalDate(undefined)).toBe(null);
  });

  it("returns null for empty string", () => {
    expect(parseOptionalDate("")).toBe(null);
  });

  it("throws error for invalid date format", () => {
    expect(() => parseOptionalDate("not-a-date")).toThrow();
  });

  it("returns Date for valid input", () => {
    const result = parseOptionalDate("2024-03-15");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseRequiredDate", () => {
  it("throws error for null input", () => {
    expect(() => parseRequiredDate(null)).toThrow("Date is required");
  });

  it("throws error for undefined input", () => {
    expect(() => parseRequiredDate(undefined)).toThrow("Date is required");
  });

  it("throws error for empty string", () => {
    expect(() => parseRequiredDate("")).toThrow("Date is required");
  });

  it("throws error with custom field name", () => {
    expect(() => parseRequiredDate(null, "Hire date")).toThrow("Hire date is required");
  });

  it("throws error for invalid date format", () => {
    expect(() => parseRequiredDate("not-a-date", "Date")).toThrow();
  });

  it("returns Date for valid input", () => {
    const result = parseRequiredDate("2024-03-15");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseDateOfBirth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15)); // March 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error for future date", () => {
    const result = parseDateOfBirth("2025-03-15");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Date of birth cannot be in the future");
    }
  });

  it("returns error for date more than 150 years ago", () => {
    const result = parseDateOfBirth("1800-01-01");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Date of birth is too far in the past");
    }
  });

  it("returns success for valid past date", () => {
    const result = parseDateOfBirth("1990-05-15");
    expect(result.success).toBe(true);
  });

  it("returns success for date on boundary (150 years ago)", () => {
    const result = parseDateOfBirth("1875-01-01");
    expect(result.success).toBe(true);
  });
});

describe("parseOptionalDateOfBirth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for null input", () => {
    expect(parseOptionalDateOfBirth(null)).toBe(null);
  });

  it("throws error for future date", () => {
    expect(() => parseOptionalDateOfBirth("2025-03-15")).toThrow("future");
  });

  it("returns Date for valid past date", () => {
    const result = parseOptionalDateOfBirth("1990-05-15");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseRequiredDateOfBirth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws error for null input", () => {
    expect(() => parseRequiredDateOfBirth(null)).toThrow("required");
  });

  it("throws error for future date", () => {
    expect(() => parseRequiredDateOfBirth("2025-03-15")).toThrow("future");
  });

  it("returns Date for valid past date", () => {
    const result = parseRequiredDateOfBirth("1990-05-15");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseExpirationDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0)); // March 15, 2024 at noon
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error for past date", () => {
    const result = parseExpirationDate("2024-01-01");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Expiration date cannot be in the past");
    }
  });

  it("returns success for future date", () => {
    const result = parseExpirationDate("2025-03-15");
    expect(result.success).toBe(true);
  });

  it("returns success for date well in the future", () => {
    const result = parseExpirationDate("2026-01-01");
    expect(result.success).toBe(true);
  });
});

describe("parseOptionalExpirationDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for null input", () => {
    expect(parseOptionalExpirationDate(null)).toBe(null);
  });

  it("throws error for past date", () => {
    expect(() => parseOptionalExpirationDate("2024-01-01")).toThrow("past");
  });

  it("returns Date for future date", () => {
    const result = parseOptionalExpirationDate("2025-03-15");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parsePastDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15)); // March 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error for future date", () => {
    const result = parsePastDate("2024-03-20");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Date cannot be in the future");
    }
  });

  it("returns error for date more than 100 years ago", () => {
    const result = parsePastDate("1900-01-01");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Date is too far in the past");
    }
  });

  it("returns success for today's date", () => {
    const result = parsePastDate("2024-03-15");
    expect(result.success).toBe(true);
  });

  it("returns success for yesterday's date", () => {
    const result = parsePastDate("2024-03-14");
    expect(result.success).toBe(true);
  });
});

describe("parseOptionalPastDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for null input", () => {
    expect(parseOptionalPastDate(null)).toBe(null);
  });

  it("throws error for future date", () => {
    expect(() => parseOptionalPastDate("2024-03-20")).toThrow("future");
  });

  it("returns Date for past date", () => {
    const result = parseOptionalPastDate("2024-03-14");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseRequiredPastDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws error for null input", () => {
    expect(() => parseRequiredPastDate(null)).toThrow("required");
  });

  it("throws error with custom field name", () => {
    expect(() => parseRequiredPastDate(null, "Incident date")).toThrow("Incident date is required");
  });

  it("throws error for future date", () => {
    expect(() => parseRequiredPastDate("2024-03-20")).toThrow("future");
  });

  it("returns Date for past date", () => {
    const result = parseRequiredPastDate("2024-03-14");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseFutureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error for past date", () => {
    const result = parseFutureDate("2024-03-10");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Date cannot be in the past");
    }
  });

  it("returns success for future date", () => {
    const result = parseFutureDate("2024-03-20");
    expect(result.success).toBe(true);
  });

  it("returns success for date well in the future", () => {
    const result = parseFutureDate("2025-01-01");
    expect(result.success).toBe(true);
  });
});

describe("parseOptionalFutureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for null input", () => {
    expect(parseOptionalFutureDate(null)).toBe(null);
  });

  it("throws error for past date", () => {
    expect(() => parseOptionalFutureDate("2024-03-10")).toThrow("past");
  });

  it("returns Date for future date", () => {
    const result = parseOptionalFutureDate("2024-03-20");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseRequiredFutureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws error for null input", () => {
    expect(() => parseRequiredFutureDate(null)).toThrow("required");
  });

  it("throws error with custom field name", () => {
    expect(() => parseRequiredFutureDate(null, "Scheduled date")).toThrow("Scheduled date is required");
  });

  it("throws error for past date", () => {
    expect(() => parseRequiredFutureDate("2024-03-10")).toThrow("past");
  });

  it("returns Date for future date", () => {
    const result = parseRequiredFutureDate("2024-03-20");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("parseSignatureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error for future date", () => {
    const result = parseSignatureDate("2024-03-20");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Signature date cannot be in the future");
    }
  });

  it("returns error for date more than 1 year ago", () => {
    const result = parseSignatureDate("2023-01-01");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Signature date is too far in the past (max 1 year)");
    }
  });

  it("returns success for today's date", () => {
    const result = parseSignatureDate("2024-03-15");
    expect(result.success).toBe(true);
  });

  it("returns success for date within last year", () => {
    const result = parseSignatureDate("2023-06-01");
    expect(result.success).toBe(true);
  });
});

describe("parseOptionalSignatureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for null input", () => {
    expect(parseOptionalSignatureDate(null)).toBe(null);
  });

  it("throws error for future date", () => {
    expect(() => parseOptionalSignatureDate("2024-03-20")).toThrow("future");
  });

  it("throws error for date more than 1 year ago", () => {
    expect(() => parseOptionalSignatureDate("2023-01-01")).toThrow("past");
  });

  it("returns Date for valid signature date", () => {
    const result = parseOptionalSignatureDate("2024-03-10");
    expect(result).toBeInstanceOf(Date);
  });
});

describe("formatDateForEmail", () => {
  it("returns null for null input", () => {
    expect(formatDateForEmail(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(formatDateForEmail(undefined)).toBe(null);
  });

  it("returns null for invalid date string", () => {
    expect(formatDateForEmail("not-a-date")).toBe(null);
  });

  it("formats date string correctly", () => {
    const result = formatDateForEmail("2024-03-15T00:00:00Z");
    expect(result).toBe("March 15, 2024");
  });

  it("formats Date object correctly", () => {
    const date = new Date(Date.UTC(2024, 2, 15));
    const result = formatDateForEmail(date);
    expect(result).toBe("March 15, 2024");
  });
});

describe("formatDateLocal", () => {
  it("returns null for null input", () => {
    expect(formatDateLocal(null)).toBe(null);
  });

  it("returns null for invalid date", () => {
    expect(formatDateLocal("not-a-date")).toBe(null);
  });

  it("formats date correctly", () => {
    // Use a date object to avoid timezone issues
    const date = new Date(2024, 2, 15);
    const result = formatDateLocal(date);
    expect(result).toContain("2024");
    expect(result).toContain("March");
    expect(result).toContain("15");
  });
});

describe("formatISODate", () => {
  it("returns null for null input", () => {
    expect(formatISODate(null)).toBe(null);
  });

  it("returns null for invalid date", () => {
    expect(formatISODate("not-a-date")).toBe(null);
  });

  it("formats date string to ISO format", () => {
    const result = formatISODate("2024-03-15T10:30:00Z");
    expect(result).toBe("2024-03-15");
  });

  it("formats Date object to ISO format", () => {
    const date = new Date(Date.UTC(2024, 2, 15));
    const result = formatISODate(date);
    expect(result).toBe("2024-03-15");
  });
});

describe("startOfDay", () => {
  it("sets time to midnight", () => {
    const date = new Date(2024, 2, 15, 10, 30, 45, 123);
    const result = startOfDay(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("preserves the date", () => {
    const date = new Date(2024, 2, 15, 10, 30);
    const result = startOfDay(date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });
});

describe("endOfDay", () => {
  it("sets time to end of day", () => {
    const date = new Date(2024, 2, 15, 10, 30);
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("preserves the date", () => {
    const date = new Date(2024, 2, 15, 10, 30);
    const result = endOfDay(date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });
});

describe("isToday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for today at midnight", () => {
    const date = new Date(2024, 2, 15, 0, 0, 0);
    expect(isToday(date)).toBe(true);
  });

  it("returns true for today at end of day", () => {
    const date = new Date(2024, 2, 15, 23, 59, 59);
    expect(isToday(date)).toBe(true);
  });

  it("returns false for yesterday", () => {
    const date = new Date(2024, 2, 14);
    expect(isToday(date)).toBe(false);
  });

  it("returns false for tomorrow", () => {
    const date = new Date(2024, 2, 16);
    expect(isToday(date)).toBe(false);
  });
});

describe("isPast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for yesterday", () => {
    const date = new Date(2024, 2, 14);
    expect(isPast(date)).toBe(true);
  });

  it("returns false for today", () => {
    const date = new Date(2024, 2, 15, 10, 0, 0);
    expect(isPast(date)).toBe(false);
  });

  it("returns false for tomorrow", () => {
    const date = new Date(2024, 2, 16);
    expect(isPast(date)).toBe(false);
  });
});

describe("isFuture", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for yesterday", () => {
    const date = new Date(2024, 2, 14);
    expect(isFuture(date)).toBe(false);
  });

  it("returns false for today", () => {
    const date = new Date(2024, 2, 15, 23, 59, 59);
    expect(isFuture(date)).toBe(false);
  });

  it("returns true for tomorrow", () => {
    const date = new Date(2024, 2, 16);
    expect(isFuture(date)).toBe(true);
  });
});

describe("calculateAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 15)); // March 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates age correctly for birthday already passed this year", () => {
    const dob = new Date(1990, 0, 15); // January 15, 1990
    expect(calculateAge(dob)).toBe(34);
  });

  it("calculates age correctly for birthday not yet passed this year", () => {
    const dob = new Date(1990, 5, 15); // June 15, 1990
    expect(calculateAge(dob)).toBe(33);
  });

  it("calculates age correctly for birthday today", () => {
    const dob = new Date(1990, 2, 15); // March 15, 1990
    expect(calculateAge(dob)).toBe(34);
  });

  it("calculates age for recent birth", () => {
    const dob = new Date(2023, 5, 15); // June 15, 2023
    expect(calculateAge(dob)).toBe(0);
  });
});

describe("getMonthName", () => {
  it("returns correct month name for January (1)", () => {
    expect(getMonthName(1)).toBe("January");
  });

  it("returns correct month name for December (12)", () => {
    expect(getMonthName(12)).toBe("December");
  });

  it("returns empty string for invalid month (0)", () => {
    expect(getMonthName(0)).toBe("");
  });

  it("returns empty string for invalid month (13)", () => {
    expect(getMonthName(13)).toBe("");
  });

  it("returns correct month name for June (6)", () => {
    expect(getMonthName(6)).toBe("June");
  });
});

describe("createUTCDate", () => {
  it("creates UTC date with correct components", () => {
    const date = createUTCDate(2024, 3, 15);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(2); // 0-indexed
    expect(date.getUTCDate()).toBe(15);
  });

  it("creates date at UTC midnight", () => {
    const date = createUTCDate(2024, 3, 15);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });
});

describe("parseDateToUTC", () => {
  it("returns null for null input", () => {
    expect(parseDateToUTC(null)).toBe(null);
  });

  it("returns null for invalid date", () => {
    expect(parseDateToUTC("not-a-date")).toBe(null);
  });

  it("normalizes date to UTC midnight", () => {
    const result = parseDateToUTC("2024-03-15T10:30:00");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getUTCHours()).toBe(0);
    expect(result?.getUTCMinutes()).toBe(0);
  });
});

describe("isValidDateInput", () => {
  it("returns false for null", () => {
    expect(isValidDateInput(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidDateInput(undefined)).toBe(false);
  });

  it("returns false for number", () => {
    expect(isValidDateInput(123)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidDateInput("")).toBe(false);
  });

  it("returns true for non-empty string", () => {
    expect(isValidDateInput("2024-03-15")).toBe(true);
  });

  it("returns true for valid Date object", () => {
    expect(isValidDateInput(new Date())).toBe(true);
  });

  it("returns false for Invalid Date object", () => {
    expect(isValidDateInput(new Date("invalid"))).toBe(false);
  });

  it("returns false for object", () => {
    expect(isValidDateInput({})).toBe(false);
  });

  it("returns false for array", () => {
    expect(isValidDateInput([])).toBe(false);
  });
});
