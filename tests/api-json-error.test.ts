import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules before importing the routes
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bHRFProfile: { findUnique: vi.fn() },
    bHPProfile: { findUnique: vi.fn() },
    facility: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    employee: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    intake: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    aSAMAssessment: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    message: { create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    document: { create: vi.fn(), findMany: vi.fn() },
    intakeMedication: { createMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn((callback) => callback({
      intake: { create: vi.fn(), update: vi.fn() },
      intakeMedication: { deleteMany: vi.fn(), createMany: vi.fn() },
    })),
  },
}));

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  AuditActions: {
    EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
    EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
    FACILITY_CREATED: 'FACILITY_CREATED',
    INTAKE_DRAFT_SAVED: 'INTAKE_DRAFT_SAVED',
    INTAKE_SUBMITTED: 'INTAKE_SUBMITTED',
    MESSAGE_SENT: 'MESSAGE_SENT',
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_REQUESTED: 'DOCUMENT_REQUESTED',
    ASAM_DRAFT_SAVED: 'ASAM_DRAFT_SAVED',
    ASAM_SUBMITTED: 'ASAM_SUBMITTED',
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Helper to create a mock request with invalid JSON
function createInvalidJsonRequest(
  url: string,
  method: string = 'POST'
): NextRequest {
  return {
    url,
    method,
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as NextRequest;
}

// Helper to create a mock request with valid JSON
function createValidJsonRequest(
  url: string,
  body: unknown,
  method: string = 'POST'
): NextRequest {
  return {
    url,
    method,
    json: async () => body,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as NextRequest;
}

// Helper to create a mock request with empty body
function createEmptyBodyRequest(
  url: string,
  method: string = 'POST'
): NextRequest {
  return {
    url,
    method,
    json: async () => {
      throw new TypeError('body is null');
    },
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as NextRequest;
}

describe('API Endpoints - JSON Parse Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated session by default
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'BHRF', name: 'Test User' },
    } as any);
  });

  describe('Employees API', () => {
    it('should return 400 for malformed JSON in POST /api/employees', async () => {
      const { POST } = await import('@/app/api/employees/route');

      vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        facilityId: 'facility-1',
        userId: 'user-1',
      } as any);

      const request = createInvalidJsonRequest('http://localhost/api/employees');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });

    it('should return 400 for empty body in POST /api/employees', async () => {
      const { POST } = await import('@/app/api/employees/route');

      vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        facilityId: 'facility-1',
        userId: 'user-1',
      } as any);

      const request = createEmptyBodyRequest('http://localhost/api/employees');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should process valid JSON in POST /api/employees', async () => {
      const { POST } = await import('@/app/api/employees/route');

      vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        facilityId: 'facility-1',
        userId: 'user-1',
      } as any);

      vi.mocked(prisma.employee.create).mockResolvedValue({
        id: 'emp-1',
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      const request = createValidJsonRequest('http://localhost/api/employees', {
        firstName: 'John',
        lastName: 'Doe',
        role: 'Staff',
      });
      const response = await POST(request);

      // Should proceed past JSON parsing (may fail on validation, but not on JSON)
      // If it fails on JSON parsing, it would be 400 with "Invalid JSON"
      const body = await response.json();
      if (response.status === 400) {
        expect(body.error).not.toContain('JSON');
      }
    });
  });

  describe('Facilities API', () => {
    it('should return 400 for malformed JSON in POST /api/facilities', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP', name: 'Test BHP' },
      } as any);

      const { POST } = await import('@/app/api/facilities/route');

      vi.mocked(prisma.bHPProfile.findUnique).mockResolvedValue({
        id: 'bhp-1',
        userId: 'user-1',
      } as any);

      const request = createInvalidJsonRequest('http://localhost/api/facilities');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });

    it('should return 400 for empty body in POST /api/facilities', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP', name: 'Test BHP' },
      } as any);

      const { POST } = await import('@/app/api/facilities/route');

      vi.mocked(prisma.bHPProfile.findUnique).mockResolvedValue({
        id: 'bhp-1',
        userId: 'user-1',
      } as any);

      const request = createEmptyBodyRequest('http://localhost/api/facilities');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Messages API', () => {
    it('should return 400 for malformed JSON in POST /api/messages', async () => {
      const { POST } = await import('@/app/api/messages/route');

      const request = createInvalidJsonRequest('http://localhost/api/messages');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });
  });

  describe('Documents API', () => {
    it('should return 400 for malformed JSON in POST /api/documents', async () => {
      const { POST } = await import('@/app/api/documents/route');

      const request = createInvalidJsonRequest('http://localhost/api/documents');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });
  });

  describe('Intakes API', () => {
    it('should return 400 for malformed JSON in POST /api/intakes', async () => {
      const { POST } = await import('@/app/api/intakes/route');

      vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        facilityId: 'facility-1',
        userId: 'user-1',
      } as any);

      const request = createInvalidJsonRequest('http://localhost/api/intakes');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });

    it('should return 400 for empty body in POST /api/intakes', async () => {
      const { POST } = await import('@/app/api/intakes/route');

      vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        facilityId: 'facility-1',
        userId: 'user-1',
      } as any);

      const request = createEmptyBodyRequest('http://localhost/api/intakes');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('ASAM API', () => {
    it('should return 400 for malformed JSON in POST /api/asam', async () => {
      const { POST } = await import('@/app/api/asam/route');

      vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        facilityId: 'facility-1',
        userId: 'user-1',
      } as any);

      const request = createInvalidJsonRequest('http://localhost/api/asam');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });

    it('should return 400 for empty body in POST /api/asam', async () => {
      const { POST } = await import('@/app/api/asam/route');

      vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        facilityId: 'facility-1',
        userId: 'user-1',
      } as any);

      const request = createEmptyBodyRequest('http://localhost/api/asam');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Messages Read API', () => {
    it('should return 400 for malformed JSON in POST /api/messages/read', async () => {
      const { POST } = await import('@/app/api/messages/read/route');

      const request = createInvalidJsonRequest('http://localhost/api/messages/read');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });
  });

  describe('Notifications Read API', () => {
    it('should return 400 for malformed JSON in POST /api/notifications/read', async () => {
      const { POST } = await import('@/app/api/notifications/read/route');

      const request = createInvalidJsonRequest('http://localhost/api/notifications/read');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });
  });

  describe('Auth Register API', () => {
    it('should return 400 for malformed JSON in POST /api/auth/register', async () => {
      // No session needed for registration
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/register/route');

      const request = createInvalidJsonRequest('http://localhost/api/auth/register');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });

    it('should return 400 for empty body in POST /api/auth/register', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/auth/register/route');

      const request = createEmptyBodyRequest('http://localhost/api/auth/register');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('MFA Verify API', () => {
    it('should return 400 for malformed JSON in POST /api/auth/mfa/verify', async () => {
      const { POST } = await import('@/app/api/auth/mfa/verify/route');

      const request = createInvalidJsonRequest('http://localhost/api/auth/mfa/verify');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    });
  });
});

describe('Error Message Quality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'BHRF', name: 'Test User' },
    } as any);
  });

  it('should return user-friendly error message for malformed JSON', async () => {
    const { POST } = await import('@/app/api/employees/route');

    vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      facilityId: 'facility-1',
      userId: 'user-1',
    } as any);

    const request = createInvalidJsonRequest('http://localhost/api/employees');
    const response = await POST(request);

    const body = await response.json();
    // Error message should be user-friendly, not a stack trace
    expect(body.error).toBe('Invalid JSON in request body');
    expect(body.error).not.toContain('Unexpected token');
  });

  it('should return user-friendly error message for empty body', async () => {
    const { POST } = await import('@/app/api/employees/route');

    vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      facilityId: 'facility-1',
      userId: 'user-1',
    } as any);

    const request = createEmptyBodyRequest('http://localhost/api/employees');
    const response = await POST(request);

    const body = await response.json();
    expect(body.error).toBe('Request body is required');
  });
});

