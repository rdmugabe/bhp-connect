import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { parseJsonBody, parseJsonObjectBody, isPlainObject } from "@/lib/api-utils";

// Mock request factory
function createMockRequest(body: string | null = null): NextRequest {
  return {
    url: "http://localhost:3000/api/test",
    json: async () => {
      if (body === null) {
        throw new TypeError("Body is unusable");
      }
      return JSON.parse(body);
    },
    headers: new Map(),
  } as unknown as NextRequest;
}

function createErrorRequest(error: Error): NextRequest {
  return {
    url: "http://localhost:3000/api/test",
    json: async () => { throw error; },
    headers: new Map(),
  } as unknown as NextRequest;
}

describe("Additional parseJsonBody tests", () => {
  describe("Real-world JSON patterns", () => {
    it("parses JSON with ISO date strings", async () => {
      const body = { createdAt: "2024-03-15T10:30:00.000Z" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, string>).createdAt).toBe("2024-03-15T10:30:00.000Z");
      }
    });

    it("parses JSON with UUID strings", async () => {
      const body = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with base64 encoded data", async () => {
      const body = { data: "SGVsbG8gV29ybGQ=" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with very long text content", async () => {
      const longText = "Lorem ipsum ".repeat(1000);
      const body = { content: longText };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, string>).content).toBe(longText);
      }
    });

    it("parses JSON with HTML content", async () => {
      const body = { html: "<div class=\"test\">Hello <strong>World</strong></div>" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with SQL-like strings (not injection)", async () => {
      const body = { query: "SELECT * FROM users WHERE id = 1" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with newlines in string values", async () => {
      const body = { text: "Line 1\nLine 2\nLine 3" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with tabs in string values", async () => {
      const body = { text: "Column1\tColumn2\tColumn3" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with backslashes", async () => {
      const body = { path: "C:\\Users\\Test\\Documents" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with forward slashes in URLs", async () => {
      const body = { url: "https://example.com/api/v1/users" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Numeric edge cases", () => {
    it("parses JSON with zero", async () => {
      const body = { value: 0 };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, number>).value).toBe(0);
      }
    });

    it("parses JSON with negative zero", async () => {
      const body = { value: -0 };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with very large integer", async () => {
      const body = { value: 9007199254740991 }; // Max safe integer
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with very small number", async () => {
      const body = { value: 0.000000001 };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Array variations", () => {
    it("parses nested arrays", async () => {
      const body = { matrix: [[1, 2], [3, 4], [5, 6]] };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses array with null elements", async () => {
      const body = { values: [1, null, 3, null, 5] };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses array with empty string elements", async () => {
      const body = { values: ["a", "", "b", "", "c"] };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Object key variations", () => {
    it("parses JSON with numeric-looking keys", async () => {
      const body = { "123": "value1", "456": "value2" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with empty string key", async () => {
      const body = { "": "empty key value" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with underscore-prefixed keys", async () => {
      const body = { _private: "value", __dunder__: "another" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with camelCase keys", async () => {
      const body = { firstName: "John", lastName: "Doe" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses JSON with snake_case keys", async () => {
      const body = { first_name: "John", last_name: "Doe" };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });
});

describe("Additional isPlainObject tests", () => {
  it("returns true for Object.create(null)", () => {
    const obj = Object.create(null);
    obj.key = "value";
    expect(isPlainObject(obj)).toBe(true);
  });

  it("returns false for Symbol", () => {
    expect(isPlainObject(Symbol("test"))).toBe(false);
  });

  it("returns false for BigInt", () => {
    expect(isPlainObject(BigInt(123))).toBe(false);
  });
});

describe("Error message consistency", () => {
  it("returns consistent error message for SyntaxError", async () => {
    const request = createErrorRequest(new SyntaxError("test"));
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Invalid JSON in request body");
    }
  });

  it("returns consistent error message for TypeError with body", async () => {
    const error = new TypeError("Test body error");
    error.message = "body related error";
    const request = createErrorRequest(error);
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Request body is required");
    }
  });

  it("returns consistent error for parseJsonObjectBody with non-object", async () => {
    const request = createMockRequest('"string"');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Request body must be a JSON object");
    }
  });
});
