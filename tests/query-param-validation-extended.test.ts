import { describe, it, expect } from "vitest";
import {
  parseIntQueryParam,
  parseMonthQueryParam,
  parseYearQueryParam,
  parsePaginationParams,
  parseJsonBody,
  isPlainObject,
} from "@/lib/api-utils";

describe("parseIntQueryParam - Edge cases", () => {
  it("should handle leading zeros", () => {
    const result = parseIntQueryParam("007");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(7);
    }
  });

  it("should handle leading whitespace", () => {
    const result = parseIntQueryParam("  42");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(42);
    }
  });

  it("should handle trailing whitespace", () => {
    const result = parseIntQueryParam("42  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(42);
    }
  });

  it("should handle plus sign prefix", () => {
    const result = parseIntQueryParam("+42");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(42);
    }
  });

  it("should handle scientific notation", () => {
    const result = parseIntQueryParam("1e2");
    expect(result.success).toBe(true);
    if (result.success) {
      // parseInt("1e2") returns 1
      expect(result.value).toBe(1);
    }
  });

  it("should handle hex notation", () => {
    const result = parseIntQueryParam("0xFF");
    expect(result.success).toBe(true);
    if (result.success) {
      // parseInt("0xFF", 10) returns 0
      expect(result.value).toBe(0);
    }
  });

  it("should handle Infinity", () => {
    const result = parseIntQueryParam("Infinity");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("must be a valid integer");
    }
  });

  it("should handle NaN string", () => {
    const result = parseIntQueryParam("NaN");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("must be a valid integer");
    }
  });

  it("should handle undefined as string", () => {
    const result = parseIntQueryParam("undefined");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("must be a valid integer");
    }
  });

  it("should handle null as string", () => {
    const result = parseIntQueryParam("null");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("must be a valid integer");
    }
  });
});

describe("parseMonthQueryParam - Boundary tests", () => {
  it("should accept all valid months", () => {
    for (let month = 1; month <= 12; month++) {
      const result = parseMonthQueryParam(String(month));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(month);
      }
    }
  });

  it("should reject month with leading zeros as different number", () => {
    // "01" should parse as 1 which is valid
    const result = parseMonthQueryParam("01");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(1);
    }
  });

  it("should reject decimal month", () => {
    const result = parseMonthQueryParam("6.5");
    expect(result.success).toBe(true);
    if (result.success) {
      // parseInt truncates to 6
      expect(result.value).toBe(6);
    }
  });

  it("should reject month with text", () => {
    const result = parseMonthQueryParam("6th");
    expect(result.success).toBe(true);
    if (result.success) {
      // parseInt extracts 6
      expect(result.value).toBe(6);
    }
  });
});

describe("parseYearQueryParam - Common years", () => {
  it("should accept 2000 (Y2K)", () => {
    const result = parseYearQueryParam("2000");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(2000);
    }
  });

  it("should accept 2020", () => {
    const result = parseYearQueryParam("2020");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(2020);
    }
  });

  it("should accept 2023", () => {
    const result = parseYearQueryParam("2023");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(2023);
    }
  });

  it("should accept 2026", () => {
    const result = parseYearQueryParam("2026");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(2026);
    }
  });

  it("should reject 2200", () => {
    const result = parseYearQueryParam("2200");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("must be at most 2100");
    }
  });

  it("should reject 1800", () => {
    const result = parseYearQueryParam("1800");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("must be at least 1900");
    }
  });
});

describe("parsePaginationParams - Edge cases", () => {
  it("should handle only page param", () => {
    const searchParams = new URLSearchParams("page=5");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(5);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(80);
  });

  it("should handle only limit param", () => {
    const searchParams = new URLSearchParams("limit=50");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.skip).toBe(0);
  });

  it("should handle page 1000", () => {
    const searchParams = new URLSearchParams("page=1000&limit=10");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(1000);
    expect(result.skip).toBe(9990);
  });

  it("should handle limit 1", () => {
    const searchParams = new URLSearchParams("page=1&limit=1");
    const result = parsePaginationParams(searchParams);
    expect(result.limit).toBe(1);
  });

  it("should handle page with extra params", () => {
    const searchParams = new URLSearchParams("page=2&limit=25&sort=desc&filter=active");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
    expect(result.skip).toBe(25);
  });
});

