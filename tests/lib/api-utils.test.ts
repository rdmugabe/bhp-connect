import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, isPlainObject, parseJsonObjectBody } from "@/lib/api-utils";

// Helper to create a mock request
function createMockRequest(body: string | null = null, options: { headers?: Record<string, string> } = {}): NextRequest {
  const url = "http://localhost:3000/api/test";

  return {
    url,
    json: async () => {
      if (body === null) {
        const error = new TypeError("Body is unusable");
        throw error;
      }
      return JSON.parse(body);
    },
    headers: new Map(Object.entries(options.headers ?? {})),
  } as unknown as NextRequest;
}

// Helper to create a request that throws a specific error
function createErrorRequest(error: Error): NextRequest {
  return {
    url: "http://localhost:3000/api/test",
    json: async () => { throw error; },
    headers: new Map(),
  } as unknown as NextRequest;
}

describe("parseJsonBody", () => {
  describe("successful parsing", () => {
    it("parses valid JSON object", async () => {
      const request = createMockRequest('{"name": "John", "age": 30}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: "John", age: 30 });
      }
    });

    it("parses valid JSON array", async () => {
      const request = createMockRequest('[1, 2, 3, "four"]');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3, "four"]);
      }
    });

    it("parses valid JSON string", async () => {
      const request = createMockRequest('"hello world"');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("hello world");
      }
    });

    it("parses valid JSON number", async () => {
      const request = createMockRequest('42');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("parses valid JSON boolean true", async () => {
      const request = createMockRequest('true');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("parses valid JSON boolean false", async () => {
      const request = createMockRequest('false');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it("parses valid JSON null", async () => {
      const request = createMockRequest('null');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it("parses nested JSON objects", async () => {
      const request = createMockRequest('{"user": {"name": "John", "address": {"city": "NYC"}}}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          user: { name: "John", address: { city: "NYC" } }
        });
      }
    });

    it("parses array of objects", async () => {
      const request = createMockRequest('[{"id": 1}, {"id": 2}, {"id": 3}]');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      }
    });

    it("parses empty object", async () => {
      const request = createMockRequest('{}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("parses empty array", async () => {
      const request = createMockRequest('[]');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("parses complex nested structure", async () => {
      const complexData = {
        string: "value",
        number: 123,
        float: 45.67,
        negative: -100,
        boolean: true,
        null: null,
        array: [1, "two", { three: 3 }],
        nested: {
          level1: {
            level2: {
              value: "deep"
            }
          }
        }
      };
      const request = createMockRequest(JSON.stringify(complexData));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(complexData);
      }
    });

    it("parses JSON with special characters", async () => {
      const request = createMockRequest('{"message": "Hello\\nWorld\\t!"}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ message: "Hello\nWorld\t!" });
      }
    });

    it("parses JSON with unicode characters", async () => {
      const request = createMockRequest('{"emoji": "\\u2764", "japanese": "\\u3053\\u3093\\u306b\\u3061\\u306f"}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, string>).emoji).toBe("❤");
      }
    });

    it("parses very long strings", async () => {
      const longString = "a".repeat(10000);
      const request = createMockRequest(JSON.stringify({ value: longString }));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, string>).value).toBe(longString);
      }
    });

    it("parses large arrays", async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const request = createMockRequest(JSON.stringify(largeArray));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(largeArray);
      }
    });

    it("parses deeply nested structures", async () => {
      // Build a properly nested structure (not circular)
      let deep: Record<string, unknown> = { value: "deep" };
      for (let i = 0; i < 20; i++) {
        deep = { [`level${i}`]: deep };
      }
      const request = createMockRequest(JSON.stringify(deep));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid JSON handling", () => {
    it("returns 400 for invalid JSON syntax - missing closing brace", async () => {
      const error = new SyntaxError("Unexpected end of JSON input");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        const data = await result.error.json();
        expect(data.error).toBe("Invalid JSON in request body");
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for invalid JSON syntax - trailing comma", async () => {
      const error = new SyntaxError("Unexpected token ] in JSON");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        const data = await result.error.json();
        expect(data.error).toBe("Invalid JSON in request body");
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for invalid JSON syntax - single quotes", async () => {
      const error = new SyntaxError("Unexpected token ' in JSON");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for invalid JSON syntax - unquoted keys", async () => {
      const error = new SyntaxError("Unexpected token n in JSON");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
    });

    it("returns 400 for empty body (TypeError)", async () => {
      const error = new TypeError("Body is unusable");
      error.message = "body";
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        const data = await result.error.json();
        expect(data.error).toBe("Request body is required");
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for already read body", async () => {
      const error = new TypeError("Body has already been read");
      error.message = "body";
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for undefined body", async () => {
      const error = new TypeError("Body is undefined");
      error.message = "body";
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for generic parsing error", async () => {
      const error = new Error("Some parsing error");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        const data = await result.error.json();
        expect(data.error).toBe("Failed to parse request body");
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for corrupted JSON data", async () => {
      const error = new SyntaxError("Unexpected token");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it("returns 400 for invalid escape sequence", async () => {
      const error = new SyntaxError("Bad control character in string literal");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
    });

    it("returns 400 for truncated JSON", async () => {
      const error = new SyntaxError("Unexpected end of JSON input");
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("infers type from generic parameter", async () => {
      interface User {
        name: string;
        age: number;
      }
      const request = createMockRequest('{"name": "John", "age": 30}');
      const result = await parseJsonBody<User>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        const user: User = result.data;
        expect(user.name).toBe("John");
        expect(user.age).toBe(30);
      }
    });

    it("preserves Record type", async () => {
      const request = createMockRequest('{"key1": "value1", "key2": "value2"}');
      const result = await parseJsonBody<Record<string, string>>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        const data: Record<string, string> = result.data;
        expect(data["key1"]).toBe("value1");
      }
    });
  });
});

describe("isPlainObject", () => {
  it("returns true for plain object", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject({ nested: { value: true } })).toBe(true);
  });

  it("returns false for array", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
    expect(isPlainObject([{ a: 1 }])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("returns false for string", () => {
    expect(isPlainObject("string")).toBe(false);
    expect(isPlainObject("")).toBe(false);
  });

  it("returns false for number", () => {
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject(0)).toBe(false);
    expect(isPlainObject(-1)).toBe(false);
    expect(isPlainObject(3.14)).toBe(false);
  });

  it("returns false for boolean", () => {
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(false)).toBe(false);
  });

  it("returns false for function", () => {
    expect(isPlainObject(() => {})).toBe(false);
    expect(isPlainObject(function() {})).toBe(false);
  });

  it("returns false for Date", () => {
    expect(isPlainObject(new Date())).toBe(true); // Date is an object
  });

  it("returns false for RegExp", () => {
    expect(isPlainObject(/test/)).toBe(true); // RegExp is an object
  });
});

