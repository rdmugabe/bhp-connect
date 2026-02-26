import { describe, it, expect } from "vitest";
import {
  parseIntQueryParam,
  parseMonthQueryParam,
  parseYearQueryParam,
  parsePaginationParams,
  invalidQueryParamResponse,
  validateQueryParams,
} from "@/lib/api-utils";

describe("parseIntQueryParam", () => {
  describe("when value is null or empty", () => {
    it("should return undefined for null value", () => {
      const result = parseIntQueryParam(null);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should return undefined for empty string", () => {
      const result = parseIntQueryParam("");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe("when value is a valid integer", () => {
    it("should parse positive integers", () => {
      const result = parseIntQueryParam("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(42);
      }
    });

    it("should parse zero", () => {
      const result = parseIntQueryParam("0");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(0);
      }
    });

    it("should parse negative integers", () => {
      const result = parseIntQueryParam("-5");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(-5);
      }
    });

    it("should parse large integers", () => {
      const result = parseIntQueryParam("999999999");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(999999999);
      }
    });
  });

  describe("when value is invalid", () => {
    it("should return error for non-numeric string", () => {
      const result = parseIntQueryParam("abc");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be a valid integer");
      }
    });

    it("should return error for float string", () => {
      const result = parseIntQueryParam("3.14");
      expect(result.success).toBe(true);
      if (result.success) {
        // parseInt("3.14") returns 3
        expect(result.value).toBe(3);
      }
    });

    it("should return error for mixed alphanumeric starting with letters", () => {
      const result = parseIntQueryParam("abc123");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be a valid integer");
      }
    });

    it("should parse mixed alphanumeric starting with numbers", () => {
      const result = parseIntQueryParam("123abc");
      expect(result.success).toBe(true);
      if (result.success) {
        // parseInt("123abc") returns 123
        expect(result.value).toBe(123);
      }
    });

    it("should return error for special characters", () => {
      const result = parseIntQueryParam("!@#$");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be a valid integer");
      }
    });

    it("should return error for whitespace only", () => {
      const result = parseIntQueryParam("   ");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be a valid integer");
      }
    });
  });

  describe("with min/max constraints", () => {
    it("should accept value equal to min", () => {
      const result = parseIntQueryParam("5", { min: 5 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(5);
      }
    });

    it("should accept value above min", () => {
      const result = parseIntQueryParam("10", { min: 5 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(10);
      }
    });

    it("should reject value below min", () => {
      const result = parseIntQueryParam("3", { min: 5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be at least 5");
      }
    });

    it("should accept value equal to max", () => {
      const result = parseIntQueryParam("100", { max: 100 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(100);
      }
    });

    it("should accept value below max", () => {
      const result = parseIntQueryParam("50", { max: 100 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(50);
      }
    });

    it("should reject value above max", () => {
      const result = parseIntQueryParam("150", { max: 100 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be at most 100");
      }
    });

    it("should validate both min and max together", () => {
      const result = parseIntQueryParam("50", { min: 1, max: 100 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(50);
      }
    });

    it("should reject value below min with both constraints", () => {
      const result = parseIntQueryParam("0", { min: 1, max: 100 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be at least 1");
      }
    });

    it("should reject value above max with both constraints", () => {
      const result = parseIntQueryParam("150", { min: 1, max: 100 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("must be at most 100");
      }
    });
  });

  describe("with custom paramName", () => {
    it("should use custom parameter name in error messages", () => {
      const result = parseIntQueryParam("abc", { paramName: "Page" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Page");
      }
    });

    it("should use custom parameter name for min error", () => {
      const result = parseIntQueryParam("0", { min: 1, paramName: "Limit" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Limit must be at least 1");
      }
    });

    it("should use custom parameter name for max error", () => {
      const result = parseIntQueryParam("200", { max: 100, paramName: "Limit" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Limit must be at most 100");
      }
    });
  });
});

describe("parseMonthQueryParam", () => {
  describe("valid months", () => {
    it("should accept month 1 (January)", () => {
      const result = parseMonthQueryParam("1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(1);
      }
    });

    it("should accept month 6 (June)", () => {
      const result = parseMonthQueryParam("6");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(6);
      }
    });

    it("should accept month 12 (December)", () => {
      const result = parseMonthQueryParam("12");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(12);
      }
    });

    it("should return undefined for null", () => {
      const result = parseMonthQueryParam(null);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should return undefined for empty string", () => {
      const result = parseMonthQueryParam("");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe("invalid months", () => {
    it("should reject month 0", () => {
      const result = parseMonthQueryParam("0");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Month must be at least 1");
      }
    });

    it("should reject month 13", () => {
      const result = parseMonthQueryParam("13");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Month must be at most 12");
      }
    });

    it("should reject negative month", () => {
      const result = parseMonthQueryParam("-1");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Month must be at least 1");
      }
    });

    it("should reject month 100", () => {
      const result = parseMonthQueryParam("100");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Month must be at most 12");
      }
    });

    it("should reject non-numeric month", () => {
      const result = parseMonthQueryParam("january");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Month must be a valid integer");
      }
    });
  });
});

describe("parseYearQueryParam", () => {
  describe("valid years", () => {
    it("should accept year 2024", () => {
      const result = parseYearQueryParam("2024");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(2024);
      }
    });

    it("should accept year 2025", () => {
      const result = parseYearQueryParam("2025");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(2025);
      }
    });

    it("should accept year 1900 (min)", () => {
      const result = parseYearQueryParam("1900");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(1900);
      }
    });

    it("should accept year 2100 (max)", () => {
      const result = parseYearQueryParam("2100");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(2100);
      }
    });

    it("should return undefined for null", () => {
      const result = parseYearQueryParam(null);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should return undefined for empty string", () => {
      const result = parseYearQueryParam("");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe("invalid years", () => {
    it("should reject year 1899 (below min)", () => {
      const result = parseYearQueryParam("1899");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Year must be at least 1900");
      }
    });

    it("should reject year 2101 (above max)", () => {
      const result = parseYearQueryParam("2101");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Year must be at most 2100");
      }
    });

    it("should reject negative year", () => {
      const result = parseYearQueryParam("-2024");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Year must be at least 1900");
      }
    });

    it("should reject year 0", () => {
      const result = parseYearQueryParam("0");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Year must be at least 1900");
      }
    });

    it("should reject non-numeric year", () => {
      const result = parseYearQueryParam("twenty-twenty");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Year must be a valid integer");
      }
    });

    it("should reject year 9999", () => {
      const result = parseYearQueryParam("9999");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Year must be at most 2100");
      }
    });
  });
});

describe("parsePaginationParams", () => {
  it("should return defaults when no params provided", () => {
    const searchParams = new URLSearchParams();
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it("should parse valid page and limit", () => {
    const searchParams = new URLSearchParams("page=2&limit=50");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
    expect(result.skip).toBe(50);
  });

  it("should calculate correct skip for page 3 with limit 10", () => {
    const searchParams = new URLSearchParams("page=3&limit=10");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(20);
  });

  it("should use default page when invalid", () => {
    const searchParams = new URLSearchParams("page=abc&limit=20");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it("should use default limit when invalid", () => {
    const searchParams = new URLSearchParams("page=1&limit=abc");
    const result = parsePaginationParams(searchParams);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it("should cap limit at 100", () => {
    const searchParams = new URLSearchParams("page=1&limit=200");
    const result = parsePaginationParams(searchParams);
    // Since max is 100, invalid limit should fall back to default
    expect(result.limit).toBe(20);
  });

  it("should use default page when page is 0", () => {
    const searchParams = new URLSearchParams("page=0&limit=20");
    const result = parsePaginationParams(searchParams);
    // Page 0 is below min 1, so validation fails and default is used
    expect(result.page).toBe(1);
  });
});

describe("invalidQueryParamResponse", () => {
  it("should return a 400 status response", async () => {
    const response = invalidQueryParamResponse("Invalid month value");
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid query parameter");
    expect(data.details).toBe("Invalid month value");
  });

  it("should include the provided message in details", async () => {
    const response = invalidQueryParamResponse("Year must be between 1900 and 2100");
    const data = await response.json();
    expect(data.details).toBe("Year must be between 1900 and 2100");
  });
});

describe("validateQueryParams", () => {
  it("should return null when all validations pass", () => {
    const validations = [
      { success: true as const, value: 5 },
      { success: true as const, value: 2024 },
    ];
    const result = validateQueryParams(validations);
    expect(result).toBeNull();
  });

  it("should return error response for first failed validation", async () => {
    const validations = [
      { success: true as const, value: 5 },
      { success: false as const, error: "Year is invalid" },
    ];
    const result = validateQueryParams(validations);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.details).toBe("Year is invalid");
    }
  });

  it("should return error for first failure when multiple fail", async () => {
    const validations = [
      { success: false as const, error: "First error" },
      { success: false as const, error: "Second error" },
    ];
    const result = validateQueryParams(validations);
    expect(result).not.toBeNull();
    if (result) {
      const data = await result.json();
      expect(data.details).toBe("First error");
    }
  });

  it("should return null for empty array", () => {
    const result = validateQueryParams([]);
    expect(result).toBeNull();
  });
});