describe('HTTP Status Code Semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'BHRF', name: 'Test User' },
    } as any);
  });

  it('should return 400 (client error) not 500 (server error) for malformed JSON', async () => {
    const { POST } = await import('@/app/api/employees/route');

    vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      facilityId: 'facility-1',
      userId: 'user-1',
    } as any);

    const request = createInvalidJsonRequest('http://localhost/api/employees');
    const response = await POST(request);

    // This is the key assertion - malformed JSON should be a 400 client error
    expect(response.status).toBe(400);
    expect(response.status).not.toBe(500);
  });

  it('should differentiate JSON errors from validation errors', async () => {
    const { POST } = await import('@/app/api/employees/route');

    vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      facilityId: 'facility-1',
      userId: 'user-1',
    } as any);

    // Test malformed JSON
    const malformedRequest = createInvalidJsonRequest('http://localhost/api/employees');
    const malformedResponse = await POST(malformedRequest);
    const malformedBody = await malformedResponse.json();

    // Test valid JSON but invalid data
    const invalidDataRequest = createValidJsonRequest('http://localhost/api/employees', {
      // Missing required fields
    });
    const invalidDataResponse = await POST(invalidDataRequest);
    const invalidDataBody = await invalidDataResponse.json();

    // Both should be 400, but with different error messages
    expect(malformedResponse.status).toBe(400);
    expect(invalidDataResponse.status).toBe(400);
    expect(malformedBody.error).toContain('JSON');
    expect(invalidDataBody.error).not.toContain('JSON');
  });
});