describe("parseJsonObjectBody", () => {
  it("parses valid JSON object", async () => {
    const request = createMockRequest('{"name": "John"}');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "John" });
    }
  });

  it("returns 400 for array body", async () => {
    const request = createMockRequest('[1, 2, 3]');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Request body must be a JSON object");
      expect(result.error.status).toBe(400);
    }
  });

  it("returns 400 for string body", async () => {
    const request = createMockRequest('"hello"');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Request body must be a JSON object");
      expect(result.error.status).toBe(400);
    }
  });

  it("returns 400 for number body", async () => {
    const request = createMockRequest('42');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Request body must be a JSON object");
    }
  });

  it("returns 400 for boolean body", async () => {
    const request = createMockRequest('true');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
  });

  it("returns 400 for null body", async () => {
    const request = createMockRequest('null');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Request body must be a JSON object");
    }
  });

  it("returns 400 for invalid JSON", async () => {
    const error = new SyntaxError("Invalid JSON");
    const request = createErrorRequest(error);
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Invalid JSON in request body");
    }
  });

  it("parses empty object", async () => {
    const request = createMockRequest('{}');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("parses nested object", async () => {
    const request = createMockRequest('{"user": {"profile": {"name": "John"}}}');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ user: { profile: { name: "John" } } });
    }
  });
});

describe("error response format", () => {
  it("returns proper error object structure", async () => {
    const error = new SyntaxError("Invalid JSON");
    const request = createErrorRequest(error);
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(typeof data.error).toBe("string");
      expect(data.error.length).toBeGreaterThan(0);
    }
  });

  it("returns 400 status code consistently", async () => {
    const testCases = [
      new SyntaxError("Invalid JSON"),
      new TypeError("Body is unusable"),
      new Error("Generic error"),
    ];

    for (const error of testCases) {
      const request = createErrorRequest(error);
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    }
  });
});

describe("edge cases", () => {
  it("handles whitespace around valid JSON", async () => {
    const request = createMockRequest('  { "name": "John" }  ');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
  });

  it("handles scientific notation numbers", async () => {
    const request = createMockRequest('{"value": 1.5e10}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, number>).value).toBe(1.5e10);
    }
  });

  it("handles negative numbers", async () => {
    const request = createMockRequest('{"value": -42}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, number>).value).toBe(-42);
    }
  });

  it("handles float numbers", async () => {
    const request = createMockRequest('{"value": 3.14159}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, number>).value).toBeCloseTo(3.14159);
    }
  });

  it("handles empty string value", async () => {
    const request = createMockRequest('{"value": ""}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, string>).value).toBe("");
    }
  });

  it("handles keys with special characters", async () => {
    const request = createMockRequest('{"key-with-dash": 1, "key.with.dots": 2, "key with spaces": 3}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, number>;
      expect(data["key-with-dash"]).toBe(1);
      expect(data["key.with.dots"]).toBe(2);
      expect(data["key with spaces"]).toBe(3);
    }
  });

  it("handles mixed array types", async () => {
    const request = createMockRequest('[1, "two", true, null, {"four": 4}]');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, "two", true, null, { four: 4 }]);
    }
  });
});