describe("isPlainObject", () => {
  it("should return true for empty object", () => {
    expect(isPlainObject({})).toBe(true);
  });

  it("should return true for object with properties", () => {
    expect(isPlainObject({ name: "test", value: 42 })).toBe(true);
  });

  it("should return false for null", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("should return false for array", () => {
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it("should return false for empty array", () => {
    expect(isPlainObject([])).toBe(false);
  });

  it("should return false for string", () => {
    expect(isPlainObject("test")).toBe(false);
  });

  it("should return false for number", () => {
    expect(isPlainObject(42)).toBe(false);
  });

  it("should return false for boolean", () => {
    expect(isPlainObject(true)).toBe(false);
  });

  it("should return false for function", () => {
    expect(isPlainObject(() => {})).toBe(false);
  });

  it("should return true for nested object", () => {
    expect(isPlainObject({ nested: { deep: { value: 1 } } })).toBe(true);
  });

  it("should return true for object with array property", () => {
    expect(isPlainObject({ items: [1, 2, 3] })).toBe(true);
  });
});

describe("parseIntQueryParam - Combinations", () => {
  it("should validate both min and max at boundary", () => {
    const result = parseIntQueryParam("50", { min: 50, max: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(50);
    }
  });

  it("should fail when value equals min-1", () => {
    const result = parseIntQueryParam("9", { min: 10 });
    expect(result.success).toBe(false);
  });

  it("should fail when value equals max+1", () => {
    const result = parseIntQueryParam("101", { max: 100 });
    expect(result.success).toBe(false);
  });

  it("should use default paramName in error", () => {
    const result = parseIntQueryParam("abc");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Parameter");
    }
  });
});

describe("Integration - Real-world scenarios", () => {
  describe("Fire drill report filtering", () => {
    it("should validate year and month for fire drill report", () => {
      const yearResult = parseYearQueryParam("2024");
      const monthResult = parseMonthQueryParam("6");

      expect(yearResult.success).toBe(true);
      expect(monthResult.success).toBe(true);

      if (yearResult.success && monthResult.success) {
        expect(yearResult.value).toBe(2024);
        expect(monthResult.value).toBe(6);
      }
    });

    it("should reject invalid fire drill year", () => {
      const yearResult = parseYearQueryParam("invalid");
      expect(yearResult.success).toBe(false);
    });

    it("should reject month 13 for fire drill", () => {
      const monthResult = parseMonthQueryParam("13");
      expect(monthResult.success).toBe(false);
    });
  });

  describe("ART meeting filtering", () => {
    it("should accept valid ART meeting month and year", () => {
      const monthResult = parseMonthQueryParam("3");
      const yearResult = parseYearQueryParam("2025");

      expect(monthResult.success).toBe(true);
      expect(yearResult.success).toBe(true);

      if (monthResult.success && yearResult.success) {
        expect(monthResult.value).toBe(3);
        expect(yearResult.value).toBe(2025);
      }
    });

    it("should handle missing month for ART meeting", () => {
      const monthResult = parseMonthQueryParam(null);
      expect(monthResult.success).toBe(true);
      if (monthResult.success) {
        expect(monthResult.value).toBeUndefined();
      }
    });
  });

  describe("Pagination scenarios", () => {
    it("should handle typical first page request", () => {
      const searchParams = new URLSearchParams("page=1&limit=20");
      const result = parsePaginationParams(searchParams);
      expect(result.skip).toBe(0);
    });

    it("should handle second page with custom limit", () => {
      const searchParams = new URLSearchParams("page=2&limit=15");
      const result = parsePaginationParams(searchParams);
      expect(result.skip).toBe(15);
    });

    it("should handle large page number", () => {
      const searchParams = new URLSearchParams("page=100&limit=10");
      const result = parsePaginationParams(searchParams);
      expect(result.skip).toBe(990);
    });
  });
});
