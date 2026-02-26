import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody, parseJsonObjectBody, isPlainObject } from '@/lib/api-utils';

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, init) => ({
        body,
        status: init?.status || 200,
        json: async () => body,
      })),
    },
  };
});

// Helper to create a mock request with a body
function createMockRequest(body: string | null, contentType = 'application/json'): NextRequest {
  const headers = new Headers();
  headers.set('Content-Type', contentType);

  return {
    json: async () => {
      if (body === null) {
        throw new TypeError('body is null');
      }
      return JSON.parse(body);
    },
    headers,
  } as unknown as NextRequest;
}

// Helper to create a mock request that throws a specific error
function createMockRequestWithError(error: Error): NextRequest {
  return {
    json: async () => {
      throw error;
    },
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe('parseJsonBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful parsing', () => {
    it('should parse valid JSON object', async () => {
      const request = createMockRequest('{"name":"test","value":123}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'test', value: 123 });
      }
    });

    it('should parse valid JSON array', async () => {
      const request = createMockRequest('[1,2,3]');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3]);
      }
    });

    it('should parse valid JSON string', async () => {
      const request = createMockRequest('"hello"');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('should parse valid JSON number', async () => {
      const request = createMockRequest('42');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should parse valid JSON boolean', async () => {
      const request = createMockRequest('true');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should parse valid JSON null', async () => {
      const request = createMockRequest('null');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it('should parse nested JSON objects', async () => {
      const request = createMockRequest('{"user":{"name":"test","roles":["admin","user"]}}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          user: { name: 'test', roles: ['admin', 'user'] },
        });
      }
    });

    it('should parse empty JSON object', async () => {
      const request = createMockRequest('{}');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it('should parse empty JSON array', async () => {
      const request = createMockRequest('[]');
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('error handling - malformed JSON', () => {
    it('should return 400 for malformed JSON - missing closing brace', async () => {
      const request = createMockRequestWithError(new SyntaxError('Unexpected end of JSON input'));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Invalid JSON in request body');
      }
    });

    it('should return 400 for malformed JSON - invalid syntax', async () => {
      const request = createMockRequestWithError(new SyntaxError('Unexpected token'));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Invalid JSON in request body');
      }
    });

    it('should return 400 for malformed JSON - trailing comma', async () => {
      const request = createMockRequestWithError(new SyntaxError('Unexpected token ]'));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for malformed JSON - unquoted keys', async () => {
      const request = createMockRequestWithError(new SyntaxError('Unexpected token n'));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for malformed JSON - single quotes', async () => {
      const request = createMockRequestWithError(new SyntaxError('Unexpected token \''));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });
  });

  describe('error handling - empty/null body', () => {
    it('should return 400 for empty body (TypeError)', async () => {
      const request = createMockRequestWithError(new TypeError('body stream already read'));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for null body', async () => {
      const request = createMockRequestWithError(new TypeError('body is null'));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Request body is required');
      }
    });
  });

  describe('error handling - other errors', () => {
    it('should return 400 for unexpected errors', async () => {
      const request = createMockRequestWithError(new Error('Unexpected error'));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Failed to parse request body');
      }
    });
  });

  describe('type inference', () => {
    it('should properly infer typed data', async () => {
      const request = createMockRequest('{"name":"test","age":25}');
      const result = await parseJsonBody<{ name: string; age: number }>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        // TypeScript should infer the correct types
        const name: string = result.data.name;
        const age: number = result.data.age;
        expect(name).toBe('test');
        expect(age).toBe(25);
      }
    });
  });
});