describe('Various Malformed JSON Patterns', () => {
  const createRequestWithErrorType = (errorMessage: string): NextRequest => ({
    url: 'http://localhost/api/employees',
    method: 'POST',
    json: async () => {
      throw new SyntaxError(errorMessage);
    },
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as NextRequest);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'BHRF', name: 'Test User' },
    } as any);
    vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      facilityId: 'facility-1',
      userId: 'user-1',
    } as any);
  });

  it('should handle "Unexpected end of JSON input"', async () => {
    const { POST } = await import('@/app/api/employees/route');
    const request = createRequestWithErrorType('Unexpected end of JSON input');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should handle "Unexpected token < in JSON at position 0"', async () => {
    const { POST } = await import('@/app/api/employees/route');
    const request = createRequestWithErrorType('Unexpected token < in JSON at position 0');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should handle "Unexpected string in JSON at position 10"', async () => {
    const { POST } = await import('@/app/api/employees/route');
    const request = createRequestWithErrorType('Unexpected string in JSON at position 10');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should handle "Unexpected number in JSON at position 5"', async () => {
    const { POST } = await import('@/app/api/employees/route');
    const request = createRequestWithErrorType('Unexpected number in JSON at position 5');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should handle "Expected property name or \'}\' in JSON at position 2"', async () => {
    const { POST } = await import('@/app/api/employees/route');
    const request = createRequestWithErrorType("Expected property name or '}' in JSON at position 2");
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('Concurrent JSON Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', role: 'BHRF', name: 'Test User' },
    } as any);
    vi.mocked(prisma.bHRFProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      facilityId: 'facility-1',
      userId: 'user-1',
    } as any);
  });

  it('should handle multiple concurrent requests with malformed JSON', async () => {
    const { POST } = await import('@/app/api/employees/route');

    const requests = Array(5).fill(null).map(() =>
      createInvalidJsonRequest('http://localhost/api/employees')
    );

    const responses = await Promise.all(requests.map(req => POST(req)));

    for (const response of responses) {
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('JSON');
    }
  });

  it('should handle mixed valid and invalid JSON requests', async () => {
    const { POST } = await import('@/app/api/employees/route');

    vi.mocked(prisma.employee.create).mockResolvedValue({
      id: 'emp-1',
      firstName: 'John',
      lastName: 'Doe',
    } as any);

    const validRequest = createValidJsonRequest('http://localhost/api/employees', {
      firstName: 'John',
      lastName: 'Doe',
      role: 'Staff',
    });
    const invalidRequest = createInvalidJsonRequest('http://localhost/api/employees');

    const [validResponse, invalidResponse] = await Promise.all([
      POST(validRequest),
      POST(invalidRequest),
    ]);

    // Invalid JSON should be 400
    expect(invalidResponse.status).toBe(400);
    const invalidBody = await invalidResponse.json();
    expect(invalidBody.error).toContain('JSON');

    // Valid JSON should proceed (may succeed or fail on validation)
    const validBody = await validResponse.json();
    if (validResponse.status === 400) {
      expect(validBody.error).not.toContain('JSON');
    }
  });
});
