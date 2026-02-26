import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { parseJsonBody, parseJsonObjectBody } from '@/lib/api-utils';

// Helper to create a mock request with a body
function createMockRequest(body: string): NextRequest {
  return {
    json: async () => JSON.parse(body),
    headers: new Headers({ 'Content-Type': 'application/json' }),
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

describe('parseJsonBody - Additional Edge Cases', () => {
  describe('Unicode handling', () => {
    it('should handle Chinese characters', async () => {
      const request = createMockRequest('{"name":"你好世界"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { name: string }).name).toBe('你好世界');
      }
    });

    it('should handle Japanese characters', async () => {
      const request = createMockRequest('{"name":"こんにちは"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { name: string }).name).toBe('こんにちは');
      }
    });

    it('should handle Arabic characters', async () => {
      const request = createMockRequest('{"name":"مرحبا"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { name: string }).name).toBe('مرحبا');
      }
    });

    it('should handle emoji', async () => {
      const request = createMockRequest('{"emoji":"🎉🎊🎈"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { emoji: string }).emoji).toBe('🎉🎊🎈');
      }
    });

    it('should handle mixed unicode and ASCII', async () => {
      const request = createMockRequest('{"text":"Hello 世界 🌍"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { text: string }).text).toBe('Hello 世界 🌍');
      }
    });
  });

  describe('Escape sequences', () => {
    it('should handle newlines', async () => {
      const request = createMockRequest('{"text":"line1\\nline2"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { text: string }).text).toBe('line1\nline2');
      }
    });

    it('should handle tabs', async () => {
      const request = createMockRequest('{"text":"col1\\tcol2"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { text: string }).text).toBe('col1\tcol2');
      }
    });

    it('should handle carriage returns', async () => {
      const request = createMockRequest('{"text":"line1\\rline2"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { text: string }).text).toBe('line1\rline2');
      }
    });

    it('should handle backslashes', async () => {
      const request = createMockRequest('{"path":"C:\\\\Users\\\\test"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { path: string }).path).toBe('C:\\Users\\test');
      }
    });

    it('should handle quotes', async () => {
      const request = createMockRequest('{"quote":"He said \\"hello\\""}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { quote: string }).quote).toBe('He said "hello"');
      }
    });

    it('should handle unicode escape sequences', async () => {
      const request = createMockRequest('{"char":"\\u0041"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { char: string }).char).toBe('A');
      }
    });
  });

  describe('Number handling', () => {
    it('should handle integers', async () => {
      const request = createMockRequest('{"num":42}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { num: number }).num).toBe(42);
      }
    });

    it('should handle negative integers', async () => {
      const request = createMockRequest('{"num":-42}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { num: number }).num).toBe(-42);
      }
    });

    it('should handle floats', async () => {
      const request = createMockRequest('{"num":3.14159}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { num: number }).num).toBeCloseTo(3.14159);
      }
    });

    it('should handle scientific notation', async () => {
      const request = createMockRequest('{"num":1.5e10}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { num: number }).num).toBe(1.5e10);
      }
    });

    it('should handle negative scientific notation', async () => {
      const request = createMockRequest('{"num":2.5e-5}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { num: number }).num).toBeCloseTo(0.000025);
      }
    });

    it('should handle zero', async () => {
      const request = createMockRequest('{"num":0}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { num: number }).num).toBe(0);
      }
    });

    it('should handle MAX_SAFE_INTEGER', async () => {
      const request = createMockRequest(`{"num":${Number.MAX_SAFE_INTEGER}}`);
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { num: number }).num).toBe(Number.MAX_SAFE_INTEGER);
      }
    });
  });

  describe('Array handling', () => {
    it('should handle empty array', async () => {
      const request = createMockRequest('[]');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should handle array of numbers', async () => {
      const request = createMockRequest('[1,2,3,4,5]');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it('should handle array of strings', async () => {
      const request = createMockRequest('["a","b","c"]');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['a', 'b', 'c']);
      }
    });

    it('should handle array of mixed types', async () => {
      const request = createMockRequest('[1,"two",true,null]');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 'two', true, null]);
      }
    });

    it('should handle nested arrays', async () => {
      const request = createMockRequest('[[1,2],[3,4]]');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([[1, 2], [3, 4]]);
      }
    });

    it('should handle array of objects', async () => {
      const request = createMockRequest('[{"a":1},{"b":2}]');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([{ a: 1 }, { b: 2 }]);
      }
    });
  });

  describe('Object handling', () => {
    it('should handle empty object', async () => {
      const request = createMockRequest('{}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it('should handle object with various value types', async () => {
      const request = createMockRequest('{"str":"hello","num":42,"bool":true,"null":null}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          str: 'hello',
          num: 42,
          bool: true,
          null: null,
        });
      }
    });

    it('should handle deeply nested object', async () => {
      const deep = { a: { b: { c: { d: { e: 'deep' } } } } };
      const request = createMockRequest(JSON.stringify(deep));
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(deep);
      }
    });

    it('should handle object with array values', async () => {
      const request = createMockRequest('{"arr":[1,2,3]}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { arr: number[] }).arr).toEqual([1, 2, 3]);
      }
    });

    it('should handle object with special key names', async () => {
      const request = createMockRequest('{"":"empty","123":"numeric","key-with-dash":"dash"}');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, string>;
        expect(data['']).toBe('empty');
        expect(data['123']).toBe('numeric');
        expect(data['key-with-dash']).toBe('dash');
      }
    });
  });

  describe('Boolean and null handling', () => {
    it('should handle true', async () => {
      const request = createMockRequest('true');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should handle false', async () => {
      const request = createMockRequest('false');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should handle null', async () => {
      const request = createMockRequest('null');
      const result = await parseJsonBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });
  });

  describe('Error types', () => {
    it('should handle SyntaxError', async () => {
      const request = createMockRequestWithError(new SyntaxError('Invalid JSON'));
      const result = await parseJsonBody(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it('should handle TypeError with "body" in message', async () => {
      const request = createMockRequestWithError(new TypeError('body is null'));
      const result = await parseJsonBody(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Request body is required');
      }
    });

    it('should handle generic Error', async () => {
      const request = createMockRequestWithError(new Error('Unknown error'));
      const result = await parseJsonBody(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe('Failed to parse request body');
      }
    });
  });
});

describe('parseJsonObjectBody - Additional Edge Cases', () => {
  it('should reject primitive values', async () => {
    const primitives = ['42', '"string"', 'true', 'false', 'null'];

    for (const primitive of primitives) {
      const request = createMockRequest(primitive);
      const result = await parseJsonObjectBody(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    }
  });

  it('should accept valid objects', async () => {
    const request = createMockRequest('{"key":"value"}');
    const result = await parseJsonObjectBody(request);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key).toBe('value');
    }
  });

  it('should reject arrays', async () => {
    const request = createMockRequest('[1,2,3]');
    const result = await parseJsonObjectBody(request);
    expect(result.success).toBe(false);
  });
});