describe('parseJsonObjectBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful parsing', () => {
    it('should parse valid JSON object', async () => {
      const request = createMockRequest('{"name":"test"}');
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'test' });
      }
    });

    it('should parse empty JSON object', async () => {
      const request = createMockRequest('{}');
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });
  });

  describe('error handling - non-object values', () => {
    it('should return 400 for JSON array', async () => {
      const request = createMockRequest('[1,2,3]');
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Request body must be a JSON object');
      }
    });

    it('should return 400 for JSON string', async () => {
      const request = createMockRequest('"hello"');
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Request body must be a JSON object');
      }
    });

    it('should return 400 for JSON number', async () => {
      const request = createMockRequest('42');
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Request body must be a JSON object');
      }
    });

    it('should return 400 for JSON boolean', async () => {
      const request = createMockRequest('true');
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for JSON null', async () => {
      const request = createMockRequest('null');
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });
  });

  describe('error handling - malformed JSON', () => {
    it('should return 400 for malformed JSON', async () => {
      const request = createMockRequestWithError(new SyntaxError('Invalid JSON'));
      const result = await parseJsonObjectBody(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Invalid JSON in request body');
      }
    });
  });
});

describe('isPlainObject', () => {
  describe('positive cases', () => {
    it('should return true for plain object', () => {
      expect(isPlainObject({})).toBe(true);
    });

    it('should return true for object with properties', () => {
      expect(isPlainObject({ name: 'test', value: 123 })).toBe(true);
    });

    it('should return true for nested object', () => {
      expect(isPlainObject({ nested: { deep: true } })).toBe(true);
    });

    it('should return true for object created with Object.create(null)', () => {
      expect(isPlainObject(Object.create(null))).toBe(true);
    });
  });

  describe('negative cases', () => {
    it('should return false for null', () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPlainObject(undefined)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
    });

    it('should return false for string', () => {
      expect(isPlainObject('hello')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isPlainObject(42)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isPlainObject(true)).toBe(false);
      expect(isPlainObject(false)).toBe(false);
    });

    it('should return false for function', () => {
      expect(isPlainObject(() => {})).toBe(false);
    });

    // Note: Date, RegExp, Map, Set are technically objects but JSON.parse
    // never produces these types, so isPlainObject treats them as valid objects.
    // This is intentional since we only use this for JSON body validation.
  });
});

describe('JSON parse error handling - REST semantics', () => {
  it('should return 400 (not 500) for malformed JSON in POST request', async () => {
    // This test verifies the core fix: malformed JSON should return 400, not 500
    const request = createMockRequestWithError(new SyntaxError('Unexpected token'));
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      // This is the key assertion: 400 for client errors, not 500
      expect(result.error.status).toBe(400);
    }
  });

  it('should provide helpful error message for malformed JSON', async () => {
    const request = createMockRequestWithError(new SyntaxError('Unexpected end of JSON input'));
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.error.json();
      expect(body.error).toContain('JSON');
    }
  });
});

describe('edge cases', () => {
  it('should handle JSON with unicode characters', async () => {
    const request = createMockRequest('{"name":"测试","emoji":"🎉"}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: '测试', emoji: '🎉' });
    }
  });

  it('should handle JSON with special characters', async () => {
    const request = createMockRequest('{"text":"line1\\nline2\\ttab"}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { text: string }).text).toBe('line1\nline2\ttab');
    }
  });

  it('should handle large JSON numbers', async () => {
    const request = createMockRequest('{"bigNum":9007199254740991}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { bigNum: number }).bigNum).toBe(9007199254740991);
    }
  });

  it('should handle JSON with deeply nested structure', async () => {
    const deepNested = { level1: { level2: { level3: { level4: { value: 'deep' } } } } };
    const request = createMockRequest(JSON.stringify(deepNested));
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(deepNested);
    }
  });
});

describe('security considerations', () => {
  it('should not expose internal error details', async () => {
    const request = createMockRequestWithError(new SyntaxError('Very specific internal error at line 42'));
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.error.json();
      // Should return generic message, not the specific internal error
      expect(body.error).toBe('Invalid JSON in request body');
      expect(body.error).not.toContain('line 42');
    }
  });

  it('should handle prototype pollution attempts in JSON', async () => {
    // This JSON attempts prototype pollution
    const request = createMockRequest('{"__proto__":{"polluted":true}}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(true);
    // Verify that the global Object prototype is not polluted
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});
